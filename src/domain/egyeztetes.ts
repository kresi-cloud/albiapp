/**
 * Befizetés-egyeztetés.
 *
 * Három adat találkozik, és egyik sem írja felül a másikat:
 *  - az előírt tétel: mit kellett volna fizetni és mikorra,
 *  - a bérlő által igazolt befizetés: mit mond a bérlő, mikor mennyit utalt,
 *  - a bérbeadó által igazolt beérkezés: mit mond a bérbeadó, mikor mennyi jött.
 *
 * A két fél a saját oldalát adja meg, és ha a kettő egyezik, a kérdés le van
 * zárva: bizonylatot ilyenkor nem kérünk, mert nincs mit bizonyítani. Teljes
 * bankszámlakivonatot pedig soha: az a bérbeadó összes pénzmozgását megmutatná,
 * a bérlőét pedig az övét — ahhoz egyik félnek sincs köze.
 *
 * Ha a két oldal nem egyezik, az vitás: onnantól van értelme az adott utalás
 * küldő és fogadó oldali bizonylatának.
 *
 * Az összeg és az előírás viszonya külön kérdés. Ha mindkét fél ugyanazt mondja,
 * csak nem annyit, amennyi elő volt írva, az nem vita: a felek egyetértenek
 * abban, mi történt. Ezért ennek külön állapota van.
 */

import { uzenet, type Uzenet } from "./nyelv";
import { napKulonbseg } from "./penz";

export type EloirtTetel = {
  id: string;
  tipus: string;
  idoszak: string;
  esedekesseg: Date;
  osszegFt: number;
};

/** Amit a bérlő mond: mikor mennyit utalt, milyen közleménnyel. */
export type BerloiIgazolas = {
  id: string;
  utalasDatuma: Date;
  osszegFt: number;
  kozlemeny?: string | null;
};

/**
 * Amit a bérbeadó mond. Kétféle lehet: "ennyi érkezett ekkor", vagy egy adott
 * előírásra az, hogy "erre nem érkezett pénz". A tagadás nélkül egy elmaradt
 * utalás örökké a másik fél adatára várna.
 */
export type BerbeadoiIgazolas = {
  id: string;
  megerkezett: boolean;
  /** Csak a tagadásnál van kitöltve: melyik előírásra mondja, hogy nem jött. */
  eloirtTetelId?: string | null;
  erkezesDatuma: Date;
  osszegFt: number;
  kozlemeny?: string | null;
};

export type Allapot =
  /** Mindkét fél megadta, egyeznek egymással és az előírt összeggel. */
  | "egyezik"
  /** Mindkét fél ugyanazt mondja, de nem az előírt összeget. Nem vita. */
  | "elter"
  /** A két fél adata nem fedi egymást. Innen van értelme a bizonylatnak. */
  | "vitas"
  /** Csak az egyik fél adta meg: a másikra várunk. */
  | "varakozik"
  /** Egyik fél sem adott meg semmit, és az esedékesség elmúlt. */
  | "hianyzik";

export type ElteresOka =
  /** A felek egyetértenek, de nem az előírt összeg jött. */
  | "osszeg"
  /** A bérlő és a bérbeadó mást mond ugyanarról az utalásról. */
  | "ket_oldal_elter"
  /** A bérbeadó azt mondja, nem érkezett meg, a bérlő szerint elutalta. */
  | "nem_erkezett_meg"
  /** A bérlő megadta, a bérbeadó még nem. */
  | "nincs_berbeadoi_igazolas"
  /** A bérbeadó megadta, a bérlő még nem. */
  | "nincs_berloi_igazolas"
  /** Pénz érkezett, amihez nincs előírás. */
  | "nincs_eloiras";

