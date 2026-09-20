/**
 * Éves adóösszesítő magánszemély bérbeadónak.
 *
 * Nem bevallás, hanem összesítő: azt mutatja meg, mennyi a bevétel, mi nem
 * számít bevételnek, mennyi a költség, és melyik elszámolási móddal jár jobban.
 * A bevallást a felhasználó adja be, a számokat ezzel ellenőrizve.
 *
 * A két szabály, amiért ez a rész egyáltalán érdekes:
 *
 *  - A továbbhárított, fogyasztás szerint mért közüzemi díj nem a bérbeadó
 *    bevétele (Szja tv. 17. § (3a)). Ami viszont átalányban megy, az bevétel,
 *    mert nincs mögötte tényleges fogyasztás szerinti arányosítás. Az
 *    alkalmazás tudja, melyik jogviszony melyik módon számol el, ezért ezt a
 *    kettőt szét tudja választani.
 *  - A bevétel pénzforgalmi szemléletű: az számít, ami az adott évben tényleg
 *    megérkezett, nem az, amit előírtunk.
 */

export const SZJA_KULCS = 0.15;
export const KOLTSEGHANYAD = 0.1;
/** Épület értékcsökkenési leírási kulcsa évente. */
export const ERTEKCSOKKENES_KULCS = 0.02;

export type BevetelFajta = "berleti_dij" | "rezsi" | "kozos_koltseg" | "egyeb";

export type BeerkezettTetel = {
  datum: Date;
  osszegFt: number;
  fajta: BevetelFajta;
  megnevezes: string;
  /**
   * Igaz, ha a tétel fogyasztás szerint mért, továbbhárított közüzemi díj.
   * Ilyenkor nem bevétel. Átalánynál hamis.
   */
  mertKozuzem?: boolean;
};

export type BevetelSor = BeerkezettTetel & {
  bevetelFt: number;
  nemBevetelFt: number;
  indoklas: string;
};

/**
 * Egy befizetett rezsitétel megosztása mért és nem mért rész között.
 *
 * Egy elszámolásban keveredhet a mért fogyasztás és a közös költség vagy az
 * átalány. Ilyenkor nem az egész tétel dől el egyben: a mért rész nem bevétel,
 * a többi igen, a tételek arányában. A kerekítés miatti egy forint mindig a nem
 * mért részre kerül, hogy a két rész összege pontosan a befizetés legyen.
 */
export function rezsitMegoszt(
  osszegFt: number,
  mertFt: number,
  osszesFt: number,
): { mertReszFt: number; egyebReszFt: number } {
  if (osszesFt <= 0 || mertFt <= 0) return { mertReszFt: 0, egyebReszFt: osszegFt };
  if (mertFt >= osszesFt) return { mertReszFt: osszegFt, egyebReszFt: 0 };
  const mertReszFt = Math.round((osszegFt * mertFt) / osszesFt);
  return { mertReszFt, egyebReszFt: osszegFt - mertReszFt };
}

export function bevetelketBesorol(tetelek: BeerkezettTetel[]): BevetelSor[] {
  return tetelek.map((tetel) => {
    if (tetel.fajta === "rezsi" && tetel.mertKozuzem) {
      return {
        ...tetel,
        bevetelFt: 0,
        nemBevetelFt: tetel.osszegFt,
        indoklas:
          "Fogyasztás szerint mért, továbbhárított közüzemi díj, ezért nem bevétel.",
      };
    }
    if (tetel.fajta === "rezsi") {
      return {
        ...tetel,
        bevetelFt: tetel.osszegFt,
        nemBevetelFt: 0,
        indoklas:
          "Átalányban fizetett rezsi: nincs mögötte tényleges fogyasztás szerinti arányosítás, ezért bevétel.",
      };
    }
    if (tetel.fajta === "kozos_koltseg") {
      return {
        ...tetel,
        bevetelFt: tetel.osszegFt,
        nemBevetelFt: 0,
        indoklas:
          "A bérlőtől kapott közös költség bevétel; ha te fizeted a társasháznak, költségként leírható.",
      };
    }
    return {
      ...tetel,
      bevetelFt: tetel.osszegFt,
      nemBevetelFt: 0,
      indoklas: "Bérleti díjként befolyt összeg.",
    };
  });
}

