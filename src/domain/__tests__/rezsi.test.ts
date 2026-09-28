import { describe, expect, it } from "vitest";
import {
  alapdijResz,
  elszamolastKeszit,
  haviAranyos,
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

describe("haviAranyos", () => {
  // Ez a mérés arról szól, ami korábban nem volt igaz: a 365/12 napos
  // átlaghónapból egy teljes hónapra sem jött ki a havi díj.
  it("egy teljes naptári hónapra pontosan a havi díj jár", () => {
    const honapok = [
      [new Date(Date.UTC(2026, 8, 1)), new Date(Date.UTC(2026, 9, 1))], // 30 napos
      [new Date(Date.UTC(2026, 0, 1)), new Date(Date.UTC(2026, 1, 1))], // 31 napos
      [new Date(Date.UTC(2026, 1, 1)), new Date(Date.UTC(2026, 2, 1))], // 28 napos
      [new Date(Date.UTC(2024, 1, 1)), new Date(Date.UTC(2024, 2, 1))], // szökőév
    ];
    for (const [tol, ig] of honapok) {
      expect(haviAranyos(10000, tol, ig)).toBe(10000);
    }
  });

  it("egy teljes évre tizenkét havi díj", () => {
    expect(
      haviAranyos(10000, new Date(Date.UTC(2026, 0, 1)), new Date(Date.UTC(2027, 0, 1))),
    ).toBe(120000);
  });

  it("töredékhónapot a hónap tényleges napjaival arányosít", () => {
    // Szeptember 1–30. huszonkilenc nap a harmincból, nem 29/30,42.
    expect(
      haviAranyos(10000, new Date(Date.UTC(2026, 8, 1)), new Date(Date.UTC(2026, 8, 30))),
    ).toBe(Math.round((10000 * 29) / 30));
    // Február 15-től március 15-ig: fél február és fél március, nem egy hónap.
    expect(
      haviAranyos(30000, new Date(Date.UTC(2026, 1, 15)), new Date(Date.UTC(2026, 2, 15))),
    ).toBe(Math.round(30000 * (14 / 28 + 14 / 31)));
  });

  it("üres és visszafelé forduló időszakra nulla", () => {
    const nap = new Date(Date.UTC(2026, 8, 1));
    expect(haviAranyos(10000, nap, nap)).toBe(0);
    expect(haviAranyos(10000, new Date(Date.UTC(2026, 8, 5)), nap)).toBe(0);
  });

  it("nulla díjból nulla lesz", () => {
    expect(
      haviAranyos(0, new Date(Date.UTC(2026, 8, 1)), new Date(Date.UTC(2026, 9, 1))),
    ).toBe(0);
  });
});

describe("alapdijResz", () => {
  it("a havi alapdíjat a két leolvasás közti naptári hónapokkal arányosítja", () => {
    expect(
      alapdijResz(1200, new Date(Date.UTC(2026, 0, 1)), new Date(Date.UTC(2027, 0, 1))),
    ).toBe(14400);
    expect(
      alapdijResz(1200, new Date(Date.UTC(2026, 8, 1)), new Date(Date.UTC(2026, 9, 1))),
    ).toBe(1200);
  });

  it("nulla alapdíjból nulla lesz", () => {
    expect(
      alapdijResz(0, new Date(Date.UTC(2026, 8, 1)), new Date(Date.UTC(2026, 9, 1))),
    ).toBe(0);
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
    const alapdij = alapdijResz(900, NYITO.datum, new Date(Date.UTC(2026, 0, 31)));
    expect(eredmeny.alapdijReszFt).toBe(alapdij);
    expect(eredmeny.osszegFt).toBe(Math.round((180 * 3690) / 100) + alapdij);
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
  };

  it("minden tételt felvesz, és az összeg a tételek összege", () => {
    const elszamolas = elszamolastKeszit(bemenet);
    expect(elszamolas.tetelek).toHaveLength(1);
    expect(elszamolas.osszegFt).toBe(
      elszamolas.tetelek.reduce((osszeg, tetel) => osszeg + tetel.osszegFt, 0),
    );
    expect(elszamolas.napok).toBe(30);
  });

  /**
   * Ez a mérés a kettős terhelésről szól. A rezsiátalány és a közös költség
   * havi előírás; amíg az elszámolás is sort csinált belőlük, a bérlő ugyanazt
   * kétszer fizette, és az adóösszesítő is kétszer számolta bevételnek.
   */
  it("csak mért fogyasztás kerül bele: átalány és közös költség nem", () => {
    const elszamolas = elszamolastKeszit(bemenet);
    expect(elszamolas.tetelek.map((tetel) => tetel.fajta)).toEqual(["meroora"]);
  });

  it("mérőóra nélkül nincs mit elszámolni", () => {
    const elszamolas = elszamolastKeszit({
      idoszakKezdete: bemenet.idoszakKezdete,
      idoszakVege: bemenet.idoszakVege,
      meroorak: [],
    });
    expect(elszamolas.tetelek).toEqual([]);
    expect(elszamolas.osszegFt).toBe(0);
  });

  it("a csatornadíj külön sor, ugyanarra a köbméterre", () => {
    const elszamolas = elszamolastKeszit({
      ...bemenet,
      meroorak: [
        {
          id: "vizora",
          megnevezes: "Víz",
          mertekegyseg: "m3",
          dijszabas: VIZ,
          nyito: { datum: NYITO.datum, ertek: 200 },
          zaro: { datum: new Date(Date.UTC(2026, 0, 31)), ertek: 210 },
        },
      ],
    });
    expect(elszamolas.tetelek).toHaveLength(2);
    expect(elszamolas.tetelek[1].megnevezes).toContain("csatornadíj");
    expect(elszamolas.tetelek[1].mennyiseg).toBe(10);
  });
});

describe("ervenyesDijszabas", () => {
  const regi = { ervenyesTol: new Date(Date.UTC(2025, 0, 1)), nev: "régi" };
  const uj = { ervenyesTol: new Date(Date.UTC(2026, 0, 1)), nev: "új" };

  it("a napon érvényes, legfrissebb díjszabást adja", () => {
    expect(ervenyesDijszabas([regi, uj], new Date(Date.UTC(2026, 5, 1)))?.nev).toBe("új");
    expect(ervenyesDijszabas([regi, uj], new Date(Date.UTC(2025, 5, 1)))?.nev).toBe("régi");
  });

  it("azonos érvényességi napnál az azonosító dönt, a nagyobb felé", () => {
    // Postgresen két egy napon érvényes díjszabás sorrendje nincs garantálva:
    // enélkül ugyanannak az elszámolásnak két futáson két összege lett volna.
    const a = { ervenyesTol: new Date(Date.UTC(2026, 0, 1)), id: "a", nev: "első" };
    const b = { ervenyesTol: new Date(Date.UTC(2026, 0, 1)), id: "b", nev: "második" };
    const napon = new Date(Date.UTC(2026, 5, 1));
    expect(ervenyesDijszabas([a, b], napon)?.nev).toBe("második");
    expect(ervenyesDijszabas([b, a], napon)?.nev).toBe("második");
  });

  it("a kezdőnapon már érvényes", () => {
    expect(ervenyesDijszabas([uj], new Date(Date.UTC(2026, 0, 1)))?.nev).toBe("új");
  });

  it("ha egyik sem érvényes még, nincs díjszabás", () => {
    expect(ervenyesDijszabas([uj], new Date(Date.UTC(2025, 5, 1)))).toBeNull();
  });
});
