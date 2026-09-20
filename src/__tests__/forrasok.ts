/**
 * A minőségi kapuk közös segédje: a saját forrásfájljaink listája.
 *
 * A kapuk olvassák a kódot, nem futtatják. Ez azért van így, mert a
 * megállapodásaink egy részét (rétegek, naplózás, kiszolgálói műveletek alakja)
 * sem a típusellenőrzés, sem a fordítás nem fogja meg, csak az olvasás vagy a
 * futtatás — és futtatni mindent minden ágon túl drága.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const GYOKER = join(process.cwd(), "src");

/** A Prisma generálja, nem mi írjuk: a mi szabályaink nem vonatkoznak rá. */
const KIHAGYOTT = ["generated"];

export type Forras = { utvonal: string; tartalom: string };

function bejar(konyvtar: string, gyujto: string[]): void {
  for (const bejegyzes of readdirSync(konyvtar)) {
    const teljes = join(konyvtar, bejegyzes);
    if (statSync(teljes).isDirectory()) {
      if (!KIHAGYOTT.includes(bejegyzes)) bejar(teljes, gyujto);
      continue;
    }
    if (bejegyzes.endsWith(".ts") || bejegyzes.endsWith(".tsx")) gyujto.push(teljes);
  }
}

/** Minden saját forrásfájl, `src`-hez képesti úttal, per jellel. */
export function forrasok(): Forras[] {
  const utak: string[] = [];
  bejar(GYOKER, utak);
  return utak
    .map((teljes) => ({
      utvonal: relative(GYOKER, teljes).split(sep).join("/"),
      tartalom: readFileSync(teljes, "utf8"),
    }))
    .sort((a, b) => a.utvonal.localeCompare(b.utvonal));
}

/** Az `import ... from "x"` és `require("x")` hivatkozások egy fájlból. */
export function hivatkozasok(tartalom: string): string[] {
  const talalatok = [
    ...tartalom.matchAll(/(?:^|\n)\s*import\s[^;]*?from\s+["']([^"']+)["']/g),
    ...tartalom.matchAll(/(?:^|\n)\s*import\s+["']([^"']+)["']/g),
    ...tartalom.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g),
  ];
  return talalatok.map((talalat) => talalat[1]);
}

/** A fájl kód része: a sorvégi és a blokkos megjegyzések nélkül. */
export function megjegyzesNelkul(tartalom: string): string {
  return tartalom.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}
