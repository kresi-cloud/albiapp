/**
 * Regisztráció és saját fiók.
 *
 * Amit ez fog meg: hogy egyáltalán lehet-e fiókot készíteni — eddig az
 * alkalmazás csak a példaadaton élt, és aki élesben kipróbálta volna, a
 * belépőlapon elakadt —, és hogy a jelszócsere tényleg cserél: a régivel nem
 * lehet többé belépni, az újjal igen.
 *
 * A jelszócsere a többi eszközt is kilépteti. Ezt egy második böngészőlappal
 * méri, mert egy olyan süti, ami a csere után is dolgozik, pont attól nem védi
 * meg a fiókot, akinek a régi jelszó a kezébe került.
 */

import { ALAP, JELSZO, all, kilep } from "./kozos.mjs";

export const nev = "Regisztráció és fiók";

const EGYEDI = String(Date.now()).slice(-6);
const CIM = `proba-berbeado-${EGYEDI}@pelda.hu`;
const UJ_CIM = `proba-berbeado-${EGYEDI}-uj@pelda.hu`;
const UJ_JELSZO = `${JELSZO}-uj`;

async function belepEzzel(oldal, email, jelszo) {
  await kilep(oldal);
  await oldal.fill('input[name="email"]', email);
  await oldal.fill('input[name="jelszo"]', jelszo);
  await oldal.getByRole("button", { name: /Belépés|Sign in/ }).click();
  await oldal.waitForLoadState("networkidle");
}

async function regisztracio(oldal) {
  await kilep(oldal);
  await oldal.goto(`${ALAP}/regisztracio`);

  // Előbb rossz adattal: rövid jelszó, és a két jelszó sem egyezik.
  await oldal.fill('input[name="nev"]', `Próba Bérbeadó ${EGYEDI}`);
  await oldal.fill('input[name="email"]', CIM);
  await oldal.fill('input[name="jelszo"]', "rovid");
  await oldal.fill('input[name="jelszoUjra"]', "masik");
  await oldal.getByRole("button", { name: "Fiók készítése" }).click();
  await oldal.getByText(/legalább 10 karakter/).first().waitFor({ timeout: 15000 });
  all(true, "a rövid jelszót elutasítjuk");
  all(
    (await oldal.getByText(/A két jelszó nem egyezik/).count()) > 0,
    "és azt is megmondjuk, hogy a két jelszó eltér",
  );
  all(
    (await oldal.locator('input[name="email"]').inputValue()) === CIM,
    "az elutasítás nem viszi el a begépelt címet",
  );

  // Foglalt címre sem készítünk fiókot: a példaadat bérbeadója ott van.
  await oldal.fill('input[name="email"]', "berbeado@pelda.hu");
  await oldal.fill('input[name="jelszo"]', JELSZO);
  await oldal.fill('input[name="jelszoUjra"]', JELSZO);
  await oldal.getByRole("button", { name: "Fiók készítése" }).click();
  await oldal.getByText(/már van fiók/).first().waitFor({ timeout: 15000 });
  all(true, "foglalt címre nem készítünk másik fiókot");

  await oldal.fill('input[name="email"]', CIM);
  await oldal.fill('input[name="jelszo"]', JELSZO);
  await oldal.fill('input[name="jelszoUjra"]', JELSZO);
  await oldal.getByRole("button", { name: "Fiók készítése" }).click();
  await oldal.waitForURL(/\/beallitasok/, { timeout: 15000 });
  all(true, "az új bérbeadói fiók elkészül, és rögtön be is lép");

  // Az új fiók a bérbeadói alkalmazást kapja, üresen: ez a legelső képernyő,
  // amit egy valódi felhasználó lát.
  await oldal.goto(`${ALAP}/ingatlanok`);
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.locator('input[name="megnevezes"]').count()) > 0,
    "az új fiók rögtön tud bérleményt felvenni",
  );
}

async function nevcsere(oldal) {
  await oldal.goto(`${ALAP}/fiok`);
  await oldal.waitForLoadState("networkidle");
  const urlap = oldal.locator("form").filter({ hasText: "Név mentése" }).first();
  await urlap.locator('input[name="nev"]').fill(`Javított Név ${EGYEDI}`);
  await urlap.getByRole("button", { name: "Név mentése" }).click();
  await oldal.getByText(/A nevedet elmentettük/).first().waitFor({ timeout: 15000 });

  await oldal.goto(`${ALAP}/fiok`);
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.locator('input[name="nev"]').inputValue()) === `Javított Név ${EGYEDI}`,
    "a javított név újratöltés után is ott van",
  );
}

