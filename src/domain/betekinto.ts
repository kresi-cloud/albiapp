/**
 * Betekintő nézet: a bérlő fizetési előzménye, csak olvasható.
 *
 * A bérlőszűrés Magyarországon jogilag korlátos, és jó okkal: a bérbeadó nem
 * kérhet el akármit, és nem építhet feketelistát. Ez a nézet az ellenkező
 * irányból old meg ugyanannyit. Nem a bérbeadó kutat a bérlő után, hanem a
 * bérlő ad ki magáról egy igazolható előzményt, akkor és annak, akinek akarja.
 *
 * Három dolog teszi használhatóvá:
 *
 *  - Az adat nem a bérlő bemondása. Abból jön, amit a mostani bérbeadó
 *    bankszámlakivonata igazol, tehát a másik fél saját adatából.
 *  - Nem adunk pontszámot. Egy "8,4 pont a tízből" úgy néz ki, mintha mérés
 *    lenne, pedig csak súlyozás, amit mi találtunk ki. Tényeket mutatunk,
 *    és az olvasó ítél.
 *  - Szűk. Se bérbeadói név, se pontos cím, se személyes adat, se más bérlő.
 *    Ha egy adat nem a fizetési fegyelemről szól, nincs itt helye.
 */

import { uzenet, type Uzenet } from "./nyelv";

/** Egy előírt tétel sorsa, a párosítás eredménye szerint. */
export type BetekintoTetel = {
  idoszak: string;
  allapot: "egyezik" | "elter" | "hianyzik";
  /** Naptári nap az esedékességhez képest; negatív, ha korábban érkezett. */
  keses: number;
  osszegFt: number;
};

export type Osszesites = {
  /** Hány hónapra volt előírás. */
  honapok: number;
  /** Beérkezett és beazonosított, az esedékességig. */
  hataridore: number;
  /** Beérkezett, de késve. */
  kesve: number;
  /** Nem érkezett meg, vagy nem volt beazonosítható. */
  hianyzo: number;
  /** Az összeg eltért az előírástól. */
  eltero: number;
  /** A késések átlaga napban, csak a késve érkezettekre. Nulla, ha nincs ilyen. */
  atlagosKeses: number;
  /** A leghosszabb késés napban. */
  leghosszabbKeses: number;
  /** Hány hónap óta érkezik minden határidőre, a legutolsótól visszafelé. */
  sorozat: number;
};

export const URES: Osszesites = {
  honapok: 0,
  hataridore: 0,
  kesve: 0,
  hianyzo: 0,
  eltero: 0,
  atlagosKeses: 0,
  leghosszabbKeses: 0,
  sorozat: 0,
};

function hataridore(tetel: BetekintoTetel): boolean {
  return tetel.allapot !== "hianyzik" && tetel.keses <= 0;
}

/**
 * A tételekből számolt összegzés. A sorrend a legfrissebb hónappal kezdődik,
 * mert a sorozatot a végétől számoljuk: azt mondja meg, hol tart most, nem azt,
 * mi volt két éve.
 */
export function osszesit(tetelek: BetekintoTetel[]): Osszesites {
  if (tetelek.length === 0) return URES;

  const sorrend = [...tetelek].sort((a, b) => b.idoszak.localeCompare(a.idoszak));
  const kesesek = sorrend
    .filter((tetel) => tetel.allapot !== "hianyzik" && tetel.keses > 0)
    .map((tetel) => tetel.keses);

  let sorozat = 0;
  for (const tetel of sorrend) {
    if (!hataridore(tetel)) break;
    sorozat += 1;
  }

  return {
    honapok: sorrend.length,
    hataridore: sorrend.filter(hataridore).length,
    kesve: kesesek.length,
    hianyzo: sorrend.filter((tetel) => tetel.allapot === "hianyzik").length,
    eltero: sorrend.filter((tetel) => tetel.allapot === "elter").length,
    atlagosKeses:
      kesesek.length === 0
        ? 0
        : Math.round(kesesek.reduce((osszeg, nap) => osszeg + nap, 0) / kesesek.length),
    leghosszabbKeses: kesesek.length === 0 ? 0 : Math.max(...kesesek),
    sorozat,
  };
}

