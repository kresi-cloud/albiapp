/**
 * Biztonsági kapuk, amiket csak futó alkalmazáson lehet megmérni.
 *
 * 0. A böngészőnek szóló fejlécek megvannak-e (keretbe ágyazás, típuskitalálás,
 *    hivatkozó cím).
 * 1. A **lezárt** jogviszonyt nem lehet újra lezárni. A második lezárás
 *    korábbi véget is kaphatna, az pedig már egyeztetett előírt tételeket
 *    törölne, és az értékelési ablakot is kinyitná visszamenőleg.
 * 2. Meghívót csak **fiók nélküli** helyre készítünk. Ahol már ül valaki, ott
 *    az elfogadás csendben kicserélné a bérlőt egy olyan fiókra, aminek a
 *    bérbeadó ismeri a jelszavát.
 * 3. A meghívó nem köthet **meglévő fiókot** a jogviszonyhoz a fiók gazdája
 *    nélkül. A linket a bérbeadó is birtokolja, tehát az elfogadás önmagában
 *    nem bizonyít semmit: a meglévő jelszó az, ami a fiók gazdájától jön.
 * 4. A **volt bérlő** nem rögzít óraállást a régi lakására.
 * 5. A jogviszonyról **levett bérlő** szála és betekintő linkje is lezárul.
 * 6. A **lakótárs bizonylatát** senki nem írhatja felül.
 * 7. A **visszakeltezett** lezárás nem nyitja meg az értékelési ablakot, és a
 *    visszavont-újra lezárás sem indítja újra: a harminc nap attól számít,
 *    mikor került be az első lezárás. Különben az olvasna a másik szövegéből,
 *    aki a sajátját még meg sem írta.
 *
 * Ami a kiszolgálón dől el, azt valódi űrlappal próbáljuk: a rejtett mezőbe
 * idegen azonosítót írunk, vagy két menetet nyitunk, és az egyik lapja avul el,
 * miközben a másik elvesz tőle valamit. A gomb hiánya semmit nem bizonyítana,
 * és a csatornán kívüli kérés sem: arra a kiszolgálói művelet amúgy is hibát
 * ad, akkor is, ha a szabály nincs megírva.
 *
 * Minden szakasznak van önpróbája: egy kapu, ami mindenre nemet mond, rosszabb
 * a semminél.
 */

import {
  ALAP,
  JELSZO,
  SZELESSEG,
  all,
  belep,
  kilep,
  magyarra,
  mindetKinyit,
} from "./kozos.mjs";

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

