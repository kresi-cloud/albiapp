/**
 * Vezetékes tv-, telefon- és internetelőfizetés a bérleményhez.
 *
 * Ez a rész opcionális: sok albérlethez nincs ilyen, és amelyikhez van, ott
 * sem egyforma. A lényegi döntés nem az, hogy melyik szolgáltató, hanem hogy
 * **ki az előfizető**, mert a kettő pénzügyileg nem ugyanaz:
 *
 *  - a bérbeadó az előfizető: a szolgáltatóval ő szerződik, a számla az ő
 *    nevére jön, és a bérlő neki téríti meg. Ez havi előírás, tehát a
 *    befizetés-egyeztetés is látja;
 *  - a bérlő az előfizető: ő szerződik, ő fizet, a bérbeadó csak hozzájárul.
 *    Pénz nem megy át az alkalmazáson, de a szerződésbe attól még bekerül,
 *    mert a létesítés és a megszüntetés a bérleményt érinti.
 *
 * A jóváhagyás nem formaság: a bérlőnek olyan havi kiadása keletkezik, amiről
 * a bérleti szerződés megkötésekor még nem volt szó. Ezért ugyanaz a kétoldali
 * elv áll rá, mint a befizetésre és a fényképre: a bérbeadó beállítja, a bérlő
 * a saját adatával mond rá igent vagy nemet, és amíg nem mondta, nem írunk elő
 * belőle semmit.
 */

import { uzenet, type Uzenet } from "./nyelv";

export type Fajta = "tv" | "telefon" | "internet" | "egyeb";
export type Elofizeto = "berbeado" | "berlo";
export type NyilatkozatAllapot = "jovahagyva" | "kifogasolt";

export const FAJTAK: Fajta[] = ["tv", "telefon", "internet", "egyeb"];

export type Nyilatkozat = {
  berloId: string;
  allapot: NyilatkozatAllapot;
  indoklas: string | null;
};

export type ElofizetesAdat = {
  id: string;
  fajta: Fajta;
  megnevezes: string;
  szolgaltato: string | null;
  elofizeto: Elofizeto;
  haviDijFt: number;
  kezdete: Date;
  vege: Date | null;
  nyilatkozatok: Nyilatkozat[];
};

/**
 * Az előfizetés állapota a bérlői nyilatkozatokból.
 *
 * Egy kifogás elég a kifogásolt állapothoz: ha az egyik lakótárs nem kéri az
 * előfizetést, azt nem szavazza le a másik. A jóváhagyáshoz viszont mindenki
 * kell, akinek van fiókja — egy olyan havi díjat, amiről a lakótárs nem is
 * tudott, nem írunk elő neki.
 */
export type Allapot = "varakozik" | "jovahagyva" | "kifogasolt";

export function allapota(
  elofizetes: Pick<ElofizetesAdat, "nyilatkozatok">,
  fiokosBerlok: readonly string[],
): Allapot {
  if (elofizetes.nyilatkozatok.some((n) => n.allapot === "kifogasolt")) return "kifogasolt";
  if (fiokosBerlok.length === 0) return "varakozik";
  const jovahagyok = new Set(
    elofizetes.nyilatkozatok.filter((n) => n.allapot === "jovahagyva").map((n) => n.berloId),
  );
  return fiokosBerlok.every((berloId) => jovahagyok.has(berloId)) ? "jovahagyva" : "varakozik";
}

/** Kire vár az előfizetés: aki még nem nyilatkozott. */
export function varRank(
  elofizetes: Pick<ElofizetesAdat, "nyilatkozatok">,
  fiokosBerlok: readonly string[],
): string[] {
  const nyilatkozott = new Set(elofizetes.nyilatkozatok.map((n) => n.berloId));
  return fiokosBerlok.filter((berloId) => !nyilatkozott.has(berloId));
}

/**
 * Terhelhető-e az előfizetés, azaz lesz-e belőle havi előírás.
 *
 * Három feltétel, és mind a három termékdöntés: csak a bérbeadó előfizetését
 * térítik meg (a bérlő a sajátját a szolgáltatónak fizeti), csak a jóváhagyottat
 * (a jóváhagyás enélkül semmit nem jelentene), és csak amiért kérünk is pénzt.
 */
export function terhelheto(elofizetes: ElofizetesAdat, allapot: Allapot): boolean {
  return elofizetes.elofizeto === "berbeado" && allapot === "jovahagyva" && elofizetes.haviDijFt > 0;
}

export type Kifogas = "nincs_megnevezes" | "negativ_dij" | "vege_a_kezdet_elott";

export function kifogasSzovege(kifogas: Kifogas): Uzenet {
  return uzenet(`elofizetes.kifogas.${kifogas}`);
}

export type Bevitel = {
  megnevezes: string;
  haviDijFt: number;
  kezdete: Date;
  vege: Date | null;
};

/** Amit nem mentünk el, mert az adat így értelmetlen vagy később hibát okozna. */
export function ellenoriz(bevitel: Bevitel): Kifogas | null {
  if (bevitel.megnevezes.trim().length === 0) return "nincs_megnevezes";
  if (bevitel.haviDijFt < 0) return "negativ_dij";
  if (bevitel.vege && bevitel.vege.getTime() < bevitel.kezdete.getTime()) {
    return "vege_a_kezdet_elott";
  }
  return null;
}

/**
 * Amit elmentünk, de megmondjuk, mi nem fog működni tőle.
 *
 * A nulla forintos havi díj nem hiba: van, aki az internetet a bérleti díjban
 * hagyja. Csak azt mondjuk meg, hogy akkor nem írunk elő belőle semmit,
 * különben a bérbeadó azt hinné, hogy majd magától megjelenik a befizetéseknél.
 */
export function figyelmeztetesek(elofizetes: {
  elofizeto: Elofizeto;
  haviDijFt: number;
}): Uzenet[] {
  const lista: Uzenet[] = [];
  if (elofizetes.elofizeto === "berbeado" && elofizetes.haviDijFt === 0) {
    lista.push(uzenet("elofizetes.figyelmeztet.nulla_dij"));
  }
  if (elofizetes.elofizeto === "berlo" && elofizetes.haviDijFt > 0) {
    lista.push(uzenet("elofizetes.figyelmeztet.berlo_fizet"));
  }
  return lista;
}

/** A saját nyilatkozatára senki nem vár: a bérbeadó nem hagyja jóvá a sajátját. */
export function nyilatkozhat(elofizetes: ElofizetesAdat, berloId: string): boolean {
  return !elofizetes.nyilatkozatok.some((n) => n.berloId === berloId);
}

/** Az előfizetés él-e az adott napon. A vége napja még beleszámít. */
export function elo(elofizetes: Pick<ElofizetesAdat, "kezdete" | "vege">, napon: Date): boolean {
  if (napon.getTime() < elofizetes.kezdete.getTime()) return false;
  if (elofizetes.vege && napon.getTime() > elofizetes.vege.getTime()) return false;
  return true;
}
