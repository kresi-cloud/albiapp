/**
 * Befizetés-egyeztetés.
 *
 * Három adat találkozik, és egyik sem írja felül a másikat:
 *  - az előírt tétel: mit kellett volna fizetni és mikorra,
 *  - a bérlő által igazolt befizetés: mit mond a bérlő, mikor mennyit utalt,
 *  - a kivonattétel: mit mutat a bérbeadó bankszámlakivonata.
 *
 * Az eredmény mindkét fél számára ugyanaz a három állapot: egyezik, eltér,
 * hiányzik.
 */

import { napKulonbseg } from "./penz";

export type EloirtTetel = {
  id: string;
  tipus: string;
  idoszak: string;
  esedekesseg: Date;
  osszegFt: number;
};

export type BerloiIgazolas = {
  id: string;
  utalasDatuma: Date;
  osszegFt: number;
  kozlemeny?: string | null;
};

export type Kivonattetel = {
  id: string;
  konyvelesDatuma: Date;
  osszegFt: number;
  kozlemeny?: string | null;
  partnerNev?: string | null;
};

export type Allapot = "egyezik" | "elter" | "hianyzik";

export type ElteresOka =
  | "osszeg"
  | "nincs_kivonattetel"
  | "nincs_berloi_igazolas"
  | "nincs_eloiras";

export type Egyeztetes = {
  eloirtTetelId: string | null;
  berloiIgazolasId: string | null;
  kivonattetelId: string | null;
  allapot: Allapot;
  elteresOka: ElteresOka | null;
  elteresFt: number;
  keses: number;
  magyarazat: string;
};

export type EgyeztetesBeallitasok = {
  /** Ennyi nappal az esedékesség előtt már elfogadunk egy befizetést. */
  korabbiAblakNap: number;
  /** Ennyi nappal utána még ehhez az előíráshoz kötjük. */
  kesobbiAblakNap: number;
  /**
   * Ennyi forint eltérést tekintünk még egyezésnek. Termékdöntés: ez fix nulla,
   * bármekkora eltérésnél egyeztetés indul. Azért paraméter mégis, hogy a
   * tesztek ki tudják próbálni a másik viselkedést is.
   */
  toleranciaFt: number;
};

export const ALAPERTELMEZETT_BEALLITASOK: EgyeztetesBeallitasok = {
  korabbiAblakNap: 10,
  kesobbiAblakNap: 25,
  toleranciaFt: 0,
};

/** Ennél hosszabb ablaknak nincs értelme: átcsúszna a szomszédos hónapokra. */
export const ABLAK_MAX_NAP = 90;

/**
 * Az űrlapról szabad szöveg érkezik. Itt lesz belőle beállítás, vagy itt derül
 * ki, hogy miért nem. A hibaüzenetek mennek ki a felhasználónak.
 */
export function ablakotEllenoriz(nyers: {
  korabbiAblakNap: unknown;
  kesobbiAblakNap: unknown;
}): { ablak: { korabbiAblakNap: number; kesobbiAblakNap: number } | null; hibak: string[] } {
  const hibak: string[] = [];

  const napot = (ertek: unknown, megnevezes: string): number | null => {
    const szoveg = String(ertek ?? "").trim().replace(/\s/g, "");
    if (szoveg === "") {
      hibak.push(`${megnevezes}: adj meg egy napszámot.`);
      return null;
    }
    if (!/^\d+$/.test(szoveg)) {
      hibak.push(`${megnevezes}: csak egész napszám adható meg.`);
      return null;
    }
    const szam = Number(szoveg);
    if (szam > ABLAK_MAX_NAP) {
      hibak.push(`${megnevezes}: legfeljebb ${ABLAK_MAX_NAP} nap adható meg.`);
      return null;
    }
    return szam;
  };

  const korabbiAblakNap = napot(nyers.korabbiAblakNap, "Esedékesség előtt");
  const kesobbiAblakNap = napot(nyers.kesobbiAblakNap, "Esedékesség után");

  if (korabbiAblakNap === null || kesobbiAblakNap === null) {
    return { ablak: null, hibak };
  }
  return { ablak: { korabbiAblakNap, kesobbiAblakNap }, hibak };
}

type Jelolt<T> = { tetel: T; tavolsag: number; osszegElteres: number };

function legjobbJelolt<T extends { osszegFt: number }>(
  jeloltek: Jelolt<T>[],
): Jelolt<T> | null {
  if (jeloltek.length === 0) return null;
  // Először a pontos összeg számít, utána az időbeli közelség. Így egy
  // pontosan stimmelő, de később érkezett utalás erősebb jelölt, mint egy
  // időben közeli, de rossz összegű.
  return [...jeloltek].sort((a, b) => {
    const aPontos = a.osszegElteres === 0 ? 0 : 1;
    const bPontos = b.osszegElteres === 0 ? 0 : 1;
    if (aPontos !== bPontos) return aPontos - bPontos;
    if (a.tavolsag !== b.tavolsag) return a.tavolsag - b.tavolsag;
    return Math.abs(a.osszegElteres) - Math.abs(b.osszegElteres);
  })[0];
}

