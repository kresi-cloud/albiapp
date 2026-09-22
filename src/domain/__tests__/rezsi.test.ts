import { describe, expect, it } from "vitest";
import {
  alapdijResz,
  elszamolastKeszit,
  ervenyesDijszabas,
  EV_NAPJAI,
  fogyasztas,
  keretAzIdoszakra,
  merooratElszamol,
  type Dijszabas,
} from "../rezsi";

// Nagyjából a magyar lakossági villanyárak: kedvezményes 36,90 Ft/kWh,
// fölötte piaci 70,10 Ft/kWh, éves keret 2523 kWh.
const VILLANY: Dijszabas = {
  kedvezmenyesArFiller: 3690,
  piaciArFiller: 7010,
  evesKeret: 2523,
  alapdijFt: 0,
};

const NYITO = { datum: new Date(Date.UTC(2026, 0, 1)), ertek: 1000 };

describe("fogyasztás", () => {
  it("a két óraállás különbsége", () => {
    expect(fogyasztas(NYITO, { datum: new Date(Date.UTC(2026, 1, 1)), ertek: 1180 })).toBe(180);
  });
});

describe("keretAzIdoszakra", () => {
  it("az éves keretet a napokra arányosítja", () => {
    expect(keretAzIdoszakra(EV_NAPJAI, 30)).toBeCloseTo(30, 6);
    expect(keretAzIdoszakra(2523, 31)).toBeCloseTo((2523 * 31) / 365, 6);
  });

  it("keret nélkül nincs sáv", () => {
    expect(keretAzIdoszakra(null, 30)).toBeNull();
  });
});

describe("alapdijResz", () => {
  it("a havi alapdíjat napra bontja", () => {
    expect(alapdijResz(1200, 365)).toBe(14400);
    expect(alapdijResz(1200, 30)).toBe(Math.round((1200 * 12 * 30) / 365));
  });

  it("nulla alapdíjból nulla lesz", () => {
    expect(alapdijResz(0, 30)).toBe(0);
  });
});

describe("merooratElszamol", () => {
  it("a kereten belüli fogyasztást kedvezményes áron számolja", () => {
    const eredmeny = merooratElszamol(
      NYITO,
      { datum: new Date(Date.UTC(2026, 0, 31)), ertek: 1180 },
      VILLANY,
      "kWh",
    );
    expect(eredmeny.fogyasztas).toBe(180);
    expect(eredmeny.piaciEgyseg).toBe(0);
    expect(eredmeny.osszegFt).toBe(Math.round((180 * 3690) / 100));
    expect(eredmeny.reszletezes).toContain("kedvezményes");
  });

  it("a keret fölötti részt piaci áron számolja, és ezt le is írja", () => {
    // 30 napra a keret 2523 * 30 / 365 = 207,4 kWh; a fogyasztás 300 kWh.
    const eredmeny = merooratElszamol(
      NYITO,
      { datum: new Date(Date.UTC(2026, 0, 31)), ertek: 1300 },
      VILLANY,
      "kWh",
    );
    const keret = (2523 * 30) / 365;
    expect(eredmeny.kedvezmenyesEgyseg).toBeCloseTo(keret, 6);
    expect(eredmeny.piaciEgyseg).toBeCloseTo(300 - keret, 6);
    expect(eredmeny.osszegFt).toBe(
      Math.round((keret * 3690 + (300 - keret) * 7010) / 100),
    );
    expect(eredmeny.reszletezes).toContain("piaci áron");
  });

  it("keret nélkül minden egység a kedvezményes áron megy", () => {
    const eredmeny = merooratElszamol(
      NYITO,
      { datum: new Date(Date.UTC(2026, 0, 31)), ertek: 1300 },
      { ...VILLANY, evesKeret: null },
      "kWh",
    );
    expect(eredmeny.piaciEgyseg).toBe(0);
    expect(eredmeny.osszegFt).toBe(Math.round((300 * 3690) / 100));
  });

  it("az alapdíjat hozzáadja, és külön is megmutatja", () => {
    const eredmeny = merooratElszamol(
      NYITO,
      { datum: new Date(Date.UTC(2026, 0, 31)), ertek: 1180 },
      { ...VILLANY, alapdijFt: 900 },
      "kWh",
    );
    expect(eredmeny.alapdijReszFt).toBe(alapdijResz(900, 30));
    expect(eredmeny.osszegFt).toBe(Math.round((180 * 3690) / 100) + alapdijResz(900, 30));
    expect(eredmeny.reszletezes).toContain("Alapdíj");
  });

  it("a visszafelé álló órára nem számol fogyasztást, hanem szól", () => {
    const eredmeny = merooratElszamol(
      NYITO,
      { datum: new Date(Date.UTC(2026, 0, 31)), ertek: 900 },
      VILLANY,
      "kWh",
    );
    expect(eredmeny.fogyasztas).toBe(0);
    expect(eredmeny.osszegFt).toBe(0);
    expect(eredmeny.reszletezes).toContain("Nézd meg az óraállásokat");
  });

  it("azonos nyitó és záró állásnál nulla a fogyasztás", () => {
    const eredmeny = merooratElszamol(
      NYITO,
      { datum: new Date(Date.UTC(2026, 0, 31)), ertek: 1000 },
      VILLANY,
      "kWh",
    );
    expect(eredmeny.fogyasztas).toBe(0);
    expect(eredmeny.osszegFt).toBe(0);
  });
});

