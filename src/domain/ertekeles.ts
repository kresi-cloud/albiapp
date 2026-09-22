/**
 * Kölcsönös, a másik fél elől rejtett értékelés a jogviszony végén.
 *
 * Ez a bérlőszűrés legális megfelelője. Magyarországon magánszemély
 * bérbeadóként nincs jogszerű módja annak, hogy a leendő bérlőről előzményt
 * kérjünk le: nincs bérlői feketelista, és nem is lehetne. Ami marad, az a két
 * félnek az egymásról tett saját állítása — tehát nem mérés, hanem vélemény, és
 * a felület is ezt mondja ki.
 *
 * Két dolog dönti el, hogy ez ér-e valamit.
 *
 * **Mikor.** Csak a jogviszony lezárása után. Amíg a bérlet fut, a bérlő
 * értékelése nem szabad: az óvadék még a bérbeadónál van, a következő
 * hibabejelentés még előtte. Aki függ a másiktól, az nem a véleményét írja le.
 *
 * **Vakon.** Amíg mindkét fél meg nem írta a sajátját, egyik sem látja a
 * másikét. Enélkül a második értékelés az elsőre adott válasz lenne, nem a
 * bérletről szólna. Ezért nem is felület kérdése: a kiszolgáló nem adja ki a
 * másik szövegét, amíg nincs felfedve.
 *
 * A felfedés két úton jön: mindkét fél megírta, vagy letelt az ablak. Az ablak
 * nélkül egy hallgató fél örökre eltüntethetné a róla szóló értékelést — elég
 * lenne nem írnia semmit. Felfedés után már senki nem ír és nem módosít: amit a
 * másik fél elolvasott, azt nem írjuk át utólag.
 */

import { uzenet, type Uzenet } from "./nyelv";
import { napKulonbseg } from "./penz";

/**
 * Hány napig lehet értékelni a jogviszony vége után.
 *
 * Harminc nap: az óvadék elszámolása, az utolsó rezsiszámla és a hátrahagyott
 * holmi mind a kiköltözés utáni hetekben derül ki, és ezek nélkül a bérlet
 * felét nem lehetne értékelni. Hosszabb ablaknak viszont nincs értelme: fél év
 * múlva már senki nem emlékszik rá, mikor jött a szerelő.
 */
export const ABLAK_NAP = 30;

/** Melyik félről szól az értékelés. Ebből következik, milyen szempontjai vannak. */
export type Irany = "berlorol" | "berbeadorol";

/**
 * A szempontok kódban vannak, nem az adatbázisban — ugyanazért, amiért a
 * szerződésmodulok: ha egyszer változik a lista, minden értékelésre hatnia
 * kell, és egy régi értékelés szempontjai nem tűnhetnek el a semmibe.
 */
export const SZEMPONTOK: Record<Irany, readonly string[]> = {
  berlorol: ["fizetes", "allapot", "kommunikacio"],
  berbeadorol: ["hibakezeles", "elerhetoseg", "elszamolas"],
};

/** A pontszám értelmezési tartománya. Az iskolai osztályzat, mert azt mindenki ismeri. */
export const LEGKISEBB_PONT = 1;
export const LEGNAGYOBB_PONT = 5;

export type Pont = { szempont: string; pont: number };

export type ErtekelesAdat = {
  szerzoId: string;
  alanyId: string;
  irany: Irany;
  szoveg: string;
  pontok: Pont[];
  letrehozva: Date;
};

/**
 * Egy páros: két fél, akik egymást értékelik ugyanazon a jogviszonyon.
 * `sajat` a belépett felhasználóé, `masike` a másik félé.
 */
export type Paros = {
  sajat: ErtekelesAdat | null;
  masike: ErtekelesAdat | null;
};

/**
 * Egy páros összeállítása abból, ami a jogviszonyon áll.
 *
 * Mindkét irányban **két** dolog azonosít egy értékelést: ki írta, és kiről.
 * A szerző egymagában nem elég, és ez nem elméleti: két fiókos lakótársnál a
 * bérbeadó ugyanazon a jogviszonyon két értékelést ír, egyet-egyet a két
 * bérlőről. Csak a szerzőre szűrve az egyik lakótárs lapjára a másikról szóló
 * értékelés került, és a saját űrlapja is lezárult, mert a páros késznek
 * látszott.
 */
