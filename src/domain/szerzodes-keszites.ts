/**
 * A szerződés összeállítása: a kiválasztott modulokból és a megadott
 * paraméterekből egyetlen, számozott szöveg lesz.
 *
 * A szöveg a modulkatalógusból épül minden megnyitáskor, amíg a szerződés
 * tervezet. Véglegesítéskor a kész szöveget elmentjük, és onnantól azt mutatjuk:
 * egy későbbi modulfrissítés nem írhatja át azt, amit a felek aláírtak.
 */

import {
  type Fel,
  type IngatlanAdat,
  type JogviszonyAdat,
  type Kontextus,
  type Berbeado,
  hosszuDatum,
  nevsor,
} from "./szerzodes";
import { MODULOK } from "./szerzodes-modulok";
import { uzenet, type Uzenet } from "./nyelv";

export type Bemenet = {
  berbeado: Berbeado;
  berlok: Fel[];
  ingatlan: IngatlanAdat;
  jogviszony: JogviszonyAdat;
  /** A bekapcsolt modulok kulcsai. */
  valasztottModulok: string[];
  /** Paraméterkulcs → megadott érték. Ami hiányzik, az alapértelmezés. */
  parameterek: Record<string, string>;
  kelteHelye?: string;
  kelte?: Date | null;
};

export type Szakasz = {
  sorszam: number;
  kulcs: string;
  cim: string;
  bekezdesek: string[];
};

export function modulKulcsok(): string[] {
  return MODULOK.map((modul) => modul.kulcs);
}

export function modultKeres(kulcs: string) {
  return MODULOK.find((modul) => modul.kulcs === kulcs) ?? null;
}

/** Minden paraméter alapértelmezése, modulkulcs szerint kigyűjtve. */
export function alapertelmezettParameterek(): Record<string, string> {
  const ertekek: Record<string, string> = {};
  for (const modul of MODULOK) {
    for (const parameter of modul.parameterek) {
      ertekek[parameter.kulcs] = parameter.alapertelmezes;
    }
  }
  return ertekek;
}

export function kontextustKeszit(bemenet: Bemenet): Kontextus {
  const tobb = bemenet.berlok.length > 1;
  const p = (kulcs: string): string => {
    const megadott = bemenet.parameterek[kulcs];
    if (megadott !== undefined && megadott !== "") return megadott;
    for (const modul of MODULOK) {
      const parameter = modul.parameterek.find((elem) => elem.kulcs === kulcs);
      if (parameter) return parameter.alapertelmezes;
    }
    return "";
  };

  return {
    berbeado: bemenet.berbeado,
    berlok: bemenet.berlok,
    ingatlan: bemenet.ingatlan,
    jogviszony: bemenet.jogviszony,
    p,
    psz: (kulcs) => {
      const szam = Number(String(p(kulcs)).replace(/\s/g, "").replace(",", "."));
      return Number.isFinite(szam) ? szam : 0;
    },
    v: (egyes, tobbes) => (tobb ? tobbes : egyes),
    B: tobb ? "a Bérlők" : "a Bérlő",
    BN: tobb ? "A Bérlők" : "A Bérlő",
  };
}

/**
 * Az ajánlott modulkészlet: minden kötelező, plusz amit a jogviszony adatai
 * indokolnak (óvadék van, több bérlő van). A bérbeadó ezen szabadon változtat.
 */
export function ajanlottModulok(bemenet: Omit<Bemenet, "valasztottModulok" | "parameterek">): string[] {
  const kontextus = kontextustKeszit({ ...bemenet, valasztottModulok: [], parameterek: {} });
  return MODULOK.filter(
    (modul) => modul.kotelezo || (modul.ajanlott ? modul.ajanlott(kontextus) : false),
  ).map((modul) => modul.kulcs);
}

/**
 * A szerződés szakaszai. A katalógus sorrendje adja a számozást, hogy a
 * szerződés felépítése akkor is ismerős maradjon, ha modulok ki-be kapcsolódnak.
 * Az üres szövegű modul kimarad: egy sorszám nélküli, üres pont zavaró lenne.
 */
export function szakaszok(bemenet: Bemenet): Szakasz[] {
  const kontextus = kontextustKeszit(bemenet);
  const valasztott = new Set(bemenet.valasztottModulok);
  const kesz: Szakasz[] = [];

  for (const modul of MODULOK) {
    if (!modul.kotelezo && !valasztott.has(modul.kulcs)) continue;
    const bekezdesek = modul.szoveg(kontextus).filter((sor) => sor.trim() !== "");
    if (bekezdesek.length === 0) continue;
    kesz.push({
      sorszam: kesz.length + 1,
      kulcs: modul.kulcs,
      cim: modul.cim,
      bekezdesek,
    });
  }

  return kesz;
}

