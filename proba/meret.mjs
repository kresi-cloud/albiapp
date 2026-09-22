/**
 * Telefonméret-próba.
 *
 * Egyetlen kérdést tesz fel minden oldalon: kilóg-e valami vízszintesen 360
 * képpontnál. Ez a hiba a fejlesztő nagy kijelzőjén soha nem látszik, a
 * bérbeadó telefonján viszont az első pillanatban: oldalra kell húzogatni a
 * táblázatot, és a gomb kicsúszik a képernyőről.
 */

import { ALAP, SZELESSEG, all, belep, magyarra } from "./kozos.mjs";

const BERBEADOI = [
  "/",
  "/befizetesek",
  "/berlok",
  "/ingatlanok",
  "/rezsi",
  "/ado",
  "/dokumentumok",
  "/hibak",
  "/teendok",
  "/beallitasok",
];

const BERLOI = ["/berlo", "/berlo/hibak", "/berlo/dokumentumok"];

const NYILVANOS = ["/belepes", "/jogi/adatkezeles", "/jogi/feltetelek"];

async function kilog(oldal) {
  return oldal.evaluate(() => {
    const gyoker = document.documentElement;
    return gyoker.scrollWidth - gyoker.clientWidth;
  });
}

async function vizsgal(oldal, utvonalak) {
  for (const utvonal of utvonalak) {
    await oldal.goto(`${ALAP}${utvonal}`);
    await oldal.waitForLoadState("networkidle");
    const tobblet = await kilog(oldal);
    all(tobblet <= 1, `${utvonal} elfér ${SZELESSEG} képponton (túllógás: ${tobblet}px)`);
  }
}

export const nev = "Telefonméret";

export async function futtat(oldal) {
  await vizsgal(oldal, NYILVANOS);
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await vizsgal(oldal, BERBEADOI);
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await vizsgal(oldal, BERLOI);
}