/**
 * Értékcsökkenés a bérbeadás napjaira arányosítva. Ha az ingatlan az évnek
 * csak egy részében volt kiadva, csak arra a részre jár.
 */
export function ertekcsokkenes(
  beszerzesiArFt: number | null,
  berbeadottNapok: number,
  evNapjai: number,
): number {
  if (!beszerzesiArFt || beszerzesiArFt <= 0 || berbeadottNapok <= 0) return 0;
  return Math.round((beszerzesiArFt * ERTEKCSOKKENES_KULCS * berbeadottNapok) / evNapjai);
}

export type KoltsegSor = { megnevezes: string; osszegFt: number };

export type Osszesito = {
  bevetelFt: number;
  nemBevetelFt: number;
  tetelesKoltsegFt: number;
  /** 10%-os költséghányad szerinti adóalap. */
  adoalapHanyadFt: number;
  /** Tételes költségelszámolás szerinti adóalap. */
  adoalapTetelesFt: number;
  adoHanyadFt: number;
  adoTetelesFt: number;
  /** Amelyikkel kevesebb adó jön ki. Egyenlőségnél a költséghányad, mert egyszerűbb. */
  ajanlott: "hanyad" | "teteles";
  megtakaritasFt: number;
};

export function adoosszesito(bevetelSorok: BevetelSor[], koltsegek: KoltsegSor[]): Osszesito {
  const bevetelFt = bevetelSorok.reduce((osszeg, sor) => osszeg + sor.bevetelFt, 0);
  const nemBevetelFt = bevetelSorok.reduce((osszeg, sor) => osszeg + sor.nemBevetelFt, 0);
  const tetelesKoltsegFt = koltsegek.reduce((osszeg, sor) => osszeg + sor.osszegFt, 0);

  const adoalapHanyadFt = Math.round(bevetelFt * (1 - KOLTSEGHANYAD));
  // A tételes elszámolásnál a veszteség nem visz negatív adóalapot az összesítőben.
  const adoalapTetelesFt = Math.max(0, bevetelFt - tetelesKoltsegFt);

  const adoHanyadFt = Math.round(adoalapHanyadFt * SZJA_KULCS);
  const adoTetelesFt = Math.round(adoalapTetelesFt * SZJA_KULCS);

  return {
    bevetelFt,
    nemBevetelFt,
    tetelesKoltsegFt,
    adoalapHanyadFt,
    adoalapTetelesFt,
    adoHanyadFt,
    adoTetelesFt,
    ajanlott: adoTetelesFt < adoHanyadFt ? "teteles" : "hanyad",
    megtakaritasFt: Math.abs(adoHanyadFt - adoTetelesFt),
  };
}

/** Egy adott év napjainak száma, szökőévvel együtt. */
export function evNapjai(ev: number): number {
  return (Date.UTC(ev + 1, 0, 1) - Date.UTC(ev, 0, 1)) / (24 * 60 * 60 * 1000);
}

/** Hány napot volt kiadva az ingatlan az adott évben. */
export function berbeadottNapok(
  ev: number,
  idoszakok: { kezdete: Date; vege: Date | null }[],
): number {
  const evKezdete = Date.UTC(ev, 0, 1);
  const evVege = Date.UTC(ev + 1, 0, 1);
  const nap = 24 * 60 * 60 * 1000;

  // Az átfedő időszakokat összefésüljük, hogy egy nap ne számítson kétszer.
  const szakaszok = idoszakok
    .map((idoszak) => ({
      tol: Math.max(evKezdete, idoszak.kezdete.getTime()),
      ig: Math.min(evVege, idoszak.vege ? idoszak.vege.getTime() : evVege),
    }))
    .filter((szakasz) => szakasz.ig > szakasz.tol)
    .sort((a, b) => a.tol - b.tol);

  let napok = 0;
  let eddig = -Infinity;
  for (const szakasz of szakaszok) {
    const tol = Math.max(szakasz.tol, eddig);
    if (szakasz.ig > tol) {
      napok += (szakasz.ig - tol) / nap;
      eddig = szakasz.ig;
    }
  }
  return Math.round(napok);
}
