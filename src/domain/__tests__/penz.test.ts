import { describe, expect, it } from "vitest";
import {
  LEGNAGYOBB_OSSZEG,
  forint,
  meroallastOlvas,
  napKulonbseg,
  osszegetForintra,
  urlapForint,
} from "../penz";

describe("osszegetForintra", () => {
  it("magyar ezres elválasztót olvas", () => {
    expect(osszegetForintra("180 000")).toBe(180000);
    expect(osszegetForintra("180.000")).toBe(180000);
    expect(osszegetForintra("180 000 Ft")).toBe(180000);
  });

  it("tizedesjegyet kerekít egész forintra", () => {
    expect(osszegetForintra("180000,49")).toBe(180000);
    expect(osszegetForintra("180000.50")).toBe(180001);
    expect(osszegetForintra("180.000,00")).toBe(180000);
  });

  it("negatív összeget is olvas", () => {
    expect(osszegetForintra("-45 000")).toBe(-45000);
  });

  it("értelmezhetetlenre null", () => {
    expect(osszegetForintra("")).toBeNull();
    expect(osszegetForintra("nincs adat")).toBeNull();
  });
});

describe("forint", () => {
  it("magyar formátumban ír ki", () => {
    // A nem törő szóközöket egységesítjük, hogy a teszt ne a futtatókörnyezet
    // szóközfajtáját ellenőrizze.
    expect(forint(180000).replace(/\s/g, " ")).toBe("180 000 Ft");
  });
});

describe("napKulonbseg", () => {
  it("naptári napokat számol", () => {
    const tol = new Date(Date.UTC(2026, 8, 5));
    const ig = new Date(Date.UTC(2026, 8, 12));
    expect(napKulonbseg(tol, ig)).toBe(7);
    expect(napKulonbseg(ig, tol)).toBe(-7);
  });

  it("napon belüli időpontokat egy napnak lát", () => {
    const reggel = new Date(Date.UTC(2026, 8, 5, 6));
    const este = new Date(Date.UTC(2026, 8, 5, 21));
    expect(napKulonbseg(reggel, este)).toBe(0);
  });
});

describe("urlapForint", () => {
  /**
   * Ez a mérés arról szól, ami öt űrlapon ötféleképp dőlt el. A „180.000"
   * bérleti díjból 180 forintos jogviszony lett, kilenc hónapnyi 180 forintos
   * előírással, figyelmeztetés nélkül és utólag javíthatatlanul.
   */
  it("a pontot ezres elválasztónak veszi, ahogy a magyar kivonat írja", () => {
    expect(urlapForint("180.000")).toBe(180000);
    expect(urlapForint("4.990")).toBe(4990);
    expect(urlapForint("120.000")).toBe(120000);
  });

  it("szóközt, nem törhető szóközt és a Ft-ot is elviseli", () => {
    expect(urlapForint("180 000 Ft")).toBe(180000);
    expect(urlapForint("180\u00a0000")).toBe(180000);
  });

  it("tizedest kerekít, mert a pénz egész forint", () => {
    expect(urlapForint("1000,50")).toBe(1001);
    expect(urlapForint("12,5")).toBe(13);
  });

  it("az üres mező nem nulla", () => {
    expect(urlapForint("")).toBeNull();
    expect(urlapForint("   ")).toBeNull();
    expect(urlapForint(null)).toBeNull();
  });

  it("amit nem tud olvasni, az NaN, nem hiányzó", () => {
    expect(urlapForint("nem szám")).toBeNaN();
    expect(urlapForint("1.2.3")).toBeNaN();
  });

  it("az egész szám fölé nem enged: abból 500-as lap lenne, nem hibaüzenet", () => {
    expect(urlapForint(String(LEGNAGYOBB_OSSZEG))).toBe(LEGNAGYOBB_OSSZEG);
    expect(urlapForint("99999999999")).toBeNaN();
    expect(urlapForint("-99999999999")).toBeNaN();
  });
});

describe("meroallastOlvas", () => {
  it("mértékegységgel együtt beírt állást is kiolvas", () => {
    expect(meroallastOlvas("2893 kWh")).toBe(2893);
    expect(meroallastOlvas("91,058 m³")).toBeCloseTo(91.058, 6);
    expect(meroallastOlvas("223.4 m3")).toBeCloseTo(223.4, 6);
  });

  /**
   * Ezerszeres hiba volt benne: a „1.234,5 m3" 1,234-ként került a mérőóra
   * történetébe, és az lett az első rezsielszámolás nyitója.
   */
  it("pont és vessző együtt: az utolsó a tizedesjel", () => {
    expect(meroallastOlvas("1.234,5 m3")).toBeCloseTo(1234.5, 6);
    expect(meroallastOlvas("1,234.5")).toBeCloseTo(1234.5, 6);
  });

  it("a kétértelmű alakra nem tippel, hanem nullt ad", () => {
    // „12.345 kWh": lehet tizenkétezer-háromszáznegyvenöt és 12,345 is.
    expect(meroallastOlvas("12.345 kWh")).toBeNull();
    expect(meroallastOlvas("1.000")).toBeNull();
  });

  it("amiben nincs szám, abból nem lesz óraállás", () => {
    expect(meroallastOlvas("")).toBeNull();
    expect(meroallastOlvas("leolvasatlan")).toBeNull();
  });
});
