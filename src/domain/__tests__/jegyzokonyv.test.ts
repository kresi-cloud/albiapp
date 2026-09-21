import { describe, expect, it } from "vitest";
import {
  hianyzoTetelek,
  jegyzokonyvSzovege,
  oraallastKiolvas,
  tetelekFajtankent,
  vallaltHibak,
  type JegyzokonyvBemenet,
  type Tetel,
} from "../jegyzokonyv";
import {
  idoszakCimke,
  igazolasSzovege,
  igazolhatoBefizetesek,
  type IgazolasBemenet,
} from "../igazolas";

const BERBEADO = { nev: "Kiss Péter", lakcim: "7635 Pécs, Példa utca 1.", igazolvanySzam: "123456AB", email: "berbeado@pelda.hu" };
const ANNA = { nev: "Tóth Anna", lakcim: "2463 Tordas, Példa utca 7.", igazolvanySzam: "553362TE" };
const PANNA = { nev: "Szabó Panna", lakcim: "2040 Budaörs, Példa utca 6." };

const TETELEK: Tetel[] = [
  { fajta: "meroora", megnevezes: "Villany (E-884213)", ertek: "2893 kWh" },
  { fajta: "meroora", megnevezes: "Víz (V-119043)", ertek: "23,929 m³", megjegyzes: "A szomszéd mellékmérőjét is méri." },
  { fajta: "kulcs", megnevezes: "Lakáskulcs-garnitúra", ertek: "2 db" },
  { fajta: "kulcs", megnevezes: "Postaládakulcs", ertek: "2 db" },
  {
    fajta: "hiba",
    megnevezes: "A gázkazán huzamos fűtésre nem alkalmas",
    megjegyzes: "Szerviz javítja",
    felelos: "berbeado",
    hatarido: new Date(Date.UTC(2026, 8, 8)),
  },
  { fajta: "hiba", megnevezes: "A vízcsapokról hiányoznak a perlátorok" },
  { fajta: "dokumentum", megnevezes: "Energetikai tanúsítvány digitális másolata" },
];

function bemenet(modositas: Partial<JegyzokonyvBemenet> = {}): JegyzokonyvBemenet {
  return {
    fajta: "birtokbaadas",
    idopont: new Date(Date.UTC(2026, 7, 29, 18, 30)),
    berbeado: BERBEADO,
    berlok: [ANNA],
    ingatlan: {
      megnevezes: "Belvárosi garzon",
      cim: "7621 Pécs, Példa utca 20. I/8.",
      alapteruletM2: 43,
      helyrajziSzam: "17607/A/8",
    },
    allapotLeiras: "Közepes állapotú, használt lakóingatlan.",
    tetelek: TETELEK,
    ...modositas,
  };
}

describe("tetelekFajtankent", () => {
  it("a papíron megszokott sorrendben csoportosít, üres csoport nélkül", () => {
    const csoportok = tetelekFajtankent(TETELEK);
    expect(csoportok.map((csoport) => csoport.fajta)).toEqual([
      "meroora",
      "kulcs",
      "hiba",
      "dokumentum",
    ]);
    expect(csoportok[0].tetelek).toHaveLength(2);
  });

  it("csak mérőórából álló jegyzőkönyvnél egy csoport marad", () => {
    const csoportok = tetelekFajtankent([TETELEK[0]]);
    expect(csoportok).toHaveLength(1);
  });
});

