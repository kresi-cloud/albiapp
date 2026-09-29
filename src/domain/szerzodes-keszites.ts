/**
 * A szerződés összeállítása: a kiválasztott modulokból és a megadott
 * paraméterekből egyetlen, számozott szöveg lesz.
 *
 * A szöveg a modulkatalógusból épül minden megnyitáskor, amíg a szerződés
 * tervezet. Véglegesítéskor a kész szöveget elmentjük, és onnantól azt mutatjuk:
 * egy későbbi modulfrissítés nem írhatja át azt, amit a felek aláírtak.
 */

import {
  type ElofizetesAdat,
  type Fel,
  type IngatlanAdat,
  type JogviszonyAdat,
  type Kontextus,
  type Berbeado,
  hosszuDatum,
  nevsor,
} from "./szerzodes";
import { MODULOK } from "./szerzodes-modulok";
import { uzenet, type Nyelv, type Uzenet } from "./nyelv";
import { MODULOK_EN } from "./szerzodes-modulok-en";
import { hosszuDatumEn, nevsorEn } from "./szerzodes-angol";

export type Bemenet = {
  berbeado: Berbeado;
  berlok: Fel[];
  ingatlan: IngatlanAdat;
  jogviszony: JogviszonyAdat;
  /** A jóváhagyott előfizetések; ami nincs jóváhagyva, az a szerződésbe sem kerül. */
  elofizetesek?: ElofizetesAdat[];
  /** A bekapcsolt modulok kulcsai. */
  valasztottModulok: string[];
  /** Paraméterkulcs → megadott érték. Ami hiányzik, az alapértelmezés. */
  parameterek: Record<string, string>;
  /**
   * Modulkulcs → a bérbeadó saját szövege, ha átírta a szakaszt. Ami itt
   * nincs benne, az a katalógus szövegével megy, és az a rendes eset.
   */
  sajatSzovegek?: Record<string, SajatSzoveg>;
  kelteHelye?: string;
  kelte?: Date | null;
  /**
   * Szerződés vagy záradék. A záradék nem húzza be a kötelező modulokat: az
   * egy kiegészítő okirat, nem egy második teljes szerződés.
   */
  fajta?: "szerzodes" | "zaradek";
  /** Melyik hatályos szerződést egészíti ki. Csak záradéknál. */
  alap?: { megnevezes: string; kelte: Date | null; veglegesitve: Date | null } | null;
};

export type Szakasz = {
  sorszam: number;
  kulcs: string;
  cim: string;
  bekezdesek: string[];
  /** Igaz, ha a szakasz szövegét a bérbeadó írta, nem a katalógus adja. */
  sajat: boolean;
};

/**
 * Egy szakasz átírt szövege.
 *
 * A `szovegEn` a bérbeadó saját angol változata. Ha nem adott, a magyar áll a
 * fordításban is: amit ő gépelt be, az az ő adata, és gépi fordítást nem
 * teszünk a helyére — ugyanaz a szabály, mint a közleménynél és a saját
 * dátumainál.
 */
export type SajatSzoveg = { szoveg: string; szovegEn?: string };

/**
 * Begépelt szövegből bekezdések.
 *
 * Az üres sorokat kidobjuk, mert a szakasz bekezdésekből áll, és egy üres
 * bekezdés a kész okiratban két üres sor lenne. Az egymás alatti sor külön
 * bekezdés: a bérbeadó úgy gépeli be, ahogy olvasni fogja.
 */
export function bekezdesekre(szoveg: string): string[] {
  return szoveg
    .split("\n")
    .map((sor) => sor.trim())
    .filter((sor) => sor !== "");
}

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

