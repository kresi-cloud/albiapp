import { describe, expect, it } from "vitest";
import {
  egyeztetesbolTeendok,
  hianyzoAdatokTeendoi,
  kozelgoBefizetesTeendok,
  surgosseg,
  teendoketRendez,
  type TeendoSurgosseggel,
} from "../teendok";

const MA = new Date(Date.UTC(2026, 8, 20));

describe("surgosseg", () => {
  it("három szintre osztja a következő napokat", () => {
    expect(surgosseg(new Date(Date.UTC(2026, 8, 18)), MA)).toBe("lejart");
    expect(surgosseg(new Date(Date.UTC(2026, 8, 20)), MA)).toBe("ma");
    expect(surgosseg(new Date(Date.UTC(2026, 8, 25)), MA)).toBe("kozeli");
    expect(surgosseg(new Date(Date.UTC(2026, 9, 5)), MA)).toBe("kesobbi");
  });
});

describe("teendoketRendez", () => {
  it("a lejárt kerül előre, azon belül a régebbi", () => {
    const teendok: TeendoSurgosseggel[] = [
      { kulcs: "c", cimzett: "berlo", tipus: "x", cim: { kulcs: "teendo.kozelgo" }, esedekesseg: new Date(Date.UTC(2026, 8, 24)), surgosseg: "kozeli" },
      { kulcs: "a", cimzett: "berlo", tipus: "x", cim: { kulcs: "teendo.kozelgo" }, esedekesseg: new Date(Date.UTC(2026, 8, 5)), surgosseg: "lejart" },
      { kulcs: "b", cimzett: "berlo", tipus: "x", cim: { kulcs: "teendo.kozelgo" }, esedekesseg: new Date(Date.UTC(2026, 8, 19)), surgosseg: "lejart" },
    ];
    expect(teendoketRendez(teendok).map((teendo) => teendo.kulcs)).toEqual(["a", "b", "c"]);
  });
});

describe("egyeztetesbolTeendok", () => {
  it("a hiányzó befizetésből mindkét félnek teendő lesz", () => {
    const teendok = egyeztetesbolTeendok([
      {
        jogviszonyId: "jv-1",
        eloirtTetelId: "e-1",
        idoszak: "2026-09",
        allapot: "hianyzik",
        elteresOka: null,
        elteresFt: -180000,
        osszegFt: 180000,
        esedekesseg: new Date(Date.UTC(2026, 8, 5)),
      },
    ]);
    expect(teendok.map((teendo) => teendo.cimzett).sort()).toEqual(["berbeado", "berlo"]);
    expect(new Set(teendok.map((teendo) => teendo.kulcs)).size).toBe(2);
  });

  it("az előírás nélküli utalás csak a bérbeadó teendője", () => {
    const teendok = egyeztetesbolTeendok([
      {
        jogviszonyId: "jv-1",
        eloirtTetelId: null,
        idoszak: null,
        allapot: "elter",
        elteresOka: "nincs_eloiras",
        elteresFt: 250000,
        osszegFt: 0,
        esedekesseg: new Date(Date.UTC(2026, 8, 18)),
      },
    ]);
    expect(teendok).toHaveLength(1);
    expect(teendok[0].cimzett).toBe("berbeado");
  });

  it("a vitás tételből mindkét félnek teendő lesz, mert mindkettőtől bizonylat kell", () => {
    const teendok = egyeztetesbolTeendok([
      {
        jogviszonyId: "jv-1",
        eloirtTetelId: "e-1",
        idoszak: "2026-09",
        allapot: "vitas",
        elteresOka: "ket_oldal_elter",
        elteresFt: -5000,
        osszegFt: 180000,
        esedekesseg: new Date(Date.UTC(2026, 8, 5)),
      },
    ]);
    expect(teendok.map((teendo) => teendo.cimzett).sort()).toEqual(["berbeado", "berlo"]);
    expect(teendok.every((teendo) => teendo.tipus === "befizetes_vitas")).toBe(true);
  });

  it("a meg nem érkezett utalásnál a bérlő teendője kimondja, hogy kivonat nem kell", () => {
    const teendok = egyeztetesbolTeendok([
      {
        jogviszonyId: "jv-1",
        eloirtTetelId: "e-1",
        idoszak: "2026-09",
        allapot: "vitas",
        elteresOka: "nem_erkezett_meg",
        elteresFt: -180000,
        osszegFt: 180000,
        esedekesseg: new Date(Date.UTC(2026, 8, 5)),
      },
    ]);
    const berloi = teendok.find((teendo) => teendo.cimzett === "berlo");
    expect(berloi?.leiras?.kulcs).toBe("teendo.vitas.nem_erkezett_meg");
  });

  it("egyoldalú tételnél csak a hallgató félnek lesz teendője", () => {
    const teendok = egyeztetesbolTeendok([
      {
        jogviszonyId: "jv-1",
        eloirtTetelId: "e-1",
        idoszak: "2026-09",
        allapot: "varakozik",
        elteresOka: "nincs_berbeadoi_igazolas",
        elteresFt: 0,
        osszegFt: 180000,
        esedekesseg: new Date(Date.UTC(2026, 8, 5)),
      },
    ]);
    expect(teendok).toHaveLength(1);
    expect(teendok[0].cimzett).toBe("berbeado");
  });

  it("az egyező befizetésből nem lesz teendő", () => {
    const teendok = egyeztetesbolTeendok([
      {
        jogviszonyId: "jv-1",
        eloirtTetelId: "e-1",
        idoszak: "2026-09",
        allapot: "egyezik",
        elteresOka: null,
        elteresFt: 0,
        osszegFt: 180000,
        esedekesseg: new Date(Date.UTC(2026, 8, 5)),
      },
    ]);
    expect(teendok).toEqual([]);
  });
});