export function parosaEnnek(
  sorok: ErtekelesAdat[],
  sajatId: string,
  masikId: string | null,
): Paros {
  // Fiók nélküli bérlőnél nincs kit értékelni, és nincs ki értékeljen.
  if (masikId === null) return { sajat: null, masike: null };

  const egyike = (szerzoId: string, alanyId: string) =>
    sorok.find((sor) => sor.szerzoId === szerzoId && sor.alanyId === alanyId) ??
    null;

  return {
    sajat: egyike(sajatId, masikId),
    masike: egyike(masikId, sajatId),
  };
}

export type Allapot =
  /** A jogviszony még él: értékelni nincs mit. */
  | "nem_ideje"
  /** Nyitva az ablak, és a belépett fél még nem írta meg a sajátját. */
  | "irhato"
  /** A belépett fél megírta, a másik még nem, és az ablak még nyitva van. */
  | "varakozik"
  /** Felfedve: mindkettő látszik, ami megvan belőlük. */
  | "lathato"
  /** Letelt az ablak, és egyik fél sem írt semmit. */
  | "elmaradt";

/** A jogviszony vége utáni hányadik napon járunk. Vég nélkül negatív. */
function eltelt(vege: Date | null, ma: Date): number {
  if (vege === null) return -1;
  return napKulonbseg(vege, ma);
}

/** Nyitva van-e még az ablak. A vége napja még beleszámít. */
export function ablakNyitva(vege: Date | null, ma: Date): boolean {
  const nap = eltelt(vege, ma);
  return nap >= 0 && nap <= ABLAK_NAP;
}

/**
 * Felfedve van-e a páros.
 *
 * Mindkettő megvan, vagy letelt az ablak. Az „ablak letelt" ág a hallgatás
 * ellen van: enélkül aki nem ír, az a róla szólót is eltünteti.
 */
export function felfedve(paros: Paros, vege: Date | null, ma: Date): boolean {
  if (paros.sajat !== null && paros.masike !== null) return true;
  return vege !== null && eltelt(vege, ma) > ABLAK_NAP;
}

export function allapota(paros: Paros, vege: Date | null, ma: Date): Allapot {
  if (vege === null || eltelt(vege, ma) < 0) return "nem_ideje";
  if (felfedve(paros, vege, ma)) {
    return paros.sajat === null && paros.masike === null
      ? "elmaradt"
      : "lathato";
  }
  return paros.sajat === null ? "irhato" : "varakozik";
}

/**
 * Amit a belépett fél megkap. A másik értékelése felfedésig **nincs benne** —
 * nem elrejtve, hanem meg sem kapja.
 */
export function nezet(
  paros: Paros,
  vege: Date | null,
  ma: Date,
): {
  allapot: Allapot;
  sajat: ErtekelesAdat | null;
  masike: ErtekelesAdat | null;
} {
  const allapot = allapota(paros, vege, ma);
  return {
    allapot,
    sajat: paros.sajat,
    masike: allapot === "lathato" ? paros.masike : null,
  };
}

/** Írható vagy módosítható-e még a saját értékelés. Felfedés után soha. */
export function irhato(paros: Paros, vege: Date | null, ma: Date): boolean {
  return ablakNyitva(vege, ma) && !felfedve(paros, vege, ma);
}

export type Kifogas =
  | "nincs_szoveg"
  | "hianyzo_szempont"
  | "tartomanyon_kivul"
  | "ismeretlen_szempont"
  | "nem_ideje"
  | "mar_felfedve";

export function kifogasSzovege(kifogas: Kifogas): Uzenet {
  return uzenet(`ertekeles.kifogas.${kifogas}`);
}

export type Bevitel = { irany: Irany; szoveg: string; pontok: Pont[] };

/**
 * Amit nem mentünk el.
 *
 * Pontszám magyarázat nélkül nincs: a másik fél abból nem tud kiindulni, és a
 * bérlet folytatásában sem segít. Ugyanaz az elv, mint a fénykép és az
 * előfizetés kifogásánál.
 */
