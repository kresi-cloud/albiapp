/**
 * Formátumkapu.
 *
 * Magyar dátum, forint, ezres elválasztás — és mindenütt ugyanúgy. Ez akkor
 * tartható, ha egyetlen helyen formázunk. Amikor oldalanként hívtuk az `Intl`-t,
 * két baj lett belőle: a nyelvet könnyű volt elfelejteni (maradt a beégetett
 * "hu-HU" az angol felületen is), és az `Intl` nem törő szóköze bekerült a
 * kimásolható szövegekbe.
 */

import { describe, expect, it } from "vitest";
import { forrasok, megjegyzesNelkul } from "./forrasok";
import { forint, datum, szam } from "../domain/penz";
import { szamNyelven, forintNyelven, datumNyelven } from "../domain/nyelv";

/** Az egyetlen modul, ami közvetlenül formázhat. */
const FORMAZO = "domain/nyelv.ts";

const FAJLOK = forrasok();

function formazas(tartalom: string): string[] {
  return [...megjegyzesNelkul(tartalom).matchAll(/Intl\.\w+|\.toLocale\w*\(/g)].map(
    (talalat) => talalat[0],
  );
}

describe("formátum", () => {
  it("a kapu tényleg harap", () => {
    expect(formazas('new Intl.NumberFormat("hu-HU")')).toHaveLength(1);
    expect(formazas('ertek.toLocaleString("hu-HU")')).toHaveLength(1);
    expect(formazas("// Intl.NumberFormat a megjegyzésben")).toHaveLength(0);
  });

  it("csak a nyelvi modul formáz számot és dátumot", () => {
    const vetok = FAJLOK.filter(
      (fajl) =>
        fajl.utvonal !== FORMAZO &&
        !fajl.utvonal.includes("__tests__") &&
        formazas(fajl.tartalom).length > 0,
    ).map((fajl) => fajl.utvonal);
    expect(vetok).toEqual([]);
  });

  it("a forint magyar alakban, egész forintra jön", () => {
    expect(forint(180000).replace(/\s/g, " ")).toBe("180 000 Ft");
    expect(forint(-45000).replace(/\s/g, " ")).toBe("-45 000 Ft");
    // Magyar helyesírás: négyjegyű számot nem tagolunk, ötjegyűtől igen.
    expect(forint(1234.6).replace(/\s/g, " ")).toBe("1235 Ft");
  });

  it("a dátum magyar alakban jön", () => {
    expect(datum(new Date(Date.UTC(2026, 8, 20)))).toBe("2026. szept. 20.");
  });

  it("a tagolt szám nem tesz nem törő szóközt a szövegbe", () => {
    expect(szam(1234567, 0)).toBe("1 234 567");
    expect(szam(1234567, 0)).not.toMatch(/[  ]/);
    expect(szamNyelven(1234567, "en", 0)).toBe("1,234,567");
  });

  it("a nyelv váltásával a szám és a dátum alakja is vált", () => {
    expect(szamNyelven(12345.5, "hu")).toBe("12 345,5");
    expect(szamNyelven(12345.5, "en")).toBe("12,345.5");
    const nap = new Date(Date.UTC(2026, 8, 20));
    expect(datumNyelven(nap, "hu")).toBe("2026. szept. 20.");
    expect(datumNyelven(nap, "en")).toBe("20 Sept 2026");
    expect(forintNyelven(180000, "en").replace(/\s/g, " ")).toContain("180,000");
  });
});
