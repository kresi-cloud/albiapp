/**
 * A kétoldali befizetés-egyeztetés végigjátszva.
 *
 * A lényeg, amit csak futtatással lehet ellenőrizni: a két fél adata tényleg
 * külön él, egyik sem írja felül a másikat, és bizonylatot csak akkor kérünk,
 * ha a kettő nem egyezik. Az pedig, hogy teljes bankszámlakivonatot nem kérünk,
 * mindkét oldalon ki van írva — ez ígéret a felhasználónak, tehát próba való rá.
 *
 * A próba a saját kiindulóhelyzetét állítja elő (mindkét oldalt kiüríti), hogy
 * a próbakör újrafuttatható maradjon.
 */

import { ALAP, all, belep, magyarra } from "./kozos.mjs";

export const nev = "Kétoldali befizetés-egyeztetés";

/** A mai hónap időszaka, hogy a próba ne évüljön el. */
function haviIdoszak(most) {
  return `${most.getUTCFullYear()}-${String(most.getUTCMonth() + 1).padStart(2, "0")}`;
}

const IDOSZAK = haviIdoszak(new Date());
const DIJ = "180 000 Ft";

/**
 * A vizsgált hónap bérleti díjának sora. A teendőlista ugyanezt a hónapot és
 * összeget kiírja, ezért a befizetési kártyát arról ismerjük meg, hogy van
 * rajta állapotjelző és a két fél adata.
 */
function sorA(oldal) {
  return oldal
    .locator("li", { hasText: IDOSZAK })
    .filter({ hasText: DIJ })
    .filter({ hasText: /Amit a bérlő mond|Amit te mondtál/ })
    .first();
}

/** Ha van rögzített adat, visszavonja. Így ismert helyzetből indulunk. */
async function kiurit(oldal, cimke) {
  const gomb = sorA(oldal).getByText(cimke);
  if ((await gomb.count()) > 0) {
    await gomb.first().click();
    await oldal.waitForLoadState("networkidle");
    await oldal.reload();
  }
}

export async function futtat(oldal) {
  // --- Bérbeadó: a kivonatfeltöltésnek nyoma sincs, és kiürítjük a saját oldalt
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/befizetesek`);

  const fooldal = await oldal.textContent("main");
  all(
    !/kivonatfájl|Kivonat feltöltése|CSV/i.test(fooldal),
    "a kivonatfeltöltés eltűnt a befizetésekről",
  );
  all(
    (await oldal.getByText(/Teljes bankszámlakivonatot nem kérünk/).count()) > 0,
    "a bérbeadói oldal kimondja, hogy teljes kivonatot nem kérünk",
  );
  all((await sorA(oldal).count()) > 0, "a hónap bérleti díja megjelenik a bérbeadónál");
  await kiurit(oldal, "Ezt tévedésből rögzítettem");

  // --- Bérlő: kiürítjük az övét is, majd megadja a saját oldalát
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo`);
  await kiurit(oldal, "Ezt elgépeltem");

  const berloiSor = sorA(oldal);
  await berloiSor.getByText("Elutaltam, rögzítem").click();
  all(
    (await berloiSor.getByText(/Bankszámlakivonatot nem kérünk, és nem is fogadunk el/).count()) > 0,
    "a bérlői űrlap kimondja, hogy kivonatot nem kérünk",
  );

  await berloiSor.locator('input[name="osszegFt"]').fill("180000");
  await berloiSor.getByRole("button", { name: "Rögzítem" }).click();
  const visszavon = berloiSor.getByText("Ezt elgépeltem");
  await visszavon.first().waitFor({ timeout: 15000 });
  all((await visszavon.count()) > 0, "a bérlő utalása rögzült, és visszavonható");

  await oldal.goto(`${ALAP}/berlo`);
  all(
    (await sorA(oldal).getByText("várakozik").count()) > 0,
    "egyoldalú adatnál a tétel a másik félre vár, nem vitás",
  );
  all(
    (await sorA(oldal).getByText(/A két oldal nem egyezik/).count()) === 0,
    "egyoldalú adatnál nem kérünk bizonylatot",
  );

  // --- Bérbeadó: mást mond, mint a bérlő
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/befizetesek`);
  const berbeadoiSor = sorA(oldal);
  await berbeadoiSor.getByText("Megérkezett? Rögzítem").click();
  await berbeadoiSor.locator('input[name="osszegFt"]').fill("150000");
  await berbeadoiSor.getByRole("button", { name: "Rögzítem" }).click();
  await berbeadoiSor
    .getByText("Ezt tévedésből rögzítettem")
    .first()
    .waitFor({ timeout: 15000 });

  await oldal.goto(`${ALAP}/befizetesek`);
  const vitasSor = sorA(oldal);
  all((await vitasSor.getByText("vitás").count()) > 0, "eltérő adatnál a tétel vitás lesz");
  all(
    (await vitasSor.getByText(/A két oldal nem egyezik/).count()) > 0,
    "vitás tételnél kérünk bizonylatot, és megmondjuk, melyik oldalit",
  );
  all(
    (await vitasSor.getByText(/Teljes bankszámlakivonat nem kell/).count()) > 0,
    "a bizonylatkérés is kimondja, hogy teljes kivonat nem kell",
  );
  all(
    (await vitasSor.getByText(DIJ).count()) > 0,
    "a bérlő adata megmarad: a bérbeadó rögzítése nem írta felül",
  );

  // --- Egyezésre hozva: a vita és a bizonylatkérés eltűnik
  await kiurit(oldal, "Ezt tévedésből rögzítettem");
  const ujraSor = sorA(oldal);
  await ujraSor.getByText("Megérkezett? Rögzítem").click();
  await ujraSor.locator('input[name="osszegFt"]').fill("180000");
  await ujraSor.getByRole("button", { name: "Rögzítem" }).click();
  await ujraSor.getByText("Ezt tévedésből rögzítettem").first().waitFor({ timeout: 15000 });

  await oldal.goto(`${ALAP}/befizetesek`);
  const kesz = sorA(oldal);
  all((await kesz.getByText("egyezik").count()) > 0, "egyező adatnál a tétel lezárul");
  all(
    (await kesz.getByText(/A két oldal nem egyezik/).count()) === 0,
    "egyezésnél nem kérünk bizonylatot",
  );
}