/** Megvárja, hogy a lap betöltsön, és kinyitja a összecsukott szakaszait. */
async function lapra(oldal, ut) {
  await oldal.goto(`${ALAP}${ut}`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
}

/** Megvárja, hogy a visszanyitott jogviszony tényleg újra élő legyen. */
async function ujraElo(oldal, eloDarab) {
  for (let probalkozas = 0; probalkozas < 20; probalkozas++) {
    await berlokLapja(oldal);
    if ((await oldal.locator('form:has(input[name="vege"])').count()) === eloDarab) return;
    await oldal.waitForTimeout(500);
  }
  all(false, "a visszavont lezárás után újra élő lett a jogviszony");
}

/**
 * Külön böngészőmenet egy másik felhasználónak.
 *
 * Több próbához két fél kell egyszerre: az egyik lapja nyitva marad, miközben
 * a másik elvesz tőle valamit. Egy menetben ez nem játszható el, mert a süti
 * menetenként egy fiókot tart.
 */
async function masikMenet(oldal, email, jelszo = JELSZO) {
  const kontextus = await oldal
    .context()
    .browser()
    .newContext({ viewport: { width: SZELESSEG, height: 844 } });
  const masik = await kontextus.newPage();
  await masik.goto(`${ALAP}/belepes`);
  await masik.fill('input[name="email"]', email);
  await masik.fill('input[name="jelszo"]', jelszo);
  await masik.getByRole("button", { name: /Belépés|Sign in/ }).click();
  await masik.waitForLoadState("networkidle");
  return { masik, zar: () => kontextus.close() };
}

/**
 * 1. Meghívót csak fiók nélküli helyre.
 *
 * A meghívó elfogadása átírja a hely `berloId`-ját. Ha a helyen már ül valaki,
 * ez csendes csere: a valódi bérlő lekerül a jogviszonyról, a helyére pedig egy
 * olyan fiók ül, aminek a bérbeadó ismeri a jelszavát — és onnantól az erősít
 * meg fényképet, fogad el elszámolást és ír értékelést a bérlő nevében.
 *
 * A felület nem is kínálja fel, ezért a próba a fiók nélküli bérlő űrlapját
 * veszi elő, és a rejtett mezőjébe a fiókkal rendelkező bérlő azonosítóját
 * írja. A gomb hiánya nem védelem.
 */
async function meghivoFiokosHelyre(oldal) {
  await berlokLapja(oldal);

  const jelzo = oldal.locator("span").filter({ hasText: /^Van fiókja$/ }).first();
  all((await jelzo.count()) > 0, "van fiókkal rendelkező bérlő a példaadatban");
  const fiokosKartya = jelzo.locator("xpath=ancestor::li[1]");
  const fiokosNev = (await fiokosKartya.locator("h3").first().textContent()).trim();
  const fiokosId = await fiokosKartya
    .locator('input[name="jogviszonyBerloId"]')
    .first()
    .inputValue();

  const urlap = oldal.locator("form").filter({ hasText: /meghívó készítése/i }).first();
  all((await urlap.count()) > 0, "van fiók nélküli bérlő, akinek az űrlapját elvehetjük");

  await urlap.locator('input[name="jogviszonyBerloId"]').evaluate((elem, ertek) => {
    elem.value = ertek;
  }, fiokosId);
  await urlap.locator('input[name="email"]').fill("idegen@pelda.hu");
  await urlap.getByRole("button", { name: /meghívó készítése/i }).click();
  await oldal.waitForTimeout(1500);

  all(
    (await oldal.getByText(/Ennek a bérlőnek már van fiókja/).count()) > 0,
    "a kiszolgáló elutasítja a fiókos helyre szóló meghívót",
  );

  await berlokLapja(oldal);
  const utana = oldal
    .locator("h3")
    .filter({ hasText: fiokosNev })
    .first()
    .locator("xpath=ancestor::li[1]");
  all(
    (await utana.locator('input[readonly][value*="/meghivo/"]').count()) === 0,
    "a fiókos bérlőhöz nem készült meghívólink",
  );
  all(
    (await utana.getByText(/Élő meghívó/).count()) === 0,
    "a fiókos bérlőnél élő meghívó sem jelent meg",
  );
  // Az önpróbát a következő szakasz adja: ugyanez az űrlap a saját, fiók
  // nélküli helyére tényleg készít meghívót.
}

/** Egy jogviszony kártyája a bérlők lapján, a bérlemény nevéről. */
function jogviszonyKartya(oldal, ingatlanNev) {
  return oldal.locator("li").filter({ hasText: ingatlanNev }).first();
}

/**
 * 4. A volt bérlő nem olvas órát.
 *
 * A lezárt jogviszony mérőórái már a bérbeadóé és a következő bérlőé: egy
 * rögzítés onnantól idegen fogyasztást vinne az elszámolásba, és a záró
 * óraállást is felülírhatná.
 *
 * A próba azt az esetet játssza el, amit egy elrejtett űrlap nem fog meg: a
 * bérlőnél nyitva marad a lap, miközben a bérbeadó lezárja a jogviszonyt.
 * A begépelt adat valódi, a mező nem hazudik — a lap maga avult el.
 */
async function voltBerloOraallasa(oldal) {
  const INGATLAN = "Ferencvárosi garzon";

  await oldal.goto(`${ALAP}/berlo`);
  await oldal.waitForLoadState("networkidle");

  const urlap = oldal.locator('form:has(input[name="merooraId"])').first();
  all((await urlap.count()) > 0, "az élő jogviszony órái megjelennek a bérlőnél");

  // Önpróba: amíg ott lakik, a rögzítés átmegy. Enélkül a lenti elutasítás
  // semmit nem mondana.
  const magasabb = async (novekmeny) => {
    const eddigi = await urlap.locator('input[name="ertek"]').inputValue();
    return String(Number(eddigi || 0) + novekmeny);
  };
  await urlap.locator('input[name="datum"]').fill(napot(0));
  await urlap.locator('input[name="ertek"]').fill("99999");
  await urlap.getByRole("button", { name: "Óraállás rögzítése" }).click();
  await oldal.getByText("Óraállás rögzítve.").first().waitFor({ timeout: 15000 });
  all(true, "önpróba: a bérlő rögzíthet óraállást, amíg ott lakik");

  // A bérbeadó közben lezárja a jogviszonyt. A bérlő lapja nyitva marad.
  const { masik, zar } = await masikMenet(oldal, "berbeado@pelda.hu");
  await lapra(masik, "/berlok");
  const kartya = jogviszonyKartya(masik, INGATLAN);
  await kartya.locator('input[name="vege"]').fill(napot(0));
  await kartya.getByRole("button", { name: "Lezárom" }).click();
  await masik.getByText(/Lezárva .* napjával/).first().waitFor({ timeout: 15000 });
  all(true, "a bérbeadó lezárja a jogviszonyt, miközben a bérlő lapja nyitva van");

  // A bérlő az avult lapon rögzít tovább. Valódi űrlap, valódi értékek.
  await urlap.locator('input[name="ertek"]').fill(await magasabb(500));
  await urlap.getByRole("button", { name: "Óraállás rögzítése" }).click();
  await oldal
    .getByText("Ehhez a mérőórához nincs jogosultságod.")
    .first()
    .waitFor({ timeout: 15000 });
  all(true, "a lezárás után a kiszolgáló elutasítja a volt bérlő óraállását");

  await oldal.reload();
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.locator('form:has(input[name="merooraId"])').count()) === 0,
    "a lezárt jogviszony órái el is tűnnek a bérlő lapjáról",
  );

  // Visszanyitjuk, hogy a következő szakaszok élő jogviszonnyal dolgozzanak.
  await lapra(masik, "/berlok");
  await jogviszonyKartya(masik, INGATLAN)
    .getByRole("button", { name: "Mégis él" })
    .click();
  await jogviszonyKartya(masik, INGATLAN)
    .locator('input[name="vege"]')
    .first()
    .waitFor({ timeout: 15000 });
  await zar();
}

