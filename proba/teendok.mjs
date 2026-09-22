/**
 * Teendők, naptár és a hétsáv.
 *
 * Amit ez a próba megfog, és más nem: a saját teendő végigmegy a felvételtől a
 * lezárásig és a visszavonásig, a naptár napja tényleg arra az egy napra szűkít,
 * és a másik fél teendője nem látszik át. A jogosultságot a kiszolgáló dönti
 * el, nem az űrlap — ez pedig csak futtatva derül ki.
 *
 * A próba minden futáskor új teendőt vesz fel, egyedi címmel. Ez rendben van: a
 * lezárt teendők összecsukva állnak, és a lap hosszát a méretpróba méri.
 */

import { ALAP, all, belep, magyarra, mindetKinyit, tullogas } from "./kozos.mjs";

export const nev = "Teendők és naptár";

/** "ÉÉÉÉ-HH-NN" a mai naphoz képest eltolva, UTC szerint. */
function napot(elteres) {
  const most = new Date();
  const nap = new Date(
    Date.UTC(most.getUTCFullYear(), most.getUTCMonth(), most.getUTCDate() + elteres),
  );
  return nap.toISOString().slice(0, 10);
}

async function urlapotKinyit(oldal) {
  const szakasz = oldal.locator("details").filter({ hasText: "Új teendő" }).first();
  await szakasz.locator("summary").first().click();
  return szakasz;
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  // --- A nyitólap hétsávja
  await oldal.goto(`${ALAP}/`);
  await oldal.waitForLoadState("networkidle");

  const hetsav = oldal.locator("section").filter({ hasText: "A következő hét nap" }).first();
  all((await hetsav.count()) > 0, "a nyitólapon ott a következő hét nap sávja");

  // Hét cella, se több, se kevesebb: nyolcadik nap már törne a sorban, és egy
  // két sorba tört hétsáv nem sáv.
  const hetsavCellak = hetsav.locator("div.grid.grid-cols-7 > *");
  all(
    (await hetsavCellak.count()) === 7,
    `a hétsávban hét nap van (${await hetsavCellak.count()})`,
  );

  // --- A teendők lapja
  await oldal.goto(`${ALAP}/teendok`);
  await oldal.waitForLoadState("networkidle");
  all((await tullogas(oldal)) <= 1, "a teendők lapja elfér 360 képponton");

  const naptar = oldal.locator("section").filter({ has: oldal.locator("div.grid-cols-7") }).first();
  all((await naptar.count()) > 0, "a teendők lapján van naptárrács");

  // A rács teljes hetekből áll: a napok száma mindig hét többszöröse, a
  // fejléccel együtt. Ha a rács elcsúszna, ez azonnal látszana.
  const racsCellak = await naptar.locator("div.grid-cols-7 > *").count();
  all(
    racsCellak % 7 === 0 && racsCellak >= 42,
    `a naptárrács teljes hetekből áll (${racsCellak} cella a fejléccel együtt)`,
  );

  // A példaadat kéményseprős teendője: a naptárban legyen megnyitható nap.
  const napHivatkozasok = naptar.locator('a[href*="nap="]');
  all(
    (await napHivatkozasok.count()) > 0,
    `a teendős napok megnyithatók a naptárból (${await napHivatkozasok.count()} nap)`,
  );

  // --- Saját teendő felvétele
  const cim = `Próbateendő ${Date.now()}`;
  const hatarido = napot(2);

  const urlap = await urlapotKinyit(oldal);

  // Önpróba: az elutasított mentés nem viheti el a begépelt szöveget. A címet
  // szándékosan üresen hagyjuk, a részleteket kitöltjük.
  await urlap.locator('textarea[name="leiras"]').fill("Ezt a szöveget meg kell tartani.");
  await urlap.getByRole("button", { name: "Felveszem" }).click();
  await oldal.waitForTimeout(800);
  all(
    (await oldal.getByText("Írd le, mi a teendő.").count()) > 0,
    "cím nélkül a kiszolgáló elutasítja a teendőt",
  );
  all(
    (await urlap.locator('textarea[name="leiras"]').inputValue()) ===
      "Ezt a szöveget meg kell tartani.",
    "az elutasított mentés nem viszi el a begépelt részleteket",
  );

  await urlap.locator('input[name="cim"]').fill(cim);
  await urlap.locator('input[name="esedekesseg"]').fill(hatarido);
  await urlap.getByRole("button", { name: "Felveszem" }).click();
  await oldal.waitForTimeout(1000);
  all((await oldal.getByText("Felvéve.").count()) > 0, "a teendő felvétele sikerül");

  await oldal.goto(`${ALAP}/teendok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all((await oldal.getByText(cim).count()) > 0, "a felvett teendő megjelenik a listán");

  // --- A naptár napja tényleg szűkít
  await oldal.goto(`${ALAP}/teendok?nap=${hatarido}`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all((await oldal.getByText(cim).count()) > 0, "a nap kiválasztva is mutatja a teendőt");
  all(
    (await oldal.getByText("Lakásbiztosítás évfordulója").count()) === 0,
    "a napra szűkített lista nem hozza a többi nap teendőjét",
  );

  // Önpróba a szűrésre: egy teendő nélküli napon üres állapot áll, nem a teljes
  // lista. Enélkül nem lehetne tudni, hogy a szűrés tényleg szűr.
  await oldal.goto(`${ALAP}/teendok?nap=${napot(400)}`);
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.getByText("Erre a napra nincs teendő.").count()) > 0,
    "teendő nélküli napon üres állapot áll",
  );
  all(
    (await oldal.getByText(cim).count()) === 0,
    "a teendő nélküli nap nem hozza elő a többi teendőt",
  );

  // --- Lezárás és a lezárás visszavonása
  await oldal.goto(`${ALAP}/teendok?nap=${hatarido}`);
  await oldal.waitForLoadState("networkidle");
  const kartya = oldal.locator("li").filter({ hasText: cim }).first();
  await kartya.getByRole("button", { name: "Kész" }).click();
  await oldal.waitForTimeout(1000);

  await oldal.goto(`${ALAP}/teendok`);
  await oldal.waitForLoadState("networkidle");
  const lezartSzakasz = oldal.locator("details").filter({ hasText: "Lezárt" }).first();
  await lezartSzakasz.locator("summary").first().click();
  all(
    (await lezartSzakasz.getByText(cim).count()) > 0,
    "a lezárt teendő a lezártak közé kerül",
  );

  await lezartSzakasz
    .locator("li")
    .filter({ hasText: cim })
    .first()
    .getByRole("button", { name: "Mégis nyitott" })
    .click();
  await oldal.waitForTimeout(1000);

  await oldal.goto(`${ALAP}/teendok?nap=${hatarido}`);
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.locator("li").filter({ hasText: cim }).count()) > 0,
    "a lezárás visszavonható, a teendő visszakerül a nyitottak közé",
  );

  // --- A másik fél teendője nem látszik át
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo/teendok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  all((await tullogas(oldal)) <= 1, "a bérlő teendőlapja is elfér 360 képponton");
  all(
    (await oldal.getByText("Postaláda kulcsát pótolni").count()) > 0,
    "a bérlő a saját teendőjét látja",
  );
  all(
    (await oldal.getByText(cim).count()) === 0,
    "a bérbeadó saját teendője nem látszik át a bérlőhöz",
  );
  all(
    (await oldal.getByText("Lakásbiztosítás évfordulója").count()) === 0,
    "a bérbeadó másik teendője sem látszik át",
  );
}
