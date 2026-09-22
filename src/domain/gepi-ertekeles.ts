/**
 * A rendszer saját értékelése a felhasználóról, az üzemeltetőnek.
 *
 * Ez **nem** a kölcsönös értékelés párja, és szándékosan más a természete. A
 * kölcsönös értékelés vélemény: a másik fél állítása, amit nem mérünk és nem
 * is vonunk össze. Ez itt mérés: abból számol, amit az alkalmazás maga
 * rögzített — mikor érkezett a pénz, mennyi idő alatt jött válasz, és hány
 * kétoldali kérdésre nyilatkozott egyáltalán az illető.
 *
 * Három dolog tartja ezt a helyén.
 *
 * **Csak a rendszergazda látja.** A felhasználó sem magáról, sem a másik
 * félről nem látja. Egy gépi pontszám, amit a másik fél is lát, észrevétlenül
 * bérlőszűrő listává válna, és pont az lenne belőle, amit a termék kerül.
 *
 * **Számot magyarázat nélkül nem adunk.** Minden szemponthoz ott a minta
 * mérete és az egy mondatos indoklás, ugyanúgy, mint a rezsielszámolás
 * tételeinél. A hármat nem vonjuk össze egyetlen számmá: aki pontosan fizet,
 * de három hétig nem válaszol, nem „közepes".
 *
 * **Amiből nincs elég adat, arra nem tippelünk.** A pont ilyenkor `null`, nem
 * nulla és nem hármas: egy frissen belépett bérlőről a rendszer még semmit nem
 * tud, és ezt ki is mondja. Ugyanaz az elv, mint a be nem sorolható
 * befizetésnél.
 *
 * Tárolva nincs: minden lekérdezéskor újraszámoljuk, tehát magától követi, ha
 * a felhasználó viselkedése megváltozik.
 */

import { uzenet, type Uzenet } from "./nyelv";

export const GEPI_SZEMPONTOK = [
  "pontossag",
  "valaszido",
  "egyuttmukodes",
] as const;
export type GepiSzempont = (typeof GEPI_SZEMPONTOK)[number];

/** A skála ugyanaz, mint az emberi értékelésé, hogy a kettő egymás mellett olvasható legyen. */
export const LEGKISEBB_PONT = 1;
export const LEGNAGYOBB_PONT = 5;

/**
 * Ennyi megfigyelés alatt nem adunk pontot.
 *
 * Háromnál kevesebből az arány önmagát magyarázza: egyetlen elmaradt válasz
 * egyes lenne, egyetlen rendben lezárt hónap ötös. Egyik sem mond semmit.
 */
export const LEGKISEBB_MINTA = 3;

/**
 * Amit a rendszer megfigyelt. Nyers számok, döntés nélkül: a döntés itt, a
 * domainben történik, hogy a tesztek ne az adatbázison keresztül érjék el.
 */
export type Megfigyeles = {
  /** Lezárt előírások: amikre már mindkét oldalnak volt módja nyilatkozni. */
  eldontott: number;
  /** Ebből ahány pontosan az előírt összeg volt, mindkét fél szerint. */
  rendben: number;
  /** Ahány vitás maradt: a két oldal adata nem fedi egymást. */
  vitas: number;
  /** Ahány esedékesség letelt úgy, hogy egyik oldalon sem lett belőle semmi. */
  hianyzo: number;
  /** Késések napokban, előírásonként. A pontos teljesítés nulla nap. */
  kesesNapok: number[];
  /** Válaszidők órában: a másik fél megkeresése és az erre adott válasz között. */
  valaszOrak: number[];
  /** Hány kétoldali kérdés várt a nyilatkozatára összesen. */
  ranyitott: number;
  /** Ebből ahányra nyilatkozott is, akár igennel, akár nemmel. */
  megvalaszolt: number;
};

export const URES_MEGFIGYELES: Megfigyeles = {
  eldontott: 0,
  rendben: 0,
  vitas: 0,
  hianyzo: 0,
  kesesNapok: [],
  valaszOrak: [],
  ranyitott: 0,
  megvalaszolt: 0,
};

export type GepiPont = {
  szempont: GepiSzempont;
  /** null, ha nincs elég megfigyelés. Nem nulla: a „nem tudjuk" nem rossz jegy. */
  pont: number | null;
  /** Hány megfigyelésből jött. A pont mellett mindig kiírjuk. */
  minta: number;
  /** Egy mondat arról, mi áll a szám mögött. Szám magyarázat nélkül nem megy ki. */
  reszletezes: Uzenet;
};

/** A medián, mert egyetlen nyaralás alatt kapott válasz nem húzhatja el az átlagot. */
export function median(ertekek: number[]): number {
  if (ertekek.length === 0) return 0;
  const rendezett = [...ertekek].sort((a, b) => a - b);
  const kozep = Math.floor(rendezett.length / 2);
  return rendezett.length % 2 === 1
    ? rendezett[kozep]
    : (rendezett[kozep - 1] + rendezett[kozep]) / 2;
}

