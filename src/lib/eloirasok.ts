/**
 * Az előírások pótlása.
 *
 * A domain megmondja, minek kellene lennie; ez a modul megnézi, mi van, és a
 * hiányzót létrehozza. Meglévő előírást soha nem ír át: amire egyszer már
 * egyeztettünk, az nem változhat meg egy későbbi díjemelés miatt.
 *
 * Azért pótlás és nem ütemezett feladat, mert az alkalmazásban nincs ütemező, és
 * egy magánbérbeadónak nem is kell: a hiány akkor derül ki, amikor valaki
 * ránéz a befizetésekre, és ott azonnal pótolható. A művelet idempotens, a
 * `jogviszonyId + tipus + idoszak + forrasId` egyediség védi.
 */

import { eloirasok, type Eloiras, type JogviszonyAdat } from "@/domain/eloirasok";
import { FAJTAK, type ElofizetesAdat } from "@/domain/elofizetes";
import type { Uzenet } from "@/domain/nyelv";
import { prisma } from "@/lib/db";

/** A részletezés a naplóban szótárkulcsként él, hogy a nyelvvel együtt változzon. */
function reszletezest(eloiras: Eloiras): string | null {
  return eloiras.reszletezes ? JSON.stringify(eloiras.reszletezes) : null;
}

export function reszletezesbol(nyers: string | null): Uzenet | null {
  if (!nyers) return null;
  try {
    const ertek = JSON.parse(nyers);
    return typeof ertek?.kulcs === "string" ? (ertek as Uzenet) : null;
  } catch {
    return null;
  }
}

export type ElofizetesSor = {
  id: string;
  fajta: string;
  megnevezes: string;
  szolgaltato: string | null;
  elofizeto: string;
  haviDijFt: number;
  kezdete: Date;
  vege: Date | null;
  jovahagyasok: { berloId: string; allapot: string; indoklas: string | null }[];
};

/** Az adatbázis sorából a domain alakja. A szűkítés itt történik, egy helyen. */
export function elofizetesAdatta(sor: ElofizetesSor): ElofizetesAdat {
  return {
    id: sor.id,
    fajta: (FAJTAK as string[]).includes(sor.fajta) ? (sor.fajta as ElofizetesAdat["fajta"]) : "egyeb",
    megnevezes: sor.megnevezes,
    szolgaltato: sor.szolgaltato,
    elofizeto: sor.elofizeto === "berlo" ? "berlo" : "berbeado",
    haviDijFt: sor.haviDijFt,
    kezdete: sor.kezdete,
    vege: sor.vege,
    nyilatkozatok: sor.jovahagyasok.map((jovahagyas) => ({
      berloId: jovahagyas.berloId,
      allapot: jovahagyas.allapot === "kifogasolt" ? "kifogasolt" : "jovahagyva",
      indoklas: jovahagyas.indoklas,
    })),
  };
}

export function jogviszonyAdatta(jogviszony: {
  kezdete: Date;
  vege: Date | null;
  berletiDijFt: number;
  kozosKoltsegFt: number;
  rezsiElszamolas: string;
  rezsiAtalanyFt: number;
  fizetesiNap: number;
  elofizetesek?: ElofizetesSor[];
  berlok?: { berloId: string | null }[];
}): JogviszonyAdat {
  return {
    kezdete: jogviszony.kezdete,
    vege: jogviszony.vege,
    berletiDijFt: jogviszony.berletiDijFt,
    kozosKoltsegFt: jogviszony.kozosKoltsegFt,
    rezsiElszamolas: jogviszony.rezsiElszamolas,
    rezsiAtalanyFt: jogviszony.rezsiAtalanyFt,
    fizetesiNap: jogviszony.fizetesiNap,
    elofizetesek: (jogviszony.elofizetesek ?? []).map(elofizetesAdatta),
    // Csak az a bérlő nyilatkozhat, akinek van fiókja: aki még meghívóra vár,
    // annak a nevében nem mond igent senki.
    fiokosBerlok: (jogviszony.berlok ?? [])
      .map((berlo) => berlo.berloId)
      .filter((berloId): berloId is string => Boolean(berloId)),
  };
}

/**
 * A hiányzó előírások pótlása egy bérbeadó összes jogviszonyára.
 * A visszatérés a létrehozott sorok száma, hogy a hívó tudjon róla szólni.
 */
export async function eloirasokatPotol(tulajdonosId: string, ma = new Date()): Promise<number> {
  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId } },
    include: {
      eloirtTetelek: { select: { tipus: true, idoszak: true, forrasId: true } },
      elofizetesek: { include: { jovahagyasok: true } },
      berlok: { select: { berloId: true } },
    },
  });

  let letrejott = 0;
  for (const jogviszony of jogviszonyok) {
    const megvan = new Set(
      jogviszony.eloirtTetelek.map(
        (tetel) => `${tetel.tipus}|${tetel.idoszak}|${tetel.forrasId}`,
      ),
    );
    const hianyzo = eloirasok(jogviszonyAdatta(jogviszony), ma).filter(
      (eloiras) => !megvan.has(`${eloiras.tipus}|${eloiras.idoszak}|${eloiras.forrasId}`),
    );
    if (hianyzo.length === 0) continue;

    // Tételenként, `upsert`-tel: az `update: {}` mondja ki, hogy meglévő
    // előírást soha nem írunk felül. Így két egyidejű oldalletöltés sem tud
    // duplikátumot vagy felülírást okozni.
    for (const eloiras of hianyzo) {
      const elotte = await prisma.eloirtTetel.count({
        where: {
          jogviszonyId: jogviszony.id,
          tipus: eloiras.tipus,
          idoszak: eloiras.idoszak,
          forrasId: eloiras.forrasId,
        },
      });
      await prisma.eloirtTetel.upsert({
        where: {
          jogviszonyId_tipus_idoszak_forrasId: {
            jogviszonyId: jogviszony.id,
            tipus: eloiras.tipus,
            idoszak: eloiras.idoszak,
            forrasId: eloiras.forrasId,
          },
        },
        update: {},
        create: {
          jogviszonyId: jogviszony.id,
          tipus: eloiras.tipus,
          idoszak: eloiras.idoszak,
          forrasId: eloiras.forrasId,
          esedekesseg: eloiras.esedekesseg,
          osszegFt: eloiras.osszegFt,
          reszletezes: reszletezest(eloiras),
        },
      });
      if (elotte === 0) letrejott += 1;
    }
  }

  return letrejott;
}

/** Ugyanaz a pótlás a bérlő felől: az ő jogviszonyainak tulajdonosaira fut. */
export async function eloirasokatPotolBerlonek(berloId: string, ma = new Date()): Promise<number> {
  const tulajdonosok = await prisma.jogviszony.findMany({
    where: { berlok: { some: { berloId } } },
    select: { ingatlan: { select: { tulajdonosId: true } } },
  });

  const egyediek = [...new Set(tulajdonosok.map((sor) => sor.ingatlan.tulajdonosId))];
  let letrejott = 0;
  for (const tulajdonosId of egyediek) {
    letrejott += await eloirasokatPotol(tulajdonosId, ma);
  }
  return letrejott;
}