/**
 * Amit a szerződéshez tudni kell, de még nincs meg. Nem hibaüzenet: a tervezet
 * enélkül is elkészül, de véglegesíteni így nem érdemes, és a bérbeadó jobb, ha
 * előre látja, mi hiányzik.
 */
export function hianyzoAdatok(bemenet: Bemenet): Uzenet[] {
  const hianyok: Uzenet[] = [];
  const b = bemenet.berbeado;

  if (!b.lakcim) hianyok.push(uzenet("hiany.berbeado.lakcim"));
  if (!b.szuletesiHely || !b.szuletesiIdo) hianyok.push(uzenet("hiany.berbeado.szuletes"));
  if (!b.anyjaNeve) hianyok.push(uzenet("hiany.berbeado.anyjaNeve"));
  if (!b.igazolvanySzam) hianyok.push(uzenet("hiany.berbeado.igazolvanySzam"));
  if (!b.bankszamla) hianyok.push(uzenet("hiany.berbeado.bankszamla"));

  // Bérlőnként soronként egy hiány: a mezőnevek felsorolása egy mondatban
  // nyelvenként más szórendet kívánna, és a bérlő nevét is ragozná.
  for (const berlo of bemenet.berlok) {
    const mezok: string[] = [];
    if (!berlo.lakcim) mezok.push("lakcim");
    if (!berlo.szuletesiHely || !berlo.szuletesiIdo) mezok.push("szuletesiIdo");
    if (!berlo.anyjaNeve) mezok.push("anyjaNeve");
    if (!berlo.igazolvanySzam) mezok.push("igazolvanySzam");
    for (const mezo of mezok) {
      hianyok.push(uzenet("hiany.berlo", { nev: berlo.nev, mezo: uzenet(`adatok.mezo.${mezo}`) }));
    }
  }

  if (!bemenet.ingatlan.helyrajziSzam) hianyok.push(uzenet("hiany.ingatlan.helyrajziSzam"));
  if (!bemenet.ingatlan.energetikaiAzonosito) {
    hianyok.push(uzenet("hiany.ingatlan.energetikai"));
  }
  if (bemenet.berlok.length === 0) hianyok.push(uzenet("hiany.nincs_berlo"));

  return hianyok;
}

/**
 * A záradék: kelt, aláírók, tanúk. Külön függvény, mert a szerkesztő is ezt
 * mutatja a pontok alatt — enélkül a bérbeadó nem látná, mit állított be.
 */
export function zaradekSorok(bemenet: Bemenet): string[] {
  const kontextus = kontextustKeszit(bemenet);
  const hely = (bemenet.kelteHelye ?? "").trim();
  const nap = bemenet.kelte ? hosszuDatum(bemenet.kelte) : "";
  const kelt = [hely, nap].filter(Boolean).join(", ");

  const sorok = [
    `Kelt: ${kelt || "………………………………"}`,
    "",
    "Bérbeadó:",
    bemenet.berbeado.nev,
    "",
    bemenet.berlok.length > 1 ? "Bérlők:" : "Bérlő:",
    nevsor(bemenet.berlok.map((berlo) => berlo.nev)),
  ];

  if (kontextus.p("tanuk") === "igen") {
    sorok.push(
      "",
      "Előttünk, mint tanúk előtt:",
      "",
      "1. tanú neve és lakcíme: ………………………………………",
      "2. tanú neve és lakcíme: ………………………………………",
    );
  }

  return sorok;
}

/** A teljes szerződés sima szövegként: ez kerül a nyomtatásba és a mentett példányba. */
export function szerzodesSzovege(bemenet: Bemenet): string {
  const sorok: string[] = [
    "LAKÁSBÉRLETI SZERZŐDÉS",
    "",
    "amely létrejött az alábbi felek között, az alulírott helyen és időben, a következő feltételekkel:",
    "",
  ];

  for (const szakasz of szakaszok(bemenet)) {
    sorok.push(`${szakasz.sorszam}. ${szakasz.cim}`);
    sorok.push("");
    for (const bekezdes of szakasz.bekezdesek) {
      sorok.push(bekezdes);
      sorok.push("");
    }
  }

  sorok.push(...zaradekSorok(bemenet));

  return sorok.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
