/**
 * Szolgáltatói látogatás.
 *
 * Amit ez a próba megfog, és más nem: a bérlő nyilatkozata tényleg átmegy a
 * bérbeadó oldalára, a kifogás indoklás nélkül nem megy át, és a lemondás nem
 * törli a látogatást. A kétoldali elv így mérhető: a bérbeadó nem tudja a
 * bérlő helyett kimondani, hogy bejut a szerelő.
 *
 * A legveszélyesebb hiba az lenne, ha a lap azt írná ki, „rendben, bejut", pedig
 * a bérlő még nem nyilatkozott — ezért van rá önpróba egy friss bejelentésen.
 */

import { ALAP, all, belep, magyarra, mindetKinyit, tullogas } from "./kozos.mjs";

export const nev = "Szolgáltatói látogatás";

function napot(elteres) {
  const most = new Date();
  const nap = new Date(
    Date.UTC(most.getUTCFullYear(), most.getUTCMonth(), most.getUTCDate() + elteres),
  );
  return nap.toISOString().slice(0, 10);
}

async function bejelentestKinyit(oldal) {
  const szakasz = oldal.locator("details").filter({ hasText: "Új látogatás" }).first();
  await szakasz.locator("summary").first().click();
  return szakasz;
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  await oldal.goto(`${ALAP}/latogatasok`);
  await oldal.waitForLoadState("networkidle");
  all((await tullogas(oldal)) <= 1, "a látogatások lapja elfér 360 képponton");

  // A példaadat két látogatása: az egyikre a bérlő már nyilatkozott.
  all(
    (await oldal.getByText("Éves kéményellenőrzés").count()) > 0,
    "a bejelentett látogatás megjelenik a bérbeadónál",
  );
  all(
    (await oldal.getByText(/itthon lesz, és beengedi/).count()) > 0,
    "a bérlő nyilatkozata átjön a bérbeadó oldalára",
  );

  // --- Új bejelentés
  const megnevezes = `Próbalátogatás ${Date.now()}`;
  const urlap = await bejelentestKinyit(oldal);

  // Önpróba: az elutasított mentés nem viheti el a begépelt adatot, és a
  // visszafelé menő időablakot a kiszolgáló fogja meg, nem az űrlap.
  await urlap.locator('input[name="megnevezes"]').fill(megnevezes);
  await urlap.locator('input[name="nap"]').fill(napot(6));
  await urlap.locator('input[name="idoablakTol"]').fill("11:00");
  await urlap.locator('input[name="idoablakIg"]').fill("9:00");
  await urlap.getByRole("button", { name: "Bejelentem" }).click();
  await oldal.waitForTimeout(800);
  all(
    (await oldal.getByText("Az időablak vége nem lehet a kezdete előtt.").count()) > 0,
    "a visszafelé menő időablakot a kiszolgáló elutasítja",
  );
  all(
    (await urlap.locator('input[name="megnevezes"]').inputValue()) === megnevezes,
    "az elutasított bejelentés nem viszi el a begépelt megnevezést",
  );

  await urlap.locator('input[name="idoablakIg"]').fill("13:00");
  await urlap.getByRole("button", { name: "Bejelentem" }).click();
  await oldal.waitForTimeout(1000);
  all((await oldal.getByText("Bejelentve.").count()) > 0, "a bejelentés sikerül");

  await oldal.goto(`${ALAP}/latogatasok`);
  await oldal.waitForLoadState("networkidle");
  const kartya = oldal.locator("li").filter({ hasText: megnevezes }).first();
  all((await kartya.count()) > 0, "az új látogatás megjelenik a listán");
  all(
    (await kartya.getByText(/nem nyilatkozott/).count()) > 0,
    "a friss bejelentésnél a lap kimondja, hogy még nem tudjuk, ki engedi be",
  );

  // A bérbeadó nem nyilatkozhat a bérlő helyett: nála nincs válaszűrlap.
  all(
    (await kartya.locator('input[name="valasz"]').count()) === 0,
    "a bérbeadó nem tud a bérlő helyett nyilatkozni",
  );

  // --- A bérlő nyilatkozik
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo/latogatasok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all((await tullogas(oldal)) <= 1, "a bérlő látogatáslapja is elfér 360 képponton");

  const berloiKartya = oldal.locator("li").filter({ hasText: megnevezes }).first();

  // Kifogás indoklás nélkül nem megy át: abból a bérbeadó nem tud kiindulni.
  await berloiKartya.locator('input[value="nem_jo_idopont"]').check();
  await berloiKartya.getByRole("button", { name: "Ezt válaszolom" }).click();
  await oldal.waitForTimeout(900);
  all(
    (await oldal.getByText("Írd le, miért nem jó az időpont.").count()) > 0,
    "a kifogás indoklás nélkül nem megy át",
  );

  const ujraKartya = oldal.locator("li").filter({ hasText: megnevezes }).first();
  await ujraKartya.locator('textarea[name="indoklas"]').fill("Aznap dolgozom, nem tudok itthon lenni.");
  await ujraKartya.getByRole("button", { name: "Ezt válaszolom" }).click();
  await oldal.waitForTimeout(1000);
  all((await oldal.getByText("Elküldve.").count()) > 0, "az indokolt kifogás átmegy");

  // --- A kifogás megjelenik a bérbeadónál, indoklással együtt
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/latogatasok`);
  await oldal.waitForLoadState("networkidle");
  const kifogasolt = oldal.locator("li").filter({ hasText: megnevezes }).first();
  all(
    (await kifogasolt.getByText(/nem jó ez az időpont/i).count()) > 0,
    "a kifogás átjön a bérbeadó oldalára",
  );
  all(
    (await kifogasolt.getByText("Aznap dolgozom, nem tudok itthon lenni.").count()) > 0,
    "az indoklás is átjön, nem csak az, hogy kifogásolt",
  );

  // --- Lemondás: ok nélkül nem megy, és nem törli a látogatást
  const lemondas = kifogasolt.locator("details").first();
  await lemondas.locator("summary").first().click();
  await lemondas.getByRole("button", { name: "Lemondom" }).click();
  await oldal.waitForTimeout(900);
  all(
    (await oldal.getByText("Írd le, miért marad el.").count()) > 0,
    "a lemondás ok nélkül nem megy át",
  );

  const ujraLemondas = oldal
    .locator("li")
    .filter({ hasText: megnevezes })
    .first()
    .locator("details")
    .first();
  await ujraLemondas.locator('input[name="oka"]').fill("A szolgáltató új időpontot ad.");
  await ujraLemondas.getByRole("button", { name: "Lemondom" }).click();
  await oldal.waitForTimeout(1000);
  all((await oldal.getByText("Lemondva.").count()) > 0, "a lemondás sikerül");

  await oldal.goto(`${ALAP}/latogatasok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all(
    (await oldal.getByText(megnevezes).count()) > 0,
    "a lemondás nem törli a látogatást, csak lemondottá teszi",
  );
  all(
    (await oldal.getByText("A szolgáltató új időpontot ad.").count()) > 0,
    "a lemondás oka is látszik, hogy a bérlő tudja, nem kell itthon lennie",
  );
}
