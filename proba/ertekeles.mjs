/**
 * Kölcsönös, a másik fél elől rejtett értékelés a jogviszony végén.
 *
 * Amit ez a próba megfog, és más nem: a másik fél szövege **tényleg nincs ott
 * a lapon** felfedés előtt. Ez az, amit a típusellenőrzés és a fordítás
 * biztosan nem néz meg, és amit egy elrejtő CSS-szabály némán elrontana — a
 * szöveg ott állna a forrásban, csak nem látszana.
 *
 * A próbát a példaadat állapota indítja: Eszter már megírta a bérbeadóról a
 * sajátját, a bérbeadó még nem. Onnantól a próba maga írja meg a bérbeadóét, és
 * megnézi, hogy attól — és csak attól — fedődik fel Eszteré.
 *
 * Idempotens: a bérbeadó értékelése felfedésig módosítható, tehát a második
 * futás ugyanazt a sort írja át. Felfedés után viszont már nem, ezért a próba
 * a felfedett állapotot is kezelni tudja.
 */

import { ALAP, all, belep, magyarra, tullogas } from "./kozos.mjs";

export const nev = "Kölcsönös értékelés";

/** Eszter szövegének egy darabja. Ez az, aminek nem szabad kiszivárognia. */
const ESZTER_MONDATA = "A csöpögő csapot két napon belül megcsinálta";
const BERBEADO_SZOVEGE =
  "Pontosan fizetett, a lakást tisztán adta vissza, és mindenről előre szólt.";

async function lap(oldal) {
  await oldal.goto(`${ALAP}/ertekelesek`);
  await oldal.waitForLoadState("networkidle");
}

/** A lap teljes forrása, nem csak a látható szöveg: az elrejtés nem védelem. */
async function forras(oldal) {
  return oldal.content();
}

async function berbeadoOldal(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await lap(oldal);

  all((await tullogas(oldal)) <= 1, "az értékelés lapja elfér 360 képponton");
  all(
    (await oldal.getByText("Zuglói kislakás").count()) > 0,
    "a lezárt bérlet ott van az értékelés lapján",
  );
  all(
    (await oldal.getByText("Ferencvárosi garzon").count()) === 0,
    "a futó bérlet nem kerül az értékelés lapjára",
  );

  // Önpróba: a keresett mondat egyáltalán megtalálható-e, ha ott van. Enélkül
  // a „nincs ott" állítás akkor is igaz lenne, ha a keresés mindig üres.
  const vanEszterAdatban = (await forras(oldal)).includes("Tóth Eszter");
  all(vanEszterAdatban, "a másik fél neve ott áll a lapon (tehát a keresés működik)");

  return oldal;
}

/** A lényeg: a bérbeadó saját értékelése nélkül Eszteré sehol nincs. */
async function vakEllenorzes(oldal) {
  const tartalom = await forras(oldal);
  all(
    !tartalom.includes(ESZTER_MONDATA),
    "a másik fél szövege nincs a lap forrásában, amíg nincs felfedve",
  );
}

/** Egy szempont pontjának megadása a címkéjére koppintva. */
async function pontot(urlap, szempont, pont) {
  const cimke = urlap
    .locator(`label:has(input[name="pont_${szempont}"][value="${pont}"])`)
    .first();
  const doboz = await cimke.boundingBox();
  all(
    doboz !== null && doboz.height >= 44,
    `a(z) ${szempont} ${pont}-ös gombja megüti a 44 képpontot (${Math.round(doboz?.height ?? 0)}px)`,
  );
  await cimke.click();
}

