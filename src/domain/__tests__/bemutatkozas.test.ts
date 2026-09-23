import { describe, expect, test } from "vitest";
import {
  atlagMondata,
  ertekelesekSzama,
  iranya,
  lathatja,
  szempontonkent,
  type Bemutatkozo,
} from "../bemutatkozas";
import { type ErtekelesAdat } from "../ertekeles";

function ertekeles(
  szerzoId: string,
  pontok: Record<string, number>,
): ErtekelesAdat {
  return {
    szerzoId,
    alanyId: "berlo-1",
    irany: "berlorol",
    szoveg: "Rendben ment.",
    pontok: Object.entries(pontok).map(([szempont, pont]) => ({
      szempont,
      pont,
    })),
    letrehozva: new Date("2026-09-01T00:00:00Z"),
  };
}

function bemutatkozo(ertekelesek: ErtekelesAdat[]): Bemutatkozo {
  return {
    felhasznaloId: "berlo-1",
    nev: "Kiss Anna",
    szerep: "berlo",
    bemutatkozas: "",
    ertekelesek,
  };
}

describe("a szerep iránya", () => {
  test("a bérlőről a bérlőről szóló szempontok szólnak", () => {
    expect(iranya("berlo")).toBe("berlorol");
    expect(iranya("berbeado")).toBe("berbeadorol");
  });
});

describe("a darabszám", () => {
  test("a látható értékeléseket számolja", () => {
    expect(
      ertekelesekSzama(bemutatkozo([ertekeles("a", { fizetes: 5 })])),
    ).toBe(1);
  });

  test("értékelés nélkül nulla, nem pedig hiányzó adat", () => {
    expect(ertekelesekSzama(bemutatkozo([]))).toBe(0);
  });

  test("a rejtett értékelés ide el sem jut, tehát a szám nem árulja el", () => {
    // A rejtést a lib végzi; a domain azt kapja, ami látható. A kapu az, hogy
    // a darabszám semmilyen más forrásból nem számol.
    const csakLathato = bemutatkozo([ertekeles("a", { fizetes: 4 })]);
    expect(ertekelesekSzama(csakLathato)).toBe(csakLathato.ertekelesek.length);
  });
});

describe("a szempontonkénti összesítés", () => {
  test("szempontonként átlagol, és nem von össze egyetlen számmá", () => {
    const sorok = szempontonkent(
      bemutatkozo([
        ertekeles("a", { fizetes: 5, allapot: 3, kommunikacio: 4 }),
        ertekeles("b", { fizetes: 4, allapot: 2, kommunikacio: 4 }),
      ]),
    );
    expect(sorok).toEqual([
      { szempont: "fizetes", atlag: 4.5, darab: 2 },
      { szempont: "allapot", atlag: 2.5, darab: 2 },
      { szempont: "kommunikacio", atlag: 4, darab: 2 },
    ]);
    // Aki pontosan fizet, de tönkreteszi a lakást, nem „közepes": nincs olyan
    // sor, ami a hármat egy számba mosná.
    expect(sorok.some((sor) => sor.szempont === "osszesitett")).toBe(false);
  });

  test("egy tizedesre kerekít", () => {
    const sorok = szempontonkent(
      bemutatkozo([
        ertekeles("a", { fizetes: 5 }),
        ertekeles("b", { fizetes: 4 }),
        ertekeles("c", { fizetes: 4 }),
      ]),
    );
    expect(sorok[0]).toEqual({ szempont: "fizetes", atlag: 4.3, darab: 3 });
  });

  test("amire senki nem adott pontot, az kimarad", () => {
    const sorok = szempontonkent(bemutatkozo([ertekeles("a", { fizetes: 5 })]));
    expect(sorok.map((sor) => sor.szempont)).toEqual(["fizetes"]);
  });

  test("a szempontok sorrendje a listáé, nem a pontszámé", () => {
    const sorok = szempontonkent(
      bemutatkozo([
        ertekeles("a", { kommunikacio: 5, fizetes: 1, allapot: 3 }),
      ]),
    );
    expect(sorok.map((sor) => sor.szempont)).toEqual([
      "fizetes",
      "allapot",
      "kommunikacio",
    ]);
  });

  test("értékelés nélkül üres, nem nullás sorokkal teli", () => {
    expect(szempontonkent(bemutatkozo([]))).toEqual([]);
  });

  test("a bérbeadó a saját szempontjait kapja", () => {
    const sorok = szempontonkent({
      felhasznaloId: "berbeado-1",
      nev: "Nagy Péter",
      szerep: "berbeado",
      bemutatkozas: "",
      ertekelesek: [
        {
          ...ertekeles("a", { hibakezeles: 5, elerhetoseg: 4, elszamolas: 5 }),
          irany: "berbeadorol",
        },
      ],
    });
    expect(sorok.map((sor) => sor.szempont)).toEqual([
      "hibakezeles",
      "elerhetoseg",
      "elszamolas",
    ]);
  });

  test("az átlag mellett mindig ott a darabszám", () => {
    const mondat = atlagMondata({ szempont: "fizetes", atlag: 4.5, darab: 2 });
    expect(mondat.adatok).toEqual({ atlag: 4.5, darab: 2 });
  });
});

describe("ki láthatja", () => {
  test("a felhasználó a sajátját", () => {
    expect(lathatja({ id: "a", rendszergazda: false }, "a")).toBe(true);
  });

  test("a rendszergazda a másikét", () => {
    expect(lathatja({ id: "admin", rendszergazda: true }, "a")).toBe(true);
  });

  test("más felhasználó nem: a lap egyelőre nem nyilvános", () => {
    expect(lathatja({ id: "b", rendszergazda: false }, "a")).toBe(false);
  });
});
