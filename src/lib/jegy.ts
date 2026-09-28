/**
 * Munkamenetjegy: a sütiben tárolt, aláírt azonosító.
 *
 * Nem tárolunk munkamenetet az adatbázisban, hanem aláírjuk az azonosítót és a
 * lejáratot. Az aláírás nélkül a süti tartalma átírható lenne, így bárki
 * bárkinek kiadhatná magát.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A jegy a kiadás pillanatát is hordozza, nem csak a lejáratot. Enélkül a
 * jelszócsere nem tudna elvenni egy régebbi munkamenetet: a süti harminc napig
 * él, a jegyben pedig semmi nem mondaná meg, mikor készült. A `Felhasznalo`
 * `munkamenetekTol` mezőjével együtt ez zárja le a régi jegyeket.
 */
export type Jegy = { felhasznaloId: string; kiadva: number; lejar: number };

function alairas(adat: string, titok: string): string {
  return createHmac("sha256", titok).update(adat).digest("base64url");
}

export function jegyetKeszit(jegy: Jegy, titok: string): string {
  const adat = `${jegy.felhasznaloId}.${jegy.kiadva}.${jegy.lejar}`;
  return `${adat}.${alairas(adat, titok)}`;
}

/** Érvénytelen, lejárt vagy hamisított jegyre null. A hívó ilyenkor kiléptet. */
export function jegyetOlvas(nyers: string | undefined, titok: string, most: Date): Jegy | null {
  if (!nyers) return null;

  const reszek = nyers.split(".");
  // A régi, háromrészes jegy is ide fut be: rövidebb, tehát nem érvényes. Az
  // egyszeri kiléptetés az ára annak, hogy a jegy mostantól a kiadás idejét is
  // hordozza.
  if (reszek.length !== 4) return null;

  const [felhasznaloId, kiadvaSzoveg, lejarSzoveg, kapottAlairas] = reszek;
  const varhato = alairas(`${felhasznaloId}.${kiadvaSzoveg}.${lejarSzoveg}`, titok);

  const a = Buffer.from(kapottAlairas);
  const b = Buffer.from(varhato);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const lejar = Number(lejarSzoveg);
  const kiadva = Number(kiadvaSzoveg);
  if (!Number.isFinite(lejar) || lejar <= most.getTime()) return null;
  if (!Number.isFinite(kiadva)) return null;

  return { felhasznaloId, kiadva, lejar };
}
