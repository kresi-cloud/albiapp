/**
 * Beszélgetés a bérbeadó és a bérlő között.
 *
 * Amit ez a próba megfog, és más nem: a beszélgetés az első üzenettel jön
 * létre (tehát a küldés egyszerre két dolgot csinál), a második üzenet
 * ugyanannak a címzettnek nem nyit új szálat, és amit az egyik fél ír, azt a
 * másik tényleg látja. Ez mind kiszolgálói művelet, aminek a szabályait sem a
 * típusellenőrzés, sem a fordítás nem nézi meg.
 *
 * A próba minden futáskor új üzenetet ír, de meglévő szálba: a saját jelével
 * ismeri fel, amit ő küldött, tehát tetszőleges sokszor futtatható.
 */

import { ALAP, all, belep, kilep, magyarra, mindetKinyit, tullogas } from "./kozos.mjs";

export const nev = "Beszélgetés";

const JEL = String(Date.now()).slice(-6);

/**
 * Megvárja, hogy a mező a várt értékre álljon.
 *
 * A küldés után a kiszolgáló válasza és a React állapotfrissítése nem egyszerre
 * ér oda: a szöveg már látszik a szálban, miközben az űrlap még ürül. Azonnal
 * ránézve a próba azt hinné, hogy nem ürült ki — ez próbahiba lenne, nem
 * alkalmazáshiba.
 */
async function mezoErteke(oldal, valaszto, vart, timeout = 10000) {
  const eddig = Date.now();
  let utolso = null;
  while (Date.now() - eddig < timeout) {
    utolso = await oldal.locator(valaszto).first().inputValue();
    if (utolso === vart) return utolso;
    await oldal.waitForTimeout(100);
  }
  return utolso;
}

async function lista(oldal) {
  await oldal.goto(`${ALAP}/beszelgetesek`);
  await oldal.waitForLoadState("networkidle");
}

/** A bérbeadó válaszol a példaadatban lévő szálba. */
async function berbeadoValaszol(oldal) {
  await lista(oldal);

  all((await tullogas(oldal)) <= 1, "az üzenetek lapja elfér 360 képponton");

  const szal = oldal.locator('a[href^="/beszelgetesek/"]').first();
  all((await szal.count()) > 0, "a példaadatban van beszélgetés");
  const ut = await szal.getAttribute("href");

  await oldal.goto(`${ALAP}${ut}`);
  await oldal.waitForLoadState("networkidle");

  all(
    await oldal.getByText("Csütörtökön 9 és 11 között jön a kéményseprő").first().isVisible(),
    "a szál üzenetei megjelennek",
  );
  all((await tullogas(oldal)) <= 1, "a beszélgetés lapja elfér 360 képponton");

  // Üres üzenet: a kiszolgáló utasítja el, ezért a böngésző kötelezőség-jelzőjét
  // levesszük. Nem azt próbáljuk, hogy a böngésző szól-e.
  const doboz = oldal.locator('textarea[name="szoveg"]').first();
  await doboz.evaluate((mezo) => mezo.removeAttribute("required"));
  await doboz.fill("   ");
  await oldal.getByRole("button", { name: "Küldés" }).first().click();
  await oldal.getByText("Üres üzenetet nem küldünk el.").first().waitFor({ timeout: 15000 });
  all(true, "üres üzenetet nem küldünk el");

  const szoveg = `Csúszik egy órát, ${JEL}.`;
  await oldal.locator('textarea[name="szoveg"]').first().fill(szoveg);
  await oldal.getByRole("button", { name: "Küldés" }).first().click();
  await oldal.getByText(szoveg).first().waitFor({ timeout: 15000 });
  all(true, "a bérbeadó üzenete megjelenik a szálban");

  all(
    (await mezoErteke(oldal, 'textarea[name="szoveg"]', "")) === "",
    "sikeres küldés után az üzenetdoboz kiürül",
  );

  return { ut, szoveg };
}

/** A bérlő látja, amit a bérbeadó írt, és válaszol rá. */
async function berloValaszol(oldal, kuldott) {
  await lista(oldal);

  // A szálak listájára szűkítve keresünk: a bérbeadó neve a címzettek közt is
  // ott van, csak épp az összecsukott „új beszélgetés” űrlapban, és az nem
  // bizonyítaná, hogy a lista jól nevezi el a szálat.
  const szalak = oldal.locator('a[href^="/beszelgetesek/"]');
  all(
    (await szalak.first().innerText()).includes("Nagy Péter"),
    "a bérlő listájában a bérbeadó neve áll, nem a sajátja",
  );
  all(
    !(await szalak.first().innerText()).includes("Kovács Anna"),
    "a bérlő a saját nevét nem látja a szál nevében",
  );

  await oldal.goto(`${ALAP}${kuldott.ut}`);
  await oldal.waitForLoadState("networkidle");
  all(
    await oldal.getByText(kuldott.szoveg).first().isVisible(),
    "a bérlő látja, amit a bérbeadó az előbb írt",
  );

  const valasz = `Rendben, megvárom, ${JEL}.`;
  await oldal.locator('textarea[name="szoveg"]').first().fill(valasz);
  await oldal.getByRole("button", { name: "Küldés" }).first().click();
  await oldal.getByText(valasz).first().waitFor({ timeout: 15000 });
  all(true, "a bérlő válasza is bekerül ugyanabba a szálba");
}

