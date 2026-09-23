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

/**
 * A leghosszabb összeg, amivel a lapnak még el kell férnie.
 *
 * A mérés eddig azon múlott, mekkora szám áll épp a példaadatban, és ezen a
 * szerencsén át is csúszott egy valódi hiba: az áttekintő elmaradás-kártyája
 * angolul, hétjegyű összegnél kilógott 360 képponton. Hatjegyűnél nem, és a
 * seedben épp hatjegyű állt. Magyarul soha nem látszott, mert a magyar alak
 * szóközökkel tagol, tehát sorba tud törni — az angol nem: a pénznevet nem
 * törhető szóköz köti a számhoz, a számot az ezrestagoló vessző.
 *
 * Ezért a lapot a leghosszabb összeggel is megmérjük. Százmilliós elmaradás
 * egy magánbérbeadónál nincs; pont ez a lényeg, hogy a kapu ne a példaadat
 * nagyságrendjén múljon.
 */
const HOSSZU_OSSZEG = { hu: "123 456 789 Ft", en: "HUF\u00a0123,456,789" };

/** Hány összeget írtunk át a futás során, és sikerült-e egyet is. */
let hosszuOsszegDarab = 0;
let hosszuOsszegCserelt = false;

/**
 * Amit összegnek tekintünk a lapon.
 *
 * Nem az `Osszeg` elemre szűrünk, hanem a szövegre: az összegek fele nem
 * azon az elemen megy — a rezsi és az adóösszesítő például sima szövegként
 * írja ki őket —, és épp azokon a lapokon nem venné észre semmi a bajt.
 */
const OSSZEG_MINTA = { hu: "\\d[\\d\\s]*\\sFt", en: "HUF\\s[\\d,]+" };

/**
 * Minden összeget kicserél a leghosszabbra, és megmondja, hányat talált.
 *
 * Szövegcsomó szinten dolgozik, mert az összeg sokszor egy mondat közepén
 * áll. A találatokat előbb összegyűjti, és csak utána ír: a bejáró a
 * módosítástól elveszítené a helyét.
 */
async function hosszuOsszegetIr(oldal, nyelv) {
  const { darab, cserelt } = await oldal.evaluate(
    ([ertek, mintaSzoveg]) => {
      const minta = new RegExp(mintaSzoveg, "g");
      const jaro = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const talalatok = [];
      let csomo;
      while ((csomo = jaro.nextNode())) {
        minta.lastIndex = 0;
        if (minta.test(csomo.nodeValue)) talalatok.push(csomo);
      }
      let cserelt = false;
      for (const talalat of talalatok) {
        minta.lastIndex = 0;
        talalat.nodeValue = talalat.nodeValue.replace(minta, ertek);
        if (talalat.nodeValue.includes(ertek)) cserelt = true;
      }
      return { darab: talalatok.length, cserelt };
    },
    [HOSSZU_OSSZEG[nyelv], OSSZEG_MINTA[nyelv]],
  );
  hosszuOsszegDarab += darab;
  if (cserelt) hosszuOsszegCserelt = true;
  return darab;
}

const BERBEADOI = [
  "/",
  "/teendok",
  "/latogatasok",
  "/befizetesek",
  "/berlok",
  "/ingatlanok",
  "/rezsi",
  "/elofizetesek",
  "/ado",
  "/dokumentumok",
  "/hibak",
  "/beszelgetesek",
  "/beallitasok",
];

