/**
 * Teendők.
 *
 * Minden modul ide termel, és ebből épül a kezdőlap kiemelt sávja és a naptár.
 * A teendő maga nem tárolt igazság: a rendszer állapotából származik, ezért
 * minden teendőnek van egy stabil kulcsa, amivel nem keletkezik kétszer.
 */

import type { Allapot, ElteresOka } from "./egyeztetes";
import { uzenet, type Uzenet } from "./nyelv";
import { napKulonbseg } from "./penz";

export type Surgosseg = "lejart" | "ma" | "kozeli" | "kesobbi";

export type Teendo = {
  kulcs: string;
  cimzett: "berbeado" | "berlo";
  tipus: string;
  cim: Uzenet;
  leiras?: Uzenet;
  esedekesseg: Date;
  hivatkozas?: string;
  /**
   * Igaz, ha a teendő saját sora van az adatbázisban, tehát valaki vállalta,
   * nem a rendszer állapotából származik. Csak az ilyen zárható le kézzel: a
   * származtatott teendő magától eltűnik, ha az oka megszűnik.
   */
  tarolt?: boolean;
};

export type TeendoSurgosseggel = Teendo & { surgosseg: Surgosseg };

/** A kezdőlap három szintje: lejárt, mai, közeli. A többi lejjebb kerül. */
export function surgosseg(esedekesseg: Date, ma: Date, kozeliNap = 7): Surgosseg {
  const nap = napKulonbseg(ma, esedekesseg);
  if (nap < 0) return "lejart";
  if (nap === 0) return "ma";
  if (nap <= kozeliNap) return "kozeli";
  return "kesobbi";
}

export const SURGOSSEG_SORREND: Record<Surgosseg, number> = {
  lejart: 0,
  ma: 1,
  kozeli: 2,
  kesobbi: 3,
};

export function teendoketRendez(
  teendok: TeendoSurgosseggel[],
): TeendoSurgosseggel[] {
  return [...teendok].sort((a, b) => {
    const kulonbseg =
      SURGOSSEG_SORREND[a.surgosseg] - SURGOSSEG_SORREND[b.surgosseg];
    if (kulonbseg !== 0) return kulonbseg;
    return a.esedekesseg.getTime() - b.esedekesseg.getTime();
  });
}

export type EgyeztetesTeendohoz = {
  jogviszonyId: string;
  eloirtTetelId: string | null;
  idoszak: string | null;
  allapot: Allapot;
  elteresOka: ElteresOka | null;
  elteresFt: number;
  osszegFt: number;
  esedekesseg: Date;
};

/** Az egyeztetés eredményéből született teendők, mindkét félnek. */
export function egyeztetesbolTeendok(
  egyeztetesek: EgyeztetesTeendohoz[],
): Teendo[] {
  const teendok: Teendo[] = [];

  for (const egyeztetes of egyeztetesek) {
    const azonosito =
      egyeztetes.eloirtTetelId ?? `${egyeztetes.jogviszonyId}-${egyeztetes.idoszak}`;
    const hivatkozas = `/befizetesek?jogviszony=${egyeztetes.jogviszonyId}`;

    if (egyeztetes.allapot === "hianyzik") {
      teendok.push({
        kulcs: `hianyzik:${azonosito}:berlo`,
        cimzett: "berlo",
        tipus: "befizetes_hianyzik",
        cim: uzenet("teendo.hianyzik.berlo"),
        leiras: uzenet("teendo.idoszak_osszeg", {
          idoszak: egyeztetes.idoszak ?? "",
          osszeg: egyeztetes.osszegFt,
        }),
        esedekesseg: egyeztetes.esedekesseg,
        hivatkozas,
      });
      teendok.push({
        kulcs: `hianyzik:${azonosito}:berbeado`,
        cimzett: "berbeado",
        tipus: "befizetes_hianyzik",
        cim: uzenet("teendo.hianyzik.berbeado"),
        leiras: uzenet("teendo.idoszak_osszeg", {
          idoszak: egyeztetes.idoszak ?? "",
          osszeg: egyeztetes.osszegFt,
        }),
        esedekesseg: egyeztetes.esedekesseg,
        hivatkozas,
      });
      continue;
    }

    if (egyeztetes.allapot === "elter") {
      const cim =
        egyeztetes.elteresOka === "nincs_eloiras"
          ? uzenet("teendo.elter.nincs_eloiras")
          : egyeztetes.elteresOka === "nincs_kivonattetel"
            ? uzenet("teendo.elter.nincs_kivonattetel")
            : uzenet("teendo.elter.berbeado");
      teendok.push({
        kulcs: `elter:${azonosito}:berbeado`,
        cimzett: "berbeado",
        tipus: "befizetes_elter",
        cim,
        leiras: uzenet("teendo.elteres", { osszeg: egyeztetes.elteresFt }),
        esedekesseg: egyeztetes.esedekesseg,
        hivatkozas,
      });
      if (egyeztetes.elteresOka !== "nincs_eloiras") {
        teendok.push({
          kulcs: `elter:${azonosito}:berlo`,
          cimzett: "berlo",
          tipus: "befizetes_elter",
          cim: uzenet("teendo.elter.berlo"),
          leiras: uzenet("teendo.elteres", { osszeg: egyeztetes.elteresFt }),
          esedekesseg: egyeztetes.esedekesseg,
          hivatkozas,
        });
      }
    }
  }

  return teendok;
}

/** Ami még csak közeledik: a bérlő figyelmeztetése a következő utalásra. */
export function kozelgoBefizetesTeendok(
  eloirtTetelek: {
    id: string;
    jogviszonyId: string;
    idoszak: string;
    esedekesseg: Date;
    osszegFt: number;
    rendezett: boolean;
  }[],
  ma: Date,
  kozeliNap = 7,
): Teendo[] {
  return eloirtTetelek
    .filter((tetel) => !tetel.rendezett)
    .filter((tetel) => {
      const nap = napKulonbseg(ma, tetel.esedekesseg);
      return nap >= 0 && nap <= kozeliNap;
    })
    .map((tetel) => ({
      kulcs: `esedekes:${tetel.id}:berlo`,
      cimzett: "berlo" as const,
      tipus: "befizetes_esedekes",
      cim: uzenet("teendo.kozelgo"),
      leiras: uzenet("teendo.idoszak_osszeg", {
        idoszak: tetel.idoszak,
        osszeg: tetel.osszegFt,
      }),
      esedekesseg: tetel.esedekesseg,
      hivatkozas: `/berlo/befizetesek?jogviszony=${tetel.jogviszonyId}`,
    }));
}
