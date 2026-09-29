/**
 * Az aláírt szerződés feltöltött példánya.
 *
 * A szerződést a felek aláírják — papíron vagy elektronikusan —, és onnantól az
 * az okirat. Amit az alkalmazás kiad, az a szöveg; ami a feltöltött példányban
 * van, az az aláírásokkal együtt az, amire a felek hivatkozni fognak. Ezért
 * kell tudni feltölteni, és ezért tölti le a bérlő is: az okirat az övé is.
 *
 * Két szabály tartja a helyén, és mindkettőt a kiszolgáló tartja be:
 *
 * - Aláírt példánya csak **véglegesített** szerződésnek van. Egy tervezethez
 *   feltöltött „aláírt" fájl olyan szöveghez tartozna, ami még változhat.
 * - A **rögzítés végleges**. Amíg nincs rögzítve, a fájl cserélhető és
 *   törölhető, mert a rossz fájl feltöltése különben javíthatatlan lenne;
 *   rögzítés után viszont nem, és ez a lényege — egy aláírt okirat, amit a
 *   bérbeadó bármikor kicserélhet, pont annyit érne, mint a bemondás.
 */

import { uzenet, type Uzenet } from "./nyelv";
// A bájtsorrendből felismert típus és az emberi méret ugyanaz a kérdés, mint a
// bizonylatnál, és egy szabályból nem csinálunk kettőt: ami ott elfogadható
// feltöltés, az itt is az.
import { meretSzoveg, tipusATartalombol } from "./bizonylat";

export { meretSzoveg, tipusATartalombol };

/**
 * Amit elfogadunk. Az aláírt szerződés jellemzően PDF; a fényképezett vagy
 * szkennelt példány is jó, mert sok bérbeadó a telefonjával fotózza le. Ami
 * kimarad, az szándékos: a futtatható és irodai formátumokat a másik fél
 * böngészője nyitná meg a mi címünkön.
 */
export const ELFOGADOTT_TIPUSOK = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * Egy szkennelt, több oldalas szerződés nagyobb, mint egy utalási bizonylat,
 * ezért a korlát is nagyobb. Korlát viszont kell: ez az adat az adatbázisban
 * ül, és a másik fél tölti le.
 */
export const MAX_MERET_BAJT = 15 * 1024 * 1024;

export type FajlAdat = { tipus: string; meretBajt: number };

export function alairtatEllenoriz(fajl: FajlAdat): Uzenet | null {
  if (fajl.meretBajt === 0) return uzenet("alairt.hiba.ures");
  if (fajl.meretBajt > MAX_MERET_BAJT) {
    return uzenet("alairt.hiba.nagy", { max: Math.floor(MAX_MERET_BAJT / (1024 * 1024)) });
  }
  if (!(ELFOGADOTT_TIPUSOK as readonly string[]).includes(fajl.tipus)) {
    return uzenet("alairt.hiba.tipus");
  }
  return null;
}

const KITERJESZTES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * A letöltéskor adott fájlnév. Nem a feltöltöttből: az a feltöltő bemondása,
 * és ebből a böngészőnek szóló fejléc készül. A kiterjesztés is az ellenőrzött
 * típusból jön, ugyanezért.
 */
export function biztonsagosNev(mimeTipus: string): string {
  return `alairt-berleti-szerzodes.${KITERJESZTES[mimeTipus] ?? "dat"}`;
}

export type AlairtAllapot = "nincs" | "feltoltve" | "rogzitve";

export function allapota(alairt: { rogzitve: Date | null } | null): AlairtAllapot {
  if (!alairt) return "nincs";
  return alairt.rogzitve ? "rogzitve" : "feltoltve";
}

/** Cserélni és törölni csak addig lehet, amíg nincs rögzítve. */
export function modosithato(alairt: { rogzitve: Date | null } | null): boolean {
  return allapota(alairt) !== "rogzitve";
}
