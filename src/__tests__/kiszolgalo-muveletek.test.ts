/**
 * Kiszolgálói műveletek kapuja.
 *
 * A `"use server"` fájl csak async függvényt exportálhat. Ezt sem a
 * típusellenőrzés, sem a fordítás nem fogja meg: a hiba csak futtatáskor jön
 * elő, és akkor is egy oldal fehér képernyőjeként. Olcsóbb elolvasni.
 *
 * Típust exportálhat, mert az a fordításkor eltűnik, és az űrlapok eredményének
 * típusát valahol le kell írni.
 */

import { describe, expect, it } from "vitest";
import { forrasok, megjegyzesNelkul } from "./forrasok";

const KISZOLGALOI = forrasok().filter((fajl) =>
  /^\s*("use server"|'use server');/m.test(megjegyzesNelkul(fajl.tartalom)),
);

/** Egy exportált név és az, hogy async függvény-e. */
function exportok(tartalom: string): { sor: string; rendben: boolean }[] {
  const sorok = megjegyzesNelkul(tartalom)
    .split("\n")
    .filter((sor) => /^export\b/.test(sor.trim()));
  return sorok.map((nyers) => {
    const sor = nyers.trim();
    const tipus = /^export\s+(type|interface)\b/.test(sor);
    const asyncFuggveny =
      /^export\s+async\s+function\b/.test(sor) ||
      /^export\s+default\s+async\s+function\b/.test(sor) ||
      /^export\s+(const|let|var)\s+\w+\s*(:[^=]+)?=\s*async\s*(\(|function\b)/.test(sor);
    return { sor, rendben: tipus || asyncFuggveny };
  });
}

describe("kiszolgálói műveletek", () => {
  it("a kapu tényleg harap", () => {
    // Egy kapu, ami mindenre igent mond, rosszabb a semminél: azt hisszük,
    // őrködik. Ezért itt kipróbáljuk, hogy a tiltott alakokat elutasítja.
    expect(exportok("export function nemAsync() {}")[0].rendben).toBe(false);
    expect(exportok("export const SZAM = 3;")[0].rendben).toBe(false);
    expect(exportok("export const urlap = (adat) => adat;")[0].rendben).toBe(false);
    expect(exportok("export async function rendben() {}")[0].rendben).toBe(true);
    expect(exportok("export const mentes = async (urlap: FormData) => {};")[0].rendben).toBe(true);
    expect(exportok("export type Eredmeny = { allapot: string };")[0].rendben).toBe(true);
  });

  it("van mit ellenőrizni", () => {
    expect(KISZOLGALOI.length).toBeGreaterThan(0);
  });

  it('a "use server" fájlok csak async függvényt exportálnak', () => {
    const vetok = KISZOLGALOI.flatMap((fajl) =>
      exportok(fajl.tartalom)
        .filter((sor) => !sor.rendben)
        .map((sor) => `${fajl.utvonal}: ${sor.sor}`),
    );
    expect(vetok).toEqual([]);
  });

  it('a "use server" az első utasítás a fájlban', () => {
    const vetok = KISZOLGALOI.filter((fajl) => {
      const elso = megjegyzesNelkul(fajl.tartalom)
        .split("\n")
        .map((sor) => sor.trim())
        .find((sor) => sor !== "");
      return !/^("use server"|'use server');$/.test(elso ?? "");
    }).map((fajl) => fajl.utvonal);
    expect(vetok).toEqual([]);
  });
});
