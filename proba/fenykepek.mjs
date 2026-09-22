/**
 * Fényképalbum az átadás-átvételi állapotról.
 *
 * Amit csak futtatással lehet ellenőrizni: hogy a kép tényleg kirajzolódik (a
 * kiszolgálói útvonal a tartalmat adja vissza, nem hibát), hogy a megerősítés
 * a *másik* félé, és hogy a jogosultság a jogviszonyból jön — nem abból, hogy
 * valaki ismeri a kép azonosítóját.
 */

import { ALAP, all, belep, kilep, magyarra, mindetKinyit, tullogas } from "./kozos.mjs";

export const nev = "Fényképek az átadás-átvételi állapotról";

const EGYEDI = String(Date.now()).slice(-6);

/** Egy apró, de valódi PNG: egyszínű 8×8 kép. */
function pngBajtok() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII=",
    "base64",
  );
}

async function berbeadoiAlbum(oldal) {
  await oldal.goto(`${ALAP}/dokumentumok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  // A hivatkozást kiolvassuk és odamegyünk, nem kattintunk: a lista egy
  // összecsukott szakaszban van, és a csukott szakasz tartalmát a próba csak
  // láthatóvá teszi, kattinthatóvá nem.
  const ut = await oldal
    .getByRole("link", { name: /Birtokbaadás/ })
    .first()
    .getAttribute("href");
  all(typeof ut === "string" && /^\/jegyzokonyvek\//.test(ut), "a példaadatban van jegyzőkönyv");

  await oldal.goto(`${ALAP}${ut}`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all(
    (await oldal.textContent("h1")).includes("Birtokbaadás"),
    "a jegyzőkönyv lapja megnyílik",
  );
  all((await tullogas(oldal)) === 0, "a jegyzőkönyv lapja elfér 360 képponton");

  all(
    (await oldal.getByText("Fényképek az állapotról").count()) > 0,
    "a jegyzőkönyvön ott az album",
  );
  all(
    (await oldal.getByText("Konyhapult, a mosogató melletti karcolás").count()) > 0,
    "a példaadat képei megjelennek",
  );

  // A kép tényleg kirajzolódik: a böngésző betöltötte, és van mérete.
  const kepek = oldal.locator('img[src^="/jegyzokonyv-kepek/"]');
  all((await kepek.count()) >= 4, "mind a négy kép ott van az albumban");
  const meret = await kepek.first().evaluate((elem) => ({
    szeles: elem.naturalWidth,
    magas: elem.naturalHeight,
  }));
  all(meret.szeles > 0 && meret.magas > 0, "a kép tényleg betöltődik, nem törött hivatkozás");

  all(
    (await oldal.getByText(/mindkét fél elismerte/).count()) > 0,
    "a megerősített kép állapota látszik",
  );
  all(
    (await oldal.getByText(/Ez a folt a beköltözéskor/).count()) > 0,
    "a kifogás szövege ott van a kép mellett, nem tünteti el a képet",
  );

  // A bérbeadó a saját képére nem bólinthat rá.
  const sajatKartya = oldal.locator("li", { hasText: "Fürdőszoba, a kád melletti csempe" }).first();
  all(
    (await sajatKartya.getByRole("button", { name: "Ezt láttam, megerősítem" }).count()) === 0,
    "a saját képét a bérbeadó nem erősítheti meg",
  );

  // A bérlő képét viszont igen: az a másik fél állítása.
  const berloiKartya = oldal
    .locator("li", { hasText: "Előszoba, a beépített szekrény ajtaja" })
    .first();
  all(
    (await berloiKartya.getByRole("button", { name: "Ezt láttam, megerősítem" }).count()) > 0,
    "a bérlő képét a bérbeadó megerősítheti",
  );

  return ut;
}

async function feltoltes(oldal, jegyzokonyvUt) {
  await oldal.goto(`${ALAP}${jegyzokonyvUt}`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  const urlap = oldal.locator('form:has(input[name="kep"])').first();
  await urlap.locator('input[name="megnevezes"]').fill(`Erkély, a korlát töve ${EGYEDI}`);
  await urlap.locator('input[name="kep"]').setInputFiles({
    name: "erkely.png",
    mimeType: "image/png",
    buffer: pngBajtok(),
  });
  await urlap.getByRole("button", { name: "Kép hozzáadása" }).click();
  await oldal.getByText("A kép bekerült az albumba.").first().waitFor({ timeout: 20000 });
  all(true, "új kép feltölthető");

  await oldal.goto(`${ALAP}${jegyzokonyvUt}`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all(
    (await oldal.getByText(`Erkély, a korlát töve ${EGYEDI}`).count()) > 0,
    "a feltöltött kép megjelenik az albumban",
  );

  // Amit a böngésző képnek mond, de nem az: a tartalmát nézzük, nem a bemondást.
  const alcazott = oldal.locator('form:has(input[name="kep"])').first();
  await alcazott.locator('input[name="megnevezes"]').fill("Nem kép");
  await alcazott.locator('input[name="kep"]').setInputFiles({
    name: "alcazott.png",
    mimeType: "image/png",
    buffer: Buffer.from("<html><script>alert(1)</script></html>", "utf8"),
  });
  await alcazott.getByRole("button", { name: "Kép hozzáadása" }).click();
  await oldal.getByText(/nem az, aminek mondja magát/).first().waitFor({ timeout: 20000 });
  all(true, "a képnek álcázott fájlt elutasítjuk, akármit mond a böngésző");
}

/** Az album fejlécéből kiolvasott megerősítésszám. */
async function megerositettekSzama(oldal) {
  const szoveg = await oldal.textContent("main");
  const talalat = /ebből (\d+) megerősítve/.exec(szoveg);
  return talalat ? Number(talalat[1]) : null;
}

async function berloiOldal(oldal) {
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo/jegyzokonyvek`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  all((await tullogas(oldal)) === 0, "a bérlői képes lap elfér 360 képponton");
  all(
    (await oldal.getByText("Fürdőszoba, a kád melletti csempe").count()) > 0,
    "a bérlő látja a bérbeadó képeit",
  );
  all(
    (await oldal.getByText(/A jegyzőkönyv még tervezet/).count()) > 0,
    "a bérlő a tervezet képeit is látja, mert a megerősítés ekkor ér valamit",
  );

  const elotte = await megerositettekSzama(oldal);
  all(elotte !== null, "az album fejléce számot ad a képek állapotáról");

  // A menet saját képét erősíti meg, nem a példaadatét: így a próba
  // újrafuttatható anélkül, hogy előbb újra kellene tölteni a példaadatot.
  const kartya = oldal.locator("li", { hasText: `Erkély, a korlát töve ${EGYEDI}` }).first();
  all(
    (await kartya.getByRole("button", { name: "Ezt láttam, megerősítem" }).count()) > 0,
    "a bérbeadó friss képe a bérlő megerősítésére vár",
  );
  await kartya.getByRole("button", { name: "Ezt láttam, megerősítem" }).click();

  // A visszajelzés nem múló üzenet, hanem maga az állapot: a kártya átkerül a
  // rendezettek közé, és a fejléc száma nő. Ugyanaz az elv, mint a
  // befizetéseknél — ami el van intézve, az nem áll elöl.
  await oldal
    .getByText(new RegExp(`ebből ${elotte + 1} megerősítve`))
    .first()
    .waitFor({ timeout: 20000 });
  all(true, "a bérlő megerősítheti a bérbeadó képét, és a fejléc azonnal mutatja");

  await oldal.goto(`${ALAP}/berlo/jegyzokonyvek`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  const ujra = oldal.locator("li", { hasText: `Erkély, a korlát töve ${EGYEDI}` }).first();
  all(
    (await ujra.getByRole("button", { name: "Ezt láttam, megerősítem" }).count()) === 0,
    "amit megerősített, azt nem kell újra",
  );
  all(
    (await ujra.getByText(/mindkét fél elismerte/).count()) > 0,
    "a megerősítés a kép mellett is látszik, újratöltés után is",
  );

  // Kifogás indoklás nélkül nem megy: abból a másik fél nem tud kiindulni.
  const berloiSajat = oldal
    .locator("li", { hasText: "Előszoba, a beépített szekrény ajtaja" })
    .first();
  all(
    (await berloiSajat.getByRole("button", { name: "Ezt láttam, megerősítem" }).count()) === 0,
    "a bérlő a saját képére sem bólinthat rá",
  );
}

async function kivulallo(oldal) {
  const kepUt = await oldal
    .locator('img[src^="/jegyzokonyv-kepek/"]')
    .first()
    .getAttribute("src");

  await kilep(oldal);
  const valasz = await oldal.request.get(`${ALAP}${kepUt}`);
  all(valasz.status() === 403, "belépés nélkül a kép nem tölthető le");
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  const ut = await berbeadoiAlbum(oldal);
  await feltoltes(oldal, ut);
  await berloiOldal(oldal);
  await kivulallo(oldal);
}