/**
 * 5. A jogviszonyról levett bérlő nem visz magával semmit.
 *
 * A beszélgetés résztvevői sora és a betekintő linkje egyaránt megmarad, ha a
 * bérlő lekerül a jogviszonyról — a bérlemény ügyei viszont onnantól nem rá
 * tartoznak. A levétel nem az ő kattintása volt, tehát nem is számíthatunk
 * arra, hogy ő vonja vissza a linket.
 *
 * Itt nincs mit hazudni az űrlapon: a bérlő a saját, valódi szálát nyitja meg
 * és a saját, valódi linkjét adja ki — csak már nincs joga hozzá.
 */
async function levettBerloNyomai(oldal) {
  const INGATLAN = "Újbudai kétszobás";
  const JEL = String(Date.now()).slice(-6);

  // --- A bérlő indít egy szálat arra a bérleményre
  await lapra(oldal, "/beszelgetesek");
  const urlap = oldal
    .locator("details")
    .filter({ hasText: INGATLAN })
    .locator("form")
    .first();
  all((await urlap.count()) > 0, "a bérlő indíthat szálat az új bérleményére");
  await urlap.locator('input[name="cimzett"]').first().check();
  await urlap.locator('textarea[name="szoveg"]').fill(`Levételi próba, ${JEL}.`);
  await urlap.getByRole("button", { name: "Küldés" }).click();
  await oldal.waitForURL(/\/beszelgetesek\/.+/, { timeout: 15000 });
  const szalUt = new URL(oldal.url()).pathname;
  all(
    await oldal.getByText(`Levételi próba, ${JEL}.`).first().isVisible(),
    "önpróba: a szál megnyílik, és a bérlő olvassa a saját üzenetét",
  );

  // --- És kiad egy betekintőt ugyanarra a bérleményre
  await lapra(oldal, "/berlo/betekinto");
  const cel = `Levételi próba ${JEL}`;
  const betekintoUrlap = oldal.locator('form:has(input[name="cel"])').first();
  await betekintoUrlap.locator('select[name="jogviszonyId"]').selectOption({ label: INGATLAN });
  await betekintoUrlap.locator('input[name="cel"]').fill(cel);
  await betekintoUrlap.getByRole("button", { name: "Betekintő készítése" }).click();

  // A listát újratöltve keressük meg, és várunk rá: a kiszolgálói művelet
  // válasza később ér oda, mint ahogy a hálózat elcsendesedik.
  let token = "";
  for (let probalkozas = 0; probalkozas < 20 && token === ""; probalkozas++) {
    await oldal.waitForTimeout(500);
    await lapra(oldal, "/berlo/betekinto");
    const sajat = oldal.locator("li", { hasText: cel }).first();
    if ((await sajat.count()) === 0) continue;
    const link = await sajat.locator("p.font-mono").first().textContent();
    token = (link ?? "").trim().replace("/betekinto/", "");
  }
  all(token.length > 20, "elkészül a betekintő link az új bérleményre");

  await oldal.goto(`${ALAP}/betekinto/${token}`);
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.getByRole("heading", { name: /bérleménye$/ }).count()) > 0,
    "önpróba: a friss betekintő link megnyílik",
  );

  // --- A bérbeadó leveszi a bérlőt a jogviszonyról
  const { masik, zar } = await masikMenet(oldal, "berbeado@pelda.hu");
  await lapra(masik, "/berlok");
  const kartya = jogviszonyKartya(masik, INGATLAN);
  const fiokosSor = kartya
    .locator("span")
    .filter({ hasText: /^Van fiókja$/ })
    .first()
    .locator("xpath=ancestor::li[1]");
  await fiokosSor.getByRole("button", { name: /levétele a jogviszonyról/ }).click();
  await masik.waitForTimeout(1500);

  // A hatást nézzük, nem a visszajelző sávot: a levett sor a kártyájával együtt
  // tűnik el, és viszi magával az üzenetet is.
  await lapra(masik, "/berlok");
  all(
    (await jogviszonyKartya(masik, INGATLAN)
      .locator("span")
      .filter({ hasText: /^Van fiókja$/ })
      .count()) === 0,
    "a bérbeadó leveszi a bérlőt a jogviszonyról",
  );
  await zar();

  // --- Amit a bérlő ezután lát: semmit
  await lapra(oldal, "/beszelgetesek");
  all(
    (await oldal.locator(`a[href="${szalUt}"]`).count()) === 0,
    "a levett bérlő listájából eltűnik a bérlemény szála",
  );

  await oldal.goto(`${ALAP}${szalUt}`);
  await oldal.waitForLoadState("networkidle");
  all(
    !(await oldal.content()).includes(`Levételi próba, ${JEL}.`),
    "a levett bérlő a szál üzeneteit sem olvassa tovább",
  );

  await oldal.goto(`${ALAP}/betekinto/${token}`);
  await oldal.waitForLoadState("networkidle");
  all(
    (await oldal.getByRole("heading", { name: /bérleménye$/ }).count()) === 0,
    "a levett bérlő betekintő linkje sem mutatja tovább a bérleményt",
  );
}

