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
  csatornaArFiller: 0, // villanyhoz nincs csatornadíj
};

// Budapesti nagyságrend: 373 Ft/m3 ivóvíz és 426 Ft/m3 csatorna, sáv nélkül.
const VIZ: Dijszabas = {
  kedvezmenyesArFiller: 37300,
  piaciArFiller: 37300,
  evesKeret: null,
  alapdijFt: 0,
  csatornaArFiller: 42600,
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

describe("csatornadíj", () => {
  const nyito = { datum: new Date(Date.UTC(2026, 0, 1)), ertek: 240 };
  const zaro = { datum: new Date(Date.UTC(2026, 0, 31)), ertek: 252 };

  it("ugyanarra a mennyiségre számol, mint a vízdíj", () => {
    const eredmeny = merooratElszamol(nyito, zaro, VIZ, "m3");
    expect(eredmeny.fogyasztas).toBe(12);
    // 12 m3 × 373 Ft, illetve 12 m3 × 426 Ft.
    expect(eredmeny.osszegFt).toBe(4476);
    expect(eredmeny.csatornaFt).toBe(5112);
  });

  it("nulla ár mellett nincs csatornadíj és nincs róla sor", () => {
    // A locsolási mellékmérő esete: amit kiöntöttek a kertre, az nem megy
    // csatornába, tehát nincs mit elvezetni.
    const locsolo = { ...VIZ, csatornaArFiller: 0 };
    const eredmeny = merooratElszamol(nyito, zaro, locsolo, "m3");
    expect(eredmeny.csatornaFt).toBe(0);
    expect(eredmeny.csatornaReszletezes).toBeNull();
  });

  it("a részletezés kimondja, hogy a mért víz után jár", () => {
    const eredmeny = merooratElszamol(nyito, zaro, VIZ, "m3");
    expect(eredmeny.csatornaReszletezes).toContain("12 m3");
    expect(eredmeny.csatornaReszletezes).toContain("426 Ft");
  });

  it("visszafelé forgó óránál csatornadíjat sem számolunk", () => {
    const vissza = { datum: new Date(Date.UTC(2026, 0, 31)), ertek: 230 };
    const eredmeny = merooratElszamol(nyito, vissza, VIZ, "m3");
    expect(eredmeny.csatornaFt).toBe(0);
    expect(eredmeny.csatornaReszletezes).toBeNull();
  });

  it("külön tétel lesz belőle, és ugyanahhoz a mérőórához tartozik", () => {
    const elszamolas = elszamolastKeszit({
      idoszakKezdete: nyito.datum,
      idoszakVege: zaro.datum,
      meroorak: [
        {
          id: "vizora",
          megnevezes: "Víz",
          mertekegyseg: "m3",
          dijszabas: VIZ,
          nyito,
          zaro,
        },
      ],
    });
    expect(elszamolas.tetelek).toHaveLength(2);
    expect(elszamolas.tetelek[0].osszegFt).toBe(4476);
    expect(elszamolas.tetelek[1].megnevezes).toBe("Víz · csatornadíj");
    expect(elszamolas.tetelek[1].osszegFt).toBe(5112);
    expect(elszamolas.tetelek[1].merooraId).toBe("vizora");
    // Az adóösszesítő a fajtából tudja, hogy ez is mért fogyasztás, tehát
    // továbbhárítva nem bevétel.
    expect(elszamolas.tetelek[1].fajta).toBe("meroora");
    expect(elszamolas.osszegFt).toBe(4476 + 5112);
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
