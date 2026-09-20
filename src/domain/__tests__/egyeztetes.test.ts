import { describe, expect, it } from "vitest";
import {
  ABLAK_MAX_NAP,
  ablakotEllenoriz,
  ALAPERTELMEZETT_BEALLITASOK,
  egyeztet,
  type BerloiIgazolas,
  type EloirtTetel,
  type Kivonattetel,
} from "../egyeztetes";

const MA = new Date(Date.UTC(2026, 8, 20)); // 2026. szeptember 20.

function eloiras(reszlet: Partial<EloirtTetel> = {}): EloirtTetel {
  return {
    id: "eloiras-1",
    tipus: "berleti_dij",
    idoszak: "2026-09",
    esedekesseg: new Date(Date.UTC(2026, 8, 5)),
    osszegFt: 180000,
    ...reszlet,
  };
}

function kivonat(reszlet: Partial<Kivonattetel> = {}): Kivonattetel {
  return {
    id: "kivonat-1",
    konyvelesDatuma: new Date(Date.UTC(2026, 8, 5)),
    osszegFt: 180000,
    ...reszlet,
  };
}

function igazolas(reszlet: Partial<BerloiIgazolas> = {}): BerloiIgazolas {
  return {
    id: "igazolas-1",
    utalasDatuma: new Date(Date.UTC(2026, 8, 4)),
    osszegFt: 180000,
    ...reszlet,
  };
}

describe("egyeztet", () => {
  it("határidőre érkezett pontos összeget egyezésnek lát", () => {
    const [eredmeny] = egyeztet([eloiras()], [igazolas()], [kivonat()], MA);
    expect(eredmeny.allapot).toBe("egyezik");
    expect(eredmeny.keses).toBe(0);
    expect(eredmeny.kivonattetelId).toBe("kivonat-1");
    expect(eredmeny.berloiIgazolasId).toBe("igazolas-1");
  });

  it("a késve érkezett befizetés egyezik, de a késést megjegyzi", () => {
    const [eredmeny] = egyeztet(
      [eloiras()],
      [],
      [kivonat({ konyvelesDatuma: new Date(Date.UTC(2026, 8, 12)) })],
      MA,
    );
    expect(eredmeny.allapot).toBe("egyezik");
    expect(eredmeny.keses).toBe(7);
    expect(eredmeny.magyarazat).toContain("7 nappal");
  });

  it("a kevesebb összeget eltérésként jelzi, és megmondja a különbséget", () => {
    const [eredmeny] = egyeztet([eloiras()], [], [kivonat({ osszegFt: 175000 })], MA);
    expect(eredmeny.allapot).toBe("elter");
    expect(eredmeny.elteresOka).toBe("osszeg");
    expect(eredmeny.elteresFt).toBe(-5000);
  });

  it("ha a bérlő igazolta a befizetést, de a kivonaton nincs, az is eltérés", () => {
    const [eredmeny] = egyeztet([eloiras()], [igazolas()], [], MA);
    expect(eredmeny.allapot).toBe("elter");
    expect(eredmeny.elteresOka).toBe("nincs_kivonattetel");
    expect(eredmeny.berloiIgazolasId).toBe("igazolas-1");
  });

  it("lejárt esedékességre, befizetés nélkül, hiányzik", () => {
    const [eredmeny] = egyeztet([eloiras()], [], [], MA);
    expect(eredmeny.allapot).toBe("hianyzik");
    expect(eredmeny.elteresFt).toBe(-180000);
  });

  it("a jövőbeli esedékességből még nem csinál hiányt", () => {
    const eredmeny = egyeztet(
      [eloiras({ esedekesseg: new Date(Date.UTC(2026, 9, 5)), idoszak: "2026-10" })],
      [],
      [],
      MA,
    );
    expect(eredmeny).toEqual([]);
  });

  it("az előírás nélküli beérkezett utalást is a bérbeadó elé viszi", () => {
    const eredmeny = egyeztet(
      [],
      [],
      [kivonat({ id: "kivonat-x", osszegFt: 250000 })],
      MA,
    );
    expect(eredmeny).toHaveLength(1);
    expect(eredmeny[0].allapot).toBe("elter");
    expect(eredmeny[0].elteresOka).toBe("nincs_eloiras");
    expect(eredmeny[0].eloirtTetelId).toBeNull();
  });

  it("egy kivonattételt nem használ fel két előíráshoz", () => {
    const eredmeny = egyeztet(
      [
        eloiras({ id: "szept", idoszak: "2026-09", esedekesseg: new Date(Date.UTC(2026, 8, 5)) }),
        eloiras({ id: "aug", idoszak: "2026-08", esedekesseg: new Date(Date.UTC(2026, 7, 5)) }),
      ],
      [],
      [kivonat({ id: "egyetlen", konyvelesDatuma: new Date(Date.UTC(2026, 8, 5)) })],
      MA,
    );
    const parositott = eredmeny.filter((sor) => sor.kivonattetelId === "egyetlen");
    expect(parositott).toHaveLength(1);
    const hianyzo = eredmeny.filter((sor) => sor.allapot === "hianyzik");
    expect(hianyzo).toHaveLength(1);
  });

  it("a pontos összeget választja a időben közelebbi, de rossz összegű helyett", () => {
    const eredmeny = egyeztet(
      [eloiras()],
      [],
      [
        kivonat({ id: "rossz-osszeg", konyvelesDatuma: new Date(Date.UTC(2026, 8, 5)), osszegFt: 100000 }),
        kivonat({ id: "pontos", konyvelesDatuma: new Date(Date.UTC(2026, 8, 9)), osszegFt: 180000 }),
      ],
      MA,
    );
    const eloirashozTartozo = eredmeny.find((sor) => sor.eloirtTetelId === "eloiras-1");
    expect(eloirashozTartozo?.kivonattetelId).toBe("pontos");
    expect(eloirashozTartozo?.allapot).toBe("egyezik");
  });

  it("az ablakon kívüli tételt nem köti az előíráshoz", () => {
    const eredmeny = egyeztet(
      [eloiras()],
      [],
      [kivonat({ konyvelesDatuma: new Date(Date.UTC(2026, 6, 1)) })],
      MA,
    );
    const eloirashozTartozo = eredmeny.find((sor) => sor.eloirtTetelId === "eloiras-1");
    expect(eloirashozTartozo?.allapot).toBe("hianyzik");
  });
});

