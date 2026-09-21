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
 * `jogviszonyId + tipus + idoszak` egyediség védi.
 */

import { eloirasok, type Eloiras, type JogviszonyAdat } from "@/domain/eloirasok";
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

function adatta(jogviszony: {
  kezdete: Date;
  vege: Date | null;
  berletiDijFt: number;
  kozosKoltsegFt: number;
  rezsiElszamolas: string;
  rezsiAtalanyFt: number;
  fizetesiNap: number;
}): JogviszonyAdat {
  return {
    kezdete: jogviszony.kezdete,
    vege: jogviszony.vege,
    berletiDijFt: jogviszony.berletiDijFt,
    kozosKoltsegFt: jogviszony.kozosKoltsegFt,
    rezsiElszamolas: jogviszony.rezsiElszamolas,
    rezsiAtalanyFt: jogviszony.rezsiAtalanyFt,
    fizetesiNap: jogviszony.fizetesiNap,
  };
}

/**
 * A hiányzó előírások pótlása egy bérbeadó összes jogviszonyára.
 * A visszatérés a létrehozott sorok száma, hogy a hívó tudjon róla szólni.
 */
export async function eloirasokatPotol(tulajdonosId: string, ma = new Date()): Promise<number> {
  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId } },
    include: { eloirtTetelek: { select: { tipus: true, idoszak: true } } },
  });

  let letrejott = 0;
  for (const jogviszony of jogviszonyok) {
    const megvan = new Set(
      jogviszony.eloirtTetelek.map((tetel) => `${tetel.tipus}|${tetel.idoszak}`),
    );
    const hianyzo = eloirasok(adatta(jogviszony), ma).filter(
      (eloiras) => !megvan.has(`${eloiras.tipus}|${eloiras.idoszak}`),
    );
    if (hianyzo.length === 0) continue;

    // Tételenként, `upsert`-tel: az `update: {}` mondja ki, hogy meglévő
    // előírást soha nem írunk felül. Így két egyidejű oldalletöltés sem tud
    // duplikátumot vagy felülírást okozni.
    for (const eloiras of hianyzo) {
      const elotte = await prisma.eloirtTetel.count({
        where: { jogviszonyId: jogviszony.id, tipus: eloiras.tipus, idoszak: eloiras.idoszak },
      });
      await prisma.eloirtTetel.upsert({
        where: {
          jogviszonyId_tipus_idoszak: {
            jogviszonyId: jogviszony.id,
            tipus: eloiras.tipus,
            idoszak: eloiras.idoszak,
          },
        },
        update: {},
        create: {
          jogviszonyId: jogviszony.id,
          tipus: eloiras.tipus,
          idoszak: eloiras.idoszak,
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
