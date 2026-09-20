import { describe, expect, it } from "vitest";
import { forint, napKulonbseg, osszegetForintra } from "../penz";

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
