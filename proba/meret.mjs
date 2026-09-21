/**
 * Telefonméret-próba.
 *
 * Három kérdést tesz fel minden oldalon, és egyiket sem lehet nagy kijelzőn
 * észrevenni.
 *
 * Az első: kilóg-e valami vízszintesen 360 képpontnál. A bérbeadó telefonján
 * ez az első pillanatban látszik — oldalra kell húzogatni a táblázatot, és a
 * gomb kicsúszik a képernyőről.
 *
 * A második: kilóg-e valami akkor is, ha az összecsukott szakaszok ki vannak
 * nyitva. Csukva a lap rövid, és a benne ülő széles elem — egy legördülő, egy
 * hosszú gombfelirat — nem is látszik; a felhasználó viszont ki fogja nyitni.
 *
 * A harmadik: milyen hosszú a lap. Ez lassan romlik el, és nem egy hibás
 * sortól, hanem attól, hogy gyűlik az adat. A befizetések lapja egy év
 * példaadattól tizenhat telefonképernyő magas lett, és semmi nem szólt: a
 * tételek szépen jelentek meg, csak épp használhatatlanul sokan. Ezért van itt
 * felső korlát: ami hosszabb, azt csoportosítani vagy összecsukni kell.
 *
 * Mindhármat mindkét nyelven megméri. A mérés korábban csak magyarul futott,
 * és ez pont a nyelvre jellemző hibát engedte át: az angol felirat hosszabb
 * („Kit terhel a költség" helyett „Who bears the cost"), tehát előbb lóg ki és
 * előbb tör sorba — a magyar lapon viszont semmi nem látszik belőle. Egy kapu,
 * ami csak az egyik nyelvet nézi, a felület felét nem őrzi.
 */

import {
  ALAP,
  SZELESSEG,
  all,
  belep,
  mindetKinyit,
  nyelvre,
  tullogas,
} from "./kozos.mjs";

/** A két felületi nyelv, és a magyar megnevezésük a próba üzeneteihez. */
const NYELVEK = [
  ["hu", "magyarul"],
  ["en", "angolul"],
];

const BERBEADOI = [
  "/",
  "/befizetesek",
  "/berlok",
  "/ingatlanok",
  "/rezsi",
  "/ado",
  "/dokumentumok",
  "/hibak",
  "/uzenetek",
  "/beallitasok",
];

const BERLOI = [
  "/berlo",
  "/berlo/hibak",
  "/berlo/uzenetek",
  "/berlo/jegyzokonyvek",
  "/berlo/dokumentumok",
  "/berlo/betekinto",
  "/berlo/adatok",
];

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

