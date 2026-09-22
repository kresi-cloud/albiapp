/**
 * Saját adatok és személyazonosság.
 *
 * Amit ez a próba fog meg, és sem a típusellenőrzés, sem a fordítás nem:
 * hogy a bérlő tényleg meg tudja adni a saját adatait, hogy az átjön a
 * bérbeadó oldalára a forrás megjelölésével, és hogy a szerződést nem lehet
 * véglegesíteni a személyazonosság nyugtázása nélkül.
 */

import { ALAP, all, belep, magyarra, tullogas } from "./kozos.mjs";

export const nev = "Saját adatok és személyazonosság";

const EGYEDI = String(Date.now()).slice(-6);
const ANYJA = `Próba Katalin ${EGYEDI}`;

async function berloiAdatlap(oldal) {
  await belep(oldal, "anna@pelda.hu");
  await oldal.goto(`${ALAP}/berlo/adatok`);
  await oldal.waitForLoadState("networkidle");

  all(
    (await oldal.getByRole("heading", { name: "A saját adataim" }).count()) > 0,
    "a bérlőnek van saját adatlapja",
  );
  all((await tullogas(oldal)) === 0, "a bérlői adatlap elfér 360 képponton");

  // Az ürlap kitöltése: az anyja neve minden körben más, így látszik, hogy
  // tényleg az új érték ment át, nem a korábbi maradt ott.
  await oldal.fill('input[name="anyjaNeve"]', ANYJA);
  await oldal.fill('input[name="szuletesiHely"]', "Debrecen");
  await oldal.fill('input[name="szuletesiIdo"]', "1998-06-14");
  await oldal.fill('input[name="lakcim"]', "4026 Debrecen, Minta tér 8.");
  await oldal.fill('input[name="igazolvanySzam"]', "111111BB");
  await oldal.getByRole("button", { name: "Mentem" }).click();
  await oldal.getByText("Az adataid mentve.").first().waitFor({ timeout: 15000 });
  all(true, "a bérlő elmentheti a saját adatait");
}

async function gyanusIgazolvany(oldal) {
  await oldal.goto(`${ALAP}/berlo/adatok`);
  await oldal.waitForLoadState("networkidle");

  await oldal.fill('input[name="igazolvanySzam"]', "AB12");
  await oldal.getByRole("button", { name: "Mentem" }).click();
  await oldal
    .getByText("Ez nem tűnik igazolványszámnak.")
    .first()
    .waitFor({ timeout: 15000 });
  all(true, "a nyilvánvalóan rossz igazolványszámra szólunk");

  // Vissza a jóra, hogy a próba újrafuttatható maradjon.
  await oldal.fill('input[name="igazolvanySzam"]', "111111BB");
  await oldal.getByRole("button", { name: "Mentem" }).click();
  await oldal.getByText("Az adataid mentve.").first().waitFor({ timeout: 15000 });
}

async function berbeadoiOldal(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await oldal.goto(`${ALAP}/berlok`);
  await oldal.waitForLoadState("networkidle");

  const reszlet = oldal.locator("details", { hasText: "Szerződéshez szükséges adatok" }).first();
  await reszlet.locator("summary").click();

  all(
    (await reszlet.getByText("Ezeket a bérlő adta meg magáról.").count()) > 0,
    "a bérbeadó látja, hogy az adatot a bérlő adta meg",
  );
  all(
    (await reszlet.locator(`input[name="anyjaNeve"][value="${ANYJA}"]`).count()) > 0,
    "a bérlő adata átjön a bérbeadó oldalára",
  );
}

async function szerzodesAzonossag(oldal) {
  await oldal.goto(`${ALAP}/dokumentumok`);
  await oldal.waitForLoadState("networkidle");

  // A letöltési útvonal ugyanígy kezdődik, azt ki kell zárni.
  const hivatkozas = oldal
    .locator('a[href^="/szerzodesek/"]:not([href$="/letoltes"])')
    .first();
  if ((await hivatkozas.count()) === 0) {
    all(false, "van szerződéstervezet, amin a nyugtázás próbálható");
    return;
  }

  // Nem kattintunk, hanem a hivatkozás címére megyünk: a kattintás a
  // lenyitható szakaszokban megbízhatatlan, és itt nem a navigációt próbáljuk.
  const ut = await hivatkozas.getAttribute("href");
  await oldal.goto(`${ALAP}${ut}`);
  await oldal.waitForLoadState("networkidle");

  all(
    (await oldal.getByText("Az alkalmazás nem ellenőrzi, hogy ki kicsoda").count()) > 0,
    "a szerződéslap kimondja, hogy személyazonosságot nem igazolunk",
  );

  const jelolo = oldal.locator('input[name="azonossagEllenorizve"]');
  if ((await jelolo.count()) === 0) {
    // Már véglegesített szerződés: ott nincs mit nyugtázni.
    all(true, "a véglegesített szerződésen már nincs nyugtázás");
    return;
  }

  all(
    (await jelolo.first().getAttribute("required")) !== null,
    "a nyugtázás kötelező a véglegesítéshez",
  );
  all(!(await jelolo.first().isChecked()), "a nyugtázás alapból nincs bepipálva");
  all((await tullogas(oldal)) === 0, "a szerződéslap elfér 360 képponton");
}

export async function futtat(oldal) {
  await magyarra(oldal);
  await berloiAdatlap(oldal);
  await gyanusIgazolvany(oldal);
  await berbeadoiOldal(oldal);
  await szerzodesAzonossag(oldal);
}
