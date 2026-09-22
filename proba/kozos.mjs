/**
 * A böngészős próbák közös része.
 *
 * Ezek a próbák azt fogják meg, amit sem a típusellenőrzés, sem a fordítás nem
 * lát: a `"use server"` fájlok szabályait, az űrlapok tényleges működését és
 * azt, hogy telefonon is használható-e, ami elkészült.
 *
 * Telefonméret: a mérce 360 képpont, mert a ma is használt olcsóbb készülékek
 * ennyit adnak, és ha ott jó, nagyobb kijelzőn is jó lesz.
 */

import { chromium } from "playwright";

export const ALAP = process.env.PROBA_CIM ?? "http://localhost:3000";
export const JELSZO = process.env.PROBA_JELSZO ?? "probajelszo2026";
export const SZELESSEG = 360;

let hibak = 0;

export function all(felt, uzenet) {
  if (!felt) {
    hibak += 1;
    throw new Error(`HIBA: ${uzenet}`);
  }
  process.stdout.write(`  ok: ${uzenet}\n`);
}

export function voltHiba() {
  return hibak > 0;
}

export async function bongeszot() {
  // Saját gépen a rendszer Chromiumja is jó, ha a PROBA_BONGESZO megadja.
  const bongeszo = await chromium.launch({
    executablePath: process.env.PROBA_BONGESZO || undefined,
  });
  const kontextus = await bongeszo.newContext({
    viewport: { width: SZELESSEG, height: 844 },
  });
  return { bongeszo, oldal: await kontextus.newPage() };
}

export async function kilep(oldal) {
  await oldal.goto(`${ALAP}/`);
  const kilepes = oldal.getByRole("button", { name: /Kilépés|Sign out/ });
  if (await kilepes.count()) {
    await kilepes.click();
    await oldal.waitForLoadState("networkidle");
  }
}

export async function belep(oldal, email) {
  await kilep(oldal);
  await oldal.goto(`${ALAP}/belepes`);
  await oldal.fill('input[name="email"]', email);
  await oldal.fill('input[name="jelszo"]', JELSZO);
  await oldal.getByRole("button", { name: /Belépés|Sign in/ }).click();
  await oldal.waitForLoadState("networkidle");
}

/** Hány képponttal lóg ki az oldal vízszintesen. Nulla, ha elfér. */
export async function tullogas(oldal) {
  return oldal.evaluate(() => {
    const gyoker = document.documentElement;
    return gyoker.scrollWidth - gyoker.clientWidth;
  });
}

/** A választott nyelvet visszaállítja magyarra, hogy a próbák ne fertőzzék egymást. */
export async function magyarra(oldal) {
  await oldal.goto(`${ALAP}/`);
  const valto = oldal.locator('form:has(button[name="nyelv"]) button[value="hu"]');
  if (await valto.count()) {
    await valto.first().click();
    await oldal.waitForLoadState("networkidle");
  }
}