export function egyeztet(
  eloirtTetelek: EloirtTetel[],
  berloiIgazolasok: BerloiIgazolas[],
  kivonattetelek: Kivonattetel[],
  ma: Date,
  beallitasok: EgyeztetesBeallitasok = ALAPERTELMEZETT_BEALLITASOK,
): Egyeztetes[] {
  const eredmeny: Egyeztetes[] = [];
  const felhasznaltKivonat = new Set<string>();
  const felhasznaltIgazolas = new Set<string>();

  const sorrendben = [...eloirtTetelek].sort(
    (a, b) => a.esedekesseg.getTime() - b.esedekesseg.getTime(),
  );

  for (const eloiras of sorrendben) {
    const ablakban = <T extends { osszegFt: number }>(
      tetelek: T[],
      datumot: (tetel: T) => Date,
      mar: Set<string>,
      azonosito: (tetel: T) => string,
    ): Jelolt<T>[] =>
      tetelek
        .filter((tetel) => !mar.has(azonosito(tetel)))
        .map((tetel) => ({
          tetel,
          tavolsag: napKulonbseg(eloiras.esedekesseg, datumot(tetel)),
          osszegElteres: tetel.osszegFt - eloiras.osszegFt,
        }))
        .filter(
          (jelolt) =>
            jelolt.tavolsag >= -beallitasok.korabbiAblakNap &&
            jelolt.tavolsag <= beallitasok.kesobbiAblakNap,
        );

    const kivonatJelolt = legjobbJelolt(
      ablakban(
        kivonattetelek,
        (tetel) => tetel.konyvelesDatuma,
        felhasznaltKivonat,
        (tetel) => tetel.id,
      ),
    );
    const igazolasJelolt = legjobbJelolt(
      ablakban(
        berloiIgazolasok,
        (tetel) => tetel.utalasDatuma,
        felhasznaltIgazolas,
        (tetel) => tetel.id,
      ),
    );

    if (kivonatJelolt) felhasznaltKivonat.add(kivonatJelolt.tetel.id);
    if (igazolasJelolt) felhasznaltIgazolas.add(igazolasJelolt.tetel.id);

    const lejart = napKulonbseg(eloiras.esedekesseg, ma) > 0;

    if (kivonatJelolt) {
      const elteres = kivonatJelolt.osszegElteres;
      const keses = Math.max(0, kivonatJelolt.tavolsag);
      const egyezik = Math.abs(elteres) <= beallitasok.toleranciaFt;
      eredmeny.push({
        eloirtTetelId: eloiras.id,
        berloiIgazolasId: igazolasJelolt?.tetel.id ?? null,
        kivonattetelId: kivonatJelolt.tetel.id,
        allapot: egyezik ? "egyezik" : "elter",
        elteresOka: egyezik ? null : "osszeg",
        elteresFt: egyezik ? 0 : elteres,
        keses,
        magyarazat: egyezik
          ? keses > 0
            ? `Megérkezett, ${keses} nappal az esedékesség után.`
            : "Megérkezett, határidőre."
          : elteres < 0
            ? `${Math.abs(elteres)} forinttal kevesebb érkezett, mint az előírás.`
            : `${elteres} forinttal több érkezett, mint az előírás.`,
      });
      continue;
    }

    if (igazolasJelolt) {
      eredmeny.push({
        eloirtTetelId: eloiras.id,
        berloiIgazolasId: igazolasJelolt.tetel.id,
        kivonattetelId: null,
        allapot: "elter",
        elteresOka: "nincs_kivonattetel",
        elteresFt: -eloiras.osszegFt,
        keses: Math.max(0, igazolasJelolt.tavolsag),
        magyarazat:
          "A bérlő igazolta a befizetést, de a kivonaton nem találtam hozzá tételt.",
      });
      continue;
    }

    if (lejart) {
      eredmeny.push({
        eloirtTetelId: eloiras.id,
        berloiIgazolasId: null,
        kivonattetelId: null,
        allapot: "hianyzik",
        elteresOka: null,
        elteresFt: -eloiras.osszegFt,
        keses: napKulonbseg(eloiras.esedekesseg, ma),
        magyarazat: "Az esedékesség letelt, és nem érkezett hozzá befizetés.",
      });
    }
  }

  // Ami a kivonaton maradt: beérkezett, de nincs hozzá előírás. Lehet túlfizetés,
  // kaució vagy egészen más utalás — mindenképp a bérbeadó szeme elé való.
  for (const kivonattetel of kivonattetelek) {
    if (felhasznaltKivonat.has(kivonattetel.id)) continue;
    eredmeny.push({
      eloirtTetelId: null,
      berloiIgazolasId: null,
      kivonattetelId: kivonattetel.id,
      allapot: "elter",
      elteresOka: "nincs_eloiras",
      elteresFt: kivonattetel.osszegFt,
      keses: 0,
      magyarazat: "Beérkezett utalás, amihez nem tartozik előírt tétel.",
    });
  }

  return eredmeny;
}
