/**
 * Bérbeadói igazolás: melyik befizetésről szólhat, és tényleg kiállítható-e.
 *
 * A kiállítás kiszolgálói művelet, és az űrlapja azonosítót küld, nem hónapot:
 * ez a fajta hiba sem a típusellenőrzésen, sem a fordításon nem akad fenn — egy
 * átnevezett mezőnév csak futtatáskor derül ki.
 */

import { ALAP, all, belep, magyarra, mindetKinyit, tullogas } from "./kozos.mjs";

export const nev = "Bérbeadói igazolás";

const JEL = String(Date.now()).slice(-6);

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  await oldal.goto(`${ALAP}/dokumentumok`);
  all((await tullogas(oldal)) <= 1, "a dokumentumtár elfér 360 képponton");
  await mindetKinyit(oldal);

  // A dokumentumtár az igazolást a bérlő nevével és az időszakkal írja ki, nem
  // a céllal, ezért a kiadott papírt a darabszámon mérjük.
  // Az azonosítókat számoljuk, nem a hivatkozásokat: ugyanaz az igazolás
  // több helyen is kirajzolódhat a lapon.
  const igazolasSor = async () => {
    const utak = await oldal.locator('a[href^="/igazolasok/"]').evaluateAll((elemek) =>
      elemek.map((elem) => elem.getAttribute("href")),
    );
    return new Set(utak).size;
  };

  // A mentést a **hatásán** mérjük: a lap újratöltve mutatja-e az új sort. És
  // a várakozás is újratöltés — a már betöltött DOM-ot hiába olvasnánk
  // újra és újra, az magától soha nem változna meg.
  const igazolasSorVarva = async (legalabb) => {
    let darab = 0;
    for (let proba = 0; proba < 10; proba += 1) {
      await oldal.goto(`${ALAP}/dokumentumok`);
      darab = await igazolasSor();
      if (darab >= legalabb) return darab;
      await oldal.waitForTimeout(500);
    }
    return darab;
  };
  const elotte = await igazolasSor();

  const urlap = oldal.locator('form:has(select[name="eloirtTetelId"])').first();
  all(
    (await urlap.count()) > 0,
    "az igazolás űrlapja az előírás azonosítójával dolgozik, nem a hónappal",
  );

  // Csak bérleti díj: ugyanarra a hónapra a közös költség és egy előfizetés
  // befizetése is igazolható volt, ugyanazzal a „bérletidíj-fizetés megtörtént"
  // mondattal. A választó felirata az összeget is kiírja, tehát azon látszik.
  const valaszto = urlap.locator('select[name="eloirtTetelId"]');
  const feliratok = await valaszto.locator("option").allInnerTexts();
  all(feliratok.length > 0, `van mit igazolni (${feliratok.length} sor)`);
  all(
    feliratok.every((felirat) => /180 000|126 000|Ft/.test(felirat)),
    "minden felírt sor összeget mutat",
  );
  all(
    !feliratok.some((felirat) => /14 000|6 490/.test(felirat)),
    "a közös költség és az előfizetés befizetése nem igazolható",
  );

  // --- Kiállítás
  const elsoErtek = await valaszto.locator("option").first().getAttribute("value");
  await valaszto.selectOption(elsoErtek);
  await urlap.locator('input[name="cel"]').fill(`Ösztöndíjhoz ${JEL}`);
  await urlap.locator('input[name="kiallitasHelye"]').fill("Budapest");
  await urlap.getByRole("button", { name: /^Igazolás / }).click();

  all(
    await oldal
      .getByText(/Igazolás kiállítva|kiállítva/)
      .first()
      .waitFor({ timeout: 15000 })
      .then(() => true, () => false),
    "önpróba: az igazolás kiállítható",
  );

  const utana = await igazolasSorVarva(elotte + 1);
  all(
    utana === elotte + 1,
    `a kiállított igazolás megjelenik a dokumentumtárban (${elotte} → ${utana})`,
  );

  // --- A véglegesített szerződés nem állítható vissza tervezetre, ha
  // igazolás hivatkozik rá: a kiadott papír a szerződés keltét idézi.
  await oldal.goto(`${ALAP}/szerzodesek`);
  const veglegesLink = oldal.locator('a[href^="/szerzodesek/"]').first();
  if ((await veglegesLink.count()) > 0) {
    await veglegesLink.click();
    await oldal.waitForLoadState("networkidle");
    const vissza = oldal.getByRole("button", { name: "Vissza tervezetre" });
    if ((await vissza.count()) > 0) {
      await vissza.first().click();
      all(
        await oldal
          .getByText(/Nem állítható vissza tervezetre/)
          .first()
          .waitFor({ timeout: 15000 })
          .then(() => true, () => false),
        "a kiadott igazolás után a véglegesítés nem vonható vissza",
      );
    }
  }
}
