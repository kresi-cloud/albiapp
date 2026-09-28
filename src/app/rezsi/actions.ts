"use server";

import { revalidatePath } from "next/cache";
import { oraallastVisszavon } from "@/lib/meroora";
import { elszamolastOsszeallit } from "@/lib/rezsi";
import { prisma } from "@/lib/db";
import { datumNyelven } from "@/domain/nyelv";
import { meroallastOlvas, napEleje } from "@/domain/penz";
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

/**
 * Óraállás felső korlátja.
 *
 * Nem szépségkérdés. Egy elgépelt vagy szándékos, irreálisan nagy állás két
 * bajt csinált: onnantól minden valódi leolvasás kisebb lett, tehát a
 * kiszolgáló elutasította — a mérő „bebetonozódott" —, az elszámolás pedig
 * egész számot túlcsorduló összeget próbált elmenteni, és 500-zal elszállt.
 * Tízmillió egység minden lakossági mérőnél nagyságrendekkel több, mint ami
 * egy élet alatt átfolyik rajta.
 */
const LEGNAGYOBB_ALLAS = 10_000_000;

/** Egész forint oszlopba ennél több nem megy: a Postgres `Int` felső határa. */
const LEGNAGYOBB_OSSZEG = 2_000_000_000;

function szamotOlvas(nyers: unknown): number | null {
  const szam = meroallastOlvas(String(nyers ?? ""));
  if (szam === null) return null;
  return szam >= 0 && szam <= LEGNAGYOBB_ALLAS ? szam : null;
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
  if (ertek === null) {
    // A kétértelmű alak („23.929": ezres vagy tizedes?) nem negatív szám és
    // nem is üres mező — ilyenkor azt mondjuk meg, amit tényleg tenni kell.
    const nyersAllas = String(urlap.get("ertek") ?? "").trim();
    return hiba(
      nyersAllas === ""
        ? sz("rezsi.hiba.oraallas_negativ")
        : sz("rezsi.hiba.olvashatatlan_allas", { ertek: nyersAllas }),
    );
  }
  // Jövőbeli napra nem lehet leolvasni: azt a számot még senki nem látta.
  if (nap.getTime() > napEleje(new Date()).getTime()) {
    return hiba(sz("rezsi.hiba.jovobeli_allas"));
  }

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
    include: { oraallasok: { orderBy: [{ datum: "asc" }, { id: "asc" }] } },
  });
  if (!meroora) return hiba(sz("rezsi.hiba.meroora_nem_tied"));

  // A leolvasás **mindkét** szomszédjához mérünk, nem csak a legutolsóhoz.
  //
  // Korábban csak az utolsóhoz: így egy visszakeltezett, nagyobb állást a
  // kiszolgáló elfogadott, és az utána következő időszak fogyasztása nullára
  // esett — a bérlő ingyen jutott a rezsihez, és a csatornadíj is elmaradt. Egy
  // jogos utólagos pótlás viszont (amit a két meglévő állás közé kell beírni)
  // elutasításra futott. Az óra egy irányba forog: ami előbb van, az kisebb.
  const elotte = meroora.oraallasok.filter(
    (allas) => allas.datum.getTime() <= nap.getTime(),
  );
  const utana = meroora.oraallasok.filter(
    (allas) => allas.datum.getTime() > nap.getTime(),
  );
  const elozo = elotte[elotte.length - 1];
  const kovetkezo = utana[0];

  if (elozo && ertek < elozo.ertek) {
    return hiba(
      sz("rezsi.hiba.kisebb_allas", {
        ertek: elozo.ertek,
        nap: datumNyelven(elozo.datum, nyelv),
      }),
    );
  }
  if (kovetkezo && ertek > kovetkezo.ertek) {
    return hiba(
      sz("rezsi.hiba.nagyobb_allas", {
        ertek: kovetkezo.ertek,
        nap: datumNyelven(kovetkezo.datum, nyelv),
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

  // Tételes elszámolás csak mérőóra szerinti bérletre készül. Átalánynál és
  // közös költségbe foglalt rezsinél a szerződés kifejezetten kimondja, hogy a
  // felek tételesen nem számolnak el, az összeget pedig a havi előírás viszi:
  // egy itt kiadott elszámolás ugyanazt másodszor terhelné. Ezt a kiszolgáló
  // tartja be, nem az űrlap elrejtése.
  if (jogviszony.rezsiElszamolas !== "almero") {
    return hiba(
      sz("rezsi.hiba.nem_meres", { mod: sz(`rezsi.mod.${jogviszony.rezsiElszamolas}`) }),
    );
  }

  const osszeallitas = await elszamolastOsszeallit(jogviszonyId, kezdete, vege);
  if (osszeallitas.tetelek.length === 0) {
    return hiba(sz("rezsi.hiba.nincs_tetel"), osszeallitas.kihagyott.map(u));
  }
  // Az összeg egész forint oszlopba megy: egy elgépelt óraállásból kijövő
  // csillagászati összeg különben nem hibaüzenet, hanem 500-as lap lenne.
  if (osszeallitas.osszegFt > LEGNAGYOBB_OSSZEG) {
    return hiba(sz("rezsi.hiba.tul_nagy_osszeg"));
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

/**
 * Az előírt tétel időszakjele jogviszonyonként egyedi, ezért ütközésnél
 * sorszámozunk.
 *
 * A jel az **utolsó elszámolt napból** jön, nem a záró dátum hónapjából. Az
 * időszak a kezdőnapot tartalmazza, a záró napot nem: egy szeptember 1-től
 * október 1-ig tartó elszámolás szeptemberről szól, és korábban mégis
 * „2026-10" jelet kapott — októberi sornak látszott az adóösszesítőben és a
 * betekintőben.
 *
 * A sorszámozott jel („2026-09/2") szövegesen nagyobb, mint a hónap maga, ezért
 * aki hónapokat hasonlít, az `idoszakHonapja`-val hasonlítson — a lezárás
 * korábban pont ezért törölte a második elszámolás előírását a kiadott okirat
 * mögül.
 */
async function szabadIdoszakJel(jogviszonyId: string, idoszakVege: Date): Promise<string> {
  const utolsoNap = new Date(napEleje(idoszakVege).getTime() - 24 * 60 * 60 * 1000);
  const alap = `${utolsoNap.getUTCFullYear()}-${String(utolsoNap.getUTCMonth() + 1).padStart(2, "0")}`;
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

/**
 * Óraállás visszavonása.
 *
 * A sajátját mindenki visszavonhatja, a másikét senki — ugyanaz az elv, mint a
 * befizetési nyilatkozatnál. Amire viszont már épül elszámolás, azt nem: a
 * kiadott okirat számai abból a mérésből jöttek, és a bérlő már ki is fizette.
 * Elgépelt állás helyett ilyenkor új leolvasás jön, mai nappal.
 *
 * Eddig egyáltalán nem volt visszavonás: egy elgépelt állás véglegesen bent
 * maradt, és a monoton szabály miatt a mérő használhatatlanná is válhatott.
 */
export async function oraallastVisszavonAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo) return hiba(sz("rezsi.hiba.lepj_be"));

  const eredmeny = await oraallastVisszavon(
    felhasznalo.id,
    String(urlap.get("oraallasId") ?? ""),
  );
  if (eredmeny === "nem_tied") return hiba(sz("meroora.hiba.allas_nem_tied"));
  if (eredmeny === "elszamolt") return hiba(sz("meroora.hiba.allas_elszamolt"));

  revalidatePath("/rezsi");
  revalidatePath("/berlo");
  return { allapot: "kesz", uzenet: sz("meroora.allas_visszavonva"), hibak: [] };
}
