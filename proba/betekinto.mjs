/**
 * Betekintő nézet végigjátszva.
 *
 * Két dolgot csak futtatással lehet ellenőrizni. Az egyik, hogy a nyilvános
 * oldal tényleg belépés nélkül nyílik: ez a lényege. A másik, hogy nem szivárog
 * ki rajta olyasmi, aminek nincs ott helye — a bérbeadó neve, a pontos cím, a
 * lakótárs neve. Ezt a szótárkulcsokból nem lehet látni, csak a kész oldalon.
 */

import { ALAP, SZELESSEG, all, belep, kilep, magyarra, tullogas } from "./kozos.mjs";

export const nev = "Betekintő nézet";

/** Forintösszeg az oldalon. A tagolás nem törő szóköz, ezért `\s`, nem " ". */
const OSSZEG = /\d\s?\d{3}\s?Ft/;

/** Amit a nyilvános oldal soha nem mutathat, a példaadatból. */
const TILTOTT = [
  "Kovács Péter", // a bérbeadó neve
  "Ferencvárosi", // az ingatlan megnevezése
  "Szabó Tamás", // a másik bérlő
  "berbeado@pelda.hu",
  "+36 1 000 0000",
];

export async function futtat(oldal) {
  // --- A bérlő oldala
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo/betekinto`);
  all(
    (await oldal.getByText("Anyáéknak, hogy lássák").count()) > 0,
    "a bérlő látja a korábban kiadott betekintőjét",
  );
  all(
    (await oldal.getByText("Még nem nyitották meg").count()) > 0,
    "a megnyitások száma induláskor nulla",
  );

  // A próba a saját linkjét adja ki, és azt is vonja vissza. Így akárhányszor
  // lefuttatható ugyanazon az adatbázison, és a példaadat linkje érintetlen marad.
  const cel = `Próba ${Date.now()}`;
  const urlap = oldal.locator('form:has(input[name="cel"])');
  await urlap.locator('input[name="cel"]').fill(cel);
  await urlap.locator('select[name="napok"]').selectOption("30");
  await urlap.getByRole("button", { name: "Betekintő készítése" }).click();
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.getByText("A linket alább másolhatod ki").count()) > 0,
    "az új betekintő elkészül",
  );
  await oldal.reload();
  const sajat = oldal.locator("li", { hasText: cel }).first();
  all((await sajat.count()) > 0, "az új betekintő megjelenik a listán");

  const link = (await sajat.locator("p.font-mono").textContent()).trim();
  const token = link.replace("/betekinto/", "");
  all(token.length > 20, "a lista kiírja a kimásolható linket");

  // --- A nyilvános oldal belépés nélkül
  await kilep(oldal);
  await oldal.goto(`${ALAP}/betekinto/${token}`);
  all(
    (await oldal.getByRole("heading", { name: /Kovács Anna bérleménye/ }).count()) > 0,
    "a nyilvános oldal belépés nélkül nyílik",
  );
  all(
    (await oldal.getByText(/hónapra volt esedékes fizetnivaló/).count()) > 0,
    "a fizetési előzmény mondatai megjelennek",
  );
  all(
    (await oldal.getByText(/a bérbeadó maga rögzített/).count()) > 0,
    "kimondja, hogy az adat a bérbeadó saját rögzítéséből jön",
  );
  all(
    (await oldal.getByText(/Pontszámot szándékosan nem adunk/).count()) > 0,
    "kimondja, hogy nem ad pontszámot",
  );
  all(
    (await oldal.getByText("A bérlemény települése: Budapest").count()) > 0,
    "a település látszik, a pontos cím nem",
  );

  // Ez a próba azért van, mert a nézet egyszer már egy olyan táblát olvasott,
  // amibe soha semmi nem írt: a szöveg hibátlanul jelent meg, csak épp minden
  // hónapra azt mondta, hogy nem érkezett befizetés. Egy "a lap betöltődik"
  // próba ezt nem fogja meg, egy szám viszont igen.
  const osszefoglalo = await oldal.textContent("body");
  const hataridore = osszefoglalo.match(/Ebből (\d+) hónapban a határidőig/);
  all(hataridore !== null, "a nyilvános oldal kiírja a határidőre érkezett hónapokat");
  all(
    hataridore !== null && Number(hataridore[1]) > 0,
    `a példaadaton van határidőre érkezett befizetés (most: ${hataridore?.[1]})`,
  );

  const esedekes = osszefoglalo.match(/Eddig (\d+) hónapra volt esedékes/);
  all(
    esedekes !== null && Number(esedekes[1]) > 6,
    `a nézet a teljes jogviszonyt látja, nem csak pár hónapot (most: ${esedekes?.[1]})`,
  );

  const tobblet = await tullogas(oldal);
  all(tobblet <= 1, `a nyilvános oldal elfér ${SZELESSEG} képponton (túllógás: ${tobblet}px)`);

  const szoveg = await oldal.textContent("body");
  for (const tiltott of TILTOTT) {
    all(!szoveg.includes(tiltott), `a nyilvános oldalon nem szerepel: ${tiltott}`);
  }

  // A betekintőt az kapja meg, aki a bérleményt fizeti: összeg nélkül semmit
  // nem ér neki. Ezért az összeg alapból látszik, és ezt a próba is kiköti.
  //
  // A mintában szándékosan van `\s`: a magyar forintalak nem sima szóközzel
  // tagol, hanem nem törő szóközzel. A korábbi `" Ft"` keresés emiatt akkor is
  // igazat adott, amikor az összeg ott volt — vagyis semmit nem ellenőrzött.
  all(OSSZEG.test(szoveg), "az összegek alapból látszanak");
  all(
    (await oldal.getByRole("heading", { name: "Hol tart most" }).count()) > 0,
    "a nyilvános oldal a mostani állapottal kezd, nem csak az előzménnyel",
  );
  all(
    (await oldal.getByRole("heading", { name: "Hónapról hónapra" }).count()) > 0,
    "van havi bontás, nem csak összesítés",
  );

  // Nem csak a bérleti díj: a közös költséget és a rezsiátalányt ugyanaz fizeti.
  // Anna havi bérleti díja 180 000 Ft, a hónap előírása ennél többnek kell lennie.
  const haviSor = oldal.locator("li", { hasText: "Előírva" }).first();
  const haviSzoveg = await haviSor.textContent();
  const eloirt = Number((haviSzoveg.match(/Előírva:\s*([\d\u00a0\u202f ]+)/) ?? [])[1]?.replace(/\D/g, ""));
  all(
    Number.isFinite(eloirt) && eloirt > 180000,
    `a havi összeg a bérleti díjon felül a közös költséget is tartalmazza (most: ${eloirt})`,
  );

  // --- A megnyitás visszajut a bérlőhöz
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo/betekinto`);
  all(
    (await oldal
      .locator("li", { hasText: cel })
      .first()
      .getByText(/Megnyitva 1 alkalommal/)
      .count()) > 0,
    "a bérlő látja, hogy megnyitották",
  );

  // --- Összeg nélküli link: a kapcsoló tényleg elrejti a számokat
  const celNema = `Próba összeg nélkül ${Date.now()}`;
  const urlapNema = oldal.locator('form:has(input[name="cel"])');
  await urlapNema.locator('input[name="cel"]').fill(celNema);
  await urlapNema.locator('input[name="osszegetMutat"]').uncheck();
  await urlapNema.getByRole("button", { name: "Betekintő készítése" }).click();
  await oldal.waitForLoadState("networkidle");
  await oldal.reload();
  const nemaKartya = oldal.locator("li", { hasText: celNema }).first();
  const nemaToken = (await nemaKartya.locator("p.font-mono").textContent())
    .trim()
    .replace("/betekinto/", "");

  await kilep(oldal);
  await oldal.goto(`${ALAP}/betekinto/${nemaToken}`);
  const nemaSzoveg = await oldal.textContent("body");
  all(!OSSZEG.test(nemaSzoveg), "kikapcsolva egyetlen összeg sem látszik");
  all(
    nemaSzoveg.includes("hónapra volt esedékes fizetnivaló"),
    "összeg nélkül is látszik, hogy áll a bérlemény",
  );

  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo/betekinto`);
  await oldal
    .locator("li", { hasText: celNema })
    .first()
    .getByRole("button", { name: "Visszavonom" })
    .click();
  await oldal.waitForLoadState("networkidle");

  // --- Visszavonás után a link nem nyílik
  await oldal.goto(`${ALAP}/berlo/betekinto`);
  const kartya = oldal.locator("li", { hasText: cel }).first();
  await kartya.getByRole("button", { name: "Visszavonom" }).click();
  await oldal.waitForLoadState("networkidle");

  await kilep(oldal);
  await oldal.goto(`${ALAP}/betekinto/${token}`);
  all(
    (await oldal.getByText(/lejárt vagy visszavonták/).count()) > 0,
    "a visszavont link nem nyílik meg többé",
  );
  all(
    (await oldal.getByText(/Kovács Anna/).count()) === 0,
    "a visszavont linkről semmilyen adat nem szivárog ki",
  );

  // --- Kitalált token sem nyílik
  await oldal.goto(`${ALAP}/betekinto/nincs-ilyen-token`);
  all(
    (await oldal.getByText(/lejárt vagy visszavonták/).count()) > 0,
    "ismeretlen tokenre sem mutat semmit",
  );
}
