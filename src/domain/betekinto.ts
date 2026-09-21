/**
 * Betekintő nézet: a bérlő megosztható, csak olvasható kimutatása a saját
 * bérleményéről.
 *
 * Kinek készül. Egy egyetemista bérlő albérletét jellemzően a szülei fizetik,
 * vagy hozzáteszik. A szülő távol van, nem látja a számlákat, és nincs joga
 * belépni a bérlő fiókjába. Eddig csak annyi maradt neki, hogy megkérdezi, és
 * elhiszi a választ — ebből lesz otthon a bizalmi kérdés. Ezzel a linkkel a
 * bérlő maga mutatja meg, hogy áll a bérlemény: nem a bérbeadó kutat a bérlő
 * után, hanem a bérlő ad ki magáról egy ellenőrizhető képet, akkor és annak,
 * akinek akarja.
 *
 * Három dolog teszi használhatóvá:
 *
 *  - Az adat nem a bérlő bemondása. Abból jön, amit a bérbeadó a beérkezésről
 *    maga rögzített, tehát a másik fél adatából. Ettől ér bármit otthon.
 *  - Nem adunk pontszámot. Egy "8,4 pont a tízből" úgy néz ki, mintha mérés
 *    lenne, pedig csak súlyozás, amit mi találtunk ki. Tényeket mutatunk,
 *    és az olvasó ítél.
 *  - Szűk. Se bérbeadói név, se pontos cím, se személyes adat, se más bérlő.
 *    A pontos cím azért sem, mert annak, akivel a bérlő megosztja, úgyis
 *    megvan: a linkhez viszont bárki hozzáfér, akihez eljut, így a cím csak
 *    kockázat, haszon nélkül.
 *
 * Amit mutat, azt a szülői használat szabja meg: nem elég az összesített
 * előzmény, látszania kell, hol tart a bérlemény **most** — mi van kifizetve,
 * mire nem igazolt még a bérbeadó beérkezést —, és nem csak a bérleti díj,
 * hanem a közös költség és a rezsiátalány is, mert a szülő azokat is fizeti.
 */

import { uzenet, type Uzenet } from "./nyelv";

/**
 * Egy hónap sorsa. A nézet havi bontásban gondolkodik, nem tételenként: a
 * szülőt az érdekli, hogy egy adott hónap rendben van-e, nem az, hogy a
 * három előírás közül melyik.
 */
export type BetekintoTetel = {
  idoszak: string;
  allapot: "egyezik" | "elter" | "hianyzik";
  /** Naptári nap az esedékességhez képest; negatív, ha korábban érkezett. */
  keses: number;
  /** Amennyit erre a hónapra elő volt írva. */
  eloirtFt: number;
  /** Amennyi beérkezését a bérbeadó igazolta. Nulla, ha semmit. */
  erkezettFt: number;
};

export type Osszesites = {
  /** Hány hónapra volt előírás. */
  honapok: number;
  /** Beérkezett és beazonosított, az esedékességig. */
  hataridore: number;
  /** Beérkezett, de késve. */
  kesve: number;
  /** Nem érkezett meg, vagy nem volt beazonosítható. */
  hianyzo: number;
  /** Az összeg eltért az előírástól. */
  eltero: number;
  /** A késések átlaga napban, csak a késve érkezettekre. Nulla, ha nincs ilyen. */
  atlagosKeses: number;
  /** A leghosszabb késés napban. */
  leghosszabbKeses: number;
  /** Hány hónap óta érkezik minden határidőre, a legutolsótól visszafelé. */
  sorozat: number;
  /** Amennyi összesen elő volt írva az eddig esedékes hónapokra. */
  eloirtFt: number;
  /** Amennyi beérkezését a bérbeadó igazolta. */
  erkezettFt: number;
  /**
   * Amire a bérbeadó még nem igazolt beérkezést. Szándékosan nem "tartozás":
   * a friss hónap is itt van, amíg a bérbeadó rá nem néz a számlájára.
   */
  nyitottFt: number;
};

export const URES: Osszesites = {
  honapok: 0,
  hataridore: 0,
  kesve: 0,
  hianyzo: 0,
  eltero: 0,
  atlagosKeses: 0,
  leghosszabbKeses: 0,
  sorozat: 0,
  eloirtFt: 0,
  erkezettFt: 0,
  nyitottFt: 0,
};

function hataridore(tetel: BetekintoTetel): boolean {
  return tetel.allapot !== "hianyzik" && tetel.keses <= 0;
}

