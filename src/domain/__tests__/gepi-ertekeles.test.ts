import { describe, expect, test } from "vitest";
import {
  GEPI_SZEMPONTOK,
  LEGKISEBB_MINTA,
  URES_MEGFIGYELES,
  gepiErtekeles,
  median,
  vanGepiPont,
  type Megfigyeles,
} from "../gepi-ertekeles";

function megfigyeles(reszlet: Partial<Megfigyeles>): Megfigyeles {
  return { ...URES_MEGFIGYELES, ...reszlet };
}

function pontja(m: Megfigyeles, szempont: string) {
  return gepiErtekeles(m).find((sor) => sor.szempont === szempont);
}

describe("a median", () => {
  test("paratlan elemszamnal a kozepso", () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  test("paros elemszamnal a ket kozepso atlaga", () => {
    expect(median([1, 3, 5, 7])).toBe(4);
  });

  test("ures listan nulla", () => {
    expect(median([])).toBe(0);
  });

  test("egyetlen kiugro ertek nem huzza el", () => {
    // Egy nyaralas alatt megkapott valasz nem minositheti a tobbit.
    expect(median([1, 1, 1, 1, 500])).toBe(1);
  });
});

describe("a keves adat", () => {
  test("ures megfigyelesnel egyetlen pont sincs", () => {
    const pontok = gepiErtekeles(URES_MEGFIGYELES);
    expect(pontok.every((sor) => sor.pont === null)).toBe(true);
    expect(vanGepiPont(pontok)).toBe(false);
  });

  test("a hianyzo pont null, nem nulla es nem harmas", () => {
    // A „nem tudjuk" nem rossz jegy: egy most belepett berlorol a rendszer
    // meg semmit nem tud.
    const sor = pontja(
      megfigyeles({ eldontott: LEGKISEBB_MINTA - 1, rendben: 0 }),
      "pontossag",
    );
    expect(sor?.pont).toBeNull();
  });

  test("a harom szempont akkor is mind ott van, ha nincs ra adat", () => {
    expect(gepiErtekeles(URES_MEGFIGYELES).map((sor) => sor.szempont)).toEqual([
      ...GEPI_SZEMPONTOK,
    ]);
  });

  test("a minta merete a pont mellett mindig megvan", () => {
    const sor = pontja(megfigyeles({ valaszOrak: [1, 2, 3, 4] }), "valaszido");
    expect(sor?.minta).toBe(4);
    expect(sor?.reszletezes.adatok?.minta).toBe(4);
  });
});

describe("a pontossag", () => {
  test("csupa rendben, kesedelem nelkul: otos", () => {
    const sor = pontja(
      megfigyeles({ eldontott: 6, rendben: 6, kesesNapok: [0, 0, 0, 0, 0, 0] }),
      "pontossag",
    );
    expect(sor?.pont).toBe(5);
  });

  test("csupa hianyzo: egyes, nem nulla", () => {
    const sor = pontja(
      megfigyeles({ eldontott: 6, rendben: 0, hianyzo: 6 }),
      "pontossag",
    );
    expect(sor?.pont).toBe(1);
  });

  test("a keses ront, de kevesebbet, mint a meg nem erkezes", () => {
    const pontos = pontja(
      megfigyeles({ eldontott: 6, rendben: 6, kesesNapok: [0] }),
      "pontossag",
    );
    const keso = pontja(
      megfigyeles({ eldontott: 6, rendben: 6, kesesNapok: [14] }),
      "pontossag",
    );
    const sehogy = pontja(
      megfigyeles({ eldontott: 6, rendben: 0, hianyzo: 6 }),
      "pontossag",
    );
    expect(pontos!.pont!).toBeGreaterThan(keso!.pont!);
    expect(keso!.pont!).toBeGreaterThan(sehogy!.pont!);
  });

  test("harom nap csuszas nem esik egy sullyal a meg nem erkezessel", () => {
    const sor = pontja(
      megfigyeles({ eldontott: 6, rendben: 6, kesesNapok: [3] }),
      "pontossag",
    );
    expect(sor!.pont!).toBeGreaterThanOrEqual(4);
  });

  test("a reszletezes kiirja, mibol jott", () => {
    const sor = pontja(
      megfigyeles({
        eldontott: 8,
        rendben: 6,
        vitas: 1,
        hianyzo: 1,
        kesesNapok: [0],
      }),
      "pontossag",
    );
    expect(sor?.reszletezes.adatok).toMatchObject({
      rendben: 6,
      minta: 8,
      vitas: 1,
      hianyzo: 1,
    });
  });
});

describe("a valaszido", () => {
  test("fel napon beluli valasz: otos", () => {
    expect(
      pontja(megfigyeles({ valaszOrak: [1, 2, 3] }), "valaszido")?.pont,
    ).toBe(5);
  });

  test("egy napon beluli valasz: negyes", () => {
    expect(
      pontja(megfigyeles({ valaszOrak: [10, 12, 20] }), "valaszido")?.pont,
    ).toBe(4);
  });

  test("egy hetnel lassabb valasz: egyes", () => {
    expect(
      pontja(megfigyeles({ valaszOrak: [200, 300, 400] }), "valaszido")?.pont,
    ).toBe(1);
  });

  test("a mediant nezi, nem az atlagot", () => {
    const sor = pontja(
      megfigyeles({ valaszOrak: [1, 1, 1, 1, 1000] }),
      "valaszido",
    );
    expect(sor?.pont).toBe(5);
  });
});

describe("az egyuttmukodes", () => {
  test("mindenre nyilatkozott: otos", () => {
    expect(
      pontja(megfigyeles({ ranyitott: 5, megvalaszolt: 5 }), "egyuttmukodes")
        ?.pont,
    ).toBe(5);
  });

  test("semmire nem nyilatkozott: egyes", () => {
    expect(
      pontja(megfigyeles({ ranyitott: 5, megvalaszolt: 0 }), "egyuttmukodes")
        ?.pont,
    ).toBe(1);
  });

  test("a vitas tetel nem rontja: vitatkozni szabad", () => {
    // Az egyuttmukodes hianya az, ha valaki nem is valaszol — nem az, ha nem
    // ert egyet.
    const vitatkozo = pontja(
      megfigyeles({ ranyitott: 5, megvalaszolt: 5, vitas: 4 }),
      "egyuttmukodes",
    );
    const bekes = pontja(
      megfigyeles({ ranyitott: 5, megvalaszolt: 5 }),
      "egyuttmukodes",
    );
    expect(vitatkozo?.pont).toBe(bekes?.pont);
  });
});

describe("az osszevonas hianya", () => {
  test("nincs osszesitett pontszam a visszaadott sorok kozott", () => {
    const pontok = gepiErtekeles(
      megfigyeles({
        eldontott: 6,
        rendben: 6,
        valaszOrak: [1, 2, 3],
        ranyitott: 4,
        megvalaszolt: 4,
      }),
    );
    expect(pontok).toHaveLength(3);
    expect(pontok.map((sor) => sor.szempont)).toEqual([...GEPI_SZEMPONTOK]);
  });

  test("a pontosan fizeto, de nem valaszolo nem lesz kozepes", () => {
    const pontok = gepiErtekeles(
      megfigyeles({
        eldontott: 6,
        rendben: 6,
        kesesNapok: [0],
        valaszOrak: [400, 500, 600],
        ranyitott: 5,
        megvalaszolt: 5,
      }),
    );
    expect(pontok.find((sor) => sor.szempont === "pontossag")?.pont).toBe(5);
    expect(pontok.find((sor) => sor.szempont === "valaszido")?.pont).toBe(1);
  });
});
