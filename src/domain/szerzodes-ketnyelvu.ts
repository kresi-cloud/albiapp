/**
 * A kétnyelvű szerződéspéldány, és a hozzá tartozó kétoldali döntés.
 *
 * A tájékoztató angol fordítás eddig is elkészült, de az külön melléklet: két
 * papír, és a bérlő azt írja alá, amit nem olvas. A kétnyelvű példány egyetlen
 * okirat, amiben minden pont ott áll magyarul és angolul is — és az aláírás
 * alatt az van, amit mindkét fél elolvasott.
 *
 * Kiadni viszont csak akkor adjuk ki, ha **mindenki támogatja**, akinek fiókja
 * van: az okirat közös, és a másik fél nyelve nem a mi döntésünk. Ugyanaz a
 * kétoldali elv, mint az előfizetésnél és a fényképnél: egy kifogás egymagában
 * dönt, és a kifogás indoklás nélkül nincs.
 *
 * Két dolog szándékosan más, mint a szolgáltatói látogatásnál:
 *
 * - **Fiók nélküli bérlőt itt sem lehet megkérdezni, de az üres kör nem baj.**
 *   A látogatásnál az üres várólista azért nem hozzájárulás, mert abból a
 *   bérbeadó bejutása következne a bérlő távollétében. Itt a következmény a
 *   bérlő javára szól — egy okirat, amit el is tud olvasni —, és a magyar
 *   szöveg marad az irányadó, tehát nincs mit elveszítenie azzal, hogy nem
 *   kérdezték meg.
 * - **A nyilatkozat annyit ér, amennyit a mostani résztvevői kör.** Aki már
 *   nincs a jogviszonyon, annak a szava sem dönt — ugyanaz az elv, mint a
 *   látogatásnál és a beszélgetésnél.
 */

import { uzenet, type Uzenet } from "./nyelv";

export type Nyilatkozat = {
  felhasznaloId: string;
  tamogatja: boolean;
  indoklas: string;
};

export type KetnyelvuAllapot = "tamogatott" | "varakozik" | "kifogasolt";

/** Csak az számít, amit olyan tett, akit tényleg megkérdeztünk. */
function ervenyesek(kerdezettek: string[], nyilatkozatok: Nyilatkozat[]): Nyilatkozat[] {
  const kor = new Set(kerdezettek);
  return nyilatkozatok.filter((sor) => kor.has(sor.felhasznaloId));
}

export function allapota(
  kerdezettek: string[],
  nyilatkozatok: Nyilatkozat[],
): KetnyelvuAllapot {
  const sajat = ervenyesek(kerdezettek, nyilatkozatok);
  // Egy kifogás egymagában dönt: a lakótárs nem szavazhatja le azt, aki nem
  // kéri, és a bérbeadót sem lehet olyan okiratba beleszavazni, amit nem vállal.
  if (sajat.some((sor) => !sor.tamogatja)) return "kifogasolt";

  const tamogatok = new Set(sajat.filter((sor) => sor.tamogatja).map((sor) => sor.felhasznaloId));
  return kerdezettek.every((id) => tamogatok.has(id)) ? "tamogatott" : "varakozik";
}

/** Kitől várunk még választ. Amíg van ilyen, nem mondjuk, hogy eldőlt. */
export function kikreVarunk(kerdezettek: string[], nyilatkozatok: Nyilatkozat[]): string[] {
  const nyilatkozott = new Set(
    ervenyesek(kerdezettek, nyilatkozatok).map((sor) => sor.felhasznaloId),
  );
  return kerdezettek.filter((id) => !nyilatkozott.has(id));
}

export function kifogasok(
  kerdezettek: string[],
  nyilatkozatok: Nyilatkozat[],
): Nyilatkozat[] {
  return ervenyesek(kerdezettek, nyilatkozatok).filter((sor) => !sor.tamogatja);
}

/** A kifogás indoklás nélkül nincs: abból a másik fél nem tud kiindulni. */
export function nyilatkozatotEllenoriz(tamogatja: boolean, indoklas: string): Uzenet | null {
  if (!tamogatja && indoklas.trim() === "") return uzenet("ketnyelvu.hiba.indoklas");
  return null;
}

export function allapotCimke(allapot: KetnyelvuAllapot): Uzenet {
  return uzenet(`ketnyelvu.allapot.${allapot}`);
}

/**
 * A felületen megjelenő feliratok egy csomagban.
 *
 * A domainben, mert a lib állítja elő és a megjelenítés használja: a típus
 * fölötte áll mindkettőnek. A lib nem hivatkozhat felfelé, a megjelenítésre —
 * és két helyen megírva a kettő előbb-utóbb elcsúszna.
 */
export type KetnyelvuCimkek = {
  kerdes: string;
  mindenkiSugo: string;
  allapot: string;
  varunk: string;
  kifogasok: string[];
  nincsFiok: string[];
  sajat: string;
  valtoztathato: string;
  tamogatom: string;
  kifogasolom: string;
  indoklas: string;
  indoklasSugo: string;
  folyamatban: string;
};
