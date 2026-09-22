/**
 * Minden böngészős próba egy menetben, egy böngészővel.
 *
 * A sorrend számít: a hibabejelentés próbája adatot hoz létre, amit a
 * telefonméret-próba is lát. Ezért egy adatbázison futnak, frissen betöltött
 * példaadattal (`npm run db:seed`).
 */

import { mkdirSync } from "node:fs";
import { bongeszot } from "./kozos.mjs";

const PROBAK = ["./meret.mjs", "./hibabejelentes.mjs", "./nyelv.mjs", "./letoltes.mjs", "./betekinto.mjs", "./eloirasok.mjs", "./egyeztetes.mjs", "./adatok.mjs", "./berlemeny.mjs", "./urlap.mjs", "./fenykepek.mjs", "./beszelgetes.mjs", "./csatornadij.mjs", "./elofizetes.mjs", "./zaradek.mjs", "./ertekeles.mjs"];

mkdirSync("proba/kepek", { recursive: true });

const { bongeszo, oldal } = await bongeszot();
let bukott = null;

try {
  for (const ut of PROBAK) {
    const proba = await import(ut);
    process.stdout.write(`\n${proba.nev}\n`);
    await proba.futtat(oldal);
  }
} catch (hiba) {
  bukott = hiba;
  await oldal.screenshot({ path: "proba/kepek/hiba.png", fullPage: true }).catch(() => {});
}

await bongeszo.close();

if (bukott) {
  process.stderr.write(`\n${bukott.message}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("\nMINDEN BÖNGÉSZŐS PRÓBA RENDBEN\n");
}
