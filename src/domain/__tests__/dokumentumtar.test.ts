import { describe, expect, it } from "vitest";
import {
  berloDokumentumai,
  dokumentumtar,
  elszamolasSzovege,
  fajtankent,
  jogviszonyDokumentumai,
  type TarJogviszony,
} from "../dokumentumtar";

const nap = (szoveg: string) => new Date(`${szoveg}T00:00:00.000Z`);

const ures: TarJogviszony = {
  id: "jv1",
  cimke: "Újbuda, Fehérvári út",
  szerzodesek: [],
  jegyzokonyvek: [],
  igazolasok: [],
  elszamolasok: [],
};

const teli: TarJogviszony = {
  ...ures,
  szerzodesek: [
    {
      id: "sz1",
      megnevezes: "Lakásbérleti szerződés",
      allapot: "veglegesitve",
      veglegesitve: nap("2026-08-29"),
      letrehozva: nap("2026-08-20"),
    },
    {
      id: "sz2",
      megnevezes: "Lakásbérleti szerződés (új)",
      allapot: "tervezet",
      veglegesitve: null,
      letrehozva: nap("2026-09-15"),
    },
  ],
  jegyzokonyvek: [
    {
      id: "jk1",
      fajta: "Birtokbaadás",
      idopont: nap("2026-09-01"),
      allapot: "veglegesitve",
      veglegesitve: nap("2026-09-02"),
    },
  ],
  igazolasok: [
    {
      id: "ig1",
      berloNev: "Szabó Tamás",
      idoszak: "2026-09",
      osszegFt: 150_000,
      kiallitva: nap("2026-09-10"),
    },
  ],
  elszamolasok: [
    {
      id: "el1",
      idoszakKezdete: nap("2026-09-01"),
      idoszakVege: nap("2026-09-30"),
      allapot: "kiadva",
      osszegFt: 24_500,
      kiadva: nap("2026-10-03"),
    },
    {
      id: "el2",
      idoszakKezdete: nap("2026-10-01"),
      idoszakVege: nap("2026-10-31"),
      allapot: "tervezet",
      osszegFt: 19_000,
      kiadva: null,
    },
  ],
};

describe("dokumentumtár", () => {
  it("üres jogviszonyból nem csinál sorokat", () => {
    expect(jogviszonyDokumentumai(ures)).toEqual([]);
  });

  it("mind a négy fajtát felveszi", () => {
    const sorok = jogviszonyDokumentumai(teli);
    expect(sorok).toHaveLength(6);
    expect(new Set(sorok.map((sor) => sor.fajta))).toEqual(
      new Set(["szerzodes", "jegyzokonyv", "igazolas", "elszamolas"]),
    );
  });

  it("a legfrissebbel kezd, a legrégebbivel zár", () => {
    const sorok = dokumentumtar([teli]);
    expect(sorok[0].kulcs).toBe("elszamolas:el2");
    expect(sorok[sorok.length - 1].kulcs).toBe("szerzodes:sz1");
  });

  it("a véglegesítés dátumát veszi, nem a létrehozásét", () => {
    const sor = jogviszonyDokumentumai(teli).find((sor) => sor.kulcs === "szerzodes:sz1");
    expect(sor?.datum).toEqual(nap("2026-08-29"));
  });

  it("a tervezetet nem tekinti kiadottnak, és nincs letöltése", () => {
    const sorok = jogviszonyDokumentumai(teli);
    expect(sorok.find((sor) => sor.kulcs === "szerzodes:sz2")?.kiadott).toBe(false);
    expect(sorok.find((sor) => sor.kulcs === "elszamolas:el2")?.letoltes).toBeUndefined();
  });

  it("az elszámolás állapotát kulccsal adja vissza, hogy fordítható legyen", () => {
    const sor = jogviszonyDokumentumai(teli).find((sor) => sor.kulcs === "elszamolas:el1");
    expect(sor?.allapotCimke.kulcs).toBe("dokumentum.elszamolas.allapot.kiadva");
  });

  it("minden sor tudja, melyik jogviszonyhoz tartozik", () => {
    for (const sor of jogviszonyDokumentumai(teli)) {
      expect(sor.jogviszonyId).toBe("jv1");
      expect(sor.jogviszonyCimke).toBe("Újbuda, Fehérvári út");
    }
  });
});