export function kontextustKeszit(bemenet: Bemenet, nyelv: Nyelv = "hu"): Kontextus {
  const tobb = bemenet.berlok.length > 1;
  // Az alapértelmezés annak a modulnak a szövege, amelyik a paramétert
  // hozza — tehát csak addig szól, amíg az a modul benne van az okiratban.
  // Záradéknál semmi nem kötelező: a záró modul bekapcsolása nélkül is
  // „igen" lett a `tanuk`, és a tanúsor ott állt a záradék alján úgy, hogy a
  // bérbeadó sehol nem tudta kikapcsolni. Ugyanez a szabály a szerződésre
  // nézve nem változtat semmin, mert ott a kötelező modulok mindig benne
  // vannak.
  const zaradek = bemenet.fajta === "zaradek";
  const valasztott = new Set(bemenet.valasztottModulok);
  const ervenyes = (modul: (typeof MODULOK)[number]) =>
    valasztott.has(modul.kulcs) || (!zaradek && modul.kotelezo);

  const p = (kulcs: string): string => {
    const megadott = bemenet.parameterek[kulcs];
    if (megadott !== undefined && megadott !== "") return megadott;
    for (const modul of MODULOK) {
      if (!ervenyes(modul)) continue;
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
    elofizetesek: bemenet.elofizetesek ?? [],
    p,
    psz: (kulcs) => {
      const szam = Number(String(p(kulcs)).replace(/\s/g, "").replace(",", "."));
      return Number.isFinite(szam) ? szam : 0;
    },
    pd: (kulcs) => {
      const nyers = p(kulcs).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(nyers)) return "";
      const nap = new Date(`${nyers}T00:00:00.000Z`);
      if (Number.isNaN(nap.getTime())) return "";
      return nyelv === "en" ? hosszuDatumEn(nap) : hosszuDatum(nap);
    },
    v: (egyes, tobbes) => (tobb ? tobbes : egyes),
    B: nyelv === "en" ? (tobb ? "the Tenants" : "the Tenant") : tobb ? "a Bérlők" : "a Bérlő",
    BN: nyelv === "en" ? (tobb ? "The Tenants" : "The Tenant") : tobb ? "A Bérlők" : "A Bérlő",
  };
}

/**
 * Az ajánlott modulkészlet: minden kötelező, plusz amit a jogviszony adatai
 * indokolnak (óvadék van, több bérlő van). A bérbeadó ezen szabadon változtat.
 */
