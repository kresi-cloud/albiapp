/**
 * Bizonylat a vitás befizetéshez.
 *
 * Bizonylatot csak akkor kérünk, ha a két fél adata nem fedi egymást, és akkor
 * is csak arról az egy utalásról: a bérlőtől a küldő oldalit (az utalás
 * visszaigazolását), a bérbeadótól a fogadó oldalit (a jóváírást). Teljes
 * bankszámlakivonatot soha.
 *
 * Amelyik oldalt ki adhatja fel, az nem választás kérdése: a bérlőnek csak
 * küldő oldali bizonylata van, a bérbeadónak csak fogadó oldali. Ezért a
 * szerepből következik, és nem az űrlapról érkezik.
 */

import { uzenet, type Uzenet } from "./nyelv";

export type Oldal = "kuldo" | "fogado";

export function oldalaEnnek(szerep: "berbeado" | "berlo"): Oldal {
  return szerep === "berlo" ? "kuldo" : "fogado";
}

/**
 * Amit elfogadunk. Szándékosan szűk: egy utalási bizonylat PDF vagy képernyőkép,
 * más formátumnak nincs itt dolga. A futtatható és irodai formátumok kizárása
 * nem kényelmi kérdés: azokat a másik fél nyitná meg.
 */
export const ELFOGADOTT_TIPUSOK = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Egy utalási bizonylat ennél bőven kisebb; a korlát a visszaélés ellen van. */
export const MAX_MERET_BAJT = 5 * 1024 * 1024;

export type FajlAdat = {
  nev: string;
  tipus: string;
  meretBajt: number;
};

/**
 * A feltöltött fájl ellenőrzése. A hibaüzenet kulcsként jön vissza, hogy a
 * bérlő a saját nyelvén olvassa.
 */
export function bizonylatotEllenoriz(fajl: FajlAdat): Uzenet | null {
  if (fajl.meretBajt === 0) return uzenet("bizonylat.hiba.ures");
  if (fajl.meretBajt > MAX_MERET_BAJT) {
    return uzenet("bizonylat.hiba.nagy", { max: Math.floor(MAX_MERET_BAJT / (1024 * 1024)) });
  }
  if (!(ELFOGADOTT_TIPUSOK as readonly string[]).includes(fajl.tipus)) {
    return uzenet("bizonylat.hiba.tipus");
  }
  return null;
}

/**
 * A letöltéskor visszaadott fájlnév. A feltöltött nevet nem adjuk vissza
 * nyersen: abból a böngészőnek szóló fejléc készül, és egy idézőjel vagy
 * sortörés a névben elrontaná. Ékezetet sem teszünk bele, mert a fejléc
 * kódolása formátumonként eltér.
 */
export function biztonsagosNev(oldal: Oldal, eredeti: string): string {
  const kiterjesztes = /\.([a-z0-9]{1,5})$/i.exec(eredeti.trim())?.[1]?.toLowerCase() ?? "dat";
  return `bizonylat-${oldal}.${kiterjesztes}`;
}

/** Emberi méret a felületre: a bérlő lássa, mekkorát töltött fel. */
export function meretSzoveg(bajt: number): Uzenet {
  if (bajt < 1024) return uzenet("bizonylat.meret.bajt", { meret: bajt });
  if (bajt < 1024 * 1024) {
    return uzenet("bizonylat.meret.kb", { meret: Math.round(bajt / 1024) });
  }
  return uzenet("bizonylat.meret.mb", { meret: Math.round(bajt / (1024 * 1024)) });
}
