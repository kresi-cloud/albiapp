/**
 * Telepíthetőség: mitől lesz az alkalmazásból telefonra és gépre tehető
 * alkalmazás.
 *
 * Az Albi weblap marad — nincs alkalmazásbolt, nincs külön Android- és
 * iOS-változat —, de a böngészők fel tudják tenni a kezdőképernyőre és a Start
 * menübe, saját ikonnal és saját ablakkal. Ehhez három dolog kell: egy
 * leíró (`manifest`), a hozzá tartozó ikonok, és egy szervizmunkás, ami
 * kapcsolat nélkül is ad választ. Az első kettő él itt.
 *
 * Miért a domainben: a telepíthetőség feltételei nem ízléskérdések, hanem a
 * böngészők kimondott elvárásai — 192 és 512 képpontos ikon, `start_url`,
 * `display`. Ha ez a felületi kódban állna, egy elgépelt ikonméret attól még
 * hibátlanul megjelenő lapot adna, és csak az derülne ki belőle, hogy a
 * telepítés felajánlása elmarad. Itt viszont teszt őrzi.
 *
 * A szöveg ezen felül is a szótárból jön: a telepítő ablakban az alkalmazás
 * leírása a felhasználó nyelvén áll, mert a bérlő gyakran nem olvas magyarul.
 */

import type { Nyelv } from "./nyelv";

/** A munkanév. Márkanév, nem fordítandó szöveg: mindkét nyelven ugyanaz. */
export const NEV = "Albi";

/**
 * A telepített alkalmazás színei.
 *
 * A leíró egyetlen színpárt ismer, sötét módra nincs benne másik: ezek a
 * világos értékek. A `HATTERSZIN` a lap színe — ezt mutatja az indítókép,
 * amíg az alkalmazás betölt —, a `SAVSZIN` pedig ugyanaz, mint a lap
 * `theme-color` címkéje, mert az alkalmazás ablakának a fejléce és a böngésző
 * sávja egymás mellett látszik.
 */
export const HATTERSZIN = "#f8f6f3";
export const SAVSZIN = "#ffffff";

export type ManifestIkon = {
  src: string;
  sizes: string;
  type: string;
  purpose?: "any" | "maskable";
};

/**
 * Az ikonok.
 *
 * A 192 és az 512 képpontos méretet a böngészők kérik számon; a `maskable`
 * pedig azért külön kép, mert az Android a saját alakjára vágja az ikont
 * (kör, lekerekített négyzet), és abból a rajz széle kimaradna. A vágható
 * változaton ezért a jel kisebb, a háttér pedig a szélekig ér.
 */
export const IKONOK: ManifestIkon[] = [
  { src: "/ikonok/albi-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/ikonok/albi-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  {
    src: "/ikonok/albi-maskable-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];

/** Az iOS a saját meta címkéjéből veszi a kezdőképernyő ikonját. */
export const IOS_IKON = "/ikonok/albi-apple-180.png";

/** A böngésző fülén és a címsorban álló jel. */
export const JEL_IKON = "/ikonok/albi.svg";

export type Manifest = {
  id: string;
  name: string;
  short_name: string;
  description: string;
  lang: Nyelv;
  dir: "ltr";
  start_url: string;
  scope: string;
  display: "standalone";
  background_color: string;
  theme_color: string;
  icons: ManifestIkon[];
};

/**
 * Az alkalmazásleíró.
 *
 * A `start_url` a gyökér, nem a bérbeadói vagy a bérlői kezdőlap: a kettő
 * közül a belépett szerep dönt, és ugyanarra az ikonra kattinthat mindkét fél.
 * A `scope` ugyanez, tehát az alkalmazás ablakában marad minden saját lap; a
 * kifelé mutató hivatkozás a böngészőben nyílik, ahogy kell.
 *
 * Gyorsindítók (`shortcuts`) szándékosan nincsenek: a lista a telepítés
 * pillanatában fagy be, a menüpontok viszont szerepenként mások — a bérlőnek
 * nincs befizetés-egyeztetés lapja. Egy ikonra kattintva megnyíló „nem
 * található” rosszabb, mint a hiányzó gyorsindító.
 */
export function manifest(nyelv: Nyelv, leiras: string): Manifest {
  return {
    id: "/",
    name: NEV,
    short_name: NEV,
    description: leiras,
    lang: nyelv,
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: HATTERSZIN,
    theme_color: SAVSZIN,
    icons: IKONOK,
  };
}

/**
 * A telepítés módja platformonként.
 *
 * Miért kell leírni: Androidon és gépen a böngésző maga ajánlja fel a
 * telepítést, iOS-en **soha** — ott a megosztás menüjében van, és aki nem
 * tudja, az nem találja meg. Épp a bérlő az, aki iPhone-t használ és nem
 * olvas magyarul: enélkül a telepítés nála egyszerűen nem történne meg.
 *
 * A lépések a szótárban élnek, itt csak a kulcsuk; a `telepites` teszt
 * megnézi, hogy mindegyikhez tartozik-e mondat.
 */
export type Telepitesmod = { kulcs: string; cim: string; lepesek: string[] };

export const TELEPITES_MODOK: Telepitesmod[] = [
  {
    kulcs: "android",
    cim: "telepites.android.cim",
    lepesek: [
      "telepites.android.1",
      "telepites.android.2",
      "telepites.android.3",
    ],
  },
  {
    kulcs: "ios",
    cim: "telepites.ios.cim",
    lepesek: ["telepites.ios.1", "telepites.ios.2", "telepites.ios.3"],
  },
  {
    kulcs: "asztali",
    cim: "telepites.asztali.cim",
    lepesek: [
      "telepites.asztali.1",
      "telepites.asztali.2",
      "telepites.asztali.3",
    ],
  },
];
