/**
 * Letöltési jogosultságok.
 *
 * A dokumentumtár megnyitotta a letöltést a bérlőnek is. A szabály: csak kiadott
 * iratot, és a névre szóló igazolásból csak a sajátját. Ezt útvonalon kell
 * próbálni, mert a felület el is rejtheti a linket, miközben a cím működik.
 */

import pg from "pg";
import { ALAP, all, belep } from "./kozos.mjs";

export const nev = "Letöltési jogosultságok";

/**
 * A próbának egy kiadott elszámolás és egy szerződéstervezet azonosítója kell.
 * Ezek nem állnak a felületen, viszont az adatbázisban igen: a próba ezért néz
 * bele, csak olvasásra. A `DATABASE_URL` ugyanaz, amin a kiszolgáló fut.
 */
async function azonositok() {
  const kliens = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await kliens.connect();
  try {
    const elszamolas = await kliens.query('select id from "Elszamolas" limit 1');
    const szerzodes = await kliens.query('select id from "Szerzodes" limit 1');
    return { elszamolas: elszamolas.rows[0], szerzodes: szerzodes.rows[0] };
  } finally {
    await kliens.end();
  }
}

export async function futtat(oldal) {
  const { elszamolas, szerzodes } = await azonositok();

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
