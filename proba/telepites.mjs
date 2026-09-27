/**
 * Telepíthetőség: manifest, ikonok, szervizmunkás, offline lap.
 *
 * Amit ez a próba megfog, és semmi más: **a telepítés elmaradása néma.** Ha az
 * alkalmazásleíró nem a nyelvi sütivel érkezik, ha egy ikon nincs kiszolgálva,
 * ha a szervizmunkás nem áll be, vagy ha kapcsolat nélkül a böngésző saját
 * hibalapja jön a miénk helyett — a lapok mind hibátlanul jelennek meg, a
 * típusellenőrzés és a fordítás is zöld. Csak épp a telefonra nem kerül föl
 * semmi, és senki nem tudja meg, miért.
 *
 * Az offline mérés önpróbával kezd: a hálózat kikapcsolása után egy olyan
 * címet kérünk le, amit szándékosan nem tárolunk (`/manifest.json`), és
 * elvárjuk, hogy **elbukjon**. Enélkül a „kapcsolat nélkül is jön az offline
 * lap" állítás akkor is igaz lenne, ha a hálózat végig élne.
 */

import { ALAP, SZELESSEG, all, belep, kilep, magyarra, nyelvre, tullogas } from "./kozos.mjs";

export const nev = "Telepíthetőség";

const TELEFON = { width: SZELESSEG, height: 844 };
const ASZTALI = { width: 1440, height: 900 };

/** Az alkalmazásleíró a lapon belülről, sütistül — ahogy a böngésző kéri le. */
async function leiro(oldal) {
  return oldal.evaluate(async () => {
    const valasz = await fetch("/manifest.json", { credentials: "include" });
    return {
      allapot: valasz.status,
      tipus: valasz.headers.get("content-type") ?? "",
      tartalom: await valasz.json(),
    };
  });
}

/**
 * Egy fejléccímke tulajdonsága, megvárva.
 *
 * A Next.js a metaadatokat a lap **végén** küldi el, és a React teszi át őket
 * a fejlécbe — vagyis közvetlenül a `goto` után még nincsenek ott. Egy
 * egyszeri `document.head.querySelector` ezért futásonként mást adott: két
 * futáson megtalálta, a harmadikon nem. A keresés helyett tehát várunk rá; ha
 * nem érkezik meg, az valódi hiba, nem időzítés.
 */
async function fejCimke(oldal, valaszto, tulajdonsag) {
  return oldal
    .locator(`head ${valaszto}`)
    .first()
    .getAttribute(tulajdonsag, { timeout: 15000 })
    .catch(() => null);
}