export function ajanlottModulok(
  bemenet: Omit<Bemenet, "valasztottModulok" | "parameterek">,
): string[] {
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
export function szakaszok(bemenet: Bemenet, nyelv: Nyelv = "hu"): Szakasz[] {
  const magyarKontextus = kontextustKeszit(bemenet, "hu");
  const kontextus = nyelv === "en" ? kontextustKeszit(bemenet, "en") : magyarKontextus;
  const valasztott = new Set(bemenet.valasztottModulok);
  const kesz: Szakasz[] = [];

  const zaradek = bemenet.fajta === "zaradek";

  for (const modul of MODULOK) {
    // Záradéknál a kötelezőség nem húz be semmit: amit a felek már aláírtak,
    // azt nem írjuk le újra, különben a záradék egy második, részben eltérő
    // szerződés lenne.
    if ((zaradek || !modul.kotelezo) && !valasztott.has(modul.kulcs)) continue;

    // A számozás mindig a magyar szövegből következik, az angolból soha. A két
    // példány pontjaira a felek hivatkozni fognak egymásnak („a 16. pont
    // szerint"), és ha egy modul angolul más számú bekezdést adna, a két okirat
    // számozása elcsúszna. Így a fordítás ugyanazt a pontot ugyanazon a
    // sorszámon viszi.
    //
    // Az átírt szakasz is a magyar oldalon dönt: a bérbeadó saját szövege lép
    // a katalógus szövegének helyébe. A modul címe viszont a katalógusé marad,
    // hogy a két nyelv fejlécei ugyanazok legyenek — a szakasz szövegét írja
    // át a bérbeadó, nem a szerződés felépítését.
    const sajat = bekezdesekre(bemenet.sajatSzovegek?.[modul.kulcs]?.szoveg ?? "");
    // Az átírt szakasz akkor is bekerül, ha a katalógus szövege üres lenne
    // (például nincs előfizetés): a bérbeadó kifejezetten beleírt valamit.
    const magyar =
      sajat.length > 0
        ? sajat
        : modul.szoveg(magyarKontextus).filter((sor) => sor.trim() !== "");
    if (magyar.length === 0) continue;

    const angol = nyelv === "en" ? MODULOK_EN[modul.kulcs] : null;
    let bekezdesek: string[];
    if (nyelv !== "en") {
      bekezdesek = magyar;
    } else if (sajat.length > 0) {
      // Amit a bérbeadó maga gépelt be, azt nem fordítjuk le helyette: a
      // katalógus angol szövege itt mást mondana, mint a magyar okirat, és a
      // fordítás pont attól lenne megtévesztő. Ha adott saját angol
      // változatot, az megy; ha nem, a magyar áll a fordításban is — a
      // fordítás fejléce amúgy is kimondja, hogy csak tájékoztató, és hogy
      // eltérés esetén a magyar az irányadó.
      const sajatAngol = bekezdesekre(bemenet.sajatSzovegek?.[modul.kulcs]?.szovegEn ?? "");
      bekezdesek = sajatAngol.length > 0 ? sajatAngol : magyar;
    } else {
      bekezdesek = angol ? angol.szoveg(kontextus).filter((sor) => sor.trim() !== "") : magyar;
    }

    kesz.push({
      sorszam: kesz.length + 1,
      kulcs: modul.kulcs,
      cim: angol ? angol.cim : modul.cim,
      bekezdesek,
      sajat: sajat.length > 0,
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
 * Az aláírási rész: kelt, aláírók, tanúk. Külön függvény, mert a szerkesztő is
 * ezt mutatja a pontok alatt — enélkül a bérbeadó nem látná, mit állított be.
 *
 * A neve korábban `zaradekSorok` volt. A „záradék" viszont a hatályos
 * szerződést kiegészítő külön okirat neve lett (`Szerzodes.fajta`), és két
 * különböző dolgot nem hívhat ugyanaz a szó a kódban.
 */
export function alairasSorok(bemenet: Bemenet, nyelv: Nyelv = "hu"): string[] {
  const kontextus = kontextustKeszit(bemenet, nyelv);
  const angol = nyelv === "en";
  const hely = (bemenet.kelteHelye ?? "").trim();
  const nap = bemenet.kelte
    ? angol
      ? hosszuDatumEn(bemenet.kelte)
      : hosszuDatum(bemenet.kelte)
    : "";
  const kelt = [hely, nap].filter(Boolean).join(", ");
  const nevek = bemenet.berlok.map((berlo) => berlo.nev);

  const sorok = angol
    ? [
        `Signed at: ${kelt || "………………………………"}`,
        "",
        "Landlord:",
        bemenet.berbeado.nev,
        "",
        bemenet.berlok.length > 1 ? "Tenants:" : "Tenant:",
        nevsorEn(nevek),
      ]
    : [
        `Kelt: ${kelt || "………………………………"}`,
        "",
        "Bérbeadó:",
        bemenet.berbeado.nev,
        "",
        bemenet.berlok.length > 1 ? "Bérlők:" : "Bérlő:",
        nevsor(nevek),
      ];

  if (kontextus.p("tanuk") === "igen") {
    sorok.push(
      "",
      ...(angol
        ? [
            "Before us, as witnesses:",
            "",
            "Name and address of witness 1: ………………………………………",
            "Name and address of witness 2: ………………………………………",
          ]
        : [
            "Előttünk, mint tanúk előtt:",
            "",
            "1. tanú neve és lakcíme: ………………………………………",
            "2. tanú neve és lakcíme: ………………………………………",
          ]),
    );
  }

  return sorok;
}

/**
 * A fordítás fejléce, magában a szövegben.
 *
 * Nem elég a lap tetején kiírni, hogy a fordítás tájékoztató: a szöveget
 * kimásolják, elküldik, kinyomtatják, és onnantól a lap már nincs mellette. Aki
 * a papírt a kezébe veszi, abból lássa, hogy nem ezt írták alá.
 */
export const FORDITAS_FEJLEC = [
  "INFORMATIVE ENGLISH TRANSLATION",
  "",
  "The parties signed the Hungarian text of this document. Only that Hungarian text " +
    "is authentic; in case of any difference between the two versions, the Hungarian " +
    "text prevails. This translation is provided for information only, and creates no " +
    "rights or obligations of its own.",
];

/** A teljes szerződés sima szövegként: ez kerül a nyomtatásba és a mentett példányba. */
export function szerzodesSzovege(bemenet: Bemenet, nyelv: Nyelv = "hu"): string {
  const sorok: string[] =
    nyelv === "en"
      ? [
          "RESIDENTIAL LEASE AGREEMENT",
          "",
          ...FORDITAS_FEJLEC,
          "",
          "concluded by and between the parties below, at the place and on the date " +
            "set out at the end of this document, on the following terms:",
          "",
        ]
      : [
          "LAKÁSBÉRLETI SZERZŐDÉS",
          "",
          "amely létrejött az alábbi felek között, az alulírott helyen és időben, a következő feltételekkel:",
          "",
        ];

  for (const szakasz of szakaszok(bemenet, nyelv)) {
    sorok.push(`${szakasz.sorszam}. ${szakasz.cim}`);
    sorok.push("");
    for (const bekezdes of szakasz.bekezdesek) {
      sorok.push(bekezdes);
      sorok.push("");
    }
  }

  sorok.push(...alairasSorok(bemenet, nyelv));

  return sorok.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/**
 * A záradék szövege.
 *
 * Hatályos szerződést csak külön okirattal lehet kiegészíteni: az aláírt
 * szöveget nem írjuk át (a `veglegesSzoveg` be is fagyasztja), az új
 * megállapodás pedig magában nem értelmezhető. Ezért a záradék megnevezi,
 * melyik szerződéshez tartozik, és kimondja, hogy a többi rendelkezés
 * változatlanul hatályban marad — enélkül vitatható lenne, mi maradt érvényben.
 */
/**
 * A záradék bevezetője. Külön függvény, mert a szerkesztő is ezt mutatja a
 * pontok fölött: a bérbeadónak a tervezetben is látnia kell, mihez képest
 * kiegészítés, amit készít.
 */
export function zaradekBevezeto(bemenet: Bemenet, nyelv: Nyelv = "hu"): string {
  const alap = bemenet.alap;
  if (nyelv === "en") {
    const hivatkozasEn = alap
      ? `the residential lease agreement titled "${alap.megnevezes}" concluded between the Parties` +
        `${alap.kelte ? ` on ${hosszuDatumEn(alap.kelte)}` : ""} (hereinafter: the Lease Agreement)`
      : "the residential lease agreement concluded between the Parties (hereinafter: the Lease Agreement)";
    return `concluded as an addendum to ${hivatkozasEn}, at the place and on the date set out at the end of this document, as follows:`;
  }
  const hivatkozas = alap
    ? `a Felek között ${alap.kelte ? `${hosszuDatum(alap.kelte)} napján ` : ""}létrejött ` +
      `„${alap.megnevezes}” megnevezésű lakásbérleti szerződéshez (a továbbiakban: Bérleti szerződés)`
    : "a Felek között létrejött lakásbérleti szerződéshez (a továbbiakban: Bérleti szerződés)";
  return `amely létrejött ${hivatkozas}, az alulírott helyen és időben, a következők szerint:`;
}

/**
 * A záradék záró mondata.
 *
 * Enélkül vitatható lenne, mi maradt hatályban az eredeti szerződésből, és
 * hogy a záradék a szerződés része-e. Ezért nem modul, hanem a záradék
 * elhagyhatatlan része.
 */
export const ZARADEK_ZARO =
  "A Bérleti szerződés e záradékkal nem érintett rendelkezései változatlanul hatályban maradnak. " +
  "A záradék a Bérleti szerződés elválaszthatatlan részét képezi.";

export const ZARADEK_ZARO_EN =
  "All provisions of the Lease Agreement not affected by this addendum remain in force unchanged. " +
  "This addendum forms an inseparable part of the Lease Agreement.";

export function zaradekSzovege(bemenet: Bemenet, nyelv: Nyelv = "hu"): string {
  const sorok: string[] =
    nyelv === "en"
      ? [
          "ADDENDUM TO THE RESIDENTIAL LEASE AGREEMENT",
          "",
          ...FORDITAS_FEJLEC,
          "",
          zaradekBevezeto(bemenet, "en"),
          "",
        ]
      : [
          "ZÁRADÉK A LAKÁSBÉRLETI SZERZŐDÉSHEZ",
          "",
          zaradekBevezeto(bemenet),
          "",
        ];

  for (const szakasz of szakaszok({ ...bemenet, fajta: "zaradek" }, nyelv)) {
    sorok.push(`${szakasz.sorszam}. ${szakasz.cim}`);
    sorok.push("");
    for (const bekezdes of szakasz.bekezdesek) {
      sorok.push(bekezdes);
      sorok.push("");
    }
  }

  sorok.push(nyelv === "en" ? ZARADEK_ZARO_EN : ZARADEK_ZARO, "");

  sorok.push(...alairasSorok(bemenet, nyelv));

  return sorok.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/** A megfelelő szöveg a fajta szerint, hogy a hívónak ne kelljen elágaznia. */
export function okiratSzovege(bemenet: Bemenet, nyelv: Nyelv = "hu"): string {
  return bemenet.fajta === "zaradek"
    ? zaradekSzovege(bemenet, nyelv)
    : szerzodesSzovege(bemenet, nyelv);
}
