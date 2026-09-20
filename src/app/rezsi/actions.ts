"use server";

import { revalidatePath } from "next/cache";
import { datum as datumSzoveg } from "@/domain/penz";
import { elszamolastOsszeallit } from "@/lib/rezsi";
import { prisma } from "@/lib/db";
import { belepettFelhasznalo, kotelezoSzerep } from "@/lib/munkamenet";

export type Eredmeny = { allapot: "ures" | "kesz" | "hiba"; uzenet: string; hibak: string[] };


function hiba(uzenet: string, hibak: string[] = []): Eredmeny {
  return { allapot: "hiba", uzenet, hibak };
}

function napotOlvas(nyers: unknown): Date | null {
  const szoveg = String(nyers ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(szoveg)) return null;
  const nap = new Date(`${szoveg}T00:00:00.000Z`);
  return Number.isNaN(nap.getTime()) ? null : nap;
}

function szamotOlvas(nyers: unknown): number | null {
  const szoveg = String(nyers ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (szoveg === "") return null;
  const szam = Number(szoveg);
  return Number.isFinite(szam) && szam >= 0 ? szam : null;
}

/** Óraállást a bérbeadó és a bérlő is rögzíthet, de csak a saját ingatlanához. */
export async function oraallastRogzit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return hiba("Lépj be a rögzítéshez.");

  const merooraId = String(urlap.get("merooraId") ?? "");
  const nap = napotOlvas(urlap.get("datum"));
  const ertek = szamotOlvas(urlap.get("ertek"));

  if (!nap) return hiba("Adj meg egy dátumot.");
  if (ertek === null) return hiba("Az óraállás csak nem negatív szám lehet.");

  const meroora = await prisma.meroora.findFirst({
    where: {
      id: merooraId,
      ingatlan:
        felhasznalo.szerep === "berbeado"
          ? { tulajdonosId: felhasznalo.id }
          : { jogviszonyok: { some: { berloId: felhasznalo.id } } },
    },
    include: { oraallasok: { orderBy: { datum: "desc" }, take: 1 } },
  });
  if (!meroora) return hiba("Ehhez a mérőórához nincs jogosultságod.");

  const utolso = meroora.oraallasok[0];
  if (utolso && ertek < utolso.ertek) {
    return hiba(
      `A legutóbbi állás ${utolso.ertek} volt (${datumSzoveg(utolso.datum)}). ` +
        "Ennél kisebb értéket nem rögzítek: nézd meg még egyszer a számokat.",
    );
  }

  await prisma.oraallas.create({
    data: { merooraId: meroora.id, datum: nap, ertek, rogzitoId: felhasznalo.id },
  });

  revalidatePath("/rezsi");
  revalidatePath("/berlo");

  return { allapot: "kesz", uzenet: "Óraállás rögzítve.", hibak: [] };
}

/** Tervezet készítése: kiszámolja a tételeket, és elmenti, de még nem adja ki. */
export async function elszamolastKeszitAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");

  const jogviszonyId = String(urlap.get("jogviszonyId") ?? "");
  const kezdete = napotOlvas(urlap.get("kezdete"));
  const vege = napotOlvas(urlap.get("vege"));

  if (!kezdete || !vege) return hiba("Adj meg egy kezdő és egy záró napot.");
  if (vege.getTime() <= kezdete.getTime()) {
    return hiba("A záró nap legyen későbbi a kezdőnél.");
  }

  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId: berbeado.id } },
  });
  if (!jogviszony) return hiba("Ez a jogviszony nem a tiéd.");

  const osszeallitas = await elszamolastOsszeallit(jogviszonyId, kezdete, vege);
  if (osszeallitas.tetelek.length === 0) {
    return hiba("Ebből az időszakból nem jött ki egyetlen tétel sem.", osszeallitas.kihagyott);
  }

  await prisma.elszamolas.create({
    data: {
      jogviszonyId,
      idoszakKezdete: kezdete,
      idoszakVege: vege,
      osszegFt: osszeallitas.osszegFt,
      tetelek: {
        create: osszeallitas.tetelek.map((tetel, sorszam) => ({
          merooraId: tetel.merooraId,
          fajta: tetel.fajta,
          megnevezes: tetel.megnevezes,
          mennyiseg: tetel.mennyiseg,
          mertekegyseg: tetel.mertekegyseg,
          reszletezes: tetel.reszletezes,
          osszegFt: tetel.osszegFt,
          sorrend: sorszam,
        })),
      },
    },
  });

  revalidatePath("/rezsi");

  return {
    allapot: "kesz",
    uzenet: "Elkészült a tervezet. Nézd át, és ha rendben van, add ki a bérlőnek.",
    hibak: osszeallitas.kihagyott,
  };
}

