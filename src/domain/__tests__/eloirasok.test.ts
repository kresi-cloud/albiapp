import { describe, expect, it } from "vitest";
import { eloirasok, type Eloiras, type JogviszonyAdat } from "../eloirasok";
import type { ElofizetesAdat } from "../elofizetes";

function jogviszony(reszlet: Partial<JogviszonyAdat> = {}): JogviszonyAdat {
  return {
    kezdete: new Date(Date.UTC(2026, 0, 1)),
    vege: null,
    berletiDijFt: 180000,
    kozosKoltsegFt: 0,
    rezsiElszamolas: "almero",
    rezsiAtalanyFt: 0,
    fizetesiNap: 5,
    ...reszlet,
  };
}

const dijak = (sorok: Eloiras[]) => sorok.filter((sor) => sor.tipus === "berleti_dij");
const nap = (ertek: Date) => ertek.toISOString().slice(0, 10);

describe("havi előírások", () => {
  it("minden hónapra ad egy bérleti díjat a mai hónap végéig", () => {
    const sorok = dijak(eloirasok(jogviszony(), new Date(Date.UTC(2026, 2, 20))));
    expect(sorok.map((sor) => sor.idoszak)).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(sorok.every((sor) => sor.osszegFt === 180000)).toBe(true);
  });

  it("a futó hónap előírása a hónap elején megvan, nem csak az esedékességkor", () => {
    // Március 1-jén a márciusi díj már látszik, pedig 5-én lesz esedékes.
    const sorok = dijak(eloirasok(jogviszony(), new Date(Date.UTC(2026, 2, 1))));
    expect(sorok.at(-1)?.idoszak).toBe("2026-03");
  });

  it("az esedékesség a fizetési napra esik", () => {
    const sorok = dijak(eloirasok(jogviszony({ fizetesiNap: 10 }), new Date(Date.UTC(2026, 1, 1))));
    expect(sorok.map((sor) => nap(sor.esedekesseg))).toEqual(["2026-01-10", "2026-02-10"]);
  });

  it("a 31-i fizetési nap rövidebb hónapban a hónap utolsó napja", () => {
    const sorok = dijak(eloirasok(jogviszony({ fizetesiNap: 31 }), new Date(Date.UTC(2026, 1, 15))));
    expect(nap(sorok[1].esedekesseg)).toBe("2026-02-28");
  });

  it("szökőévben a február 29-ét is megtalálja", () => {
    const sorok = dijak(
      eloirasok(
        jogviszony({ kezdete: new Date(Date.UTC(2028, 1, 1)), fizetesiNap: 31 }),
        new Date(Date.UTC(2028, 1, 15)),
      ),
    );
    expect(nap(sorok[0].esedekesseg)).toBe("2028-02-29");
  });
});

describe("töredékhónap", () => {
  it("az első hónap napra arányos, ha a jogviszony hónap közben kezdődik", () => {
    const sorok = dijak(
      eloirasok(
        jogviszony({ kezdete: new Date(Date.UTC(2026, 8, 12)) }),
        new Date(Date.UTC(2026, 9, 15)),
      ),
    );
    // Szeptember 12–30. = 19 nap a 30-ból.
    expect(sorok[0].idoszak).toBe("2026-09");
    expect(sorok[0].osszegFt).toBe(Math.round((180000 * 19) / 30));
    expect(sorok[1].osszegFt).toBe(180000);
  });

  it("a töredékhónaphoz magyarázat tartozik, a teljes hónaphoz nem", () => {
    const sorok = dijak(
      eloirasok(
        jogviszony({ kezdete: new Date(Date.UTC(2026, 8, 12)) }),
        new Date(Date.UTC(2026, 9, 15)),
      ),
    );
    expect(sorok[0].reszletezes).toEqual({
      kulcs: "eloiras.toredek",
      adatok: { elso: 12, utolso: 30, napok: 19, honapNapjai: 30, teljes: 180000 },
    });
    expect(sorok[1].reszletezes).toBeNull();
  });

  it("a beköltözés utáni esedékesség nem eshet a beköltözés elé", () => {
    // 12-én költözik be, a fizetési nap 5-e: az első díj a beköltözés napján esedékes.
    const sorok = dijak(
      eloirasok(
        jogviszony({ kezdete: new Date(Date.UTC(2026, 8, 12)) }),
        new Date(Date.UTC(2026, 8, 20)),
      ),
    );
    expect(nap(sorok[0].esedekesseg)).toBe("2026-09-12");
  });

  it("az utolsó hónap is arányos, ha a jogviszony hónap közben zárul", () => {
    const sorok = dijak(
      eloirasok(
        jogviszony({
          kezdete: new Date(Date.UTC(2026, 7, 1)),
          vege: new Date(Date.UTC(2026, 8, 10)),
        }),
        new Date(Date.UTC(2026, 10, 1)),
      ),
    );
    expect(sorok.map((sor) => sor.idoszak)).toEqual(["2026-08", "2026-09"]);
    expect(sorok[1].osszegFt).toBe(Math.round((180000 * 10) / 30));
  });

  it("a lezárt jogviszony után nem ad több előírást", () => {
    const sorok = eloirasok(
      jogviszony({ kezdete: new Date(Date.UTC(2026, 7, 1)), vege: new Date(Date.UTC(2026, 8, 10)) }),
      new Date(Date.UTC(2027, 5, 1)),
    );
    expect(sorok.every((sor) => sor.idoszak <= "2026-09")).toBe(true);
  });

  it("egyetlen hónapon belüli jogviszony egy arányos előírást ad", () => {
    const sorok = dijak(
      eloirasok(
        jogviszony({
          kezdete: new Date(Date.UTC(2026, 8, 10)),
          vege: new Date(Date.UTC(2026, 8, 19)),
        }),
        new Date(Date.UTC(2026, 9, 1)),
      ),
    );
    expect(sorok).toHaveLength(1);
    expect(sorok[0].osszegFt).toBe(Math.round((180000 * 10) / 30));
  });

  it("a véget megelőző kezdetből nem lesz előírás", () => {
    expect(
      eloirasok(
        jogviszony({
          kezdete: new Date(Date.UTC(2026, 8, 20)),
          vege: new Date(Date.UTC(2026, 8, 10)),
        }),
        new Date(Date.UTC(2026, 9, 1)),
      ),
    ).toEqual([]);
  });
});

