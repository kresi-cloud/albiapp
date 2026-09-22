/**
 * Kétnyelvűség.
 *
 * A bérbeadó magyar magánszemély, a bérlő viszont gyakran nem: egyetemi városban
 * külföldi hallgató, nagyvárosban külföldön dolgozó. Ezért a felület magyarul és
 * angolul is megy, a **kiadott okiratok** viszont magyarul érvényesek: a
 * szerződés, a jegyzőkönyv, az igazolás és az elszámolás szövegét nem fordítjuk,
 * mert a fordítás nem az, amit aláírtak.
 *
 * Ami a képernyőn magyarázat, az viszont fordítható. Ehhez a domain nem kész
 * mondatot ad vissza, hanem üzenetet: kulcsot és a behelyettesítendő adatokat.
 * Így a szöveg egy helyen, a szótárban él, a számítás pedig nyelvfüggetlen marad.
 */

export type Nyelv = "hu" | "en";

export const NYELVEK: Nyelv[] = ["hu", "en"];

export const NYELV_NEVE: Record<Nyelv, string> = {
  hu: "Magyar",
  en: "English",
};

export function nyelvet(nyers: string | null | undefined): Nyelv {
  return nyers === "en" ? "en" : "hu";
}

/**
 * Behelyettesítendő értékek. Egy érték lehet maga is üzenet: így a „Sürgős ·
 * A bérbeadó átvette” mondat két fordítható darabból áll össze, és nem kell
 * minden kombinációra külön szótársor.
 */
export type Adatok = Record<string, string | number | Uzenet>;

/** Egy fordítható szöveg: kulcs és a behelyettesítendő értékek. */
export type Uzenet = { kulcs: string; adatok?: Adatok };

export function uzenet(kulcs: string, adatok?: Adatok): Uzenet {
  return adatok ? { kulcs, adatok } : { kulcs };
}

export type Szotar = Record<string, Record<Nyelv, string>>;

function szamot(ertek: number, nyelv: Nyelv): string {
  return new Intl.NumberFormat(helyszin(nyelv), { maximumFractionDigits: 2 })
    .format(ertek)
    .replace(/[\u00a0\u202f]/g, " ");
}

function uzenetE(ertek: unknown): ertek is Uzenet {
  return typeof ertek === "object" && ertek !== null && "kulcs" in ertek;
}

export type Szovegezo = {
  nyelv: Nyelv;
  /** Kulcs szerinti szöveg, behelyettesítéssel. */
  sz: (kulcs: string, adatok?: Adatok) => string;
  /** Domainből jött üzenet kirenderelése. */
  u: (uzenet: Uzenet) => string;
  /** Magyar vagy angol változat helyben, ahol nem éri meg szótárkulcsot adni. */
  v: (hu: string, en: string) => string;
};

/**
 * Hiányzó kulcsnál a magyar változatot adjuk vissza, és ha az sincs, magát a
 * kulcsot: a felhasználó lásson valamit, a fejlesztő pedig lássa, mi hiányzik.
 */
export function szovegezo(nyelv: Nyelv, szotar: Szotar): Szovegezo {
  const sz = (kulcs: string, adatok?: Adatok): string => {
    const sor = szotar[kulcs];
    if (!sor) return kulcs;
    const minta = sor[nyelv] ?? sor.hu;
    if (!adatok) return minta;

    return minta.replace(/\{(\w+)\}/g, (egesz, nev: string) => {
      if (!(nev in adatok)) return egesz;
      const ertek = adatok[nev];
      if (uzenetE(ertek)) return sz(ertek.kulcs, ertek.adatok);
      // A számot a nyelv szerint tagoljuk; a pénznemet a szótársor mondja ki,
      // mert a "150 000 Ft" és a "HUF 150,000" szórendje sem azonos.
      return typeof ertek === "number" ? szamot(ertek, nyelv) : String(ertek);
    });
  };

  return {
    nyelv,
    sz,
    u: (ertek) => sz(ertek.kulcs, ertek.adatok),
    v: (hu, en) => (nyelv === "en" ? en : hu),
  };
}

/** Az Intl helyszíne a nyelvhez. A forint attól még forint marad. */
export function helyszin(nyelv: Nyelv): string {
  return nyelv === "en" ? "en-GB" : "hu-HU";
}

export function forintNyelven(osszegFt: number, nyelv: Nyelv): string {
  return new Intl.NumberFormat(helyszin(nyelv), {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(osszegFt);
}

export function datumNyelven(ertek: Date, nyelv: Nyelv): string {
  return new Intl.DateTimeFormat(helyszin(nyelv), { dateStyle: "medium" }).format(ertek);
}
