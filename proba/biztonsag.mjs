/**
 * Két kapu, amit csak futó alkalmazáson lehet megmérni.
 *
 * 1. A meghívó nem köthet **meglévő fiókot** a jogviszonyhoz a fiók gazdája
 *    nélkül. A linket a bérbeadó is birtokolja, tehát az elfogadás önmagában
 *    nem bizonyít semmit: a meglévő jelszó az, ami a fiók gazdájától jön.
 * 2. A **lezárt** jogviszonyt nem lehet újra lezárni. A második lezárás
 *    korábbi véget is kaphatna, az pedig már egyeztetett előírt tételeket
 *    törölne.
 * 3. A **visszakeltezett** lezárás nem nyitja meg az értékelési ablakot. A
 *    harminc nap attól számít, hogy a lezárás mikor került be, nem attól,
 *    milyen napot írtak be — különben a bérbeadó a saját értékelése nélkül
 *    olvashatná el a bérlőét.
 *
 * Mindkettő a kiszolgálón dől el, nem a gomb elrejtésén, ezért mindkettőt
 * **valódi űrlappal** próbáljuk: a rejtett mezőbe idegen azonosítót írunk,
 * pont úgy, ahogy egy böngészőben bárki megtehetné. A gomb hiánya semmit nem
 * bizonyítana.
 */

import { ALAP, JELSZO, all, belep, kilep, magyarra, mindetKinyit } from "./kozos.mjs";

export const nev = "Biztonsági kapuk";

function napot(elteres) {
  const most = new Date();
  const nap = new Date(
    Date.UTC(most.getUTCFullYear(), most.getUTCMonth(), most.getUTCDate() + elteres),
  );
  return nap.toISOString().slice(0, 10);
}