describe("a bérleti díjon túl", () => {
  it("közös költséget csak akkor ír elő, ha van", () => {
    const nelkul = eloirasok(jogviszony(), new Date(Date.UTC(2026, 0, 15)));
    expect(nelkul.some((sor) => sor.tipus === "kozos_koltseg")).toBe(false);

    const van = eloirasok(
      jogviszony({ kozosKoltsegFt: 14000 }),
      new Date(Date.UTC(2026, 0, 15)),
    );
    expect(van.find((sor) => sor.tipus === "kozos_koltseg")?.osszegFt).toBe(14000);
  });

  it("rezsiátalányt csak átalányos elszámolásnál ír elő", () => {
    const almeros = eloirasok(
      jogviszony({ rezsiAtalanyFt: 25000 }),
      new Date(Date.UTC(2026, 0, 15)),
    );
    expect(almeros.some((sor) => sor.tipus === "rezsi_atalany")).toBe(false);

    const atalanyos = eloirasok(
      jogviszony({ rezsiElszamolas: "atalany", rezsiAtalanyFt: 25000 }),
      new Date(Date.UTC(2026, 0, 15)),
    );
    expect(atalanyos.find((sor) => sor.tipus === "rezsi_atalany")?.osszegFt).toBe(25000);
  });

  it("a közös költség és az átalány ugyanúgy arányosodik", () => {
    const sorok = eloirasok(
      jogviszony({
        kezdete: new Date(Date.UTC(2026, 8, 12)),
        kozosKoltsegFt: 14000,
        rezsiElszamolas: "atalany",
        rezsiAtalanyFt: 25000,
      }),
      new Date(Date.UTC(2026, 8, 20)),
    );
    expect(sorok.find((sor) => sor.tipus === "kozos_koltseg")?.osszegFt).toBe(
      Math.round((14000 * 19) / 30),
    );
    expect(sorok.find((sor) => sor.tipus === "rezsi_atalany")?.osszegFt).toBe(
      Math.round((25000 * 19) / 30),
    );
  });

  it("nulla forintból nem lesz előírás", () => {
    const sorok = eloirasok(
      jogviszony({ berletiDijFt: 0, kozosKoltsegFt: 0 }),
      new Date(Date.UTC(2026, 0, 15)),
    );
    expect(sorok).toEqual([]);
  });

  it("minden összeg egész forint", () => {
    const sorok = eloirasok(
      jogviszony({ kezdete: new Date(Date.UTC(2026, 8, 7)), berletiDijFt: 177777 }),
      new Date(Date.UTC(2026, 8, 20)),
    );
    expect(sorok.every((sor) => Number.isInteger(sor.osszegFt))).toBe(true);
  });
});

