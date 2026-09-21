import { uzenet, type Uzenet } from "./nyelv";

/**
 * A belépés és a meghívó szabályai. Tiszta függvények: nincs bennük se titkosítás,
 * se adatbázis, hogy a szabályokat egyszerűen lehessen tesztelni és átírni.
 */

export const JELSZO_MIN_HOSSZ = 10;

/** A címet kisbetűsítjük és levágjuk a szóközöket, hogy egy fiók egy cím legyen. */
export function emailtNormalizal(nyers: unknown): string {
  return String(nyers ?? "").trim().toLowerCase();
}

/** Nem teljes RFC-ellenőrzés: a gépelési hibát fogja meg, nem a szabálykövetést. */
export function emailNekLatszik(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Hosszra megyünk, nem karakterosztályokra. A hosszú jelszó erősebb, és a
 * kikényszerített nagybetű-szám-írásjel hármas jellemzően kitalálható mintákat szül.
 */
export function jelszotEllenoriz(
  jelszo: unknown,
  megerosites?: unknown,
): Uzenet[] {
  const hibak: Uzenet[] = [];
  const szoveg = String(jelszo ?? "");

  if (szoveg.length < JELSZO_MIN_HOSSZ) {
    hibak.push(uzenet("jelszo.hiba.rovid", { min: JELSZO_MIN_HOSSZ }));
  }
  if (szoveg.trim() === "") hibak.push(uzenet("jelszo.hiba.csak_szokoz"));
  if (megerosites !== undefined && szoveg !== String(megerosites ?? "")) {
    hibak.push(uzenet("jelszo.hiba.nem_egyezik"));
  }
  return hibak;
}

export type MeghivoAllapot = "ervenyes" | "lejart" | "felhasznalt";

export function meghivoAllapota(
  meghivo: { lejar: Date; felhasznalva: Date | null },
  most: Date,
): MeghivoAllapot {
  if (meghivo.felhasznalva) return "felhasznalt";
  if (meghivo.lejar.getTime() <= most.getTime()) return "lejart";
  return "ervenyes";
}

/** Ennyi ideig él egy meghívó. Ennél hosszabb link túl sokáig marad a postafiókban. */
export const MEGHIVO_ELETTARTAM_NAP = 14;

export function meghivoLejarata(most: Date): Date {
  return new Date(most.getTime() + MEGHIVO_ELETTARTAM_NAP * 24 * 60 * 60 * 1000);
}
