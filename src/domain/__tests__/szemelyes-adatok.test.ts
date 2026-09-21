import { describe, expect, it } from "vitest";
import {
  BERBEADOHOZ_KELL,
  BERLOHOZ_KELL,
  adatokTeljesek,
  adoazonositoGyanus,
  hianyUzenete,
  hianyzoMezok,
  igazolvanyGyanus,
  keszultseg,
  type SzemelyesAdatok,
} from "../szemelyes-adatok";

const TELJES: SzemelyesAdatok = {
  nev: "Példa Anna",
  szuletesiHely: "Debrecen",
  szuletesiIdo: new Date(Date.UTC(1998, 5, 14)),
  anyjaNeve: "Példa Katalin",
  lakcim: "4026 Debrecen, Minta tér 8.",
  igazolvanySzam: "111111BB",
  bankszamla: "00000000-00000000-00000000",
};

describe("hianyzoMezok", () => {
  it("a teljes adatlapból semmi nem hiányzik", () => {
    expect(hianyzoMezok(TELJES, BERLOHOZ_KELL)).toEqual([]);
    expect(adatokTeljesek(TELJES, BERLOHOZ_KELL)).toBe(true);
  });

  it("az üres adatlapból minden hiányzik, a megadott sorrendben", () => {
    expect(hianyzoMezok({}, BERLOHOZ_KELL)).toEqual([...BERLOHOZ_KELL]);
  });

  it("a csupa szóköz nem számít kitöltöttnek", () => {
    const adatok = { ...TELJES, anyjaNeve: "   " };
    expect(hianyzoMezok(adatok, BERLOHOZ_KELL)).toEqual(["anyjaNeve"]);
  });

  it("az érvénytelen dátum nem számít kitöltöttnek", () => {
    const adatok = { ...TELJES, szuletesiIdo: new Date("nem dátum") };
    expect(hianyzoMezok(adatok, BERLOHOZ_KELL)).toEqual(["szuletesiIdo"]);
  });

  it("a bérbeadónál a bankszámla is kell, a bérlőnél nem", () => {
    const bankszamlaNelkul = { ...TELJES, bankszamla: null };
    expect(hianyzoMezok(bankszamlaNelkul, BERLOHOZ_KELL)).toEqual([]);
    expect(hianyzoMezok(bankszamlaNelkul, BERBEADOHOZ_KELL)).toEqual(["bankszamla"]);
  });

  it("a telefonszám egyik listában sincs: kapcsolattartáshoz kell, azonosításhoz nem", () => {
    expect(BERLOHOZ_KELL).not.toContain("telefon");
    expect(BERBEADOHOZ_KELL).not.toContain("telefon");
  });
});

describe("keszultseg", () => {
  it("megszámolja, mennyi van meg", () => {
    expect(keszultseg(TELJES, BERLOHOZ_KELL)).toEqual({ megvan: 6, osszesen: 6 });
    expect(keszultseg({}, BERLOHOZ_KELL)).toEqual({ megvan: 0, osszesen: 6 });
    expect(keszultseg({ nev: "Példa Anna" }, BERLOHOZ_KELL)).toEqual({
      megvan: 1,
      osszesen: 6,
    });
  });
});

describe("hianyUzenete", () => {
  it("nincs üzenet, ha nincs hiány", () => {
    expect(hianyUzenete([])).toBeNull();
  });

  it("kulcsot ad vissza, nem kész mondatot", () => {
    expect(hianyUzenete(["nev", "lakcim"])).toEqual({
      kulcs: "adatok.hianyzik",
      adatok: { darab: 2 },
    });
  });
});

describe("igazolvanyGyanus", () => {
  it("az üreset nem kifogásolja: a hiány nem hiba, csak hiány", () => {
    expect(igazolvanyGyanus("")).toBe(false);
    expect(igazolvanyGyanus("   ")).toBe(false);
  });

  it("átengedi a szokásos alakokat", () => {
    expect(igazolvanyGyanus("111111BB")).toBe(false);
    expect(igazolvanyGyanus("AB1234567")).toBe(false);
    expect(igazolvanyGyanus("123456AA")).toBe(false);
  });

  it("kiszűri a túl rövidet és a számjegy nélkülit", () => {
    expect(igazolvanyGyanus("AB12")).toBe(true);
    expect(igazolvanyGyanus("nincsnalam")).toBe(true);
  });
});

describe("adoazonositoGyanus", () => {
  it("az üreset átengedi: külföldi bérlőnek nincs is ilyenje", () => {
    expect(adoazonositoGyanus("")).toBe(false);
  });

  it("tíz számjegyet vár, a szóközöket figyelmen kívül hagyja", () => {
    expect(adoazonositoGyanus("8123456789")).toBe(false);
    expect(adoazonositoGyanus("812 345 6789")).toBe(false);
  });

  it("kiszűri a rossz hosszt és a betűt", () => {
    expect(adoazonositoGyanus("12345")).toBe(true);
    expect(adoazonositoGyanus("81234567890")).toBe(true);
    expect(adoazonositoGyanus("8123456A89")).toBe(true);
  });
});
