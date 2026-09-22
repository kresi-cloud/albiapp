/**
 * Bérlemény és jogviszony felvitelének szabályai.
 *
 * Eddig az alkalmazás csak példaadaton élt: ingatlant és jogviszonyt kizárólag
 * a seed hozott létre. Aki élesben elkezdené használni, az első képernyőn
 * elakadt. Ez a modul mondja meg, mi fogadható el, és mire érdemes szólni.
 *
 * A kifogás és a figyelmeztetés nem ugyanaz, és ez termékdöntés. Kifogás az,
 * ami nélkül az adat értelmetlen vagy később hibát okoz — azt nem mentjük el.
 * Figyelmeztetés az, ami hiányos, de a bérbeadó tudhatja jobban: azt elmentjük,
 * és megmondjuk, mi lesz a következménye. Egy magánbérbeadó nem fogja
 * kitölteni a helyrajzi számot az első percben, és ettől még el kell tudnia
 * indulni.
 */

import { uzenet, type Uzenet } from "./nyelv";
import { telepules } from "./betekinto";

/** Amire a mező-szintű hibajelzés hivatkozik; a felület ezt emeli ki. */
export type Kifogas = { mezo: string; uzenet: Uzenet };

export type IngatlanBemenet = {
  megnevezes: string;
  cim: string;
  alapteruletM2: number | null;
  helyrajziSzam: string | null;
  energetikaiAzonosito: string | null;
  kozosKoltsegFt: number | null;
  beszerzesiArFt: number | null;
  beszerzesDatuma: Date | null;
};

/**
 * A hónap hányadikáig lehet az esedékesség.
 *
 * Huszonnyolc, mert februárban nincs huszonkilencedike minden évben, és egy
 * "minden hónap 31-én" beállításból csendben csúszna a fele.
 */
export const FIZETESI_NAP_MAX = 28;

export const REZSI_MODOK = ["almero", "atalany", "kozos_koltsegben"] as const;
export type RezsiMod = (typeof REZSI_MODOK)[number];

export type JogviszonyBemenet = {
  kezdete: Date | null;
  berletiDijFt: number | null;
  kozosKoltsegFt: number | null;
  kaucioFt: number | null;
  fizetesiNap: number | null;
  rezsiElszamolas: string;
  rezsiAtalanyFt: number | null;
  berloNeve: string;
};

function ures(ertek: string | null): boolean {
  return (ertek ?? "").trim() === "";
}

export function ingatlantEllenoriz(bemenet: IngatlanBemenet): Kifogas[] {
  const kifogasok: Kifogas[] = [];

  if (ures(bemenet.megnevezes)) {
    kifogasok.push({ mezo: "megnevezes", uzenet: uzenet("berlemeny.hiba.megnevezes") });
  }
  if (ures(bemenet.cim)) {
    kifogasok.push({ mezo: "cim", uzenet: uzenet("berlemeny.hiba.cim") });
  }
  if (bemenet.alapteruletM2 !== null && bemenet.alapteruletM2 <= 0) {
    kifogasok.push({ mezo: "alapteruletM2", uzenet: uzenet("berlemeny.hiba.alapterulet") });
  }
  if (bemenet.kozosKoltsegFt !== null && bemenet.kozosKoltsegFt < 0) {
    kifogasok.push({ mezo: "kozosKoltsegFt", uzenet: uzenet("berlemeny.hiba.negativ") });
  }
  if (bemenet.beszerzesiArFt !== null && bemenet.beszerzesiArFt < 0) {
    kifogasok.push({ mezo: "beszerzesiArFt", uzenet: uzenet("berlemeny.hiba.negativ") });
  }

  return kifogasok;
}

/**
 * Amit elmentünk, de szólunk róla. Mindegyik mondat megmondja, mi az a konkrét
 * dolog, ami enélkül nem fog menni — nem "hiányos az adatlap" általánosságban.
 */
export function ingatlanFigyelmeztetesei(bemenet: IngatlanBemenet): Uzenet[] {
  const sorok: Uzenet[] = [];

  // A betekintő a címből olvassa ki a települést, a szerződés pedig a teljes
  // címet idézi. Ha a cím nem a szokásos magyar alakban van, a betekintőn nem
  // fog látszani, hol van a bérlemény.
  if (!ures(bemenet.cim) && telepules(bemenet.cim) === null) {
    sorok.push(uzenet("berlemeny.figyelem.cim_alak"));
  }
  if (ures(bemenet.helyrajziSzam)) {
    sorok.push(uzenet("berlemeny.figyelem.helyrajzi"));
  }
  if (ures(bemenet.energetikaiAzonosito)) {
    sorok.push(uzenet("berlemeny.figyelem.energetikai"));
  }
  // Az értékcsökkenéshez mindkettő kell; egyik önmagában semmire nem jó.
  if (bemenet.beszerzesiArFt === null || bemenet.beszerzesDatuma === null) {
    sorok.push(uzenet("berlemeny.figyelem.beszerzes"));
  }

  return sorok;
}

