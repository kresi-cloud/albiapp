/**
 * A szerződésfordítás kapuja.
 *
 * A fordítás tájékoztató, de attól még végig kell érnie. Két romlási mód van, és
 * egyik sem akad fenn a típusellenőrzésen: valaki új modult ír a magyar
 * katalógusba, és nem ír hozzá angolt — ilyenkor az angol okiratban ott áll egy
 * magyar pont, mintha az lenne a fordítás; vagy egy meglévő angol szövegbe
 * magyar mondat marad benne.
 *
 * Ezért a kapu a kész angol okiratot olvassa, nem a forrást: azt méri, amit a
 * bérlő a kezébe kap.
 *
 * A mérés ékezetes betűt keres, ezért a példaadat szándékosan ékezet nélküli.
 * A felek neve és a cím a fordításban is úgy marad, ahogy meg van adva — azt
 * nem fordítjuk —, tehát egy „Tóth Anna" nevű bérlőtől a kapu hamisan bukna.
 */

import { describe, expect, it } from "vitest";
import { MODULOK } from "../domain/szerzodes-modulok";
import { ALAPERTELMEZES_EN, MODULOK_EN } from "../domain/szerzodes-modulok-en";
import {
  szakaszok,
  szerzodesSzovege,
  zaradekSzovege,
  modulKulcsok,
  type Bemenet,
} from "../domain/szerzodes-keszites";
import type { Berbeado, Fel, IngatlanAdat, JogviszonyAdat } from "../domain/szerzodes";

/** Magyar ékezetes betű: ami ezt tartalmazza, az nem angol mondat. */
const EKEZET = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;

/** Ékezet nélkül is magyar. Ezek a szerződés leggyakoribb magyar szavai. */
const MAGYAR_SZAVAK = [
  "Berbeado",
  "Berlo",
  "szerzodes",
  "jelen szerzodes",
  "a Felek",
  "koteles",
  "napjan",
];

function magyarMaradek(szoveg: string): string[] {
  const talalatok: string[] = [];
  for (const sor of szoveg.split("\n")) {
    if (EKEZET.test(sor)) talalatok.push(sor.trim());
    else if (MAGYAR_SZAVAK.some((szo) => sor.includes(szo))) talalatok.push(sor.trim());
  }
  return talalatok;
}

// Szándékosan ékezet nélküli példaadat: lásd a fájl fejlécét.
const BERBEADO: Berbeado = {
  nev: "Peter Kiss",
  szuletesiHely: "Pecs",
  szuletesiIdo: new Date(Date.UTC(1977, 3, 11)),
  anyjaNeve: "Ilona Nagy",
  lakcim: "7635 Pecs, Pelda street 1.",
  igazolvanySzam: "123456AB",
  adoazonosito: "8402774199",
  bankszamla: "11773315-09819362-00000000",
  bank: "OTP Bank",
  email: "berbeado@pelda.hu",
  telefon: "+36 30 000 0000",
};

const BERLO: Fel = {
  nev: "Anna Toth",
  szuletesiHely: "Budapest",
  szuletesiIdo: new Date(Date.UTC(2006, 9, 25)),
  anyjaNeve: "Judit Kovacs",
  lakcim: "2463 Tordas, Pelda street 7.",
  igazolvanySzam: "553362TE",
  email: "anna@pelda.hu",
  telefon: "+36 30 111 1111",
};

const INGATLAN: IngatlanAdat = {
  megnevezes: "Studio flat",
  cim: "7621 Pecs, Pelda street 20. I/8.",
  alapteruletM2: 43,
  helyrajziSzam: "17607/A/8",
  energetikaiAzonosito: "HET-01312555",
  kozosKoltsegFt: 14000,
};

const JOGVISZONY: JogviszonyAdat = {
  kezdete: new Date(Date.UTC(2026, 7, 29)),
  vege: new Date(Date.UTC(2027, 7, 31)),
  berletiDijFt: 150000,
  kozosKoltsegFt: 14000,
  kaucioFt: 300000,
  fizetesiNap: 10,
  rezsiElszamolas: "almero",
  rezsiAtalanyFt: 0,
};