describe("hianyzoTetelek", () => {
  it("teljes jegyzőkönyvnél nincs hiány", () => {
    expect(hianyzoTetelek(bemenet())).toEqual([]);
  });

  it("óraállás nélkül figyelmeztet, mert nincs miből elszámolni", () => {
    const hianyok = hianyzoTetelek(bemenet({ tetelek: [TETELEK[2]] }));
    expect(hianyok.map((sor) => sor.kulcs)).toContain("hiany.jegyzokonyv.nincs_meroora");
  });

  it("a kitöltetlen óraállást nevén nevezi", () => {
    const hianyok = hianyzoTetelek(
      bemenet({ tetelek: [{ fajta: "meroora", megnevezes: "Villany", ertek: "" }, TETELEK[2]] }),
    );
    expect(hianyok).toContainEqual({
      kulcs: "hiany.jegyzokonyv.oraallas",
      adatok: { megnevezes: "Villany" },
    });
  });

  it("hiányzó kulcssor és üres állapotleírás is hiány", () => {
    const hianyok = hianyzoTetelek(
      bemenet({ tetelek: [TETELEK[0]], allapotLeiras: "  " }),
    );
    const kulcsok = hianyok.map((sor) => sor.kulcs);
    expect(kulcsok).toContain("hiany.jegyzokonyv.nincs_kulcs");
    expect(kulcsok).toContain("hiany.jegyzokonyv.allapot");
  });
});

describe("vallaltHibak", () => {
  it("csak a felelőssel és határidővel rögzített hibát adja vissza", () => {
    const vallalt = vallaltHibak(TETELEK);
    expect(vallalt).toHaveLength(1);
    expect(vallalt[0].megnevezes).toContain("gázkazán");
  });
});

describe("jegyzokonyvSzovege", () => {
  it("fejlécet, számozott szakaszokat és aláírásblokkot ad", () => {
    const szoveg = jegyzokonyvSzovege(bemenet());
    expect(szoveg.startsWith("BÉRLEMÉNY ÁTADÁS-ÁTVÉTELI JEGYZŐKÖNYV")).toBe(true);
    expect(szoveg).toContain("Birtokbaadás · 2026. augusztus 29. 18:30");
    expect(szoveg).toContain("17607/A/8 hrsz.");
    expect(szoveg).toContain("1. Mérőórák");
    expect(szoveg).toContain("2893 kWh");
    expect(szoveg).toContain("Bérlő:");
  });

  it("a vállalt javítást felelőssel és határidővel írja ki", () => {
    const szoveg = jegyzokonyvSzovege(bemenet());
    expect(szoveg).toContain("Vállalás: a Bérbeadó, 2026. szeptember 8. napjáig.");
  });

  it("hiba nélkül is kiírja a felelősségi szabályt", () => {
    const szoveg = jegyzokonyvSzovege(
      bemenet({ tetelek: TETELEK.filter((tetel) => tetel.fajta !== "hiba") }),
    );
    expect(szoveg).toContain("hibát vagy hiányosságot nem rögzítettek");
    expect(szoveg).toContain("utóbb nem hivatkozhat");
  });

  it("több bérlőnél többes számban fogalmaz", () => {
    const szoveg = jegyzokonyvSzovege(bemenet({ berlok: [ANNA, PANNA] }));
    expect(szoveg).toContain("A Bérlők kijelentik");
    expect(szoveg).toContain("vették át");
    expect(szoveg).toContain("Tóth Anna és Szabó Panna");
  });

  it("visszaadásnál a visszaadás szófordulatát használja", () => {
    const szoveg = jegyzokonyvSzovege(bemenet({ fajta: "visszaadas" }));
    expect(szoveg).toContain("Visszaadás ·");
    expect(szoveg).toContain("adta vissza");
  });
});

describe("idoszakCimke", () => {
  it("magyar hónapnevet ad", () => {
    expect(idoszakCimke("2026-09")).toBe("2026. szeptember");
    expect(idoszakCimke("2026-01")).toBe("2026. január");
  });

  it("ismeretlen alakot változatlanul hagy", () => {
    expect(idoszakCimke("ötödik hó")).toBe("ötödik hó");
    expect(idoszakCimke("2026-13")).toBe("2026-13");
  });
});