/** Hónapon belül a rosszabbik állapot dönt: egy rendezetlen tétel is rendezetlen hónap. */
const SULY: Record<BetekintoTetel["allapot"], number> = { egyezik: 0, elter: 1, hianyzik: 2 };

/**
 * Tételenkénti sorokból havi sorok. Egy hónapra három előírás is eshet
 * (bérleti díj, közös költség, rezsiátalány); a szülő egy sort akar látni
 * hónaponként, azzal az összeggel, amit ténylegesen fizetni kellett.
 *
 * A hónap akkor rendben van, ha minden tétele rendben van; a késése a
 * leghosszabb tételkésés. A két összeg külön adódik össze, mert az eltérés
 * onnan látszik, nem egy jelzőből.
 */
export function havonta(sorok: BetekintoTetel[]): BetekintoTetel[] {
  const honapok = new Map<string, BetekintoTetel>();

  for (const sor of sorok) {
    const eddigi = honapok.get(sor.idoszak);
    if (!eddigi) {
      honapok.set(sor.idoszak, { ...sor });
      continue;
    }
    honapok.set(sor.idoszak, {
      idoszak: sor.idoszak,
      allapot: SULY[sor.allapot] > SULY[eddigi.allapot] ? sor.allapot : eddigi.allapot,
      // A hiányzó tétel nem hoz késést: nincs mihez képest késnie.
      keses: Math.max(
        sor.allapot === "hianyzik" ? Number.NEGATIVE_INFINITY : sor.keses,
        eddigi.allapot === "hianyzik" ? Number.NEGATIVE_INFINITY : eddigi.keses,
      ),
      eloirtFt: eddigi.eloirtFt + sor.eloirtFt,
      erkezettFt: eddigi.erkezettFt + sor.erkezettFt,
    });
  }

  return [...honapok.values()]
    .map((honap) => ({
      ...honap,
      keses: Number.isFinite(honap.keses) ? honap.keses : 0,
    }))
    .sort((a, b) => b.idoszak.localeCompare(a.idoszak));
}

/**
 * A tételekből számolt összegzés. A sorrend a legfrissebb hónappal kezdődik,
 * mert a sorozatot a végétől számoljuk: azt mondja meg, hol tart most, nem azt,
 * mi volt két éve.
 */
export function osszesit(tetelek: BetekintoTetel[]): Osszesites {
  if (tetelek.length === 0) return URES;

  const sorrend = [...tetelek].sort((a, b) => b.idoszak.localeCompare(a.idoszak));
  const kesesek = sorrend
    .filter((tetel) => tetel.allapot !== "hianyzik" && tetel.keses > 0)
    .map((tetel) => tetel.keses);

  let sorozat = 0;
  for (const tetel of sorrend) {
    if (!hataridore(tetel)) break;
    sorozat += 1;
  }

  const eloirtFt = sorrend.reduce((osszeg, tetel) => osszeg + tetel.eloirtFt, 0);
  const erkezettFt = sorrend.reduce((osszeg, tetel) => osszeg + tetel.erkezettFt, 0);

  return {
    honapok: sorrend.length,
    hataridore: sorrend.filter(hataridore).length,
    kesve: kesesek.length,
    hianyzo: sorrend.filter((tetel) => tetel.allapot === "hianyzik").length,
    eltero: sorrend.filter((tetel) => tetel.allapot === "elter").length,
    atlagosKeses:
      kesesek.length === 0
        ? 0
        : Math.round(kesesek.reduce((osszeg, nap) => osszeg + nap, 0) / kesesek.length),
    leghosszabbKeses: kesesek.length === 0 ? 0 : Math.max(...kesesek),
    sorozat,
    eloirtFt,
    erkezettFt,
    // Hónaponként vágjuk nullára: egy túlfizetett hónap ne fedje el a
    // következő hónap elmaradását.
    nyitottFt: sorrend.reduce(
      (osszeg, tetel) => osszeg + Math.max(0, tetel.eloirtFt - tetel.erkezettFt),
      0,
    ),
  };
}

/**
 * Az összegzés mondatokban. Minden mondat egy tényt állít, és a szám mellett
 * ott az is, miből jött: a bérlő össze tudja adni, az olvasó ellenőrizni tudja.
 */
