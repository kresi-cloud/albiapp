import { describe, expect, it } from "vitest";
import {
  ALAPERTELMEZETT_ELETTARTAM,
  ELETTARTAM_NAPOK,
  SOHA_NEM_MUTATJUK,
  URES,
  allapota,
  allapotNeve,
  haviAllapotNeve,
  havonta,
  lejarat,
  mondatok,
  osszesit,
  telepules,
  type BetekintoTetel,
} from "../betekinto";

function tetel(reszlet: Partial<BetekintoTetel>): BetekintoTetel {
  return {
    idoszak: "2026-09",
    allapot: "egyezik",
    keses: 0,
    eloirtFt: 180000,
    erkezettFt: 180000,
    ...reszlet,
  };
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
      tetel({ idoszak: "2026-08", allapot: "hianyzik", keses: 0, erkezettFt: 0 }),
      tetel({ idoszak: "2026-09" }),
    ]);
    expect(osszesites.hianyzo).toBe(1);
    expect(osszesites.hataridore).toBe(1);
    expect(osszesites.kesve).toBe(0);
  });

  it("az eltérő összegű befizetés külön számol, de megérkezettnek számít", () => {
    const osszesites = osszesit([tetel({ allapot: "elter", erkezettFt: 150000 })]);
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
        tetel({ idoszak: "2026-08", allapot: "hianyzik", erkezettFt: 0 }),
        tetel({ idoszak: "2026-09", allapot: "elter", erkezettFt: 120000 }),
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

describe("havi összevonás", () => {
  it("egy hónap három előírása egy sorrá áll össze", () => {
    // Bérleti díj, közös költség, rezsiátalány: a szülő egy sort akar látni.
    const sorok = havonta([
      tetel({ idoszak: "2026-09", eloirtFt: 180000, erkezettFt: 180000 }),
      tetel({ idoszak: "2026-09", eloirtFt: 22000, erkezettFt: 22000 }),
      tetel({ idoszak: "2026-09", eloirtFt: 25000, erkezettFt: 25000 }),
    ]);
    expect(sorok).toHaveLength(1);
    expect(sorok[0].eloirtFt).toBe(227000);
    expect(sorok[0].erkezettFt).toBe(227000);
    expect(sorok[0].allapot).toBe("egyezik");
  });

  it("egyetlen rendezetlen tétel rendezetlenné teszi a hónapot", () => {
    const sorok = havonta([
      tetel({ idoszak: "2026-09", eloirtFt: 180000, erkezettFt: 180000 }),
      tetel({ idoszak: "2026-09", allapot: "hianyzik", eloirtFt: 22000, erkezettFt: 0 }),
    ]);
    expect(sorok[0].allapot).toBe("hianyzik");
    expect(sorok[0].eloirtFt).toBe(202000);
    expect(sorok[0].erkezettFt).toBe(180000);
  });

  it("a hónap késése a leghosszabb tételkésés", () => {
    const sorok = havonta([
      tetel({ idoszak: "2026-09", keses: 2 }),
      tetel({ idoszak: "2026-09", keses: 9 }),
    ]);
    expect(sorok[0].keses).toBe(9);
  });

  it("a hiányzó tétel nem hoz késést: nincs mihez képest késnie", () => {
    const sorok = havonta([
      tetel({ idoszak: "2026-09", keses: 3 }),
      tetel({ idoszak: "2026-09", allapot: "hianyzik", keses: 0, erkezettFt: 0 }),
    ]);
    expect(sorok[0].keses).toBe(3);
  });

  it("a legfrissebb hónappal kezd", () => {
    const sorok = havonta([
      tetel({ idoszak: "2026-07" }),
      tetel({ idoszak: "2026-09" }),
      tetel({ idoszak: "2026-08" }),
    ]);
    expect(sorok.map((sor) => sor.idoszak)).toEqual(["2026-09", "2026-08", "2026-07"]);
  });
});

describe("a nyitott összeg", () => {
  it("nulla, ha minden megérkezett", () => {
    expect(osszesit([tetel({ idoszak: "2026-08" }), tetel({ idoszak: "2026-09" })]).nyitottFt).toBe(
      0,
    );
  });

  it("a hiányzó hónap teljes előírása nyitott", () => {
    const osszesites = osszesit([
      tetel({ idoszak: "2026-08" }),
      tetel({ idoszak: "2026-09", allapot: "hianyzik", erkezettFt: 0 }),
    ]);
    expect(osszesites.nyitottFt).toBe(180000);
    expect(osszesites.eloirtFt).toBe(360000);
    expect(osszesites.erkezettFt).toBe(180000);
  });

  it("a kevesebb beérkezésből a különbség marad nyitva", () => {
    expect(osszesit([tetel({ allapot: "elter", erkezettFt: 150000 })]).nyitottFt).toBe(30000);
  });

  it("a túlfizetett hónap nem fedi el a következő elmaradását", () => {
    // Hónaponként vágunk nullára, különben egy februári túlutalás eltüntetné a
    // márciusi elmaradást, és pont a lényeg veszne el.
    const osszesites = osszesit([
      tetel({ idoszak: "2026-08", allapot: "elter", erkezettFt: 250000 }),
      tetel({ idoszak: "2026-09", allapot: "hianyzik", erkezettFt: 0 }),
    ]);
    expect(osszesites.nyitottFt).toBe(180000);
  });
});

describe("a havi sor címkéje", () => {
  it("minden ághoz más kulcs tartozik", () => {
    expect(haviAllapotNeve(tetel({}))).toEqual({ kulcs: "betekinto.havi.rendben" });
    expect(haviAllapotNeve(tetel({ keses: 4 }))).toEqual({
      kulcs: "betekinto.havi.kesve",
      adatok: { napok: 4 },
    });
    expect(haviAllapotNeve(tetel({ allapot: "elter", erkezettFt: 1 }))).toEqual({
      kulcs: "betekinto.havi.elter",
    });
    expect(haviAllapotNeve(tetel({ allapot: "hianyzik", erkezettFt: 0 }))).toEqual({
      kulcs: "betekinto.havi.hianyzik",
    });
  });

  it("a késés erősebb jelzés, mint az eltérő összeg", () => {
    // Aki késve fizetett mást, arról az számít, hogy késett.
    expect(haviAllapotNeve(tetel({ allapot: "elter", keses: 5, erkezettFt: 1 })).kulcs).toBe(
      "betekinto.havi.kesve",
    );
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
    expect(lejarat(most, 30).toISOString()).toBe(new Date(Date.UTC(2026, 9, 20)).toISOString());
  });

  it("az alapértelmezett élettartam egy tanévnél hosszabb", () => {
    // Ha a link egy hónap múlva lejár, abból nem óvatosság lesz, hanem havi
    // kérdezősködés — pont az, amit a betekintő el akar kerülni.
    expect(ALAPERTELMEZETT_ELETTARTAM).toBeGreaterThanOrEqual(365);
    expect(ELETTARTAM_NAPOK).toContain(ALAPERTELMEZETT_ELETTARTAM);
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
