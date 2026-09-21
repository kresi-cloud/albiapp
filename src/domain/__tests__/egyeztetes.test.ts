import { describe, expect, it } from "vitest";
import {
  ABLAK_MAX_NAP,
  ablakotEllenoriz,
  ALAPERTELMEZETT_BEALLITASOK,
  egyeztet,
  KET_OLDAL_NAP_ELTERES,
  type BerbeadoiIgazolas,
  type BerloiIgazolas,
  type EloirtTetel,
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

/** Amit a bérbeadó mond: megérkezett, ekkor, ennyi. */
function berbeadoi(reszlet: Partial<BerbeadoiIgazolas> = {}): BerbeadoiIgazolas {
  return {
    id: "berbeadoi-1",
    megerkezett: true,
    erkezesDatuma: new Date(Date.UTC(2026, 8, 5)),
    osszegFt: 180000,
    ...reszlet,
  };
}

/** A bérbeadó tagadása: erre az előírásra nem jött pénz. */
function tagadas(eloirtTetelId = "eloiras-1"): BerbeadoiIgazolas {
  return {
    id: "tagadas-1",
    megerkezett: false,
    eloirtTetelId,
    erkezesDatuma: new Date(Date.UTC(2026, 8, 5)),
    osszegFt: 0,
  };
}

/** Amit a bérlő mond: ekkor ennyit utalt. */
function berloi(reszlet: Partial<BerloiIgazolas> = {}): BerloiIgazolas {
  return {
    id: "berloi-1",
    utalasDatuma: new Date(Date.UTC(2026, 8, 4)),
    osszegFt: 180000,
    ...reszlet,
  };
}

describe("egyeztet — a két oldal egyetért", () => {
  it("határidőre érkezett pontos összeget egyezésnek lát", () => {
    const [eredmeny] = egyeztet([eloiras()], [berloi()], [berbeadoi()], MA);

    expect(eredmeny.allapot).toBe("egyezik");
    expect(eredmeny.elteresFt).toBe(0);
    expect(eredmeny.magyarazat.kulcs).toBe("egyeztetes.hataridore");
  });

  it("egyező tételnél nem kér bizonylatot", () => {
    const [eredmeny] = egyeztet([eloiras()], [berloi()], [berbeadoi()], MA);

    expect(eredmeny.bizonylatKell).toBe(false);
  });

  it("a késést napra megmondja", () => {
    const [eredmeny] = egyeztet(
      [eloiras()],
      [berloi({ utalasDatuma: new Date(Date.UTC(2026, 8, 12)) })],
      [berbeadoi({ erkezesDatuma: new Date(Date.UTC(2026, 8, 12)) })],
      MA,
    );

    expect(eredmeny.allapot).toBe("egyezik");
    expect(eredmeny.keses).toBe(7);
    expect(eredmeny.magyarazat).toEqual({ kulcs: "egyeztetes.keson", adatok: { nap: 7 } });
  });

  it("néhány nap dátumeltérést a két fél közt még ugyanannak az utalásnak vesz", () => {
    const [eredmeny] = egyeztet(
      [eloiras()],
      [berloi({ utalasDatuma: new Date(Date.UTC(2026, 8, 4)) })],
      [berbeadoi({ erkezesDatuma: new Date(Date.UTC(2026, 8, 4 + KET_OLDAL_NAP_ELTERES)) })],
      MA,
    );

    expect(eredmeny.allapot).toBe("egyezik");
  });

  it("ha mindkét fél ugyanazt mondja, de nem az előírt összeget, az eltér, nem vita", () => {
    const [eredmeny] = egyeztet(
      [eloiras()],
      [berloi({ osszegFt: 175000 })],
      [berbeadoi({ osszegFt: 175000 })],
      MA,
    );

    expect(eredmeny.allapot).toBe("elter");
    expect(eredmeny.elteresOka).toBe("osszeg");
    expect(eredmeny.elteresFt).toBe(-5000);
    // A felek egyetértenek abban, mi történt: nincs mit bizonyítani.
    expect(eredmeny.bizonylatKell).toBe(false);
    expect(eredmeny.magyarazat).toEqual({
      kulcs: "egyeztetes.kevesebb",
      adatok: { osszeg: 5000 },
    });
  });

  it("a többletet is jelzi", () => {
    const [eredmeny] = egyeztet(
      [eloiras()],
      [berloi({ osszegFt: 185000 })],
      [berbeadoi({ osszegFt: 185000 })],
      MA,
    );

    expect(eredmeny.allapot).toBe("elter");
    expect(eredmeny.magyarazat).toEqual({ kulcs: "egyeztetes.tobb", adatok: { osszeg: 5000 } });
  });
});

describe("egyeztet — a két oldal nem egyezik", () => {
  it("eltérő összegnél vitás lesz, és bizonylatot kér", () => {
    const [eredmeny] = egyeztet(
      [eloiras()],
      [berloi({ osszegFt: 180000 })],
      [berbeadoi({ osszegFt: 175000 })],
      MA,
    );

    expect(eredmeny.allapot).toBe("vitas");
    expect(eredmeny.elteresOka).toBe("ket_oldal_elter");
    expect(eredmeny.bizonylatKell).toBe(true);
    expect(eredmeny.magyarazat).toEqual({
      kulcs: "egyeztetes.ket_oldal_elter",
      adatok: { berlo: 180000, berbeado: 175000 },
    });
  });

  it("túl távoli dátumnál sem mondjuk ugyanannak a két utalást", () => {
    const [eredmeny] = egyeztet(
      [eloiras()],
      [berloi({ utalasDatuma: new Date(Date.UTC(2026, 8, 1)) })],
      [berbeadoi({ erkezesDatuma: new Date(Date.UTC(2026, 8, 1 + KET_OLDAL_NAP_ELTERES + 1)) })],
      MA,
    );

    expect(eredmeny.allapot).toBe("vitas");
    expect(eredmeny.elteresOka).toBe("ket_oldal_elter");
  });

  it("ha a bérbeadó kikapcsolta a bizonylatkérést, a tétel vitás marad, de papírt nem kérünk", () => {
    const [eredmeny] = egyeztet(
      [eloiras()],
      [berloi({ osszegFt: 180000 })],
      [berbeadoi({ osszegFt: 175000 })],
      MA,
      { ...ALAPERTELMEZETT_BEALLITASOK, bizonylatKeres: false },
    );

    expect(eredmeny.allapot).toBe("vitas");
    expect(eredmeny.bizonylatKell).toBe(false);
  });

  it("a meg nem érkezett utalásnál is a beállítás dönt a bizonylatról", () => {
    const [kerunk] = egyeztet([eloiras()], [berloi()], [tagadas()], MA);
    const [nemKerunk] = egyeztet([eloiras()], [berloi()], [tagadas()], MA, {
      ...ALAPERTELMEZETT_BEALLITASOK,
      bizonylatKeres: false,
    });

    expect(kerunk.bizonylatKell).toBe(true);
    expect(nemKerunk.bizonylatKell).toBe(false);
    expect(nemKerunk.allapot).toBe("vitas");
  });

  it("ha a bérlő szerint elment, a bérbeadó szerint nem jött meg, az vitás", () => {
    const [eredmeny] = egyeztet([eloiras()], [berloi()], [tagadas()], MA);

    expect(eredmeny.allapot).toBe("vitas");
    expect(eredmeny.elteresOka).toBe("nem_erkezett_meg");
    expect(eredmeny.bizonylatKell).toBe(true);
    expect(eredmeny.magyarazat.kulcs).toBe("egyeztetes.nem_erkezett_meg");
  });
});

describe("egyeztet — csak az egyik fél nyilatkozott", () => {
  it("a bérlő megadta, a bérbeadó még nem: várakozik, és nincs bizonylatkérés", () => {
    const [eredmeny] = egyeztet([eloiras()], [berloi()], [], MA);

    expect(eredmeny.allapot).toBe("varakozik");
    expect(eredmeny.elteresOka).toBe("nincs_berbeadoi_igazolas");
    expect(eredmeny.bizonylatKell).toBe(false);
  });

  it("a bérbeadó megadta, a bérlő még nem: szintén várakozik", () => {
    const [eredmeny] = egyeztet([eloiras()], [], [berbeadoi()], MA);

    expect(eredmeny.allapot).toBe("varakozik");
    expect(eredmeny.elteresOka).toBe("nincs_berloi_igazolas");
    expect(eredmeny.bizonylatKell).toBe(false);
  });
});

describe("egyeztet — hiányzó és besorolatlan", () => {
  it("lejárt esedékességnél, ha egyik fél sem szólt, hiányzik", () => {
    const [eredmeny] = egyeztet([eloiras()], [], [], MA);

    expect(eredmeny.allapot).toBe("hianyzik");
    expect(eredmeny.elteresFt).toBe(-180000);
    expect(eredmeny.keses).toBe(15);
  });

  it("a bérbeadó tagadása magában is hiányzó tételt jelent", () => {
    const korai = new Date(Date.UTC(2026, 8, 1)); // az esedékesség előtt
    const [eredmeny] = egyeztet([eloiras()], [], [tagadas()], korai);

    expect(eredmeny.allapot).toBe("hianyzik");
    expect(eredmeny.bizonylatKell).toBe(false);
  });

  it("jövőbeli esedékességnél nem csinál hiányzó tételt", () => {
    const eredmeny = egyeztet(
      [eloiras({ esedekesseg: new Date(Date.UTC(2026, 9, 5)) })],
      [],
      [],
      MA,
    );

    expect(eredmeny).toHaveLength(0);
  });

  it("előírás nélkül beérkezett pénzt külön sorban mutat, és nem tippel", () => {
    const eredmeny = egyeztet(
      [],
      [],
      [berbeadoi({ id: "berbeadoi-9", osszegFt: 50000 })],
      MA,
    );

    expect(eredmeny).toHaveLength(1);
    expect(eredmeny[0].allapot).toBe("elter");
    expect(eredmeny[0].elteresOka).toBe("nincs_eloiras");
    expect(eredmeny[0].eloirtTetelId).toBeNull();
    expect(eredmeny[0].bizonylatKell).toBe(false);
  });

  it("a tagadásból nem lesz besorolatlan pénz", () => {
    const eredmeny = egyeztet([eloiras()], [], [tagadas()], MA);

    expect(eredmeny).toHaveLength(1);
  });
});

describe("egyeztet — párosítás", () => {
  it("az időablakon kívüli befizetést nem köti az előíráshoz", () => {
    const eredmeny = egyeztet(
      [eloiras()],
      [],
      [berbeadoi({ erkezesDatuma: new Date(Date.UTC(2026, 6, 5)) })],
      MA,
    );

    const eloirasSor = eredmeny.find((sor) => sor.eloirtTetelId === "eloiras-1");
    expect(eloirasSor?.allapot).toBe("hianyzik");
    expect(eredmeny.some((sor) => sor.elteresOka === "nincs_eloiras")).toBe(true);
  });

  it("egy befizetést csak egy előíráshoz köt", () => {
    const eredmeny = egyeztet(
      [
        eloiras({ id: "eloiras-1", idoszak: "2026-08", esedekesseg: new Date(Date.UTC(2026, 7, 5)) }),
        eloiras({ id: "eloiras-2", idoszak: "2026-09" }),
      ],
      [],
      [berbeadoi({ erkezesDatuma: new Date(Date.UTC(2026, 7, 5)) })],
      MA,
    );

    const kotesek = eredmeny.filter((sor) => sor.berbeadoiIgazolasId === "berbeadoi-1");
    expect(kotesek).toHaveLength(1);
    expect(kotesek[0].eloirtTetelId).toBe("eloiras-1");
  });

  it("a pontos összeg erősebb jelölt, mint az időben közelebbi", () => {
    const eredmeny = egyeztet(
      [eloiras()],
      [],
      [
        berbeadoi({ id: "kozeli", erkezesDatuma: new Date(Date.UTC(2026, 8, 5)), osszegFt: 90000 }),
        berbeadoi({ id: "pontos", erkezesDatuma: new Date(Date.UTC(2026, 8, 9)), osszegFt: 180000 }),
      ],
      MA,
    );

    const eloirasSor = eredmeny.find((sor) => sor.eloirtTetelId === "eloiras-1");
    expect(eloirasSor?.berbeadoiIgazolasId).toBe("pontos");
  });

  it("a kisebb összegű befizetést nem viszi el egy nagyobb előírás", () => {
    // Korábban a hónap elején esedékes bérleti díj elvitte a pár nappal később
    // beérkezett közös költséget, és onnantól minden tétel arrébb csúszott.
    const eredmeny = egyeztet(
      [
        eloiras({ id: "dij", osszegFt: 180000, esedekesseg: new Date(Date.UTC(2026, 8, 5)) }),
        eloiras({ id: "kk", osszegFt: 14000, esedekesseg: new Date(Date.UTC(2026, 8, 5)) }),
      ],
      [],
      [berbeadoi({ id: "kk-utalas", osszegFt: 14000, erkezesDatuma: new Date(Date.UTC(2026, 8, 6)) })],
      MA,
    );

    const dijSor = eredmeny.find((sor) => sor.eloirtTetelId === "dij");
    const kkSor = eredmeny.find((sor) => sor.eloirtTetelId === "kk");
    expect(dijSor?.allapot).toBe("hianyzik");
    expect(kkSor?.berbeadoiIgazolasId).toBe("kk-utalas");
  });

  it("bizonylatot alapból kérünk: ez volt az eredeti döntés, a bérbeadó veheti le", () => {
    expect(ALAPERTELMEZETT_BEALLITASOK.bizonylatKeres).toBe(true);
  });

  it("a tolerancia alapból nulla: egy forint eltérés is eltérés", () => {
    expect(ALAPERTELMEZETT_BEALLITASOK.toleranciaFt).toBe(0);

    const [eredmeny] = egyeztet(
      [eloiras()],
      [berloi({ osszegFt: 179999 })],
      [berbeadoi({ osszegFt: 179999 })],
      MA,
    );

    expect(eredmeny.allapot).toBe("elter");
  });
});

describe("ablakotEllenoriz", () => {
  it("elfogad két egész napszámot", () => {
    const { ablak, hibak } = ablakotEllenoriz({ korabbiAblakNap: "10", kesobbiAblakNap: "25" });

    expect(hibak).toEqual([]);
    expect(ablak).toEqual({ korabbiAblakNap: 10, kesobbiAblakNap: 25 });
  });

  it("üres mezőre hibát ad", () => {
    const { ablak, hibak } = ablakotEllenoriz({ korabbiAblakNap: "", kesobbiAblakNap: "25" });

    expect(ablak).toBeNull();
    expect(hibak).toHaveLength(1);
  });

  it("nem számot nem fogad el", () => {
    const { ablak, hibak } = ablakotEllenoriz({ korabbiAblakNap: "tíz", kesobbiAblakNap: "25" });

    expect(ablak).toBeNull();
    expect(hibak[0]).toContain("egész napszám");
  });

  it("a felső határon túl nem enged", () => {
    const { ablak, hibak } = ablakotEllenoriz({
      korabbiAblakNap: "10",
      kesobbiAblakNap: String(ABLAK_MAX_NAP + 1),
    });

    expect(ablak).toBeNull();
    expect(hibak[0]).toContain(String(ABLAK_MAX_NAP));
  });
});
