/**
 * Pénz és dátum: az egész alkalmazás egész forintban számol.
 *
 * A formázás maga a `nyelv` modulban van, mert az a nyelvet is ismeri; itt a
 * magyar alak rövidítései állnak, azoknak a helyeknek, ahol nincs nyelv a kézben
 * (szerződés, elszámolás szövege, bérbeadói felület).
 */

import { datumNyelven, forintNyelven, szamNyelven } from "./nyelv";

export function forint(osszegFt: number): string {
  return forintNyelven(osszegFt, "hu");
}

export function datum(ertek: Date): string {
  return datumNyelven(ertek, "hu");
}

/** Ezres tagolású szám magyarul, közönséges szóközzel. */
export function szam(ertek: number, tizedes = 2): string {
  return szamNyelven(ertek, "hu", tizedes);
}

/**
 * Magyar kivonatok összegoszlopa sokféle: "180 000", "180.000,00", "-45 000 Ft",
 * "180000.00". Mindegyikből egész forintot csinálunk.
 */
export function osszegetForintra(nyers: string): number | null {
  const szam = osszegetSzamra(nyers);
  return szam === null ? null : Math.round(szam);
}

/**
 * Ugyanaz az olvasás, kerekítés nélkül.
 *
 * A rezsi egységára fillérben megy (`kedvezmenyesArFiller`), tehát ott a
 * tizedesek nem elhanyagolhatók: a „36,90 Ft/kWh" kerekítve 37 lenne, és egy
 * ezer kilowattórás elszámoláson az már száz forint eltérés — pont az a fajta,
 * amit a bérlő összead és megkérdez.
 */
function osszegetSzamra(nyers: string): number | null {
  const tisztitott = nyers
    .replace(/ /g, " ")
    .replace(/(ft|huf)/gi, "")
    .replace(/\s/g, "")
    .trim();
  if (tisztitott === "") return null;

  const vesszoUtolso = tisztitott.lastIndexOf(",");
  const pontUtolso = tisztitott.lastIndexOf(".");
  let normalizalt = tisztitott;

  if (vesszoUtolso > pontUtolso) {
    // magyar írásmód: a vessző a tizedesjel
    normalizalt = tisztitott.replace(/\./g, "").replace(",", ".");
  } else if (pontUtolso > vesszoUtolso) {
    const tizedesResz = tisztitott.slice(pontUtolso + 1);
    // ezres elválasztó akkor, ha pontosan három számjegy áll utána
    normalizalt =
      tizedesResz.length === 3
        ? tisztitott.replace(/\./g, "")
        : tisztitott.replace(/,/g, "");
  }

  const szam = Number(normalizalt);
  return Number.isFinite(szam) ? szam : null;
}

/**
 * Egységármező az űrlapról, **fillérben**.
 *
 * Ugyanúgy háromfélét ad vissza, mint az `urlapForint`: `null` az üres mező,
 * `NaN` az olvashatatlan, és a szám maga minden másra. Így a domain meg tudja
 * különböztetni a „nem adtam meg"-et az elgépelttől, és egy elrontott ár nem
 * csúszik be csendben nullaként.
 */
export function urlapFiller(nyers: unknown): number | null {
  const szoveg = String(nyers ?? "").trim();
  if (szoveg === "") return null;
  const ertek = osszegetSzamra(szoveg);
  if (ertek === null) return Number.NaN;
  const filler = Math.round(ertek * 100);
  return Math.abs(filler) > LEGNAGYOBB_OSSZEG ? Number.NaN : filler;
}

/** Naptári napok különbsége, időzóna nélkül, a nap elejére vágva. */
export function napKulonbseg(tol: Date, ig: Date): number {
  const egyNap = 24 * 60 * 60 * 1000;
  return Math.round((napEleje(ig).getTime() - napEleje(tol).getTime()) / egyNap);
}

export function napEleje(ertek: Date): Date {
  return new Date(
    Date.UTC(ertek.getUTCFullYear(), ertek.getUTCMonth(), ertek.getUTCDate()),
  );
}

