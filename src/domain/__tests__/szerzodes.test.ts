import { describe, expect, it } from "vitest";
import {
  betuvel,
  felSzoveg,
  hosszuDatum,
  nevsor,
  osszegSzoveg,
  type Berbeado,
  type Fel,
  type IngatlanAdat,
  type JogviszonyAdat,
} from "../szerzodes";
import {
  ajanlottModulok,
  hianyzoAdatok,
  szakaszok,
  szerzodesSzovege,
  zaradekSorok,
  type Bemenet,
} from "../szerzodes-keszites";

const BERBEADO: Berbeado = {
  nev: "Kiss Péter",
  szuletesiHely: "Pécs",
  szuletesiIdo: new Date(Date.UTC(1977, 3, 11)),
  anyjaNeve: "Nagy Ilona",
  lakcim: "7635 Pécs, Példa utca 1.",
  igazolvanySzam: "123456AB",
  adoazonosito: "8402774199",
  bankszamla: "11773315-09819362-00000000",
  bank: "OTP Bank",
  email: "berbeado@pelda.hu",
};

const BERLO_EGY: Fel = {
  nev: "Tóth Anna",
  szuletesiHely: "Budapest",
  szuletesiIdo: new Date(Date.UTC(2006, 9, 25)),
  anyjaNeve: "Kovács Judit",
  lakcim: "2463 Tordas, Példa utca 7.",
  igazolvanySzam: "553362TE",
  email: "anna@pelda.hu",
};

const BERLO_KETTO: Fel = { ...BERLO_EGY, nev: "Szabó Panna", email: "panna@pelda.hu" };

const INGATLAN: IngatlanAdat = {
  megnevezes: "Belvárosi garzon",
  cim: "7621 Pécs, Példa utca 20. I/8.",
  alapteruletM2: 43,
  helyrajziSzam: "17607/A/8",
  energetikaiAzonosito: "HET-01312555",
  kozosKoltsegFt: 14000,
};

const JOGVISZONY: JogviszonyAdat = {
  kezdete: new Date(Date.UTC(2026, 7, 29)),
  vege: new Date(Date.UTC(2027, 7, 31)),
  berletiDijFt: 150000,
  kozosKoltsegFt: 14000,
  kaucioFt: 300000,
  fizetesiNap: 10,
  rezsiElszamolas: "almero",
  rezsiAtalanyFt: 0,
};

function bemenet(modositas: Partial<Bemenet> = {}): Bemenet {
  return {
    berbeado: BERBEADO,
    berlok: [BERLO_EGY],
    ingatlan: INGATLAN,
    jogviszony: JOGVISZONY,
    valasztottModulok: [],
    parameterek: {},
    kelteHelye: "Pécs",
    kelte: new Date(Date.UTC(2026, 7, 29)),
    ...modositas,
  };
}

describe("betuvel", () => {
  it("a szerződésben szokásos összegeket kiírja", () => {
    expect(betuvel(0)).toBe("nulla");
    expect(betuvel(1)).toBe("egy");
    expect(betuvel(2)).toBe("kettő");
    expect(betuvel(22)).toBe("huszonkettő");
    expect(betuvel(101)).toBe("százegy");
    expect(betuvel(2000)).toBe("kétezer");
    expect(betuvel(22000)).toBe("huszonkétezer");
    expect(betuvel(150000)).toBe("százötvenezer");
    expect(betuvel(300000)).toBe("háromszázezer");
    expect(betuvel(1000)).toBe("ezer");
    expect(betuvel(1234)).toBe("ezerkétszázharmincnégy");
    expect(betuvel(1000000)).toBe("egymillió");
    expect(betuvel(58000000)).toBe("ötvennyolcmillió");
  });

  it("negatív összegre üres szöveget ad, nem tippel", () => {
    expect(betuvel(-1)).toBe("");
  });

  it("az összeg szerződéses alakja a számot és a betűt is tartalmazza", () => {
    expect(osszegSzoveg(150000)).toBe("150 000 Ft, azaz százötvenezer forint");
  });
});

describe("felSzoveg", () => {
  it("a megadott azonosító adatokat felsorolja", () => {
    const szoveg = felSzoveg(BERBEADO);
    expect(szoveg).toContain("Kiss Péter");
    expect(szoveg).toContain("anyja neve: Nagy Ilona");
    expect(szoveg).toContain("adóazonosító jel: 8402774199");
  });

  it("a hiányzó adatot kihagyja, nem ír oda üres mezőt", () => {
    const szoveg = felSzoveg({ nev: "Név Nélküli Adat", lakcim: "Pécs" });
    expect(szoveg).toBe("Név Nélküli Adat (állandó lakcím: Pécs)");
  });

  it("adat nélkül csak a nevet adja", () => {
    expect(felSzoveg({ nev: "Egyedül Áll" })).toBe("Egyedül Áll");
  });
});

