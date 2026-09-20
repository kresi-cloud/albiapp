/**
 * Modulos lakásbérleti szerződés.
 *
 * A szerződés nem egyetlen sablon, hanem modulok sora. Minden modulnak saját
 * szövege és saját paraméterei vannak, és a bérbeadó modulonként dönt. Ennek két
 * oka van. Az egyik, hogy a bérbeadók helyzete különbözik: van, ahol a közös
 * költség a bérlőt terheli, van, ahol nem; van, ahol az állattartás megengedett.
 * A másik, hogy az ügyvédi ellenjegyzés így modulonként kérhető és tartható
 * karban: egy jogszabályváltozás egy modult érint, nem az egész sablont.
 *
 * A szöveg abból épül, amit az alkalmazás már tud: az ingatlan és a jogviszony
 * adataiból. Amit nem tudhat (bankszámlaszám, felmondási idő, kulcsok száma),
 * az modulparaméter. Ezért nem kell ugyanazt kétszer beírni, és ezért nem lehet
 * a szerződésben más bérleti díj, mint a befizetés-egyeztetésben.
 */

export type ParameterTipus = "szoveg" | "szam" | "penz" | "datum" | "valaszt";

export type ParameterDef = {
  kulcs: string;
  cimke: string;
  tipus: ParameterTipus;
  alapertelmezes: string;
  sugo?: string;
  valaszthatok?: { ertek: string; cimke: string }[];
};

/**
 * Ügyvédi ellenjegyzés modulonként. A termékdöntés szerint ellenjegyzés nélküli
 * modul nem választható éles szerződésbe; amíg a modulok ellenjegyzése nincs meg,
 * a szerződés tervezetként készül, és a felület ezt ki is írja.
 */
export type Ellenjegyzes = "nincs" | "folyamatban" | "ellenjegyzett";

export type Fel = {
  nev: string;
  szuletesiHely?: string | null;
  szuletesiIdo?: Date | null;
  anyjaNeve?: string | null;
  lakcim?: string | null;
  igazolvanySzam?: string | null;
  adoazonosito?: string | null;
  email?: string | null;
  telefon?: string | null;
};

export type Berbeado = Fel & { bankszamla?: string | null; bank?: string | null };

export type IngatlanAdat = {
  megnevezes: string;
  cim: string;
  alapteruletM2: number | null;
  helyrajziSzam: string | null;
  energetikaiAzonosito: string | null;
  kozosKoltsegFt: number | null;
};

export type JogviszonyAdat = {
  kezdete: Date;
  vege: Date | null;
  berletiDijFt: number;
  kozosKoltsegFt: number;
  kaucioFt: number;
  fizetesiNap: number;
  rezsiElszamolas: string;
  rezsiAtalanyFt: number;
};

export type Kontextus = {
  berbeado: Berbeado;
  berlok: Fel[];
  ingatlan: IngatlanAdat;
  jogviszony: JogviszonyAdat;
  /** Paraméterérték szövegként; ha nincs megadva, a modul alapértelmezése. */
  p: (kulcs: string) => string;
  /** Paraméterérték számként; nem szám esetén 0. */
  psz: (kulcs: string) => number;
  /** Egyes vagy többes szám a bérlők száma szerint. */
  v: (egyes: string, tobbes: string) => string;
  /** "a Bérlő" vagy "a Bérlők". */
  B: string;
  /** "A Bérlő" vagy "A Bérlők" mondat elején. */
  BN: string;
};

export type ModulDef = {
  kulcs: string;
  cim: string;
  kotelezo: boolean;
  ellenjegyzes: Ellenjegyzes;
  /** Miért van erre szükség, emberi nyelven. A felületen ez a modul leírása. */
  miert: string;
  parameterek: ParameterDef[];
  /** A modul bekezdései. Üres tömb esetén a modul kimarad a szövegből. */
  szoveg: (k: Kontextus) => string[];
  /** Ha megadja, a modul csak akkor ajánlott, ha ez igaz a jogviszonyra. */
  ajanlott?: (k: Kontextus) => boolean;
};

const HONAPOK = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];

/** Szerződésbe való dátum: "2026. augusztus 29." */
export function hosszuDatum(ertek: Date): string {
  return `${ertek.getUTCFullYear()}. ${HONAPOK[ertek.getUTCMonth()]} ${ertek.getUTCDate()}.`;
}

export function honapNeve(sorszam: number): string {
  return HONAPOK[sorszam - 1] ?? "";
}

