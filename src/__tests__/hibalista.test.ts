/**
 * Hibalista-kapu: a felhasználónak szánt felsorolásba nem kerülhet mezőnév.
 *
 * Az űrlapok eredménye három részből áll: `uzenet` a mondat, `hibak` a
 * felsorolás alatta, és — ahol kell — egy külön mező arra, hogy a hiba melyik
 * beviteli mezőre vonatkozik (`mezok` az ingatlanoknál, `mezo` a szerződésnél).
 * Az első kettőt az `Uzenetsav` kiírja, a harmadikat nem: az csak megjelöl.
 *
 * A két fogalom egy ideig egy mezőben lakott, és a vége az lett, hogy élesben a
 * figyelmeztetés alatt egy pont azt írta, hogy „adoazonosito". A felhasználónak
 * a mezők belső neve semmit nem jelent, és nem is az ő dolga; ráadásul a
 * felsorolás a kétnyelvű felület egyetlen olyan helye volt, ahol magyarul és
 * angolul is ugyanaz az angolos-magyaros azonosító állt, mert a szótáron nem
 * ment át.
 *
 * A szabály tehát: a `hibak` minden eleme a szótárból jön (`sz`, `u`, vagy egy
 * ilyenekből képzett lista). Karakterlánc-irodalom nem kerülhet bele.
 *
 * Ezt sem a típusellenőrzés, sem a fordítás nem fogja meg: mindkettő szerint
 * `string[]` az is, amiben mezőnév van. A böngészős próba (`proba/urlap.mjs`)
 * a másik felét méri, a kiadott lapon: ott a figyelmeztetés alatt nem állhat
 * mezőnév.
 */

import { describe, expect, it } from "vitest";
import { forrasok, megjegyzesNelkul } from "./forrasok";

/**
 * Egy kifejezés a szövegben, a `kezdet` indextől a legkülső vessző, záró
 * zárójel vagy kapcsos zárójel előtti pontig. A zárójeleket számolja, mert a
 * `hiba(u(baj), [...])` és a `kifogasok.map((k) => u(k.uzenet))` alakban is van
 * belső vessző és zárójel.
 */
function kifejezes(szoveg: string, kezdet: number): string {
  let melyseg = 0;
  for (let hol = kezdet; hol < szoveg.length; hol += 1) {
    const jel = szoveg[hol];
    if (jel === "(" || jel === "[" || jel === "{") melyseg += 1;
    else if (jel === ")" || jel === "]" || jel === "}") {
      if (melyseg === 0) return szoveg.slice(kezdet, hol);
      melyseg -= 1;
    } else if (jel === "," && melyseg === 0) return szoveg.slice(kezdet, hol);
  }
  return szoveg.slice(kezdet);
}

