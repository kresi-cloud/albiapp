/**
 * Bérlemény és jogviszony létrehozása.
 *
 * A jogosultság itt dől el: a bérbeadó csak a saját ingatlanára indíthat
 * jogviszonyt, és ezt a kiszolgálón ellenőrizzük, nem az űrlapból hisszük el.
 */

import { prisma } from "@/lib/db";
import type { IngatlanBemenet, JogviszonyBemenet } from "@/domain/berlemeny";

function vagy<T>(ertek: T | null, alap: T): T {
  return ertek === null ? alap : ertek;
}

function szovegVagyNull(ertek: string | null): string | null {
  const tiszta = (ertek ?? "").trim();
  return tiszta === "" ? null : tiszta;
}

export async function ingatlantLetrehoz(
  tulajdonosId: string,
  bemenet: IngatlanBemenet,
): Promise<string> {
  const ingatlan = await prisma.ingatlan.create({
    data: {
      tulajdonosId,
      megnevezes: bemenet.megnevezes.trim(),
      cim: bemenet.cim.trim(),
      alapteruletM2: bemenet.alapteruletM2,
      helyrajziSzam: szovegVagyNull(bemenet.helyrajziSzam),
      energetikaiAzonosito: szovegVagyNull(bemenet.energetikaiAzonosito),
      kozosKoltsegFt: bemenet.kozosKoltsegFt,
      beszerzesiArFt: bemenet.beszerzesiArFt,
      beszerzesDatuma: bemenet.beszerzesDatuma,
    },
  });
  return ingatlan.id;
}

/** A bérbeadó ingatlanai, a jogviszony-indító választójához. */
export async function sajatIngatlanok(tulajdonosId: string) {
  return prisma.ingatlan.findMany({
    where: { tulajdonosId },
    orderBy: [{ letrehozva: "asc" }, { id: "asc" }],
    select: { id: true, megnevezes: true, cim: true, kozosKoltsegFt: true },
  });
}

/**
 * Jogviszony indítása az első bérlővel.
 *
 * Az előírásokat nem itt gyártjuk: azok a jogviszonyból következnek, és a
 * pótlás akkor fut, amikor valaki ránéz a befizetésekre. Így egy helyen dől
 * el, milyen előírás jár — és egy díjemelés sem írja át a régieket.
 *
 * `null`-t ad vissza, ha az ingatlan nem a bérbeadóé: a jogviszonyt nem az
 * űrlapban megadott ingatlanhoz kötjük, hanem ahhoz, amiről ellenőriztük,
 * hogy az övé.
 */
export async function jogviszonytIndit(
  tulajdonosId: string,
  ingatlanId: string,
  bemenet: JogviszonyBemenet & { berloEmail: string | null },
): Promise<string | null> {
  const ingatlan = await prisma.ingatlan.findFirst({
    where: { id: ingatlanId, tulajdonosId },
    select: { id: true },
  });
  if (!ingatlan) return null;
  if (bemenet.kezdete === null) return null;

  const jogviszony = await prisma.jogviszony.create({
    data: {
      ingatlanId: ingatlan.id,
      kezdete: bemenet.kezdete,
      berletiDijFt: bemenet.berletiDijFt ?? 0,
      kozosKoltsegFt: vagy(bemenet.kozosKoltsegFt, 0),
      kaucioFt: vagy(bemenet.kaucioFt, 0),
      fizetesiNap: vagy(bemenet.fizetesiNap, 5),
      rezsiElszamolas: bemenet.rezsiElszamolas,
      rezsiAtalanyFt: vagy(bemenet.rezsiAtalanyFt, 0),
      berlok: {
        create: {
          nev: bemenet.berloNeve.trim(),
          email: szovegVagyNull(bemenet.berloEmail),
          // A bérbeadó írta be, nem a bérlő: ha a bérlő megadja a sajátját,
          // az övé lesz az érvényes.
          adatokForrasa: "berbeado",
          adatokFrissitve: new Date(),
          sorrend: 0,
        },
      },
    },
  });
  return jogviszony.id;
}
