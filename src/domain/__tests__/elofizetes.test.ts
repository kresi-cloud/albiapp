import { describe, expect, it } from "vitest";
import {
  allapota,
  ellenoriz,
  elo,
  figyelmeztetesek,
  nyilatkozhat,
  terhelheto,
  varRank,
  type ElofizetesAdat,
} from "../elofizetes";

function elofizetes(reszlet: Partial<ElofizetesAdat> = {}): ElofizetesAdat {
  return {
    id: "e1",
    fajta: "internet",
    megnevezes: "Telekom 500/100",
    szolgaltato: "Telekom",
    elofizeto: "berbeado",
    haviDijFt: 6000,
    kezdete: new Date(Date.UTC(2026, 0, 1)),
    vege: null,
    nyilatkozatok: [],
    ...reszlet,
  };
}

describe("allapota", () => {
  it("nyilatkozat nélkül várakozik", () => {
    expect(allapota(elofizetes(), ["anna", "tamas"])).toBe("varakozik");
  });

  it("egyetlen jóváhagyás két bérlőből még nem elég", () => {
    const sor = elofizetes({
      nyilatkozatok: [{ berloId: "anna", allapot: "jovahagyva", indoklas: null }],
    });
    expect(allapota(sor, ["anna", "tamas"])).toBe("varakozik");
  });

  it("mindenki jóváhagyásával jóváhagyott", () => {
    const sor = elofizetes({
      nyilatkozatok: [
        { berloId: "anna", allapot: "jovahagyva", indoklas: null },
        { berloId: "tamas", allapot: "jovahagyva", indoklas: null },
      ],
    });
    expect(allapota(sor, ["anna", "tamas"])).toBe("jovahagyva");
  });

  it("egy kifogás akkor is dönt, ha a másik jóváhagyta", () => {
    // A lakótárs nem szavazhatja le azt, aki nem kéri a szolgáltatást.
    const sor = elofizetes({
      nyilatkozatok: [
        { berloId: "anna", allapot: "jovahagyva", indoklas: null },
        { berloId: "tamas", allapot: "kifogasolt", indoklas: "Nem használom." },
      ],
    });
    expect(allapota(sor, ["anna", "tamas"])).toBe("kifogasolt");
  });

  it("fiók nélküli bérlőknél várakozik, nem jóváhagyott", () => {
    // Üres listára a „mindenki jóváhagyta" magától igaz lenne, és a bérlő
    // megkapná a havi díjat úgy, hogy sosem látta.
    expect(allapota(elofizetes(), [])).toBe("varakozik");
  });
});

describe("varRank", () => {
  it("azokat adja vissza, akik még nem nyilatkoztak", () => {
    const sor = elofizetes({
      nyilatkozatok: [{ berloId: "anna", allapot: "jovahagyva", indoklas: null }],
    });
    expect(varRank(sor, ["anna", "tamas"])).toEqual(["tamas"]);
  });

  it("a kifogás is nyilatkozat, tehát nem vár többé", () => {
    const sor = elofizetes({
      nyilatkozatok: [{ berloId: "tamas", allapot: "kifogasolt", indoklas: "Nem kell." }],
    });
    expect(varRank(sor, ["tamas"])).toEqual([]);
  });
});

describe("terhelheto", () => {
  it("jóváhagyott bérbeadói előfizetésből lesz előírás", () => {
    expect(terhelheto(elofizetes(), "jovahagyva")).toBe(true);
  });

  it("jóváhagyás nélkül nem", () => {
    expect(terhelheto(elofizetes(), "varakozik")).toBe(false);
    expect(terhelheto(elofizetes(), "kifogasolt")).toBe(false);
  });

  it("a bérlő saját előfizetéséből soha nem, akkor sem, ha jóváhagyta", () => {
    expect(terhelheto(elofizetes({ elofizeto: "berlo" }), "jovahagyva")).toBe(false);
  });

  it("nulla forintos havi díjból nem", () => {
    expect(terhelheto(elofizetes({ haviDijFt: 0 }), "jovahagyva")).toBe(false);
  });
});

describe("ellenoriz", () => {
  const alap = {
    megnevezes: "Telekom",
    haviDijFt: 6000,
    kezdete: new Date(Date.UTC(2026, 0, 1)),
    vege: null,
  };

  it("hibátlan adatra nincs kifogás", () => {
    expect(ellenoriz(alap)).toBeNull();
  });

  it("név nélkül nem mentünk", () => {
    expect(ellenoriz({ ...alap, megnevezes: "   " })).toBe("nincs_megnevezes");
  });

  it("negatív díjat nem mentünk", () => {
    expect(ellenoriz({ ...alap, haviDijFt: -1 })).toBe("negativ_dij");
  });

  it("a vége nem lehet a kezdet előtt", () => {
    expect(ellenoriz({ ...alap, vege: new Date(Date.UTC(2025, 11, 31)) })).toBe(
      "vege_a_kezdet_elott",
    );
  });

  it("az ugyanaznapi vége rendben van", () => {
    expect(ellenoriz({ ...alap, vege: new Date(Date.UTC(2026, 0, 1)) })).toBeNull();
  });
});

describe("figyelmeztetesek", () => {
  it("a nulla díjú bérbeadói előfizetésnél megmondjuk, hogy nem lesz előírás", () => {
    const lista = figyelmeztetesek({ elofizeto: "berbeado", haviDijFt: 0 });
    expect(lista).toHaveLength(1);
    expect(lista[0].kulcs).toBe("elofizetes.figyelmeztet.nulla_dij");
  });

  it("a bérlő előfizetésénél megmondjuk, hogy a díjat nem írjuk elő", () => {
    const lista = figyelmeztetesek({ elofizeto: "berlo", haviDijFt: 6000 });
    expect(lista).toHaveLength(1);
    expect(lista[0].kulcs).toBe("elofizetes.figyelmeztet.berlo_fizet");
  });

  it("a szokásos esetre nincs figyelmeztetés", () => {
    expect(figyelmeztetesek({ elofizeto: "berbeado", haviDijFt: 6000 })).toEqual([]);
  });
});

describe("nyilatkozhat", () => {
  it("aki még nem nyilatkozott, az igen", () => {
    expect(nyilatkozhat(elofizetes(), "anna")).toBe(true);
  });

  it("aki már igen, az nem nyilatkozik újra", () => {
    const sor = elofizetes({
      nyilatkozatok: [{ berloId: "anna", allapot: "jovahagyva", indoklas: null }],
    });
    expect(nyilatkozhat(sor, "anna")).toBe(false);
  });
});

describe("elo", () => {
  const sor = {
    kezdete: new Date(Date.UTC(2026, 0, 10)),
    vege: new Date(Date.UTC(2026, 2, 20)),
  };

  it("a kezdet előtt nem él", () => {
    expect(elo(sor, new Date(Date.UTC(2026, 0, 9)))).toBe(false);
  });

  it("a kezdet napján már él", () => {
    expect(elo(sor, new Date(Date.UTC(2026, 0, 10)))).toBe(true);
  });

  it("a vége napján még él", () => {
    expect(elo(sor, new Date(Date.UTC(2026, 2, 20)))).toBe(true);
  });

  it("a vége után nem él", () => {
    expect(elo(sor, new Date(Date.UTC(2026, 2, 21)))).toBe(false);
  });

  it("vég nélküli előfizetés bármeddig él", () => {
    expect(elo({ kezdete: sor.kezdete, vege: null }, new Date(Date.UTC(2030, 0, 1)))).toBe(true);
  });
});
