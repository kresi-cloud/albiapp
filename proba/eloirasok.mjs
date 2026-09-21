/**
 * Havi előírások és a jogviszony lezárása.
 *
 * Amit csak futtatással lehet ellenőrizni: a lezárás tényleg elvégzi a
 * törlést és az arányosítást, a visszavonás pedig tényleg helyreállítja az
 * összeget. A próba a végén visszaállítja a jogviszonyt élőre, hogy a
 * következő futás is ugyanonnan induljon.
 */

import { ALAP, all, belep, magyarra, tullogas } from "./kozos.mjs";

export const nev = "Havi előírások és lezárás";

/** A záró hónap: a mostani hónap 15-e, így van törlendő és arányosítandó is. */
function zaroNap(most) {
  const ev = most.getUTCFullYear();
  const honap = String(most.getUTCMonth() + 1).padStart(2, "0");
  return `${ev}-${honap}-15`;
}

async function elsoKartya(oldal) {
  return oldal.locator("li", { hasText: "Ferencvárosi garzon" }).first();
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  await oldal.goto(`${ALAP}/berlok`);
  all((await tullogas(oldal)) === 0, `a bérlők oldal elfér 360 képponton (túllógás: ${await tullogas(oldal)}px)`);

  let kartya = await elsoKartya(oldal);
  all(
    (await kartya.getByText("Jogviszony lezárása").count()) > 0,
    "élő jogviszonynál felkínáljuk a lezárást",
  );

  // --- Lezárás a hónap közepével
  await kartya.getByText("Jogviszony lezárása").click();
  await kartya.locator('input[name="vege"]').fill(zaroNap(new Date()));
  await kartya.getByRole("button", { name: "Lezárom" }).click();
  // Nem a `networkidle`-re várunk: a kiszolgálói művelet nem tölt újra oldalt,
  // így az hamarabb beállna, mint ahogy a művelet lefut. A kártya átbillenése
  // a jel, hogy kész.
  const lezartSor = kartya.getByText(/Lezárva \d/);
  await lezartSor.first().waitFor({ timeout: 15000 });
  all(
    (await lezartSor.count()) > 0,
    "a lezárás után a kártya azonnal lezártként jelenik meg",
  );

  await oldal.goto(`${ALAP}/berlok`);
  kartya = await elsoKartya(oldal);
  all((await kartya.getByText(/Lezárva \d/).count()) > 0, "a kártya újratöltve is lezárt");
  all(
    (await kartya.getByText("Jogviszony lezárása").count()) === 0,
    "lezárt jogviszonyt nem lehet újra lezárni",
  );

  await oldal.goto(`${ALAP}/befizetesek`);
  all(
    (await oldal.getByText(/Töredékhónap/).count()) > 0,
    "a befizetéseknél megjelenik a töredékhónap magyarázata",
  );

  // --- A lezárás visszavonása: az arányosítás is visszaáll
  await oldal.goto(`${ALAP}/berlok`);
  kartya = await elsoKartya(oldal);
  await kartya.getByRole("button", { name: "Mégis él" }).click();
  await kartya
    .getByText("Jogviszony lezárása")
    .first()
    .waitFor({ timeout: 15000 });

  await oldal.goto(`${ALAP}/berlok`);
  kartya = await elsoKartya(oldal);
  all(
    (await kartya.getByText(/Lezárva \d/).count()) === 0,
    "a visszavonás után újra él a jogviszony",
  );
  all(
    (await kartya.getByText("Jogviszony lezárása").count()) > 0,
    "a lezárás megint felkínálható",
  );

  await oldal.goto(`${ALAP}/befizetesek`);
  all(
    (await oldal.getByText("180 000 Ft").count()) > 0,
    "a visszavonás után a záró hónap újra a teljes bérleti díj",
  );
}