describe("előfizetés előírásai", () => {
  const JAN = new Date(Date.UTC(2026, 0, 1));

  function elofizetes(reszlet: Partial<ElofizetesAdat> = {}): ElofizetesAdat {
    return {
      id: "e1",
      fajta: "internet",
      megnevezes: "Telekom 500/100",
      szolgaltato: "Telekom",
      elofizeto: "berbeado",
      haviDijFt: 6000,
      kezdete: JAN,
      vege: null,
      nyilatkozatok: [{ berloId: "anna", allapot: "jovahagyva", indoklas: null }],
      ...reszlet,
    };
  }

  function havi(reszlet: Partial<JogviszonyAdat> = {}) {
    return jogviszony({
      kezdete: JAN,
      berletiDijFt: 150000,
      kozosKoltsegFt: 0,
      elofizetesek: [elofizetes()],
      fiokosBerlok: ["anna"],
      ...reszlet,
    });
  }

  it("jóváhagyott előfizetésből havonta egy előírás lesz", () => {
    const sorok = eloirasok(havi(), new Date(Date.UTC(2026, 2, 15))).filter(
      (sor) => sor.tipus === "elofizetes",
    );
    expect(sorok).toHaveLength(3);
    expect(sorok.map((sor) => sor.idoszak)).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(sorok.every((sor) => sor.osszegFt === 6000)).toBe(true);
    expect(sorok[0].forrasId).toBe("e1");
  });

  it("jóváhagyás nélkül egyetlen előírás sem lesz belőle", () => {
    const sorok = eloirasok(
      havi({ elofizetesek: [elofizetes({ nyilatkozatok: [] })] }),
      new Date(Date.UTC(2026, 2, 15)),
    );
    expect(sorok.filter((sor) => sor.tipus === "elofizetes")).toEqual([]);
    // A bérleti díj közben rendesen megvan: nem az egész hónap veszett el.
    expect(sorok.filter((sor) => sor.tipus === "berleti_dij")).toHaveLength(3);
  });

  it("a bérlő saját előfizetéséből nem lesz előírás", () => {
    const sorok = eloirasok(
      havi({ elofizetesek: [elofizetes({ elofizeto: "berlo" })] }),
      new Date(Date.UTC(2026, 1, 15)),
    );
    expect(sorok.filter((sor) => sor.tipus === "elofizetes")).toEqual([]);
  });

  it("két előfizetés két külön sor, nem összevonva", () => {
    const sorok = eloirasok(
      havi({
        elofizetesek: [
          elofizetes(),
          elofizetes({ id: "e2", megnevezes: "Vodafone tévé", haviDijFt: 4000 }),
        ],
      }),
      new Date(Date.UTC(2026, 0, 20)),
    ).filter((sor) => sor.tipus === "elofizetes");

    expect(sorok).toHaveLength(2);
    expect(sorok.map((sor) => sor.forrasId).sort()).toEqual(["e1", "e2"]);
    expect(sorok.map((sor) => sor.osszegFt).sort((a, b) => a - b)).toEqual([4000, 6000]);
  });

  it("hónap közben induló előfizetés napra arányosan jár", () => {
    // Január 20-tól: 12 nap a 31-ből.
    const sorok = eloirasok(
      havi({ elofizetesek: [elofizetes({ kezdete: new Date(Date.UTC(2026, 0, 20)) })] }),
      new Date(Date.UTC(2026, 0, 31)),
    ).filter((sor) => sor.tipus === "elofizetes");

    expect(sorok).toHaveLength(1);
    expect(sorok[0].osszegFt).toBe(Math.round((6000 * 12) / 31));
    expect(sorok[0].reszletezes?.kulcs).toBe("eloiras.elofizetes_toredek");
  });

  it("a megszűnés utáni hónapra nincs előírás", () => {
    const sorok = eloirasok(
      havi({ elofizetesek: [elofizetes({ vege: new Date(Date.UTC(2026, 0, 31)) })] }),
      new Date(Date.UTC(2026, 2, 15)),
    ).filter((sor) => sor.tipus === "elofizetes");

    expect(sorok).toHaveLength(1);
    expect(sorok[0].idoszak).toBe("2026-01");
  });

  it("a teljes hónap részletezése is megnevezi az előfizetést", () => {
    // Két előfizetés közül a bérlőnek tudnia kell, melyikről szól a sor.
    const sor = eloirasok(havi(), new Date(Date.UTC(2026, 0, 20))).find(
      (eloiras) => eloiras.tipus === "elofizetes",
    );
    expect(sor?.reszletezes?.kulcs).toBe("eloiras.elofizetes");
    expect(sor?.reszletezes?.adatok?.nev).toBe("Telekom 500/100");
  });

  it("a kiköltözés hónapjában az előfizetés is a jogviszony napjaira jár", () => {
    // A jogviszony január 15-én zárul: az előfizetés sem futhat tovább.
    const sorok = eloirasok(
      havi({ vege: new Date(Date.UTC(2026, 0, 15)) }),
      new Date(Date.UTC(2026, 2, 15)),
    ).filter((sor) => sor.tipus === "elofizetes");

    expect(sorok).toHaveLength(1);
    expect(sorok[0].osszegFt).toBe(Math.round((6000 * 15) / 31));
  });

  it("a bérleti díj forrásazonosítója üres marad", () => {
    const sorok = eloirasok(havi(), new Date(Date.UTC(2026, 0, 20)));
    expect(sorok.filter((sor) => sor.tipus === "berleti_dij").every((sor) => sor.forrasId === "")).toBe(
      true,
    );
  });
});