/**
 * Új beszélgetés indítása. Kétszer fut le ugyanannak a címzettnek: a második
 * nem nyithat új szálat, mert akkor a bérlő két helyen keresné ugyanazt.
 */
async function ujBeszelgetes(oldal) {
  await lista(oldal);
  await mindetKinyit(oldal);

  const elotte = await oldal.locator('a[href^="/beszelgetesek/"]').count();

  const urlap = oldal.locator('form:has(input[name="cimzett"])').first();
  all((await urlap.count()) > 0, "van űrlap új beszélgetéshez");

  const cimzett = urlap.locator('input[name="cimzett"]').first();
  all((await cimzett.count()) > 0, "a fiókkal rendelkező bérlő megszólítható");

  // Címzett nélkül nem indul beszélgetés: a kiszolgáló mondja ki, nem az űrlap.
  await urlap.locator('textarea[name="szoveg"]').fill(`Címzett nélkül, ${JEL}.`);
  await urlap.getByRole("button", { name: "Küldés" }).click();
  await oldal.getByText("Jelöld be, kinek írsz.").first().waitFor({ timeout: 15000 });
  all(true, "címzett nélkül nem indul beszélgetés");

  all(
    (await oldal.locator('form:has(input[name="cimzett"]) textarea[name="szoveg"]').first().inputValue()).includes(JEL),
    "az elutasítás után a begépelt üzenet megmarad",
  );

  await oldal.locator('form:has(input[name="cimzett"]) input[name="cimzett"]').first().check();
  await oldal
    .locator('form:has(input[name="cimzett"])')
    .first()
    .getByRole("button", { name: "Küldés" })
    .click();
  await oldal.waitForURL(/\/beszelgetesek\/.+/, { timeout: 15000 });
  all(true, "a küldés egyszerre hozza létre a beszélgetést és az első üzenetet");

  const elso = oldal.url();

  await lista(oldal);
  const utana = await oldal.locator('a[href^="/beszelgetesek/"]').count();
  all(
    utana === elotte || utana === elotte + 1,
    `a lista legfeljebb egy szállal nőtt (${elotte} → ${utana})`,
  );

  // Ugyanannak a címzettnek másodszor: ugyanabba a szálba kell kerülnie.
  await mindetKinyit(oldal);
  await oldal.locator('form:has(input[name="cimzett"]) input[name="cimzett"]').first().check();
  const masodik = `Még valami, ${JEL}.`;
  await oldal.locator('form:has(input[name="cimzett"]) textarea[name="szoveg"]').first().fill(masodik);
  await oldal
    .locator('form:has(input[name="cimzett"])')
    .first()
    .getByRole("button", { name: "Küldés" })
    .click();
  await oldal.waitForURL(/\/beszelgetesek\/.+/, { timeout: 15000 });

  all(
    oldal.url() === elso,
    "ugyanannak a címzettnek a második üzenet nem nyit új szálat",
  );
  all(
    await oldal.getByText(masodik).first().isVisible(),
    "a második üzenet a meglévő szálba került",
  );

  await lista(oldal);
  const vegul = await oldal.locator('a[href^="/beszelgetesek/"]').count();
  all(vegul === utana, `a második üzenettől nem nőtt a lista (${utana} → ${vegul})`);
}

/**
 * Belépés nélkül a szál nem olvasható, hiába tudja valaki az útvonalát.
 *
 * A példaadatban csak két fiók van, és mindkettő résztvevő, ezért a
 * „belépett, de kívülálló” esetet a domain tesztje fedi: a lekérdezés a
 * résztvevői sorra szűr, tehát ott nincs mit megkerülni.
 */
async function kivulallo(oldal, ut) {
  await kilep(oldal);
  await oldal.goto(`${ALAP}${ut}`);
  await oldal.waitForLoadState("networkidle");
  all(
    oldal.url().includes("/belepes"),
    "belépés nélkül a beszélgetés nem olvasható, a belépésre visz",
  );
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  const kuldott = await berbeadoValaszol(oldal);
  await ujBeszelgetes(oldal);

  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await berloValaszol(oldal, kuldott);

  await kivulallo(oldal, kuldott.ut);
}
