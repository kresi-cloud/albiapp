/**
 * Rendezéskapu.
 *
 * Postgresen azonos rendezőkulcsú sorok sorrendje nincs garantálva: ugyanaz a
 * lekérdezés két futásra másik sorrendet adhat vissza. SQLite-on ez rejtve
 * maradt, mert ott a beszúrás sorrendje döntött, és stabilnak *látszott*.
 *
 * Nálunk a holtverseny nem ritka kivétel, hanem a rendes eset: egy hónap
 * előírásai ugyanazon a napon esedékesek, a példaadat jogviszonyai ugyanabban
 * az ezredmásodpercben jönnek létre, és a `take: 1` lekérdezések pont a
 * holtversenyből választanak egyet. Ebből lett egy valódi hiba is: a
 * befizetések lapja ugyanazt az utalást hol a bérleti díjhoz, hol egy
 * ezerforintos előfizetéshez kötötte.
 *
 * Ezért minden rendezés utolsó kulcsa az `id`. Az irány az elsődleges kulcsét
 * követi: egy „legutóbbi" lekérdezésnél a holtversenyből is a legutóbbi kell.
 */

import { describe, expect, it } from "vitest";
import { forrasok, megjegyzesNelkul } from "./forrasok";

const FAJLOK = forrasok();

/** Minden `orderBy: ...` érték a fájlban, megjegyzések nélkül. */
function rendezesek(tartalom: string): string[] {
  const kod = megjegyzesNelkul(tartalom);
  return [
    // Tömbös alak: orderBy: [{ ... }, { ... }]
    ...[...kod.matchAll(/orderBy:\s*(\[(?:\s*\{[^{}]*\}\s*,?)+\])/g)].map((t) => t[1]),
    // Egyelemes alak: orderBy: { ... }
    ...[...kod.matchAll(/orderBy:\s*(\{[^{}]*\})/g)].map((t) => t[1]),
  ];
}

/** Az a rendezés a jó, aminek az utolsó kulcsa az `id`. */
function hianyosak(tartalom: string): string[] {
  return rendezesek(tartalom).filter((rendezes) => !/\{\s*id:\s*"(asc|desc)"\s*\}\s*\]$/.test(rendezes));
}

describe("rendezés", () => {
  it("a kapu tényleg harap", () => {
    expect(hianyosak('orderBy: { esedekesseg: "asc" }')).toHaveLength(1);
    expect(hianyosak('orderBy: [{ esedekesseg: "asc" }, { osszegFt: "asc" }]')).toHaveLength(1);
    expect(hianyosak('orderBy: [{ esedekesseg: "asc" }, { id: "asc" }]')).toHaveLength(0);
    expect(hianyosak('orderBy: [{ kuldve: "desc" }, { id: "desc" }]')).toHaveLength(0);
    expect(hianyosak('// orderBy: { esedekesseg: "asc" }')).toHaveLength(0);
  });

  it("minden rendezés az id-vel zárul", () => {
    const vetok = FAJLOK.filter((fajl) => !fajl.utvonal.includes("__tests__")).flatMap((fajl) =>
      hianyosak(fajl.tartalom).map((rendezes) => `${fajl.utvonal}: ${rendezes}`),
    );
    expect(vetok).toEqual([]);
  });
});
