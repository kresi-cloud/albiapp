import { describe, expect, it } from "vitest";
import {
  idoszakCimke,
  igazolasSzovege,
  igazolhatoBefizetesek,
  type Befizetes,
  type IgazolasBemenet,
} from "../igazolas";

function befizetes(reszlet: Partial<Befizetes>): Befizetes {
  return {
    idoszak: "2026-09",
    osszegFt: 180000,
    napja: new Date(Date.UTC(2026, 8, 3)),
    allapot: "egyezik",
    ...reszlet,
  };
}

const ALAP: IgazolasBemenet = {
  berbeado: { nev: "Kovács Péter", lakcim: "7623 Pécs, Példa utca 1.", email: "peter@pelda.hu" },
  berlo: { nev: "Nagy Anna", lakcim: "1111 Budapest, Minta tér 2." },
  osszesBerlo: [{ nev: "Nagy Anna" }],
  ingatlan: { cim: "7624 Pécs, Teszt utca 3." },
  jogviszony: {
    kezdete: new Date(Date.UTC(2026, 8, 1)),
    vege: null,
    berletiDijFt: 180000,
    szerzodesKelte: new Date(Date.UTC(2026, 7, 25)),
  },
  cel: "Pécsi Tudományegyetem lakhatási támogatás igényléséhez",
  idoszak: "2026-09",
  osszegFt: 180000,
  teljesitesNapja: new Date(Date.UTC(2026, 8, 3)),
  teljesitesModja: "atutalas",
  kiallitasHelye: "Pécs",
  kiallitasNapja: new Date(Date.UTC(2026, 8, 20)),
};

describe("időszak címkéje", () => {
  it("magyar hónapnevet ad", () => {
    expect(idoszakCimke("2026-09")).toBe("2026. szeptember");
    expect(idoszakCimke("2026-01")).toBe("2026. január");
  });

  it("értelmezhetetlen időszakot változatlanul hagy", () => {
    expect(idoszakCimke("tavaly")).toBe("tavaly");
    expect(idoszakCimke("2026-13")).toBe("2026-13");
  });
});

describe("igazolható befizetések", () => {
  it("a hiányzó hónapra nem ajánl igazolást", () => {
    const sorok = igazolhatoBefizetesek([
      befizetes({ idoszak: "2026-09" }),
      befizetes({ idoszak: "2026-08", allapot: "hianyzik", osszegFt: 0 }),
    ]);
    expect(sorok.map((sor) => sor.idoszak)).toEqual(["2026-09"]);
  });

  it("az eltérő összegű befizetés is igazolható, mert megtörtént", () => {
    const sorok = igazolhatoBefizetesek([
      befizetes({ idoszak: "2026-07", allapot: "elter", osszegFt: 150000 }),
    ]);
    expect(sorok).toHaveLength(1);
    expect(sorok[0].osszegFt).toBe(150000);
  });

  it("a legfrissebb hónappal kezd", () => {
    const sorok = igazolhatoBefizetesek([
      befizetes({ idoszak: "2026-07" }),
      befizetes({ idoszak: "2026-09" }),
      befizetes({ idoszak: "2026-08" }),
    ]);
    expect(sorok.map((sor) => sor.idoszak)).toEqual(["2026-09", "2026-08", "2026-07"]);
  });
});

describe("az igazolás szövege", () => {
  const szoveg = igazolasSzovege(ALAP);

  it("a tárgyhót, az összeget és a teljesítés napját is kiírja", () => {
    expect(szoveg).toContain("Tárgyhó: 2026. szeptember");
    expect(szoveg).toContain("180 000 Ft, azaz száznyolcvanezer forint");
    expect(szoveg).toContain("A teljesítés napja: 2026. szeptember 3.");
    expect(szoveg).toContain("A teljesítés módja: banki átutalás");
  });

  it("kimondja, hogy nem formanyomtatvány", () => {
    expect(szoveg).toContain("nem hatósági vagy intézményi formanyomtatvány");
  });

  it("egy bérlőnél nem beszél egyetemleges felelősségről", () => {
    expect(szoveg).not.toContain("egyetemlegesen");
  });

  it("két bérlőnél kiírja az egyetemleges felelősséget", () => {
    const ketten = igazolasSzovege({
      ...ALAP,
      osszesBerlo: [{ nev: "Nagy Anna" }, { nev: "Kiss Béla" }],
      osszegFt: 90000,
    });
    expect(ketten).toContain("egyetemlegesen");
    expect(ketten).toContain("a 2 bérlő együttes bérleti jogviszonyára");
    expect(ketten).toContain("90 000 Ft");
  });

  it("határozott idejű jogviszonynál a végét is kiírja", () => {
    const hatarozott = igazolasSzovege({
      ...ALAP,
      jogviszony: { ...ALAP.jogviszony, vege: new Date(Date.UTC(2027, 7, 31)) },
    });
    expect(hatarozott).toContain("2026. szeptember 1. – 2027. augusztus 31.");
  });

  it("nem hagy három egymás utáni sortörést a szövegben", () => {
    expect(szoveg).not.toMatch(/\n{3,}/);
    expect(szoveg.endsWith("\n")).toBe(true);
  });
});