describe("kozelgoBefizetesTeendok", () => {
  it("csak a hét napon belüli, rendezetlen tételt hozza", () => {
    const teendok = kozelgoBefizetesTeendok(
      [
        { id: "kozeli", jogviszonyId: "jv-1", idoszak: "2026-10", esedekesseg: new Date(Date.UTC(2026, 8, 25)), osszegFt: 180000, rendezett: false },
        { id: "tavoli", jogviszonyId: "jv-1", idoszak: "2026-11", esedekesseg: new Date(Date.UTC(2026, 9, 25)), osszegFt: 180000, rendezett: false },
        { id: "rendezett", jogviszonyId: "jv-1", idoszak: "2026-09", esedekesseg: new Date(Date.UTC(2026, 8, 22)), osszegFt: 180000, rendezett: true },
      ],
      MA,
    );
    expect(teendok.map((teendo) => teendo.kulcs)).toEqual(["esedekes:kozeli:berlo"]);
  });
});

describe("hianyzoAdatokTeendoi", () => {
  it("csak a tényleges hiányból csinál teendőt", () => {
    const teendok = hianyzoAdatokTeendoi(
      [
        { cimzett: "berbeado", kulcsResz: "berbeado:b-1", darab: 2, hivatkozas: "/beallitasok" },
        { cimzett: "berbeado", kulcsResz: "berlo:jb-1", darab: 0, hivatkozas: "/berlok" },
        { cimzett: "berlo", kulcsResz: "berlo-sajat:f-1", darab: 3, hivatkozas: "/berlo/adatok" },
      ],
      MA,
    );

    expect(teendok.map((teendo) => teendo.kulcs)).toEqual([
      "adathiany:berbeado:b-1",
      "adathiany:berlo-sajat:f-1",
    ]);
  });

  it("a hiány darabszámát kulcsként adja tovább, nem kész mondatként", () => {
    const [teendo] = hianyzoAdatokTeendoi(
      [{ cimzett: "berlo", kulcsResz: "berlo-sajat:f-1", darab: 3, hivatkozas: "/berlo/adatok" }],
      MA,
    );

    expect(teendo.leiras).toEqual({ kulcs: "adatok.hianyzik", adatok: { darab: 3 } });
  });

  it("mára esedékes, tehát nem látszik lejártnak", () => {
    const [teendo] = hianyzoAdatokTeendoi(
      [{ cimzett: "berlo", kulcsResz: "berlo-sajat:f-1", darab: 1, hivatkozas: "/berlo/adatok" }],
      MA,
    );

    expect(surgosseg(teendo.esedekesseg, MA)).toBe("ma");
  });
});