async function vizsgal(oldal, utvonalak, cimke) {
  for (const utvonal of utvonalak) {
    const valasz = await oldal.goto(`${ALAP}${utvonal}`);
    // Előbb az, hogy a lap egyáltalán létezik. A hibalap rövid és keskeny,
    // tehát minden méretállítást simán teljesít: a `/teendok` évekig szerepelt
    // ebben a listában úgy, hogy nincs is ilyen lap, és a kapu végig igent
    // mondott rá. Egy kapu, ami a semmit is átengedi, rosszabb a semminél.
    all(
      (valasz?.status() ?? 0) < 400,
      `${utvonal} létező lap ${cimke} (válasz: ${valasz?.status() ?? "nincs"})`,
    );
    await oldal.waitForLoadState("networkidle");

    const tobblet = await tullogas(oldal);
    all(
      tobblet <= 1,
      `${utvonal} elfér ${SZELESSEG} képponton ${cimke} (túllógás: ${tobblet}px)`,
    );

    // A hosszt csukva mérjük: az összecsukás a lap része, nem a próba
    // kényelme. A szélességet viszont kinyitva is, mert a csukott szakaszban
    // ülő széles elem ugyanúgy kilóg, amint a felhasználó rákattint.
    const magassag = await oldal.evaluate(() => document.documentElement.scrollHeight);
    const kepernyok = magassag / KEPERNYO;
    all(
      kepernyok <= MAX_KEPERNYO,
      `${utvonal} nem hosszabb ${MAX_KEPERNYO} telefonképernyőnél ${cimke} (${kepernyok.toFixed(1)} képernyő, ${magassag}px)`,
    );

    await mindetKinyit(oldal);
    const nyitva = await tullogas(oldal);
    all(
      nyitva <= 1,
      `${utvonal} kinyitott szakaszokkal is elfér ${cimke} (túllógás: ${nyitva}px)`,
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

/**
 * A létezésellenőrzés önpróbája.
 *
 * Ez az az állítás, ami eddig hiányzott, tehát itt a legfontosabb kimondani,
 * hogy tényleg elutasítja a rosszat: egy biztosan nem létező útvonalra
 * elvárjuk a hibakódot.
 */
async function letezesOnprobaja(oldal) {
  const valasz = await oldal.goto(`${ALAP}/nincs-ilyen-lap-sosem-volt`);
  all(
    (valasz?.status() ?? 0) >= 400,
    `a létezésellenőrzés elutasít egy nem létező lapot (válasz: ${valasz?.status() ?? "nincs"})`,
  );
}

/**
 * A szélességmérés önpróbája.
 *
 * Ugyanaz az ok, mint a magasságnál: ha a mérés mindenre nullát adna, a kapu
 * némán engedne át minden kilógást. Beszúrunk egy a képernyőnél szélesebb
 * elemet, és elvárjuk, hogy a mérés meglássa.
 */
async function szelessegOnprobaja(oldal) {
  await oldal.goto(`${ALAP}/belepes`);
  const elotte = await tullogas(oldal);
  await oldal.evaluate((szeles) => {
    const proba = document.createElement("div");
    proba.id = "szelesseg-onproba";
    proba.style.width = `${szeles}px`;
    proba.style.height = "1px";
    document.body.append(proba);
  }, SZELESSEG * 2);
  const utana = await tullogas(oldal);
  await oldal.evaluate(() => document.getElementById("szelesseg-onproba")?.remove());

  all(
    utana > SZELESSEG / 2,
    `a szélességmérés meglátja a kilógó elemet (${elotte}px → ${utana}px)`,
  );
  all((await tullogas(oldal)) === elotte, "a szélességpróba nem hagy nyomot a lapon");
}

/**
 * A dinamikus lapok útja nem rögzített, de mérni kell őket: a
 * szerződéstervezet a leghosszabb lapunk, a jegyzőkönyv pedig fényképalbumot
 * hordoz, ami adattal együtt nő.
 */
async function dokumentumUtja(oldal, elotag) {
  await oldal.goto(`${ALAP}/dokumentumok`);
  await oldal.waitForLoadState("networkidle");
  const hivatkozas = oldal
    .locator(`a[href^="${elotag}"]:not([href$="/letoltes"])`)
    .first();
  return (await hivatkozas.count()) === 0 ? null : hivatkozas.getAttribute("href");
}

export async function futtat(oldal) {
  await meresOnprobaja(oldal);
  await szelessegOnprobaja(oldal);
  await letezesOnprobaja(oldal);

  for (const [nyelv, cimke] of NYELVEK) {
    await oldal.goto(`${ALAP}/belepes`);
    await nyelvre(oldal, nyelv);
    await vizsgal(oldal, NYILVANOS, cimke);
  }

  await belep(oldal, "berbeado@pelda.hu");
  for (const [nyelv, cimke] of NYELVEK) {
    await oldal.goto(`${ALAP}/`);
    await nyelvre(oldal, nyelv);
    await vizsgal(oldal, BERBEADOI, cimke);

    const szerzodes = await dokumentumUtja(oldal, "/szerzodesek/");
    all(szerzodes !== null, `van szerződéslap, amin a hossz mérhető (${cimke})`);
    if (szerzodes) await vizsgal(oldal, [szerzodes], cimke);

    const jegyzokonyv = await dokumentumUtja(oldal, "/jegyzokonyvek/");
    all(jegyzokonyv !== null, `van jegyzőkönyvlap, amin a hossz mérhető (${cimke})`);
    if (jegyzokonyv) await vizsgal(oldal, [jegyzokonyv], cimke);
  }

  await belep(oldal, "anna@pelda.hu");
  for (const [nyelv, cimke] of NYELVEK) {
    await oldal.goto(`${ALAP}/berlo`);
    await nyelvre(oldal, nyelv);
    await vizsgal(oldal, BERLOI, cimke);
  }

  // A nyelv választása sütiben él, tehát átmenne a következő próbára is.
  await oldal.goto(`${ALAP}/berlo`);
  await nyelvre(oldal, "hu");
}
