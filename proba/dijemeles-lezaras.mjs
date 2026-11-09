/**
 * Díjemelés, majd lezárás: a záró hónap arányosítása az **emelt** díjból.
 *
 * Ezt sem a típusellenőrzés, sem a domain tesztjei nem fogták meg, mert a
 * hiba a kettő között volt: a domain jól számolta, hogy a záró hónapra mennyi
 * jár, a lezárás viszont a jogviszony **eredeti** összegéhez mérte a meglévő
 * előírást, és így a díjemeléses hónapot „ember által átírtnak" minősítette.
 * Ahhoz nem nyúlunk — tehát a bérlő tíz napra a teljes havi emelt díjat kapta
 * kiírva, részletezés nélkül, és a lap semmit nem jelzett. A visszavonás sem
 * javította, mert nem volt mit visszaszámolni.
 *
 * A próbának saját jogviszonyt kell indítania, és ez nem kényelmi döntés:
 * emelni csak olyan hónaptól lehet, amire még nincs előírás, a példaadat
 * jogviszonyain viszont a mai hónapra már van. A friss jogviszonynak egy sincs,
 * tehát a mai hónapra lehet emelni — és pont a mai hónap lesz a záró hónap.
 *
 * Ezért fut a sor végén, a `biztonsag.mjs` előtt: a többi próba kiindulási
 * helyzetét egy új jogviszony is elmozdíthatja.
 */

import { ALAP, all, belep, magyarra, tullogas } from "./kozos.mjs";

export const nev = "Díjemelés és lezárás";

const INGATLAN = "Zuglói kislakás";
/** Szándékosan nem kerek és nem példaadatbeli összegek: csak ezt a bérletet jelölik. */
const DIJ = 101000;
const KOZOS = 11000;
const EMELT_DIJ = 121000;
const EMELT_KOZOS = 13000;
/** A záró nap: a mai hónap 15-e, tehát van mit arányosítani. */
const ZARO_NAP = 15;

const most = new Date();
const EV = most.getUTCFullYear();
const HONAP = most.getUTCMonth();