/** Arányból pont: 0 → 1, 1 → 5, közte egyenletesen, egész jegyre kerekítve. */
function aranybolPont(arany: number): number {
  const hatarolt = Math.min(1, Math.max(0, arany));
  return Math.round(
    LEGKISEBB_PONT + hatarolt * (LEGNAGYOBB_PONT - LEGKISEBB_PONT),
  );
}

/**
 * Válaszidő sávjai. A határok az alkalmazás alapértelmezései, nem
 * jogszabályiak — magánszemélyek bérletére nincs ilyen —, és a felület ezt ki
 * is mondja, ugyanúgy, ahogy a hibabejelentés válaszhatáridejénél.
 */
const VALASZ_SAVOK: { ora: number; pont: number }[] = [
  { ora: 6, pont: 5 },
  { ora: 24, pont: 4 },
  { ora: 72, pont: 3 },
  { ora: 168, pont: 2 },
];

function valaszidoPontja(oraMedian: number): number {
  for (const sav of VALASZ_SAVOK) {
    if (oraMedian <= sav.ora) return sav.pont;
  }
  return LEGKISEBB_PONT;
}

function pontossag(megfigyeles: Megfigyeles): GepiPont {
  const minta = megfigyeles.eldontott;
  if (minta < LEGKISEBB_MINTA) {
    return {
      szempont: "pontossag",
      pont: null,
      minta,
      reszletezes: uzenet("gepi.nincs_eleg", { minta, kell: LEGKISEBB_MINTA }),
    };
  }

  const kesesMedian = median(megfigyeles.kesesNapok);
  // Két dolog rontja: ami nem lett rendben, és ami késett. A késés fél pontot
  // ér hetenként, hogy a három nappal csúszó utalás ne essen egy súllyal a
  // meg nem érkezettel.
  const aranyRendben = megfigyeles.rendben / minta;
  const kesesLevonas = Math.min(2, (kesesMedian / 7) * 0.5);
  const pont = Math.max(
    LEGKISEBB_PONT,
    Math.round(aranybolPont(aranyRendben) - kesesLevonas),
  );

  return {
    szempont: "pontossag",
    pont,
    minta,
    reszletezes: uzenet("gepi.pontossag", {
      rendben: megfigyeles.rendben,
      minta,
      vitas: megfigyeles.vitas,
      hianyzo: megfigyeles.hianyzo,
      keses: kesesMedian,
    }),
  };
}

function valaszido(megfigyeles: Megfigyeles): GepiPont {
  const minta = megfigyeles.valaszOrak.length;
  if (minta < LEGKISEBB_MINTA) {
    return {
      szempont: "valaszido",
      pont: null,
      minta,
      reszletezes: uzenet("gepi.nincs_eleg", { minta, kell: LEGKISEBB_MINTA }),
    };
  }

  const oraMedian = median(megfigyeles.valaszOrak);
  return {
    szempont: "valaszido",
    pont: valaszidoPontja(oraMedian),
    minta,
    reszletezes: uzenet("gepi.valaszido", {
      ora: Math.round(oraMedian),
      minta,
    }),
  };
}

function egyuttmukodes(megfigyeles: Megfigyeles): GepiPont {
  const minta = megfigyeles.ranyitott;
  if (minta < LEGKISEBB_MINTA) {
    return {
      szempont: "egyuttmukodes",
      pont: null,
      minta,
      reszletezes: uzenet("gepi.nincs_eleg", { minta, kell: LEGKISEBB_MINTA }),
    };
  }

  // A kiszámíthatóság az, hogy a kétoldali kérdésekre egyáltalán nyilatkozik-e.
  // A vitás tétel nem rontja: vitatkozni szabad, és a vita nem együttműködési
  // hiba — az, ha valaki nem is válaszol.
  const pont = aranybolPont(megfigyeles.megvalaszolt / minta);
  return {
    szempont: "egyuttmukodes",
    pont,
    minta,
    reszletezes: uzenet("gepi.egyuttmukodes", {
      megvalaszolt: megfigyeles.megvalaszolt,
      minta,
    }),
  };
}

/**
 * A három szempont, mindig mind a három, ebben a sorrendben.
 *
 * Aminek nincs elég mintája, az is sorban marad `null` ponttal: a hiányzó sor
 * azt sugallná, hogy a szempont nem is létezik, és az üzemeltető nem látná,
 * mit nem tud a rendszer.
 */
export function gepiErtekeles(megfigyeles: Megfigyeles): GepiPont[] {
  return [
    pontossag(megfigyeles),
    valaszido(megfigyeles),
    egyuttmukodes(megfigyeles),
  ];
}

/** Van-e egyáltalán bármi, amiből a rendszer pontot adott. */
export function vanGepiPont(pontok: GepiPont[]): boolean {
  return pontok.some((sor) => sor.pont !== null);
}

export function gepiSzempontNeve(szempont: GepiSzempont): Uzenet {
  return uzenet(`gepi.szempont.${szempont}`);
}
