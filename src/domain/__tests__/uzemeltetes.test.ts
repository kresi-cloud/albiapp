import { describe, expect, it } from "vitest";
import {
  fiokmuveletetEllenoriz,
  naploMondata,
  naploMuvelete,
  valaszidoMagyarazat,
  valaszidoSzine,
  VALASZIDO_FIGYELEM_MS,
  VALASZIDO_GOND_MS,
} from "../uzemeltetes";

describe("válaszidő sávjai", () => {
  it("a határ alatt rendben van", () => {
    expect(valaszidoSzine(0)).toBe("rendben");
    expect(valaszidoSzine(VALASZIDO_FIGYELEM_MS - 1)).toBe("rendben");
  });

  it("a figyelmeztető határon már figyelem", () => {
    expect(valaszidoSzine(VALASZIDO_FIGYELEM_MS)).toBe("figyelem");
    expect(valaszidoSzine(VALASZIDO_GOND_MS - 1)).toBe("figyelem");
  });

  it("a felső határon gond", () => {
    expect(valaszidoSzine(VALASZIDO_GOND_MS)).toBe("gond");
    expect(valaszidoSzine(VALASZIDO_GOND_MS * 10)).toBe("gond");
  });

  it("a magyarázat kulcsot ad, nem kész mondatot", () => {
    expect(valaszidoMagyarazat(5).kulcs).toBe("uzemeltetes.valaszido.rendben");
    expect(valaszidoMagyarazat(5).adatok).toEqual({
      figyelem: VALASZIDO_FIGYELEM_MS,
      gond: VALASZIDO_GOND_MS,
    });
  });
});

/**
 * A fióktiltás szabályai. A saját fiók tiltásának kizárása nem kényelmi
 * kérdés: az utolsó rendszergazda így kizárná magát az alkalmazásból, és
 * onnantól az adatbázishoz kellene nyúlni ahhoz, hogy bárki üzemeltetni tudja.
 */
describe("fiókművelet ellenőrzése", () => {
  const alap = { adminId: "admin", celId: "mas", celLetiltva: false } as const;

  it("idegen, még nem letiltott fiókot le lehet tiltani", () => {
    expect(fiokmuveletetEllenoriz({ ...alap, muvelet: "letilt" })).toBeNull();
  });

  it("a saját fiókot nem", () => {
    const kifogas = fiokmuveletetEllenoriz({ ...alap, celId: "admin", muvelet: "letilt" });
    expect(kifogas?.kulcs).toBe("uzemeltetes.hiba.sajat_fiok");
  });

  it("a saját fiókot visszaengedni sem lehet: az is magára hatna", () => {
    const kifogas = fiokmuveletetEllenoriz({
      adminId: "admin",
      celId: "admin",
      celLetiltva: true,
      muvelet: "visszaenged",
    });
    expect(kifogas?.kulcs).toBe("uzemeltetes.hiba.sajat_fiok");
  });

  it("a már letiltottat nem tiltjuk le újra, mert a dátum elcsúszna", () => {
    const kifogas = fiokmuveletetEllenoriz({
      ...alap,
      celLetiltva: true,
      muvelet: "letilt",
    });
    expect(kifogas?.kulcs).toBe("uzemeltetes.hiba.mar_letiltva");
  });

  it("a nem letiltottat nem engedjük vissza", () => {
    const kifogas = fiokmuveletetEllenoriz({ ...alap, muvelet: "visszaenged" });
    expect(kifogas?.kulcs).toBe("uzemeltetes.hiba.nincs_letiltva");
  });

  it("a letiltottat vissza lehet engedni", () => {
    expect(
      fiokmuveletetEllenoriz({ ...alap, celLetiltva: true, muvelet: "visszaenged" }),
    ).toBeNull();
  });
});

describe("napló", () => {
  it("a művelethez tartozó naplókulcs", () => {
    expect(naploMuvelete("letilt")).toBe("fiok_letiltas");
    expect(naploMuvelete("visszaenged")).toBe("fiok_visszaengedes");
  });

  it("a mondat kulcsot ad, a nevekkel behelyettesítve", () => {
    const mondat = naploMondata({
      muvelet: "fiok_letiltas",
      adminNev: "Nagy Péter",
      targyNev: "Kovács Anna",
    });
    expect(mondat.kulcs).toBe("uzemeltetes.naplo.fiok_letiltas");
    expect(mondat.adatok).toEqual({ admin: "Nagy Péter", targy: "Kovács Anna" });
  });

  it("a megszűnt fiók helyén is fordítható szöveg áll, nem üres hely", () => {
    const mondat = naploMondata({
      muvelet: "fiok_visszaengedes",
      adminNev: "Nagy Péter",
      targyNev: null,
    });
    expect(mondat.adatok?.targy).toEqual({ kulcs: "uzemeltetes.naplo.torolt_fiok" });
  });
});
