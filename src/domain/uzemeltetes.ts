/**
 * Üzemeltetői rálátás: összesítő számok, rendszerállapot, és a fióktiltás
 * szabályai.
 *
 * Ez a lap szándékosan **csak számokat** mutat más emberekről, a nevükön túl,
 * amit a névsor eddig is kiírt. Az üzemeltetőnek az a kérdése, hogy működik-e
 * az alkalmazás és van-e valami elakadva; ahhoz nem kell látnia, ki mennyit
 * fizetett. Aki a részleteket is látni akarná, annak azt külön kell
 * eldöntenie, mert egy üzemeltetői fiók, ami mindent lát, észrevétlenül
 * ugyanaz lesz, mint a bérlőszűrés, amit a termék kerül.
 *
 * A számítás itt nyelvfüggetlen: kulcsot ad vissza, nem mondatot.
 */

import { uzenet, type Uzenet } from "./nyelv";

/** A számok, amiket a lap kiír. Mind darabszám, egyik sem személyes adat. */
export type Osszesito = {
  berbeadok: number;
  berlok: number;
  rendszergazdak: number;
  letiltottFiokok: number;
  ingatlanok: number;
  eloJogviszonyok: number;
  lezartJogviszonyok: number;
  nyitottHibak: number;
  /** Kiküldött meghívó, amit még nem fogadtak el és nem is járt le. */
  varoMeghivok: number;
  /** Előfizetés, amire valamelyik bérlő még nem nyilatkozott. */
  varoElofizetesek: number;
  /** Bejelentett látogatás, amire valamelyik bérlő még nem nyilatkozott. */
  varoLatogatasok: number;
};

export type Allapotszin = "rendben" | "figyelem" | "gond";

/**
 * Az adatbázis válaszidejének sávjai.
 *
 * Ezek az alkalmazás alapértelmezései, nem szolgáltatói vállalások, és a lap
 * ezt ki is mondja — ugyanúgy, ahogy a hibabejelentés válaszhatáridejénél és a
 * gépi értékelés válaszidejénél. A kétszázon az a gondolat, hogy egy lap több
 * lekérdezésből áll össze: ami itt kétszáz ezredmásodperc, az a kész lapon már
 * másodpercekben mérhető.
 */
export const VALASZIDO_FIGYELEM_MS = 200;
export const VALASZIDO_GOND_MS = 1000;

export function valaszidoSzine(ezredmasodperc: number): Allapotszin {
  if (ezredmasodperc >= VALASZIDO_GOND_MS) return "gond";
  if (ezredmasodperc >= VALASZIDO_FIGYELEM_MS) return "figyelem";
  return "rendben";
}

export function valaszidoMagyarazat(ezredmasodperc: number): Uzenet {
  return uzenet(`uzemeltetes.valaszido.${valaszidoSzine(ezredmasodperc)}`, {
    figyelem: VALASZIDO_FIGYELEM_MS,
    gond: VALASZIDO_GOND_MS,
  });
}

/** Amit az üzemeltető a fiókkal tehet. Törlés nincs: lásd `letiltasOka`. */
export type Fiokmuvelet = "letilt" | "visszaenged";

/**
 * Letiltható-e ez a fiók ezzel a művelettel.
 *
 * Két dolgot zár ki, és mindkettő a kiszolgálón dől el, nem a gomb
 * elrejtésével:
 *
 *  - **Magát senki nem tilthatja le.** Ha az egyetlen rendszergazda kizárja
 *    magát, onnantól az adatbázishoz kell nyúlni ahhoz, hogy bárki
 *    üzemeltetni tudja az alkalmazást.
 *  - Ami már úgy áll, azt nem állítjuk újra: a második letiltás új dátumot
 *    írna, és az üzemeltető utólag azt hinné, akkor tiltották le.
 *
 * Ha nincs kifogás, `null` jön vissza.
 */
export function fiokmuveletetEllenoriz(bemenet: {
  adminId: string;
  celId: string;
  celLetiltva: boolean;
  muvelet: Fiokmuvelet;
}): Uzenet | null {
  if (bemenet.adminId === bemenet.celId) {
    return uzenet("uzemeltetes.hiba.sajat_fiok");
  }
  if (bemenet.muvelet === "letilt" && bemenet.celLetiltva) {
    return uzenet("uzemeltetes.hiba.mar_letiltva");
  }
  if (bemenet.muvelet === "visszaenged" && !bemenet.celLetiltva) {
    return uzenet("uzemeltetes.hiba.nincs_letiltva");
  }
  return null;
}

/** A naplóba kerülő műveletek. A szöveg a szótárban él, nem itt. */
export const NAPLO_MUVELETEK = ["fiok_letiltas", "fiok_visszaengedes"] as const;
export type NaploMuvelet = (typeof NAPLO_MUVELETEK)[number];

export function naploMuvelete(muvelet: Fiokmuvelet): NaploMuvelet {
  return muvelet === "letilt" ? "fiok_letiltas" : "fiok_visszaengedes";
}

/** Egy naplósor emberi nyelven: ki, mit, kivel. */
export function naploMondata(sor: {
  muvelet: string;
  adminNev: string;
  targyNev: string | null;
}): Uzenet {
  return uzenet(`uzemeltetes.naplo.${sor.muvelet}`, {
    admin: sor.adminNev,
    targy: sor.targyNev ?? uzenet("uzemeltetes.naplo.torolt_fiok"),
  });
}