export async function futtat(oldal) {
  // ——— A telepítési súgó belépés nélkül is elérhető ———
  await kilep(oldal);
  await magyarra(oldal);
  await oldal.goto(`${ALAP}/telepites`);
  await oldal.waitForLoadState("networkidle");

  const modok = oldal.locator("[data-telepitesmod]");
  all((await modok.count()) === 3, "a telepítési súgó mindhárom platformot leírja");
  all(
    (await oldal.locator('[data-telepitesmod="ios"]').count()) === 1,
    "az iPhone-os út is ott van: ott a böngésző soha nem ajánlja fel",
  );
  all(!(await tullogas(oldal)), "a telepítési súgó nem lóg ki 360 képponton");

  // ——— Az alkalmazásleíró ———
  const magyar = await leiro(oldal);
  all(magyar.allapot === 200, `az alkalmazásleíró letölthető (${magyar.allapot})`);
  all(
    magyar.tipus.includes("manifest+json"),
    `a leíró a saját típusával érkezik (${magyar.tipus})`,
  );
  all(magyar.tartalom.start_url === "/", "a leíró a gyökérről indítja az alkalmazást");
  all(magyar.tartalom.display === "standalone", "az alkalmazás saját ablakot kap");
  for (const meret of ["192x192", "512x512"]) {
    all(
      magyar.tartalom.icons.some((ikon) => ikon.sizes === meret),
      `a leíróban ott a ${meret} ikon`,
    );
  }
  all(
    magyar.tartalom.icons.some((ikon) => ikon.purpose === "maskable"),
    "és a vágható ikon is, amit az Android a saját alakjára vág",
  );

  const hivatkozas = await fejCimke(oldal, 'link[rel="manifest"]', "crossorigin");
  all(
    hivatkozas === "use-credentials",
    `a leíró hivatkozása sütistül kéri le (${hivatkozas})`,
  );

  // ——— A leíró a felület nyelvén beszél ———
  await nyelvre(oldal, "en");
  const angol = await leiro(oldal);
  all(
    Boolean(magyar.tartalom.description) && Boolean(angol.tartalom.description),
    "mindkét nyelven van leírás a telepítő ablakba",
  );
  all(
    angol.tartalom.description !== magyar.tartalom.description,
    "és a kettő nem ugyanaz: a leíró a nyelvi sütit követi",
  );
  all(angol.tartalom.lang === "en", "a leíró nyelve is átáll");
  all(!(await tullogas(oldal)), "a telepítési súgó angolul sem lóg ki");
  await magyarra(oldal);

  // ——— Az ikonok tényleg ki vannak szolgálva ———
  const ikonok = [
    ...magyar.tartalom.icons.map((ikon) => ikon.src),
    "/ikonok/albi-apple-180.png",
    "/ikonok/albi.svg",
  ];
  for (const ut of ikonok) {
    const valasz = await oldal.request.get(`${ALAP}${ut}`);
    all(valasz.status() === 200, `${ut} letölthető (${valasz.status()})`);
  }

  // ——— Az iPhone meta címkéi ———
  all(
    (await fejCimke(oldal, 'meta[name="apple-mobile-web-app-capable"]', "content")) === "yes",
    "az iPhone kezdőképernyőjéről böngészősáv nélkül indul",
  );
  all(
    (await fejCimke(oldal, 'meta[name="apple-mobile-web-app-title"]', "content")) === "Albi",
    "és a saját nevével kerül ki",
  );
  all(
    Boolean(await fejCimke(oldal, 'link[rel="apple-touch-icon"]', "href")),
    "az iPhone ikonja is meg van adva",
  );

  // ——— A szervizmunkás beáll ———
  await oldal.reload();
  // A várakozás eredményét állítjuk, nem magát a várakozást: egy elbukó
  // `waitForFunction` nyers Playwright-hibát adna, nem próbaüzenetet.
  const vezerelt = await oldal
    .waitForFunction(() => navigator.serviceWorker?.controller !== null, null, {
      timeout: 20000,
    })
    .then(() => true, () => false);
  all(vezerelt, "a szervizmunkás beállt, és a lapot ő szolgálja ki");

  // ——— Kapcsolat nélkül a mi lapunk jön, nem a böngésző hibaoldala ———
  const kontextus = oldal.context();
  await kontextus.setOffline(true);
  try {
    // Önpróba: ami nincs eltéve, az tényleg nem jön — vagyis a hálózat
    // valóban ki van kapcsolva, és amit alább kapunk, az a készülékről jön.
    const nyers = await oldal.evaluate(() =>
      fetch("/manifest.json", { cache: "no-store" }).then(
        () => "megjött",
        () => "elbukott",
      ),
    );
    all(nyers === "elbukott", "önpróba: kapcsolat nélkül a nem tárolt kérés elbukik");

    await oldal.goto(`${ALAP}/befizetesek`);
    const forras = await oldal.content();
    all(forras.includes("Nincs kapcsolat"), "kapcsolat nélkül a saját offline lapunk jön");
    all(
      forras.includes("No connection"),
      "és mindkét nyelven megszólal: a lap a készüléken áll el, nem tudjuk, ki nézi",
    );
    all(
      !forras.includes("Kilépés") && !forras.includes("Sign out"),
      "a készüléken tárolt lapon nincs belépett felhasználó nyoma",
    );
  } finally {
    await kontextus.setOffline(false);
  }

  const vissza = await oldal.goto(`${ALAP}/belepes`);
  all(vissza.status() === 200, "kapcsolat után minden a kiszolgálóról jön tovább");

  // ——— Gépen: a három telepítési leírás egymás mellett ———
  await oldal.setViewportSize(ASZTALI);
  try {
    await oldal.goto(`${ALAP}/telepites`);
    await oldal.waitForLoadState("networkidle");
    all(!(await tullogas(oldal)), "a telepítési súgó gépen sem lóg ki");

    const dobozok = await modok.evaluateAll((elemek) =>
      elemek.map((elem) => elem.getBoundingClientRect().top),
    );
    all(
      dobozok.length === 3 && new Set(dobozok).size === 1,
      `gépen a három leírás egy sorban áll (${dobozok.join(", ")})`,
    );
  } finally {
    await oldal.setViewportSize(TELEFON);
  }

  // A többi próba belépve folytatja, ugyanonnan, ahonnan ez indult.
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
}
