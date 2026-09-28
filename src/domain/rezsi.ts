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

import { napEleje, napKulonbseg, szam } from "./penz";

export type Dijszabas = {
  kedvezmenyesArFiller: number;
  piaciArFiller: number;
  /** Egység/év. Null: nincs sáv, minden egység a kedvezményes áron megy. */
  evesKeret: number | null;
  /** Havi alapdíj forintban. Az elszámolt napokra arányosítjuk. */
  alapdijFt: number;
  /**
   * Csatornadíj egységára fillérben, ugyanarra a mért mennyiségre.
   *
   * A magyar vízszámla két díjat ír ugyanarra a köbméterre: az ivóvízét és a
   * szennyvízelvezetését. Aki csak az egyiket hárítja tovább, az a másikat
   * magán hagyja — a csatornadíj nagyságrendileg akkora, mint a vízdíj, tehát
   * ez nem kerekítési kérdés.
   *
   * Nincs sávja: a víz- és csatornadíj nem a rezsicsökkentés kétsávos
   * rendszerében megy, hanem egy egységáron. A nulla ár nem hiányzó adat,
   * hanem érvényes eset: a locsolási mellékmérőn átfolyt víz nem megy
   * csatornába, és egy emésztőgödrös ingatlanon sincs mit elvezetni.
   */
  csatornaArFiller: number;
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
  /** A csatornadíj összege. Külön tétel lesz belőle, nem a vízdíjba olvad. */
  csatornaFt: number;
  /** Null: ehhez a mérőórához nincs csatornadíj, tehát tétel sem lesz. */
  csatornaReszletezes: string | null;
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

/**
 * Havi díj arányosítása két nap között, **naptári hónapokkal**.
 *
 * Korábban ez `havi * 12 * napok / 365` volt, vagyis minden hónapot 30,42
 * naposnak vett. Ebből az lett, hogy egy teljes hónapra sem a havi díj jött ki:
 * egy tízezres alapdíj szeptember 1-től október 1-ig 9863 Ft, januárban
 * 10 192 Ft, februárban 9205 Ft. A bérlő viszont a havi díjat ismeri, és a
 * részletezés is „x Ft / hó"-t ír — egy teljes hónapra tehát pontosan annyit
 * kell számolnunk.
 *
 * A havi előírások modulja (`eloirasok.ts`) ugyanezt teszi a hónap tényleges
 * napjaival; két helyen két szabály előbb-utóbb azt adta volna, hogy ugyanarra
 * a hónapra a két lap más összeget mutat.
 *
 * Az időszak a kezdőnapot tartalmazza, a záró napot nem: szeptember 1-től
 * október 1-ig pontosan egy hónap, ahogy a leolvasások közti fogyasztás is
 * ennyi.
 */
export function haviAranyos(haviFt: number, tol: Date, ig: Date): number {
  const kezdet = napEleje(tol);
  const veg = napEleje(ig);
  if (veg.getTime() <= kezdet.getTime()) return 0;

  let arany = 0;
  let ev = kezdet.getUTCFullYear();
  let honap = kezdet.getUTCMonth();

  while (true) {
    const honapElso = Date.UTC(ev, honap, 1);
    const kovetkezoElso = Date.UTC(ev, honap + 1, 1);
    if (honapElso >= veg.getTime()) break;

    const elso = Math.max(honapElso, kezdet.getTime());
    const utolso = Math.min(kovetkezoElso, veg.getTime());
    if (utolso > elso) {
      arany += (utolso - elso) / (kovetkezoElso - honapElso);
    }

    honap += 1;
    if (honap > 11) {
      honap = 0;
      ev += 1;
    }
  }

  return Math.round(haviFt * arany);
}

/** Havi alapdíj a két leolvasás közti időszakra, naptári hónapokkal. */
export function alapdijResz(alapdijFt: number, tol: Date, ig: Date): number {
  return haviAranyos(alapdijFt, tol, ig);
}

function egesz(ertek: number): string {
  return szam(ertek);
}

function forintSzoveg(osszegFt: number): string {
  return `${szam(osszegFt, 3)} Ft`;
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
  const alapdijReszFt = alapdijResz(dijszabas.alapdijFt, elozo.datum, jelenlegi.datum);

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
      // Csatornadíjat sem számolunk, és külön sorban sem írjuk ki: ugyanarról
      // az egy hibáról a bérlő ne kapjon két figyelmeztetést.
      csatornaFt: 0,
      csatornaReszletezes: null,
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

  // A csatornadíj ugyanarra a mennyiségre megy, sáv nélkül, és külön kerekítjük:
  // a végösszeg a kerekített tételek összege, tehát a két sor külön-külön áll meg.
  const csatornaFt =
    dijszabas.csatornaArFiller > 0
      ? Math.round((nyersFogyasztas * dijszabas.csatornaArFiller) / 100)
      : 0;

  return {
    fogyasztas: nyersFogyasztas,
    kedvezmenyesEgyseg,
    piaciEgyseg,
    keretAzIdoszakra: keret,
    osszegFt: fogyasztasFt + alapdijReszFt,
    alapdijReszFt,
    reszletezes: reszek.join(" "),
    csatornaFt,
    csatornaReszletezes:
      dijszabas.csatornaArFiller > 0
        ? `Ugyanaz a ${egesz(nyersFogyasztas)} ${mertekegyseg} elvezetve, ` +
          `${arSzoveg(dijszabas.csatornaArFiller)}/${mertekegyseg}. ` +
          "A csatornadíj a mért vízfogyasztás után jár, nem külön mérve."
        : null,
  };
}

export type Tetel = {
  /**
   * Az „atalany" és a „kozos_koltseg" fajtát ma már nem termeli semmi: azok
   * havi előírások. A típusban mégis bent maradnak, mert a kiadott elszámolás
   * tételei el vannak mentve, és egy korábban kiadott okirat sorát ugyanúgy
   * ki kell tudni írni és az adóösszesítőben nem mértként besorolni.
   */
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
};

export type Elszamolas = { tetelek: Tetel[]; osszegFt: number; napok: number };

/**
 * Az elszámolás összege a kerekített tételek összege, nem a kerekítetlen
 * végösszeg: így a bérlő össze tudja adni a sorokat, és ugyanazt kapja.
 *
 * **A rezsiátalány és a közös költség nincs benne**, pedig korábban volt. Az a
 * kettő havi előírásként megy (`domain/eloirasok.ts`), és ha az elszámolás is
 * felvette őket, a bérlő ugyanazt kétszer fizette: Anna példaadatában két
 * hónapra 56 537 Ft közös költség 28 000 helyett, és az adóösszesítő is
 * kétszer számolta bevételnek. Egy tételnek egy helye van, és a havi előírás
 * az a hely: azon megy végig a befizetés-egyeztetés is.
 *
 * Az elszámolás ezért kizárólag mért fogyasztást tartalmaz. Ebből következik,
 * hogy átalányos és „közös költségben" módban nincs mit elszámolni — ezt a
 * `lib/rezsi.ts` mondja ki a bérbeadónak, nem egy üres lista.
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

    // A csatornadíj külön sor, nem a vízdíjba olvasztva. A vízszámla is így
    // írja, tehát a bérlő össze tudja vetni a kettőt; egy összevont számot
    // viszont nem tudna hol keresni. A fajtája ettől ugyanúgy mért fogyasztás:
    // az adóösszesítő innen tudja, hogy nem bevétel, ha továbbhárítjuk.
    if (eredmeny.csatornaReszletezes !== null) {
      tetelek.push({
        fajta: "meroora",
        megnevezes: `${meroora.megnevezes} · csatornadíj`,
        mennyiseg: eredmeny.fogyasztas,
        mertekegyseg: meroora.mertekegyseg,
        reszletezes: eredmeny.csatornaReszletezes,
        osszegFt: eredmeny.csatornaFt,
        merooraId: meroora.id,
      });
    }
  }

  return {
    tetelek,
    osszegFt: tetelek.reduce((osszeg, tetel) => osszeg + tetel.osszegFt, 0),
    napok,
  };
}

/**
 * A díjszabásból az, ami az adott napon érvényes volt.
 *
 * Azonos `ervenyesTol` napnál az azonosító dönt, a nagyobb felé — ugyanaz a
 * szabály, mint a lekérdezések rendezésénél. Enélkül két egy napon érvényes
 * díjszabásból futásonként más jött ki, és ugyanannak az elszámolásnak két
 * futáson két összege lett volna.
 */
export function ervenyesDijszabas<T extends { ervenyesTol: Date; id?: string }>(
  dijszabasok: T[],
  napon: Date,
): T | null {
  const jeloltek = dijszabasok
    .filter((dijszabas) => dijszabas.ervenyesTol.getTime() <= napon.getTime())
    .sort(
      (a, b) =>
        b.ervenyesTol.getTime() - a.ervenyesTol.getTime() ||
        (b.id ?? "").localeCompare(a.id ?? ""),
    );
  return jeloltek[0] ?? null;
}
