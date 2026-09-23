/**
 * A szerződés angol változatának építőkövei.
 *
 * A fordítás tájékoztató: a magyar szöveg az, amit a felek aláírnak, és az az
 * irányadó. Ettől még nem elég „valahogy" angolul kiírni a szerződést, mert a
 * bérlő ebből fogja megérteni, mit vállal — a számnak, a dátumnak és a felek
 * adatainak ugyanúgy pontosnak kell lennie, mint a magyar példányban.
 *
 * Ezért a fordítás nem a kész magyar szövegből készül, hanem modulonként (lásd
 * `szerzodes-modulok-en.ts`). Két oka van. A kész szöveg már tartalmazza a felek
 * személyes adatait, és azt külső fordítószolgáltatáshoz küldeni pont az, amit
 * az alkalmazás sehol máshol nem tesz. A másik, hogy a kész szövegben az összeg
 * betűvel is ki van írva, és egy gépi fordító ezt vagy elrontja, vagy alkalmanként
 * másképp rontja el — ugyanannak a szerződésnek pedig holnap is ugyanaz a
 * fordítása kell legyen.
 */

import { szamNyelven } from "./nyelv";
import type { Fel, Kontextus } from "./szerzodes";

const HONAPOK_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Szerződésbe való dátum angolul: "29 August 2026". */
export function hosszuDatumEn(ertek: Date): string {
  return `${ertek.getUTCDate()} ${HONAPOK_EN[ertek.getUTCMonth()]} ${ertek.getUTCFullYear()}`;
}

const EGYESEK_EN = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];

const TIZESEK_EN = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
];

function haromjegyuEn(ertek: number): string {
  const reszek: string[] = [];
  const szaz = Math.floor(ertek / 100);
  const maradek = ertek % 100;

  if (szaz > 0) reszek.push(`${EGYESEK_EN[szaz]} hundred`);
  if (maradek > 0 && maradek < 20) reszek.push(EGYESEK_EN[maradek]);
  else if (maradek >= 20) {
    const tiz = Math.floor(maradek / 10);
    const egy = maradek % 10;
    reszek.push(egy > 0 ? `${TIZESEK_EN[tiz]}-${EGYESEK_EN[egy]}` : TIZESEK_EN[tiz]);
  }

  return reszek.join(" ");
}

/**
 * Összeg betűvel angolul. A magyar szerződésben a betűs alak az elírás elleni
 * régi biztosíték; a fordításban ugyanott ugyanaz áll, különben a bérlő a két
 * példányt összevetve azt látná, hogy az egyikből hiányzik valami.
 */
export function betuvelEn(osszeg: number): string {
  if (!Number.isFinite(osszeg) || osszeg < 0) return "";
  const egesz = Math.round(osszeg);
  if (egesz === 0) return "zero";

  const reszek: string[] = [];
  let maradek = egesz;

  const millio = Math.floor(maradek / 1_000_000);
  maradek %= 1_000_000;
  if (millio > 0) reszek.push(`${haromjegyuEn(millio)} million`);

  const ezer = Math.floor(maradek / 1000);
  maradek %= 1000;
  if (ezer > 0) reszek.push(`${haromjegyuEn(ezer)} thousand`);

  if (maradek > 0) reszek.push(haromjegyuEn(maradek));

  return reszek.join(" ");
}

/** Ezres tagolás az angol szokás szerint: "150,000". */
export function tagoltEn(ertek: number): string {
  return szamNyelven(ertek, "en", 0);
}

/** Forint szerződéses alakban angolul: "HUF 150,000, in words: one hundred fifty thousand forints". */
export function osszegSzovegEn(osszegFt: number): string {
  return `HUF ${tagoltEn(osszegFt)}, in words: ${betuvelEn(osszegFt)} forints`;
}

/**
 * Egy szerződő fél bemutatása angolul. A hiányzó adatot itt is kihagyjuk, nem
 * tippeljük meg — ugyanaz a szabály, mint a magyar változatban.
 */
export function felSzovegEn(fel: Fel): string {
  const reszek: string[] = [];
  if (fel.szuletesiHely || fel.szuletesiIdo) {
    const hely = fel.szuletesiHely ?? "";
    const ido = fel.szuletesiIdo ? hosszuDatumEn(fel.szuletesiIdo) : "";
    reszek.push(`place and date of birth: ${[hely, ido].filter(Boolean).join(", ")}`);
  }
  if (fel.anyjaNeve) reszek.push(`mother's maiden name: ${fel.anyjaNeve}`);
  if (fel.lakcim) reszek.push(`permanent address: ${fel.lakcim}`);
  if (fel.igazolvanySzam) reszek.push(`identity card number: ${fel.igazolvanySzam}`);
  if (fel.adoazonosito) reszek.push(`tax identification number: ${fel.adoazonosito}`);

  return reszek.length === 0 ? fel.nev : `${fel.nev} (${reszek.join("; ")})`;
}

/** Nevek felsorolása angolul: "Anna", "Anna and Tamas", "Anna, Tamas and Bela". */
export function nevsorEn(nevek: string[]): string {
  if (nevek.length === 0) return "";
  if (nevek.length === 1) return nevek[0];
  return `${nevek.slice(0, -1).join(", ")} and ${nevek[nevek.length - 1]}`;
}

/** Az angol modulszöveg alakja. Ugyanaz, mint a magyaré, csak a nyelve más. */
export type ModulEn = {
  cim: string;
  szoveg: (k: Kontextus) => string[];
};
