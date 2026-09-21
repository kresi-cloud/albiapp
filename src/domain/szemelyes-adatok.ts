/**
 * Személyes adatok a dokumentumok kiállításához.
 *
 * Az alapelv, hogy **mindkét fél a sajátját adja meg**. Eddig a bérlő adatait
 * a bérbeadó gépelte be helyette, ami két sebből vérzett: a bérlő nem látta,
 * mi áll róla a szerződésben, és egy elgépelt igazolványszámot senki nem
 * vett észre, aki tudta volna, hogy rossz.
 *
 * A hiány itt nem hiba, hanem állapot: a fiók megnyitásakor még semmi nincs
 * kitöltve, és ez rendben van. Csak ott lesz kötelező, ahol tényleg kell —
 * a szerződés véglegesítésénél —, addig teendő emlékeztet rá.
 *
 * Személyazonosságot az alkalmazás **nem** igazol, és nem is tud: amit itt
 * valaki beír, az a saját állítása. Ezért mondja ki a felület a szerződés
 * előtt, hogy a felek nézzék meg egymás okmányát személyesen.
 */

import { uzenet, type Uzenet } from "./nyelv";

export type Mezo =
  | "nev"
  | "szuletesiHely"
  | "szuletesiIdo"
  | "anyjaNeve"
  | "lakcim"
  | "igazolvanySzam"
  | "bankszamla";

export type SzemelyesAdatok = Partial<Record<Exclude<Mezo, "szuletesiIdo">, string | null>> & {
  szuletesiIdo?: Date | null;
};

/**
 * Amit a bérleti szerződés a bérlőről megkíván. A telefonszám szándékosan
 * nincs benne: kapcsolattartáshoz kell, a fél azonosításához nem.
 */
export const BERLOHOZ_KELL: readonly Mezo[] = [
  "nev",
  "szuletesiHely",
  "szuletesiIdo",
  "anyjaNeve",
  "lakcim",
  "igazolvanySzam",
];

/**
 * A bérbeadónál ugyanez, plusz a bankszámla: a szerződés megmondja, hova kell
 * utalni, és enélkül a bérlőnek nincs hova.
 */
export const BERBEADOHOZ_KELL: readonly Mezo[] = [...BERLOHOZ_KELL, "bankszamla"];

function kitoltott(adatok: SzemelyesAdatok, mezo: Mezo): boolean {
  if (mezo === "szuletesiIdo") {
    const ertek = adatok.szuletesiIdo;
    return ertek instanceof Date && !Number.isNaN(ertek.getTime());
  }
  return (adatok[mezo] ?? "").trim() !== "";
}

/** A még hiányzó mezők, a megadott sorrendben. */
export function hianyzoMezok(adatok: SzemelyesAdatok, kell: readonly Mezo[]): Mezo[] {
  return kell.filter((mezo) => !kitoltott(adatok, mezo));
}

export function adatokTeljesek(adatok: SzemelyesAdatok, kell: readonly Mezo[]): boolean {
  return hianyzoMezok(adatok, kell).length === 0;
}

/**
 * Hány mező van meg a kellőkből. A felület ebből rajzol előrehaladást: a
 * "még három adat kell" sokkal inkább kitöltésre visz, mint egy piros hiba.
 */
export function keszultseg(
  adatok: SzemelyesAdatok,
  kell: readonly Mezo[],
): { megvan: number; osszesen: number } {
  return { megvan: kell.length - hianyzoMezok(adatok, kell).length, osszesen: kell.length };
}

/** A hiányzó mezők felsorolása emberi mondatban, a szótáron keresztül. */
export function hianyUzenete(hianyzo: Mezo[]): Uzenet | null {
  if (hianyzo.length === 0) return null;
  return uzenet("adatok.hianyzik", { darab: hianyzo.length });
}

/**
 * Egy igazolványszám csak akkor "gyanús", ha nyilvánvalóan nem az. Nem
 * validálunk szigorúan: a személyi, az útlevél és a jogosítvány alakja is
 * más, külföldi bérlőnél pedig bármi lehet. Csak az üres és a láthatóan
 * elgépelt ellen védünk.
 */
export function igazolvanyGyanus(ertek: string): boolean {
  const tiszta = ertek.trim();
  if (tiszta === "") return false;
  return tiszta.length < 6 || !/[0-9]/.test(tiszta);
}

/**
 * A magyar adóazonosító jel tíz számjegy. Csak ennyit nézünk: a
 * CDV-ellenőrzés a NAV dolga, és egy külföldi bérlőnek nincs is ilyenje.
 */
export function adoazonositoGyanus(ertek: string): boolean {
  const tiszta = ertek.replace(/\s/g, "");
  if (tiszta === "") return false;
  return !/^\d{10}$/.test(tiszta);
}
