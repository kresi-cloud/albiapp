/**
 * Beszélgetés a bérbeadó és a bérlő között.
 *
 * Eddig csak akkor tudtak írni egymásnak, ha volt mihez kötni: hibabejelentés,
 * elszámolás, jegyzőkönyv. A hétköznapi ügy viszont nem illik egyikbe sem —
 * mikor jön a kéményseprő, elviheti-e a szekrényt, jövő héten későbbre csúszik
 * az utalás —, és ez eddig SMS-ben és e-mailben ment, vagyis ott, ahol később
 * senki nem találja meg.
 *
 * Két dolgot köt ki ez a modul, és mindkettő termékdöntés.
 *
 * **A beszélgetés az első üzenettel jön létre**, nem előbb. Üres beszélgetést
 * nem nyitunk: egy lista, amiben három üres szál áll „még nincs üzenet”
 * felirattal, csak zajt csinál, és a bérlő azt hiszi, elveszett, amit írt.
 * Gyakorlatilag ezért nincs „beszélgetés indítása” gomb sem a küldés nélkül:
 * a címzettet és az első mondatot egyszerre adja meg, aki írni akar.
 *
 * **A beszélgetés a jogviszonyhoz tartozik**, nem két felhasználóhoz. Egy
 * bérbeadónak több bérleménye lehet ugyanazzal a bérlővel, és a két lakás ügye
 * nem folyhat egy szálba. Ebből jön a jogosultság is: aki a jogviszonyban benne
 * van, az írhat, más nem — ezt a kiszolgáló ellenőrzi, nem az űrlap.
 */

import { napEleje, napKulonbseg } from "./penz";
import { uzenet, type Uzenet } from "./nyelv";

/**
 * Meddig marad nyitva a beszélgetés a kiköltözés után.
 *
 * A tulajdonos kérése. Az ok gyakorlati: az óvadék elszámolása, az utolsó
 * rezsiszámla és a hátrahagyott holmi mind a kiköltözés utáni hetekben derül
 * ki, és pont ilyenkor van a legnagyobb szükség arra, hogy legyen hol
 * megbeszélni. Ami ezen túl jön, az már nem a bérlet ügye.
 */
export const ARCHIVALAS_NAP = 90;

export type BeszelgetesFajta = "ketiranyu" | "csoportos";

/** A beszélgetés egy résztvevője: fiókkal rendelkező bérlő vagy a bérbeadó. */
export type Resztvevo = {
  felhasznaloId: string;
  nev: string;
  szerep: "berbeado" | "berlo";
};

export type Uzenetsor = {
  id: string;
  szerzoId: string;
  szerzoNev: string;
  szoveg: string;
  kuldve: Date;
};

/**
 * Kétirányú vagy csoportos: a résztvevők számából következik, nem külön mezőből.
 *
 * Tárolni azért nem tároljuk, mert akkor el tudna csúszni attól, ami tényleg
 * igaz — és a felületnek pont az számít, hányan olvassák, amit ír.
 */
export function fajtaja(resztvevok: readonly Resztvevo[]): BeszelgetesFajta {
  return resztvevok.length > 2 ? "csoportos" : "ketiranyu";
}

export function fajtaNeve(fajta: BeszelgetesFajta): Uzenet {
  return uzenet(`beszelgetes.fajta.${fajta}`);
}

/**
 * Archivált-e a beszélgetés.
 *
 * Származtatott, nem tárolt állapot: a lezárás visszavonása így magától
 * visszanyitja a beszélgetést. Ha ütemezett feladat írná át egy mezőben, egy
 * elkattintott lezárás csendben lezárná a szálat, és a visszavonás nem hozná
 * vissza — ugyanaz a hiba, amit az előírásoknál már egyszer megkerültünk.
 */
export function archivalt(
  jogviszonyVege: Date | null,
  most: Date,
): boolean {
  if (!jogviszonyVege) return false;
  return napKulonbseg(jogviszonyVege, most) > ARCHIVALAS_NAP;
}

/** Hány nap van még hátra a nyitva tartásból. Nulla vagy kevesebb: lejárt. */
export function hatralevoNap(jogviszonyVege: Date | null, most: Date): number {
  if (!jogviszonyVege) return ARCHIVALAS_NAP;
  return ARCHIVALAS_NAP - napKulonbseg(jogviszonyVege, most);
}

/**
 * Mikor archiválódik. A felület ezt kiírja, amíg a jogviszony lezárt, de a
 * beszélgetés még él: a bérlő tudja meg előre, meddig van hol kérdeznie, és ne
 * akkor szembesüljön vele, amikor már nem tud írni.
 */
