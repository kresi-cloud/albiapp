/**
 * Az elutasított mentés nem viheti el a begépelt adatot.
 *
 * Ez a hiba sem a típusellenőrzésen, sem a fordításon nem akad fenn, és
 * olvasásra sem látszik: a React üríti ki az űrlap mezőit, miután a
 * kiszolgálói művelet lefutott. Csak akkor derül ki, ha valaki tényleg elront
 * egy mezőt egy futó böngészőben — ezért van rá próba.
 *
 * Mindhárom eset ugyanazt a kérdést teszi fel más-más mezőfajtára: beküldök
 * valamit, amit a kiszolgáló visszadob, és utána még ott van-e, amit gépeltem.
 * Egyik eset sem ment el semmit, tehát a próba tetszőleges sokszor futtatható.
 */

import { ALAP, all, belep, magyarra, mindetKinyit } from "./kozos.mjs";

export const nev = "Az elutasított mentés megőrzi a begépelt adatot";

const JEL = String(Date.now()).slice(-6);

/** Szövegmező és dátum: az óraállás rögzítése. */
async function oraallas(oldal) {
  await oldal.goto(`${ALAP}/rezsi`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  const urlap = oldal.locator('form:has(input[name="merooraId"])').first();
  all((await urlap.count()) > 0, "van mérőóra, amire óraállást lehet rögzíteni");

  await urlap.locator('input[name="datum"]').fill("2026-03-17");
  // Az óraállás mezeje szándékosan szabad szöveg: a helyszínen
  // mértékegységgel együtt írják be. Amit nem tudunk kiolvasni, arra szólunk.
  await urlap.locator('input[name="ertek"]').fill(`nem olvasható ${JEL}`);
  await urlap.getByRole("button", { name: "Óraállás rögzítése" }).click();
  await oldal
    .getByText("Az óraállás csak nem negatív szám lehet.")
    .first()
    .waitFor({ timeout: 15000 });

  all(
    (await urlap.locator('input[name="datum"]').inputValue()) === "2026-03-17",
    "elutasított óraállás után a dátum megmarad",
  );
  all(
    (await urlap.locator('input[name="ertek"]').inputValue()) === `nem olvasható ${JEL}`,
    "elutasított óraállás után a beírt óraállás is megmarad",
  );
}

/** Több mezős űrlap: a bérlő szerződéshez szükséges adatai a bérbeadónál. */
async function berloiAdatlap(oldal) {
  await oldal.goto(`${ALAP}/berlok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  const urlap = oldal.locator('form:has(input[name="jogviszonyBerloId"])').first();
  all((await urlap.count()) > 0, "a bérlő adatlapja megvan a bérbeadónál");

  await urlap.locator('input[name="anyjaNeve"]').fill(`Próba Anyanév ${JEL}`);
  await urlap.locator('input[name="szuletesiHely"]').fill(`Próbaváros ${JEL}`);
  await urlap.locator('input[name="telefon"]').fill("+36 30 000 1111");
  // A név üresen hagyása a kiszolgálón bukik el, a böngészőben nem: pont ez
  // az az eset, amiben eddig a másik hét mező is elveszett.
  await urlap.locator('input[name="nev"]').fill("");
  await urlap.getByRole("button", { name: "Adatok mentése" }).click();
  await oldal.getByText("A név nem maradhat üresen.").first().waitFor({ timeout: 15000 });

  all(
    (await urlap.locator('input[name="anyjaNeve"]').inputValue()) === `Próba Anyanév ${JEL}`,
    "elutasított adatlap után az anyja neve megmarad",
  );
  all(
    (await urlap.locator('input[name="szuletesiHely"]').inputValue()) === `Próbaváros ${JEL}`,
    "elutasított adatlap után a születési hely is megmarad",
  );
  all(
    (await urlap.locator('input[name="telefon"]').inputValue()) === "+36 30 000 1111",
    "elutasított adatlap után a telefonszám is megmarad",
  );
}

/** Szövegdoboz, választó és rádiógomb: a bérlő hibabejelentése. */
async function hibabejelentes(oldal) {
  await oldal.goto(`${ALAP}/berlo/hibak`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  const urlap = oldal.locator('form:has(textarea[name="leiras"])').first();
  const leiras = `Csöpög a csap, ${JEL}. Ezt gépeltem be, és ennek meg kell maradnia.`;

  await urlap.locator('textarea[name="leiras"]').fill(leiras);
  await urlap.locator('select[name="terulet"]').selectOption("haztartasi_gep");
  await urlap.locator('input[name="ok"][value="ismeretlen"]').check();
  await urlap.locator('input[name="surgosseg"][value="surgos"]').check();

  // A tárgy üresen marad, és levesszük róla a böngésző kötelezőség-jelzőjét:
  // nem azt próbáljuk, hogy a böngésző szól-e, hanem hogy a *kiszolgáló*
  // elutasítása után megvan-e még minden más mező. A kiszolgáló ezt az utat
  // magától is járja, valahányszor egy régebbi lapról érkezik a beküldés.
  await urlap.locator('input[name="targy"]').evaluate((mezo) => {
    mezo.value = "";
    mezo.removeAttribute("required");
  });
  await urlap.getByRole("button", { name: "Bejelentem" }).click();
  await oldal.getByText(/Ezt még pótold/).first().waitFor({ timeout: 15000 });

  all(
    (await urlap.locator('textarea[name="leiras"]').inputValue()) === leiras,
    "elutasított hibabejelentés után a leírás megmarad",
  );
  all(
    (await urlap.locator('select[name="terulet"]').inputValue()) === "haztartasi_gep",
    "elutasított hibabejelentés után a választott terület is megmarad",
  );
  all(
    await urlap.locator('input[name="ok"][value="ismeretlen"]').isChecked(),
    "elutasított hibabejelentés után a megjelölt ok is megmarad",
  );
  all(
    await urlap.locator('input[name="surgosseg"][value="surgos"]').isChecked(),
    "elutasított hibabejelentés után a sürgősség is megmarad",
  );

  // És ami ugyanennyire fontos: ami nem a felhasználó gépelése, azt nem
  // őrizzük meg. A lap újratöltésekor tiszta űrlap fogadja.
  await oldal.reload();
  await mindetKinyit(oldal);
  all(
    (await oldal.locator('form:has(textarea[name="leiras"])').first()
      .locator('textarea[name="leiras"]').inputValue()) === "",
    "újratöltés után az űrlap üresen indul",
  );
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await oraallas(oldal);
  await berloiAdatlap(oldal);

  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await hibabejelentes(oldal);
}