describe("nevsor és dátum", () => {
  it("magyarul sorol fel", () => {
    expect(nevsor([])).toBe("");
    expect(nevsor(["Anna"])).toBe("Anna");
    expect(nevsor(["Anna", "Panna"])).toBe("Anna és Panna");
    expect(nevsor(["Anna", "Panna", "Bea"])).toBe("Anna, Panna és Bea");
  });

  it("a dátumot szerződéses alakban írja", () => {
    expect(hosszuDatum(new Date(Date.UTC(2026, 7, 29)))).toBe("2026. augusztus 29.");
  });
});

describe("szakaszok", () => {
  it("a kötelező modulokat választás nélkül is beteszi, sorszámozva", () => {
    const kesz = szakaszok(bemenet());
    expect(kesz[0].kulcs).toBe("felek");
    expect(kesz[0].sorszam).toBe(1);
    expect(kesz.map((szakasz) => szakasz.sorszam)).toEqual(
      kesz.map((_, index) => index + 1),
    );
    expect(kesz.some((szakasz) => szakasz.kulcs === "zaro_rendelkezesek")).toBe(true);
  });

  it("a választható modul csak akkor kerül be, ha bekapcsolták", () => {
    const nelkule = szakaszok(bemenet());
    expect(nelkule.some((szakasz) => szakasz.kulcs === "nyari_szunet")).toBe(false);

    const vele = szakaszok(bemenet({ valasztottModulok: ["nyari_szunet"] }));
    expect(vele.some((szakasz) => szakasz.kulcs === "nyari_szunet")).toBe(true);
  });

  it("az üres szövegű modul kimarad, hogy ne legyen üres sorszám", () => {
    const kesz = szakaszok(
      bemenet({
        jogviszony: { ...JOGVISZONY, kaucioFt: 0 },
        valasztottModulok: ["ovadek"],
      }),
    );
    expect(kesz.some((szakasz) => szakasz.kulcs === "ovadek")).toBe(false);
  });

  it("egy bérlőnél az egyetemleges felelősség modul akkor sem kerül be, ha bekapcsolták", () => {
    const kesz = szakaszok(bemenet({ valasztottModulok: ["egyetemleges_felelosseg"] }));
    expect(kesz.some((szakasz) => szakasz.kulcs === "egyetemleges_felelosseg")).toBe(false);
  });
});

describe("több bérlő", () => {
  it("többes számban fogalmaz", () => {
    const kesz = szakaszok(bemenet({ berlok: [BERLO_EGY, BERLO_KETTO] }));
    const dij = kesz.find((szakasz) => szakasz.kulcs === "berleti_dij");
    expect(dij?.bekezdesek.join(" ")).toContain("A Bérlők");
    expect(dij?.bekezdesek.join(" ")).toContain("kötelesek");
  });

  it("egy bérlőnél egyes számban fogalmaz", () => {
    const kesz = szakaszok(bemenet());
    const dij = kesz.find((szakasz) => szakasz.kulcs === "berleti_dij");
    expect(dij?.bekezdesek.join(" ")).toContain("A Bérlő ");
    expect(dij?.bekezdesek.join(" ")).toContain("köteles");
  });

  it("az egyetemleges felelősséget két bérlőnél ajánlja", () => {
    expect(ajanlottModulok({ ...bemenet(), berlok: [BERLO_EGY, BERLO_KETTO] })).toContain(
      "egyetemleges_felelosseg",
    );
    expect(ajanlottModulok(bemenet())).not.toContain("egyetemleges_felelosseg");
  });

  it("a felmondás közlését mindkét bérlővel külön-külön írja elő", () => {
    const kesz = szakaszok(bemenet({ berlok: [BERLO_EGY, BERLO_KETTO] }));
    const felmondas = kesz.find((szakasz) => szakasz.kulcs === "megszunes_felmondas");
    expect(felmondas?.bekezdesek.join(" ")).toContain("külön-külön");
  });
});

describe("a rezsi elszámolási módja a szerződésbe is átjön", () => {
  it("mérőóra szerinti elszámolásnál a továbbhárításról szól", () => {
    const kesz = szakaszok(bemenet());
    const kozuzem = kesz.find((szakasz) => szakasz.kulcs === "kozuzem");
    expect(kozuzem?.bekezdesek.join(" ")).toContain("fogyasztáshoz kapcsolódó közüzemi díját");
  });

  it("átalánynál az átalány összegét írja, nem tételes elszámolást", () => {
    const kesz = szakaszok(
      bemenet({
        jogviszony: { ...JOGVISZONY, rezsiElszamolas: "atalany", rezsiAtalanyFt: 25000 },
      }),
    );
    const kozuzem = kesz.find((szakasz) => szakasz.kulcs === "kozuzem");
    expect(kozuzem?.bekezdesek.join(" ")).toContain("rezsiátalányt");
    expect(kozuzem?.bekezdesek.join(" ")).toContain("25 000 Ft");
  });

  it("mérőóra nélküli elszámolásnál nincs havi leolvasási kötelezettség", () => {
    const kesz = szakaszok(
      bemenet({ jogviszony: { ...JOGVISZONY, rezsiElszamolas: "atalany" } }),
    );
    const ellenorzes = kesz.find((szakasz) => szakasz.kulcs === "ellenorzes_leolvasas");
    expect(ellenorzes?.bekezdesek.join(" ")).not.toContain("leolvasását a Felek havonta");
  });
});

