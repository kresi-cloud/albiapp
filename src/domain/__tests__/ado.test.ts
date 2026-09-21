import { describe, expect, it } from "vitest";
import {
  adoosszesito,
  berbeadottNapok,
  bevetelketBesorol,
  ertekcsokkenes,
  evNapjai,
  KOLTSEGHANYAD,
  rezsitMegoszt,
  SZJA_KULCS,
  type BeerkezettTetel,
} from "../ado";
import { uzenet } from "../nyelv";

const NAP = new Date(Date.UTC(2026, 2, 5));

function tetel(reszlet: Partial<BeerkezettTetel> = {}): BeerkezettTetel {
  return {
    datum: NAP,
    osszegFt: 180000,
    fajta: "berleti_dij",
    megnevezes: uzenet("nyers", { szoveg: "Bérleti díj" }),
    ...reszlet,
  };
}

describe("bevetelketBesorol", () => {
  it("a bérleti díj bevétel", () => {
    const [sor] = bevetelketBesorol([tetel()]);
    expect(sor.bevetelFt).toBe(180000);
    expect(sor.nemBevetelFt).toBe(0);
  });

  it("a mért, továbbhárított közüzemi díj nem bevétel", () => {
    const [sor] = bevetelketBesorol([
      tetel({ fajta: "rezsi", osszegFt: 42000, mertKozuzem: true }),
    ]);
    expect(sor.bevetelFt).toBe(0);
    expect(sor.nemBevetelFt).toBe(42000);
    expect(sor.indoklas.kulcs).toBe("ado.indok.mert");
  });

  it("az átalányban fizetett rezsi viszont bevétel", () => {
    const [sor] = bevetelketBesorol([
      tetel({ fajta: "rezsi", osszegFt: 30000, mertKozuzem: false }),
    ]);
    expect(sor.bevetelFt).toBe(30000);
    expect(sor.nemBevetelFt).toBe(0);
    expect(sor.indoklas.kulcs).toBe("ado.indok.atalany");
  });

  it("a közös költség bevétel, és ezt meg is indokolja", () => {
    const [sor] = bevetelketBesorol([tetel({ fajta: "kozos_koltseg", osszegFt: 14000 })]);
    expect(sor.bevetelFt).toBe(14000);
    expect(sor.indoklas.kulcs).toBe("ado.indok.kozos_koltseg");
  });
});

describe("ertekcsokkenes", () => {
  it("egész évre a beszerzési ár két százaléka", () => {
    expect(ertekcsokkenes(60_000_000, 365, 365)).toBe(1_200_000);
  });

  it("fél évre arányosan kevesebb", () => {
    expect(ertekcsokkenes(60_000_000, 182, 365)).toBe(
      Math.round((60_000_000 * 0.02 * 182) / 365),
    );
  });

  it("beszerzési ár vagy kiadott nap nélkül nulla", () => {
    expect(ertekcsokkenes(null, 365, 365)).toBe(0);
    expect(ertekcsokkenes(60_000_000, 0, 365)).toBe(0);
  });
});

describe("evNapjai", () => {
  it("a szökőévet is tudja", () => {
    expect(evNapjai(2026)).toBe(365);
    expect(evNapjai(2028)).toBe(366);
  });
});

describe("berbeadottNapok", () => {
  it("az egész évben kiadott lakás 365 nap", () => {
    const napok = berbeadottNapok(2026, [
      { kezdete: new Date(Date.UTC(2020, 0, 1)), vege: null },
    ]);
    expect(napok).toBe(365);
  });

  it("az év közben kezdődő bérletet csak a kezdéstől számolja", () => {
    const napok = berbeadottNapok(2026, [
      { kezdete: new Date(Date.UTC(2026, 6, 1)), vege: null },
    ]);
    expect(napok).toBe(184); // július 1-től az év végéig
  });

  it("az átfedő időszakok napjait nem számolja kétszer", () => {
    const napok = berbeadottNapok(2026, [
      { kezdete: new Date(Date.UTC(2026, 0, 1)), vege: new Date(Date.UTC(2026, 6, 1)) },
      { kezdete: new Date(Date.UTC(2026, 5, 1)), vege: new Date(Date.UTC(2027, 0, 1)) },
    ]);
    expect(napok).toBe(365);
  });

  it("a más évre eső időszak nem számít", () => {
    const napok = berbeadottNapok(2026, [
      { kezdete: new Date(Date.UTC(2024, 0, 1)), vege: new Date(Date.UTC(2025, 0, 1)) },
    ]);
    expect(napok).toBe(0);
  });
});

