/**
 * Letöltési jogosultságok.
 *
 * A dokumentumtár megnyitotta a letöltést a bérlőnek is. A szabály: csak kiadott
 * iratot, és a névre szóló igazolásból csak a sajátját. Ezt útvonalon kell
 * próbálni, mert a felület el is rejtheti a linket, miközben a cím működik.
 */

import Database from "better-sqlite3";
import { ALAP, all, belep } from "./kozos.mjs";

export const nev = "Letöltési jogosultságok";

function adatbazisUtja() {
  const nyers = process.env.DATABASE_URL ?? "file:./dev.db";
  return nyers.replace(/^file:/, "");
}

export async function futtat(oldal) {
  const db = new Database(adatbazisUtja(), { readonly: true });
  const elszamolas = db.prepare("select id from Elszamolas limit 1").get();
  const szerzodes = db.prepare("select id from Szerzodes limit 1").get();
  db.close();

  await belep(oldal, "anna@pelda.hu");
  const keres = oldal.context().request;

  const elsz = await keres.get(`${ALAP}/elszamolasok/${elszamolas.id}/letoltes`);
  all(elsz.status() === 200, "a bérlő letölti a kiadott rezsielszámolást");
  const szoveg = await elsz.text();
  all(szoveg.includes("REZSIELSZÁMOLÁS"), "az elszámolás szövege megjön");
  all(szoveg.includes("Összesen:"), "a végösszeg benne van");

  const szerz = await keres.get(`${ALAP}/szerzodesek/${szerzodes.id}/letoltes`);
  all(szerz.status() === 404, "tervezet szerződést a bérlő nem tölthet le");
}
