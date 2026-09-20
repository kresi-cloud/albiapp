import { describe, expect, it } from "vitest";
import {
  ALAPERTELMEZETT_ELETTARTAM,
  SOHA_NEM_MUTATJUK,
  URES,
  allapota,
  allapotNeve,
  lejarat,
  mondatok,
  osszesit,
  telepules,
  type BetekintoTetel,
} from "../betekinto";

function tetel(reszlet: Partial<BetekintoTetel>): BetekintoTetel {
  return { idoszak: "2026-09", allapot: "egyezik", keses: 0, osszegFt: 180000, ...reszlet };
}

describe("összesítés", () => {
  it("üres előzményből üres összesítés lesz", () => {
    expect(osszesit([])).toEqual(URES);
  });

  it("a határidőre érkezett hónapokat számolja", () => {
    const osszesites = osszesit([
      tetel({ idoszak: "2026-07" }),
      tetel({ idoszak: "2026-08" }),
      tetel({ idoszak: "2026-09" }),
    ]);
    expect(osszesites.honapok).toBe(3);
    expect(osszesites.hataridore).toBe(3);
    expect(osszesites.kesve).toBe(0);
  });

  it("a korábban érkezett befizetés is határidőre érkezett", () => {
    const osszesites = osszesit([tetel({ keses: -4 })]);
    expect(osszesites.hataridore).toBe(1);
    expect(osszesites.kesve).toBe(0);
    expect(osszesites.leghosszabbKeses).toBe(0);
  });

  it("a késéseket átlagolja, és a leghosszabbat külön kiemeli", () => {
    const osszesites = osszesit([
      tetel({ idoszak: "2026-06", keses: 2 }),
      tetel({ idoszak: "2026-07", keses: 9 }),
      tetel({ idoszak: "2026-08" }),
    ]);
    expect(osszesites.kesve).toBe(2);
    expect(osszesites.atlagosKeses).toBe(6);
    expect(osszesites.leghosszabbKeses).toBe(9);
  });

  it("a hiányzó hónap nem számít se határidősnek, se késettnek", () => {
    const osszesites = osszesit([
      tetel({ idoszak: "2026-08", allapot: "hianyzik", keses: 0 }),
      tetel({ idoszak: "2026-09" }),
    ]);
    expect(osszesites.hianyzo).toBe(1);
    expect(osszesites.hataridore).toBe(1);
    expect(osszesites.kesve).toBe(0);
  });

  it("az eltérő összegű befizetés külön számol, de megérkezettnek számít", () => {
    const osszesites = osszesit([tetel({ allapot: "elter", osszegFt: 150000 })]);
    expect(osszesites.eltero).toBe(1);
    expect(osszesites.hataridore).toBe(1);
  });

  it("a sorozatot a legfrissebb hónaptól számolja visszafelé", () => {
    const osszesites = osszesit([
      tetel({ idoszak: "2026-05", keses: 12 }),
      tetel({ idoszak: "2026-06" }),
      tetel({ idoszak: "2026-07" }),
      tetel({ idoszak: "2026-08" }),
    ]);
    expect(osszesites.sorozat).toBe(3);
  });

  it("a friss késés megszakítja a sorozatot, akármilyen hosszú volt", () => {
    const osszesites = osszesit([
      tetel({ idoszak: "2026-06" }),
      tetel({ idoszak: "2026-07" }),
      tetel({ idoszak: "2026-08", keses: 3 }),
    ]);
    expect(osszesites.sorozat).toBe(0);
  });

  it("a bemenet sorrendje nem számít", () => {
    const sorok = [
      tetel({ idoszak: "2026-07", keses: 4 }),
      tetel({ idoszak: "2026-08" }),
      tetel({ idoszak: "2026-09" }),
    ];
    expect(osszesit(sorok)).toEqual(osszesit([...sorok].reverse()));
  });
});

