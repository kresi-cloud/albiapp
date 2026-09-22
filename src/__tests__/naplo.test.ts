/**
 * Naplózási kapu.
 *
 * A megállapodás egyetlen mondata: személyes adat nem kerül naplóba. A naplót
 * üzemeltető olvassa, tárhelyszolgáltató tárolja, és hibakeresés közben senki
 * nem gondol arra, hogy a kiírt objektumban ott van az anyja neve.
 *
 * A kapu ezért nem azt nézi, mit írunk ki, hanem hogy kiírunk-e egyáltalán.
 * Ha egyszer tényleg kell naplózás, akkor egy erre való modul szűri a mezőket,
 * és ez a kapu azt az egy helyet engedi majd át.
 */

import { describe, expect, it } from "vitest";
import { forrasok, megjegyzesNelkul } from "./forrasok";

/** A dokumentumokhoz felvett személyes adatok mezőnevei. */
const SZEMELYES_MEZOK = [
  "szuletesiHely",
  "szuletesiIdo",
  "anyjaNeve",
  "igazolvanyszam",
  "adoazonosito",
  "bankszamla",
  "jelszoLenyomat",
  "jelszo",
  "telefon",
];

const FAJLOK = forrasok();

function konzolhivasok(tartalom: string): string[] {
  return [...megjegyzesNelkul(tartalom).matchAll(/console\.\w+\s*\(/g)].map(
    (talalat) => talalat[0],
  );
}

describe("naplózás", () => {
  it("a kapu tényleg harap", () => {
    expect(konzolhivasok('console.log("akármi")')).toHaveLength(1);
    expect(konzolhivasok("console.error(hiba)")).toHaveLength(1);
    expect(konzolhivasok('// console.log("megjegyzésben nem számít")')).toHaveLength(0);
  });

  it("a forrásban nincs konzolra írás", () => {
    // A kapuk maguk mondatokat vizsgálnak, amikben szerepel a `console` szó;
    // a tesztfájlok ezért kimaradnak.
    const vetok = FAJLOK.filter(
      (fajl) => !fajl.utvonal.includes("__tests__") && konzolhivasok(fajl.tartalom).length > 0,
    ).map((fajl) => fajl.utvonal);
    expect(vetok).toEqual([]);
  });

  it("személyes adat mezőneve nem kerül kiírt szövegbe", () => {
    // Ha valaki mégis naplózna, a mezőnév a kiírás közelében jelenne meg.
    const vetok = FAJLOK.filter((fajl) => !fajl.utvonal.includes("__tests__")).flatMap((fajl) =>
      megjegyzesNelkul(fajl.tartalom)
        .split("\n")
        .filter(
          (sor) =>
            /console\.\w+\s*\(/.test(sor) && SZEMELYES_MEZOK.some((mezo) => sor.includes(mezo)),
        )
        .map((sor) => `${fajl.utvonal}: ${sor.trim()}`),
    );
    expect(vetok).toEqual([]);
  });
});
