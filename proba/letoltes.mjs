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
    // Rendezés és szűrés nélkül a `limit 1` abból választ, amit a Postgres
    // épp elöl ad, és nálunk a holtverseny a rendes eset: amióta a próbasor
    // maga is véglegesít szerződést, ez a sor egy kiadott okiratot is
    // eltalálhatott — amit a bérlő jogosan letölt, tehát a próba a saját
    // bemenetén bukott el, nem a terméken. Azt kérjük, amit mérünk: kiadott
    // elszámolást és szerződéstervezetet, rögzített sorrendben.
    const elszamolas = await kliens.query(
      `select id from "Elszamolas" where allapot <> 'tervezet' order by id limit 1`,
    );
    const szerzodes = await kliens.query(
      `select id from "Szerzodes" where allapot = 'tervezet' order by id limit 1`,
    );
    return { elszamolas: elszamolas.rows[0], szerzodes: szerzodes.rows[0] };
  } finally {
    await kliens.end();
  }
}

export async function futtat(oldal) {
  const { elszamolas, szerzodes } = await azonositok();
  // Önpróba: ha a bemenet hiányzik, azt mondjuk ki, ne egy olvashatatlan
  // hibával szálljunk el húsz sorral lejjebb.
  all(
    Boolean(elszamolas?.id && szerzodes?.id),
    "a példaadatban van kiadott elszámolás és szerződéstervezet",
  );

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