/** A mai hónap bérleti díjának sora, nyelv- és megjelenésfüggetlen jelzőkön. */
const BERLETI_IDOSZAK = (() => {
  const most = new Date();
  return `${most.getUTCFullYear()}-${String(most.getUTCMonth() + 1).padStart(2, "0")}`;
})();
const BERLETI_DIJ_FT = 180000;

function berletiSor(lap) {
  return lap
    .locator(`li[data-idoszak="${BERLETI_IDOSZAK}"][data-osszeg="${BERLETI_DIJ_FT}"]`)
    .first();
}

/**
 * Az egyik fél oldalát ismert értékre állítja: előbb visszavonja, amit talál,
 * aztán rögzít. Így akárhányadik próba után is ugyanonnan indulunk.
 */
async function oldalatRogzit(lap, ut, visszavonCimke, nyitoCimke, osszeg) {
  await lapra(lap, ut);
  const visszavon = berletiSor(lap).getByText(visszavonCimke);
  if ((await visszavon.count()) > 0) {
    await visszavon.first().click();
    // A visszavonás hatására várunk, nem fix időre. A rögzített kiszolgálói
    // műveletek Postgresen lassabbak, és egy elkésett visszavonás a frissen
    // rögzített oldalt törölte: a próba utána olyan helyen bukott, ahol semmi
    // hiba nem volt. A hatás az, hogy a rögzítő űrlap nyitósora visszajön.
    await berletiSor(lap).getByText(nyitoCimke).first().waitFor({ timeout: 15000 });
    await lapra(lap, ut);
  }
  const sor = berletiSor(lap);
  await sor.getByText(nyitoCimke).click();
  await sor.locator('input[name="osszegFt"]').fill(String(osszeg));
  await sor.getByRole("button", { name: "Rögzítem" }).click();
  await berletiSor(lap).getByText(visszavonCimke).first().waitFor({ timeout: 15000 });
}

