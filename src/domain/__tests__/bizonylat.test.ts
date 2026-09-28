import { describe, expect, it } from "vitest";
import {
  biztonsagosNev,
  tipusATartalombol,
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

describe("tipusATartalombol", () => {
  const elejevel = (bajtok: number[]) => new Uint8Array([...bajtok, 0, 1, 2, 3]);

  it("a négy elfogadott formátumot felismeri a tartalmából", () => {
    expect(tipusATartalombol(elejevel([0x25, 0x50, 0x44, 0x46]))).toBe("application/pdf");
    expect(tipusATartalombol(elejevel([0xff, 0xd8, 0xff]))).toBe("image/jpeg");
    expect(
      tipusATartalombol(elejevel([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("image/png");
    expect(
      tipusATartalombol(
        new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
      ),
    ).toBe("image/webp");
  });

  it("a bejelentett típus nem számít: a HTML-t akkor sem engedi át, ha képnek mondják", () => {
    // Ez a fájl a másik fél böngészőjében nyílna meg a mi címünkön.
    const html = new TextEncoder().encode("<html><script>rossz()</script></html>");
    expect(tipusATartalombol(html)).toBeNull();
    expect(bizonylatotEllenoriz({ nev: "kep.png", tipus: "", meretBajt: 10 })?.kulcs).toBe(
      "bizonylat.hiba.tipus",
    );
  });

  it("a túl rövid fájlból nem találgat", () => {
    expect(tipusATartalombol(new Uint8Array([0x25, 0x50]))).toBeNull();
  });
});

describe("biztonsagosNev", () => {
  it("a kiterjesztés az ellenőrzött típusból jön, nem a feltöltött névből", () => {
    expect(biztonsagosNev("kuldo", "application/pdf")).toBe("bizonylat-kuldo.pdf");
    expect(biztonsagosNev("fogado", "image/jpeg")).toBe("bizonylat-fogado.jpg");
    expect(biztonsagosNev("kuldo", "image/png")).toBe("bizonylat-kuldo.png");
    expect(biztonsagosNev("fogado", "image/webp")).toBe("bizonylat-fogado.webp");
  });

  it("ismeretlen típusból sem lesz üres név", () => {
    expect(biztonsagosNev("fogado", "")).toBe("bizonylat-fogado.dat");
  });

  it("a fejlécbe nem enged idézőjelet, sortörést vagy útvonalat", () => {
    // A név a Content-Disposition fejlécbe kerül: ott egy idézőjel vagy egy
    // sortörés új fejlécet nyitna. A feltöltött név most már el sem jut idáig.
    const nev = biztonsagosNev("kuldo", 'text/html"\r\nX-Injekcio: 1');
    expect(nev).toBe("bizonylat-kuldo.dat");
    expect(nev).not.toMatch(/["\r\n/]/);
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