describe("adoosszesito", () => {
  const sorok = bevetelketBesorol([
    tetel({ osszegFt: 2_160_000 }),
    tetel({ fajta: "rezsi", osszegFt: 400_000, mertKozuzem: true }),
  ]);

  it("a nem bevétel nem növeli az adóalapot", () => {
    const osszesito = adoosszesito(sorok, []);
    expect(osszesito.bevetelFt).toBe(2_160_000);
    expect(osszesito.nemBevetelFt).toBe(400_000);
    expect(osszesito.adoalapHanyadFt).toBe(Math.round(2_160_000 * (1 - KOLTSEGHANYAD)));
  });

  it("kevés költségnél a tíz százalékos hányad az olcsóbb", () => {
    const osszesito = adoosszesito(sorok, [{ megnevezes: uzenet("nyers", { szoveg: "Biztosítás" }), osszegFt: 40_000 }]);
    expect(osszesito.ajanlott).toBe("hanyad");
    expect(osszesito.adoHanyadFt).toBe(Math.round(2_160_000 * 0.9 * SZJA_KULCS));
  });

  it("sok költségnél a tételes elszámolás jön ki jobban, és megmondja, mennyivel", () => {
    const osszesito = adoosszesito(sorok, [
      { megnevezes: uzenet("nyers", { szoveg: "Értékcsökkenés" }), osszegFt: 1_200_000 },
      { megnevezes: uzenet("nyers", { szoveg: "Felújítás" }), osszegFt: 300_000 },
    ]);
    expect(osszesito.ajanlott).toBe("teteles");
    expect(osszesito.adoTetelesFt).toBe(Math.round((2_160_000 - 1_500_000) * SZJA_KULCS));
    expect(osszesito.megtakaritasFt).toBe(osszesito.adoHanyadFt - osszesito.adoTetelesFt);
  });

  it("a költség nem visz negatív adóalapot", () => {
    const osszesito = adoosszesito(sorok, [{ megnevezes: uzenet("nyers", { szoveg: "Nagy felújítás" }), osszegFt: 9_000_000 }]);
    expect(osszesito.adoalapTetelesFt).toBe(0);
    expect(osszesito.adoTetelesFt).toBe(0);
  });

  it("bevétel nélkül mindkét adó nulla", () => {
    const osszesito = adoosszesito([], []);
    expect(osszesito.adoHanyadFt).toBe(0);
    expect(osszesito.adoTetelesFt).toBe(0);
    expect(osszesito.ajanlott).toBe("hanyad");
  });
});

describe("rezsitMegoszt", () => {
  it("a tételek arányában oszt", () => {
    // 71 513 Ft-os elszámolásból 42 976 Ft a mért fogyasztás.
    const { mertReszFt, egyebReszFt } = rezsitMegoszt(71_513, 42_976, 71_513);
    expect(mertReszFt).toBe(42_976);
    expect(egyebReszFt).toBe(28_537);
  });

  it("részleges befizetést is arányosan oszt, és nem veszít forintot", () => {
    const { mertReszFt, egyebReszFt } = rezsitMegoszt(50_000, 42_976, 71_513);
    expect(mertReszFt + egyebReszFt).toBe(50_000);
    expect(mertReszFt).toBe(Math.round((50_000 * 42_976) / 71_513));
  });

  it("csak mért tételnél az egész mért", () => {
    expect(rezsitMegoszt(30_000, 30_000, 30_000)).toEqual({ mertReszFt: 30_000, egyebReszFt: 0 });
  });

  it("mért tétel nélkül semmi sem mért", () => {
    expect(rezsitMegoszt(30_000, 0, 30_000)).toEqual({ mertReszFt: 0, egyebReszFt: 30_000 });
    expect(rezsitMegoszt(30_000, 0, 0)).toEqual({ mertReszFt: 0, egyebReszFt: 30_000 });
  });
});
