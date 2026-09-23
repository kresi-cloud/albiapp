"use server";

import { revalidatePath } from "next/cache";
import { elszamolastOsszeallit } from "@/lib/rezsi";
import { prisma } from "@/lib/db";
import { datumNyelven } from "@/domain/nyelv";
import { belepettFelhasznalo, kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

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
  const { sz, nyelv } = await szovegek();
  if (!felhasznalo) return hiba(sz("rezsi.hiba.lepj_be"));

  const merooraId = String(urlap.get("merooraId") ?? "");
  const nap = napotOlvas(urlap.get("datum"));
  const ertek = szamotOlvas(urlap.get("ertek"));

  if (!nap) return hiba(sz("rezsi.hiba.datum"));
  if (ertek === null) return hiba(sz("rezsi.hiba.oraallas_negativ"));

  const meroora = await prisma.meroora.findFirst({
    where: {
      id: merooraId,
      ingatlan:
        felhasznalo.szerep === "berbeado"
          ? { tulajdonosId: felhasznalo.id }
          : // A bérlő csak addig olvas órát, amíg ott lakik. A lezárt
            // jogviszony órái a bérbeadóé és a következő bérlőé: a volt bérlő
            // rögzítése onnantól idegen fogyasztást vinne az elszámolásba, és
            // a záró óraállását is felülírhatná.
            {
              jogviszonyok: {
                some: {
                  statusz: "elo",
                  berlok: { some: { berloId: felhasznalo.id } },
                },
              },
            },
    },
    include: { oraallasok: { orderBy: [{ datum: "desc" }, { id: "desc" }], take: 1 } },
  });
  if (!meroora) return hiba(sz("rezsi.hiba.meroora_nem_tied"));

  const utolso = meroora.oraallasok[0];
  if (utolso && ertek < utolso.ertek) {
    return hiba(
      sz("rezsi.hiba.kisebb_allas", {
        ertek: utolso.ertek,
        nap: datumNyelven(utolso.datum, nyelv),
      }),
    );
  }

  await prisma.oraallas.create({
    data: { merooraId: meroora.id, datum: nap, ertek, rogzitoId: felhasznalo.id },
  });

  revalidatePath("/rezsi");
  revalidatePath("/berlo");

  return { allapot: "kesz", uzenet: sz("rezsi.kesz.oraallas"), hibak: [] };
}

/** Tervezet készítése: kiszámolja a tételeket, és elmenti, de még nem adja ki. */
export async function elszamolastKeszitAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();

  const jogviszonyId = String(urlap.get("jogviszonyId") ?? "");
  const kezdete = napotOlvas(urlap.get("kezdete"));
  const vege = napotOlvas(urlap.get("vege"));

  if (!kezdete || !vege) return hiba(sz("rezsi.hiba.idoszak"));
  if (vege.getTime() <= kezdete.getTime()) {
    return hiba(sz("rezsi.hiba.sorrend"));
  }

  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId: berbeado.id } },
  });
  if (!jogviszony) return hiba(sz("rezsi.hiba.jogviszony_nem_tied"));

  const osszeallitas = await elszamolastOsszeallit(jogviszonyId, kezdete, vege);
  if (osszeallitas.tetelek.length === 0) {
    return hiba(sz("rezsi.hiba.nincs_tetel"), osszeallitas.kihagyott.map(u));
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
    uzenet: sz("rezsi.kesz.tervezet"),
    hibak: osszeallitas.kihagyott.map(u),
  };
}

/**
 * Kiadás: az elszámolásból előírt tétel lesz, így ugyanúgy végigmegy a
 * befizetés-egyeztetésen, mint a bérleti díj.
 */
export async function elszamolastKiad(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, nyelv } = await szovegek();

  const elszamolasId = String(urlap.get("elszamolasId") ?? "");
  const esedekesseg = napotOlvas(urlap.get("esedekesseg"));
  if (!esedekesseg) return hiba(sz("rezsi.hiba.hatarido"));

  const elszamolas = await prisma.elszamolas.findFirst({
    where: {
      id: elszamolasId,
      allapot: "tervezet",
      jogviszony: { ingatlan: { tulajdonosId: berbeado.id } },
    },
  });
  if (!elszamolas) return hiba(sz("rezsi.hiba.nem_kiadhato"));

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
    uzenet: sz("rezsi.kesz.kiadva", { nap: datumNyelven(esedekesseg, nyelv) }),
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
  const { sz } = await szovegek();

  const elszamolasId = String(urlap.get("elszamolasId") ?? "");
  const dontes = String(urlap.get("dontes") ?? "");
  const uzenet = String(urlap.get("berloiUzenet") ?? "").trim();

  if (dontes !== "elfogadva" && dontes !== "vitatott") return hiba(sz("rezsi.hiba.dontes"));
  if (dontes === "vitatott" && uzenet === "") {
    return hiba(sz("rezsi.hiba.vita_uzenet"));
  }

  const elszamolas = await prisma.elszamolas.findFirst({
    where: {
      id: elszamolasId,
      allapot: "kiadva",
      jogviszony: { berlok: { some: { berloId: berlo.id } } },
    },
  });
  if (!elszamolas) return hiba(sz("rezsi.hiba.elszamolas_nem_tied"));

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
    uzenet: sz(dontes === "elfogadva" ? "rezsi.kesz.elfogadva" : "rezsi.kesz.vitatva"),
    hibak: [],
  };
}
