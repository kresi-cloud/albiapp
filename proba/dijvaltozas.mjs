/**
 * Díjemelés.
 *
 * Amit ez fog meg: hogy a díjemelés űrlapja tényleg ment, hogy a kiszolgáló
 * elutasítja a már előírt hónapot — ez a szabály tartja meg azt az ígéretet,
 * hogy meglévő előírást nem írunk át —, és hogy a rögzített emelés a lapon is
 * ott marad, visszavonható módon.
 *
 * Az emelés hatását (hogy a következő hónapok előírása már az új összeggel
 * születik) a domain tesztjei mérik: jövőbeli hónapra nem írunk elő, tehát a
 * felületen ma még nincs mit megnézni rajta.
 */

import { ALAP, all, belep, magyarra, tullogas } from "./kozos.mjs";

export const nev = "Díjemelés";

/** „2026-11" alakú hónapkulcs, a maitól számított eltolással. */
function honap(eltolas) {
  const most = new Date();
  const nap = new Date(Date.UTC(most.getUTCFullYear(), most.getUTCMonth() + eltolas, 1));
  return `${nap.getUTCFullYear()}-${String(nap.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function szakaszra(oldal) {
  await oldal.goto(`${ALAP}/berlok`);
  await oldal.waitForLoadState("networkidle");
  const szakasz = oldal.locator('details[data-szakasz="dijvaltozas"]').first();
  all((await szakasz.count()) > 0, "élő jogviszonynál van díjemelés szakasz");
  if (!(await szakasz.evaluate((elem) => elem.open))) {
    await szakasz.locator("summary").first().click();
  }
  return szakasz;
}

async function mar_eloirt(oldal) {
  const szakasz = await szakaszra(oldal);
  const ur = szakasz.locator("form").filter({ hasText: "Díjemelés rögzítése" }).first();
  // A mai hónapra már van előírás: erre emelni azt jelentené, hogy egy
  // egyeztetett tételt írunk át. A gomb elrejtése nem védelem, ezért a
  // kiszolgálótól várjuk a nemet.
  await ur.locator('input[name="ervenyesTol"]').fill(honap(0));
  await ur.locator('input[name="berletiDijFt"]').fill("195000");
  await ur.getByRole("button", { name: "Díjemelés rögzítése" }).click();
  await oldal.getByText(/már van előírás/).first().waitFor({ timeout: 15000 });
  all(true, "a már előírt hónapra nem enged emelni");

  all(
    (await ur.locator('input[name="berletiDijFt"]').inputValue()) === "195000",
    "az elutasítás nem viszi el a begépelt összeget",
  );
}

async function rogzites(oldal) {
  const szakasz = await szakaszra(oldal);
  const ur = szakasz.locator("form").filter({ hasText: "Díjemelés rögzítése" }).first();
  await ur.locator('input[name="ervenyesTol"]').fill(honap(2));
  // Magyar alakban gépelve: a „195.000"-ből sokáig 195 forint lett.
  await ur.locator('input[name="berletiDijFt"]').fill("195.000");
  await ur.getByRole("button", { name: "Díjemelés rögzítése" }).click();
  await oldal.getByText(/A díjemelést rögzítettük/).first().waitFor({ timeout: 15000 });
  all(true, "a még elő nem írt hónapra rögzíthető az emelés");

  const ujra = await szakaszra(oldal);
  const sor = ujra.locator(`[data-dijvaltozas="${honap(2)}"]`);
  all((await sor.count()) === 1, "a rögzített emelés a lapon is ott van, újratöltés után");
  all(
    ((await sor.first().textContent()) ?? "").replace(/\s/g, " ").includes("195 000 Ft"),
    "a „195.000” alakban beírt összegből 195 000 Ft lett",
  );
  all((await tullogas(oldal)) === 0, "a díjemelés szakasza elfér 360 képponton");
}

async function visszavonas(oldal) {
  const szakasz = await szakaszra(oldal);
  const sor = szakasz.locator(`[data-dijvaltozas="${honap(2)}"]`).first();
  await sor.getByRole("button", { name: "Visszavonom" }).click();
  await oldal.getByText(/A díjemelést visszavontuk/).first().waitFor({ timeout: 15000 });

  const ujra = await szakaszra(oldal);
  all(
    (await ujra.locator(`[data-dijvaltozas="${honap(2)}"]`).count()) === 0,
    "a visszavont emelés tényleg eltűnik, nem csak a visszajelzés szól",
  );
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  await mar_eloirt(oldal);
  await rogzites(oldal);
  await visszavonas(oldal);
}