/** Minden olyan kifejezés egy fájlból, ami a hibalistába kerül. */
export function hibalistak(tartalom: string): string[] {
  const kod = megjegyzesNelkul(tartalom);
  const talalt: string[] = [];

  // 1. `hibak: <kifejezés>` — a tárgyként összeállított eredmény.
  for (const egyezes of kod.matchAll(/\bhibak:\s*/g)) {
    const kezdet = (egyezes.index ?? 0) + egyezes[0].length;
    const ertek = kifejezes(kod, kezdet).trim();
    // A típus deklarációja nem érték.
    if (ertek.startsWith("string[]")) continue;
    talalt.push(ertek);
  }

  // 2. A `hiba(uzenet, <kifejezés>)` segédfüggvény második paramétere: minden
  // ilyen fájlban az megy a hibalistába.
  for (const egyezes of kod.matchAll(/\bhiba\(/g)) {
    let hol = (egyezes.index ?? 0) + egyezes[0].length;
    const elso = kifejezes(kod, hol);
    hol += elso.length;
    if (kod[hol] !== ",") continue;
    const masodik = kifejezes(kod, hol + 1).trim();
    if (masodik === "") continue;
    talalt.push(masodik);
  }

  return talalt;
}

/** A megnevezett függvény hívásai a szövegből, a zárójelekkel együtt, kivéve. */
function hivasNelkul(szoveg: string, nev: string): string {
  let eredmeny = szoveg;
  for (;;) {
    const hol = eredmeny.search(new RegExp(`\\b${nev}\\(`));
    if (hol === -1) return eredmeny;
    const kezdet = eredmeny.indexOf("(", hol);
    let melyseg = 0;
    let vege = -1;
    for (let i = kezdet; i < eredmeny.length; i += 1) {
      if (eredmeny[i] === "(") melyseg += 1;
      else if (eredmeny[i] === ")") {
        melyseg -= 1;
        if (melyseg === 0) {
          vege = i;
          break;
        }
      }
    }
    if (vege === -1) return eredmeny.slice(0, hol);
    eredmeny = eredmeny.slice(0, hol) + eredmeny.slice(vege + 1);
  }
}

/**
 * Mezőnév: a listában karakterlánc-irodalom áll, nem a szótárból jött mondat.
 *
 * A szótárhívásokat egészben vesszük ki, a paramétereikkel együtt: a
 * `sz("kulcs", { nev })` alakban a kulcs és a behelyettesítendő adat is
 * idézőjelek közt lehet, és az nem mezőnév, hanem épp a szótáron átment mondat.
 * Ami ezek után is idézőjeles, az kézzel beírt szöveg — tehát vagy mezőnév,
 * vagy egy mondat, ami nem ment át a szótáron: egyik sem kerülhet a listába.
 */
export function mezonevetIr(ertek: string): boolean {
  let maradek = ertek;
  for (const nev of ["sz", "u", "uzenet"]) maradek = hivasNelkul(maradek, nev);
  return /["'`]/.test(maradek);
}

const FORRASOK = forrasok().filter((f) => f.utvonal.startsWith("app/"));

describe("hibalista-kapu", () => {
  it("önpróba: a tiltott alakot tényleg megfogja", () => {
    // Egy kapu, ami mindenre igent mond, rosszabb a semminél. Az első kettő
    // pontosan az, ami élesben előjött.
    expect(mezonevetIr('["adoazonosito"]')).toBe(true);
    expect(mezonevetIr('kifogasok.map((kifogas) => kifogas.mezo)')).toBe(false);
    expect(mezonevetIr("[]")).toBe(false);
    expect(mezonevetIr("hibak.map(u)")).toBe(false);
    expect(mezonevetIr('kifogasok.map((k) => u(k.uzenet))')).toBe(false);
  });

  it("önpróba: a szótárból jött mondat átmegy, akkor is, ha kulcsot hordoz", () => {
    expect(mezonevetIr('[sz("jegyzokonyv.hiba.olvashatatlan")]')).toBe(false);
    expect(mezonevetIr('olvashatatlan.map((nev) => sz("jegyzokonyv.hiba.olvashatatlan", { nev }))')).toBe(
      false,
    );
  });

  it("önpróba: a hibalistát a többsoros és beágyazott alakban is megtalálja", () => {
    const minta = [
      'function hiba(uzenet: string, hibak: string[] = []) {}',
      'const a = hiba(u(baj), ["kep"]);',
      'const b = { allapot: "hiba", uzenet: sz("x"), hibak: kifogasok.map(u) };',
      'const c = hiba(sz("y"));',
    ].join("\n");
    const listak = hibalistak(minta);
    expect(listak).toContain('["kep"]');
    expect(listak).toContain("kifogasok.map(u)");
    // A `hiba(sz("y"))` egyetlen paraméterű: abból nem lesz lista.
    expect(listak.filter((ertek) => ertek.includes('sz("y")'))).toEqual([]);
  });

  it("van mit mérni: a lapok állítanak össze hibalistát", () => {
    // Enélkül a következő állítás üres halmazra lenne igaz.
    const darab = FORRASOK.reduce((osszeg, f) => osszeg + hibalistak(f.tartalom).length, 0);
    expect(darab).toBeGreaterThan(10);
  });

  it("a hibalistába nem kerül mezőnév", () => {
    const vetkesek: string[] = [];
    for (const forras of FORRASOK) {
      for (const ertek of hibalistak(forras.tartalom)) {
        if (mezonevetIr(ertek)) vetkesek.push(`${forras.utvonal}: ${ertek.replace(/\s+/g, " ")}`);
      }
    }
    expect(vetkesek).toEqual([]);
  });
});
