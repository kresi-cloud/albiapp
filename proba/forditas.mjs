/**
 * A szerződés angol fordítása, tájékoztatásul.
 *
 * Amit ez a próba megfog, és más nem: a fordítás tényleg végigmegy a lapon és a
 * letöltésen, az angol példány maga mondja ki, hogy a magyar az irányadó, és a
 * véglegesítés után a befagyasztott fordítás jön, nem egy frissen generált. Ez
 * utóbbi a lényeg: a kettő csak akkor különbözik, ha a modulkatalógus közben
 * megváltozik, tehát az egységteszt nem látja — a tárolt oszlopot viszont a
 * letöltés vissza tudja adni, és itt az látszik.
 *
 * A próba minden futáskor új tervezetet készít, ami rendben van: a
 * dokumentumtár időrendben mutatja őket, és a legfrissebbel dolgozunk.
 */

import { ALAP, all, belep, magyarra, mindetKinyit, tullogas } from "./kozos.mjs";

export const nev = "Szerződésfordítás";

/**
 * A szerződés keretének magyar szavai.
 *
 * Ékezetre szűrni itt nem lehet: a példaadatban a felek neve, az anyja neve és
 * a cím is ékezetes, és azok a fordításban is úgy maradnak — azok a felek
 * adatai, nem a szerződés kerete. Ezek a szavak viszont névben és címben nem
 * fordulnak elő, tehát ha felbukkannak, az egy le nem fordított modul.
 *
 * A teljes, minden mondatra kiterjedő vizsgálat az egységkapuban van
 * (`src/__tests__/szerzodes-forditas.test.ts`), ahol a példaadat pont ezért
 * ékezet nélküli.
 */
const MAGYAR_KERET = [
  "Bérbeadó",
  "Bérlő",
  "köteles",
  "kötelesek",
  "szerződés",
  "Szerződés",
  "Felek",
  "bérleti díj",
  "napjáig",
];

function magyarMondatok(szoveg) {
  return szoveg
    .split("\n")
    .map((sor) => sor.trim())
    .filter((sor) => sor !== "")
    .filter((sor) => MAGYAR_KERET.some((szo) => sor.includes(szo)));
}

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
  return oldal.url();
}