/**
 * Az összegzés mondatokban. Minden mondat egy tényt állít, és a szám mellett
 * ott az is, miből jött: a bérlő össze tudja adni, az olvasó ellenőrizni tudja.
 */
export function mondatok(osszesites: Osszesites): Uzenet[] {
  if (osszesites.honapok === 0) return [uzenet("betekinto.mondat.nincs_adat")];

  const sorok: Uzenet[] = [
    uzenet("betekinto.mondat.honapok", { honapok: osszesites.honapok }),
    uzenet("betekinto.mondat.hataridore", {
      hataridore: osszesites.hataridore,
      honapok: osszesites.honapok,
    }),
  ];

  if (osszesites.kesve > 0) {
    sorok.push(
      uzenet("betekinto.mondat.kesve", {
        kesve: osszesites.kesve,
        atlag: osszesites.atlagosKeses,
        leghosszabb: osszesites.leghosszabbKeses,
      }),
    );
  }
  if (osszesites.hianyzo > 0) {
    sorok.push(uzenet("betekinto.mondat.hianyzo", { hianyzo: osszesites.hianyzo }));
  }
  if (osszesites.eltero > 0) {
    sorok.push(uzenet("betekinto.mondat.eltero", { eltero: osszesites.eltero }));
  }
  if (osszesites.sorozat > 1) {
    sorok.push(uzenet("betekinto.mondat.sorozat", { sorozat: osszesites.sorozat }));
  }

  return sorok;
}

/**
 * A bérlemény településnevének kiolvasása a címből.
 *
 * A pontos cím nem tartozik a betekintőre: hol lakik most a bérlő, az nem a
 * fizetési fegyelemről szól. A település viszont igen, mert enélkül az olvasó
 * nem tudja, mihez mérje a bérleti díjat. A magyar cím alakja "1111 Budapest,
 * Minta tér 2.": az első vessző előtti rész, az irányítószám nélkül.
 *
 * Ha nem ismerjük fel, nem tippelünk: inkább nem írunk semmit.
 */
export function telepules(cim: string): string | null {
  const elso = cim.split(",")[0]?.trim() ?? "";
  const nev = elso.replace(/^\d{4}\s+/, "").trim();
  if (nev === "" || nev === elso.trim() || /\d/.test(nev)) return null;
  return nev;
}

export type Allapot = "elo" | "lejart" | "visszavonva";

export function allapota(
  betekinto: { lejar: Date; visszavonva: Date | null },
  most: Date,
): Allapot {
  if (betekinto.visszavonva) return "visszavonva";
  return betekinto.lejar.getTime() <= most.getTime() ? "lejart" : "elo";
}

export function allapotNeve(allapot: Allapot): Uzenet {
  return uzenet(`betekinto.allapot.${allapot}`);
}

/**
 * Meddig éljen a link. Rövid, mert egy betekintő egy pályázathoz készül, nem
 * örökre: a bérlő inkább adjon ki újat, mint hogy egy régi link ott maradjon
 * valakinél.
 */
export const ELETTARTAM_NAPOK = [7, 30, 90] as const;
export const ALAPERTELMEZETT_ELETTARTAM = 30;

export function lejarat(most: Date, napok: number): Date {
  const lejar = new Date(most.getTime());
  lejar.setUTCDate(lejar.getUTCDate() + napok);
  return lejar;
}

/**
 * Amit a nézet soha nem mutat. Nem csak dokumentáció: a `betekinto` teszt ezt a
 * listát járja végig a kiadott adaton, hogy egy későbbi bővítés se csempéssze
 * vissza valamelyiket.
 */
export const SOHA_NEM_MUTATJUK = [
  "a bérbeadó neve és elérhetősége",
  "a bérlemény pontos címe",
  "a lakótársak neve",
  "személyes adat (születési adat, anyja neve, igazolványszám, adóazonosító)",
  "bankszámlaszám",
  "hibabejelentések tartalma",
] as const;
