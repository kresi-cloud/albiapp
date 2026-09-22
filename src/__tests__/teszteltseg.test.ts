/**
 * Teszteltségi kapu.
 *
 * A megállapodás: pénzügyi számítás nem kerül ki teszt nélkül. A domain minden
 * modulja vagy számol, vagy olyan szöveget állít elő, ami a számításból él,
 * ezért a szabályt az egész rétegre kimondjuk: minden domain modult importálnia
 * kell legalább egy tesztnek.
 *
 * Ez nem a lefedettség mérése; azt egy százalék nem is mondja meg. Azt fogja
 * meg, ami tipikusan történik: valaki új modult ír, a tesztet későbbre hagyja,
 * és az a későbbre soha nem jön el.
 */

import { describe, expect, it } from "vitest";
import { forrasok } from "./forrasok";

/**
 * Kivételek, indoklással. Ide csak olyan modul kerülhet, ami nem számol.
 *
 * - `szerzodes-modulok`: jogi szövegkatalógus. A szövegét a
 *   `szerzodes.test.ts` járja végig a szerződéskészítőn keresztül, mert
 *   önmagában egy modul szövegét ellenőrizni semmit nem mondana.
 */
const KIVETELEK = ["szerzodes-modulok"];

const FAJLOK = forrasok();

const TESZTEK = FAJLOK.filter((fajl) => fajl.utvonal.includes("__tests__/")).map(
  (fajl) => fajl.tartalom,
);

const DOMAIN_MODULOK = FAJLOK.filter(
  (fajl) => fajl.utvonal.startsWith("domain/") && !fajl.utvonal.includes("__tests__"),
).map((fajl) => fajl.utvonal.replace(/^domain\//, "").replace(/\.tsx?$/, ""));

function importalja(modul: string): boolean {
  const minta = new RegExp(`from\\s+["'](?:\\.\\./|@/domain/)${modul}["']`);
  return TESZTEK.some((tartalom) => minta.test(tartalom));
}

describe("teszteltség", () => {
  it("van mit ellenőrizni", () => {
    expect(DOMAIN_MODULOK.length).toBeGreaterThan(10);
    expect(TESZTEK.length).toBeGreaterThan(10);
  });

  it("minden domain modulhoz tartozik teszt", () => {
    const teszteletlen = DOMAIN_MODULOK.filter(
      (modul) => !KIVETELEK.includes(modul) && !importalja(modul),
    );
    expect(teszteletlen).toEqual([]);
  });

  it("a kivételek listája nem tartalmaz megszűnt modult", () => {
    const halott = KIVETELEK.filter((modul) => !DOMAIN_MODULOK.includes(modul));
    expect(halott).toEqual([]);
  });
});
