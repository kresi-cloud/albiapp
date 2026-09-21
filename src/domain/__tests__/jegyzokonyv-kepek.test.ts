import { describe, expect, it } from "vitest";
import {
  ELFOGADOTT_TIPUSOK,
  MAX_DARAB,
  MAX_MERET_BAJT,
  allapota,
  biztonsagosNev,
  hianyzoParok,
  kepetEllenoriz,
  megerositheti,
  osszesit,
  tipusATartalombol,
} from "../jegyzokonyv-kepek";

const KEP = {
  id: "k1",
  megnevezes: "nappali",
  feltoltoSzerep: "berbeado" as const,
  megerositve: null as Date | null,
  kifogas: null as string | null,
  parjaId: null as string | null,
};

describe("a kép állapota", () => {
  it("megerősítés nélkül egyoldalú", () => {
    expect(allapota(KEP)).toBe("egyoldalu");
  });

  it("megerősítés után kétoldali", () => {
    expect(allapota({ ...KEP, megerositve: new Date() })).toBe("megerositve");
  });

  it("a kifogás erősebb a megerősítésnél, mert az a későbbi állítás", () => {
    expect(allapota({ ...KEP, megerositve: new Date(), kifogas: "nem a mi lakásunk" })).toBe(
      "vitatott",
    );
  });

  it("az üres kifogás nem kifogás", () => {
    expect(allapota({ ...KEP, kifogas: "" })).toBe("egyoldalu");
  });
});

describe("ki erősítheti meg", () => {
  it("a másik fél igen", () => {
    expect(megerositheti(KEP, "berlo")).toBe(true);
  });

  it("a feltöltő saját maga nem: attól nem lesz kétoldali", () => {
    expect(megerositheti(KEP, "berbeado")).toBe(false);
  });

  it("amit már megerősítettek, azt nem kell újra", () => {
    expect(megerositheti({ ...KEP, megerositve: new Date() }, "berlo")).toBe(false);
  });

  it("amire kifogás van, azt sem lehet utólag megerősíteni", () => {
    expect(megerositheti({ ...KEP, kifogas: "nem ez az" }, "berlo")).toBe(false);
  });
});

describe("a feltöltött fájl ellenőrzése", () => {
  const jo = { nev: "IMG_0042.jpg", tipus: "image/jpeg", meretBajt: 1_200_000 };

  it("a rendes fényképet átengedi", () => {
    expect(kepetEllenoriz(jo, 0)).toBeNull();
  });

  it("az üres fájlt nem", () => {
    expect(kepetEllenoriz({ ...jo, meretBajt: 0 }, 0)?.kulcs).toBe("kep.hiba.ures");
  });

  it("a túl nagyot nem", () => {
    expect(kepetEllenoriz({ ...jo, meretBajt: MAX_MERET_BAJT + 1 }, 0)?.kulcs).toBe(
      "kep.hiba.nagy",
    );
  });

  it("a HEIC-et nem, mert a másik fél böngészője nem rajzolná ki", () => {
    expect(kepetEllenoriz({ ...jo, tipus: "image/heic" }, 0)?.kulcs).toBe("kep.hiba.tipus");
  });

  it("az SVG-t sem: az futtatható dokumentum, nem fénykép", () => {
    expect((ELFOGADOTT_TIPUSOK as readonly string[]).includes("image/svg+xml")).toBe(false);
    expect(kepetEllenoriz({ ...jo, tipus: "image/svg+xml" }, 0)?.kulcs).toBe("kep.hiba.tipus");
  });

  it("a telítődött albumhoz nem enged újabbat", () => {
    expect(kepetEllenoriz(jo, MAX_DARAB)?.kulcs).toBe("kep.hiba.sok");
  });
});

describe("a típus a tartalomból", () => {
  it("felismeri a JPEG-et", () => {
    expect(tipusATartalombol(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toBe("image/jpeg");
  });

  it("felismeri a PNG-t", () => {
    expect(
      tipusATartalombol(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])),
    ).toBe("image/png");
  });

  it("felismeri a WEBP-et", () => {
    const bajtok = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(tipusATartalombol(bajtok)).toBe("image/webp");
  });

  it("a képnek álcázott HTML-t elutasítja, akármit mond magáról a böngésző", () => {
    const html = new TextEncoder().encode("<html><script>alert(1)</script>");
    expect(tipusATartalombol(html)).toBeNull();
  });

  it("a csonka fájlon sem hasal el", () => {
    expect(tipusATartalombol(new Uint8Array([0xff]))).toBeNull();
    expect(tipusATartalombol(new Uint8Array([]))).toBeNull();
  });
});

describe("a kiadott fájlnév", () => {
  it("nem a feltöltött névből jön", () => {
    expect(biztonsagosNev("abc123", "image/jpeg")).toBe("kep-abc123.jpg");
  });

  it("nem enged be idézőjelet és sortörést a fejlécbe", () => {
    const nev = biztonsagosNev('a"b\nc', "image/png");
    expect(nev).not.toContain('"');
    expect(nev).not.toContain("\n");
  });
});

describe("összesítés", () => {
  it("a három állapotot külön számolja", () => {
    const kepek = [
      { megerositve: null, kifogas: null },
      { megerositve: new Date(), kifogas: null },
      { megerositve: new Date(), kifogas: null },
      { megerositve: null, kifogas: "nem ez az" },
    ];
    expect(osszesit(kepek)).toEqual({
      osszes: 4,
      megerositve: 2,
      varakozik: 1,
      vitatott: 1,
    });
  });
});

describe("a hiányzó párok", () => {
  const nyito = [
    { id: "n1", megnevezes: "konyhapult" },
    { id: "n2", megnevezes: "fürdő csempe" },
    { id: "n3", megnevezes: "nappali fal" },
  ];

  it("azokat adja vissza, amikről még nincs kiköltözéskori kép", () => {
    const zaro = [{ parjaId: "n2" }, { parjaId: null }];
    expect(hianyzoParok(nyito, zaro).map((kep) => kep.id)).toEqual(["n1", "n3"]);
  });

  it("üres, ha mindegyikhez van pár", () => {
    const zaro = [{ parjaId: "n1" }, { parjaId: "n2" }, { parjaId: "n3" }];
    expect(hianyzoParok(nyito, zaro)).toEqual([]);
  });

  it("a párosítatlan kiköltözéskori kép nem zavar be", () => {
    expect(hianyzoParok([], [{ parjaId: null }])).toEqual([]);
  });
});