/** Egy apró, valódi JPG, amit a tartalomvizsgálat is elfogad. */
const JPG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a" +
    "HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA" +
    "AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
  "base64",
);

/**
 * 6. A lakótárs bizonylatát senki nem írhatja felül.
 *
 * Oldalanként egy bizonylat van, és a bérlői oldal a lakótársaké közösen.
 * Feltöltéskor eddig felülírás történt, és mivel törölni mindenki a magáét
 * tudja, a második feltöltő utána a saját nevén törölhette is: a lakótárs
 * fájlja két kattintással eltűnt. Ezt mondja ki a `bizonylatKeres`-nél is a
 * szabály — egy kapcsoló se tüntesse el csendben a másik fél fájlját.
 *
 * A próba két valódi bérlőmenetet nyit ugyanarra a vitás tételre, és mindkettő
 * a saját űrlapján tölt fel. Hazudni nincs mit: a helyzet magától adódik.
 */
async function lakotarsBizonylata(oldal) {
  const INGATLAN = "Ferencvárosi garzon";
  const EMAIL = "lakotars@pelda.hu";

  // --- A bérbeadó lakótársat vesz fel, és meghívja
  const { masik: berbeado, zar: berbeadotZar } = await masikMenet(oldal, "berbeado@pelda.hu");
  await lapra(berbeado, "/berlok");
  const kartya = jogviszonyKartya(berbeado, INGATLAN);
  const hozzaadas = kartya.locator('form:has(input[name="jogviszonyId"])').first();
  await hozzaadas.locator('input[name="nev"]').fill("Próba Lakótárs");
  await hozzaadas.locator('input[name="email"]').fill(EMAIL);
  await hozzaadas.getByRole("button", { name: "Hozzáadás" }).click();
  await berbeado.waitForTimeout(1500);

  await lapra(berbeado, "/berlok");
  const meghivoUrlap = jogviszonyKartya(berbeado, INGATLAN)
    .locator("form")
    .filter({ hasText: /meghívó készítése/i })
    .first();
  all((await meghivoUrlap.count()) > 0, "a felvett lakótársnak meghívó jár");
  await meghivoUrlap.locator('input[name="email"]').fill(EMAIL);
  await meghivoUrlap.getByRole("button", { name: /meghívó készítése/i }).click();
  await berbeado.waitForTimeout(1500);
  const link = (
    await jogviszonyKartya(berbeado, INGATLAN)
      .locator("input[readonly]")
      .evaluateAll((elemek) =>
        elemek.map((elem) => elem.value).filter((ertek) => ertek.includes("/meghivo/")),
      )
  )[0];
  all(Boolean(link), "a lakótárs meghívólinkje elkészül");
  await berbeadotZar();

  // --- A lakótárs fiókot készít magának
  const kontextus = await oldal
    .context()
    .browser()
    .newContext({ viewport: { width: SZELESSEG, height: 844 } });
  const lakotars = await kontextus.newPage();
  await lakotars.goto(link);
  await lakotars.waitForLoadState("networkidle");
  await lakotars.fill('input[name="nev"]', "Próba Lakótárs");
  await lakotars.fill('input[name="jelszo"]', JELSZO);
  await lakotars.fill('input[name="jelszoUjra"]', JELSZO);
  await lakotars.getByRole("button", { name: /Fiók készítése/ }).click();
  await lakotars.waitForURL(/\/berlo$/, { timeout: 15000 });
  all(true, "a lakótárs fiókja elkészül, és be is lép vele");

  // --- Vitás tétel: a próba a saját kiindulóhelyzetét állítja elő. A
  // befizetés-egyeztetés próbája előtte lefut, és egyezésre hozza a hónapot;
  // bizonylatot viszont csak vitás tételhez fogadunk el.
  await oldalatRogzit(oldal, "/berlo", "Ezt elgépeltem", "Elutaltam, rögzítem", 180000);
  const { masik: vitazo, zar: vitazotZar } = await masikMenet(oldal, "berbeado@pelda.hu");
  await oldalatRogzit(
    vitazo,
    "/befizetesek",
    "Ezt tévedésből rögzítettem",
    "Megérkezett? Rögzítem",
    150000,
  );
  await vitazotZar();

  // --- Az első bérlő feltölti a bizonylatát a vitás tételhez
  const feltoltes = (lap) =>
    lap.locator('form:has(input[name="eloirtTetelId"]):has(input[type="file"])').first();

  await lapra(oldal, "/berlo");
  const elso = feltoltes(oldal);
  all((await elso.count()) > 0, "a vitás tételnél van bizonylatfeltöltés a bérlőnél");
  const tetelId = await elso.locator('input[name="eloirtTetelId"]').inputValue();
  await elso.locator('input[type="file"]').setInputFiles({
    name: "atutalas.jpg",
    mimeType: "image/jpeg",
    buffer: JPG,
  });
  await elso.getByRole("button", { name: "Feltöltöm" }).click();
  await oldal.getByText("Feltöltöttem a bizonylatot.").first().waitFor({ timeout: 20000 });
  all(true, "önpróba: az egyik bérlő bizonylata felmegy");

  // --- A lakótárs ugyanarra a tételre, ugyanarra az oldalra tölt fel
  await lapra(lakotars, "/berlo");
  const masodik = lakotars
    .locator(`form:has(input[name="eloirtTetelId"][value="${tetelId}"]):has(input[type="file"])`)
    .first();
  all((await masodik.count()) > 0, "a lakótárs ugyanazt a vitás tételt látja");
  await masodik.locator('input[type="file"]').setInputFiles({
    name: "masik.jpg",
    mimeType: "image/jpeg",
    buffer: JPG,
  });
  await masodik.getByRole("button", { name: "Feltöltöm" }).click();
  await lakotars
    .getByText(/a lakótársad töltött fel bizonylatot/)
    .first()
    .waitFor({ timeout: 20000 });
  all(true, "a kiszolgáló nem engedi felülírni a lakótárs bizonylatát");

  // A fájl ott is maradt: a feltöltő nevén, letölthetően.
  await lapra(oldal, "/berlo");
  all(
    (await oldal.locator('[data-oldal="kuldo"] a[href^="/bizonylatok/"]').count()) > 0,
    "az első bérlő bizonylata a helyén maradt",
  );

  await kontextus.close();
}

