import { describe, expect, it } from "vitest";
import {
  alapMertekegyseg,
  dijszabasFigyelmeztetesei,
  dijszabastEllenoriz,
  MEROORA_TIPUSOK,
  MERTEKEGYSEGEK,
  merooratEllenoriz,
  tipusE,
  type DijszabasBemenet,
} from "../meroora";

const JO_MEROORA = {
  tipus: "viz",
  mertekegyseg: "m3",
  gyariSzam: "A-12345",
  almero: false,
};

const JO_DIJSZABAS: DijszabasBemenet = {
  tipus: "viz",
  ervenyesTol: new Date(Date.UTC(2026, 0, 1)),
  kedvezmenyesArFiller: 36_90,
  piaciArFiller: 70_10,
  evesKeret: 120,
  alapdijFt: 500,
  csatornaArFiller: 41_50,
};

const kulcsok = (bemenet: DijszabasBemenet) =>
  dijszabastEllenoriz(bemenet).map((sor) => sor.kulcs);

describe("merooratEllenoriz", () => {
  it("a jó mérőórát átengedi", () => {
    expect(merooratEllenoriz(JO_MEROORA)).toEqual([]);
    for (const tipus of MEROORA_TIPUSOK) {
      expect(
        merooratEllenoriz({ ...JO_MEROORA, tipus, mertekegyseg: alapMertekegyseg(tipus) }),
      ).toEqual([]);
    }
  });

  it("ismeretlen fajtát nem enged át", () => {
    expect(merooratEllenoriz({ ...JO_MEROORA, tipus: "internet" }).map((s) => s.kulcs)).toEqual([
      "meroora.hiba.tipus",
    ]);
  });

  it("a mértékegység a fajtához tartozik, nem szabad szöveg", () => {
    // Egy elgépelt „m³" és „m3" két különböző mérőórának látszana ugyanazon a lapon.
    expect(
      merooratEllenoriz({ ...JO_MEROORA, mertekegyseg: "m³" }).map((s) => s.kulcs),
    ).toContain("meroora.hiba.mertekegyseg");
    expect(
      merooratEllenoriz({ tipus: "villany", mertekegyseg: "m3", gyariSzam: null, almero: false })
        .map((s) => s.kulcs),
    ).toContain("meroora.hiba.mertekegyseg");
  });

  it("a gáznak és a fűtésnek két mértékegysége is lehet", () => {
    expect(MERTEKEGYSEGEK.gaz).toContain("kWh");
    expect(
      merooratEllenoriz({ tipus: "futes", mertekegyseg: "kWh", gyariSzam: null, almero: true }),
    ).toEqual([]);
  });

  it("a gyári szám elhagyható, de nem lehet fél mondat", () => {
    expect(merooratEllenoriz({ ...JO_MEROORA, gyariSzam: null })).toEqual([]);
    expect(
      merooratEllenoriz({ ...JO_MEROORA, gyariSzam: "x".repeat(41) }).map((s) => s.kulcs),
    ).toContain("meroora.hiba.gyari_szam");
  });

  it("tipusE csak a négy fajtára igaz", () => {
    expect(tipusE("viz")).toBe(true);
    expect(tipusE("internet")).toBe(false);
  });
});