export function ellenoriz(bevitel: Bevitel): Kifogas[] {
  const kifogasok: Kifogas[] = [];
  if (bevitel.szoveg.trim().length === 0) kifogasok.push("nincs_szoveg");

  const vartak = SZEMPONTOK[bevitel.irany];
  const megvan = new Map(bevitel.pontok.map((sor) => [sor.szempont, sor.pont]));

  if (bevitel.pontok.some((sor) => !vartak.includes(sor.szempont))) {
    kifogasok.push("ismeretlen_szempont");
  }
  if (vartak.some((szempont) => !megvan.has(szempont))) {
    kifogasok.push("hianyzo_szempont");
  }
  if (
    bevitel.pontok.some(
      (sor) =>
        !Number.isInteger(sor.pont) ||
        sor.pont < LEGKISEBB_PONT ||
        sor.pont > LEGNAGYOBB_PONT,
    )
  ) {
    kifogasok.push("tartomanyon_kivul");
  }
  return kifogasok;
}

/**
 * Az értékelés szempontonként áll, és nem vonjuk össze egyetlen számmá.
 *
 * Egy átlag azt sugallná, hogy a három szempont egyenértékű, és hogy a
 * különbségük elsimítható. Nem az: aki pontosan fizetett, de a lakást
 * tönkretette, nem „közepes" — két külön dolgot csinált. Aki a számot akarja,
 * összeadja; mi nem adjuk oda mérésnek látszó alakban.
 */
export function pontja(
  ertekeles: ErtekelesAdat,
  szempont: string,
): number | null {
  return (
    ertekeles.pontok.find((sor) => sor.szempont === szempont)?.pont ?? null
  );
}

/** Az értékelés címkéje és magyarázata a szótárból, irány szerint. */
export function szempontNeve(irany: Irany, szempont: string): Uzenet {
  return uzenet(`ertekeles.szempont.${irany}.${szempont}`);
}

export function allapotMondata(allapot: Allapot): Uzenet {
  return uzenet(`ertekeles.allapot.${allapot}`);
}

/**
 * A jelző rövid felirata. Külön a mondattól, mert a jelző pirula alakú, nem
 * törik és nem zsugorodik — egy egész mondat benne 360 képponton kilógatja a
 * kártyát. A magyarázat a kártya szövegében áll, ahol sorba tud törni.
 */
export function allapotJelzoje(allapot: Allapot): Uzenet {
  return uzenet(`ertekeles.jelzo.${allapot}`);
}

/** Hány nap van még hátra az ablakból. Lezáratlan jogviszonynál null. */
export function hatralevoNap(vege: Date | null, ma: Date): number | null {
  if (vege === null) return null;
  const nap = eltelt(vege, ma);
  if (nap < 0 || nap > ABLAK_NAP) return null;
  return ABLAK_NAP - nap;
}

export type TeendoAdat = {
  jogviszonyId: string;
  /** A másik fél azonosítója. Két lakótársnál két külön értékelés jár. */
  masikFelId: string;
  cimke: string;
  vege: Date | null;
  paros: Paros;
};

/**
 * Teendő, amíg a saját értékelés hiányzik és az ablak nyitva van.
 *
 * Származtatott: eltűnik, amint megírták vagy letelt az ablak. Az esedékesség
 * az ablak utolsó napja, mert addig lehet írni — nem a lezárás napja, hiszen
 * a kiköltözés napján még nem tudni, mi lesz az óvadékkal.
 */
export function ertekelesTeendoi(
  adatok: TeendoAdat[],
  cimzett: "berbeado" | "berlo",
  ma: Date,
): {
  kulcs: string;
  cimzett: "berbeado" | "berlo";
  tipus: string;
  cim: Uzenet;
  leiras: Uzenet;
  esedekesseg: Date;
  hivatkozas: string;
}[] {
  return adatok
    .filter((adat) => adat.vege !== null && irhato(adat.paros, adat.vege, ma))
    .filter((adat) => adat.paros.sajat === null)
    .map((adat) => ({
      // A kulcsban a másik fél is benne van: két lakótárs értékelése két
      // külön teendő, és egyik nem üthetné ki a másikat.
      kulcs: `ertekeles:${adat.jogviszonyId}:${adat.masikFelId}`,
      cimzett,
      tipus: "ertekeles",
      cim: uzenet("teendo.ertekeles.cim", { cimke: adat.cimke }),
      leiras: uzenet("teendo.ertekeles.leiras", {
        nap: hatralevoNap(adat.vege, ma) ?? 0,
      }),
      esedekesseg: new Date(
        (adat.vege as Date).getTime() + ABLAK_NAP * 86400000,
      ),
      hivatkozas: "/ertekelesek",
    }));
}
