/**
 * Naptár a teendőkhöz.
 *
 * A teendőlista megmondja, mi van hátra, de azt nem, hogy mikor sűrűsödik.
 * Egy bérbeadónak ez a második kérdése: nem az, hogy hány dolga van, hanem
 * hogy a jövő héten hány napon kell ráérnie. Ezért a naptár nem díszítés, és
 * ezért nem is a lista egy másik rendezése: a naptárban az üres nap is adat.
 *
 * A modul tiszta: a teendőket készen kapja, és csak napokba osztja őket. Így a
 * havi rács és a nyitólap hétsávja ugyanabból a számításból jön, és nem tud
 * elcsúszni egymástól.
 *
 * A hét hétfővel kezdődik. Mindkét nyelven így helyes: a magyar naptár hétfős,
 * és a brit angol is — amerikai vasárnapos hetet nem rajzolunk, mert az
 * alkalmazás magyar ingatlanról szól, és a bérlő is itt lakik.
 */

import { napEleje } from "./penz";
import type { Surgosseg, TeendoSurgosseggel } from "./teendok";

export type NaptarNap = {
  /** A nap eleje UTC-ben; ez a kulcs is. */
  nap: Date;
  /** Hányadika. A rácsban ez a szám áll. */
  sorszam: number;
  /** Hamis a rács elején-végén látszó szomszéd hónapi napokra. */
  honapban: boolean;
  ma: boolean;
  /** Szombat vagy vasárnap: a rácsban halványabb. */
  hetvege: boolean;
  teendok: TeendoSurgosseggel[];
  /** A nap legsürgetőbb teendőjének sürgőssége, vagy null, ha nincs teendő. */
  jelzes: Surgosseg | null;
};

export type NaptarHonap = {
  /** "ÉÉÉÉ-HH" — ezt teszi a lap a címbe és a hivatkozásokba. */
  idoszak: string;
  elozo: string;
  kovetkezo: string;
  /** Hetek, mindegyik hét nappal, hétfőtől vasárnapig. */
  hetek: NaptarNap[][];
  /**
   * Lejárt teendő, ami nem ebben a hónapban esedékes. A rács ezt nem tudja
   * megmutatni, márpedig pont ez a legfontosabb: aki októbert nézi, ne
   * gondolja, hogy a szeptemberi elmaradás megszűnt.
   */
  lejartMashonnan: number;
};

const NAP = 24 * 60 * 60 * 1000;

/** "ÉÉÉÉ-HH" alak egy napból. */
export function idoszakNapbol(ertek: Date): string {
  const honap = String(ertek.getUTCMonth() + 1).padStart(2, "0");
  return `${ertek.getUTCFullYear()}-${honap}`;
}

/**
 * Az időszak első napja. Amit nem ismerünk fel, arra null: a tippelés itt
 * azt jelentené, hogy a címsorban más hónap áll, mint a rácsban.
 */
export function idoszakElsoNapja(idoszak: string): Date | null {
  const talalat = /^(\d{4})-(\d{2})$/.exec(idoszak);
  if (!talalat) return null;

  const ev = Number(talalat[1]);
  const honap = Number(talalat[2]);
  if (honap < 1 || honap > 12) return null;

  return new Date(Date.UTC(ev, honap - 1, 1));
}

/** Hónapléptetés az időszakon, évfordulóval együtt. */
export function honapotLep(idoszak: string, lepes: number): string {
  const elso = idoszakElsoNapja(idoszak);
  if (!elso) return idoszak;
  return idoszakNapbol(
    new Date(Date.UTC(elso.getUTCFullYear(), elso.getUTCMonth() + lepes, 1)),
  );
}

/** Hétfőre vágott nap: a rács minden sora ezzel kezdődik. */
function hetElso(ertek: Date): Date {
  const nap = napEleje(ertek);
  // getUTCDay: vasárnap 0, hétfő 1. A hétfős hétben a vasárnap a hatodik lépés.
  const eltolas = (nap.getUTCDay() + 6) % 7;
  return new Date(nap.getTime() - eltolas * NAP);
}

/** A legsürgetőbb sürgősség a napon. A rács egy napra egy jelzést fér el. */
function napJelzese(teendok: TeendoSurgosseggel[]): Surgosseg | null {
  let jelzes: Surgosseg | null = null;
  for (const teendo of teendok) {
    if (teendo.surgosseg === "lejart") return "lejart";
    if (teendo.surgosseg === "ma") jelzes = "ma";
    else if (jelzes === null) jelzes = teendo.surgosseg;
  }
  return jelzes;
}