function bemenet(modositas: Partial<Bemenet> = {}): Bemenet {
  return {
    berbeado: BERBEADO,
    berlok: [BERLO],
    ingatlan: INGATLAN,
    jogviszony: JOGVISZONY,
    // Minden modul bekapcsolva: a kapunak az összes szöveget látnia kell, nem
    // csak azt, amit egy adott bérbeadó véletlenül bekapcsolt.
    valasztottModulok: modulKulcsok(),
    parameterek: {},
    kelteHelye: "Pecs",
    kelte: new Date(Date.UTC(2026, 7, 29)),
    elofizetesek: [
      {
        megnevezes: "Internet",
        fajta: "internet",
        szolgaltato: "Telekom",
        elofizeto: "berbeado",
        haviDijFt: 7990,
      },
      {
        megnevezes: "Mobile",
        fajta: "telefon",
        szolgaltato: null,
        elofizeto: "berlo",
        haviDijFt: 4500,
      },
    ],
    ...modositas,
  };
}

describe("szerződésfordítás", () => {
  it("a kapu tényleg harap", () => {
    expect(magyarMaradek("The Landlord shall pay the rent.")).toEqual([]);
    expect(magyarMaradek("A Bérlő köteles fizetni.")).toHaveLength(1);
    // Ékezet nélkül is: ezt egy ékezetlen példaadaton is meg kell fognia.
    expect(magyarMaradek("A Berlo koteles fizetni.")).toHaveLength(1);
  });

  it("minden modulhoz van angol szöveg", () => {
    const hianyzo = MODULOK.filter((modul) => !MODULOK_EN[modul.kulcs]).map((modul) => modul.kulcs);
    expect(hianyzo).toEqual([]);
  });

  it("egyetlen angol modulcím sem üres, és egyik sem a magyar cím", () => {
    for (const modul of MODULOK) {
      const angol = MODULOK_EN[modul.kulcs];
      expect(angol.cim.trim(), modul.kulcs).not.toBe("");
      expect(angol.cim, modul.kulcs).not.toBe(modul.cim);
    }
  });

  it("nincs angol bejegyzés magyar modul nélkül", () => {
    const kulcsok = new Set(MODULOK.map((modul) => modul.kulcs));
    const arva = Object.keys(MODULOK_EN).filter((kulcs) => !kulcsok.has(kulcs));
    expect(arva).toEqual([]);
  });

  it("minden magyar szöveges alapértelmezésnek van angol párja", () => {
    // Az alapértelmezés a mi szövegünk, nem a bérbeadóé: ha nem írja felül,
    // magyarul kerülne a fordításba. A „nyári szünet hónapjai" pont ilyen volt.
    const parositatlan = MODULOK.flatMap((modul) =>
      modul.parameterek
        .filter((sor) => EKEZET.test(sor.alapertelmezes))
        .filter((sor) => ALAPERTELMEZES_EN[sor.kulcs] === undefined)
        .map((sor) => sor.kulcs),
    );
    expect(parositatlan).toEqual([]);
  });

  it("a kész angol szerződésben nem marad magyar mondat", () => {
    expect(magyarMaradek(szerzodesSzovege(bemenet(), "en"))).toEqual([]);
  });

  it("a kész angol záradékban sem marad magyar mondat", () => {
    const szoveg = zaradekSzovege(
      bemenet({
        fajta: "zaradek",
        valasztottModulok: ["elofizetesek"],
        alap: {
          megnevezes: "Lease agreement",
          kelte: new Date(Date.UTC(2026, 7, 29)),
          veglegesitve: new Date(Date.UTC(2026, 7, 29)),
        },
      }),
      "en",
    );
    expect(magyarMaradek(szoveg)).toEqual([]);
  });

  it("a két nyelv ugyanazokat a pontokat ugyanazon a sorszámon hozza", () => {
    const magyar = szakaszok(bemenet(), "hu");
    const angol = szakaszok(bemenet(), "en");
    expect(angol.map((szakasz) => [szakasz.sorszam, szakasz.kulcs])).toEqual(
      magyar.map((szakasz) => [szakasz.sorszam, szakasz.kulcs]),
    );
  });

  it("az angol okirat maga mondja ki, hogy a magyar az irányadó", () => {
    const szoveg = szerzodesSzovege(bemenet(), "en");
    expect(szoveg).toContain("INFORMATIVE ENGLISH TRANSLATION");
    expect(szoveg).toContain("the Hungarian text prevails");
  });

  it("a magyar szerződés szövegét a fordítás nem változtatja meg", () => {
    const elotte = szerzodesSzovege(bemenet());
    szerzodesSzovege(bemenet(), "en");
    expect(szerzodesSzovege(bemenet())).toBe(elotte);
  });
});
