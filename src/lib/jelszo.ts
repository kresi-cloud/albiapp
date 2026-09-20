/**
 * Jelszó tárolása és ellenőrzése.
 *
 * scrypt, a Node beépített kriptográfiájából: nincs hozzá külső csomag, és
 * lassú szándékkal, tehát a kiszivárgott adatbázis sem fordítható vissza
 * gyorsan. Minden jelszó külön sót kap, az összehasonlítás pedig időállandó.
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const KULCS_HOSSZ = 64;
const SO_HOSSZ = 16;

export async function jelszotHashel(jelszo: string): Promise<string> {
  const so = randomBytes(SO_HOSSZ).toString("hex");
  const kulcs = (await scryptAsync(jelszo, so, KULCS_HOSSZ)) as Buffer;
  return `scrypt:${so}:${kulcs.toString("hex")}`;
}

export async function jelszoEgyezik(jelszo: string, tarolt: string): Promise<boolean> {
  const [modszer, so, kulcs] = tarolt.split(":");
  if (modszer !== "scrypt" || !so || !kulcs) return false;

  const varhato = Buffer.from(kulcs, "hex");
  const kapott = (await scryptAsync(jelszo, so, varhato.length)) as Buffer;
  return timingSafeEqual(varhato, kapott);
}