describe("igazolhatoBefizetesek", () => {
  it("csak a ténylegesen beérkezett befizetést engedi, újabb hónap elöl", () => {
    const kesz = igazolhatoBefizetesek([
      { idoszak: "2026-08", osszegFt: 150000, napja: new Date(), allapot: "egyezik" },
      { idoszak: "2026-09", osszegFt: 148000, napja: new Date(), allapot: "elter" },
      { idoszak: "2026-10", osszegFt: 0, napja: new Date(), allapot: "hianyzik" },
    ]);
    expect(kesz.map((sor) => sor.idoszak)).toEqual(["2026-09", "2026-08"]);
  });
});

function igazolasBemenet(modositas: Partial<IgazolasBemenet> = {}): IgazolasBemenet {
  return {
    berbeado: BERBEADO,
    berlo: ANNA,
    osszesBerlo: [ANNA],
    ingatlan: { cim: "7621 Pécs, Példa utca 20. I/8." },
    jogviszony: {
      kezdete: new Date(Date.UTC(2026, 7, 29)),
      vege: new Date(Date.UTC(2027, 7, 31)),
      berletiDijFt: 150000,
      szerzodesKelte: new Date(Date.UTC(2026, 7, 29)),
    },
    cel: "a 2026/2027. tanévi lakhatási támogatáshoz",
    idoszak: "2026-09",
    osszegFt: 150000,
    teljesitesNapja: new Date(Date.UTC(2026, 8, 4)),
    teljesitesModja: "atutalas",
    kiallitasHelye: "Pécs",
    kiallitasNapja: new Date(Date.UTC(2026, 8, 6)),
    ...modositas,
  };
}

describe("igazolasSzovege", () => {
  it("a befizetés adatait a párosításból írja ki", () => {
    const szoveg = igazolasSzovege(igazolasBemenet());
    expect(szoveg).toContain("Tárgyhó: 2026. szeptember");
    expect(szoveg).toContain("150 000 Ft, azaz százötvenezer forint");
    expect(szoveg).toContain("A teljesítés napja: 2026. szeptember 4.");
    expect(szoveg).toContain("A teljesítés módja: banki átutalás");
  });

  it("egy bérlőnél nem emleget egyetemleges felelősséget", () => {
    expect(igazolasSzovege(igazolasBemenet())).not.toContain("egyetemlegesen");
  });

  it("több bérlőnél kiírja az egyetemleges felelősséget és az együttes díjat", () => {
    const szoveg = igazolasSzovege(igazolasBemenet({ osszesBerlo: [ANNA, PANNA] }));
    expect(szoveg).toContain("a 2 bérlő együttes bérleti jogviszonyára");
    expect(szoveg).toContain("egyetemlegesen");
  });

  it("megmondja, hogy nem hivatalos formanyomtatvány", () => {
    expect(igazolasSzovege(igazolasBemenet())).toContain("nem hatósági vagy intézményi formanyomtatvány");
  });

  it("határozatlan jogviszonynál nem ír ki záró dátumot", () => {
    const szoveg = igazolasSzovege(
      igazolasBemenet({
        jogviszony: {
          kezdete: new Date(Date.UTC(2026, 7, 29)),
          vege: null,
          berletiDijFt: 150000,
          szerzodesKelte: null,
        },
      }),
    );
    expect(szoveg).toContain("napjától határozatlan időre");
  });
});

describe("oraallastKiolvas", () => {
  it("a mértékegységgel együtt beírt állásból kiveszi a számot", () => {
    expect(oraallastKiolvas("2893 kWh")).toBe(2893);
    expect(oraallastKiolvas("91,058 m³")).toBe(91.058);
    expect(oraallastKiolvas("23.929")).toBe(23.929);
    expect(oraallastKiolvas("  1200  ")).toBe(1200);
  });

  it("szám nélküli vagy értelmetlen mezőből nem tippel", () => {
    expect(oraallastKiolvas("")).toBeNull();
    expect(oraallastKiolvas("nem olvasható")).toBeNull();
    expect(oraallastKiolvas("-5")).toBeNull();
  });
});
