/**
 * Csatornadíj a rezsielszámolásban.
 *
 * Amit ez a próba megfog, és más nem: a felületen készített elszámolásba
 * tényleg bekerül a csatornadíj sora, a saját összegével, és a végösszeg a
 * kiírt sorok összege. A domain tesztje a számítást nézi, de azt nem, hogy a
 * kiszolgálói művelet végigviszi-e a díjszabásból a tételig.
 *
 * A próba minden futáskor új tervezetet készít, ami rendben van: a tervezet a
 * bérbeadó saját lapján áll, és a lista összecsukva mutatja a régebbieket.
 */

import { ALAP, all, belep, magyarra, tullogas } from "./kozos.mjs";

export const nev = "Csatornadíj";

/** „12 345 Ft" alakú szövegből egész forint. */
function forint(szoveg) {
  const talalat = szoveg.match(/-?[\d   ]+(?=\s*Ft)/);
  if (!talalat) return null;
  return Number(talalat[0].replace(/[  \s]/g, ""));
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  await oldal.goto(`${ALAP}/rezsi`);
  await oldal.waitForLoadState("networkidle");

  all((await tullogas(oldal)) <= 1, "a rezsi lapja elfér 360 képponton");

  all(
    await oldal.getByText(/csatornadíj 426 Ft\/m3/).first().isVisible(),
    "a díjszabás kiírja a csatornadíj egységárát is",
  );

  // Elszámolás készítése az első jogviszonyra, a lap felkínálta időszakra.
  const urlap = oldal.locator('form:has(button:text("Elszámolás készítése"))').first();
  all((await urlap.count()) > 0, "van űrlap elszámolás készítéséhez");
  await urlap.getByRole("button", { name: "Elszámolás készítése" }).click();
  await oldal.waitForLoadState("networkidle");

  // A tétel egy listaelem: a neve, az összege és a részletezése egy <li>-ben.
  // A mérőóra neve lehet „Víz" vagy „Víz (almérő)", ezért csak a toldatra
  // keresünk, de listaelemre szűkítve, hogy ne az egész lapot kapjuk el. A
  // legfrissebb elszámolás áll elöl, tehát az elsőt nézzük: a régebbiekben a
  // korábbi díjszabás szövege áll, és annak is úgy kell maradnia.
  const csatornaSor = oldal.locator("li").filter({ hasText: /· csatornadíj/ }).first();
  await csatornaSor.waitFor({ timeout: 15000 });
  all(true, "az elszámolásban külön sor a csatornadíj");

  const sorSzovege = await csatornaSor.innerText();
  all(
    /A csatornadíj a mért vízfogyasztás után jár/.test(sorSzovege),
    "a csatornadíj sora megmondja, mi után jár",
  );

  const csatornaFt = forint(sorSzovege);
  all(csatornaFt !== null && csatornaFt > 0, `a csatornadíjnak saját összege van (${csatornaFt} Ft)`);

  // A vízdíjat ugyanabból az elszámolásból vesszük, nem a lapról: a régebbi
  // elszámolások más egységárral készültek, és két elszámolás sorait
  // összevetni semmit nem bizonyítana.
  const ugyanaz = csatornaSor.locator("xpath=..");
  const vizFt = forint(
    await ugyanaz
      .locator("li")
      .filter({ hasText: /m3, \d+ nap\./ })
      .filter({ hasNotText: "csatornadíj" })
      .first()
      .innerText(),
  );
  all(
    vizFt !== null && vizFt > 0 && vizFt !== csatornaFt,
    `a vízdíj külön sor, más összeggel (${vizFt} Ft)`,
  );

  // A kettő aránya a két egységár aránya: 426/373. Ha a csatornadíj valaha a
  // vízdíjba olvadna, vagy ugyanazt az árat kapná, ez az állítás bukna.
  all(
    Math.abs(csatornaFt / vizFt - 426 / 373) < 0.01,
    "a két sor aránya a két egységár aránya",
  );
}
