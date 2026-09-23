/**
 * Az üzemeltetői lap: összesítő számok, rendszerállapot, fióktiltás, napló.
 *
 * Amit ez a próba megfog, és más nem:
 *
 *  - A **letiltás tényleg letilt**. Nem az a kérdés, hogy eltűnik-e a gomb,
 *    hanem hogy a letiltott fiók belépője elutasít-e, és hogy a már megnyitott
 *    munkamenete megszűnik-e. Utóbbi külön eset: a süti harminc napig él, és
 *    ha csak a belépőlapot védenénk, a letiltott fiók zavartalanul dolgozna
 *    tovább — épp az, akitől az üzemeltető elvette a hozzáférést.
 *  - **Magát senki nem tilthatja le.** Ezt a kiszolgáló dönti el, ezért a
 *    próba nem a gomb hiányát nézi, hanem egy valódi űrlapot küld be hazudott
 *    azonosítóval. Nyers `fetch` nem lenne jó: egy kiszolgálói művelet az
 *    útvonalon kívülről érkező hívást amúgy is elutasítja, tehát a próba a
 *    javítás nélkül is zöld maradna.
 *  - A **napló** megőrzi, mi történt.
 *
 * A próba visszaengedi, amit letiltott: utána még futnak próbák, és nekik
 * ugyanaz a kiindulóhelyzet kell.
 */

import { ALAP, all, belep, JELSZO, kilep, magyarra, tullogas } from "./kozos.mjs";

export const nev = "Üzemeltetői lap";

const LAP = "/rendszergazda";
/** A példaadat bérlője. A nevét a névsor írja ki, a címével lép be. */
const CEL_NEV = "Kovács Anna";
const CEL_EMAIL = "anna@pelda.hu";

async function lapra(oldal, ut) {
  await oldal.goto(`${ALAP}${ut}`);
  await oldal.waitForLoadState("networkidle");
}

/** A névsor egy sora azonosító szerint: a felirat kétnyelvű, az azonosító nem. */
function fioksor(oldal, felhasznaloId) {
  return oldal.locator(`li[data-fiok="${felhasznaloId}"]`);
}

async function gombotNyom(oldal, felhasznaloId, muvelet) {
  const sor = fioksor(oldal, felhasznaloId);
  await sor.locator(`button[data-fiokmuvelet="${muvelet}"]`).click();
  await sor.locator('[data-uzenet]').first().waitFor({ timeout: 15000 });
  return sor.locator('[data-uzenet]').first().getAttribute("data-uzenet");
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await lapra(oldal, LAP);

  // ——— Számok és rendszerállapot ———
  const forras = await oldal.content();
  all(
    (await oldal.locator('[data-szakasz="rendszerallapot"]').count()) > 0,
    "a rendszerállapot szakasza ott van",
  );
  all(/\d+ ms/.test(forras), "az adatbázis válaszideje ki van írva");
  // A próba `npm run start`-tal fut, tehát éles környezetet lát; fejlesztői
  // kiszolgálón a másik érték áll ott. Az a kérdés, hogy ki van-e írva.
  all(
    forras.includes("Éles") || forras.includes("Fejlesztői"),
    "a futó környezet is ki van írva",
  );
  all(!(await tullogas(oldal)), "az üzemeltetői lap nem lóg ki 360 képponton");

  // ——— A saját sor és a cél sor ———
  const sajatSor = oldal
    .locator("li[data-fiok]")
    .filter({ has: oldal.locator('a[href="/bemutatkozas"]') })
    .first();
  const sajatId = await sajatSor.getAttribute("data-fiok");
  all(Boolean(sajatId), "a saját sor megtalálható a névsorban");
  all(
    (await sajatSor.locator("button[data-fiokmuvelet]").count()) === 0,
    "a saját fióknál nincs letiltó gomb",
  );

  const celSor = oldal
    .locator("li[data-fiok]")
    .filter({ hasText: CEL_NEV })
    .first();
  const celId = await celSor.getAttribute("data-fiok");
  all(Boolean(celId) && celId !== sajatId, `${CEL_NEV} sora megvan, és nem a sajátunk`);

  // ——— Magát senki nem tilthatja le ———
  // Egy valódi űrlapot íratunk át a sajátunkra, és tényleg beküldjük: a kérés
  // mindenben olyan, mint egy igazi kattintás, csak a rejtett mező hazudik.
  await celSor
    .locator('input[name="felhasznaloId"]')
    .evaluate((elem, ertek) => {
      elem.value = ertek;
    }, sajatId);
  const hazugValasz = await gombotNyom(oldal, celId, "letilt");
  all(hazugValasz === "hiba", "a kiszolgáló elutasítja a saját fiók letiltását");

  await lapra(oldal, LAP);
  all(
    (await fioksor(oldal, sajatId).getByText("Letiltva").count()) === 0,
    "és a saját fiók tényleg nem lett letiltva",
  );

  // ——— A cél fiók letiltása ———
  all(
    (await gombotNyom(oldal, celId, "letilt")) === "kesz",
    "önpróba: a letiltás átmegy",
  );
  await lapra(oldal, LAP);
  all(
    (await fioksor(oldal, celId).getByText("Letiltva").count()) > 0,
    "a letiltott fiók jelölve van a névsorban",
  );
  all(
    (await oldal.locator('[data-naplo="lista"] li').count()) > 0,
    "a napló megőrzi, mi történt",
  );

  // ——— A letiltott fiók nem tud belépni ———
  await kilep(oldal);
  await oldal.fill('input[name="email"]', CEL_EMAIL);
  await oldal.fill('input[name="jelszo"]', JELSZO);
  await oldal.getByRole("button", { name: /Belépés|Sign in/ }).click();
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.locator('input[name="jelszo"]').count()) > 0,
    "a letiltott fiók nem tud belépni",
  );

  // ——— A már megnyitott munkamenet sem él tovább ———
  // Visszaengedjük, belépünk vele, és egy másik böngészőmenetből — az
  // üzemeltetőéből — tiltjuk le, miközben a bérlő lapja nyitva van.
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await lapra(oldal, LAP);
  all(
    (await gombotNyom(oldal, celId, "visszaenged")) === "kesz",
    "önpróba: a visszaengedés átmegy",
  );

  await belep(oldal, CEL_EMAIL);
  const berloLap = await oldal.goto(`${ALAP}/berlo`);
  all(berloLap.status() === 200, "kiindulás: a visszaengedett fiók újra bejut");

  const kontextus = await oldal
    .context()
    .browser()
    .newContext({ viewport: { width: 360, height: 844 } });
  const adminLap = await kontextus.newPage();
  await belep(adminLap, "berbeado@pelda.hu");
  await magyarra(adminLap);
  await lapra(adminLap, LAP);
  all(
    (await gombotNyom(adminLap, celId, "letilt")) === "kesz",
    "az üzemeltető letiltja a fiókot, miközben annak a lapja nyitva van",
  );

  await oldal.goto(`${ALAP}/berlo`);
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.locator('input[name="jelszo"]').count()) > 0,
    "a letiltás a már megnyitott munkamenetet is megszünteti",
  );

  // ——— Visszaengedjük, hogy a következő próbák ugyanonnan induljanak ———
  await lapra(adminLap, LAP);
  all(
    (await gombotNyom(adminLap, celId, "visszaenged")) === "kesz",
    "a fiók visszaengedhető",
  );
  await lapra(adminLap, LAP);
  all(
    (await fioksor(adminLap, celId).getByText("Letiltva").count()) === 0,
    "és a jelölése is eltűnik",
  );
  await kontextus.close();
}
