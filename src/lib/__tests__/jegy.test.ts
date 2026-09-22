import { describe, expect, it } from "vitest";
import { jegyetKeszit, jegyetOlvas } from "../jegy";

const TITOK = "proba-titok-legalabb-tizenhat";
const MOST = new Date(Date.UTC(2026, 8, 20));
const HOLNAP = MOST.getTime() + 24 * 60 * 60 * 1000;

describe("munkamenetjegy", () => {
  it("a saját jegyét visszaolvassa", () => {
    const jegy = jegyetKeszit({ felhasznaloId: "felh-1", lejar: HOLNAP }, TITOK);
    expect(jegyetOlvas(jegy, TITOK, MOST)).toEqual({ felhasznaloId: "felh-1", lejar: HOLNAP });
  });

  it("az átírt azonosítót elutasítja", () => {
    const jegy = jegyetKeszit({ felhasznaloId: "felh-1", lejar: HOLNAP }, TITOK);
    const hamisitott = jegy.replace("felh-1", "felh-2");
    expect(jegyetOlvas(hamisitott, TITOK, MOST)).toBeNull();
  });

  it("a más titokkal aláírt jegyet elutasítja", () => {
    const jegy = jegyetKeszit({ felhasznaloId: "felh-1", lejar: HOLNAP }, "masik-titok-tizenhat");
    expect(jegyetOlvas(jegy, TITOK, MOST)).toBeNull();
  });

  it("a lejárt jegyet elutasítja", () => {
    const tegnap = MOST.getTime() - 1000;
    const jegy = jegyetKeszit({ felhasznaloId: "felh-1", lejar: tegnap }, TITOK);
    expect(jegyetOlvas(jegy, TITOK, MOST)).toBeNull();
  });

  it("a hiányzó és a csonka jegyet elutasítja", () => {
    expect(jegyetOlvas(undefined, TITOK, MOST)).toBeNull();
    expect(jegyetOlvas("felh-1", TITOK, MOST)).toBeNull();
    expect(jegyetOlvas("felh-1.123", TITOK, MOST)).toBeNull();
  });
});
