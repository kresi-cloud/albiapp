/**
 * Rezsielszámolás.
 *
 * A magyar lakossági rezsi két sávban működik: egy éves mennyiségig
 * kedvezményes ár, fölötte piaci ár. Ezt az elszámolásnak tudnia kell, különben
 * a bérlő vagy túl sokat fizet, vagy a bérbeadón marad a különbözet.
 *
 * Két szabály végig érvényes:
 *  - az egységár fillérben, egészben számol, és csak a tétel végén kerekítünk
 *    forintra, mert a rezsiárak nem kerek forintok;
 *  - az éves keret az elszámolt napokra arányosítva jár, nem egészben.
 */

import { napKulonbseg } from "./penz";

export type Dijszabas = {
  kedvezmenyesArFiller: number;
  piaciArFiller: number;
  /** Egység/év. Null: nincs sáv, minden egység a kedvezményes áron megy. */
  evesKeret: number | null;
  /** Havi alapdíj forintban. Az elszámolt napokra arányosítjuk. */
  alapdijFt: number;
};

export type Oraallas = { datum: Date; ertek: number };

export type MerooraElszamolas = {
  fogyasztas: number;
  kedvezmenyesEgyseg: number;
  piaciEgyseg: number;
  keretAzIdoszakra: number | null;
  osszegFt: number;
  alapdijReszFt: number;
  reszletezes: string;
};

/** Az év hossza a keret arányosításához. Szökőévvel nem számolunk: a különbség
 * egy hónapos elszámoláson néhány tized egység, a szabály viszont így érthető. */
export const EV_NAPJAI = 365;

export function fogyasztas(elozo: Oraallas, jelenlegi: Oraallas): number {
  return jelenlegi.ertek - elozo.ertek;
}

/** A keret az elszámolt napokra arányosítva jár. */
export function keretAzIdoszakra(evesKeret: number | null, napok: number): number | null {
  if (evesKeret === null) return null;
  return (evesKeret * napok) / EV_NAPJAI;
}

/** Havi alapdíj napra bontva, a teljes éves díjból számolva. */
export function alapdijResz(alapdijFt: number, napok: number): number {
  return Math.round((alapdijFt * 12 * napok) / EV_NAPJAI);
}

function egesz(szam: number): string {
  return new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 2 }).format(szam);
}

