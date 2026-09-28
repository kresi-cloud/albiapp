/**
 * Mérőóra és díjszabás felvitele.
 *
 * Amit ez a próba megfog, és más nem: a bérbeadó a felületről tud mérőórát és
 * díjszabást felvenni, és az új mérőóra tényleg megjelenik a rezsilapon is.
 * Eddig mindkettőt csak a példaadat hozta létre — új bérleményen az almérős
 * rezsielszámolás el sem indult volna, és erre semmi nem szólt: a lap kiírta,
 * hogy „nincs mérőóra felvéve", és ott is hagyta a bérbeadót.
 *
 * A kiszolgálói szabályokat hazudott mezőkkel próbáljuk ki, nem a gomb
 * elrejtésével: csatornadíj nem vízórára, és két díjszabás ugyanarra a napra.
 *
 * A próba a saját ingatlanát veszi fel, nem a példaadatét bővíti: a többi
 * próba a példaadat mérőóráira és elszámolásaira épül.
 */

import { ALAP, all, belep, magyarra, tullogas } from "./kozos.mjs";

export const nev = "Mérőóra felvitele";

const BERLEMENY = "Próbamérő lakás";

/**
 * Beküldés, és várakozás a **hatására**.
 *
 * A POST válasza előbb megjön, mint ahogy a React kirajzolja az új lapot: a
 * hálózat csendjére vagy a válaszra várva a próba még a régi lapot olvasná. A
 * visszajelző sáv viszont pontosan akkor kerül a lapra, amikor a művelet
 * eredménye megvan, ezért arra várunk — és vissza is adjuk, mit mondott
 * (`kesz` vagy `hiba`), hogy a hívó ne a feliratra szűrjön.
 */
async function bekuld(oldal, urlap, gombNeve) {
  const valasz = oldal.waitForResponse(
    (v) => v.request().method() === "POST" && v.url().includes("/ingatlanok"),
  );
  await urlap.getByRole("button", { name: gombNeve }).click();
  await valasz;
  const sav = urlap.locator("[data-uzenet]").first();
  await sav.waitFor({ state: "attached", timeout: 20000 });
  await oldal.waitForLoadState("networkidle");
  return sav.getAttribute("data-uzenet");
}

/** A bérlemény kártyája a listán, frissen lekérdezve. */
function kartyaja(oldal, nev) {
  return oldal.locator("li").filter({ hasText: nev }).first();
}

/** Kinyit egy összecsukható szakaszt, ha épp csukva áll. */
async function kinyit(szakasz) {
  if (!(await szakasz.evaluate((elem) => elem.open))) {
    await szakasz.locator("summary").first().click();
  }
}

/**
 * Újratölti a lapot, és kinyitja a bérlemény mérőórás szakaszát.
 *
 * A szakasz magától becsukódik, amint minden mérőórának van díjszabása — ez a
 * termék viselkedése, nem a próba kényelme —, a benne ülő elemek pedig csukva
 * nem kattinthatók.
 */
