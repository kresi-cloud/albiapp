/**
 * Az angol változat építőkövei.
 *
 * A fordítás tájékoztató, de a szám és a dátum benne is adat, nem stílus: aki a
 * két példányt egymás mellé teszi, ugyanazt az összeget és ugyanazt a napot kell
 * lássa. Ezért a betűs alak és a dátum ugyanúgy tesztelt, mint a magyar oldalon.
 */

import { describe, expect, it } from "vitest";
import {
  betuvelEn,
  felSzovegEn,
  hosszuDatumEn,
  nevsorEn,
  osszegSzovegEn,
  tagoltEn,
} from "../szerzodes-angol";
import { MODULOK_EN } from "../szerzodes-modulok-en";

describe("angol dátum", () => {
  it("napot, hónapnevet és évet ír, a félreolvashatatlan sorrendben", () => {
    expect(hosszuDatumEn(new Date(Date.UTC(2026, 7, 29)))).toBe("29 August 2026");
    expect(hosszuDatumEn(new Date(Date.UTC(2027, 0, 1)))).toBe("1 January 2027");
  });

  it("UTC szerint olvassa a napot, nem helyi idő szerint", () => {
    expect(hosszuDatumEn(new Date(Date.UTC(2026, 11, 31)))).toBe("31 December 2026");
  });
});

describe("összeg angolul", () => {
  it("a betűs alak a magyar tagolást követi, angol szavakkal", () => {
    expect(betuvelEn(0)).toBe("zero");
    expect(betuvelEn(7)).toBe("seven");
    expect(betuvelEn(15)).toBe("fifteen");
    expect(betuvelEn(42)).toBe("forty-two");
    expect(betuvelEn(150000)).toBe("one hundred fifty thousand");
    expect(betuvelEn(300000)).toBe("three hundred thousand");
    expect(betuvelEn(7990)).toBe("seven thousand nine hundred ninety");
    expect(betuvelEn(1_214_000)).toBe("one million two hundred fourteen thousand");
  });

  it("értelmetlen összegre üreset ad, nem tippel", () => {
    expect(betuvelEn(-1)).toBe("");
    expect(betuvelEn(Number.NaN)).toBe("");
  });

  it("az ezres tagolás az angol szokás szerinti", () => {
    expect(tagoltEn(1234567)).toBe("1,234,567");
  });

  it("a szerződéses alak a számot és a betűs alakot is hozza", () => {
    expect(osszegSzovegEn(150000)).toBe(
      "HUF 150,000, in words: one hundred fifty thousand forints",
    );
  });
});

describe("felek angolul", () => {
  it("a hiányzó adatot kihagyja, nem tippeli meg", () => {
    expect(felSzovegEn({ nev: "Anna Toth" })).toBe("Anna Toth");
    expect(felSzovegEn({ nev: "Anna Toth", lakcim: "2463 Tordas, Pelda street 7." })).toBe(
      "Anna Toth (permanent address: 2463 Tordas, Pelda street 7.)",
    );
  });

  it("a születési adat helyet és napot is kiír", () => {
    expect(
      felSzovegEn({
        nev: "Anna Toth",
        szuletesiHely: "Budapest",
        szuletesiIdo: new Date(Date.UTC(2006, 9, 25)),
      }),
    ).toBe("Anna Toth (place and date of birth: Budapest, 25 October 2006)");
  });

  it("a nevsor angolul „and”-del zár", () => {
    expect(nevsorEn([])).toBe("");
    expect(nevsorEn(["Anna"])).toBe("Anna");
    expect(nevsorEn(["Anna", "Tamas"])).toBe("Anna and Tamas");
    expect(nevsorEn(["Anna", "Tamas", "Bela"])).toBe("Anna, Tamas and Bela");
  });
});

describe("angol modulkatalógus", () => {
  it("minden bejegyzésnek van címe és szövegfüggvénye", () => {
    for (const [kulcs, modul] of Object.entries(MODULOK_EN)) {
      expect(modul.cim.trim(), kulcs).not.toBe("");
      expect(typeof modul.szoveg, kulcs).toBe("function");
    }
  });
});
