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

import { ALAP, all, belep, kilep, magyarra, mindetKinyit } from "./kozos.mjs";

/** Egy apró, valódi PNG: a bizonylat helyett ennyi is elég a próbához. */
const KEP = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/**
 * Feltölt egy bizonylatot a megadott sorhoz, előbb kitakarítva a korábbit.
 * Azt is ellenőrzi, hogy a saját oldalt tőlünk várja a felület.
 */
async function bizonylatot(oldalObjektum, sor, cimke) {
  const torles = sor.getByText("Törlöm");
  if ((await torles.count()) > 0) {
    await torles.first().click();
    await oldalObjektum.waitForLoadState("networkidle");
  }
  all(
    (await sor.getByText("Ezt tőled várjuk").count()) > 0,
    `${cimke}: a felület a saját oldali bizonylatot tőle várja`,
  );
  await sor
    .locator('input[type="file"]')
    .setInputFiles({ name: "bizonylat.png", mimeType: "image/png", buffer: KEP });
  await sor.getByRole("button", { name: "Feltöltöm" }).click();
  await sor.getByText("Törlöm").first().waitFor({ timeout: 15000 });
}

export const nev = "Kétoldali befizetés-egyeztetés";

/** A mai hónap időszaka, hogy a próba ne évüljön el. */
function haviIdoszak(most) {
  return `${most.getUTCFullYear()}-${String(most.getUTCMonth() + 1).padStart(2, "0")}`;
}

const IDOSZAK = haviIdoszak(new Date());
const DIJ = "180 000 Ft";
const DIJ_FT = 180000;

/**
 * A vizsgált hónap bérleti díjának sora.
 *
 * A kártya `data-idoszak` és `data-osszeg` jelzőin keresünk, nem a képernyőn
 * látható szövegen. Korábban az utóbbi volt, és három dolog is elvitte: a
 * hasábcímkék átfogalmazása, a hónap emberi alakja („2026. szeptember” a
 * „2026-09” helyett), és hogy a rendezett tétel rövid sort kap, amin nincsenek
 * hasábok. A jelző viszont nyelv- és megjelenésfüggetlen, ugyanúgy, ahogy a
 * bizonylatblokk `data-oldal`-ja.
 */
function sorA(oldal) {
  return oldal.locator(`li[data-idoszak="${IDOSZAK}"][data-osszeg="${DIJ_FT}"]`).first();
}

/** Ha van rögzített adat, visszavonja. Így ismert helyzetből indulunk. */
async function kiurit(oldal, cimke) {
  const gomb = sorA(oldal).getByText(cimke);
  if ((await gomb.count()) > 0) {
    await gomb.first().click();
    await oldal.waitForLoadState("networkidle");
    await oldal.reload();
    // Az újratöltés a beszúrt stíluslapot is eldobja: nélküle a rendezett
    // tételek megint csukva lennének.
    await mindetKinyit(oldal);
  }
}