describe("dijszabastEllenoriz", () => {
  it("a jó díjszabást átengedi", () => {
    expect(dijszabastEllenoriz(JO_DIJSZABAS)).toEqual([]);
  });

  it("dátum nélkül nem megy", () => {
    expect(kulcsok({ ...JO_DIJSZABAS, ervenyesTol: null })).toContain("dijszabas.hiba.datum");
  });

  it("az üres és az olvashatatlan ár is kifogás", () => {
    expect(kulcsok({ ...JO_DIJSZABAS, kedvezmenyesArFiller: null })).toContain(
      "dijszabas.hiba.kedvezmenyes",
    );
    expect(kulcsok({ ...JO_DIJSZABAS, piaciArFiller: Number.NaN })).toContain(
      "dijszabas.hiba.piaci",
    );
    expect(kulcsok({ ...JO_DIJSZABAS, kedvezmenyesArFiller: -1 })).toContain(
      "dijszabas.hiba.kedvezmenyes",
    );
  });

  it("az irreálisan nagy egységárat elutasítja", () => {
    expect(kulcsok({ ...JO_DIJSZABAS, kedvezmenyesArFiller: 100_000_01 })).toContain(
      "dijszabas.hiba.tul_nagy",
    );
  });

  it("keret nélkül a piaci ár nem számít, kerettel viszont nem lehet olcsóbb", () => {
    // Keret nélkül minden egység a kedvezményes áron megy: a piaci ár nem
    // szerepel az elszámolásban, tehát nincs mihez mérni.
    expect(
      dijszabastEllenoriz({ ...JO_DIJSZABAS, evesKeret: null, piaciArFiller: 1 }),
    ).toEqual([]);
    expect(kulcsok({ ...JO_DIJSZABAS, piaciArFiller: 10_00 })).toContain(
      "dijszabas.hiba.piaci_kisebb",
    );
  });

  it("a nulla vagy negatív keret kifogás, az üres nem", () => {
    expect(kulcsok({ ...JO_DIJSZABAS, evesKeret: 0 })).toContain("dijszabas.hiba.keret");
    expect(kulcsok({ ...JO_DIJSZABAS, evesKeret: null })).toEqual([]);
  });

  it("az alapdíj egész forint, és nem lehet negatív", () => {
    expect(kulcsok({ ...JO_DIJSZABAS, alapdijFt: -1 })).toContain("dijszabas.hiba.alapdij");
    expect(kulcsok({ ...JO_DIJSZABAS, alapdijFt: null })).toContain("dijszabas.hiba.alapdij");
    expect(dijszabastEllenoriz({ ...JO_DIJSZABAS, alapdijFt: 0 })).toEqual([]);
  });

  it("csatornadíjat csak vízórára fogadunk el", () => {
    // A csatornadíj a vízóra díjszabásának része: ugyanarra a mért köbméterre
    // jár. Villanyórán egy ide beírt szám csendben megduplázná a számlát.
    expect(
      kulcsok({
        ...JO_DIJSZABAS,
        tipus: "villany",
        csatornaArFiller: 41_50,
      }),
    ).toContain("dijszabas.hiba.csatorna_nem_viz");
    expect(
      dijszabastEllenoriz({
        tipus: "villany",
        ervenyesTol: JO_DIJSZABAS.ervenyesTol,
        kedvezmenyesArFiller: 36_90,
        piaciArFiller: 70_10,
        evesKeret: null,
        alapdijFt: 0,
        csatornaArFiller: 0,
      }),
    ).toEqual([]);
  });

  it("a nulla csatornadíj vízórán is érvényes eset", () => {
    // A locsolási mellékmérőn átfolyt víz nem megy csatornába.
    expect(dijszabastEllenoriz({ ...JO_DIJSZABAS, csatornaArFiller: 0 })).toEqual([]);
  });
});

describe("dijszabasFigyelmeztetesei", () => {
  it("a hiányzó keretről és a nulla csatornadíjról szól, de nem tiltja", () => {
    const kulcsai = dijszabasFigyelmeztetesei({
      ...JO_DIJSZABAS,
      evesKeret: null,
      csatornaArFiller: 0,
    }).map((sor) => sor.kulcs);
    expect(kulcsai).toEqual([
      "dijszabas.figyelem.nincs_keret",
      "dijszabas.figyelem.nincs_csatorna",
    ]);
  });

  it("a kitöltött díjszabásnál hallgat", () => {
    expect(dijszabasFigyelmeztetesei(JO_DIJSZABAS)).toEqual([]);
  });
});
