/**
 * Kétnyelvűségi kapu.
 *
 * A felület magyarul és angolul megy, a szöveg pedig a szótárban él. Ez addig
 * tartható, amíg a lapokon nincs beégetett mondat — és pont ez romlott el:
 * a bérlői út végig a szótáron ment, a bérbeadói lapok viszont beégetett magyar
 * sztringekkel dolgoztak, úgyhogy az angol felületen alig volt valami angolul.
 * Semmi nem szólt, mert minden szépen megjelent, csak magyarul.
 *
 * A kapu ezért a megjelenítő rétegben (`app`, `components`) magyar szöveget
 * keres: ékezetes betűt a kód részében. Nem tökéletes mérés — ékezet nélküli
 * magyar mondat átmegy rajta —, de a valódi hibát megfogja, és nem kell hozzá
 * nyelvfelismerés. Ami magyarul is helyes, annak a szótárban van a helye.
 *
 * A `domain` szándékosan nincs benne: a kiadott okiratok (szerződés,
 * jegyzőkönyv, igazolás, elszámolás) szövege és a jogi tájékoztatók magyarul
 * érvényesek, tehát magyarul is maradnak.
 */

import { describe, expect, it } from "vitest";
import { forrasok, megjegyzesNelkul } from "./forrasok";

const EKEZETEK = "áéíóöőúüűÁÉÍÓÖŐÚÜŰ";

/** A megjelenítő réteg: itt minden szöveg a szótárból jön. */
const VIZSGALT = ["app/", "components/"];

/**
 * Az adóösszesítő CSV-je a könyvelőnek megy, nem a felületre: annak a fejléce
 * és a szakaszai magyarul érvényesek, ezért az a lap a szótár magyar sorával
 * fogalmaz (`szovegekNyelvvel("hu")`), és beégetett magyar szöveget is tartalmaz.
 */
const KIVETELEK = ["app/ado/letoltes/route.ts"];

const FAJLOK = forrasok();

/** Az ékezetes betűt tartalmazó sorok, a megjegyzések nélküli kódból. */
export function magyarSorok(tartalom: string): string[] {
  return megjegyzesNelkul(tartalom)
    .split("\n")
    .filter((sor) => [...sor].some((betu) => EKEZETEK.includes(betu)))
    .map((sor) => sor.trim());
}

describe("kétnyelvűség", () => {
  it("a kapu tényleg harap", () => {
    expect(magyarSorok('<h1>Bérleti szerződés</h1>')).toHaveLength(1);
    expect(magyarSorok('return hiba("Ez a jogviszony nem a tiéd.");')).toHaveLength(1);
    // Ami a szótárból jön, az átmegy; a magyarázó megjegyzés is.
    expect(magyarSorok('<h1>{sz("dokumentumok.cim")}</h1>')).toHaveLength(0);
    expect(magyarSorok("// A bérlő a saját oldalát adja meg.")).toHaveLength(0);
  });

  it("a megjelenítő rétegben nincs beégetett magyar szöveg", () => {
    const vetok = FAJLOK.filter(
      (fajl) =>
        VIZSGALT.some((konyvtar) => fajl.utvonal.startsWith(konyvtar)) &&
        !KIVETELEK.includes(fajl.utvonal) &&
        !fajl.utvonal.includes("__tests__") &&
        magyarSorok(fajl.tartalom).length > 0,
    ).map((fajl) => `${fajl.utvonal}: ${magyarSorok(fajl.tartalom)[0]}`);

    expect(vetok).toEqual([]);
  });

  it("a kivétel szűk: egyetlen fájl, és az sem a felület", () => {
    expect(KIVETELEK).toEqual(["app/ado/letoltes/route.ts"]);
  });

  it("a szótár minden sora mindkét nyelven megvan", async () => {
    const { SZOTAR } = await import("../domain/szotar");
    const hianyos = Object.entries(SZOTAR)
      .filter(([, sor]) => !sor.hu?.trim() || !sor.en?.trim())
      .map(([kulcs]) => kulcs);

    expect(hianyos).toEqual([]);
  });

  it("az angol sor nem egyszerűen a magyar másolata", async () => {
    const { SZOTAR } = await import("../domain/szotar");
    // Néhány sor szándékosan azonos: rövidítés, jel, vagy olyan szöveg, ami a
    // magyar okiratba kerül. Ami ezen felül egyezik, az fordítatlanul maradt.
    const azonos = Object.entries(SZOTAR)
      .filter(([, sor]) => sor.hu === sor.en && [...sor.hu].some((b) => EKEZETEK.includes(b)))
      .map(([kulcs]) => kulcs);

    expect(azonos).toEqual(["dokumentumok.igazolas_cel_alap"]);
  });
});
