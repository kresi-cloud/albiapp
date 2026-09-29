/**
 * A szerződés szakaszainak átírása.
 *
 * A katalógus szövege alapértelmezés, nem az egyetlen lehetőség: a bérbeadók
 * helyzete különbözik, és ami minden szerződésre jó, az egyikre sem a legjobb.
 * Amit ez a próba megfog, és más nem:
 *
 * - az átírt szöveg tényleg végigmegy a lapon és a letöltésen, tehát az
 *   okiratba kerül, nem csak a szerkesztőbe;
 * - üresen hagyva visszajön az alapértelmezés, tehát az átírás visszavonható;
 * - a fordításban a bérbeadó saját szövege áll, nem a katalógus angol
 *   mondata — az mást mondana, mint amit aláírnak;
 * - a véglegesített szöveget a **kiszolgáló** nem engedi átírni, nem a mező
 *   elrejtése: a lap nyitva maradhat akkor is, amikor a véglegesítés egy másik
 *   fülön megtörténik.
 *
 * És megméri a **tervezet** lapjának hosszát. A méretkapu ezt a lapot nem
 * látja (azonosítóra menő útvonal), a fordításpróba pedig csak a
 * véglegesítettet méri — a szerkesztő mezői pont a tervezeten állnak. Ahol a
 * példaadat egy állapotot nem tartalmaz, ott az az oldal mérje meg, amelyik
 * előállítja.
 */

import { ALAP, all, angolra, belep, magyarra, mindetKinyit, nyelvre, tullogas } from "./kozos.mjs";

export const nev = "Szerződésszakaszok";

const KEPERNYO = 844;
const MAX_KEPERNYO = 8;

/** A szakasz, amit átírunk. Minden szerződésben benne van, tehát mindig ott áll. */
const SZAKASZ = "berleti_dij";

const SAJAT_HU = "A berleti dijat minden honap 5. napjaig kell atutalni.";
const SAJAT_EN = "The rent must be transferred by the 5th day of each month.";

