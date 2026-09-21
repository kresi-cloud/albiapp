/**
 * Hibabejelentés és dokumentumtár végigjátszva.
 *
 * A lényeg, amit csak futtatással lehet ellenőrizni: a bejelentés két oldala
 * nem cserélhető fel. A bérbeadó nem zárhatja le a saját elhárítását, a lezárás
 * a bérlő megerősítése.
 */

import { ALAP, all, belep, magyarra, mindetKinyit } from "./kozos.mjs";

export const nev = "Hibabejelentés és dokumentumtár";

export async function futtat(oldal) {
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo/hibak`);
  await mindetKinyit(oldal);
  all(
    (await oldal.getByText("Nem melegszik a fürdőszobai radiátor").count()) > 0,
    "a bérlő látja a korábbi nyitott bejelentését",
  );
  all(
    (await oldal.getByText("+36 1 000 0000").count()) > 0,
    "a bérbeadó telefonszáma megjelenik a bérlőnél",
  );

  const urlap = oldal.locator('form:has(textarea[name="leiras"])');
  await urlap.locator('input[name="targy"]').fill("Ereszt a mosogató alatti szifon");
  await urlap
    .locator('textarea[name="leiras"]')
    .fill("Este vettük észre, a szekrény alja már vizes. Alátettünk egy lavórt.");
  await urlap.locator('select[name="terulet"]').selectOption("berendezes");
  await urlap.locator('input[name="ok"][value="ismeretlen"]').check();
  await urlap.locator('input[name="surgosseg"][value="veszhelyzet"]').check();
  all(
    (await oldal.getByText("Amíg a bérbeadó ideér").count()) > 0,
    "veszélyhelyzetnél megjelennek az azonnali teendők",
  );

  await urlap.getByRole("button", { name: "Bejelentem" }).click();
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.getByText(/az alkalmazás nem csörög/).count()) > 0,
    "veszélyhelyzetnél a visszajelzés telefonálásra szólít",
  );
  // A megőrzés másik fele: sikeres bejelentés után az űrlap tényleg kiürül,
  // különben a következő hiba a előzőnek a szövegével indulna.
  all(
    (await urlap.locator('input[name="targy"]').inputValue()) === "",
    "sikeres bejelentés után az űrlap kiürül",
  );
  await oldal.reload();
  await mindetKinyit(oldal);
  all(
    (await oldal.getByText("Ereszt a mosogató alatti szifon").count()) > 0,
    "az új bejelentés megjelenik a bérlő listáján",
  );
  all(
    (await oldal.getByText(/nem tippelek/).count()) > 0,
    "ismeretlen oknál nem tippel költségviselőt",
  );

  await oldal.goto(`${ALAP}/berlo`);
  all(
    (await oldal.getByText("Erősítsd meg, hogy a hiba rendben van").count()) === 0,
    "amíg nincs elhárítva, a bérlőnek nincs megerősítendő teendője",
  );

  await oldal.goto(`${ALAP}/berlo/dokumentumok`);
  all(
    !(await oldal.textContent("main")).includes("Tervezet"),
    "a bérlő nem lát tervezetet a dokumentumai közt",
  );

  // --- Bérbeadó: átveszi, elhárítja
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/`);
  all(
    (await oldal.getByText(/Új hibabejelentés: Ereszt a mosogató/).count()) > 0,
    "az új hiba a bérbeadó teendői közt van a kezdőlapon",
  );

  await oldal.goto(`${ALAP}/hibak`);
  await mindetKinyit(oldal);
  const kartya = oldal.locator("li", { hasText: "Ereszt a mosogató alatti szifon" }).first();
  all((await kartya.getByRole("button", { name: "Átvettem" }).count()) > 0, "az átvétel léphető");
  all(
    (await kartya.getByRole("button", { name: "Rendben van, lezárom" }).count()) === 0,
    "a bérbeadó nem zárhatja le saját maga",
  );

  await kartya.locator('select[name="viseloFel"]').selectOption("berbeado");
  await kartya.getByRole("button", { name: "Rögzítem" }).click();
  await oldal.waitForLoadState("networkidle");

  await oldal.goto(`${ALAP}/hibak`);
  await mindetKinyit(oldal);
  await oldal
    .locator("li", { hasText: "Ereszt a mosogató alatti szifon" })
    .first()
    .locator('textarea[name="szoveg"]')
    .fill("Holnap reggel megyek, elzárom a főcsapot.");
  await oldal
    .locator("li", { hasText: "Ereszt a mosogató alatti szifon" })
    .first()
    .getByRole("button", { name: "Üzenet küldése" })
    .click();
  await oldal.waitForLoadState("networkidle");

  for (const lepes of ["Átvettem", "Elhárítottam"]) {
    await oldal.goto(`${ALAP}/hibak`);
  await mindetKinyit(oldal);
    await oldal
      .locator("li", { hasText: "Ereszt a mosogató alatti szifon" })
      .first()
      .getByRole("button", { name: lepes })
      .click();
    await oldal.waitForLoadState("networkidle");
  }

  await oldal.goto(`${ALAP}/hibak`);
  await mindetKinyit(oldal);
  all(
    (await oldal.getByText("Elhárítva, a bérlő megerősítésére vár").count()) > 0,
    "elhárítás után a bérlő megerősítésére vár",
  );

  await oldal.goto(`${ALAP}/dokumentumok`);
  all(
    // A tár címére állítunk, nem a bevezető mondatra: a cím a szótárból jön,
    // és nem változik, ha a bevezetőt átírjuk.
    (await oldal.getByText("Dokumentumtár").count()) > 0,
    "a dokumentumtár megjelenik a bérbeadónál",
  );

  // --- Bérlő: megerősíti a lezárást
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo`);
  all(
    (await oldal.getByText("Erősítsd meg, hogy a hiba rendben van").count()) > 0,
    "az elhárítás után a bérlőnek teendője lett",
  );

  await oldal.goto(`${ALAP}/berlo/hibak`);
  await mindetKinyit(oldal);
  const berloiKartya = oldal
    .locator("li", { hasText: "Ereszt a mosogató alatti szifon" })
    .first();
  all(
    (await berloiKartya.getByText("A bérbeadót terheli").count()) > 0,
    "a bérlő látja a kimondott költségviselőt",
  );
  all(
    (await berloiKartya.getByText("Holnap reggel megyek").count()) > 0,
    "a bérlő látja a bérbeadó üzenetét",
  );
  await berloiKartya.getByRole("button", { name: "Rendben van, lezárom" }).click();
  await oldal.waitForLoadState("networkidle");
  await oldal.goto(`${ALAP}/berlo/hibak`);
  await mindetKinyit(oldal);
  all(
    (await oldal.getByText("Lezárt bejelentéseim").count()) > 0,
    "a megerősítés után a bejelentés lezárul",
  );
}