describe("paraméterek", () => {
  it("a megadott érték felülírja az alapértelmezést", () => {
    const kesz = szakaszok(
      bemenet({
        valasztottModulok: ["allattartas_dohanyzas"],
        parameterek: { allattartas: "hozzajarulassal" },
      }),
    );
    const modul = kesz.find((szakasz) => szakasz.kulcs === "allattartas_dohanyzas");
    expect(modul?.bekezdesek.join(" ")).toContain("előzetes írásbeli hozzájárulásával tartható");
  });

  it("segítő kutyát egyik beállítás sem tilt", () => {
    const kesz = szakaszok(bemenet({ valasztottModulok: ["allattartas_dohanyzas"] }));
    const modul = kesz.find((szakasz) => szakasz.kulcs === "allattartas_dohanyzas");
    expect(modul?.bekezdesek.join(" ")).toContain("segítő kutyát");
  });

  it("a közlemény bekerül a fizetési pontba, mert ebből párosít az alkalmazás", () => {
    const kesz = szakaszok(bemenet({ parameterek: { dij_kozlemeny: "Anna 20. - 2026/09" } }));
    const dij = kesz.find((szakasz) => szakasz.kulcs === "berleti_dij");
    expect(dij?.bekezdesek.join(" ")).toContain("Anna 20. - 2026/09");
  });
});

describe("hianyzoAdatok", () => {
  it("üres adatoknál megmondja, mi hiányzik", () => {
    const hianyok = hianyzoAdatok(
      bemenet({
        berbeado: { nev: "Kiss Péter" },
        ingatlan: { ...INGATLAN, helyrajziSzam: null, energetikaiAzonosito: null },
        berlok: [{ nev: "Tóth Anna" }],
      }),
    );
    expect(hianyok.join(" ")).toContain("bérbeadó lakcíme");
    expect(hianyok.join(" ")).toContain("bankszámlaszáma");
    expect(hianyok.join(" ")).toContain("helyrajzi száma");
    expect(hianyok.join(" ")).toContain("Tóth Anna");
  });

  it("teljes adatsornál nincs hiány", () => {
    expect(hianyzoAdatok(bemenet())).toEqual([]);
  });
});

describe("szerzodesSzovege", () => {
  it("fejlécet, számozott pontokat és aláírásblokkot ad", () => {
    const szoveg = szerzodesSzovege(bemenet({ berlok: [BERLO_EGY, BERLO_KETTO] }));
    expect(szoveg.startsWith("LAKÁSBÉRLETI SZERZŐDÉS")).toBe(true);
    expect(szoveg).toContain("1. Szerződő felek");
    expect(szoveg).toContain("Kelt: Pécs, 2026. augusztus 29.");
    expect(szoveg).toContain("Bérlők:");
    expect(szoveg).toContain("Tóth Anna és Szabó Panna");
    expect(szoveg).toContain("Előttünk, mint tanúk előtt:");
  });

  it("tanúk nélkül nincs tanúblokk", () => {
    const szoveg = szerzodesSzovege(bemenet({ parameterek: { tanuk: "nem" } }));
    expect(szoveg).not.toContain("tanúk előtt");
  });

  it("a bérleti díjat a jogviszonyból veszi, nem külön paraméterből", () => {
    const szoveg = szerzodesSzovege(
      bemenet({ jogviszony: { ...JOGVISZONY, berletiDijFt: 185000 } }),
    );
    expect(szoveg).toContain("185 000 Ft, azaz száznyolcvanötezer forint");
  });
});

describe("zaradekSorok", () => {
  it("a szerkesztőben is megmutatja a keltet és az aláírókat", () => {
    const sorok = zaradekSorok(bemenet({ berlok: [BERLO_EGY, BERLO_KETTO] }));
    expect(sorok[0]).toBe("Kelt: Pécs, 2026. augusztus 29.");
    expect(sorok).toContain("Bérlők:");
    expect(sorok).toContain("Tóth Anna és Szabó Panna");
  });

  it("kelt nélkül kipontozott helyet hagy, nem mai dátumot tippel", () => {
    const sorok = zaradekSorok(bemenet({ kelteHelye: "", kelte: null }));
    expect(sorok[0]).toBe("Kelt: ………………………………");
  });
});