describe("állítható párosítási ablak", () => {
  // Az alapértelmezett ablak 10/25 nap; a bérbeadó ezt átállíthatja.
  const kesei = kivonat({ konyvelesDatuma: new Date(Date.UTC(2026, 9, 2)) }); // 27 nappal az esedékesség után

  it("az alapértelmezett ablakon kívüli befizetést nem köti az előíráshoz", () => {
    const eredmeny = egyeztet([eloiras()], [], [kesei], MA);
    const eloirashozTartozo = eredmeny.find((sor) => sor.eloirtTetelId === "eloiras-1");
    expect(eloirashozTartozo?.allapot).toBe("hianyzik");
  });

  it("szélesebb ablakkal ugyanaz a befizetés már párosul", () => {
    const eredmeny = egyeztet([eloiras()], [], [kesei], MA, {
      ...ALAPERTELMEZETT_BEALLITASOK,
      kesobbiAblakNap: 30,
    });
    const eloirashozTartozo = eredmeny.find((sor) => sor.eloirtTetelId === "eloiras-1");
    expect(eloirashozTartozo?.allapot).toBe("egyezik");
    expect(eloirashozTartozo?.keses).toBe(27);
  });

  it("szűkebb ablak az előre fizetett bérleti díjat is kiszedi a párosításból", () => {
    const korai = kivonat({ konyvelesDatuma: new Date(Date.UTC(2026, 7, 29)) }); // 7 nappal korábban
    const alap = egyeztet([eloiras()], [], [korai], MA);
    expect(alap.find((sor) => sor.eloirtTetelId === "eloiras-1")?.allapot).toBe("egyezik");

    const szuk = egyeztet([eloiras()], [], [korai], MA, {
      ...ALAPERTELMEZETT_BEALLITASOK,
      korabbiAblakNap: 3,
    });
    expect(szuk.find((sor) => sor.eloirtTetelId === "eloiras-1")?.allapot).toBe("hianyzik");
  });
});

describe("ablakotEllenoriz", () => {
  it("elfogadja az egész napszámot", () => {
    const { ablak, hibak } = ablakotEllenoriz({ korabbiAblakNap: "7", kesobbiAblakNap: "30" });
    expect(hibak).toEqual([]);
    expect(ablak).toEqual({ korabbiAblakNap: 7, kesobbiAblakNap: 30 });
  });

  it("a nullát is elfogadja: csak a pontos napra párosítunk", () => {
    const { ablak } = ablakotEllenoriz({ korabbiAblakNap: "0", kesobbiAblakNap: "0" });
    expect(ablak).toEqual({ korabbiAblakNap: 0, kesobbiAblakNap: 0 });
  });

  it("az üres, a nem szám és a negatív értéket elutasítja", () => {
    expect(ablakotEllenoriz({ korabbiAblakNap: "", kesobbiAblakNap: "25" }).ablak).toBeNull();
    expect(ablakotEllenoriz({ korabbiAblakNap: "tíz", kesobbiAblakNap: "25" }).ablak).toBeNull();
    expect(ablakotEllenoriz({ korabbiAblakNap: "-3", kesobbiAblakNap: "25" }).ablak).toBeNull();
  });

  it("a felső határon túli napszámot elutasítja, és megmondja a határt", () => {
    const { ablak, hibak } = ablakotEllenoriz({
      korabbiAblakNap: "10",
      kesobbiAblakNap: String(ABLAK_MAX_NAP + 1),
    });
    expect(ablak).toBeNull();
    expect(hibak.join(" ")).toContain(String(ABLAK_MAX_NAP));
  });

  it("mindkét mező hibáját egyszerre jelenti", () => {
    const { hibak } = ablakotEllenoriz({ korabbiAblakNap: "x", kesobbiAblakNap: "y" });
    expect(hibak).toHaveLength(2);
  });
});