/** A letöltési útvonal tartalma, ugyanazzal a munkamenettel. */
async function letoltes(oldal, ut) {
  const valasz = await oldal.request.get(`${ALAP}${ut}`);
  return { kod: valasz.status(), szoveg: await valasz.text() };
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);

  const ut = await ujSzerzodestKeszit(oldal);
  const id = ut.split("/").pop();
  all(true, "a bérbeadó szerződéstervezetet készít");

  await mindetKinyit(oldal);

  const szakasz = oldal
    .locator("details")
    .filter({ hasText: "Angol fordítás" })
    .first();
  all((await szakasz.count()) > 0, "a szerződés lapján van angol fordítás szakasz");

  const lapSzoveg = await szakasz.innerText();
  all(
    lapSzoveg.includes("INFORMATIVE ENGLISH TRANSLATION"),
    "a lapon látszó fordítás fejlécében ott a tájékoztató jelleg",
  );
  all(
    lapSzoveg.includes("RESIDENTIAL LEASE AGREEMENT"),
    "a tervezethez is készül fordítás, nem csak a véglegesítetthez",
  );

  // A magyar szöveg ettől nem változik: a fordítás melléklet, nem másik verzió.
  const magyarLetoltes = await letoltes(oldal, `/szerzodesek/${id}/letoltes`);
  all(magyarLetoltes.kod === 200, "a magyar szöveg továbbra is letölthető");
  all(
    magyarLetoltes.szoveg.includes("LAKÁSBÉRLETI SZERZŐDÉS"),
    "a magyar letöltés magyarul jön",
  );
  all(
    !magyarLetoltes.szoveg.includes("INFORMATIVE ENGLISH TRANSLATION"),
    "a magyar okiratba nem kerül bele a fordítás fejléce",
  );

  const angolLetoltes = await letoltes(oldal, `/szerzodesek/${id}/letoltes?nyelv=en`);
  all(angolLetoltes.kod === 200, "a fordítás letölthető");
  all(
    angolLetoltes.szoveg.includes("the Hungarian text prevails"),
    "a letöltött fordítás maga mondja ki, hogy a magyar az irányadó",
  );

  // Önpróba: a szűrő tényleg megfogja a magyar mondatot. Enélkül nem lehetne
  // tudni, hogy a következő állítás nem azért zöld, mert semmit nem néz.
  all(
    magyarMondatok("A Bérlő köteles fizetni.").length === 1,
    "a magyarkeresés megfogja a magyar mondatot",
  );
  all(
    magyarMondatok(magyarLetoltes.szoveg).length > 10,
    "a magyarkeresés a magyar okiraton sok találatot ad",
  );

  const maradek = magyarMondatok(angolLetoltes.szoveg);
  all(maradek.length === 0, `a fordításban nem maradt magyar mondat (${maradek[0] ?? "-"})`);

  // A pontok száma a két nyelven ugyanannyi: a felek egymásnak a pont
  // sorszámára fognak hivatkozni.
  //
  // Az aláírási részt előbb levágjuk. A magyar tanúsorok („1. tanú neve és
  // lakcíme") ugyanúgy számmal és ponttal kezdődnek, mint egy szakaszcím, az
  // angol megfelelőjük („Name and address of witness 1") viszont nem — enélkül
  // a számlálás kettővel többet találna magyarul, és az állítás hamisan bukna.
  const pontokig = (szoveg, zaro) => szoveg.split(zaro)[0];
  const magyarPontok =
    (pontokig(magyarLetoltes.szoveg, "\nKelt:").match(/^\d+\. /gm) ?? []).length;
  const angolPontok =
    (pontokig(angolLetoltes.szoveg, "\nSigned at:").match(/^\d+\. /gm) ?? []).length;
  all(magyarPontok > 10, `a magyar szerződésnek van elég pontja (${magyarPontok})`);
  all(
    magyarPontok === angolPontok,
    `a két nyelv pontjainak száma egyezik (${magyarPontok} és ${angolPontok})`,
  );

  all((await tullogas(oldal)) <= 1, "a fordítás szakasza elfér 360 képponton");

  // Véglegesítés: innentől a befagyasztott fordítás jön.
  const jelolo = oldal.locator('input[name="azonossagEllenorizve"]').first();
  if (await jelolo.count()) await jelolo.check();
  await oldal.getByRole("button", { name: /^Véglegesítés/ }).first().click();
  await oldal.waitForLoadState("networkidle");
  await oldal.waitForTimeout(500);

  const veglegesAngol = await letoltes(oldal, `/szerzodesek/${id}/letoltes?nyelv=en`);
  all(veglegesAngol.kod === 200, "a véglegesített szerződés fordítása is letölthető");
  all(
    veglegesAngol.szoveg === angolLetoltes.szoveg,
    "a véglegesítéskor befagyasztott fordítás ugyanaz, mint a tervezeté volt",
  );

  // A bérlő a dokumentumai közt is megtalálja, külön hivatkozáson.
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/berlo/dokumentumok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  const berloiHivatkozas = oldal.locator('a[href*="nyelv=en"]').first();
  all(
    (await berloiHivatkozas.count()) > 0,
    "a bérlő a dokumentumai közt megtalálja az angol fordítást",
  );

  const berloiLetoltes = await letoltes(
    oldal,
    await berloiHivatkozas.getAttribute("href"),
  );
  all(berloiLetoltes.kod === 200, "a bérlő le is tudja tölteni a fordítást");
  all(
    berloiLetoltes.szoveg.includes("INFORMATIVE ENGLISH TRANSLATION"),
    "a bérlőnek adott példány is kimondja, hogy csak tájékoztató",
  );
}