export type Egyeztetes = {
  eloirtTetelId: string | null;
  berloiIgazolasId: string | null;
  berbeadoiIgazolasId: string | null;
  allapot: Allapot;
  elteresOka: ElteresOka | null;
  elteresFt: number;
  keses: number;
  /** Kérünk-e bizonylatot: csak akkor, ha a két oldal nem fedi egymást. */
  bizonylatKell: boolean;
  /** Fordítható magyarázat: kulcs és behelyettesítendő adatok. */
  magyarazat: Uzenet;
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
  /**
   * Kérjünk-e bizonylatot, ha a két fél adata nem egyezik. A bérbeadó dönti el:
   * van, aki a bérlőjétől nem akar papírt kérni. A vita ettől még vita marad,
   * csak nem kérünk hozzá semmit.
   */
  bizonylatKeres: boolean;
};

export const ALAPERTELMEZETT_BEALLITASOK: EgyeztetesBeallitasok = {
  korabbiAblakNap: 10,
  kesobbiAblakNap: 25,
  toleranciaFt: 0,
  bizonylatKeres: true,
};

/** Ennél hosszabb ablaknak nincs értelme: átcsúszna a szomszédos hónapokra. */
export const ABLAK_MAX_NAP = 90;

/**
 * Ennyi nap eltérést fogadunk el a két fél dátuma közt. A forintutalás ma
 * másodpercek alatt megérkezik, de a bérlő gyakran az indítás napját írja, a
 * bérbeadó pedig azt, amikor észrevette. Ennél nagyobb csúszásnál már érdemes
 * ránézni, tényleg ugyanarról az utalásról beszél-e a két fél.
 */
export const KET_OLDAL_NAP_ELTERES = 3;

/**
 * Az űrlapról szabad szöveg érkezik. Itt lesz belőle beállítás, vagy itt derül
 * ki, hogy miért nem. A hibaüzenetek mennek ki a felhasználónak.
 */
export function ablakotEllenoriz(nyers: {
  korabbiAblakNap: unknown;
  kesobbiAblakNap: unknown;
}): { ablak: { korabbiAblakNap: number; kesobbiAblakNap: number } | null; hibak: Uzenet[] } {
  const hibak: Uzenet[] = [];

  const napot = (ertek: unknown, mezo: Uzenet): number | null => {
    const szoveg = String(ertek ?? "").trim().replace(/\s/g, "");
    if (szoveg === "") {
      hibak.push(uzenet("beallitasok.hiba.nap_kell", { mezo }));
      return null;
    }
    if (!/^\d+$/.test(szoveg)) {
      hibak.push(uzenet("beallitasok.hiba.egesz_nap", { mezo }));
      return null;
    }
    const szam = Number(szoveg);
    if (szam > ABLAK_MAX_NAP) {
      hibak.push(uzenet("beallitasok.hiba.max_nap", { mezo, max: ABLAK_MAX_NAP }));
      return null;
    }
    return szam;
  };

  const korabbiAblakNap = napot(nyers.korabbiAblakNap, uzenet("beallitasok.ablak_elotte"));
  const kesobbiAblakNap = napot(nyers.kesobbiAblakNap, uzenet("beallitasok.ablak_utana"));

  if (korabbiAblakNap === null || kesobbiAblakNap === null) {
    return { ablak: null, hibak };
  }
  return { ablak: { korabbiAblakNap, kesobbiAblakNap }, hibak };
}

type Jelolt<T> = { tetel: T; tavolsag: number; osszegElteres: number };

function legjobbJelolt<T>(jeloltek: Jelolt<T>[]): Jelolt<T> | null {
  if (jeloltek.length === 0) return null;
  // Azonos körön belül az időbeli közelség dönt — abszolút értékben, mert egy
  // két nappal korábbi utalás közelebb van, mint egy húsz nappal későbbi —,
  // utána a kisebb összegeltérés.
  return [...jeloltek].sort((a, b) => {
    const aTav = Math.abs(a.tavolsag);
    const bTav = Math.abs(b.tavolsag);
    if (aTav !== bTav) return aTav - bTav;
    return Math.abs(a.osszegElteres) - Math.abs(b.osszegElteres);
  })[0];
}

