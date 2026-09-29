/**
 * Az aláírt szerződés feltöltött példánya.
 *
 * Amit a felek aláírtak, az az okirat: a mi szövegünk addig volt az, amíg nem
 * került rá aláírás. Amit ez a próba megfog, és más nem:
 *
 * - a típust a **tartalomból** állapítjuk meg, nem a böngésző bemondásából —
 *   a próba ezért egy HTML-t tölt fel PDF-nek hazudva;
 * - a letöltés a mi ellenőrzött nevünkön és típusunkon jön vissza, nem a
 *   feltöltött néven;
 * - a bérlő is letöltheti, mert az okirat az övé is;
 * - amíg van feltöltött példány, a szerződés nem állítható vissza tervezetre;
 * - a **rögzítés végleges**: utána nincs csere és nincs levétel, és a
 *   nyugtázás nélküli rögzítést a kiszolgáló utasítja el, nem a jelölőnégyzet
 *   `required` jelzője — azt a böngészőben egy sorral ki lehet venni.
 */

import { ALAP, all, belep, magyarra, mindetKinyit, tullogas } from "./kozos.mjs";

export const nev = "Aláírt szerződés";

/** Négy bájt dönti el a típust; ennyi elég egy valódinak látszó PDF-hez. */
const PDF = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n", "utf8");
const HAMIS = Buffer.from("<html><body>Ez nem PDF.</body></html>", "utf8");

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
 * Véglegesítés. Két kattintás is lehet belőle: ha a felek adataiból hiányzik
 * valami, az első csak felsorolja a hiányokat.
 */
async function veglegesit(oldal, id) {
  await oldal.goto(`${ALAP}/szerzodesek/${id}`);
  await oldal.waitForLoadState("networkidle");
  for (let probalkozas = 0; probalkozas < 2; probalkozas++) {
    const jelolo = oldal.locator('input[name="azonossagEllenorizve"]');
    if ((await jelolo.count()) === 0) break;
    await jelolo.first().check();
    await oldal.getByRole("button", { name: /^Véglegesítés/ }).first().click();
    await oldal.waitForLoadState("networkidle");
    await oldal.waitForTimeout(500);
  }
  all(
    (await oldal.locator('input[name="azonossagEllenorizve"]').count()) === 0,
    "a szerződés véglegesítve lett",
  );
}

/** Megvárja a kiszolgálói művelet válaszát, nem a hálózat csendjét. */
async function mentes(oldal, muvelet) {
  const valasz = oldal.waitForResponse(
    (v) => v.request().method() === "POST" && v.url().includes("/szerzodesek/"),
  );
  await muvelet();
  await valasz;
  await oldal.waitForLoadState("networkidle");
}

async function feltolt(oldal, { nev: fajlnev, tartalom }) {
  await oldal.locator('input[name="alairt"]').first().setInputFiles({
    name: fajlnev,
    mimeType: "application/pdf",
    buffer: tartalom,
  });
  await mentes(oldal, () =>
    oldal.getByRole("button", { name: /^(Feltöltés|Csere másik fájlra)$/ }).first().click(),
  );
}

/**
 * Újratöltés: a mentés megtörténtét a hatásán mérjük, nem a visszajelző sávon.
 * A sáv a hibát mondja meg — ott a lap nem cserélődik ki —, a sikert viszont
 * az, hogy a lap az új adatot mutatja.
 */