describe("elszamolastKeszit", () => {
  const bemenet = {
    idoszakKezdete: new Date(Date.UTC(2026, 0, 1)),
    idoszakVege: new Date(Date.UTC(2026, 0, 31)),
    meroorak: [
      {
        id: "villanyora",
        megnevezes: "Villany",
        mertekegyseg: "kWh",
        dijszabas: VILLANY,
        nyito: NYITO,
        zaro: { datum: new Date(Date.UTC(2026, 0, 31)), ertek: 1180 },
      },
    ],
    kozosKoltsegFt: 14000,
  };

  it("minden tételt felvesz, és az összeg a tételek összege", () => {
    const elszamolas = elszamolastKeszit(bemenet);
    expect(elszamolas.tetelek).toHaveLength(2);
    expect(elszamolas.osszegFt).toBe(
      elszamolas.tetelek.reduce((osszeg, tetel) => osszeg + tetel.osszegFt, 0),
    );
    expect(elszamolas.napok).toBe(30);
  });

  it("az átalányt és a közös költséget a napokra arányosítja", () => {
    const elszamolas = elszamolastKeszit({ ...bemenet, atalanyFt: 30000 });
    const atalany = elszamolas.tetelek.find((tetel) => tetel.fajta === "atalany");
    expect(atalany?.osszegFt).toBe(Math.round((30000 * 12 * 30) / 365));
    expect(atalany?.reszletezes).toContain("30 napra");
  });

  it("nulla átalányból és nulla közös költségből nem lesz tétel", () => {
    const elszamolas = elszamolastKeszit({
      ...bemenet,
      atalanyFt: 0,
      kozosKoltsegFt: 0,
    });
    expect(elszamolas.tetelek.map((tetel) => tetel.fajta)).toEqual(["meroora"]);
  });

  it("mérőóra nélkül is elszámol, ha van átalány", () => {
    const elszamolas = elszamolastKeszit({
      idoszakKezdete: bemenet.idoszakKezdete,
      idoszakVege: bemenet.idoszakVege,
      meroorak: [],
      atalanyFt: 25000,
    });
    expect(elszamolas.tetelek).toHaveLength(1);
    expect(elszamolas.osszegFt).toBeGreaterThan(0);
  });
});

describe("ervenyesDijszabas", () => {
  const regi = { ervenyesTol: new Date(Date.UTC(2025, 0, 1)), nev: "régi" };
  const uj = { ervenyesTol: new Date(Date.UTC(2026, 0, 1)), nev: "új" };

  it("a napon érvényes, legfrissebb díjszabást adja", () => {
    expect(ervenyesDijszabas([regi, uj], new Date(Date.UTC(2026, 5, 1)))?.nev).toBe("új");
    expect(ervenyesDijszabas([regi, uj], new Date(Date.UTC(2025, 5, 1)))?.nev).toBe("régi");
  });

  it("a kezdőnapon már érvényes", () => {
    expect(ervenyesDijszabas([uj], new Date(Date.UTC(2026, 0, 1)))?.nev).toBe("új");
  });

  it("ha egyik sem érvényes még, nincs díjszabás", () => {
    expect(ervenyesDijszabas([uj], new Date(Date.UTC(2025, 5, 1)))).toBeNull();
  });
});
