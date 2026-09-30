/**
 * Fordítási kapu: a generált Prisma kliens.
 *
 * A `src/generated` nincs a tárolóban (a `.gitignore` kizárja), tehát a
 * fordítás előtt valakinek le kell futtatnia a `prisma generate`-et. Amíg ez
 * csak a CI munkafolyamatában állt külön lépésként, a tárhelyszolgáltató
 * fordítása elbukott: `Module not found: '@/generated/prisma/client'` — a CI
 * viszont zöld volt, mert ott a lépés megvolt. Pont az a néma hibafajta, amit
 * a telepítési ikonoknál is kapuval fogunk meg: minden ellenőrzés jó, csak a
 * termék nem áll össze ott, ahol tényleg fut.
 *
 * Ezért a `build` maga generál, és a kapu ezt kéri számon. Nem a CI-t méri,
 * hanem a `package.json`-t: aki a fordítást átírja, annak itt kell elesnie.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const GYOKER = join(import.meta.dirname, "..", "..");

function scriptek(): Record<string, string> {
  const csomag = JSON.parse(readFileSync(join(GYOKER, "package.json"), "utf8"));
  return csomag.scripts ?? {};
}

/** A kliens oda kerül, ahová a séma mondja, és onnan is importáljuk. */
function generatorCelja(): string {
  const sema = readFileSync(join(GYOKER, "prisma", "schema.prisma"), "utf8");
  return /output\s*=\s*"([^"]+)"/.exec(sema)?.[1] ?? "";
}

describe("fordítási kapu", () => {
  it("önpróba: egy generate nélküli fordítás megbukna", () => {
    // Egy kapu, ami mindenre igent mond, rosszabb a semminél.
    expect(general("next build")).toBe(false);
    expect(general("prisma generate && next build")).toBe(true);
  });

  it("a fordítás maga generálja a Prisma klienst", () => {
    expect(general(scriptek().build ?? "")).toBe(true);
  });

  it("a telepítés is generál, hogy a helyi fordítás se hiányos induljon", () => {
    expect(general(scriptek().postinstall ?? "")).toBe(true);
  });

  it("a generált kliens nincs a tárolóban, tehát tényleg generálni kell", () => {
    const kizarva = readFileSync(join(GYOKER, ".gitignore"), "utf8");
    expect(kizarva).toMatch(/^\/?src\/generated\/?$/m);
  });

  it("oda generál, ahonnan importálunk", () => {
    // A séma kimenete és a `@/generated/...` import ugyanaz a hely: ha valaki
    // az egyiket átírja, a fordítás megint csak a szolgáltatónál bukna el.
    expect(generatorCelja()).toBe("../src/generated/prisma");
    const db = readFileSync(join(GYOKER, "src", "lib", "db.ts"), "utf8");
    expect(db).toContain('from "@/generated/prisma/client"');
  });
});

/** Generál-e ez a parancs Prisma klienst, mielőtt bármi mást tenne. */
function general(parancs: string): boolean {
  return /(^|&&|;|\|\|)\s*(npx\s+)?prisma\s+generate\b/.test(parancs);
}
