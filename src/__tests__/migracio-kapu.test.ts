/**
 * Migrációs kapu: az éles adatbázishoz semmi nem nyúl magától.
 *
 * Az éles adatbázisban valódi bérleti adat lesz: jogviszony, befizetés,
 * kiadott okirat, és mindez a másik félé is. Egy migráció, ami minden
 * beolvasztásból magától lefut, előbb-utóbb olyankor fut le, amikor senki nem
 * döntött róla — és amit egy elkattintott telepítés elvinne, azt nem hozza
 * vissza semmi.
 *
 * A megállapodás ezért az, hogy az éles adatbázishoz nyúlás **emberi döntés**:
 * a migrációs munkafolyamat csak kézzel indul, a fordítás nem futtat
 * migrációt, és példaadatot élesben soha nem töltünk be. Ez a kapu ezt a
 * három mondatot kéri számon a munkafolyamatok forrásán — mert egy
 * megállapodás, amit csak ember tart be, előbb-utóbb elkopik.
 *
 * A YAML-t szándékosan szövegként olvassuk: elemzőt csak áttételes
 * függőségként érnénk el, és egy kapu ne dőljön el attól, hogy egy csomag
 * verziója cserélődött.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MUNKAFOLYAMATOK = join(import.meta.dirname, "..", "..", ".github", "workflows");

function fajlok(): { nev: string; szoveg: string }[] {
  return readdirSync(MUNKAFOLYAMATOK)
    .filter((nev) => nev.endsWith(".yml") || nev.endsWith(".yaml"))
    .map((nev) => ({ nev, szoveg: readFileSync(join(MUNKAFOLYAMATOK, nev), "utf8") }));
}

/**
 * A megjegyzések nélküli szöveg: a kapu azt méri, ami lefut, nem azt, amit
 * leírtunk róla. A megjegyzés épp az a hely, ahol kimondjuk, mit **nem**
 * teszünk — azon egy szó szerinti keresés hamisan bukna el. A többi kapunk
 * ugyanezért olvas `megjegyzesNelkul`-t.
 */
function futoSorok(szoveg: string): string {
  return szoveg
    .split("\n")
    .filter((sor) => !/^\s*#/.test(sor))
    .join("\n");
}

/**
 * Az `on:` blokk indítói. A blokk a következő, nem beljebb kezdődő sornál ér
 * véget, tehát a nevekhez elég a két szóköz mély kulcsokat összeszedni.
 */
function inditok(szoveg: string): string[] {
  const sorok = szoveg.split("\n");
  const kezdet = sorok.findIndex((sor) => /^on:\s*$/.test(sor) || /^on:\s*\S/.test(sor));
  if (kezdet === -1) return [];
  // Egy soros alak: `on: [push]` vagy `on: push`.
  const egysoros = /^on:\s*(\S.*)$/.exec(sorok[kezdet])?.[1];
  if (egysoros) {
    return egysoros
      .replace(/[[\]]/g, "")
      .split(",")
      .map((nev) => nev.trim())
      .filter(Boolean);
  }
  const talalt: string[] = [];
  for (const sor of sorok.slice(kezdet + 1)) {
    if (/^\S/.test(sor)) break; // kiléptünk az `on:` blokkból
    const kulcs = /^ {2}([a-z_]+):/.exec(sor)?.[1];
    if (kulcs) talalt.push(kulcs);
  }
  return talalt;
}

/** Az a munkafolyamat, ami az éles adatbázis címét használja. */
function elesAdatbazist(szoveg: string): boolean {
  return futoSorok(szoveg).includes("SUPABASE_MIGRACIO_URL");
}

describe("migrációs kapu", () => {
  it("önpróba: az indítók kiolvasása tényleg megtalálja a pusholást", () => {
    // Egy kapu, ami mindenre igent mond, rosszabb a semminél.
    expect(inditok("on:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n")).toEqual([
      "push",
      "pull_request",
    ]);
    expect(inditok("on: [push]\n")).toEqual(["push"]);
    expect(inditok("on:\n  workflow_dispatch:\n    inputs:\n      a:\njobs:\n")).toEqual([
      "workflow_dispatch",
    ]);
  });

  it("van munkafolyamat, ami az éles adatbázishoz nyúl", () => {
    // Enélkül a következő állítás üres halmazra lenne igaz.
    expect(fajlok().filter((f) => elesAdatbazist(f.szoveg)).length).toBeGreaterThan(0);
  });

  it("az éles adatbázishoz nyúló munkafolyamat csak kézzel indul", () => {
    for (const fajl of fajlok()) {
      if (!elesAdatbazist(fajl.szoveg)) continue;
      expect(inditok(futoSorok(fajl.szoveg)), fajl.nev).toEqual(["workflow_dispatch"]);
    }
  });

  it("és megerősítést kér, mert a „Run workflow” egy kattintás", () => {
    for (const fajl of fajlok()) {
      if (!elesAdatbazist(fajl.szoveg)) continue;
      expect(futoSorok(fajl.szoveg), fajl.nev).toMatch(/inputs:/);
      expect(futoSorok(fajl.szoveg), fajl.nev).toMatch(/megerosites/);
    }
  });

  it("élesben nem töltünk be példaadatot", () => {
    for (const fajl of fajlok()) {
      if (!elesAdatbazist(fajl.szoveg)) continue;
      expect(futoSorok(fajl.szoveg), fajl.nev).not.toMatch(/db:seed|prisma\/seed/);
    }
  });

  it("a fordítás nem futtat migrációt", () => {
    // A `build`-nek generálnia kell (lásd a fordítási kaput), de migrálnia nem:
    // a Vercel minden pusholásból telepít, tehát ez minden beolvasztásból
    // átírná az éles adatbázist.
    const csomag = JSON.parse(
      readFileSync(join(import.meta.dirname, "..", "..", "package.json"), "utf8"),
    );
    for (const [nev, parancs] of Object.entries<string>(csomag.scripts ?? {})) {
      if (nev === "db:migrate") continue; // ez a fejlesztői `migrate dev`
      expect(parancs, nev).not.toMatch(/migrate\s+deploy/);
    }
  });
});
