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
 *
 * Dátumot és hónapot nyersen adunk át, nem előre formázva: a formázás a nyelvet
 * ismeri, a domain nem. Amíg a dátum kész magyar szövegként jött be, az angol
 * felületen is magyar alakban jelent meg, és ezt semmi nem jelezte.
 */
export type Adatok = Record<string, string | number | Date | Uzenet | Honap>;

/**
 * Egy „ÉÉÉÉ-HH” alakú időszak, hónapnévvé formázva a behelyettesítéskor.
 *
 * Nem sima szöveg, mert akkor a gépi alak kerülne a mondatba: a teendők listája
 * így írta ki, hogy „2026-09 időszak, 240 000 Ft”. A domain viszont nem tudhat
 * a nyelvről, ezért csak megjelöli, hogy ez egy hónap, a kiírást pedig ugyanúgy
 * a szövegező végzi, mint a számokét.
 */
export type Honap = { honap: string };

export function honap(idoszak: string): Honap {
  return { honap: idoszak };
}

/** Egy fordítható szöveg: kulcs és a behelyettesítendő értékek. */
export type Uzenet = { kulcs: string; adatok?: Adatok };

export function uzenet(kulcs: string, adatok?: Adatok): Uzenet {
  return adatok ? { kulcs, adatok } : { kulcs };
}

export type Szotar = Record<string, Record<Nyelv, string>>;

/**
 * Szám a nyelv szokása szerint, ezres tagolással.
 *
 * Az Intl nem törő szóközt tesz be, ami a képernyőn jól néz ki, de a
 * szerződéseket és az elszámolásokat sokan kimásolják, keresnek bennük vagy
 * Wordbe illesztik, és ott a láthatatlan karakter csak zavar. Ezért közönséges
 * szóközre cseréljük.
 *
 * Ez az alkalmazás egyetlen helye, ahol szám formázódik: az `Intl` hívásokat a
 * `formatum` kapu ide szorítja, hogy a magyar alak ne csússzon el oldalanként.
 */
export function szamNyelven(ertek: number, nyelv: Nyelv, tizedes = 2): string {
  return new Intl.NumberFormat(helyszin(nyelv), { maximumFractionDigits: tizedes })
    .format(ertek)
    .replace(/[\u00a0\u202f]/g, " ");
}

function szamot(ertek: number, nyelv: Nyelv): string {
  return szamNyelven(ertek, nyelv);
}

function uzenetE(ertek: unknown): ertek is Uzenet {
  return typeof ertek === "object" && ertek !== null && "kulcs" in ertek;
}

function honapE(ertek: unknown): ertek is Honap {
  return typeof ertek === "object" && ertek !== null && "honap" in ertek;
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
      if (ertek instanceof Date) return datumNyelven(ertek, nyelv);
      if (honapE(ertek)) return honapNyelven(ertek.honap, nyelv);
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

/**
 * Az "ÉÉÉÉ-HH" alakú időszak emberi alakja: "2026. szeptember", illetve
 * "September 2026". A két nyelv szórendje sem azonos, ezért ez is itt van, és
 * nem az oldalakon.
 *
 * Amit nem ismerünk fel, azt változatlanul adjuk vissza: a tippelés rosszabb,
 * mint a nyers alak.
 */
export function honapNyelven(idoszak: string, nyelv: Nyelv): string {
  const talalat = /^(\d{4})-(\d{2})$/.exec(idoszak);
  if (!talalat) return idoszak;

  const nap = new Date(Date.UTC(Number(talalat[1]), Number(talalat[2]) - 1, 1));
  if (Number.isNaN(nap.getTime())) return idoszak;

  return new Intl.DateTimeFormat(helyszin(nyelv), {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(nap);
}