const BERLOI = [
  "/berlo",
  "/berlo/teendok",
  "/berlo/latogatasok",
  "/berlo/hibak",
  "/elofizetesek",
  "/beszelgetesek",
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

async function vizsgal(oldal, utvonalak, nyelv, cimke) {
  for (const utvonal of utvonalak) {
    const valasz = await oldal.goto(`${ALAP}${utvonal}`);
    // Előbb az, hogy a lap egyáltalán létezik. A hibalap rövid és keskeny,
    // tehát minden méretállítást simán teljesít: a `/teendok` sokáig szerepelt
    // ebben a listában úgy, hogy akkor még nem is volt ilyen lap, és a kapu
    // végig igent mondott rá. Egy kapu, ami a semmit is átengedi, rosszabb a
    // semminél.
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

    const darab = await hosszuOsszegetIr(oldal, nyelv);
    if (darab > 0) {
      const hosszan = await tullogas(oldal);
      all(
        hosszan <= 1,
        `${utvonal} a leghosszabb összeggel is elfér ${cimke} (${darab} összeg, túllógás: ${hosszan}px)`,
      );
    }
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
 *
 * Mindegyiket, nem csak az elsőt. Korábban az elsőt mértük, és a példaadatban
 * csak tervezet volt: a véglegesített szerződés lapja emiatt tudott tizenkilenc
 * telefonképernyő magas lenni úgy, hogy a kapu végig zöld maradt. Egy okirat
 * tervezetként és véglegesítve két különböző lap, tehát mindkettőt meg kell
 * mérni.
 */
async function dokumentumUtjai(oldal, elotag) {
  await oldal.goto(`${ALAP}/dokumentumok`);
  await oldal.waitForLoadState("networkidle");
  // A letöltés útja is ezzel az előtaggal kezdődik, és nem mindig a
  // `/letoltes`-re végződik: a fordításé `?nyelv=en`-nel folytatódik. Arra
  // navigálva a böngésző letöltést indít, nem lapot rajzol.
  // Egy okirat több helyről is elérhető a lapról; mérni egyszer kell.
  const utak = await oldal
    .locator(`a[href^="${elotag}"]:not([href*="/letoltes"])`)
    .evaluateAll((elemek) => elemek.map((elem) => elem.getAttribute("href")));
  return [...new Set(utak)];
}

export async function futtat(oldal) {
  await meresOnprobaja(oldal);
  await szelessegOnprobaja(oldal);
  await letezesOnprobaja(oldal);

  for (const [nyelv, cimke] of NYELVEK) {
    await oldal.goto(`${ALAP}/belepes`);
    await nyelvre(oldal, nyelv);
    await vizsgal(oldal, NYILVANOS, nyelv, cimke);
  }

  await belep(oldal, "berbeado@pelda.hu");
  for (const [nyelv, cimke] of NYELVEK) {
    await oldal.goto(`${ALAP}/`);
    await nyelvre(oldal, nyelv);
    await vizsgal(oldal, BERBEADOI, nyelv, cimke);

    // A példaadatban egy tervezet és egy véglegesített szerződés van; ha
    // egyszer csak az egyik marad, ez a két állítás szól, nem a mérés hallgat.
    const szerzodesek = await dokumentumUtjai(oldal, "/szerzodesek/");
    all(szerzodesek.length > 1, `több szerződéslap van, amin a hossz mérhető (${szerzodesek.length}, ${cimke})`);
    await vizsgal(oldal, szerzodesek, nyelv, cimke);

    const jegyzokonyvek = await dokumentumUtjai(oldal, "/jegyzokonyvek/");
    all(jegyzokonyvek.length > 0, `van jegyzőkönyvlap, amin a hossz mérhető (${cimke})`);
    await vizsgal(oldal, jegyzokonyvek, nyelv, cimke);
  }

  await belep(oldal, "anna@pelda.hu");
  for (const [nyelv, cimke] of NYELVEK) {
    await oldal.goto(`${ALAP}/berlo`);
    await nyelvre(oldal, nyelv);
    await vizsgal(oldal, BERLOI, nyelv, cimke);
  }

  // A hosszú összeg önpróbája. Ha a `szam` osztály egyszer elfogy a
  // felületről, ez a mérés némán nullát találna minden lapon, és a kapu
  // ugyanúgy zöld maradna — vagyis megint a semmire mondana igent.
  all(hosszuOsszegDarab > 0, `a hosszú összeg mérése talált összegeket (${hosszuOsszegDarab} db)`);
  all(hosszuOsszegCserelt, "a hosszú összeg tényleg odakerült a lapra");

  // A nyelv választása sütiben él, tehát átmenne a következő próbára is.
  await oldal.goto(`${ALAP}/berlo`);
  await nyelvre(oldal, "hu");
}