const EGYESEK = ["", "egy", "kettő", "három", "négy", "öt", "hat", "hét", "nyolc", "kilenc"];

const TIZESEK: Record<number, string> = {
  3: "harminc", 4: "negyven", 5: "ötven", 6: "hatvan",
  7: "hetven", 8: "nyolcvan", 9: "kilencven",
};

/** Szorzó helyzetben a kettő "két": kétezer, de huszonkettő. */
function egyesJegy(szam: number, szorzo: boolean): string {
  return szam === 2 && szorzo ? "két" : EGYESEK[szam];
}

function haromjegyu(szam: number, szorzo: boolean): string {
  let maradek = szam;
  let szoveg = "";

  const szaz = Math.floor(maradek / 100);
  maradek %= 100;
  if (szaz > 0) szoveg += szaz === 1 ? "száz" : `${egyesJegy(szaz, true)}száz`;

  const tiz = Math.floor(maradek / 10);
  const egy = maradek % 10;
  if (tiz === 1) szoveg += egy === 0 ? "tíz" : "tizen";
  else if (tiz === 2) szoveg += egy === 0 ? "húsz" : "huszon";
  else if (tiz >= 3) szoveg += TIZESEK[tiz];
  if (egy > 0) szoveg += egyesJegy(egy, szorzo);

  return szoveg;
}

/**
 * Összeg betűvel. A szerződésben a szám mellé kiírt betűs alak régi, de máig élő
 * biztosíték az elírás ellen: "150 000 Ft, azaz egyszázötvenezer forint".
 */
export function betuvel(osszeg: number): string {
  if (!Number.isFinite(osszeg) || osszeg < 0) return "";
  const egesz = Math.round(osszeg);
  if (egesz === 0) return "nulla";

  let maradek = egesz;
  let szoveg = "";

  const millio = Math.floor(maradek / 1_000_000);
  maradek %= 1_000_000;
  if (millio > 0) szoveg += millio === 1 ? "egymillió" : `${haromjegyu(millio, true)}millió`;

  const ezer = Math.floor(maradek / 1000);
  maradek %= 1000;
  if (ezer > 0) szoveg += ezer === 1 ? "ezer" : `${haromjegyu(ezer, true)}ezer`;

  if (maradek > 0) szoveg += haromjegyu(maradek, false);

  return szoveg;
}

/**
 * Ezres tagolás közönséges szóközzel. Az Intl nem törő szóközt tesz be, ami a
 * képernyőn jól néz ki, de a szerződés szövegét sokan kimásolják, keresnek benne
 * vagy Wordbe illesztik, és ott a láthatatlan karakter csak zavar.
 */
export function simaSzokoz(szoveg: string): string {
  return szoveg.replace(/[\u00a0\u202f]/g, " ");
}

export function tagolt(szam: number): string {
  return simaSzokoz(new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(szam));
}

/** Forint szerződéses alakban: "150 000 Ft, azaz százötvenezer forint". */
export function osszegSzoveg(osszegFt: number): string {
  return `${tagolt(osszegFt)} Ft, azaz ${betuvel(osszegFt)} forint`;
}

/** Egy szerződő fél bemutatása. A hiányzó adatokat kihagyjuk, nem tippeljük meg. */
export function felSzoveg(fel: Fel): string {
  const reszek: string[] = [];
  if (fel.szuletesiHely || fel.szuletesiIdo) {
    const hely = fel.szuletesiHely ?? "";
    const ido = fel.szuletesiIdo ? hosszuDatum(fel.szuletesiIdo) : "";
    reszek.push(`születési hely, idő: ${[hely, ido].filter(Boolean).join(", ")}`);
  }
  if (fel.anyjaNeve) reszek.push(`anyja neve: ${fel.anyjaNeve}`);
  if (fel.lakcim) reszek.push(`állandó lakcím: ${fel.lakcim}`);
  if (fel.igazolvanySzam) reszek.push(`személyazonosító igazolvány száma: ${fel.igazolvanySzam}`);
  if (fel.adoazonosito) reszek.push(`adóazonosító jel: ${fel.adoazonosito}`);

  return reszek.length === 0 ? fel.nev : `${fel.nev} (${reszek.join("; ")})`;
}

/** Nevek felsorolása magyarul: "Anna", "Anna és Tamás", "Anna, Tamás és Béla". */
export function nevsor(nevek: string[]): string {
  if (nevek.length === 0) return "";
  if (nevek.length === 1) return nevek[0];
  return `${nevek.slice(0, -1).join(", ")} és ${nevek[nevek.length - 1]}`;
}
