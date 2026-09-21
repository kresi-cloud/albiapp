/**
 * Kétnyelvűség végigjátszva.
 *
 * A fordítás megléte a szótárteszt dolga; itt az az egy kérdés, hogy a
 * nyelvválasztás végigér-e a kiszolgálón: belépés előtt is, belépés után is, a
 * `lang` attribútumig, és nem szivárog-e ki nyers szótárkulcs a képernyőre.
 */

import { ALAP, all, angolra, belep, kilep, magyarra } from "./kozos.mjs";

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

  // A bérbeadói út: ezen a felén volt a baj, a lapok beégetett magyar szöveggel
  // dolgoztak, tehát az angol felület magyarul jelent meg. Ezért itt lapról
  // lapra végigmegyünk, és a saját fejlécét kérdezzük meg angolul.
  await belep(oldal, "berbeado@pelda.hu");
  await angolra(oldal);

  const BERBEADOI_LAPOK = [
    ["/", "Overview"],
    ["/ingatlanok", "Properties"],
    ["/berlok", "Tenants"],
    ["/befizetesek", "Payments"],
    ["/rezsi", "Utilities and settlement"],
    ["/hibak", "Repairs"],
    ["/dokumentumok", "Documents"],
    ["/beallitasok", "Settings"],
  ];

  for (const [utvonal, fejlec] of BERBEADOI_LAPOK) {
    await oldal.goto(`${ALAP}${utvonal}`);
    all(
      (await oldal.getByRole("heading", { name: fejlec }).count()) > 0,
      `${utvonal} fejléce angolul jön`,
    );
  }

  await oldal.goto(`${ALAP}/ado`);
  const adoFejlec = (await oldal.getByRole("heading", { name: /Tax summary/ }).first().textContent()) ?? "";
  all(adoFejlec.length > 0, "/ado fejléce angolul jön");
  // Az évszám nem mennyiség: ha számként megy a szövegezőbe, angolul „2,026”
  // lesz belőle. A magyar alakon ez nem látszik, ezért itt kell megfogni.
  all(/Tax summary · \d{4}$/.test(adoFejlec.trim()), `az évszám nincs ezresre tagolva: ${adoFejlec}`);

  // Az űrlapok és a szerveroldali üzenetek is a szótáron mennek.
  await oldal.goto(`${ALAP}/beallitasok`);
  all(
    (await oldal.getByText("Matching window").count()) > 0,
    "a beállítások űrlapja angol",
  );
  // A felső határon túli napszám a kiszolgálón bukik meg: a hibaüzenet is a
  // szótáron megy, nem a műveletbe beégetett magyar mondaton. A böngésző `max`
  // ellenőrzését levesszük, mert a kiszolgálói ellenőrzés épp azért van, hogy a
  // böngészőt megkerülő kérést is megfogja.
  await oldal.locator('input[name="korabbiAblakNap"]').evaluate((mezo) => {
    mezo.removeAttribute("max");
  });
  await oldal.locator('input[name="korabbiAblakNap"]').fill("91");
  await oldal.locator('form:has(input[name="korabbiAblakNap"]) button[type="submit"]').click();
  await oldal.waitForLoadState("networkidle");
  const beallitasok = await oldal.textContent("main");
  all(
    beallitasok.includes("was not saved") && beallitasok.includes("at most 90 days"),
    "a szerveroldali hibaüzenet is angolul jön",
  );

  // A pénz és a dátum alakja is a nyelvvel jár: magyar alak az angol felületen
  // ugyanaz a hiba, csak nem szövegben.
  await oldal.goto(`${ALAP}/befizetesek`);
  const befizetesek = await oldal.textContent("main");
  all(
    !befizetesek.includes("egyeztetes.") && !befizetesek.includes("teendo."),
    "nem szivárog ki nyers szótárkulcs a felületre",
  );
  all(
    befizetesek.includes("HUF") && !befizetesek.includes(" Ft"),
    "az összegek angol alakban jelennek meg",
  );

  await magyarra(oldal);
  await oldal.goto(`${ALAP}/befizetesek`);
  all(
    (await oldal.getByRole("heading", { name: "Befizetések" }).count()) > 0,
    "magyarra visszaváltva a bérbeadói lap is magyar",
  );
  all(
    (await oldal.textContent("main")).includes("Ft"),
    "magyarul forintban, magyar alakban",
  );
}
