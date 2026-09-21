/**
 * Bérlemény és jogviszony felvitele.
 *
 * Amit ez fog meg, és sem a típusellenőrzés, sem a fordítás nem: hogy a két
 * űrlap tényleg ment, hogy a figyelmeztetés a mentés *után* jelenik meg (nem
 * helyette), és hogy a jogviszonyból magától születik előírás — enélkül az
 * alkalmazás csak a példaadaton élne.
 */

import { ALAP, all, belep, magyarra, mindetKinyit, tullogas } from "./kozos.mjs";

export const nev = "Bérlemény és jogviszony felvitele";

// Minden menet saját bérleményt visz fel, így a próba újrafuttatható.
const EGYEDI = String(Date.now()).slice(-6);
const NEV = `Próbabérlemény ${EGYEDI}`;
const HIANYOS = `Próbabérlemény hiányos ${EGYEDI}`;

async function oldalra(oldal) {
  await oldal.goto(`${ALAP}/ingatlanok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
}

/** Az utoljára megnyitott űrlap, a nyitósor szövege alapján. */
function urlap(oldal, gombFelirat) {
  return oldal.locator("form").filter({ hasText: gombFelirat }).first();
}

async function teljesBerlemeny(oldal) {
  const ur = urlap(oldal, "Bérlemény felvétele");
  await ur.locator('input[name="megnevezes"]').fill(NEV);
  await ur.locator('input[name="cim"]').fill("1094 Budapest, Próba utca 7. 3/2");
  await ur.locator('input[name="alapteruletM2"]').fill("42");
  await ur.locator('input[name="kozosKoltsegFt"]').fill("15000");
  await ur.locator('input[name="helyrajziSzam"]').fill("37123/0/A/12");
  await ur.locator('input[name="energetikaiAzonosito"]').fill("HET-2026-000999");
  await ur.locator('input[name="beszerzesiArFt"]').fill("42000000");
  await ur.locator('input[name="beszerzesDatuma"]').fill("2021-05-12");
  await ur.getByRole("button", { name: "Bérlemény felvétele" }).click();
  await oldal.getByText("A bérlemény elmentve.").first().waitFor({ timeout: 15000 });
  all(true, "a teljes adatlappal felvett bérlemény elmentődik");

  all(
    (await oldal.getByText("Amit érdemes tudni:").count()) === 0,
    "a teljes adatlapra nincs figyelmeztetés",
  );
}

async function hianyosBerlemeny(oldal) {
  await oldalra(oldal);
  const ur = urlap(oldal, "Bérlemény felvétele");
  await ur.locator('input[name="megnevezes"]').fill(HIANYOS);
  // Szándékosan nem a szokásos magyar címalak, és nincs helyrajzi szám:
  // mindkettő figyelmeztetés, nem hiba.
  await ur.locator('input[name="cim"]').fill("a sarki sárga ház");
  await ur.getByRole("button", { name: "Bérlemény felvétele" }).click();
  await oldal.getByText("A bérlemény elmentve.").first().waitFor({ timeout: 15000 });

  const figyelem = oldal.getByText("Amit érdemes tudni:");
  all((await figyelem.count()) > 0, "a hiányos adatlap elmentődik, de szólunk róla");
  all(
    (await oldal.getByText(/nem a szokásos/).count()) > 0,
    "megmondjuk, hogy a betekintőn nem fog látszani a település",
  );
  all(
    (await oldal.getByText(/Helyrajzi szám nélkül is mehet/).count()) > 0,
    "a helyrajzi szám figyelmeztetés, nem hiba",
  );

  // A mentés tényleg megtörtént: a lista is mutatja.
  await oldalra(oldal);
  all(
    (await oldal.getByText(HIANYOS).count()) > 0,
    "a figyelmeztetett bérlemény tényleg bekerült a listába",
  );
}

async function rosszAdat(oldal) {
  await oldalra(oldal);
  const ur = urlap(oldal, "Bérlemény felvétele");
  await ur.locator('input[name="megnevezes"]').fill(`Nem kellene ${EGYEDI}`);
  await ur.locator('input[name="cim"]').fill("1094 Budapest, Próba utca 9.");
  await ur.locator('input[name="alapteruletM2"]').fill("0");
  await ur.getByRole("button", { name: "Bérlemény felvétele" }).click();
  await oldal
    .getByText("Az alapterület csak pozitív szám lehet.")
    .first()
    .waitFor({ timeout: 15000 });
  all(true, "a nulla alapterületet elutasítjuk");
  all(
    (await ur.locator('input[name="cim"]').inputValue()) === "1094 Budapest, Próba utca 9.",
    "a bérleményűrlap sem üríti ki magát elutasításkor",
  );

  await oldalra(oldal);
  all(
    (await oldal.getByText(`Nem kellene ${EGYEDI}`).count()) === 0,
    "az elutasított bérlemény nem került be",
  );
}

async function jogviszony(oldal) {
  await oldalra(oldal);
  const ur = urlap(oldal, "Jogviszony indítása");

  // A visszamenőleges kezdet szándékos: erről külön figyelmeztetést várunk.
  const most = new Date();
  const kezdet = new Date(Date.UTC(most.getUTCFullYear(), most.getUTCMonth() - 3, 1));
  await ur.locator('select[name="ingatlanId"]').selectOption({ label: NEV });
  await ur.locator('input[name="kezdete"]').fill(kezdet.toISOString().slice(0, 10));
  await ur.locator('input[name="berletiDijFt"]').fill("195000");
  await ur.locator('input[name="kozosKoltsegFt"]').fill("15000");
  await ur.locator('input[name="kaucioFt"]').fill("390000");
  await ur.locator('select[name="rezsiElszamolas"]').selectOption("atalany");

  // Előbb nulla átalánnyal: azt el kell utasítani.
  await ur.locator('input[name="rezsiAtalanyFt"]').fill("0");
  await ur.locator('input[name="berloNeve"]').fill(`Próba Bérlő ${EGYEDI}`);
  await ur.getByRole("button", { name: "Jogviszony indítása" }).click();
  await oldal.getByText(/Átalánynál add meg a havi összeget/).first().waitFor({ timeout: 15000 });
  all(true, "a nulla forintos rezsiátalányt elutasítjuk");

  // Az elutasítás nem viheti el a begépelt adatot. Ez nem elméleti: a
  // visszaírás nélkül a React kiürítette az egész űrlapot, vagyis egyetlen
  // hibás mező miatt tíz mezőt kellett volna újragépelni.
  all(
    (await ur.locator('input[name="berletiDijFt"]').inputValue()) === "195000",
    "az elutasítás után a bérleti díj megmarad",
  );
  all(
    (await ur.locator('input[name="berloNeve"]').inputValue()) === `Próba Bérlő ${EGYEDI}`,
    "az elutasítás után a bérlő neve megmarad",
  );
  all(
    (await ur.locator('input[name="kezdete"]').inputValue()) ===
      kezdet.toISOString().slice(0, 10),
    "az elutasítás után a kezdet dátuma megmarad",
  );
  all(
    (await ur.locator('select[name="rezsiElszamolas"]').inputValue()) === "atalany",
    "az elutasítás után a választott rezsimód is megmarad",
  );

  await ur.locator('input[name="rezsiAtalanyFt"]').fill("22000");
  await ur.getByRole("button", { name: "Jogviszony indítása" }).click();
  await oldal.getByText(/A jogviszony elindult/).first().waitFor({ timeout: 15000 });
  all(true, "a jogviszony elindul");

  all(
    (await oldal.getByText(/4 hónapra rögtön előírás születik/).count()) > 0,
    "megmondjuk előre, hány hónapra születik azonnal előírás",
  );
}

async function eloirasokLettek(oldal) {
  await oldal.goto(`${ALAP}/befizetesek`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  const szakasz = oldal.locator("section", { hasText: NEV }).first();
  all((await szakasz.count()) > 0, "az új jogviszony megjelenik a befizetéseknél");
  all(
    (await szakasz.getByText("195 000 Ft").count()) > 0,
    "a bérleti díj előírás lett, kézi rögzítés nélkül",
  );
  all(
    (await szakasz.getByText("22 000 Ft").count()) > 0,
    "a rezsiátalány is előírás lett",
  );
  all(
    (await szakasz.getByText(`Próba Bérlő ${EGYEDI}`).count()) > 0,
    "a megadott bérlő a jogviszonyhoz tartozik",
  );
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await oldalra(oldal);

  all((await tullogas(oldal)) === 0, "a bérlemények lap elfér 360 képponton");

  await teljesBerlemeny(oldal);
  await hianyosBerlemeny(oldal);
  await rosszAdat(oldal);
  await jogviszony(oldal);
  await eloirasokLettek(oldal);
}