async function ujSzerzodestKeszit(oldal) {
  await oldal.goto(`${ALAP}/dokumentumok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  const doboz = oldal
    .locator("section")
    .filter({ hasText: "Ferencvárosi garzon" })
    .filter({ has: oldal.getByRole("button", { name: "Új szerződéstervezet" }) })
    .first();
  await doboz.getByRole("button", { name: "Új szerződéstervezet" }).first().click();
  await oldal.waitForURL(/\/szerzodesek\/.+/, { timeout: 20000 });
  return oldal.url().split("/").pop();
}

/**
 * Megvárja a kiszolgálói művelet válaszát, nem a hálózat csendjét.
 *
 * A `revalidatePath` kicseréli az űrlapot, tehát az `Uzenetsav`-ra várni sem
 * mindig lehet: a siker jele az, hogy a lap az új adatot mutatja. A hibát
 * viszont a sáv mondja meg, mert olyankor a lap nem cserélődik ki.
 */
async function mentes(oldal, muvelet) {
  const valasz = oldal.waitForResponse(
    (v) => v.request().method() === "POST" && v.url().includes("/szerzodesek/"),
  );
  await muvelet();
  await valasz;
  await oldal.waitForLoadState("networkidle");
}

function szakaszDoboz(oldal) {
  return oldal.locator(`[data-szakasz="${SZAKASZ}"]`).first();
}

/** Beírja a két mezőt, és elmenti a szakaszt. */
async function szakasztMent(oldal, { hu, en }) {
  const doboz = szakaszDoboz(oldal);
  await doboz.locator('textarea[name="szoveg"]').fill(hu);
  await doboz.locator('textarea[name="szovegEn"]').fill(en);
  await mentes(oldal, () => doboz.locator('button[type="submit"]').first().click());
}

/**
 * A tervezet lapjának hossza csukva, és a szélessége kinyitva.
 *
 * A hosszt csukva mérjük, mert az összecsukás a lap része, nem a próba
 * kényelme; a szélességet kinyitva is, mert a csukott szakaszban ülő
 * szövegdoboz ugyanúgy kilóg, amint a felhasználó rákattint.
 */
async function meret(oldal, id, cimke) {
  await oldal.goto(`${ALAP}/szerzodesek/${id}`);
  await oldal.waitForLoadState("networkidle");

  const magassag = await oldal.evaluate(() => document.documentElement.scrollHeight);
  all(
    magassag <= KEPERNYO * MAX_KEPERNYO,
    `a szerződéstervezet lapja nem hosszabb ${MAX_KEPERNYO} telefonképernyőnél ${cimke} ` +
      `(${(magassag / KEPERNYO).toFixed(1)} képernyő, ${magassag}px)`,
  );
  all((await tullogas(oldal)) <= 1, `a szerződéstervezet elfér 360 képponton ${cimke}`);

  // Önpróba: kinyitva ez a lap bizonyítottan elbukna a hosszkorláton. Enélkül
  // nem lehetne tudni, hogy a mérés nem azért zöld, mert semmit nem lát.
  await mindetKinyit(oldal);
  const nyitva = await oldal.evaluate(() => document.documentElement.scrollHeight);
  all(
    nyitva > KEPERNYO * MAX_KEPERNYO,
    `a korlát elbukna ezen a lapon kinyitva ${cimke} (${(nyitva / KEPERNYO).toFixed(1)} képernyő)`,
  );
  all(
    (await tullogas(oldal)) <= 1,
    `a szakaszszerkesztő kinyitva is elfér 360 képponton ${cimke}`,
  );
}

async function letoltes(oldal, ut) {
  const valasz = await oldal.request.get(`${ALAP}${ut}`);
  return { kod: valasz.status(), szoveg: await valasz.text() };
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  const id = await ujSzerzodestKeszit(oldal);
  all(Boolean(id), "a bérbeadó szerződéstervezetet készít");

  // A tervezet lapját mindkét nyelven megmérjük. A méretkapu ezt a lapot nem
  // látja, a fordításpróba csak a véglegesítettet méri — a szakaszszerkesztő
  // viszont pont a tervezeten áll, húsz szövegdobozzal. Az angol felirat
  // hosszabb, tehát előbb lóg ki és előbb tör sorba: csak magyarul mérve a
  // felület fele őrizetlen maradna.
  await meret(oldal, id, "magyarul");
  await angolra(oldal);
  await meret(oldal, id, "angolul");
  await oldal.goto(`${ALAP}/`);
  await nyelvre(oldal, "hu");

  await oldal.goto(`${ALAP}/szerzodesek/${id}`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  all((await szakaszDoboz(oldal).count()) > 0, "a tervezeten ott a szakasz szerkesztője");

  // Mi állt ott eddig: enélkül nem lehetne tudni, hogy az átírás tényleg
  // kicserélte a katalógus mondatát, nem csak hozzátett valamit.
  const eleje = await letoltes(oldal, `/szerzodesek/${id}/letoltes`);
  all(eleje.kod === 200, "a tervezet szövege letölthető");
  all(!eleje.szoveg.includes(SAJAT_HU), "a saját szöveg még nincs benne az okiratban");
  const katalogusMondat = "Késedelem esetén a Bérbeadót a Ptk. szerinti késedelmi kamat illeti meg.";
  all(
    eleje.szoveg.includes(katalogusMondat),
    "a katalógus mondata áll az okiratban az átírás előtt",
  );

  // --- Átírás, saját angol változat nélkül
  await szakasztMent(oldal, { hu: SAJAT_HU, en: "" });

  const atirt = await letoltes(oldal, `/szerzodesek/${id}/letoltes`);
  all(atirt.szoveg.includes(SAJAT_HU), "az átírt szöveg bekerül a magyar okiratba");
  all(
    !atirt.szoveg.includes(katalogusMondat),
    "az átírt szakaszból eltűnt a katalógus mondata",
  );

  const angol = await letoltes(oldal, `/szerzodesek/${id}/letoltes?nyelv=en`);
  all(
    angol.szoveg.includes(SAJAT_HU),
    "saját angol változat híján a fordításban is a bérbeadó szövege áll",
  );

  // --- Saját angol változat
  await szakasztMent(oldal, { hu: SAJAT_HU, en: SAJAT_EN });

  const angolUtan = await letoltes(oldal, `/szerzodesek/${id}/letoltes?nyelv=en`);
  all(angolUtan.szoveg.includes(SAJAT_EN), "a megadott angol változat megy a fordításba");
  all(!angolUtan.szoveg.includes(SAJAT_HU), "az angol példányban már nem a magyar áll");
  const magyarUtan = await letoltes(oldal, `/szerzodesek/${id}/letoltes`);
  all(magyarUtan.szoveg.includes(SAJAT_HU), "a magyar okirat a magyar szöveget viszi");
  all(!magyarUtan.szoveg.includes(SAJAT_EN), "az angol változat nem szivárog a magyar okiratba");

  // --- Angol magyar nélkül: a kiszolgáló elutasítja
  await oldal.goto(`${ALAP}/szerzodesek/${id}`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  await szakasztMent(oldal, { hu: "", en: SAJAT_EN });
  all(
    (await szakaszDoboz(oldal).locator('[data-uzenet="hiba"]').count()) > 0,
    "angol szöveget magyar nélkül nem fogadunk el",
  );
  const elutasitasUtan = await letoltes(oldal, `/szerzodesek/${id}/letoltes`);
  all(
    elutasitasUtan.szoveg.includes(SAJAT_HU),
    "az elutasított mentés nem vitte el a korábbi szöveget",
  );

  // --- Visszaállítás: üres mezővel jön vissza az alapértelmezés
  await oldal.goto(`${ALAP}/szerzodesek/${id}`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  await szakasztMent(oldal, { hu: "", en: "" });

  const alap = await letoltes(oldal, `/szerzodesek/${id}/letoltes`);
  all(alap.szoveg.includes(katalogusMondat), "üres mezővel visszajön az alapértelmezett szöveg");
  all(!alap.szoveg.includes(SAJAT_HU), "a saját szöveg el is tűnt az okiratból");

  // --- A véglegesítettet a kiszolgáló nem engedi átírni
  //
  // A lap nyitva marad, a véglegesítés egy másik fülön történik: pont az az
  // eset, amit a gomb elrejtése nem fog meg.
  await oldal.goto(`${ALAP}/szerzodesek/${id}`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  const masikFul = await oldal.context().newPage();
  await masikFul.goto(`${ALAP}/szerzodesek/${id}`);
  await masikFul.waitForLoadState("networkidle");

  // Két kattintás is lehet belőle: ha a felek adataiból hiányzik valami, az
  // első kattintás felsorolja a hiányokat, és a gomb „Véglegesítés mégis"
  // lesz. A próbasor korábbi menetei írnak a bérlő adataiba, tehát ez futásról
  // futásra változhat — egy kattintásra építve a próba máshol bukna el, mint
  // ahol a baj van.
  for (let probalkozas = 0; probalkozas < 2; probalkozas++) {
    const jelolo = masikFul.locator('input[name="azonossagEllenorizve"]');
    if ((await jelolo.count()) === 0) break;
    await jelolo.first().check();
    await masikFul.getByRole("button", { name: /^Véglegesítés/ }).first().click();
    await masikFul.waitForLoadState("networkidle");
    await masikFul.waitForTimeout(500);
  }
  all(
    (await masikFul.locator('input[name="azonossagEllenorizve"]').count()) === 0,
    "a szerződés véglegesítve lett a másik fülön",
  );
  await masikFul.close();

  await szakasztMent(oldal, { hu: "Ezt mar nem lehet beleirni.", en: "" });
  all(
    (await szakaszDoboz(oldal).locator('[data-uzenet="hiba"]').count()) > 0,
    "a véglegesített szerződés szakaszát a kiszolgáló nem írja át",
  );
  const vegleges = await letoltes(oldal, `/szerzodesek/${id}/letoltes`);
  all(
    !vegleges.szoveg.includes("Ezt mar nem lehet beleirni."),
    "a véglegesített okirat szövege nem változott meg",
  );
  all(vegleges.szoveg.includes(katalogusMondat), "a befagyasztott szöveg maradt érvényben");

  await nyomtathato(oldal, id, vegleges.szoveg);
}

/**
 * A nyomtatható példány.
 *
 * Amit ez megfog, és más nem: a lapon ugyanaz a szöveg áll, mint a
 * letöltésben — egy okiratból nem lehet két változat —, a képernyő kerete
 * (fejléc, lábléc, fülsáv) nem kerül papírra, és a bérlő csak a
 * véglegesítettet nyithatja meg. A PDF-et a böngésző nyomtatóablaka menti, azt
 * itt nem tudjuk megnyitni; amit meg lehet nézni, az az, hogy mit tenne
 * papírra.
 */
async function nyomtathato(oldal, id, varhatoSzoveg) {
  await oldal.goto(`${ALAP}/szerzodesek/${id}/nyomtat`);
  await oldal.waitForLoadState("networkidle");

  const lapon = await oldal.locator("pre.okirat").innerText();
  all(
    lapon.includes(katalogusMondatBol(varhatoSzoveg)),
    "a nyomtatható lapon ugyanaz a szöveg áll, ami letölthető",
  );
  all((await tullogas(oldal)) <= 1, "a nyomtatható lap elfér 360 képponton");

  // A képernyő kerete nem kerül papírra. A nyomtatási nézetet a böngésző
  // médiatípusával kérjük le, nem a szemünkkel: a `print:hidden` osztály
  // képernyőn semmit nem csinál, tehát képernyőn mérve az állítás mindig igaz
  // lenne.
  await oldal.emulateMedia({ media: "print" });
  const keret = await oldal.evaluate(() => {
    const latszik = (elem) => Boolean(elem && elem.getClientRects().length > 0);
    return {
      fejlec: latszik(document.querySelector("header")),
      lablec: latszik(document.querySelector("footer")),
      okirat: latszik(document.querySelector("pre.okirat")),
      gomb: latszik(document.querySelector("button")),
    };
  });
  all(!keret.fejlec, "nyomtatásban a fejléc nem látszik");
  all(!keret.lablec, "nyomtatásban a lábléc nem látszik");
  all(!keret.gomb, "nyomtatásban a nyomtatás gombja sem kerül papírra");
  all(keret.okirat, "önpróba: az okirat szövege viszont papíron is ott van");
  await oldal.emulateMedia({ media: "screen" });

  // A bérlő is kinyomtathatja a magáét — de csak a véglegesítettet. A
  // tervezet még változhat, és nem az, amit aláírtak; ezt a kiszolgáló tartja
  // be, nem a hivatkozás elrejtése, ezért kell hozzá egy friss tervezet.
  const tervezetId = await ujSzerzodestKeszit(oldal);

  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  const tervezetnel = await oldal.goto(`${ALAP}/szerzodesek/${tervezetId}/nyomtat`);
  all(
    tervezetnel?.status() === 404,
    `a bérlő a tervezet nyomtatható példányát nem nyitja meg (${tervezetnel?.status()})`,
  );


  await magyarra(oldal);
  const berlonel = await oldal.goto(`${ALAP}/szerzodesek/${id}/nyomtat`);
  all(
    (berlonel?.status() ?? 0) < 400,
    `a bérlő is megnyitja a véglegesített szerződés nyomtatható példányát (${berlonel?.status()})`,
  );
  all(
    (await oldal.locator("pre.okirat").count()) > 0,
    "és a szerződés szövege ott is megjelenik",
  );
}

/** Egy elég hosszú, jellegzetes mondat a kész okiratból, összevetéshez. */
function katalogusMondatBol(szoveg) {
  return (
    szoveg
      .split("\n")
      .map((sor) => sor.trim())
      .filter((sor) => sor.length > 60)[2] ?? ""
  );
}