async function ujra(oldal, id) {
  await oldal.goto(`${ALAP}/szerzodesek/${id}`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
}

function alairtDoboz(oldal) {
  return oldal.locator("section").filter({ hasText: "Az aláírt példány" }).first();
}

/**
 * Megvárja a hibajelzést.
 *
 * A művelet válasza megérkezik, a React viszont csak utána rajzol újra: a
 * válasz után azonnal számolva a sáv hol ott van, hol nincs, és a próba a
 * gépen múlna, nem a terméken.
 */
async function hibatVar(hely) {
  return hely
    .locator('[data-uzenet="hiba"]')
    .first()
    .waitFor({ state: "visible", timeout: 10000 })
    .then(() => true)
    .catch(() => false);
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  const id = await ujSzerzodestKeszit(oldal);

  // Tervezethez nincs aláírt példány: a szöveg még változhat, tehát nincs mit
  // aláírni rajta.
  all(
    (await oldal.locator('input[name="alairt"]').count()) === 0,
    "a tervezethez nem kínálunk aláírt példányt",
  );

  await veglegesit(oldal, id);
  await mindetKinyit(oldal);
  all(
    (await oldal.locator('input[name="alairt"]').count()) > 0,
    "a véglegesített szerződéshez viszont igen",
  );
  all((await tullogas(oldal)) <= 1, "az aláírt példány szakasza elfér 360 képponton");

  // --- A típus a tartalomból jön, nem a bejelentésből
  await feltolt(oldal, { nev: "szerzodes.pdf", tartalom: HAMIS });
  all(
    await hibatVar(alairtDoboz(oldal)),
    "a PDF-nek hazudott HTML-t a kiszolgáló elutasítja",
  );

  // --- Valódi PDF
  await ujra(oldal, id);
  await feltolt(oldal, { nev: "akarmi.pdf", tartalom: PDF });
  await ujra(oldal, id);
  const hivatkozas = oldal.locator(`a[href="/szerzodesek/${id}/alairt"]`).first();
  all((await hivatkozas.count()) > 0, "a feltöltött példány letölthető lesz");

  const letoltes = await oldal.request.get(`${ALAP}/szerzodesek/${id}/alairt`);
  all(letoltes.status() === 200, "a bérbeadó le is tölti");
  all(
    letoltes.headers()["content-type"] === "application/pdf",
    `a letöltés típusa a mi ellenőrzött típusunk (${letoltes.headers()["content-type"]})`,
  );
  all(
    (letoltes.headers()["content-disposition"] ?? "").includes("alairt-berleti-szerzodes.pdf"),
    "és a mi nevünkön jön, nem a feltöltöttön",
  );

  // --- Amíg van feltöltött példány, nincs visszaút tervezetre
  await mentes(oldal, () =>
    oldal.getByRole("button", { name: /Vissza tervezetre/ }).first().click(),
  );
  all(
    await hibatVar(oldal),
    "aláírt példány mellett a szerződés nem állítható vissza tervezetre",
  );
  all(
    (await oldal.locator('input[name="alairt"]').count()) > 0,
    "és a szerződés véglegesített maradt",
  );

  // --- Levenni viszont lehet, amíg nincs rögzítve
  await ujra(oldal, id);
  await mentes(oldal, () =>
    oldal.getByRole("button", { name: /Feltöltött példány levétele/ }).first().click(),
  );
  await ujra(oldal, id);
  all(
    (await oldal.locator(`a[href="/szerzodesek/${id}/alairt"]`).count()) === 0,
    "a nem rögzített példány levehető",
  );

  // --- Rögzítés: nyugtázás nélkül a kiszolgáló utasítja el
  await feltolt(oldal, { nev: "akarmi.pdf", tartalom: PDF });
  await ujra(oldal, id);

  // A jelölőnégyzet `required` jelzőjét kivesszük: a próba pont azt méri, hogy
  // nem a böngésző tartja a szabályt, hanem a kiszolgáló.
  await oldal.evaluate(() => {
    document.querySelector('input[name="nyugtazas"]')?.removeAttribute("required");
  });
  await mentes(oldal, () =>
    oldal.getByRole("button", { name: /^Rögzítés véglegesként$/ }).first().click(),
  );
  all(await hibatVar(alairtDoboz(oldal)), "nyugtázás nélkül nem rögzítünk");
  all(
    (await oldal.locator('input[name="nyugtazas"]').count()) > 0,
    "és a példány rögzítetlen maradt",
  );

  // --- Rögzítés rendesen
  await oldal.locator('input[name="nyugtazas"]').first().check();
  await mentes(oldal, () =>
    oldal.getByRole("button", { name: /^Rögzítés véglegesként$/ }).first().click(),
  );
  await ujra(oldal, id);

  all(
    (await oldal.locator('input[name="alairt"]').count()) === 0,
    "rögzítés után nincs csere",
  );
  all(
    (await oldal.getByRole("button", { name: /Feltöltött példány levétele/ }).count()) === 0,
    "és nincs levétel sem",
  );
  all(
    (await oldal.locator(`a[href="/szerzodesek/${id}/alairt"]`).count()) > 0,
    "letölteni viszont továbbra is lehet",
  );
  all((await tullogas(oldal)) <= 1, "a rögzített példány szakasza is elfér 360 képponton");

  // --- A bérlő is letöltheti: az okirat az övé is
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo/dokumentumok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  const berloiHivatkozas = oldal.locator(`a[href="/szerzodesek/${id}/alairt"]`).first();
  all(
    (await berloiHivatkozas.count()) > 0,
    "a bérlő a dokumentumai közt megtalálja az aláírt példányt",
  );
  const berloiLetoltes = await oldal.request.get(`${ALAP}/szerzodesek/${id}/alairt`);
  all(berloiLetoltes.status() === 200, "és le is tudja tölteni");
  all(
    (await berloiLetoltes.body()).equals(PDF),
    "ugyanazt a fájlt kapja, amit a bérbeadó feltöltött",
  );
}
