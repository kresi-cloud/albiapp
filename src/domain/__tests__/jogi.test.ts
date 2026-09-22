import { describe, expect, it } from "vitest";
import { KITOLTENDO, jogiOldal } from "../jogi";
import { NYELVEK } from "../nyelv";

describe("jogi tájékoztatók", () => {
  it("mindkét oldal megvan mindkét nyelven", () => {
    for (const nyelv of NYELVEK) {
      for (const fajta of ["adatkezeles", "feltetelek"] as const) {
        const oldal = jogiOldal(fajta, nyelv);
        expect(oldal.cim.length).toBeGreaterThan(0);
        expect(oldal.bevezeto.length).toBeGreaterThan(0);
        expect(oldal.szakaszok.length).toBeGreaterThan(0);
      }
    }
  });

  it("a két nyelv ugyanannyi szakaszból áll", () => {
    for (const fajta of ["adatkezeles", "feltetelek"] as const) {
      expect(jogiOldal(fajta, "en").szakaszok).toHaveLength(
        jogiOldal(fajta, "hu").szakaszok.length,
      );
    }
  });

  it("nincs cím vagy bekezdés nélküli szakasz", () => {
    for (const nyelv of NYELVEK) {
      for (const fajta of ["adatkezeles", "feltetelek"] as const) {
        for (const szakasz of jogiOldal(fajta, nyelv).szakaszok) {
          expect(szakasz.cim.trim()).not.toBe("");
          expect(szakasz.bekezdesek.length).toBeGreaterThan(0);
          for (const bekezdes of szakasz.bekezdesek) expect(bekezdes.trim()).not.toBe("");
        }
      }
    }
  });

  it("az üzemeltető adatai kitöltendőként maradnak, nem találjuk ki", () => {
    for (const nyelv of NYELVEK) {
      const szoveg = jogiOldal("adatkezeles", nyelv)
        .szakaszok.flatMap((szakasz) => szakasz.bekezdesek)
        .join("\n");
      expect(szoveg).toContain(KITOLTENDO);
    }
  });

  it("a feltételek kimondják, hogy az adóösszesítő nem bevallás", () => {
    expect(
      jogiOldal("feltetelek", "hu")
        .szakaszok.flatMap((szakasz) => szakasz.bekezdesek)
        .join("\n"),
    ).toContain("nem bevallás");
    expect(
      jogiOldal("feltetelek", "en")
        .szakaszok.flatMap((szakasz) => szakasz.bekezdesek)
        .join("\n"),
    ).toContain("not a return");
  });
});