export function jogviszonytEllenoriz(bemenet: JogviszonyBemenet): Kifogas[] {
  const kifogasok: Kifogas[] = [];

  if (bemenet.kezdete === null || Number.isNaN(bemenet.kezdete.getTime())) {
    kifogasok.push({ mezo: "kezdete", uzenet: uzenet("jogviszony.hiba.kezdete") });
  }
  if (bemenet.berletiDijFt === null || bemenet.berletiDijFt <= 0) {
    kifogasok.push({ mezo: "berletiDijFt", uzenet: uzenet("jogviszony.hiba.dij") });
  }
  if (bemenet.kozosKoltsegFt !== null && bemenet.kozosKoltsegFt < 0) {
    kifogasok.push({ mezo: "kozosKoltsegFt", uzenet: uzenet("berlemeny.hiba.negativ") });
  }
  if (bemenet.kaucioFt !== null && bemenet.kaucioFt < 0) {
    kifogasok.push({ mezo: "kaucioFt", uzenet: uzenet("berlemeny.hiba.negativ") });
  }
  if (
    bemenet.fizetesiNap === null ||
    !Number.isInteger(bemenet.fizetesiNap) ||
    bemenet.fizetesiNap < 1 ||
    bemenet.fizetesiNap > FIZETESI_NAP_MAX
  ) {
    kifogasok.push({
      mezo: "fizetesiNap",
      uzenet: uzenet("jogviszony.hiba.fizetesi_nap", { max: FIZETESI_NAP_MAX }),
    });
  }
  if (!(REZSI_MODOK as readonly string[]).includes(bemenet.rezsiElszamolas)) {
    kifogasok.push({ mezo: "rezsiElszamolas", uzenet: uzenet("jogviszony.hiba.rezsi_mod") });
  }
  // Átalányt nulla forinttal elszámolni értelmetlen: minden hónapra nulla
  // forintos előírás születne, és a bérlő azt hinné, nincs rezsije.
  if (bemenet.rezsiElszamolas === "atalany" && (bemenet.rezsiAtalanyFt ?? 0) <= 0) {
    kifogasok.push({ mezo: "rezsiAtalanyFt", uzenet: uzenet("jogviszony.hiba.atalany") });
  }
  if (ures(bemenet.berloNeve)) {
    kifogasok.push({ mezo: "berloNeve", uzenet: uzenet("jogviszony.hiba.berlo") });
  }

  return kifogasok;
}

/**
 * Hány hónapra fog azonnal előírás születni.
 *
 * A jogviszony kezdetétől a mai hónapig minden hónapra készül előírás, rögtön
 * a mentés után. Egy két éve kezdődő jogviszonynál ez huszonöt hónapnyi tétel,
 * és ha a bérbeadó erre nem számít, azt hiszi, elromlott valami. Ezért
 * előre megmondjuk.
 */
export function visszamenolegesHonapok(kezdete: Date, ma: Date): number {
  const honapok =
    (ma.getUTCFullYear() - kezdete.getUTCFullYear()) * 12 +
    (ma.getUTCMonth() - kezdete.getUTCMonth());
  return Math.max(0, honapok) + 1;
}

export function jogviszonyFigyelmeztetesei(
  bemenet: JogviszonyBemenet,
  ma: Date,
): Uzenet[] {
  const sorok: Uzenet[] = [];
  if (bemenet.kezdete === null || Number.isNaN(bemenet.kezdete.getTime())) return sorok;

  if (bemenet.kezdete.getTime() > ma.getTime()) {
    // Jövőbeli kezdet megengedett: a szerződést előre meg lehet kötni. Csak
    // addig nem lesz egyetlen előírás sem, és ezt jobb előre tudni.
    sorok.push(uzenet("jogviszony.figyelem.jovobeli"));
    return sorok;
  }

  const honapok = visszamenolegesHonapok(bemenet.kezdete, ma);
  if (honapok > 1) {
    sorok.push(uzenet("jogviszony.figyelem.visszamenoleg", { honapok }));
  }
  return sorok;
}
