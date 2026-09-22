/**
 * Telefonméret-próba.
 *
 * Két kérdést tesz fel minden oldalon, és egyiket sem lehet nagy kijelzőn
 * észrevenni.
 *
 * Az első: kilóg-e valami vízszintesen 360 képpontnál. A bérbeadó telefonján
 * ez az első pillanatban látszik — oldalra kell húzogatni a táblázatot, és a
 * gomb kicsúszik a képernyőről.
 *
 * A második: milyen hosszú a lap. Ez lassan romlik el, és nem egy hibás
 * sortól, hanem attól, hogy gyűlik az adat. A befizetések lapja egy év
 * példaadattól tizenhat telefonképernyő magas lett, és semmi nem szólt: a
 * tételek szépen jelentek meg, csak épp használhatatlanul sokan. Ezért van itt
 * felső korlát: ami hosszabb, azt csoportosítani vagy összecsukni kell.
 */

import { ALAP, SZELESSEG, all, belep, magyarra, tullogas } from "./kozos.mjs";

const BERBEADOI = [
  "/",
  "/befizetesek",
  "/berlok",
  "/ingatlanok",
  "/rezsi",
  "/ado",
  "/dokumentumok",
  "/hibak",
  "/teendok",
  "/beallitasok",
];

const BERLOI = ["/berlo", "/berlo/hibak", "/berlo/dokumentumok", "/berlo/betekinto", "/berlo/adatok"];

// A betekintő nyilvános oldala szándékosan hiányzik: a megnyitása számít, és
// azt a saját próbája méri. Az oldal méretét ott ellenőrizzük.
const NYILVANOS = ["/belepes", "/jogi/adatkezeles", "/jogi/feltetelek"];

/**
 * Hány telefonképernyőnél nem lehet hosszabb egy lap.
 *
 * A korlát azt fogja meg, ami magától romlik el: az adattal együtt növő lista.
 * A befizetések lapja egy év példaadattól tizenhat képernyő magas lett, a
 * szerződéstervezet huszonegy. Nyolc képernyő az a hossz, amit a leghosszabb
 * lapunk indokoltan elér — a szerződéstervezet, ahol az a húsz űrlapmező
 * maga a munka —, és jóval a romlás alatt van.
 *
 * A korlát a példaadaton mér, ami egy éves jogviszonyt tartalmaz: ha ott
 * tartható, valódi használat közben is az marad. Ha egy lap átlépi,
 * csoportosítani vagy összecsukni kell, nem a korlátot emelni.
 */
const KEPERNYO = 844;
const MAX_KEPERNYO = 8;

async function vizsgal(oldal, utvonalak) {
  for (const utvonal of utvonalak) {
    await oldal.goto(`${ALAP}${utvonal}`);
    await oldal.waitForLoadState("networkidle");

    const tobblet = await tullogas(oldal);
    all(tobblet <= 1, `${utvonal} elfér ${SZELESSEG} képponton (túllógás: ${tobblet}px)`);

    const magassag = await oldal.evaluate(() => document.documentElement.scrollHeight);
    const kepernyok = magassag / KEPERNYO;
    all(
      kepernyok <= MAX_KEPERNYO,
      `${utvonal} nem hosszabb ${MAX_KEPERNYO} telefonképernyőnél (${kepernyok.toFixed(1)} képernyő, ${magassag}px)`,
    );
  }
}

export const nev = "Telefonméret";

/**
 * A mérés önpróbája.
 *
 * Ebben a munkamenetben két olyan próbaállítás derült ki, ami mindig igazat
 * adott: egy szövegkeresés nem törő szóköz miatt, és egy nézet, ami üres
 * táblát olvasott. Egy kapu, ami mindenre igent mond, rosszabb a semminél,
 * ezért a magasságmérés előbb bizonyítja, hogy egyáltalán mér valamit.
 */
async function meresOnprobaja(oldal) {
  await oldal.goto(`${ALAP}/belepes`);
  const elotte = await oldal.evaluate(() => document.documentElement.scrollHeight);
  // Kétszer akkora, mint a korlát. Nem pontos összeadást várunk — a lap
  // legalsó eleme lehet nyújtott is —, hanem azt, hogy a mérés együtt nő a
  // tartalommal, és hogy ekkora lapon a korlát tényleg elbukik.
  const beszurt = KEPERNYO * MAX_KEPERNYO * 2;
  await oldal.evaluate((magas) => {
    const proba = document.createElement("div");
    proba.id = "meres-onproba";
    proba.style.height = `${magas}px`;
    document.body.append(proba);
  }, beszurt);
  const utana = await oldal.evaluate(() => document.documentElement.scrollHeight);
  await oldal.evaluate(() => document.getElementById("meres-onproba")?.remove());

  all(
    utana > elotte,
    `a magasságmérés együtt nő a tartalommal (${elotte}px → ${utana}px)`,
  );
  all(
    utana / KEPERNYO > MAX_KEPERNYO,
    `a korlát elbukna egy ilyen hosszú lapon (${(utana / KEPERNYO).toFixed(1)} képernyő)`,
  );

  const visszaall = await oldal.evaluate(() => document.documentElement.scrollHeight);
  all(visszaall === elotte, "a próba nem hagy nyomot a lapon");
}

/** A szerződéstervezet a leghosszabb lap, de az azonosítója nem rögzített. */
async function szerzodesUtja(oldal) {
  await oldal.goto(`${ALAP}/dokumentumok`);
  await oldal.waitForLoadState("networkidle");
  const hivatkozas = oldal
    .locator('a[href^="/szerzodesek/"]:not([href$="/letoltes"])')
    .first();
  return (await hivatkozas.count()) === 0 ? null : hivatkozas.getAttribute("href");
}

export async function futtat(oldal) {
  await meresOnprobaja(oldal);
  await vizsgal(oldal, NYILVANOS);
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await vizsgal(oldal, BERBEADOI);
  const szerzodes = await szerzodesUtja(oldal);
  all(szerzodes !== null, "van szerződéslap, amin a hossz mérhető");
  if (szerzodes) await vizsgal(oldal, [szerzodes]);
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await vizsgal(oldal, BERLOI);
}