/**
 * Szám kiolvasása szabad szövegből, tizedesekkel együtt.
 *
 * Ezt a mérőóra állása kéri: a helyszínen mértékegységgel írják be
 * („91,058 m³", „2893 kWh", „1.234,5 m3"). A pénznél ugyanez a kérdés
 * másképp dől el, ezért van két olvasó: forintnál a „180.000" mindig
 * száznyolcvanezer, óraállásnál viszont a „12.345" lehet tizenkét egész
 * háromszáznegyvenöt is — ott nem tippelünk.
 *
 * A szabály:
 *  - pont és vessző együtt: az **utolsó** a tizedesjel, a másik ezres;
 *  - csak vessző: tizedesjel;
 *  - csak pont, pontosan három számjeggyel utána: **kétértelmű**, null;
 *  - egyébként a pont tizedesjel.
 *
 * A kétértelmű eset azért null, mert ezerszeres hiba lesz belőle: a
 * jegyzőkönyvi „12.345 kWh" eddig 12,345-ként került a mérőóra történetébe,
 * és az lett az első rezsielszámolás nyitója. Aki nem tudja, ne tippeljen —
 * ugyanaz az elv, mint a be nem sorolható befizetésnél.
 */
export function meroallastOlvas(nyers: string): number | null {
  // Csak a szóközöket vesszük ki, a betűket nem: a „1.234,5 m3" mértékegységében
  // is van számjegy, és ha azt is beolvasnánk, 1234,53 lenne belőle.
  const tisztitott = nyers.replace(/\u00a0/g, " ").replace(/\s/g, "");
  const egyezes = /-?\d[\d.,]*\d|-?\d/.exec(tisztitott);
  if (!egyezes) return null;

  const jel = egyezes[0];
  const vesszo = jel.lastIndexOf(",");
  const pont = jel.lastIndexOf(".");
  let normalizalt: string;

  if (vesszo >= 0 && pont >= 0) {
    normalizalt =
      vesszo > pont
        ? jel.replace(/\./g, "").replace(",", ".")
        : jel.replace(/,/g, "");
  } else if (vesszo >= 0) {
    if (jel.split(",").length > 2) return null;
    normalizalt = jel.replace(",", ".");
  } else if (pont >= 0) {
    if (jel.split(".").length > 2) return null;
    // Pontosan három jegy a pont után: nem tudjuk, ezres-e vagy tizedes.
    if (jel.length - pont - 1 === 3) return null;
    normalizalt = jel;
  } else {
    normalizalt = jel;
  }

  const ertek = Number(normalizalt);
  return Number.isFinite(ertek) ? ertek : null;
}

/**
 * Az `Int` oszlopok felső határa. Ennél nagyobb összeg nem hibaüzenet, hanem
 * 500-as lap lenne: a Postgres az egész számot túlcsorduló értéket eldobja.
 */
export const LEGNAGYOBB_OSSZEG = 2_000_000_000;

/**
 * Összegmező az űrlapról, egész forintban.
 *
 * Három visszatérése van, és mindháromra szükség van: `null` az üres mező
 * („nem adtam meg" nem ugyanaz, mint „nulla forint"), `NaN` az, amit nem
 * tudunk számként olvasni, és a szám maga minden másra. Ha a hibás bemenet is
 * `null` lenne, a domain nem tudná megkülönböztetni a hiányzótól, és egy
 * elgépelt összeg csendben kimaradna.
 *
 * **Minden összegmező ezen megy át.** Korábban öt űrlap ötféleképp olvasott:
 * a befizetésnél a „1000.50" 100 050 forint lett, az előfizetésnél a „4.990"
 * négy forint, a bérleti díjnál a „180.000" száznyolcvan — utóbbiból kilenc
 * hónapnyi 180 forintos előírás született, figyelmeztetés nélkül, és utólag
 * javíthatatlanul, mert meglévő előírást nem írunk át.
 */
export function urlapForint(nyers: unknown): number | null {
  const szoveg = String(nyers ?? "").trim();
  if (szoveg === "") return null;
  const ertek = osszegetForintra(szoveg);
  if (ertek === null || Math.abs(ertek) > LEGNAGYOBB_OSSZEG) return Number.NaN;
  return ertek;
}
