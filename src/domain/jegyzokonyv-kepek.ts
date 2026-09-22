/**
 * Fényképek az átadás-átvételi állapotról.
 *
 * Amiért kellenek: a kaució körüli vita jellemzően nem arról szól, hogy van-e
 * folt a falon, hanem arról, hogy eddig is ott volt-e. Szavak ezt nem döntik
 * el, két kép egymás mellett igen — de csak akkor, ha mindkét fél elismerte,
 * hogy az a kép arról a lakásról készült, amiről szó van.
 *
 * Ezért a megerősítés itt is két külön adat, ugyanúgy, mint a befizetésnél és
 * a hibabejelentésnél: aki feltöltötte, azt állítja, hogy ezt látta; a másik
 * fél rábólint, vagy kifogást emel. A kifogás nem törli a képet — mindkét
 * állítás az elszámolás része lesz. Egy fél által „kitakarított" album pont
 * annyit érne, mint a bemondás.
 */

import { uzenet, type Uzenet } from "./nyelv";

export type Szerep = "berbeado" | "berlo";

/**
 * Amit elfogadunk. Szándékosan szűk, és szándékosan nincs benne az SVG: az
 * nem kép, hanem futtatható dokumentum, és a másik fél nyitná meg.
 *
 * A HEIC is kimarad, pedig iPhone-on az az alapértelmezés. Nem azért, mert
 * veszélyes, hanem mert a böngészők nagy része nem rajzolja ki — egy olyan
 * albummal, amit a szülő vagy a bérlő nem tud megnézni, semmire nem megyünk.
 * A felület ezt meg is mondja, mert különben a bérbeadó azt hinné, elromlott.
 */
export const ELFOGADOTT_TIPUSOK = ["image/jpeg", "image/png", "image/webp"] as const;

/** Egy telefonnal készült fénykép ennél kisebb; a korlát a visszaélés ellen van. */
export const MAX_MERET_BAJT = 8 * 1024 * 1024;

/**
 * Jegyzőkönyvenként ennyi kép. Nem szűkösségből: egy ekkora album már
 * használhatatlan telefonon, és a lényeg pont az, hogy a vitás tételnél
 * legyen kép, ne az, hogy minden csempéről.
 */
export const MAX_DARAB = 40;

export type KepAllapot = "egyoldalu" | "megerositve" | "vitatott";

export type Kep = {
  id: string;
  megnevezes: string;
  feltoltoSzerep: Szerep;
  megerositve: Date | null;
  kifogas: string | null;
  /** A birtokbaadáskori kép, amihez ez a kiköltözéskori tartozik. */
  parjaId: string | null;
};

export function allapota(kep: Pick<Kep, "megerositve" | "kifogas">): KepAllapot {
  if (kep.kifogas !== null && kep.kifogas !== "") return "vitatott";
  return kep.megerositve === null ? "egyoldalu" : "megerositve";
}

export function allapotNeve(allapot: KepAllapot): Uzenet {
  return uzenet(`kep.allapot.${allapot}`);
}

/**
 * Megerősíteni csak a másik fél tudja, és csak egyszer. A saját képére senki
 * nem bólinthat rá: attól nem lesz kétoldali.
 */
export function megerositheti(
  kep: Pick<Kep, "feltoltoSzerep" | "megerositve" | "kifogas">,
  szerep: Szerep,
): boolean {
  if (kep.feltoltoSzerep === szerep) return false;
  return allapota(kep) === "egyoldalu";
}

export type FajlAdat = {
  nev: string;
  tipus: string;
  meretBajt: number;
};

export function kepetEllenoriz(fajl: FajlAdat, eddigiDarab: number): Uzenet | null {
  if (eddigiDarab >= MAX_DARAB) return uzenet("kep.hiba.sok", { max: MAX_DARAB });
  if (fajl.meretBajt === 0) return uzenet("kep.hiba.ures");
  if (fajl.meretBajt > MAX_MERET_BAJT) {
    return uzenet("kep.hiba.nagy", { max: Math.floor(MAX_MERET_BAJT / (1024 * 1024)) });
  }
  if (!(ELFOGADOTT_TIPUSOK as readonly string[]).includes(fajl.tipus)) {
    return uzenet("kep.hiba.tipus");
  }
  return null;
}

/**
 * A fájl eleje alapján állapítjuk meg a típust, nem a böngésző bemondásából.
 *
 * A bejelentett típus a feltöltő gépéről jön, tehát bármi lehet. Ezt a
 * tartalmat viszont a másik fél böngészője fogja megnyitni a mi címünkön: ha
 * elhinnénk a bemondást, egy „image/png"-nek mondott fájl bármi lehetne.
 */
export function tipusATartalombol(eleje: Uint8Array): string | null {
  if (eleje.length >= 3 && eleje[0] === 0xff && eleje[1] === 0xd8 && eleje[2] === 0xff) {
    return "image/jpeg";
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (eleje.length >= 8 && png.every((bajt, k) => eleje[k] === bajt)) return "image/png";

  // RIFF????WEBP
  const riff = [0x52, 0x49, 0x46, 0x46];
  const webp = [0x57, 0x45, 0x42, 0x50];
  if (
    eleje.length >= 12 &&
    riff.every((bajt, k) => eleje[k] === bajt) &&
    webp.every((bajt, k) => eleje[8 + k] === bajt)
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * A kiadott fájlnév. A feltöltött nevet nem adjuk vissza nyersen: abból a
 * böngészőnek szóló fejléc készül, és egy idézőjel vagy sortörés elrontaná.
 */
export function biztonsagosNev(kepId: string, mimeTipus: string): string {
  const kiterjesztes =
    mimeTipus === "image/jpeg" ? "jpg" : mimeTipus === "image/webp" ? "webp" : "png";
  return `kep-${kepId.replace(/[^a-z0-9]/gi, "")}.${kiterjesztes}`;
}

export type Osszesites = {
  osszes: number;
  megerositve: number;
  varakozik: number;
  vitatott: number;
};

export function osszesit(kepek: Pick<Kep, "megerositve" | "kifogas">[]): Osszesites {
  let megerositve = 0;
  let vitatott = 0;
  for (const kep of kepek) {
    const allapot = allapota(kep);
    if (allapot === "megerositve") megerositve += 1;
    if (allapot === "vitatott") vitatott += 1;
  }
  return {
    osszes: kepek.length,
    megerositve,
    vitatott,
    varakozik: kepek.length - megerositve - vitatott,
  };
}

/**
 * Amelyik birtokbaadáskori képhez nincs kiköltözéskori párja. Ez a lista a
 * záró jegyzőkönyv feladatlistája: pont ezekről kell most is képet csinálni,
 * különben az összehasonlítás elmarad ott, ahol a legtöbbet érne.
 */
export function hianyzoParok(
  nyitoKepek: Pick<Kep, "id" | "megnevezes">[],
  zaroKepek: Pick<Kep, "parjaId">[],
): Pick<Kep, "id" | "megnevezes">[] {
  const megvan = new Set(
    zaroKepek.map((kep) => kep.parjaId).filter((id): id is string => id !== null),
  );
  return nyitoKepek.filter((kep) => !megvan.has(kep.id));
}
