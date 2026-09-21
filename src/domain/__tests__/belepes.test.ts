import { describe, expect, it } from "vitest";
import {
  emailNekLatszik,
  emailtNormalizal,
  JELSZO_MIN_HOSSZ,
  meghivoAllapota,
  meghivoLejarata,
  jelszotEllenoriz,
} from "../belepes";

describe("emailtNormalizal", () => {
  it("kisbetűsít és szóközt vág", () => {
    expect(emailtNormalizal("  Anna@Pelda.HU ")).toBe("anna@pelda.hu");
  });

  it("hiányzó értékből üres szöveg lesz", () => {
    expect(emailtNormalizal(null)).toBe("");
  });
});

describe("emailNekLatszik", () => {
  it("elfogadja a szokásos címet", () => {
    expect(emailNekLatszik("anna@pelda.hu")).toBe(true);
  });

  it("elutasítja a hiányos címet", () => {
    expect(emailNekLatszik("anna@pelda")).toBe(false);
    expect(emailNekLatszik("anna.pelda.hu")).toBe(false);
    expect(emailNekLatszik("")).toBe(false);
  });
});

describe("jelszotEllenoriz", () => {
  it("a kellően hosszú jelszót elfogadja", () => {
    expect(jelszotEllenoriz("hosszujelszo2026")).toEqual([]);
  });

  it("a rövid jelszót elutasítja, és megmondja a határt", () => {
    const hibak = jelszotEllenoriz("rovid");
    expect(hibak).toHaveLength(1);
    expect(hibak[0].kulcs).toBe("jelszo.hiba.rovid");
    expect(hibak[0].adatok?.min).toBe(JELSZO_MIN_HOSSZ);
  });

  it("a csak szóközből álló jelszót elutasítja", () => {
    expect(jelszotEllenoriz("            ").length).toBeGreaterThan(0);
  });

  it("jelzi, ha a két jelszó nem egyezik", () => {
    expect(jelszotEllenoriz("hosszujelszo2026", "masikjelszo2026").map((sor) => sor.kulcs)).toContain(
      "jelszo.hiba.nem_egyezik",
    );
  });
});

describe("meghivoAllapota", () => {
  const most = new Date(Date.UTC(2026, 8, 20));

  it("az élő meghívó érvényes", () => {
    const allapot = meghivoAllapota(
      { lejar: new Date(Date.UTC(2026, 8, 25)), felhasznalva: null },
      most,
    );
    expect(allapot).toBe("ervenyes");
  });

  it("a lejárt meghívó nem érvényes", () => {
    const allapot = meghivoAllapota(
      { lejar: new Date(Date.UTC(2026, 8, 19)), felhasznalva: null },
      most,
    );
    expect(allapot).toBe("lejart");
  });

  it("a felhasznált meghívó akkor sem érvényes, ha még nem járt le", () => {
    const allapot = meghivoAllapota(
      { lejar: new Date(Date.UTC(2026, 8, 25)), felhasznalva: new Date(Date.UTC(2026, 8, 21)) },
      most,
    );
    expect(allapot).toBe("felhasznalt");
  });

  it("a lejárat pillanatában már nem érvényes", () => {
    const allapot = meghivoAllapota({ lejar: most, felhasznalva: null }, most);
    expect(allapot).toBe("lejart");
  });
});

describe("meghivoLejarata", () => {
  it("két hétre előre tesz", () => {
    const most = new Date(Date.UTC(2026, 8, 20));
    expect(meghivoLejarata(most).toISOString()).toBe("2026-10-04T00:00:00.000Z");
  });
});
