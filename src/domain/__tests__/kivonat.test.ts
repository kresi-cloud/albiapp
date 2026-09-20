import { describe, expect, it } from "vitest";
import { csvSortBont, datumotOlvas, kivonatotOlvas } from "../kivonat";

const KIVONAT = `Könyvelés dátuma;Összeg;Közlemény;Partner neve
2026-09-04;180 000;Szeptemberi bérleti díj;Kovács Anna
2026-09-06;45 000;Rezsi;Kovács Anna
2026-09-10;-12 500;Bankköltség;OTP Bank`;

describe("kivonatotOlvas", () => {
  it("felismeri a fejlécet és beolvassa a sorokat", () => {
    const eredmeny = kivonatotOlvas(KIVONAT);
    expect(eredmeny.hibak).toEqual([]);
    expect(eredmeny.sorok).toHaveLength(3);
    expect(eredmeny.sorok[0].osszegFt).toBe(180000);
    expect(eredmeny.sorok[0].kozlemeny).toBe("Szeptemberi bérleti díj");
    expect(eredmeny.sorok[2].osszegFt).toBe(-12500);
  });

  it("vesszős elválasztót és idézőjeles mezőt is kezel", () => {
    const vesszos = `Dátum,Összeg,Közlemény\n2026-09-04,"180000","Bérleti díj, szeptember"`;
    const eredmeny = kivonatotOlvas(vesszos);
    expect(eredmeny.hibak).toEqual([]);
    expect(eredmeny.sorok[0].kozlemeny).toBe("Bérleti díj, szeptember");
  });

  it("az ismétlődő sort kihagyja, és meg is mondja", () => {
    const ketszer = `${KIVONAT}\n2026-09-04;180 000;Szeptemberi bérleti díj;Kovács Anna`;
    const eredmeny = kivonatotOlvas(ketszer);
    expect(eredmeny.sorok).toHaveLength(3);
    expect(eredmeny.hibak).toHaveLength(1);
    expect(eredmeny.hibak[0].ok).toContain("Ismétlődő");
  });

  it("a rossz sort kihagyja, a többit beolvassa", () => {
    const hibas = `Könyvelés dátuma;Összeg\n2026-09-04;180 000\nnem dátum;valami`;
    const eredmeny = kivonatotOlvas(hibas);
    expect(eredmeny.sorok).toHaveLength(1);
    expect(eredmeny.hibak).toHaveLength(1);
    expect(eredmeny.hibak[0].sorszam).toBe(3);
  });

  it("megmondja, ha a fejléc felismerhetetlen", () => {
    const eredmeny = kivonatotOlvas("egy;kettő;három\n1;2;3");
    expect(eredmeny.sorok).toEqual([]);
    expect(eredmeny.hibak[0].ok).toContain("fejléc");
  });
});

describe("datumotOlvas", () => {
  it("több formátumot olvas", () => {
    expect(datumotOlvas("2026-09-05")?.toISOString()).toBe("2026-09-05T00:00:00.000Z");
    expect(datumotOlvas("2026.09.05.")?.toISOString()).toBe("2026-09-05T00:00:00.000Z");
    expect(datumotOlvas("05/09/2026")?.toISOString()).toBe("2026-09-05T00:00:00.000Z");
    expect(datumotOlvas("valami")).toBeNull();
  });
});

describe("csvSortBont", () => {
  it("az idézőjelen belüli elválasztót nem vágja el", () => {
    expect(csvSortBont('a;"b;c";d', ";")).toEqual(["a", "b;c", "d"]);
  });
});