async function jelszocsere(oldal) {
  await oldal.goto(`${ALAP}/fiok`);
  await oldal.waitForLoadState("networkidle");
  const urlap = oldal.locator("form").filter({ hasText: "Jelszó módosítása" }).first();

  // A mostani jelszó nélkül egy nyitva hagyott gépen bárki átvenné a fiókot.
  await urlap.locator('input[name="mostani"]').fill("nem-ez-a-jelszo");
  await urlap.locator('input[name="jelszo"]').fill(UJ_JELSZO);
  await urlap.locator('input[name="jelszoUjra"]').fill(UJ_JELSZO);
  await urlap.getByRole("button", { name: "Jelszó módosítása" }).click();
  await oldal.getByText(/A mostani jelszó nem stimmel/).first().waitFor({ timeout: 15000 });
  all(true, "rossz mostani jelszóval nem cserél");

  await urlap.locator('input[name="mostani"]').fill(JELSZO);
  await urlap.locator('input[name="jelszo"]').fill(UJ_JELSZO);
  await urlap.locator('input[name="jelszoUjra"]').fill(UJ_JELSZO);
  await urlap.getByRole("button", { name: "Jelszó módosítása" }).click();
  await oldal.getByText(/A jelszavad megváltozott/).first().waitFor({ timeout: 15000 });
  all(true, "a jelszó megváltozik");

  // A csere után a saját munkamenet marad: a felhasználó ne a saját
  // jelszócseréjétől lépjen ki.
  await oldal.goto(`${ALAP}/fiok`);
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.locator('input[name="nev"]').count()) > 0,
    "a csere után a saját munkamenet él tovább",
  );

  await belepEzzel(oldal, CIM, JELSZO);
  all(
    (await oldal.locator('input[name="jelszo"]').count()) > 0,
    "a régi jelszóval már nem lehet belépni",
  );
  await belepEzzel(oldal, CIM, UJ_JELSZO);
  all(
    (await oldal.locator('input[name="jelszo"]').count()) === 0,
    "az új jelszóval igen",
  );
}

/** A másik eszköz: külön böngészőlap, saját sütivel. */
async function masikEszkoz(oldal) {
  const masik = await oldal.context().browser().newContext({ viewport: { width: 360, height: 844 } });
  const lap = await masik.newPage();
  try {
    await lap.goto(`${ALAP}/belepes`);
    await lap.fill('input[name="email"]', CIM);
    await lap.fill('input[name="jelszo"]', UJ_JELSZO);
    await lap.getByRole("button", { name: /Belépés|Sign in/ }).click();
    await lap.waitForLoadState("networkidle");
    all((await lap.locator('input[name="jelszo"]').count()) === 0, "a másik eszköz belép");

    // A csere ezen a lapon nem történik: itt csak a hatását nézzük.
    await oldal.goto(`${ALAP}/fiok`);
    await oldal.waitForLoadState("networkidle");
    const urlap = oldal.locator("form").filter({ hasText: "Jelszó módosítása" }).first();
    await urlap.locator('input[name="mostani"]').fill(UJ_JELSZO);
    await urlap.locator('input[name="jelszo"]').fill(JELSZO);
    await urlap.locator('input[name="jelszoUjra"]').fill(JELSZO);
    await urlap.getByRole("button", { name: "Jelszó módosítása" }).click();
    await oldal.getByText(/A jelszavad megváltozott/).first().waitFor({ timeout: 15000 });

    await lap.goto(`${ALAP}/fiok`);
    await lap.waitForLoadState("networkidle");
    all(
      (await lap.locator('input[name="jelszo"]').count()) > 0 &&
        (await lap.locator('input[name="nev"]').count()) === 0,
      "a másik eszköz munkamenete a jelszócserétől elveszti az érvényét",
    );
  } finally {
    await masik.close();
  }
}

async function emailcsere(oldal) {
  await belepEzzel(oldal, CIM, JELSZO);
  await oldal.goto(`${ALAP}/fiok`);
  await oldal.waitForLoadState("networkidle");
  const urlap = oldal.locator("form").filter({ hasText: "Cím módosítása" }).first();

  await urlap.locator('input[name="email"]').fill("berbeado@pelda.hu");
  await urlap.locator('input[name="mostani"]').fill(JELSZO);
  await urlap.getByRole("button", { name: "Cím módosítása" }).click();
  await oldal.getByText(/Ezzel a címmel már van fiók/).first().waitFor({ timeout: 15000 });
  all(true, "foglalt címre nem írjuk át a fiókot");

  await urlap.locator('input[name="email"]').fill(UJ_CIM);
  await urlap.locator('input[name="mostani"]').fill(JELSZO);
  await urlap.getByRole("button", { name: "Cím módosítása" }).click();
  await oldal.getByText(/Az e-mail-címed megváltozott/).first().waitFor({ timeout: 15000 });

  await belepEzzel(oldal, UJ_CIM, JELSZO);
  all(
    (await oldal.locator('input[name="jelszo"]').count()) === 0,
    "az új címmel be lehet lépni",
  );
}

export async function futtat(oldal) {
  await regisztracio(oldal);
  await nevcsere(oldal);
  await jelszocsere(oldal);
  await masikEszkoz(oldal);
  await emailcsere(oldal);
  // A próbasor többi tagja a példaadat bérbeadójával dolgozik tovább.
  await kilep(oldal);
}
