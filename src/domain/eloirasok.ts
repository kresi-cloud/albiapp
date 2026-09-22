/**
 * Havi előírások.
 *
 * Eddig az előírt tételek csak a példaadatban voltak benne, tehát éles
 * használatban egy új hónap bérleti díja meg sem jelent volna. A befizetés-
 * egyeztetés viszont ezekre ül rá: nincs előírás, nincs mihez mérni a
 * befizetést.
 *
 * Két szabály végigvonul:
 *
 *  - A töredékhónap napra arányosan jár. Ha a jogviszony 12-én kezdődik, a
 *    bérlő nem egész hónapot fizet. Ez a magyar gyakorlat, és a szerződés is
 *    így szól.
 *  - Ami egyszer előírás lett, az nem változik meg utólag. A díjemelés a
 *    következő hónapoktól érvényes; a korábbi előírásokat nem írjuk felül,
 *    különben a tavalyi egyeztetés eredménye ma másképp nézne ki.
 */

import { uzenet, type Uzenet } from "./nyelv";

export type EloirasTipus = "berleti_dij" | "kozos_koltseg" | "rezsi_atalany";

export type JogviszonyAdat = {
  kezdete: Date;
  vege: Date | null;
  berletiDijFt: number;
  kozosKoltsegFt: number;
  /** "almero" | "atalany" | "kozos_koltsegben" */
  rezsiElszamolas: string;
  rezsiAtalanyFt: number;
  /** A hónap hányadikára esedékes. */
  fizetesiNap: number;
};

export type Eloiras = {
  tipus: EloirasTipus;
  /** "2026-09" */
  idoszak: string;
  esedekesseg: Date;
  osszegFt: number;
  /** Miért ennyi, ha nem a teljes havi összeg. Teljes hónapnál nincs mit mondani. */
  reszletezes: Uzenet | null;
};

function honapNapjai(ev: number, honap: number): number {
  return new Date(Date.UTC(ev, honap + 1, 0)).getUTCDate();
}

function idoszakKulcs(ev: number, honap: number): string {
  return `${ev}-${String(honap + 1).padStart(2, "0")}`;
}

/**
 * Az esedékesség napja a hónapban. A fizetési nap lehet 31, de nem minden
 * hónapnak van 31 napja: ilyenkor a hónap utolsó napja az esedékesség.
 */
function esedekessegNapja(ev: number, honap: number, fizetesiNap: number): Date {
  const nap = Math.min(Math.max(fizetesiNap, 1), honapNapjai(ev, honap));
  return new Date(Date.UTC(ev, honap, nap));
}

function napEleje(ertek: Date): Date {
  return new Date(
    Date.UTC(ertek.getUTCFullYear(), ertek.getUTCMonth(), ertek.getUTCDate()),
  );
}

/** Hány napra szól a jogviszony az adott hónapban, és hány napos a hónap. */
function napokAHonapban(
  jogviszony: JogviszonyAdat,
  ev: number,
  honap: number,
): { napok: number; honapNapjai: number; elsoNap: number; utolsoNap: number } {
  const osszesNap = honapNapjai(ev, honap);
  const kezdete = napEleje(jogviszony.kezdete);
  const vege = jogviszony.vege ? napEleje(jogviszony.vege) : null;

  const honapElso = new Date(Date.UTC(ev, honap, 1));
  const honapUtolso = new Date(Date.UTC(ev, honap, osszesNap));

  const elso = kezdete > honapElso ? kezdete : honapElso;
  const utolso = vege && vege < honapUtolso ? vege : honapUtolso;

  return {
    napok: utolso.getUTCDate() - elso.getUTCDate() + 1,
    honapNapjai: osszesNap,
    elsoNap: elso.getUTCDate(),
    utolsoNap: utolso.getUTCDate(),
  };
}

/** Arányos összeg egész forintra kerekítve. Teljes hónapnál a teljes összeg. */
function aranyos(teljesFt: number, napok: number, honapNapjai: number): number {
  if (napok >= honapNapjai) return teljesFt;
  return Math.round((teljesFt * napok) / honapNapjai);
}

const TIPUSOK: { tipus: EloirasTipus; osszeget: (jogviszony: JogviszonyAdat) => number }[] = [
  { tipus: "berleti_dij", osszeget: (jogviszony) => jogviszony.berletiDijFt },
  { tipus: "kozos_koltseg", osszeget: (jogviszony) => jogviszony.kozosKoltsegFt },
  {
    tipus: "rezsi_atalany",
    osszeget: (jogviszony) =>
      jogviszony.rezsiElszamolas === "atalany" ? jogviszony.rezsiAtalanyFt : 0,
  },
];

/**
 * Az összes előírás a jogviszony kezdetétől a `ma` hónapjának végéig, vagy a
 * jogviszony végéig, amelyik előbb van.
 *
 * A futó hónap előírása a hónap elején megszületik, nem az esedékesség napján:
 * a bérlő lássa előre, mit kell fizetnie, és a bérbeadó is lássa, mire vár.
 */
export function eloirasok(jogviszony: JogviszonyAdat, ma: Date): Eloiras[] {
  const kezdete = napEleje(jogviszony.kezdete);
  const vege = jogviszony.vege ? napEleje(jogviszony.vege) : null;
  if (vege && vege < kezdete) return [];

  const utolsoHonap = vege && vege < napEleje(ma) ? vege : napEleje(ma);
  const kesz: Eloiras[] = [];

  let ev = kezdete.getUTCFullYear();
  let honap = kezdete.getUTCMonth();

  while (
    ev < utolsoHonap.getUTCFullYear() ||
    (ev === utolsoHonap.getUTCFullYear() && honap <= utolsoHonap.getUTCMonth())
  ) {
    const reszlet = napokAHonapban(jogviszony, ev, honap);
    if (reszlet.napok > 0) {
      const toredek = reszlet.napok < reszlet.honapNapjai;
      const esedekesseg = esedekessegNapja(ev, honap, jogviszony.fizetesiNap);
      // Töredék első hónapnál az esedékesség nem eshet a beköltözés elé.
      const elsoNap = new Date(Date.UTC(ev, honap, reszlet.elsoNap));
      const mikor = esedekesseg < elsoNap ? elsoNap : esedekesseg;

      for (const { tipus, osszeget } of TIPUSOK) {
        const teljes = osszeget(jogviszony);
        if (teljes <= 0) continue;
        const osszegFt = aranyos(teljes, reszlet.napok, reszlet.honapNapjai);
        if (osszegFt <= 0) continue;

        kesz.push({
          tipus,
          idoszak: idoszakKulcs(ev, honap),
          esedekesseg: mikor,
          osszegFt,
          reszletezes: toredek
            ? uzenet("eloiras.toredek", {
                elso: reszlet.elsoNap,
                utolso: reszlet.utolsoNap,
                napok: reszlet.napok,
                honapNapjai: reszlet.honapNapjai,
                teljes,
              })
            : null,
        });
      }
    }

    honap += 1;
    if (honap > 11) {
      honap = 0;
      ev += 1;
    }
  }

  return kesz;
}