/**
 * Befizetések párosítása az előírásokhoz, két körben.
 *
 * Az első kör csak a pontosan stimmelő összegeket köti. Enélkül egy korábbi
 * előírás elvinné a rá nem illő befizetést pusztán azért, mert időben az van
 * elöl — és onnantól minden következő tétel egy tétellel arrébb csúszna. Egy
 * 14 000 forintos közös költség nem a 180 000 forintos bérleti díj befizetése,
 * akkor sem, ha az esedékességi ablakba beleesik.
 *
 * A második kör köti a maradékot időbeli közelség szerint: ott már tényleg csak
 * az eltérő összegű befizetések maradtak, és azokból lesz az egyeztetés.
 */
function parosit<T extends { id: string; osszegFt: number }>(
  eloirasok: EloirtTetel[],
  tetelek: T[],
  datumot: (tetel: T) => Date,
  beallitasok: EgyeztetesBeallitasok,
): Map<string, Jelolt<T>> {
  const parok = new Map<string, Jelolt<T>>();
  const felhasznalt = new Set<string>();

  const jeloltek = (eloiras: EloirtTetel, csakPontos: boolean): Jelolt<T>[] =>
    tetelek
      .filter((tetel) => !felhasznalt.has(tetel.id))
      .map((tetel) => ({
        tetel,
        tavolsag: napKulonbseg(eloiras.esedekesseg, datumot(tetel)),
        osszegElteres: tetel.osszegFt - eloiras.osszegFt,
      }))
      .filter(
        (jelolt) =>
          jelolt.tavolsag >= -beallitasok.korabbiAblakNap &&
          jelolt.tavolsag <= beallitasok.kesobbiAblakNap &&
          (!csakPontos || jelolt.osszegElteres === 0),
      );

  for (const csakPontos of [true, false]) {
    for (const eloiras of eloirasok) {
      if (parok.has(eloiras.id)) continue;
      const jelolt = legjobbJelolt(jeloltek(eloiras, csakPontos));
      if (!jelolt) continue;
      parok.set(eloiras.id, jelolt);
      felhasznalt.add(jelolt.tetel.id);
    }
  }

  return parok;
}

/** Ugyanarról az utalásról beszél-e a két fél. */
function ketOldalEgyezik(berloi: BerloiIgazolas, berbeadoi: BerbeadoiIgazolas): boolean {
  if (berloi.osszegFt !== berbeadoi.osszegFt) return false;
  return (
    Math.abs(napKulonbseg(berloi.utalasDatuma, berbeadoi.erkezesDatuma)) <=
    KET_OLDAL_NAP_ELTERES
  );
}

