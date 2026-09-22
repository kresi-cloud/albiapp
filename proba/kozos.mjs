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
  // Telefonméretben a kilépés a „Több" lapjára került, mert az alsó fülsávra a
  // négy gyakran használt hely fért ki. A próba 360 képponton fut, tehát előbb
  // ki kell nyitnia ezt a lapot — ugyanúgy, ahogy a felhasználó is teszi.
  const tobb = oldal.getByRole("button", { name: /^(Több|More)$/ });
  if (await tobb.count()) {
    await tobb.first().click();
  }
  const kilepes = oldal.getByRole("button", { name: /Kilépés|Sign out/ });
  if (await kilepes.count()) {
    await kilepes.first().click();
    await oldal.waitForLoadState("networkidle");
  }
}

/**
 * Belépés. A kilépés után nem azonnal tölt be a belépőlap.
 *
 * A kilépés kiszolgálói művelet, és a `networkidle` hazudik rá, ugyanúgy, ahogy
 * a nyelvváltásra: vissza tud térni azelőtt, hogy a süti tényleg eltűnt volna.
 * Ilyenkor a `/belepes` még a belépett felhasználót látja, és átirányít — a
 * próba pedig e-mail mezőt keres olyan lapon, ahol nincs. Ezért nem a hálózatra
 * várunk, hanem az eredményre: addig töltjük újra a belépőlapot, amíg a mező
 * meg nem jelenik.
 */
export async function belep(oldal, email) {
  await kilep(oldal);
  for (let probalkozas = 0; probalkozas < 20; probalkozas++) {
    await oldal.goto(`${ALAP}/belepes`);
    if ((await oldal.locator('input[name="email"]').count()) > 0) break;
    await oldal.waitForTimeout(500);
  }
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

/**
 * Átállítja a felület nyelvét, és megvárja, amíg tényleg át is állt.
 *
 * A nyelvváltás kiszolgálói művelet, és a `networkidle` hazudik rá: vissza tud
 * térni azelőtt, hogy a válasz megérkezne, a következő `goto` pedig elvágja a
 * függőben lévő kérést. Ilyenkor a próba magyar lapon keres angol szöveget, és
 * a bukás attól függ, melyik gépen fut — ami rosszabb, mint egy egyenes hiba.
 * Ezért nem a hálózatra várunk, hanem az eredményre: a `lang` attribútumra.
 */
export async function nyelvre(oldal, nyelv) {
  const valto = oldal.locator(`form:has(button[name="nyelv"]) button[value="${nyelv}"]`);
  if ((await valto.count()) === 0) return;
  await valto.first().click();
  await oldal.waitForFunction((cel) => document.documentElement.lang === cel, nyelv);
}

/**
 * A választott nyelvet visszaállítja magyarra, hogy a próbák ne fertőzzék
 * egymást. A kezdőlapra megy előbb, mert a nyelvváltó a fejlécben van, és a
 * belépés előtti lapokon nincs ott.
 */
export async function magyarra(oldal) {
  await oldal.goto(`${ALAP}/`);
  await nyelvre(oldal, "hu");
}

/** Átállítja a felületet angolra a nyelvváltóval, ahogy a felhasználó tenné. */
export async function angolra(oldal) {
  await oldal.goto(`${ALAP}/`);
  await nyelvre(oldal, "en");
}

/**
 * Láthatóvá teszi minden összecsukott szakasz tartalmát a lapon.
 *
 * A hosszú listák rendezett része alapból csukva áll, hogy a lap telefonon
 * kezelhető maradjon. Az összecsukás megjelenítés, nem jogosultság: a működést
 * próbáló menetek ezért mindent látnak, és úgy keresik a vezérlőket. Hogy a
 * lap tényleg rövid-e csukva, azt a `meret` próba méri.
 *
 * Stíluslappal oldjuk meg, nem az `open` jelző átállításával. Azt a React a
 * következő újrarajzoláskor visszaállítaná, mi megint kinyitnánk, és a lap
 * soha nem nyugodna meg — a Playwright pedig csak nyugodt elemre kattint. A
 * stíluslap ehhez képest kívül marad a React világán, és a kiszolgálói
 * műveletek után is érvényben van.
 */
export async function mindetKinyit(oldal) {
  await oldal.addStyleTag({
    content: `
      details:not([open])::details-content { content-visibility: visible !important; }
      details:not([open]) > :not(summary) {
        content-visibility: visible !important;
        display: revert !important;
      }
    `,
  });
}
