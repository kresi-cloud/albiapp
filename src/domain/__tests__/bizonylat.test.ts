import { describe, expect, it } from "vitest";
import {
  biztonsagosNev,
  bizonylatotEllenoriz,
  ELFOGADOTT_TIPUSOK,
  MAX_MERET_BAJT,
  meretSzoveg,
  oldalaEnnek,
} from "../bizonylat";

describe("oldalaEnnek", () => {
  it("a bérlőnek küldő oldali bizonylata van", () => {
    expect(oldalaEnnek("berlo")).toBe("kuldo");
  });

  it("a bérbeadónak fogadó oldali", () => {
    expect(oldalaEnnek("berbeado")).toBe("fogado");
  });
});

describe("bizonylatotEllenoriz", () => {
  const jo = { nev: "utalas.pdf", tipus: "application/pdf", meretBajt: 120_000 };

  it("egy szokásos utalási bizonylatot elfogad", () => {
    expect(bizonylatotEllenoriz(jo)).toBeNull();
  });

  it("képernyőképet is elfogad", () => {
    for (const tipus of ELFOGADOTT_TIPUSOK) {
      expect(bizonylatotEllenoriz({ ...jo, tipus })).toBeNull();
    }
  });

  it("üres fájlt nem fogad el", () => {
    expect(bizonylatotEllenoriz({ ...jo, meretBajt: 0 })?.kulcs).toBe("bizonylat.hiba.ures");
  });

  it("a méretkorlát fölött nem fogad el", () => {
    const tul = bizonylatotEllenoriz({ ...jo, meretBajt: MAX_MERET_BAJT + 1 });
    expect(tul).toEqual({ kulcs: "bizonylat.hiba.nagy", adatok: { max: 5 } });
  });

  it("a határon még elfogad", () => {
    expect(bizonylatotEllenoriz({ ...jo, meretBajt: MAX_MERET_BAJT })).toBeNull();
  });

  it("futtatható és irodai formátumot nem fogad el", () => {
    for (const tipus of [
      "application/x-msdownload",
      "text/html",
      "application/vnd.ms-excel",
      "text/csv",
      "",
    ]) {
      expect(bizonylatotEllenoriz({ ...jo, tipus })?.kulcs).toBe("bizonylat.hiba.tipus");
    }
  });
});

describe("biztonsagosNev", () => {
  it("a kiterjesztést megtartja, a nevet nem", () => {
    expect(biztonsagosNev("kuldo", "Bankszámla kivonat 2026.PDF")).toBe("bizonylat-kuldo.pdf");
  });

  it("kiterjesztés nélküli névből sem lesz üres", () => {
    expect(biztonsagosNev("fogado", "bizonylat")).toBe("bizonylat-fogado.dat");
  });

  it("a fejlécbe nem enged idézőjelet vagy sortörést", () => {
    // A név a Content-Disposition fejlécbe kerül: ott egy idézőjel vagy egy
    // sortörés új fejlécet nyitna.
    const nev = biztonsagosNev("kuldo", 'rossz"\r\nX-Injekcio: 1.pdf');
    expect(nev).toBe("bizonylat-kuldo.pdf");
    expect(nev).not.toMatch(/["\r\n]/);
  });

  it("útvonalat sem enged át a névben", () => {
    expect(biztonsagosNev("kuldo", "../../etc/passwd.png")).toBe("bizonylat-kuldo.png");
  });
});

describe("meretSzoveg", () => {
  it("bájtot, kilobájtot és megabájtot külön mond", () => {
    expect(meretSzoveg(512)).toEqual({ kulcs: "bizonylat.meret.bajt", adatok: { meret: 512 } });
    expect(meretSzoveg(120_000)).toEqual({
      kulcs: "bizonylat.meret.kb",
      adatok: { meret: 117 },
    });
    expect(meretSzoveg(3 * 1024 * 1024)).toEqual({
      kulcs: "bizonylat.meret.mb",
      adatok: { meret: 3 },
    });
  });
});