export async function futtat(oldal) {
  // --- Bérbeadó: a kivonatfeltöltésnek nyoma sincs, és kiürítjük a saját oldalt
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/befizetesek`);
  await mindetKinyit(oldal);

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
  await mindetKinyit(oldal);
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
  await mindetKinyit(oldal);
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
  await mindetKinyit(oldal);
  const berbeadoiSor = sorA(oldal);
  await berbeadoiSor.getByText("Megérkezett? Rögzítem").click();
  await berbeadoiSor.locator('input[name="osszegFt"]').fill("150000");
  await berbeadoiSor.getByRole("button", { name: "Rögzítem" }).click();
  await berbeadoiSor
    .getByText("Ezt tévedésből rögzítettem")
    .first()
    .waitFor({ timeout: 15000 });

  await oldal.goto(`${ALAP}/befizetesek`);
  await mindetKinyit(oldal);
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

  // --- Bizonylat: csak itt kérjük, és mindkét fél a saját oldalit adja
  all(
    (await vitasSor.getByText("Bizonylat ehhez az utaláshoz").count()) > 0,
    "vitás tételnél megjelenik a bizonylatblokk",
  );
  all(
    (await vitasSor.getByText(/Teljes bankszámlakivonatot nem kérünk, és nem is fogadunk el/).count()) > 0,
    "a feltöltő űrlap is kimondja, hogy kivonatot nem fogadunk el",
  );
  await bizonylatot(oldal, vitasSor, "bérbeadó");

  await oldal.goto(`${ALAP}/befizetesek`);
  await mindetKinyit(oldal);
  all(
    (await sorA(oldal).locator('[data-oldal="fogado"] a').count()) > 0,
    "a feltöltött bizonylat megjelenik a feltöltőnél",
  );

  // --- A bérlő látja a bérbeadóét, és feltölti a sajátját
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo`);
  await mindetKinyit(oldal);
  const berloiVitas = sorA(oldal);
  all(
    (await berloiVitas.locator('[data-oldal="fogado"] a').count()) > 0,
    "a bérlő látja a bérbeadó bizonylatát",
  );

  const hivatkozas = await berloiVitas
    .locator('[data-oldal="fogado"] a')
    .first()
    .getAttribute("href");
  const letoltes = await oldal.request.get(`${ALAP}${hivatkozas}`);
  all(letoltes.status() === 200, "a bizonylat letölthető annak, akinek köze van hozzá");
  all(
    (letoltes.headers()["content-disposition"] ?? "").includes("bizonylat-fogado.png"),
    "a letöltés nem a feltöltött fájlnevet adja vissza",
  );

  await bizonylatot(oldal, berloiVitas, "bérlő");
  await oldal.goto(`${ALAP}/berlo`);
  await mindetKinyit(oldal);
  all(
    (await sorA(oldal).locator('[data-oldal] a').count()) === 2,
    "mindkét oldal bizonylata látszik, ha mindkettő feltöltötte",
  );

  // Belépés nélkül a bizonylat nem érhető el, akkor sem, ha valaki ismeri a
  // hivatkozást: a jogosultság a jogviszonyból jön, nem az azonosítóból.
  await kilep(oldal);
  const idegen = await oldal.request.get(`${ALAP}${hivatkozas}`);
  all(idegen.status() === 403, "belépés nélkül a bizonylat nem tölthető le");

  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  // --- A bizonylatkérés kapcsolható: a bérbeadó dönti el
  await oldal.goto(`${ALAP}/beallitasok`);
  const kapcsolo = oldal.locator('input[name="bizonylatKeres"]');
  all((await kapcsolo.isChecked()) === true, "a bizonylatkérés alapból be van kapcsolva");
  await kapcsolo.uncheck();
  await oldal.getByRole("button", { name: "Mentés" }).first().click();
  await oldal.getByText(/nem kérek bizonylatot/).first().waitFor({ timeout: 15000 });

  await oldal.goto(`${ALAP}/befizetesek`);
  await mindetKinyit(oldal);
  const kikapcsolt = sorA(oldal);
  all(
    (await kikapcsolt.getByText("vitás").count()) > 0,
    "kikapcsolt bizonylatkérésnél a tétel vitás marad",
  );
  all(
    (await kikapcsolt.locator('input[type="file"]').count()) === 0,
    "kikapcsolva nem kérünk új bizonylatot",
  );
  all(
    (await kikapcsolt.locator('[data-oldal] a').count()) === 2,
    "a már feltöltött bizonylatok a kikapcsolástól nem tűnnek el",
  );

  // Vissza, hogy a próba a talált állapotot hagyja maga után.
  await oldal.goto(`${ALAP}/beallitasok`);
  await oldal.locator('input[name="bizonylatKeres"]').check();
  await oldal.getByRole("button", { name: "Mentés" }).first().click();
  await oldal.getByText(/bizonylatot kérek mindkét féltől/).first().waitFor({ timeout: 15000 });

  // --- Egyezésre hozva: a vita és a bizonylatkérés eltűnik
  await oldal.goto(`${ALAP}/befizetesek`);
  await mindetKinyit(oldal);
  await kiurit(oldal, "Ezt tévedésből rögzítettem");
  const ujraSor = sorA(oldal);
  await ujraSor.getByText("Megérkezett? Rögzítem").click();
  await ujraSor.locator('input[name="osszegFt"]').fill("180000");
  await ujraSor.getByRole("button", { name: "Rögzítem" }).click();
  await ujraSor.getByText("Ezt tévedésből rögzítettem").first().waitFor({ timeout: 15000 });

  await oldal.goto(`${ALAP}/befizetesek`);
  await mindetKinyit(oldal);
  const kesz = sorA(oldal);
  all((await kesz.getByText("egyezik").count()) > 0, "egyező adatnál a tétel lezárul");
  all(
    (await kesz.getByText(/A két oldal nem egyezik/).count()) === 0,
    "egyezésnél nem kérünk bizonylatot",
  );
  all(
    (await kesz.locator('input[type="file"]').count()) === 0,
    "egyezésnél új bizonylatot sem kérünk",
  );
  all(
    (await kesz.locator('[data-oldal] a').count()) === 2,
    "a korábban feltöltött bizonylatok a rendezés után is megmaradnak",
  );

  // --- A próba elpakol maga után: a saját bizonylatát mindenki törölheti
  await kesz.getByText("Törlöm").first().click();
  await oldal.waitForLoadState("networkidle");
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo`);
  await mindetKinyit(oldal);
  const berloiKesz = sorA(oldal);
  if ((await berloiKesz.getByText("Törlöm").count()) > 0) {
    await berloiKesz.getByText("Törlöm").first().click();
    await oldal.waitForLoadState("networkidle");
  }
}