describe("a bérlő nézete", () => {
  it("csak a kiadott okiratokat adja vissza", () => {
    const sorok = berloDokumentumai(dokumentumtar([teli]));
    expect(sorok.map((sor) => sor.kulcs).sort()).toEqual([
      "elszamolas:el1",
      "igazolas:ig1",
      "jegyzokonyv:jk1",
      "szerzodes:sz1",
    ]);
  });

  it("szerkesztő oldalt nem kínál", () => {
    for (const sor of berloDokumentumai(dokumentumtar([teli]))) {
      expect(sor.megnyitas).toBeUndefined();
    }
  });

  it("a letöltés viszont megmarad", () => {
    for (const sor of berloDokumentumai(dokumentumtar([teli]))) {
      expect(sor.letoltes).toBeTruthy();
    }
  });
});

describe("csoportosítás", () => {
  it("rögzített sorrendben, üres csoport nélkül", () => {
    const csoportok = fajtankent(dokumentumtar([teli]));
    expect(csoportok.map((csoport) => csoport.fajta)).toEqual([
      "szerzodes",
      "jegyzokonyv",
      "elszamolas",
      "igazolas",
    ]);
  });

  it("üres tárból üres lista lesz", () => {
    expect(fajtankent([])).toEqual([]);
  });
});

describe("elszámolás szövege", () => {
  const irat = {
    ingatlanMegnevezes: "Újbuda, Fehérvári út",
    ingatlanCim: "1117 Budapest, Fehérvári út 10. 3/2.",
    berlokNeve: "Szabó Tamás és Varga Dóra",
    idoszakKezdete: nap("2026-09-01"),
    idoszakVege: nap("2026-09-30"),
    tetelek: [
      {
        megnevezes: "Villany",
        mennyiseg: 132.5,
        mertekegyseg: "kWh",
        reszletezes: "132,5 kWh kedvezményes áron.",
        osszegFt: 4_892,
      },
      {
        megnevezes: "Közös költség",
        mennyiseg: null,
        mertekegyseg: null,
        reszletezes: "Havi közös költség a szerződés szerint.",
        osszegFt: 18_000,
      },
    ],
    osszegFt: 22_892,
  };

  it("tartalmazza a bérleményt, a bérlőt és az időszakot", () => {
    const szoveg = elszamolasSzovege(irat);
    expect(szoveg).toMatch(/Újbuda, Fehérvári út/);
    expect(szoveg).toMatch(/Szabó Tamás és Varga Dóra/);
    expect(szoveg).toMatch(/2026\. szept/);
  });

  it("a mennyiséget csak ott írja ki, ahol van", () => {
    const szoveg = elszamolasSzovege(irat);
    expect(szoveg).toMatch(/Villany \(132,5 kWh\)/);
    expect(szoveg).toMatch(/Közös költség: /);
  });

  it("minden tétel mellé odateszi a részletezést", () => {
    const szoveg = elszamolasSzovege(irat);
    for (const tetel of irat.tetelek) {
      expect(szoveg).toContain(tetel.reszletezes);
    }
  });

  it("nem tesz bele nem törő szóközt, hogy másolni is lehessen", () => {
    expect(elszamolasSzovege(irat)).not.toMatch(/[  ]/);
  });

  it("a végösszeg a tételek összege", () => {
    const osszeg = irat.tetelek.reduce((eddig, tetel) => eddig + tetel.osszegFt, 0);
    expect(osszeg).toBe(irat.osszegFt);
    expect(elszamolasSzovege(irat)).toMatch(/Összesen: 22 892 Ft/);
  });
});