async function urlapotKitolt(oldal) {
  const urlap = oldal.locator('form:has(textarea[name="szoveg"])').first();
  all((await urlap.count()) > 0, "van űrlap a saját értékelés megírásához");

  // A pontot a feliratára koppintva adjuk meg, ahogy a felhasználó is: a
  // rádiógomb maga képernyőolvasónak szól, a kattintható felület a címke.
  // Ezzel az is kiderül, ha a címke egyszer kisebb lenne a 44 képpontnál.
  await pontot(urlap, "fizetes", "5");
  await pontot(urlap, "allapot", "4");
  await pontot(urlap, "kommunikacio", "5");
  await urlap.locator('textarea[name="szoveg"]').fill("   ");
  await urlap.getByRole("button", { name: /Értékelés mentése/ }).click();
  await oldal.waitForLoadState("networkidle");
  await oldal.waitForTimeout(400);

  const elutasitas = oldal.locator('form:has(textarea[name="szoveg"])').first();
  all(
    (await elutasitas.getByText("pontszám magyarázat nélkül nincs").count()) > 0 ||
      (await elutasitas.getByText(/magyarázat nélkül/).count()) > 0,
    "magyarázat nélkül a kiszolgáló nem menti el az értékelést",
  );
  all(
    (await elutasitas.locator('input[name="pont_fizetes"][value="5"]').isChecked()) === true,
    "az elutasított mentés nem viszi el a bejelölt pontokat",
  );

  await elutasitas.locator('textarea[name="szoveg"]').fill(BERBEADO_SZOVEGE);
  await elutasitas.getByRole("button", { name: /Értékelés mentése/ }).click();
  await oldal.waitForLoadState("networkidle");
  await oldal.waitForTimeout(600);
}

export async function futtat(oldal) {
  await berbeadoOldal(oldal);

  // Azt, hogy kell-e még írni, **nem** abból döntjük el, látszik-e Eszter
  // szövege: pont az a kérdés. A saját értékelés megléte a jele, és az a
  // szivárgástól független. Enélkül egy szivárgó kiszolgáló csak kihagyatná a
  // vakságpróbát, és a kapu zöld maradna arra, amit mérni akarunk vele.
  const sajatMegvan = (await oldal.getByText("Amit te írtál").count()) > 0;
  if (!sajatMegvan) {
    await vakEllenorzes(oldal);
    all(
      (await oldal.getByText("Rajtad a sor").count()) > 0,
      "a lap megmondja, hogy a bérbeadón a sor",
    );
    await urlapotKitolt(oldal);
    await lap(oldal);
  }

  // A saját értékelés megírása után mindkettő ott van.
  const tartalom = await forras(oldal);
  all(tartalom.includes(ESZTER_MONDATA), "a saját értékelés megírása felfedi a másikét");
  all(tartalom.includes(BERBEADO_SZOVEGE), "a saját értékelés is ott marad a lapon");
  all(
    (await oldal.getByText("Felfedve").count()) > 0,
    "a lap kiírja, hogy az értékelések felfedődtek",
  );

  // Felfedés után az űrlap eltűnik: amit a másik fél elolvasott, azt nem
  // írjuk át. Ez a kiszolgálón is áll, de a lapnak sem szabad felkínálnia.
  all(
    (await oldal.locator('form:has(textarea[name="szoveg"])').count()) === 0,
    "felfedés után nincs mit módosítani az űrlapon",
  );

  // A bérlő oldala: Eszter a sajátját és a bérbeadóét is látja.
  await belep(oldal, "eszter@pelda.hu");
  await magyarra(oldal);
  await lap(oldal);
  all((await tullogas(oldal)) <= 1, "a bérlő értékeléslapja is elfér 360 képponton");

  const berloTartalom = await forras(oldal);
  all(berloTartalom.includes(ESZTER_MONDATA), "a bérlő látja a saját értékelését");
  all(berloTartalom.includes(BERBEADO_SZOVEGE), "a bérlő látja a róla szólót is");

  // Anna futó bérlete nem kerül ide: értékelni a lezárás után lehet.
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await lap(oldal);
  const annaTartalom = await forras(oldal);
  all(
    !annaTartalom.includes(ESZTER_MONDATA),
    "a másik bérlő értékelése nem szivárog át a harmadik félhez",
  );
  all(
    (await oldal.getByText("Még nincs lezárt bérleted").count()) > 0,
    "a futó bérletű bérlőnek nincs mit értékelnie, és a lap ezt ki is mondja",
  );
}
