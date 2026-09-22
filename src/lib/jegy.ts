/**
 * Munkamenetjegy: a sütiben tárolt, aláírt azonosító.
 *
 * Nem tárolunk munkamenetet az adatbázisban, hanem aláírjuk az azonosítót és a
 * lejáratot. Az aláírás nélkül a süti tartalma átírható lenne, így bárki
 * bárkinek kiadhatná magát.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type Jegy = { felhasznaloId: string; lejar: number };

function alairas(adat: string, titok: string): string {
  return createHmac("sha256", titok).update(adat).digest("base64url");
}

export function jegyetKeszit(jegy: Jegy, titok: string): string {
  const adat = `${jegy.felhasznaloId}.${jegy.lejar}`;
  return `${adat}.${alairas(adat, titok)}`;
}

/** Érvénytelen, lejárt vagy hamisított jegyre null. A hívó ilyenkor kiléptet. */
export function jegyetOlvas(nyers: string | undefined, titok: string, most: Date): Jegy | null {
  if (!nyers) return null;

  const reszek = nyers.split(".");
  if (reszek.length !== 3) return null;

  const [felhasznaloId, lejarSzoveg, kapottAlairas] = reszek;
  const varhato = alairas(`${felhasznaloId}.${lejarSzoveg}`, titok);

  const a = Buffer.from(kapottAlairas);
  const b = Buffer.from(varhato);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const lejar = Number(lejarSzoveg);
  if (!Number.isFinite(lejar) || lejar <= most.getTime()) return null;

  return { felhasznaloId, lejar };
}