export function egyeztet(
  eloirtTetelek: EloirtTetel[],
  berloiIgazolasok: BerloiIgazolas[],
  berbeadoiIgazolasok: BerbeadoiIgazolas[],
  ma: Date,
  beallitasok: EgyeztetesBeallitasok = ALAPERTELMEZETT_BEALLITASOK,
): Egyeztetes[] {
  const eredmeny: Egyeztetes[] = [];

  // A tagadás nem párosítható tétel: eleve egy előíráshoz tartozik.
  const tagadasok = new Map(
    berbeadoiIgazolasok
      .filter((igazolas) => !igazolas.megerkezett && igazolas.eloirtTetelId)
      .map((igazolas) => [igazolas.eloirtTetelId as string, igazolas]),
  );
  const beerkezesek = berbeadoiIgazolasok.filter((igazolas) => igazolas.megerkezett);

  const sorrendben = [...eloirtTetelek].sort(
    (a, b) => a.esedekesseg.getTime() - b.esedekesseg.getTime(),
  );

  const berbeadoiParok = parosit(
    sorrendben,
    beerkezesek,
    (tetel) => tetel.erkezesDatuma,
    beallitasok,
  );
  const berloiParok = parosit(
    sorrendben,
    berloiIgazolasok,
    (tetel) => tetel.utalasDatuma,
    beallitasok,
  );
  const felhasznaltBerbeadoi = new Set(
    [...berbeadoiParok.values()].map((jelolt) => jelolt.tetel.id),
  );

  for (const eloiras of sorrendben) {
    const berbeadoiJelolt = berbeadoiParok.get(eloiras.id) ?? null;
    const berloiJelolt = berloiParok.get(eloiras.id) ?? null;

    const lejart = napKulonbseg(eloiras.esedekesseg, ma) > 0;
    const tagadas = tagadasok.get(eloiras.id);

    // --- Mindkét fél nyilatkozott
    if (berbeadoiJelolt && berloiJelolt) {
      const egyOldalon = ketOldalEgyezik(berloiJelolt.tetel, berbeadoiJelolt.tetel);
      const elteres = berbeadoiJelolt.osszegElteres;
      const keses = Math.max(0, berbeadoiJelolt.tavolsag);

      if (!egyOldalon) {
        eredmeny.push({
          eloirtTetelId: eloiras.id,
          berloiIgazolasId: berloiJelolt.tetel.id,
          berbeadoiIgazolasId: berbeadoiJelolt.tetel.id,
          allapot: "vitas",
          elteresOka: "ket_oldal_elter",
          elteresFt: berbeadoiJelolt.tetel.osszegFt - berloiJelolt.tetel.osszegFt,
          keses,
          bizonylatKell: beallitasok.bizonylatKeres,
          magyarazat: uzenet("egyeztetes.ket_oldal_elter", {
            berlo: berloiJelolt.tetel.osszegFt,
            berbeado: berbeadoiJelolt.tetel.osszegFt,
          }),
        });
        continue;
      }

      const eloirassalEgyezik = Math.abs(elteres) <= beallitasok.toleranciaFt;
      eredmeny.push({
        eloirtTetelId: eloiras.id,
        berloiIgazolasId: berloiJelolt.tetel.id,
        berbeadoiIgazolasId: berbeadoiJelolt.tetel.id,
        allapot: eloirassalEgyezik ? "egyezik" : "elter",
        elteresOka: eloirassalEgyezik ? null : "osszeg",
        elteresFt: eloirassalEgyezik ? 0 : elteres,
        keses,
        // A felek egyetértenek: nincs mit bizonyítani, akkor sem, ha az összeg
        // nem az előírt. Az már a bérbeadó és a bérlő megbeszélnivalója.
        bizonylatKell: false,
        magyarazat: eloirassalEgyezik
          ? keses > 0
            ? uzenet("egyeztetes.keson", { nap: keses })
            : uzenet("egyeztetes.hataridore")
          : elteres < 0
            ? uzenet("egyeztetes.kevesebb", { osszeg: Math.abs(elteres) })
            : uzenet("egyeztetes.tobb", { osszeg: elteres }),
      });
      continue;
    }

    // --- Csak a bérlő nyilatkozott
    if (berloiJelolt) {
      const keses = Math.max(0, berloiJelolt.tavolsag);
      if (tagadas) {
        // A bérlő szerint elment, a bérbeadó szerint nem jött meg. Ez az a
        // helyzet, amiért a bizonylat létezik.
        eredmeny.push({
          eloirtTetelId: eloiras.id,
          berloiIgazolasId: berloiJelolt.tetel.id,
          berbeadoiIgazolasId: tagadas.id,
          allapot: "vitas",
          elteresOka: "nem_erkezett_meg",
          elteresFt: -eloiras.osszegFt,
          keses,
          bizonylatKell: beallitasok.bizonylatKeres,
          magyarazat: uzenet("egyeztetes.nem_erkezett_meg"),
        });
        continue;
      }
      eredmeny.push({
        eloirtTetelId: eloiras.id,
        berloiIgazolasId: berloiJelolt.tetel.id,
        berbeadoiIgazolasId: null,
        allapot: "varakozik",
        elteresOka: "nincs_berbeadoi_igazolas",
        elteresFt: 0,
        keses,
        bizonylatKell: false,
        magyarazat: uzenet("egyeztetes.nincs_berbeadoi_igazolas"),
      });
      continue;
    }

    // --- Csak a bérbeadó nyilatkozott
    if (berbeadoiJelolt) {
      eredmeny.push({
        eloirtTetelId: eloiras.id,
        berloiIgazolasId: null,
        berbeadoiIgazolasId: berbeadoiJelolt.tetel.id,
        allapot: "varakozik",
        elteresOka: "nincs_berloi_igazolas",
        elteresFt: 0,
        keses: Math.max(0, berbeadoiJelolt.tavolsag),
        bizonylatKell: false,
        magyarazat: uzenet("egyeztetes.nincs_berloi_igazolas"),
      });
      continue;
    }

    // --- Egyik fél sem nyilatkozott
    if (tagadas || lejart) {
      eredmeny.push({
        eloirtTetelId: eloiras.id,
        berloiIgazolasId: null,
        berbeadoiIgazolasId: tagadas?.id ?? null,
        allapot: "hianyzik",
        elteresOka: null,
        elteresFt: -eloiras.osszegFt,
        keses: Math.max(0, napKulonbseg(eloiras.esedekesseg, ma)),
        bizonylatKell: false,
        magyarazat: uzenet("egyeztetes.hianyzik"),
      });
    }
  }

  // Amit a bérbeadó rögzített, de nincs hozzá előírás: lehet túlfizetés,
  // óvadék vagy egészen más utalás — mindenképp a bérbeadó szeme elé való.
  // Ezt nem tippeljük meg helyette.
  for (const igazolas of beerkezesek) {
    if (felhasznaltBerbeadoi.has(igazolas.id)) continue;
    eredmeny.push({
      eloirtTetelId: null,
      berloiIgazolasId: null,
      berbeadoiIgazolasId: igazolas.id,
      allapot: "elter",
      elteresOka: "nincs_eloiras",
      elteresFt: igazolas.osszegFt,
      keses: 0,
      bizonylatKell: false,
      magyarazat: uzenet("egyeztetes.nincs_eloiras"),
    });
  }

  return eredmeny;
}