/**
 * Kiadás: az elszámolásból előírt tétel lesz, így ugyanúgy végigmegy a
 * befizetés-egyeztetésen, mint a bérleti díj.
 */
export async function elszamolastKiad(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");

  const elszamolasId = String(urlap.get("elszamolasId") ?? "");
  const esedekesseg = napotOlvas(urlap.get("esedekesseg"));
  if (!esedekesseg) return hiba("Adj meg egy fizetési határidőt.");

  const elszamolas = await prisma.elszamolas.findFirst({
    where: {
      id: elszamolasId,
      allapot: "tervezet",
      jogviszony: { ingatlan: { tulajdonosId: berbeado.id } },
    },
  });
  if (!elszamolas) return hiba("Ez az elszámolás nem adható ki.");

  const idoszak = await szabadIdoszakJel(elszamolas.jogviszonyId, elszamolas.idoszakVege);

  const eloirtTetel = await prisma.eloirtTetel.create({
    data: {
      jogviszonyId: elszamolas.jogviszonyId,
      tipus: "rezsi",
      idoszak,
      esedekesseg,
      osszegFt: elszamolas.osszegFt,
    },
  });

  await prisma.elszamolas.update({
    where: { id: elszamolas.id },
    data: { allapot: "kiadva", kiadva: new Date(), eloirtTetelId: eloirtTetel.id },
  });

  revalidatePath("/rezsi");
  revalidatePath("/berlo");
  revalidatePath("/befizetesek");
  revalidatePath("/");

  return {
    allapot: "kesz",
    uzenet: `Kiadva. A bérlő látja a tételeket, és a befizetése a ${datumSzoveg(esedekesseg)}-i határidőhöz párosul.`,
    hibak: [],
  };
}

/** Az előírt tétel időszakjele jogviszonyonként egyedi, ezért ütközésnél sorszámozunk. */
async function szabadIdoszakJel(jogviszonyId: string, idoszakVege: Date): Promise<string> {
  const alap = `${idoszakVege.getUTCFullYear()}-${String(idoszakVege.getUTCMonth() + 1).padStart(2, "0")}`;
  for (let sorszam = 1; sorszam < 50; sorszam++) {
    const jel = sorszam === 1 ? alap : `${alap}/${sorszam}`;
    const letezo = await prisma.eloirtTetel.findFirst({
      where: { jogviszonyId, tipus: "rezsi", idoszak: jel },
    });
    if (!letezo) return jel;
  }
  return `${alap}/${Date.now()}`;
}

/** A bérlő elfogadja vagy vitatja az elszámolást. Ez a "ellenőrizhető" lényege. */
export async function elszamolastElbiral(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berlo = await kotelezoSzerep("berlo");

  const elszamolasId = String(urlap.get("elszamolasId") ?? "");
  const dontes = String(urlap.get("dontes") ?? "");
  const uzenet = String(urlap.get("berloiUzenet") ?? "").trim();

  if (dontes !== "elfogadva" && dontes !== "vitatott") return hiba("Ismeretlen döntés.");
  if (dontes === "vitatott" && uzenet === "") {
    return hiba("Írd le, melyik tétellel van baj: ebből tud a bérbeadó javítani.");
  }

  const elszamolas = await prisma.elszamolas.findFirst({
    where: { id: elszamolasId, allapot: "kiadva", jogviszony: { berloId: berlo.id } },
  });
  if (!elszamolas) return hiba("Ez az elszámolás nem a tiéd, vagy már lezárult.");

  await prisma.elszamolas.update({
    where: { id: elszamolas.id },
    data: {
      allapot: dontes,
      berloiUzenet: dontes === "vitatott" ? uzenet : null,
      lezarva: new Date(),
    },
  });

  revalidatePath("/berlo");
  revalidatePath("/rezsi");

  return {
    allapot: "kesz",
    uzenet:
      dontes === "elfogadva"
        ? "Elfogadtad az elszámolást."
        : "Jeleztem a bérbeadónak, hogy vitatod. Az üzeneted is látja.",
    hibak: [],
  };
}