async function merooraknal(oldal) {
  await oldal.goto(`${ALAP}/ingatlanok`);
  await oldal.waitForLoadState("networkidle");
  const szakasz = kartyaja(oldal, BERLEMENY)
    .locator('details[data-szakasz="meroorak"]')
    .first();
  await kinyit(szakasz);
  return szakasz;
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  await oldal.goto(`${ALAP}/ingatlanok`);
  await oldal.waitForLoadState("networkidle");

  // Saját bérlemény, hogy a többi próba példaadata érintetlen maradjon. A
  // felvitel csukva áll, amint van már bérlemény: előbb ki kell nyitni.
  const ujBerlemeny = oldal
    .locator("details")
    .filter({ has: oldal.locator('button:text("Bérlemény felvétele")') })
    .first();
  await kinyit(ujBerlemeny);
  const ingatlanUrlap = ujBerlemeny.locator("form").first();
  all(await ingatlanUrlap.isVisible(), "van űrlap bérlemény felvételéhez");
  await ingatlanUrlap.getByLabel(/^Név/).fill(BERLEMENY);
  await ingatlanUrlap.getByLabel(/^Cím/).fill("1111 Budapest, Próba utca 1.");
  all(
    (await bekuld(oldal, ingatlanUrlap, "Bérlemény felvétele")) === "kesz",
    "a bérlemény elmentődött",
  );

  await oldal.goto(`${ALAP}/ingatlanok`);
  await oldal.waitForLoadState("networkidle");
  all(await kartyaja(oldal, BERLEMENY).isVisible(), "a bérlemény megjelenik a listán");

  // A mérőórás szakasz mérőóra nélküli bérleményen nyitva áll: enélkül az
  // almérős rezsielszámolás el sem indulna, és a bérbeadó nem is tudná, hol.
  const szakasz = kartyaja(oldal, BERLEMENY)
    .locator('details[data-szakasz="meroorak"]')
    .first();
  all(
    await szakasz.evaluate((elem) => elem.open),
    "az első mérőóra előtt a szakasz nyitva áll",
  );

  const merooraUrlap = szakasz.locator('form:has(button:text("Mérőóra felvétele"))').first();
  await merooraUrlap.getByLabel(/^Mit mér/).selectOption("viz");
  await merooraUrlap.getByLabel(/^Mértékegység/).selectOption("m3");
  await merooraUrlap.getByLabel("Gyári szám", { exact: false }).fill("PROBA-1");
  all(
    (await bekuld(oldal, merooraUrlap, "Mérőóra felvétele")) === "kesz",
    "a vízóra felvétele sikerült",
  );

  const vizSzakasz = await merooraknal(oldal);
  const viz = vizSzakasz.locator("[data-meroora]").first();
  all(
    ((await viz.textContent()) ?? "").includes("PROBA-1"),
    "a mérőóra a gyári számával együtt megjelent",
  );

  // Díjszabás: a csatornadíj mezője vízórán elő is jön.
  const vizDij = viz.locator('details[data-szakasz="dijszabas"]').first();
  await kinyit(vizDij);
  const dijUrlap = vizDij.locator("form").first();
  all(
    await dijUrlap.getByLabel("Csatornadíj", { exact: false }).isVisible(),
    "vízórán van csatornadíj mező",
  );

  await dijUrlap.getByLabel(/^Érvényes ettől/).fill("2026-01-01");
  await dijUrlap.getByLabel("Kedvezményes ár", { exact: false }).fill("368,90");
  await dijUrlap.getByLabel("Piaci ár", { exact: false }).fill("700,10");
  await dijUrlap.getByLabel("Havi alapdíj", { exact: false }).fill("500");
  await dijUrlap.getByLabel("Csatornadíj", { exact: false }).fill("426,00");
  all(
    (await bekuld(oldal, dijUrlap, "Díjszabás felvétele")) === "kesz",
    "a díjszabás elmentődött",
  );

  const frissSzakasz = await merooraknal(oldal);
  const frissViz = frissSzakasz.locator("[data-meroora]").first();
  // `textContent`, nem `innerText`: a szakasz a díjszabás felvétele után
  // becsukódik, és a rejtett elem `innerText`-je üres — a próba nem azon
  // múlhat, hogy épp nyitva áll-e.
  all(
    ((await frissViz.textContent()) ?? "").includes("368,9"),
    "a beírt »368,90« a fillérekkel együtt maradt meg, nem kerekedett 369-re",
  );

  // Ugyanarra a napra nem megy második díjszabás: onnantól a sorrend döntené
  // el, melyik érvényes, és Postgresen az nincs garantálva.
  const ujraSzakasz = frissViz.locator('details[data-szakasz="dijszabas"]').first();
  await kinyit(ujraSzakasz);
  const ujraUrlap = ujraSzakasz.locator("form").first();
  await ujraUrlap.getByLabel(/^Érvényes ettől/).fill("2026-01-01");
  await ujraUrlap.getByLabel("Kedvezményes ár", { exact: false }).fill("400");
  await ujraUrlap.getByLabel("Piaci ár", { exact: false }).fill("800");
  await ujraUrlap.getByLabel("Havi alapdíj", { exact: false }).fill("0");
  all(
    (await bekuld(oldal, ujraUrlap, "Díjszabás felvétele")) === "hiba",
    "ugyanarra a napra nem megy második díjszabás",
  );

  // Villanyóra: ott csatornadíj mező nincs, és a kiszolgáló hazudott mezőre
  // sem fogad el egyet — a mért köbméter után jár az elvezetés, máshol nincs
  // mit elvezetni.
  const ujMeroora = kartyaja(oldal, BERLEMENY)
    .locator('details[data-szakasz="uj-meroora"]')
    .first();
  await kinyit(
    kartyaja(oldal, BERLEMENY).locator('details[data-szakasz="meroorak"]').first(),
  );
  await kinyit(ujMeroora);
  const villanyUrlap = ujMeroora.locator("form").first();
  await villanyUrlap.getByLabel(/^Mit mér/).selectOption("villany");
  await villanyUrlap.getByLabel(/^Mértékegység/).selectOption("kWh");
  all(
    (await bekuld(oldal, villanyUrlap, "Mérőóra felvétele")) === "kesz",
    "a villanyóra felvétele sikerült",
  );

  const villanySzakasz = await merooraknal(oldal);
  const villany = villanySzakasz
    .locator("[data-meroora]")
    .filter({ hasText: "Villany" })
    .first();
  const villanyDij = villany.locator('details[data-szakasz="dijszabas"]').first();
  await kinyit(villanyDij);
  const villanyDijUrlap = villanyDij.locator("form").first();
  all(
    (await villanyDijUrlap.getByLabel("Csatornadíj", { exact: false }).count()) === 0,
    "villanyórán nincs csatornadíj mező",
  );

  await villanyDijUrlap.evaluate((urlap) => {
    const mezo = document.createElement("input");
    mezo.name = "csatornaAr";
    mezo.value = "426";
    urlap.appendChild(mezo);
  });
  await villanyDijUrlap.getByLabel(/^Érvényes ettől/).fill("2026-01-01");
  await villanyDijUrlap.getByLabel("Kedvezményes ár", { exact: false }).fill("36,90");
  await villanyDijUrlap.getByLabel("Piaci ár", { exact: false }).fill("70,10");
  await villanyDijUrlap.getByLabel("Havi alapdíj", { exact: false }).fill("0");
  all(
    (await bekuld(oldal, villanyDijUrlap, "Díjszabás felvétele")) === "hiba",
    "a kiszolgáló hazudott mezőre sem fogad el villanyórára csatornadíjat",
  );

  all(
    (await tullogas(oldal)) <= 1,
    "az ingatlanok lapja a mérőórákkal is elfér 360 képponton",
  );
}