export type Oldal = "berbeado" | "berlo";

/**
 * Vár-e még ez a tétel az adott félre.
 *
 * Ettől függ, hogy a befizetések lapján teljes kártyát kap-e, vagy a rendezett
 * tételek közé kerül. Egy magánbérbeadónak egy-két év alatt száz fölötti
 * tétele lesz; ha mind egyforma súllyal áll a lapon, telefonon percekig kell
 * görgetni ahhoz az egy sorhoz, amivel tényleg dolga van.
 *
 * A vitás tétel mindkét félre vár: onnantól van értelme a bizonylatnak.
 * Egyébként az a fél van soron, aki még nem nyilatkozott — az "erre nem
 * érkezett pénz" is nyilatkozat, tehát azzal a bérbeadó letudta a magáét.
 *
 * Amit rendezettnek mond, az nem tűnik el, csak összecsukva áll: a lap
 * kiírja, hány ilyen van, és egy kattintással mind látszik.
 */
export function varRank(
  sor: Pick<Egyeztetes, "allapot" | "berloiIgazolasId" | "berbeadoiIgazolasId">,
  oldal: Oldal,
): boolean {
  if (sor.allapot === "vitas") return true;
  return oldal === "berbeado"
    ? sor.berbeadoiIgazolasId === null
    : sor.berloiIgazolasId === null;
}

/**
 * Kettéosztja a tételeket aszerint, hogy kell-e még velük tenni valamit.
 *
 * A soron lévők a legrégebbivel kezdődnek, mert azzal van a legrégebben baj. A
 * rendezettek fordítva, mert ott a legutóbbi hónap az érdekes.
 */
export function csoportositva<T extends Pick<Egyeztetes, "allapot" | "berloiIgazolasId" | "berbeadoiIgazolasId">>(
  sorok: T[],
  oldal: Oldal,
): { soronVan: T[]; rendezett: T[] } {
  const soronVan = sorok.filter((sor) => varRank(sor, oldal));
  const rendezett = sorok.filter((sor) => !varRank(sor, oldal)).reverse();
  return { soronVan, rendezett };
}
