/**
 * A jogviszony lezárása.
 *
 * Eddig a `statusz` mező ott volt a sémában, de semmi nem állította: a
 * jogviszony örökké élt, és a havi előírások örökké keletkeztek volna.
 *
 * A lezárás nem töröl semmit a múltból. Amit viszont muszáj rendbe tennie: a
 * kiköltözés utáni hónapok előírásai már nem állnak fenn, mert az az időszak
 * nincs. Ezeket törli, a záró hónapét pedig napra arányosítja — de csak akkor,
 * ha az még a generált, teljes havi összeg. Amit ember írt át, ahhoz nem nyúl.
 *
 * Ami így egyeztetés nélkül marad (befizetés, amihez már nincs előírás), nem
 * vész el: az "előírás nélkül beérkezett pénz" listáján jön elő, ahogy minden
 * más be nem sorolható utalás.
 */

import { eloirasok } from "@/domain/eloirasok";
import { jogviszonyAdatta as adatta } from "@/lib/eloirasok";
import { prisma } from "@/lib/db";

export type LezarasEredmeny = {
  toroltEloirasok: number;
  aranyositottEloirasok: number;
};

function honapKulcs(nap: Date): string {
  return `${nap.getUTCFullYear()}-${String(nap.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function jogviszonytLezar(
  tulajdonosId: string,
  jogviszonyId: string,
  vege: Date,
): Promise<LezarasEredmeny | null> {
  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId } },
    include: { eloirtTetelek: true },
  });
  if (!jogviszony) return null;

  const zaroHonap = honapKulcs(vege);

  // A kiköltözés hónapja utáni előírások: az az időszak már nincs.
  const torlendo = jogviszony.eloirtTetelek.filter((tetel) => tetel.idoszak > zaroHonap);
  if (torlendo.length > 0) {
    await prisma.eloirtTetel.deleteMany({
      where: { id: { in: torlendo.map((tetel) => tetel.id) } },
    });
  }

  await prisma.jogviszony.update({
    where: { id: jogviszonyId },
    data: { statusz: "lezart", vege },
  });

  // A záró hónap arányosítása: a domain mondja meg, mennyi jár.
  const frissitett = await prisma.jogviszony.findUniqueOrThrow({
    where: { id: jogviszonyId },
    include: {
      elofizetesek: { include: { jovahagyasok: true } },
      berlok: { select: { berloId: true } },
    },
  });
  const kellene = eloirasok(adatta(frissitett), vege).filter(
    (eloiras) => eloiras.idoszak === zaroHonap,
  );

  let aranyositott = 0;
  for (const eloiras of kellene) {
    const meglevo = jogviszony.eloirtTetelek.find(
      (tetel) =>
        tetel.tipus === eloiras.tipus &&
        tetel.idoszak === zaroHonap &&
        tetel.forrasId === eloiras.forrasId,
    );
    if (!meglevo || meglevo.osszegFt === eloiras.osszegFt) continue;

    // Csak a generált, teljes havi összeget igazítjuk. Amit ember írt át,
    // ahhoz nem nyúlunk: az a bérbeadó döntése volt.
    const teljesHavi =
      eloiras.tipus === "berleti_dij"
        ? frissitett.berletiDijFt
        : eloiras.tipus === "kozos_koltseg"
          ? frissitett.kozosKoltsegFt
          : eloiras.tipus === "elofizetes"
            ? (frissitett.elofizetesek.find((sor) => sor.id === eloiras.forrasId)?.haviDijFt ?? 0)
            : frissitett.rezsiAtalanyFt;
    if (meglevo.osszegFt !== teljesHavi) continue;

    await prisma.eloirtTetel.update({
      where: { id: meglevo.id },
      data: {
        osszegFt: eloiras.osszegFt,
        reszletezes: eloiras.reszletezes ? JSON.stringify(eloiras.reszletezes) : null,
      },
    });
    aranyositott += 1;
  }

  return { toroltEloirasok: torlendo.length, aranyositottEloirasok: aranyositott };
}

/**
 * A lezárás visszavonása. Nem elég a státuszt átállítani: a záró hónap
 * arányosított összege bent maradna, és a pótlás sem javítaná ki, mert az
 * meglévő előírást soha nem ír át. Egy elkattintott lezárás így csendben
 * kevesebb bérleti díjat írna elő. Ezért itt visszaszámoljuk, amit a lezárás
 * arányosított.
 *
 * Csak azt a sort igazítjuk, amelyikhez a mi részletezésünk tartozik: az
 * jelzi, hogy az összeget a rendszer számolta. A beköltözés hónapja is ilyen,
 * de az arányosítása a nyitott jogviszonynál is ugyanannyi marad, ezért nem
 * változik.
 */
export async function jogviszonytUjranyit(
  tulajdonosId: string,
  jogviszonyId: string,
): Promise<boolean> {
  const eredmeny = await prisma.jogviszony.updateMany({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId }, statusz: "lezart" },
    data: { statusz: "elo", vege: null },
  });
  if (eredmeny.count === 0) return false;

  const jogviszony = await prisma.jogviszony.findUniqueOrThrow({
    where: { id: jogviszonyId },
    include: {
      eloirtTetelek: true,
      elofizetesek: { include: { jovahagyasok: true } },
      berlok: { select: { berloId: true } },
    },
  });

  const kellene = new Map(
    eloirasok(adatta(jogviszony), new Date()).map((eloiras) => [
      `${eloiras.tipus}|${eloiras.idoszak}|${eloiras.forrasId}`,
      eloiras,
    ]),
  );

  for (const tetel of jogviszony.eloirtTetelek) {
    if (tetel.reszletezes === null) continue;
    const eloiras = kellene.get(`${tetel.tipus}|${tetel.idoszak}|${tetel.forrasId}`);
    if (!eloiras || eloiras.osszegFt === tetel.osszegFt) continue;
    await prisma.eloirtTetel.update({
      where: { id: tetel.id },
      data: {
        osszegFt: eloiras.osszegFt,
        reszletezes: eloiras.reszletezes ? JSON.stringify(eloiras.reszletezes) : null,
      },
    });
  }

  return true;
}
