/**
 * Rezsielszámolás: csatornadíj, kettős terhelés, óraállás-védelem.
 *
 * Amit ez a próba megfog, és más nem: a felületen készített elszámolásba
 * tényleg bekerül a csatornadíj sora, a saját összegével, és a végösszeg a
 * kiírt sorok összege. A domain tesztje a számítást nézi, de azt nem, hogy a
 * kiszolgálói művelet végigviszi-e a díjszabásból a tételig.
 *
 * A próba minden futáskor új tervezetet készít, ami rendben van: a tervezet a
 * bérbeadó saját lapján áll, és a lista összecsukva mutatja a régebbieket.
 */

import { ALAP, all, belep, magyarra, tullogas } from "./kozos.mjs";


export const nev = "Rezsielszámolás";

/** „12 345 Ft" alakú szövegből egész forint. */
function forint(szoveg) {
  const talalat = szoveg.match(/-?[\d   ]+(?=\s*Ft)/);
  if (!talalat) return null;
  return Number(talalat[0].replace(/[  \s]/g, ""));
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  await oldal.goto(`${ALAP}/rezsi`);
  await oldal.waitForLoadState("networkidle");

  all((await tullogas(oldal)) <= 1, "a rezsi lapja elfér 360 képponton");

  all(
    await oldal.getByText(/csatornadíj 426 Ft\/m3/).first().isVisible(),
    "a díjszabás kiírja a csatornadíj egységárát is",
  );

  // Elszámolás készítése az első jogviszonyra, a lap felkínálta időszakra.
  const urlap = oldal.locator('form:has(button:text("Elszámolás készítése"))').first();
  all((await urlap.count()) > 0, "van űrlap elszámolás készítéséhez");
  await urlap.getByRole("button", { name: "Elszámolás készítése" }).click();
  await oldal.waitForLoadState("networkidle");

  // A tétel egy listaelem: a neve, az összege és a részletezése egy <li>-ben.
  // A mérőóra neve lehet „Víz" vagy „Víz (almérő)", ezért csak a toldatra
  // keresünk, de listaelemre szűkítve, hogy ne az egész lapot kapjuk el. A
  // legfrissebb elszámolás áll elöl, tehát az elsőt nézzük: a régebbiekben a
  // korábbi díjszabás szövege áll, és annak is úgy kell maradnia.
  const csatornaSor = oldal.locator("li").filter({ hasText: /· csatornadíj/ }).first();
  await csatornaSor.waitFor({ timeout: 15000 });
  all(true, "az elszámolásban külön sor a csatornadíj");

  const sorSzovege = await csatornaSor.innerText();
  all(
    /A csatornadíj a mért vízfogyasztás után jár/.test(sorSzovege),
    "a csatornadíj sora megmondja, mi után jár",
  );

  const csatornaFt = forint(sorSzovege);
  all(csatornaFt !== null && csatornaFt > 0, `a csatornadíjnak saját összege van (${csatornaFt} Ft)`);

  // A vízdíjat ugyanabból az elszámolásból vesszük, nem a lapról: a régebbi
  // elszámolások más egységárral készültek, és két elszámolás sorait
  // összevetni semmit nem bizonyítana.
  const ugyanaz = csatornaSor.locator("xpath=..");
  const vizFt = forint(
    await ugyanaz
      .locator("li")
      .filter({ hasText: /m3, \d+ nap\./ })
      .filter({ hasNotText: "csatornadíj" })
      .first()
      .innerText(),
  );
  all(
    vizFt !== null && vizFt > 0 && vizFt !== csatornaFt,
    `a vízdíj külön sor, más összeggel (${vizFt} Ft)`,
  );

  // A kettő aránya a két egységár aránya: 426/373. Ha a csatornadíj valaha a
  // vízdíjba olvadna, vagy ugyanazt az árat kapná, ez az állítás bukna.
  all(
    Math.abs(csatornaFt / vizFt - 426 / 373) < 0.01,
    "a két sor aránya a két egységár aránya",
  );

  // ——— A közös költség nincs kétszer terhelve ———
  //
  // Ez a mérés arról szól, ami hónapokig igaz volt: a közös költség havi
  // előírásként ment a befizetések lapra, és az elszámolásban is ott állt egy
  // sorként. A lap mindkettőt hibátlanul mutatta, tehát semmi nem szólt —
  // a bérlő viszont ugyanazt kétszer fizette.
  const elszamolasSzoveg = await ugyanaz.innerText();
  all(
    !/Közös költség/.test(elszamolasSzoveg),
    "az elszámolásban nincs közös költség: azt a havi előírás viszi",
  );
  all(
    !/Rezsiátalány/.test(elszamolasSzoveg),
    "és rezsiátalány sincs benne, ugyanezért",
  );

  // ——— Átalányos bérletre nem készül tételes elszámolás ———
  //
  // A szerződés kimondja, hogy átalánynál a felek tételesen nem számolnak el;
  // az app mégis kínálta az űrlapot, és ki is adta az elszámolást.
  const atalanyos = oldal
    .locator("section")
    .filter({ hasText: /Rezsi elszámolása átalánnyal/ })
    .first();
  all((await atalanyos.count()) > 0, "van átalánnyal elszámoló bérlet a példaadatban");
  all(
    (await atalanyos.locator('button:text("Elszámolás készítése")').count()) === 0,
    "átalányos bérletnél nincs elszámolás-készítő gomb",
  );
  all(
    /nincs mit mérni/.test(await atalanyos.innerText()),
    "és a lap meg is mondja, miért nincs",
  );

  // ——— Óraállás: jövőbeli nap és a szomszédokhoz mérés ———
  //
  // A visszakeltezett, nagyobb állás a rákövetkező időszak fogyasztását
  // nullára vitte, egy irreálisan nagy állás pedig bebetonozta a mérőt: onnantól
  // minden valódi leolvasás kisebb volt, tehát elutasításra futott.
  const oraUrlap = oldal.locator('form:has(button:text("Óraállás rögzítése"))').first();
  all((await oraUrlap.count()) > 0, "van óraállás-rögzítő űrlap");

  /**
   * Óraállás beküldése, és megvárva az, amit a lap **utána** mond.
   *
   * A művelet válaszára várni itt nem elég: a válasz megérkezik, a React
   * viszont csak utána cseréli ki a visszajelző sávot, tehát a nyomban
   * kiolvasott lapszöveg még az előző beküldés üzenetét adja vissza. Ezért a
   * várt mondatra várunk, határidővel: ha nem jön meg, az valódi hiba.
   */
  async function oraallast(datum, ertek, vart) {
    await oraUrlap.locator('input[name="datum"]').fill(datum);
    await oraUrlap.locator('input[name="ertek"]').fill(String(ertek));
    await oraUrlap.getByRole("button", { name: "Óraállás rögzítése" }).click();
    return oraUrlap
      .getByText(vart)
      .first()
      .waitFor({ timeout: 15000 })
      .then(() => true, () => false);
  }

  const holnap = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  all(
    await oraallast(holnap, 999999, /Jövőbeli napra nem lehet óraállást rögzíteni/),
    "jövőbeli napra nem rögzíthető óraállás",
  );

  // Visszakeltezett állás, ami nagyobb a következő leolvasásnál: elutasítva.
  all(
    await oraallast("2000-01-01", 9999999, /Az óra nem forog visszafelé/),
    "a visszakeltezett, a későbbinél nagyobb állás elutasítva",
  );

  // A kétértelmű alak: a »23.929« ezres tagolás vagy tizedes? Nem tippelünk.
  // Ebből lett korábban ezerszeres hiba: a jegyzőkönyvi »12.345 kWh«
  // 12,345-ként került a mérőóra történetébe, és az lett az első
  // rezsielszámolás nyitóállása.
  all(
    await oraallast(
      new Date().toISOString().slice(0, 10),
      "23.929",
      /nem tudom biztosan olvasni/,
    ),
    "a kétértelmű »23.929« állást nem tippeljük meg",
  );

  // Amiben mértékegység is van, azt viszont kiolvassuk: a helyszínen így írják.
  all(
    await oraallast(
      new Date().toISOString().slice(0, 10),
      "23929,5 kWh",
      /Óraállás rögzítve|Az óra nem forog visszafelé|nagyobb/,
    ),
    "a mértékegységgel beírt állásból kiolvassuk a számot",
  );

  // Önpróba: a fenti két elutasítás nem azért jött, mert az űrlap sosem megy
  // át. Egy szabályos, mai leolvasás egy egységgel a legutolsó fölött rögzül —
  // és a **hatását** nézzük, nem a visszajelző sávot: a lap újratöltve az új
  // állást mutatja.
  const oraSor = await oraUrlap.locator("xpath=..").innerText();
  const allasSzam = /(\d+(?:[.,]\d+)?)\s*(kWh|m3|m³)/.exec(oraSor);
  all(allasSzam !== null, "a lap kiírja a mérő legutolsó állását");

  const ujAllas = Math.round(Number((allasSzam?.[1] ?? "0").replace(",", ".")) + 1);
  await oraallast(new Date().toISOString().slice(0, 10), ujAllas, /Óraállás rögzítve/);
  await oldal.goto(`${ALAP}/rezsi`);
  await oldal.waitForLoadState("networkidle");
  const ujSor = await oldal
    .locator('form:has(button:text("Óraállás rögzítése"))')
    .first()
    .locator("xpath=..")
    .innerText();
  all(
    ujSor.includes(`${ujAllas} ${allasSzam?.[2] ?? ""}`),
    `önpróba: a szabályos óraállás viszont rögzül (${ujAllas})`,
  );
}
