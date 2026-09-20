/**
 * Kétnyelvűség végigjátszva.
 *
 * A fordítás megléte a szótárteszt dolga; itt az az egy kérdés, hogy a
 * nyelvválasztás végigér-e a kiszolgálón: belépés előtt is, belépés után is, a
 * `lang` attribútumig, és nem szivárog-e ki nyers szótárkulcs a képernyőre.
 */

import { ALAP, all, belep, kilep, magyarra } from "./kozos.mjs";

export const nev = "Kétnyelvű felület";

export async function futtat(oldal) {
  // A nyelvválasztás a belépőlapon kezdődik, tehát előbb ki kell lépni.
  await kilep(oldal);
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/belepes`);
  all((await oldal.getByText("Belépés").count()) > 0, "a belépés magyarul jelenik meg");
  await oldal.locator('form:has(button[name="nyelv"]) button[value="en"]').click();
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.getByRole("heading", { name: "Sign in" }).count()) > 0,
    "a nyelvváltó belépés előtt is működik",
  );
  all(
    (await oldal.locator("html").getAttribute("lang")) === "en",
    "a html lang attribútuma is átáll",
  );

  await oldal.goto(`${ALAP}/jogi/adatkezeles`);
  all(
    (await oldal.getByRole("heading", { name: "Privacy notice" }).count()) > 0,
    "az adatkezelési tájékoztató angolul jön",
  );
  all(
    (await oldal.getByText("[kitöltendő]").count()) > 0,
    "az üzemeltető adatai kitöltendőként látszanak",
  );
  await oldal.goto(`${ALAP}/jogi/feltetelek`);
  all(
    (await oldal.getByText(/not a return/).count()) > 0,
    "a feltételek kimondják, hogy az adóösszesítő nem bevallás",
  );

  await belep(oldal, "anna@pelda.hu");
  await oldal.goto(`${ALAP}/berlo`);
  all((await oldal.textContent("main")).includes("Hello, "), "a bérlői kezdőlap angolul köszön");
  all(
    (await oldal.getByRole("heading", { name: "What I need to do" }).count()) > 0,
    "a teendők fejléce angol",
  );
  all(
    (await oldal.getByText(/Report a fault|Open fault|New fault report/).count()) > 0,
    "a hibából származó teendő is angolul jön",
  );

  await oldal.goto(`${ALAP}/berlo/hibak`);
  all(
    (await oldal.getByRole("heading", { name: "Report a fault" }).count()) > 0,
    "a hibabejelentő oldal angol",
  );
  all(
    (await oldal.getByText("Emergency").count()) > 0,
    "a sürgősségi fokozatok angolul jelennek meg",
  );
  all(
    (await oldal.getByText(/Central systems/).count()) > 0,
    "a területválasztó angolul jelenik meg",
  );

  await oldal.goto(`${ALAP}/berlo/dokumentumok`);
  all(
    (await oldal.getByRole("heading", { name: "My documents" }).count()) > 0,
    "a dokumentumok oldal angol",
  );
  all(
    (await oldal.getByText(/valid in Hungarian/).count()) > 0,
    "kimondja, hogy az okiratok magyarul érvényesek",
  );

  await oldal.goto(`${ALAP}/berlo`);
  all(
    (await oldal.locator("html").getAttribute("lang")) === "en",
    "a választott nyelv a fiókon marad",
  );

  await oldal.locator('form:has(button[name="nyelv"]) button[value="hu"]').click();
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.getByRole("heading", { name: /Szia,/ }).count()) > 0,
    "magyarra visszaváltva újra magyar a kezdőlap",
  );

  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/befizetesek`);
  all(
    (await oldal.getByRole("heading", { name: "Befizetések" }).count()) > 0,
    "a bérbeadói oldal magyarul maradt",
  );
  const befizetesek = await oldal.textContent("main");
  all(
    !befizetesek.includes("egyeztetes.") && !befizetesek.includes("teendo."),
    "nem szivárog ki nyers szótárkulcs a felületre",
  );
}