function forintSzoveg(osszegFt: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(osszegFt)} Ft`;
}

function arSzoveg(arFiller: number): string {
  return `${egesz(arFiller / 100)} Ft`;
}

/**
 * Egy mérőóra elszámolása két óraállás között.
 *
 * Visszafelé forgó óra vagy cserélt óra esetén a fogyasztás negatív lenne;
 * ilyenkor nullát számolunk, és a részletezés kimondja, hogy ezt nézze meg valaki.
 */
export function merooratElszamol(
  elozo: Oraallas,
  jelenlegi: Oraallas,
  dijszabas: Dijszabas,
  mertekegyseg: string,
): MerooraElszamolas {
  const napok = Math.max(0, napKulonbseg(elozo.datum, jelenlegi.datum));
  const nyersFogyasztas = fogyasztas(elozo, jelenlegi);
  const alapdijReszFt = alapdijResz(dijszabas.alapdijFt, napok);

  if (nyersFogyasztas < 0) {
    return {
      fogyasztas: 0,
      kedvezmenyesEgyseg: 0,
      piaciEgyseg: 0,
      keretAzIdoszakra: keretAzIdoszakra(dijszabas.evesKeret, napok),
      osszegFt: alapdijReszFt,
      alapdijReszFt,
      reszletezes:
        `A záró óraállás (${egesz(jelenlegi.ertek)}) kisebb a nyitónál (${egesz(elozo.ertek)}), ` +
        "ezért fogyasztást nem számoltam. Nézd meg az óraállásokat.",
    };
  }

  const keret = keretAzIdoszakra(dijszabas.evesKeret, napok);
  const kedvezmenyesEgyseg = keret === null ? nyersFogyasztas : Math.min(nyersFogyasztas, keret);
  const piaciEgyseg = nyersFogyasztas - kedvezmenyesEgyseg;

  const fogyasztasFiller =
    kedvezmenyesEgyseg * dijszabas.kedvezmenyesArFiller + piaciEgyseg * dijszabas.piaciArFiller;
  const fogyasztasFt = Math.round(fogyasztasFiller / 100);

  const reszek = [
    `${egesz(elozo.ertek)} → ${egesz(jelenlegi.ertek)} ${mertekegyseg}, ${napok} nap.`,
  ];

  if (piaciEgyseg > 0) {
    reszek.push(
      `Ebből ${egesz(kedvezmenyesEgyseg)} ${mertekegyseg} kedvezményes áron ` +
        `(${arSzoveg(dijszabas.kedvezmenyesArFiller)}/${mertekegyseg}), a keret erre az időszakra ` +
        `${egesz(keret ?? 0)} ${mertekegyseg}.`,
      `A keret fölötti ${egesz(piaciEgyseg)} ${mertekegyseg} piaci áron ` +
        `(${arSzoveg(dijszabas.piaciArFiller)}/${mertekegyseg}).`,
    );
  } else {
    reszek.push(
      `Mind a kedvezményes sávban (${arSzoveg(dijszabas.kedvezmenyesArFiller)}/${mertekegyseg})` +
        (keret === null ? "." : `, a keret erre az időszakra ${egesz(keret)} ${mertekegyseg}.`),
    );
  }

  if (alapdijReszFt > 0) {
    reszek.push(`Alapdíj ${napok} napra: ${forintSzoveg(alapdijReszFt)}.`);
  }

  return {
    fogyasztas: nyersFogyasztas,
    kedvezmenyesEgyseg,
    piaciEgyseg,
    keretAzIdoszakra: keret,
    osszegFt: fogyasztasFt + alapdijReszFt,
    alapdijReszFt,
    reszletezes: reszek.join(" "),
  };
}

export type Tetel = {
  fajta: "meroora" | "alapdij" | "atalany" | "kozos_koltseg";
  megnevezes: string;
  mennyiseg: number | null;
  mertekegyseg: string | null;
  reszletezes: string;
  osszegFt: number;
  merooraId: string | null;
};

export type ElszamolasBemenet = {
  idoszakKezdete: Date;
  idoszakVege: Date;
  meroorak: {
    id: string;
    megnevezes: string;
    mertekegyseg: string;
    dijszabas: Dijszabas;
    nyito: Oraallas;
    zaro: Oraallas;
  }[];
  /** Havi átalány, ha a jogviszony így számol el. */
  atalanyFt?: number;
  /** Havi közös költség, ha a bérlőre hárul. */
  kozosKoltsegFt?: number;
};

export type Elszamolas = { tetelek: Tetel[]; osszegFt: number; napok: number };

/** Havi díj arányosítva az elszámolt napokra. */
function haviResz(haviFt: number, napok: number): number {
  return Math.round((haviFt * 12 * napok) / EV_NAPJAI);
}

/**
 * Az elszámolás összege a kerekített tételek összege, nem a kerekítetlen
 * végösszeg: így a bérlő össze tudja adni a sorokat, és ugyanazt kapja.
 */
export function elszamolastKeszit(bemenet: ElszamolasBemenet): Elszamolas {
  const napok = Math.max(0, napKulonbseg(bemenet.idoszakKezdete, bemenet.idoszakVege));
  const tetelek: Tetel[] = [];

  for (const meroora of bemenet.meroorak) {
    const eredmeny = merooratElszamol(
      meroora.nyito,
      meroora.zaro,
      meroora.dijszabas,
      meroora.mertekegyseg,
    );
    tetelek.push({
      fajta: "meroora",
      megnevezes: meroora.megnevezes,
      mennyiseg: eredmeny.fogyasztas,
      mertekegyseg: meroora.mertekegyseg,
      reszletezes: eredmeny.reszletezes,
      osszegFt: eredmeny.osszegFt,
      merooraId: meroora.id,
    });
  }

  if (bemenet.atalanyFt && bemenet.atalanyFt > 0) {
    const osszegFt = haviResz(bemenet.atalanyFt, napok);
    tetelek.push({
      fajta: "atalany",
      megnevezes: "Rezsiátalány",
      mennyiseg: null,
      mertekegyseg: null,
      reszletezes: `${forintSzoveg(bemenet.atalanyFt)} / hó, ${napok} napra arányosítva.`,
      osszegFt,
      merooraId: null,
    });
  }

  if (bemenet.kozosKoltsegFt && bemenet.kozosKoltsegFt > 0) {
    const osszegFt = haviResz(bemenet.kozosKoltsegFt, napok);
    tetelek.push({
      fajta: "kozos_koltseg",
      megnevezes: "Közös költség",
      mennyiseg: null,
      mertekegyseg: null,
      reszletezes: `${forintSzoveg(bemenet.kozosKoltsegFt)} / hó, ${napok} napra arányosítva.`,
      osszegFt,
      merooraId: null,
    });
  }

  return {
    tetelek,
    osszegFt: tetelek.reduce((osszeg, tetel) => osszeg + tetel.osszegFt, 0),
    napok,
  };
}

/** A díjszabásból az, ami az adott napon érvényes volt. */
export function ervenyesDijszabas<T extends { ervenyesTol: Date }>(
  dijszabasok: T[],
  napon: Date,
): T | null {
  const jeloltek = dijszabasok
    .filter((dijszabas) => dijszabas.ervenyesTol.getTime() <= napon.getTime())
    .sort((a, b) => b.ervenyesTol.getTime() - a.ervenyesTol.getTime());
  return jeloltek[0] ?? null;
}
