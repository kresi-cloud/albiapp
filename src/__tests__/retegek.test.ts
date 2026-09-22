/**
 * Rétegkapu.
 *
 * A megállapodás szerint a `domain` tiszta TypeScript: minden pénzügyi számítás
 * és egyeztetés ott él, tesztekkel, keretrendszer és adatbázis nélkül. Ez nem
 * ízlés kérdése: ha a domain Prismát vagy Next.js-t importál, akkor a számítás
 * csak futó adatbázissal tesztelhető, és pontosan az marad teszt nélkül, ami a
 * legdrágább hiba.
 */

import { describe, expect, it } from "vitest";
import { forrasok, hivatkozasok } from "./forrasok";

const FAJLOK = forrasok();

function retegFajljai(reteg: string) {
  return FAJLOK.filter((fajl) => fajl.utvonal.startsWith(`${reteg}/`));
}

function tiltottat(fajl: { utvonal: string; tartalom: string }, tiltott: RegExp[]) {
  return hivatkozasok(fajl.tartalom).filter((hivatkozas) =>
    tiltott.some((minta) => minta.test(hivatkozas)),
  );
}

describe("rétegek", () => {
  it("a domain nem nyúl keretrendszerhez és adatbázishoz", () => {
    const tiltott = [
      /^next(\/|$)/,
      /^react(-dom)?(\/|$)/,
      /^@prisma\//,
      /^prisma(\/|$)/,
      /generated\/prisma/,
      /^@\/lib(\/|$)/,
      /^@\/app(\/|$)/,
      /^@\/components(\/|$)/,
      /^\.\.\/lib(\/|$)/,
      /^\.\.\/app(\/|$)/,
    ];
    const vetok = retegFajljai("domain")
      .filter((fajl) => !fajl.utvonal.includes("__tests__"))
      .map((fajl) => ({ utvonal: fajl.utvonal, tiltott: tiltottat(fajl, tiltott) }))
      .filter((sor) => sor.tiltott.length > 0);
    expect(vetok).toEqual([]);
  });

  it("a lib nem hivatkozik felfelé, a megjelenítésre", () => {
    const tiltott = [/^@\/app(\/|$)/, /^@\/components(\/|$)/];
    const vetok = retegFajljai("lib")
      .map((fajl) => ({ utvonal: fajl.utvonal, tiltott: tiltottat(fajl, tiltott) }))
      .filter((sor) => sor.tiltott.length > 0);
    expect(vetok).toEqual([]);
  });

  it("a megjelenítés nem kerüli meg a libet a generált Prisma-klienssel", () => {
    // A típusokat a lib adja tovább; az app ne a generált kliensből szedje őket,
    // különben az adatbázis alakja átszivárog az oldalakra.
    const vetok = [...retegFajljai("app"), ...retegFajljai("components")]
      .map((fajl) => ({
        utvonal: fajl.utvonal,
        tiltott: tiltottat(fajl, [/generated\/prisma/, /^@prisma\/client/]),
      }))
      .filter((sor) => sor.tiltott.length > 0);
    expect(vetok).toEqual([]);
  });

  it("csak a lib/db.ts készít Prisma-klienst", () => {
    const vetok = FAJLOK.filter(
      (fajl) => fajl.utvonal !== "lib/db.ts" && /new PrismaClient\(/.test(fajl.tartalom),
    ).map((fajl) => fajl.utvonal);
    expect(vetok).toEqual([]);
  });
});