export function mondatok(osszesites: Osszesites): Uzenet[] {
  if (osszesites.honapok === 0) return [uzenet("betekinto.mondat.nincs_adat")];

  const sorok: Uzenet[] = [
    uzenet("betekinto.mondat.honapok", { honapok: osszesites.honapok }),
    uzenet("betekinto.mondat.hataridore", {
      hataridore: osszesites.hataridore,
      honapok: osszesites.honapok,
    }),
  ];

  if (osszesites.kesve > 0) {
    sorok.push(
      uzenet("betekinto.mondat.kesve", {
        kesve: osszesites.kesve,
        atlag: osszesites.atlagosKeses,
        leghosszabb: osszesites.leghosszabbKeses,
      }),
    );
  }
  if (osszesites.hianyzo > 0) {
    sorok.push(uzenet("betekinto.mondat.hianyzo", { hianyzo: osszesites.hianyzo }));
  }
  if (osszesites.eltero > 0) {
    sorok.push(uzenet("betekinto.mondat.eltero", { eltero: osszesites.eltero }));
  }
  if (osszesites.sorozat > 1) {
    sorok.push(uzenet("betekinto.mondat.sorozat", { sorozat: osszesites.sorozat }));
  }

  return sorok;
}

/** Egy havi sor állapotának neve, a havi lista sorai mellé. */
export function haviAllapotNeve(tetel: BetekintoTetel): Uzenet {
  if (tetel.allapot === "hianyzik") return uzenet("betekinto.havi.hianyzik");
  if (tetel.keses > 0) return uzenet("betekinto.havi.kesve", { napok: tetel.keses });
  if (tetel.allapot === "elter") return uzenet("betekinto.havi.elter");
  return uzenet("betekinto.havi.rendben");
}

/**
 * A bérlemény településnevének kiolvasása a címből.
 *
 * A pontos cím nem tartozik a betekintőre. Akinek a bérlő megmutatja, annak
 * amúgy is megvan; a linket viszont bárki megnyithatja, akihez eljut, tehát a
 * cím csak kockázat lenne. A település azért marad, mert enélkül az olvasó nem
 * tudja, mihez mérje a bérleti díjat. A magyar cím alakja "1111 Budapest,
 * Minta tér 2.": az első vessző előtti rész, az irányítószám nélkül.
 *
 * Ha nem ismerjük fel, nem tippelünk: inkább nem írunk semmit.
 */
export function telepules(cim: string): string | null {
  const elso = cim.split(",")[0]?.trim() ?? "";
  const nev = elso.replace(/^\d{4}\s+/, "").trim();
  if (nev === "" || nev === elso.trim() || /\d/.test(nev)) return null;
  return nev;
}

export type Allapot = "elo" | "lejart" | "visszavonva";

export function allapota(
  betekinto: { lejar: Date; visszavonva: Date | null },
  most: Date,
): Allapot {
  if (betekinto.visszavonva) return "visszavonva";
  return betekinto.lejar.getTime() <= most.getTime() ? "lejart" : "elo";
}

export function allapotNeve(allapot: Allapot): Uzenet {
  return uzenet(`betekinto.allapot.${allapot}`);
}

/**
 * Meddig éljen a link.
 *
 * Egy tanév nem harminc nap. Ha a bérlő a szüleinek adja ki, és a link egy
 * hónap múlva lejár, abból nem óvatosság lesz, hanem havi kérdezősködés —
 * pont az, amit el akartunk kerülni. Ezért a jogviszony hosszához igazodunk,
 * és a valódi fék a visszavonás marad: az azonnal hat, és a bérlő kezében van.
 */
export const ELETTARTAM_NAPOK = [30, 90, 180, 365] as const;
export const ALAPERTELMEZETT_ELETTARTAM = 365;

export function lejarat(most: Date, napok: number): Date {
  const lejar = new Date(most.getTime());
  lejar.setUTCDate(lejar.getUTCDate() + napok);
  return lejar;
}

/**
 * Amit a nézet soha nem mutat. Nem csak dokumentáció: a `betekinto` teszt ezt a
 * listát járja végig a kiadott adaton, hogy egy későbbi bővítés se csempéssze
 * vissza valamelyiket.
 */
export const SOHA_NEM_MUTATJUK = [
  "a bérbeadó neve és elérhetősége",
  "a bérlemény pontos címe",
  "a lakótársak neve",
  "személyes adat (születési adat, anyja neve, igazolványszám, adóazonosító)",
  "bankszámlaszám",
  "hibabejelentések tartalma",
] as const;