async function berlokLapja(oldal) {
  await oldal.goto(`${ALAP}/berlok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  // --- 1. A lezárt jogviszony nem zárható le másodszor
  await berlokLapja(oldal);

  const lezarok = oldal.locator('form:has(input[name="vege"])');
  const eloDarab = await lezarok.count();
  all(eloDarab >= 2, "legalább két élő jogviszony van a példaadatban");

  const elso = lezarok.first();
  const elsoId = await elso.locator('input[name="jogviszonyId"]').inputValue();

  // Önpróba: maga a lezárás működik. Enélkül a lenti elutasítás semmit nem
  // mondana — egy űrlap, ami soha nem megy át, mindenre nemet mond. A hatást
  // nézzük, nem a visszajelző sávot: sikeres lezárás után a kártya a
  // visszavonó gombra vált, és a lezáró űrlap az üzenetével együtt eltűnik.
  await elso.locator('input[name="vege"]').fill(napot(0));
  await elso.getByRole("button", { name: "Lezárom" }).click();
  await oldal.waitForTimeout(1500);

  await berlokLapja(oldal);
  all(
    (await oldal.locator('form:has(input[name="vege"])').count()) === eloDarab - 1,
    "önpróba: a nyitott jogviszony lezárása átmegy, és a lezáró űrlap eltűnik",
  );
  const lezarasSzovege = await oldal
    .getByText(/Lezárva .* napjával/)
    .first()
    .textContent();
  all(Boolean(lezarasSzovege), "a lezárt jogviszony kiírja, melyik nappal zárult");

  // A maradék űrlap rejtett mezőjét átírjuk a már lezárt jogviszonyra, és
  // visszakeltezzük. Ez az a támadás, ami ellen a kiszolgálón van a szabály.
  const maradek = oldal.locator('form:has(input[name="vege"])').first();
  await maradek
    .locator('input[name="jogviszonyId"]')
    .evaluate((elem, ertek) => {
      elem.value = ertek;
    }, elsoId);
  await maradek.locator('input[name="vege"]').fill(napot(-60));
  await maradek.getByRole("button", { name: "Lezárom" }).click();
  await oldal.waitForTimeout(1500);
  all(
    (await oldal.getByText(/már le van zárva/).count()) > 0,
    "a kiszolgáló a lezárt jogviszony újralezárását elutasítja",
  );

  await berlokLapja(oldal);
  all(
    (await oldal.locator('form:has(input[name="vege"])').count()) === eloDarab - 1,
    "az elutasítás a saját jogviszonyát sem zárta le",
  );
  all(
    (await oldal.getByText(/Lezárva .* napjával/).first().textContent()) === lezarasSzovege,
    "a visszakeltezés nem írta át a lezárás napját",
  );

  // Visszavonjuk, hogy a példaadat úgy maradjon, ahogy találtuk.
  await oldal.getByRole("button", { name: "Mégis él" }).first().click();
  await oldal.waitForTimeout(1500);

  // --- 2. A meghívó nem köt hozzá idegen fiókot
  await berlokLapja(oldal);

  // Az űrlapra szűrünk, nem a kártyára: a bérlősor `li`-je egy másik `li`-ben
  // ül, és a bérlőadatok űrlapjának is van e-mail mezője.
  const meghivoUrlap = oldal.locator("form").filter({ hasText: /meghívó készítése/i }).first();
  all((await meghivoUrlap.count()) > 0, "van fiók nélküli bérlő a példaadatban");
  const berloNeve = (
    await meghivoUrlap.locator("xpath=ancestor::li[1]").locator("h3").first().textContent()
  ).trim();

  // A bérbeadó egy **létező** fiók címére készít meghívót. Innentől a link az
  // ő kezében van: ha az elfogadás egymagában kötne, Anna fiókja a bérbeadó
  // jogviszonyára kerülne anélkül, hogy Anna bármit mondott volna.
  await meghivoUrlap.locator('input[name="email"]').fill("anna@pelda.hu");
  await meghivoUrlap.getByRole("button", { name: /meghívó készítése/i }).click();
  await oldal.waitForTimeout(1500);

  // Az űrlapot újra megkeressük: a gomb felirata időközben „Új meghívó
  // készítése" lett, és a régi találat már nem erre a szövegre illeszkedik.
  const linkek = await oldal
    .locator("form")
    .filter({ hasText: /meghívó készítése/i })
    .first()
    .locator("input[readonly]")
    .evaluateAll((elemek) => elemek.map((elem) => elem.value).filter((ertek) => ertek.includes("/meghivo/")));
  all(linkek.length > 0, "a meghívó linkje megjelenik a bérbeadónál");
  const meghivoLink = linkek[0];

  await oldal.goto(meghivoLink);
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.getByText(/már van fiókod/).count()) > 0,
    "a lap előre kimondja, hogy meglévő fiókhoz a meglévő jelszó kell",
  );

  await oldal.fill('input[name="nev"]', "Idegen Probalkozo");
  await oldal.fill('input[name="jelszo"]', "nemazovejelszo2026");
  await oldal.fill('input[name="jelszoUjra"]', "nemazovejelszo2026");
  await oldal.getByRole("button", { name: /Fiók készítése/ }).click();
  await oldal.waitForTimeout(1500);

  all(
    new URL(oldal.url()).pathname.startsWith("/meghivo/"),
    "a rossz jelszó nem lépteti be azt, aki a linket megnyitotta",
  );
  all(
    (await oldal.getByText(/A megadott jelszó nem jó/).count()) > 0,
    "a kiszolgáló elutasítja az idegen fiók hozzákötését",
  );

  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await berlokLapja(oldal);
  const utana = oldal
    .locator("h3")
    .filter({ hasText: berloNeve })
    .first()
    .locator("xpath=ancestor::li[1]");
  all(
    (await utana.getByText("Még nincs fiókja").count()) > 0,
    "a fiók a gazdája jelszava nélkül nem került a jogviszonyhoz",
  );

  // Önpróba: a saját jelszavával a fiók gazdája elfogadhatja. Enélkül egy
  // örökké elutasító út is zöld lenne, és a valódi bérlő nem tudna belépni.
  await kilep(oldal);
  await oldal.goto(meghivoLink);
  await oldal.waitForLoadState("networkidle");
  await oldal.fill('input[name="nev"]', "Kovács Anna");
  await oldal.fill('input[name="jelszo"]', JELSZO);
  await oldal.fill('input[name="jelszoUjra"]', JELSZO);
  await oldal.getByRole("button", { name: /Fiók készítése/ }).click();
  await oldal.waitForTimeout(2000);
  all(
    new URL(oldal.url()).pathname === "/berlo",
    "önpróba: a saját jelszavával a fiók gazdája elfogadhatja a meghívót",
  );

  // --- 3. A visszakeltezett lezárás nem nyitja meg az értékelési ablakot
  //
  // A bérbeadó Mártonról már írt, Márton még nem írt a bérbeadóról. Ha a
  // bérlet lezárását hatvan nappal visszakeltezve rögzítené, a harminc napos
  // ablak lejártnak látszana: a bérbeadó szövege felfedődne, Márton írási
  // lehetősége pedig egy kattintással elveszne. Ezért az ablak nem attól
  // számít, milyen napot írtak be, hanem attól, mikor került be a lezárás.
  const MARTON_MONDATA = "Mártonnal a közös költség elszámolása körül";

  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/ertekelesek`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all(
    (await oldal.content()).includes(MARTON_MONDATA),
    "önpróba: a bérbeadó a saját szövegét látja, tehát a keresett mondat megtalálható",
  );

  await belep(oldal, "marton@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/ertekelesek`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all(
    !(await oldal.content()).includes(MARTON_MONDATA),
    "kiindulás: Márton a lap forrásában sem látja a róla szóló szöveget",
  );
  all(
    (await oldal.locator('textarea[name="szoveg"]').count()) > 0,
    "kiindulás: Márton írhatja a sajátját",
  );

  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await berlokLapja(oldal);
  const zugloi = oldal
    .locator("h2")
    .filter({ hasText: "Zuglói kislakás" })
    .first()
    .locator("xpath=ancestor::li[1]");
  await zugloi.getByRole("button", { name: "Mégis él" }).click();
  await oldal.waitForTimeout(1500);

  await berlokLapja(oldal);
  const ujraZugloi = oldal
    .locator("h2")
    .filter({ hasText: "Zuglói kislakás" })
    .first()
    .locator("xpath=ancestor::li[1]");
  await ujraZugloi.locator('input[name="vege"]').fill(napot(-60));
  await ujraZugloi.getByRole("button", { name: "Lezárom" }).click();
  await oldal.waitForTimeout(2000);

  await belep(oldal, "marton@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/ertekelesek`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all(
    !(await oldal.content()).includes(MARTON_MONDATA),
    "a visszakeltezett lezárás sem fedi fel a másik fél szövegét",
  );
  all(
    (await oldal.locator('textarea[name="szoveg"]').count()) > 0,
    "és nem is veszi el Mártontól a saját értékelése megírását",
  );
}