/**
 * 7. Böngészőnek szóló fejlécek.
 *
 * A `frame-ancestors` azért kell, mert az alkalmazás minden művelete űrlapos:
 * egy láthatatlan keretbe ágyazott „Lezárom" vagy „Visszavonom" gomb a belépett
 * felhasználó nevében futna le. A `nosniff` a feltöltött bizonylatot és
 * fényképet védi, a `Referrer-Policy` pedig a betekintő tokenjét, ami magában a
 * címben utazik.
 *
 * Ezt csak futó kiszolgálón lehet megnézni: a `next.config.ts` beállítását sem
 * a típusellenőrzés, sem a fordítás nem méri ki.
 */
async function fejlecek(oldal) {
  const valasz = await oldal.goto(`${ALAP}/belepes`);
  const fej = valasz.headers();
  all(
    (fej["content-security-policy"] ?? "").includes("frame-ancestors 'none'"),
    "a lapot nem lehet idegen keretbe ágyazni",
  );
  all(fej["x-frame-options"] === "DENY", "a régi böngészőknek szóló tiltás is ott van");
  all(fej["x-content-type-options"] === "nosniff", "a böngésző nem talál ki fájltípust");
  all(
    (fej["referrer-policy"] ?? "").startsWith("strict-origin"),
    "a betekintő címe nem megy ki hivatkozóként",
  );
  all(
    (fej["strict-transport-security"] ?? "").includes("max-age="),
    "a HTTPS-en maradást is kimondjuk",
  );
}