describe("mondatok", () => {
  it("adat nélkül kimondja, hogy nincs mit mutatni", () => {
    expect(mondatok(URES)).toEqual([{ kulcs: "betekinto.mondat.nincs_adat" }]);
  });

  it("hibátlan előzménynél nem beszél késésről és hiányról", () => {
    const kulcsok = mondatok(
      osszesit([tetel({ idoszak: "2026-08" }), tetel({ idoszak: "2026-09" })]),
    ).map((sor) => sor.kulcs);
    expect(kulcsok).toContain("betekinto.mondat.hataridore");
    expect(kulcsok).not.toContain("betekinto.mondat.kesve");
    expect(kulcsok).not.toContain("betekinto.mondat.hianyzo");
  });

  it("a rosszat is kimondja, nem csak a jót", () => {
    const kulcsok = mondatok(
      osszesit([
        tetel({ idoszak: "2026-07", keses: 11 }),
        tetel({ idoszak: "2026-08", allapot: "hianyzik" }),
        tetel({ idoszak: "2026-09", allapot: "elter", osszegFt: 120000 }),
      ]),
    ).map((sor) => sor.kulcs);
    expect(kulcsok).toContain("betekinto.mondat.kesve");
    expect(kulcsok).toContain("betekinto.mondat.hianyzo");
    expect(kulcsok).toContain("betekinto.mondat.eltero");
  });

  it("nem ad pontszámot és nem minősít", () => {
    // Szándékos: a súlyozás, amit mi találunk ki, mérésnek látszana.
    const szoveg = JSON.stringify(
      mondatok(osszesit([tetel({ idoszak: "2026-08" }), tetel({ idoszak: "2026-09" })])),
    );
    for (const tiltott of ["pont", "minosites", "ertekeles", "score"]) {
      expect(szoveg).not.toContain(tiltott);
    }
  });
});

describe("a link állapota", () => {
  const most = new Date(Date.UTC(2026, 8, 20));

  it("a visszavont link visszavont marad, akkor is, ha még nem járt le", () => {
    expect(
      allapota({ lejar: new Date(Date.UTC(2026, 9, 20)), visszavonva: most }, most),
    ).toBe("visszavonva");
  });

  it("a lejárt link nem él", () => {
    expect(allapota({ lejar: new Date(Date.UTC(2026, 8, 19)), visszavonva: null }, most)).toBe(
      "lejart",
    );
  });

  it("a lejárat pillanatában már nem él", () => {
    expect(allapota({ lejar: most, visszavonva: null }, most)).toBe("lejart");
  });

  it("egyébként él", () => {
    expect(allapota({ lejar: new Date(Date.UTC(2026, 9, 1)), visszavonva: null }, most)).toBe(
      "elo",
    );
    expect(allapotNeve("elo")).toEqual({ kulcs: "betekinto.allapot.elo" });
  });

  it("a lejárat naptári napokkal számol", () => {
    expect(lejarat(most, ALAPERTELMEZETT_ELETTARTAM).toISOString()).toBe(
      new Date(Date.UTC(2026, 9, 20)).toISOString(),
    );
  });
});

describe("település a címből", () => {
  it("a magyar címalakból a települést adja", () => {
    expect(telepules("1111 Budapest, Minta tér 2.")).toBe("Budapest");
    expect(telepules("7624 Pécs, Teszt utca 3.")).toBe("Pécs");
    expect(telepules("8600 Siófok, Fő u. 1. 2/4")).toBe("Siófok");
  });

  it("a pontos címet nem adja vissza", () => {
    expect(telepules("1111 Budapest, Minta tér 2.")).not.toContain("Minta");
  });

  it("amit nem ismer fel, arra nem tippel", () => {
    expect(telepules("a nagy sárga ház a sarkon")).toBeNull();
    expect(telepules("Budapest")).toBeNull();
    expect(telepules("")).toBeNull();
    expect(telepules("1111 2222, valami")).toBeNull();
  });
});

describe("amit soha nem mutatunk", () => {
  it("a lista nem üres, és a bérbeadó neve rajta van", () => {
    expect(SOHA_NEM_MUTATJUK.length).toBeGreaterThan(0);
    expect(SOHA_NEM_MUTATJUK.join(" ")).toContain("bérbeadó neve");
  });
});