/** Nap szerinti csoportosítás, a nap elejére vágva. */
function naponkent(teendok: TeendoSurgosseggel[]): Map<number, TeendoSurgosseggel[]> {
  const terkep = new Map<number, TeendoSurgosseggel[]>();
  for (const teendo of teendok) {
    const kulcs = napEleje(teendo.esedekesseg).getTime();
    const eddigi = terkep.get(kulcs);
    if (eddigi) eddigi.push(teendo);
    else terkep.set(kulcs, [teendo]);
  }
  return terkep;
}

/**
 * Egy hónap rácsa. A rács mindig teljes hetekből áll, tehát a szomszéd hónap
 * napjai is látszanak — azokat a teendőt is kiírjuk rájuk, mert különben a
 * hónapforduló két oldalán lévő teendő eltűnne a nézetből.
 */
export function naptarHonap(
  teendok: TeendoSurgosseggel[],
  idoszak: string,
  ma: Date,
): NaptarHonap {
  const elso = idoszakElsoNapja(idoszak) ?? napEleje(ma);
  const valodiIdoszak = idoszakNapbol(elso);
  const utolso = new Date(
    Date.UTC(elso.getUTCFullYear(), elso.getUTCMonth() + 1, 0),
  );
  const maNap = napEleje(ma);
  const terkep = naponkent(teendok);

  const hetek: NaptarNap[][] = [];
  let futo = hetElso(elso);
  const vege = hetElso(utolso).getTime() + 6 * NAP;

  while (futo.getTime() <= vege) {
    const het: NaptarNap[] = [];
    for (let i = 0; i < 7; i++) {
      const nap = new Date(futo.getTime() + i * NAP);
      const napiTeendok = terkep.get(nap.getTime()) ?? [];
      het.push({
        nap,
        sorszam: nap.getUTCDate(),
        honapban: idoszakNapbol(nap) === valodiIdoszak,
        ma: nap.getTime() === maNap.getTime(),
        hetvege: nap.getUTCDay() === 0 || nap.getUTCDay() === 6,
        teendok: napiTeendok,
        jelzes: napJelzese(napiTeendok),
      });
    }
    hetek.push(het);
    futo = new Date(futo.getTime() + 7 * NAP);
  }

  const elsoLatott = hetek[0][0].nap.getTime();
  const utolsoLatott = hetek[hetek.length - 1][6].nap.getTime();
  const lejartMashonnan = teendok.filter((teendo) => {
    if (teendo.surgosseg !== "lejart") return false;
    const nap = napEleje(teendo.esedekesseg).getTime();
    return nap < elsoLatott || nap > utolsoLatott;
  }).length;

  return {
    idoszak: valodiIdoszak,
    elozo: honapotLep(valodiIdoszak, -1),
    kovetkezo: honapotLep(valodiIdoszak, 1),
    hetek,
    lejartMashonnan,
  };
}

export type KovetkezoNap = {
  nap: Date;
  sorszam: number;
  ma: boolean;
  hetvege: boolean;
  teendok: TeendoSurgosseggel[];
  jelzes: Surgosseg | null;
};

export type KovetkezoHet = {
  napok: KovetkezoNap[];
  /**
   * Ami már lejárt. Külön szám, nem az első napra összenyomva: a mai teendő és
   * a két hete lejárt nem ugyanaz, és aki a mai napra nézve látná mindkettőt,
   * azt hinné, ma keletkezett.
   */
  lejart: TeendoSurgosseggel[];
};

/**
 * A következő napok a nyitólapra. A mai nappal kezd, és a lejártat külön adja.
 *
 * Nem szűr semmit: a hívó dönti el, kinek a teendőit adja át. A napok száma
 * paraméter, mert a nyitólapon hét fér el egy sorban 360 képponton.
 */
export function kovetkezoHet(
  teendok: TeendoSurgosseggel[],
  ma: Date,
  napokSzama = 7,
): KovetkezoHet {
  const maNap = napEleje(ma);
  const terkep = naponkent(teendok);

  const napok: KovetkezoNap[] = [];
  for (let i = 0; i < napokSzama; i++) {
    const nap = new Date(maNap.getTime() + i * NAP);
    // A lejárt teendő a saját napján marad, nem csúszik a mai cellába.
    const napiTeendok = (terkep.get(nap.getTime()) ?? []).filter(
      (teendo) => teendo.surgosseg !== "lejart",
    );
    napok.push({
      nap,
      sorszam: nap.getUTCDate(),
      ma: i === 0,
      hetvege: nap.getUTCDay() === 0 || nap.getUTCDay() === 6,
      teendok: napiTeendok,
      jelzes: napJelzese(napiTeendok),
    });
  }

  return {
    napok,
    lejart: teendok.filter((teendo) => teendo.surgosseg === "lejart"),
  };
}