/**
 * 7. A lezárás dátuma nem mozgatja az értékelési ablakot.
 *
 * A bérbeadó Mártonról már írt, Márton még nem írt a bérbeadóról. Két úton
 * lehetne ebből előnyt kovácsolni, és mindkettő a bérbeadó kezében van: a
 * lezárást visszakeltezni, hogy az ablak lejártnak látsszon, vagy visszavonni
 * és újra lezárni, hogy új harminc nap induljon. Az első a másik fél szövegét
 * fedné fel idő előtt, a második annak adna új írási lehetőséget, aki a
 * másikét már elolvasta.
 */
export async function ertekelesiAblak(oldal) {
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

  const hatralevo = async () => {
    const szoveg = await oldal
      .getByText(/Még \d+ napig írhatsz/)
      .first()
      .textContent();
    return Number(szoveg.match(/\d+/)[0]);
  };
  const eredetiHatra = await hatralevo();
  all(eredetiHatra > 0 && eredetiHatra < 30, `az ablakból ${eredetiHatra} nap van hátra`);

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

  // És a harminc nap sem indul újra. A visszavonás-újralezárás enélkül
  // tetszőleges sokszor meghosszabbítaná az ablakot, és ha közben letelt
  // volna, annak adna új írási lehetőséget, aki a másikét már elolvasta.
  const ujHatra = await hatralevo();
  all(
    ujHatra <= eredetiHatra,
    `a visszavont-újra lezárás nem indítja újra az ablakot (${eredetiHatra} → ${ujHatra} nap)`,
  );

  // A bemutatkozó lap ugyanezt a felfedést használja, csak másik lekérdezésből:
  // ha ott a beírt kiköltözési napot néznénk, a visszakeltezett lezárás azon a
  // lapon hozná elő a rejtett szöveget, miközben az értékelések lapján még
  // rejtve marad. Ahol a lap még nincs meg, ott nincs mit mérni.
  const lap = await oldal.goto(`${ALAP}/bemutatkozas`);
  if (lap !== null && lap.status() === 200) {
    await oldal.waitForLoadState("networkidle");
    all(
      !(await oldal.content()).includes(MARTON_MONDATA),
      "a bemutatkozó lap sem hozza elő a rejtett értékelést",
    );
  }
}

export async function futtat(oldal) {
  // --- 0. A böngészőnek szóló fejlécek
  await fejlecek(oldal);

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

  // Visszavonjuk, hogy a példaadat úgy maradjon, ahogy találtuk. A hatásra
  // várunk, nem egy kiszabott időre: a következő szakaszok élő jogviszonyt
  // keresnek, és egy lassabb gépen a fix várakozás alattuk csúszna el.
  await oldal.getByRole("button", { name: "Mégis él" }).first().click();
  await ujraElo(oldal, eloDarab);

  // --- 2. Meghívó nem mehet olyan helyre, ahol már ül valaki
  await meghivoFiokosHelyre(oldal);

  // --- 3. A meghívó nem köt hozzá idegen fiókot
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

  // --- 4. A volt bérlő nem rögzíthet óraállást
  // Itt már Anna menete van nyitva: az előző szakasz önpróbája léptette be.
  await voltBerloOraallasa(oldal);

  // --- 5. A jogviszonyról levett bérlő szála és betekintője is lezárul
  await levettBerloNyomai(oldal);

  // --- 6. A lakótárs bizonylatát nem írja felül senki
  await lakotarsBizonylata(oldal);

  // --- 7. A lezárás dátuma nem mozgatja az értékelési ablakot
  await ertekelesiAblak(oldal);
}
