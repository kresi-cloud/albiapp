/**
 * Záradék egy hatályos szerződéshez, előfizetéssel.
 *
 * Amit ez a próba megfog, és más nem: a véglegesített szerződés szövege nem
 * változik meg attól, hogy új előfizetés került a bérleményhez — a kiegészítés
 * külön okiratba kerül, az megnevezi az alapszerződést, és kimondja, hogy a
 * többi pont hatályban marad. Ez végig kiszolgálói művelet, aminek a
 * szabályait sem a típusellenőrzés, sem a fordítás nem nézi meg.
 *
 * A próba minden futáskor új tervezetet készít, ami rendben van: a
 * dokumentumtár időrendben mutatja őket, és a legfrissebbel dolgozunk.
 */

import { ALAP, all, belep, magyarra, mindetKinyit, tullogas } from "./kozos.mjs";

export const nev = "Záradék";

/** Az utolsó „Szerződés – …” tervezet szerkesztőjének útvonala. */
async function ujSzerzodestKeszit(oldal) {
  await oldal.goto(`${ALAP}/dokumentumok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  // Anna bérleménye: neki van fiókja, tehát az előfizetést jóvá tudta hagyni,
  // és a záradékot is meg fogja látni a saját dokumentumai közt.
  // A lap tetején a meglévő iratok is említik a bérleményt, ezért arra a
  // szakaszra szűkítünk, amelyikben tényleg ott a gomb.
  const doboz = oldal
    .locator("section")
    .filter({ hasText: "Ferencvárosi garzon" })
    .filter({ has: oldal.getByRole("button", { name: "Új szerződéstervezet" }) })
    .first();
  await doboz.getByRole("button", { name: "Új szerződéstervezet" }).first().click();
  await oldal.waitForURL(/\/szerzodesek\/.+/, { timeout: 20000 });
  return oldal.url();
}

async function veglegesit(oldal) {
  await mindetKinyit(oldal);
  const jelolo = oldal.locator('input[name="azonossagEllenorizve"]').first();
  if (await jelolo.count()) await jelolo.check();

  const gomb = oldal.getByRole("button", { name: /^Véglegesítés/ }).first();
  await gomb.click();
  await oldal.waitForLoadState("networkidle");
  await oldal.waitForTimeout(500);
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  const ut = await ujSzerzodestKeszit(oldal);
  all(true, "a bérbeadó szerződéstervezetet készít");

  // A jóváhagyott előfizetés magától bekerül a tervezetbe: a bérbeadónak nem
  // kell rájönnie, hogy van ilyen modul.
  all(
    (await oldal.getByText("Telekom 500/100 internet").count()) > 0,
    "a jóváhagyott előfizetés bekerül a szerződés szövegébe",
  );

  await veglegesit(oldal);
  all(
    (await oldal.getByRole("button", { name: "Záradék készítése" }).count()) > 0,
    "véglegesítés után lehet záradékot készíteni",
  );

  // A befagyasztott szerződésszöveg, szó szerint. A záradék után ugyanennek
  // kell ott állnia: amit a felek aláírtak, azt egy kiegészítés nem írja át.
  const veglegesSzoveg = await oldal.locator("pre").first().innerText();
  all(
    veglegesSzoveg.includes("LAKÁSBÉRLETI SZERZŐDÉS"),
    "a véglegesített szerződés szövege befagyott",
  );

  await oldal.getByRole("button", { name: "Záradék készítése" }).first().click();
  // Másik útvonalra kell érkeznünk: a szerződés lapja is ugyanilyen alakú,
  // tehát a mintára való várakozás azonnal igazat adna.
  await oldal.waitForURL((cim) => cim.toString() !== ut, { timeout: 20000 });
  all(/\/szerzodesek\/.+/.test(oldal.url()), "a záradék külön okirat, saját lappal");

  await mindetKinyit(oldal);
  const zaradek = await oldal.locator("body").innerText();
  all(
    zaradek.includes("ZÁRADÉK A LAKÁSBÉRLETI SZERZŐDÉSHEZ") ||
      zaradek.includes("Ez a záradék a következő szerződést egészíti ki"),
    "a záradék megnevezi, melyik szerződéshez tartozik",
  );
  all(
    zaradek.includes("változatlanul hatályban maradnak"),
    "a záradék kimondja, hogy a többi pont hatályban marad",
  );
  all(
    zaradek.includes("Telekom 500/100 internet"),
    "az előfizetési pont eleve bekapcsolva áll a záradékban",
  );
  // A kötelező pontok nem kerülnek a szövegbe: a záradék nem egy második
  // teljes szerződés. A modulválasztóban attól még ott állnak, hiszen
  // záradékban minden pont szabadon bekapcsolható — ezért a kirajzolt
  // pontcímekre nézünk, nem az egész lapra.
  const pontcimek = await oldal.locator("article h3").allInnerTexts();
  all(pontcimek.length > 0, `a záradéknak van kirajzolt pontja (${pontcimek.length})`);
  all(
    !pontcimek.some((cim) => cim.includes("Szerződő felek")),
    "a záradék nem írja le újra a szerződés kötelező pontjait",
  );
  all((await tullogas(oldal)) <= 1, "a záradék lapja elfér 360 képponton");

  await veglegesit(oldal);
  all(
    (await oldal.locator("body").innerText()).includes("ZÁRADÉK A LAKÁSBÉRLETI SZERZŐDÉSHEZ"),
    "a véglegesített záradék szövege befagyott",
  );

  // Az eredeti szerződés szövege szó szerint ugyanaz maradt. Ez a záradék
  // egész létjogosultsága: ha a kiegészítés átírhatná az aláírt szöveget,
  // nem kellene külön okirat.
  await oldal.goto(ut);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  const utana = await oldal.locator("pre").first().innerText();
  all(utana === veglegesSzoveg, "az aláírt szerződés szövege betűre ugyanaz maradt");
  all(
    !utana.includes("ZÁRADÉK A LAKÁSBÉRLETI SZERZŐDÉSHEZ"),
    "a záradék nem került bele az eredeti szerződésbe",
  );

  // A bérlő csak a kiadott okiratot látja, és a záradék most már az.
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo/dokumentumok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all(
    (await oldal.getByText(/Záradék ·/).count()) > 0,
    "a bérlő a véglegesített záradékot megkapja a dokumentumai közt",
  );
}