function honapKulcs(eltolas) {
  const nap = new Date(Date.UTC(EV, HONAP + eltolas, 1));
  return `${nap.getUTCFullYear()}-${String(nap.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** A hónap napjainak száma — az arányosítás ezzel számol, nem átlaghónappal. */
function napokAHonapban() {
  return new Date(Date.UTC(EV, HONAP + 1, 0)).getUTCDate();
}

function aranyos(teljes) {
  return Math.round((teljes * ZARO_NAP) / napokAHonapban());
}

/** A friss jogviszony kártyája a bérlők lapján: a bérlő nevéről, nem a bérleményről. */
function kartya(oldal) {
  return oldal.locator("li").filter({ hasText: "Próba Pál" }).first();
}

/**
 * A friss jogviszony szakasza a befizetések lapján.
 *
 * A bérlő nevére szűrünk, nem a bérlemény nevére: ugyanazon a bérleményen ott
 * áll a példaadat lezárt jogviszonya is, ugyanazzal a megnevezéssel. Összegre
 * sem szűrünk, mert a magyar alak nem törhető szóközzel tagol, és abból a
 * szövegkeresés a futtatókörnyezet szóközfajtáján múlna.
 */
function szakasz(oldal) {
  return oldal.locator("section").filter({ hasText: "Próba Pál" }).first();
}

async function jogviszonytIndit(oldal) {
  await oldal.goto(`${ALAP}/ingatlanok`);
  const nyito = oldal.locator("details", { has: oldal.locator('select[name="ingatlanId"]') }).first();
  if (!(await nyito.evaluate((elem) => elem.open))) {
    await nyito.locator("summary").first().click();
  }
  const urlap = nyito.locator("form").first();

  await urlap.locator('select[name="ingatlanId"]').selectOption({ label: INGATLAN });
  // Az előző hónap elsejétől: így a záró hónap (a mai) nem a kezdő hónap, és
  // az arányosítás tényleg a lezárás műve, nem a töredék első hónapé.
  await urlap.locator('input[name="kezdete"]').fill(`${honapKulcs(-1)}-01`);
  await urlap.locator('input[name="berletiDijFt"]').fill(String(DIJ));
  await urlap.locator('input[name="kozosKoltsegFt"]').fill(String(KOZOS));
  await urlap.locator('input[name="berloNeve"]').fill("Próba Pál");
  await urlap.getByRole("button", { name: "Jogviszony indítása" }).click();
  await oldal.getByText(/A jogviszony elindult/).first().waitFor({ timeout: 15000 });
  all(true, "a próba saját jogviszonyt indít, előírás nélkül");
}

async function emelestRogzit(oldal) {
  // Itt még nem nyitunk előírást pótló lapot (áttekintő, befizetések,
  // teendők): amíg nincs előírás, a mai hónapra is lehet emelni.
  await oldal.goto(`${ALAP}/berlok`);
  const szakaszElem = kartya(oldal).locator('details[data-szakasz="dijvaltozas"]').first();
  if (!(await szakaszElem.evaluate((elem) => elem.open))) {
    await szakaszElem.locator("summary").first().click();
  }
  const urlap = szakaszElem.locator("form").filter({ hasText: "Díjemelés rögzítése" }).first();

  all(
    (await urlap.locator('input[name="berletiDijFt"]').inputValue()) === String(DIJ),
    "emelés előtt a jogviszony saját összege áll a mezőben",
  );

  await urlap.locator('input[name="ervenyesTol"]').fill(honapKulcs(0));
  await urlap.locator('input[name="berletiDijFt"]').fill(String(EMELT_DIJ));
  await urlap.locator('input[name="kozosKoltsegFt"]').fill(String(EMELT_KOZOS));
  await urlap.getByRole("button", { name: "Díjemelés rögzítése" }).click();
  await oldal.getByText(/A díjemelést rögzítettük/).first().waitFor({ timeout: 15000 });
  all(true, "a friss jogviszonyon a mai hónapra is rögzíthető az emelés");
}

/**
 * A díjemelés űrlapja a **hatályos** összegeket kínálja fel, nem az
 * eredetieket. Aki a második emelésnél csak a bérleti díjat írta át, annak a
 * közös költsége csendben visszaesett az eredetire — és így is került
 * előírásba.
 */
async function elotoltes(oldal) {
  await oldal.goto(`${ALAP}/berlok`);
  const szakaszElem = kartya(oldal).locator('details[data-szakasz="dijvaltozas"]').first();
  if (!(await szakaszElem.evaluate((elem) => elem.open))) {
    await szakaszElem.locator("summary").first().click();
  }
  const urlap = szakaszElem.locator("form").filter({ hasText: "Díjemelés rögzítése" }).first();

  const dij = await urlap.locator('input[name="berletiDijFt"]').inputValue();
  const kozos = await urlap.locator('input[name="kozosKoltsegFt"]').inputValue();
  all(dij === String(EMELT_DIJ), `az űrlap a hatályos bérleti díjat tölti elő (${dij})`);
  all(
    kozos === String(EMELT_KOZOS),
    `és a hatályos közös költséget is, nem az eredetit (${kozos})`,
  );
  all((await tullogas(oldal)) === 0, "a díjemelés szakasza elfér 360 képponton");
}

/** Az adott hónap összes előírt összege a friss jogviszony szakaszából. */
async function osszegek(oldal, honap) {
  const sorok = szakasz(oldal).locator(`[data-idoszak="${honap}"]`);
  const ertekek = await sorok.evaluateAll((elemek) =>
    elemek.map((elem) => Number(elem.getAttribute("data-osszeg"))),
  );
  return ertekek;
}

async function eloirasokMegszuletnek(oldal) {
  await oldal.goto(`${ALAP}/befizetesek`);
  const maiak = await osszegek(oldal, honapKulcs(0));
  all(
    maiak.includes(EMELT_DIJ) && maiak.includes(EMELT_KOZOS),
    `a mai hónap előírása már az emelt összegekkel születik (${maiak.join(", ")})`,
  );
  const elozoek = await osszegek(oldal, honapKulcs(-1));
  all(
    elozoek.includes(DIJ) && elozoek.includes(KOZOS),
    `az előző hónap a régi összegen maradt (${elozoek.join(", ")})`,
  );
}

async function lezaras(oldal) {
  await oldal.goto(`${ALAP}/berlok`);
  const elem = kartya(oldal);
  await elem.getByText("Jogviszony lezárása").click();
  await elem
    .locator('input[name="vege"]')
    .fill(`${honapKulcs(0)}-${String(ZARO_NAP).padStart(2, "0")}`);
  await elem.getByRole("button", { name: "Lezárom" }).click();
  await elem.getByText(/Lezárva .* napjával/).first().waitFor({ timeout: 15000 });
  all(true, "a jogviszony lezárul a hónap közepével");
}

async function aranyositas(oldal) {
  await oldal.goto(`${ALAP}/befizetesek`);
  const maiak = await osszegek(oldal, honapKulcs(0));
  const vartDij = aranyos(EMELT_DIJ);
  const vartKozos = aranyos(EMELT_KOZOS);

  all(
    maiak.includes(vartDij),
    `a záró hónap bérleti díja az emelt összegből arányosodik (${vartDij} Ft, kapott: ${maiak.join(", ")})`,
  );
  all(
    maiak.includes(vartKozos),
    `a közös költség is (${vartKozos} Ft, kapott: ${maiak.join(", ")})`,
  );
  all(
    !maiak.includes(EMELT_DIJ) && !maiak.includes(EMELT_KOZOS),
    "és a teljes havi emelt összeg nem marad kiírva",
  );
  all(
    (await szakasz(oldal).getByText(/Töredékhónap/).count()) > 0,
    "a bérlő meg is kapja a magyarázatot, miért nem a teljes havi összeg áll ott",
  );
}

/** A visszavonás visszaszámolja, amit a lezárás elvett — az emelt összegre. */
async function visszavonas(oldal) {
  await oldal.goto(`${ALAP}/berlok`);
  const elem = kartya(oldal);
  await elem.getByRole("button", { name: "Mégis él" }).click();
  await elem.getByText("Jogviszony lezárása").first().waitFor({ timeout: 15000 });

  await oldal.goto(`${ALAP}/befizetesek`);
  const maiak = await osszegek(oldal, honapKulcs(0));
  all(
    maiak.includes(EMELT_DIJ) && maiak.includes(EMELT_KOZOS),
    `a visszavonás az emelt teljes összegre számol vissza (${maiak.join(", ")})`,
  );
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  await jogviszonytIndit(oldal);
  await emelestRogzit(oldal);
  await elotoltes(oldal);
  await eloirasokMegszuletnek(oldal);
  await lezaras(oldal);
  await aranyositas(oldal);
  await visszavonas(oldal);
}
