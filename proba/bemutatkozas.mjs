/**
 * A bemutatkozó oldal és a rendszer saját értékelése.
 *
 * Amit ez a próba megfog, és más nem: a gépi értékelés **tényleg nincs ott** a
 * felhasználó saját lapjának forrásában, és a nem rendszergazda **tényleg nem
 * nyitja meg** más bemutatkozó oldalát. Mindkettő olyan ígéret, amit egy
 * elrejtett hivatkozás vagy egy elrejtő CSS-szabály némán elronthatna: a
 * szöveg ott állna a forrásban, csak nem látszana.
 *
 * A próba a lap teljes forrásában keres, nem a látható szövegben.
 *
 * Idempotens: a bemutatkozó szöveget felülírja, nem hozzáfűzi, tehát a
 * második futás ugyanoda ér.
 */

import { ALAP, all, belep, magyarra, tullogas } from "./kozos.mjs";

export const nev = "Bemutatkozó oldal";

/** A gépi értékelés lapfejléce. Ennek a felhasználó lapján nem szabad ott lennie. */
const GEPI_JEL = "A rendszer értékelése";
const SAJAT_SZOVEG = "Ezt a mondatot a böngészős próba írta a bemutatkozásba.";

async function forras(oldal) {
  return oldal.content();
}

async function all_(oldal, ut) {
  await oldal.goto(`${ALAP}${ut}`);
  await oldal.waitForLoadState("networkidle");
}

export async function futtat(oldal) {
  // ——— A bérbeadó, aki a példaadatban egyben az üzemeltető is ———
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  await all_(oldal, "/bemutatkozas");
  all(
    (await forras(oldal)).includes("Bemutatkozás"),
    "a saját bemutatkozó oldal megnyílik",
  );

  // Az űrlap tényleg ír: a mentés után a szövegnek ott kell lennie.
  const mezo = oldal.locator('textarea[name="bemutatkozas"]');
  all((await mezo.count()) > 0, "van bemutatkozó mező");
  await mezo.fill(SAJAT_SZOVEG);
  // A mentés válaszára várunk, nem a hálózat elcsendesedésére: a `networkidle`
  // visszatér azelőtt, hogy a kiszolgálói művelet lefutna, a következő `goto`
  // pedig elvágja a függőben lévő kérést — ilyenkor a mentés meg sem történik.
  // A visszajelző sávra sem várhatunk itt: a `revalidatePath` az űrlappal
  // együtt kicserélheti, mielőtt a próba ránézne.
  const mentesValasza = oldal.waitForResponse(
    (v) => v.url().includes("/bemutatkozas") && v.request().method() === "POST",
    { timeout: 15000 },
  );
  await oldal.getByRole("button", { name: /^(Mentés|Save)$/ }).click();
  await mentesValasza;
  await all_(oldal, "/bemutatkozas");
  all(
    (await forras(oldal)).includes(SAJAT_SZOVEG),
    "a mentett bemutatkozás megjelenik a lapon",
  );

  // ——— A gépi értékelés nem a felhasználóé ———
  all(
    !(await forras(oldal)).includes(GEPI_JEL),
    "a gépi értékelés NINCS ott a saját lap forrásában",
  );

  // ——— Önpróba: a fenti állítás csak akkor ér valamit, ha a keresett szöveget
  // a próba egyáltalán meg tudja találni ott, ahol ott van. ———
  await all_(oldal, "/rendszergazda");
  all(
    (await forras(oldal)).includes("Üzemeltetés"),
    "a rendszergazda lapja megnyílik a rendszergazdának",
  );

  // Névvel együtt gyűjtjük a hivatkozásokat: a jogosultsági próbához olyan lap
  // kell, ami **biztosan nem a próbázó felhasználóé** — a sajátjára ugyanis
  // átirányítunk, nem 404-et adunk, és abból a próba semmit nem tudna meg.
  const hivatkozasok = await oldal
    .locator('a[href^="/bemutatkozas/"]')
    .evaluateAll((elemek) =>
      elemek.map((elem) => ({
        ut: elem.getAttribute("href"),
        szoveg: elem.textContent ?? "",
      })),
    );
  all(hivatkozasok.length > 0, "a listából nyílnak más felhasználók lapjai");

  const eszter = hivatkozasok.find((sor) => sor.szoveg.includes("Tóth Eszter"));
  all(Boolean(eszter), "a listában ott van a korábbi bérlő lapja");
  const masikUt = eszter.ut;
  await all_(oldal, masikUt);
  const masikForras = await forras(oldal);
  all(
    masikForras.includes(GEPI_JEL),
    "önpróba: a gépi értékelés jele megtalálható ott, ahol ott van",
  );
  all(
    masikForras.includes("Értékelések"),
    "a rendszergazda a humán értékelést is látja ugyanazon a lapon",
  );
  all(
    /Pontosság|Válaszidő|Együttműködés/.test(masikForras),
    "a gépi értékelés mind a három szempontot kiírja",
  );
  all(
    /megfigyelésből|nincs elég adat/.test(masikForras),
    "minden gépi szám mellett ott a minta mérete vagy az, hogy nincs elég adat",
  );

  all(!(await tullogas(oldal)), "a rendszergazdai lap nem lóg ki 360 képponton");

  // ——— A nem rendszergazda nem nyitja meg más lapját ———
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);

  const valasz = await oldal.goto(`${ALAP}${masikUt}`);
  all(
    valasz.status() === 404,
    "a nem rendszergazda 404-et kap más bemutatkozó oldalára",
  );
  all(
    !(await forras(oldal)).includes(GEPI_JEL),
    "és a gépi értékelés a válaszban sincs benne",
  );

  const admin = await oldal.goto(`${ALAP}/rendszergazda`);
  all(admin.status() === 404, "a nem rendszergazda 404-et kap az üzemeltetői lapra");

  // A saját lapja viszont megvan neki is.
  await all_(oldal, "/bemutatkozas");
  all(
    (await forras(oldal)).includes("Bemutatkozás"),
    "a bérlő a saját bemutatkozó oldalát megnyitja",
  );
  all(
    !(await forras(oldal)).includes(GEPI_JEL),
    "a bérlő sem látja a gépi értékelést magáról",
  );
  all(!(await tullogas(oldal)), "a bemutatkozó oldal nem lóg ki 360 képponton");
}
