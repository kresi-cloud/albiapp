/**
 * A telepíthetőség kapuja.
 *
 * Amit ez megfog, és semmi más: a telepítés elmaradása **néma**. Ha az
 * alkalmazásleíróból hiányzik egy ikonméret, vagy az ikonfájl nincs ott, ahová
 * a leíró mutat, a lap ugyanúgy hibátlanul megjelenik — csak a böngésző nem
 * ajánlja fel a telepítést, és senki nem tudja meg, miért. Se a
 * típusellenőrzés, se a fordítás nem szól érte.
 *
 * A fájlméretet is itt mérjük, pedig az nem domain: a leíró ígérete (512
 * képpontos ikon) és a lemezen álló kép csak együtt ér valamit.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SZOTAR } from "../szotar";
import {
  IKONOK,
  IOS_IKON,
  JEL_IKON,
  TELEPITES_MODOK,
  manifest,
  type Manifest,
} from "../telepites";

/** A böngészők telepítési feltételei, egy helyen. */
function kifogasok(leiro: Manifest): string[] {
  const baj: string[] = [];
  if (!leiro.name.trim()) baj.push("nincs név");
  if (!leiro.description.trim()) baj.push("nincs leírás");
  if (leiro.start_url !== "/") baj.push("a kezdőlap nem a gyökér");
  if (leiro.scope !== "/") baj.push("az alkalmazás hatóköre nem a gyökér");
  if (leiro.display !== "standalone") baj.push("nem saját ablakban indul");
  for (const meret of ["192x192", "512x512"]) {
    const megvan = leiro.icons.some(
      (ikon) => ikon.sizes === meret && ikon.type === "image/png",
    );
    if (!megvan) baj.push(`hiányzik a ${meret} ikon`);
  }
  if (!leiro.icons.some((ikon) => ikon.purpose === "maskable")) {
    baj.push("nincs vágható ikon");
  }
  return baj;
}

/** A PNG fejléce a 16. bájttól a szélességet és a magasságot tartja. */
function pngMerete(utvonal: string): { szeles: number; magas: number } {
  const bajtok = readFileSync(join(process.cwd(), "public", utvonal));
  return { szeles: bajtok.readUInt32BE(16), magas: bajtok.readUInt32BE(20) };
}

const LEIRO = manifest("hu", "Bérbeadás egy helyen.");

describe("telepíthetőség", () => {
  it("a kapu tényleg harap", () => {
    const csonka: Manifest = { ...LEIRO, icons: [], description: "", start_url: "/berlo" };
    expect(kifogasok(csonka)).toEqual([
      "nincs leírás",
      "a kezdőlap nem a gyökér",
      "hiányzik a 192x192 ikon",
      "hiányzik a 512x512 ikon",
      "nincs vágható ikon",
    ]);
  });

  it("az alkalmazásleíró telepíthető", () => {
    expect(kifogasok(LEIRO)).toEqual([]);
  });

  it("a leírás és a nyelv a hívótól jön, nem beégetve", () => {
    const angol = manifest("en", "Renting out a flat in one place.");
    expect(angol.lang).toBe("en");
    expect(angol.description).toBe("Renting out a flat in one place.");
    // A név viszont márkanév: mindkét nyelven ugyanaz.
    expect(angol.name).toBe(LEIRO.name);
  });

  it("minden ígért ikon ott van, és akkora, amekkorának mondjuk", () => {
    for (const ikon of IKONOK) {
      const [szeles, magas] = ikon.sizes.split("x").map(Number);
      expect(pngMerete(ikon.src), ikon.src).toEqual({ szeles, magas });
    }
    // Az iOS-é nem a leíróból jön, hanem a lap meta címkéjéből, ezért külön.
    expect(pngMerete(IOS_IKON)).toEqual({ szeles: 180, magas: 180 });
    expect(() => readFileSync(join(process.cwd(), "public", JEL_IKON))).not.toThrow();
  });

  it("minden telepítési lépéshez tartozik mondat a szótárban", () => {
    const hianyzo = TELEPITES_MODOK.flatMap((mod) =>
      [mod.cim, ...mod.lepesek].filter((kulcs) => !SZOTAR[kulcs]),
    );
    expect(hianyzo).toEqual([]);
  });

  it("mind a három platform benne van: az iPhone-on kézzel kell feltenni", () => {
    expect(TELEPITES_MODOK.map((mod) => mod.kulcs)).toEqual([
      "android",
      "ios",
      "asztali",
    ]);
  });
});