export function archivalasNapja(jogviszonyVege: Date): Date {
  const nap = napEleje(jogviszonyVege);
  return new Date(nap.getTime() + ARCHIVALAS_NAP * 24 * 60 * 60 * 1000);
}

/**
 * Mit mondunk a beszélgetés tetején a nyitva tartásról.
 *
 * Élő jogviszonynál semmit: nincs mit magyarázni. Lezárás után viszont igen,
 * mert onnantól fogy az idő, és ezt csak akkor tudja a felhasználó, ha
 * megmondjuk.
 */
export function nyitvatartasSzovege(
  jogviszonyVege: Date | null,
  most: Date,
): Uzenet | null {
  if (!jogviszonyVege) return null;
  if (archivalt(jogviszonyVege, most)) {
    return uzenet("beszelgetes.archivalt_sugo", { nap: ARCHIVALAS_NAP });
  }
  return uzenet("beszelgetes.lezarult_sugo", {
    nap: hatralevoNap(jogviszonyVege, most),
    datum: archivalasNapja(jogviszonyVege),
  });
}

/**
 * Amit nem küldünk el. Kód, nem kész mondat: a szöveg a szótárban él, és a
 * hívó nem a kulcs végéből következtet arra, mi történt.
 */
export type Kifogas = "ures" | "hosszu";

/** Legfeljebb ennyi karakter egy üzenet. */
export const MAX_HOSSZ = 4000;

export function kifogasSzovege(kifogas: Kifogas): Uzenet {
  return kifogas === "hosszu"
    ? uzenet("beszelgetes.hiba.hosszu", { max: MAX_HOSSZ })
    : uzenet("beszelgetes.hiba.ures");
}

/**
 * Az elküldeni kívánt üzenet ellenőrzése.
 *
 * Üres üzenetet nem küldünk: az a másik félnek értesítés tartalom nélkül. A
 * felső korlát nem esztétika, hanem az, hogy egy beillesztett szerződésmásolat
 * ne tegye olvashatatlanná a szálat — arra ott a dokumentumtár.
 */
export function uzenetetEllenoriz(szoveg: string): Kifogas | null {
  const tisztitott = szoveg.trim();
  if (!tisztitott) return "ures";
  if (tisztitott.length > MAX_HOSSZ) return "hosszu";
  return null;
}

/**
 * Kikkel indítható beszélgetés: a jogviszony többi tagja, akinek már van fiókja.
 *
 * Akit a bérbeadó felvitt, de még nem lépett be, annak nincs hová írni. Ezt a
 * felület ki is mondja, mert különben úgy tűnne, hogy a bérlő eltűnt a
 * listából.
 */
export function megszolithatok(
  resztvevok: readonly Resztvevo[],
  sajatId: string,
): Resztvevo[] {
  return resztvevok.filter((resztvevo) => resztvevo.felhasznaloId !== sajatId);
}

/**
 * Ugyanaz a társaság-e. Ezen múlik, hogy folytatunk egy meglévő szálat, vagy
 * újat nyitunk: ha valaki ugyanannak a két embernek ír másodszor, az ugyanaz a
 * beszélgetés, nem egy második, együzenetes szál.
 */
export function ugyanazATarsasag(
  egyik: readonly string[],
  masik: readonly string[],
): boolean {
  if (egyik.length !== masik.length) return false;
  const rendezett = [...masik].sort();
  return [...egyik].sort().every((id, i) => id === rendezett[i]);
}

/**
 * A beszélgetés neve a listában: a többi résztvevő neve.
 *
 * Saját magunkat nem írjuk ki — a bérlő nem a saját nevét keresi a listában —,
 * és nem adunk a beszélgetésnek külön címet sem: egy magánbérbeadónak két-három
 * szála lesz, azokat a nevükről ismeri fel.
 */
export function beszelgetesNeve(
  resztvevok: readonly Resztvevo[],
  sajatId: string,
): string {
  return megszolithatok(resztvevok, sajatId)
    .map((resztvevo) => resztvevo.nev)
    .join(", ");
}

/**
 * Az utolsó üzenet előnézete a listához, egy sorba vágva.
 *
 * A sortörés azért megy ki, mert a lista egysoros: a nyers szöveg különben
 * szétdobná a sort, és a lista magassága az üzenetek tartalmától függene.
 */
export function elonezet(szoveg: string, hossz = 80): string {
  const egysoros = szoveg.replace(/\s+/g, " ").trim();
  return egysoros.length <= hossz ? egysoros : `${egysoros.slice(0, hossz - 1)}…`;
}
