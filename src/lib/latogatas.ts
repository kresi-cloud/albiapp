/**
 * Szolgáltatói látogatások betöltése. A jogosultság itt dől el: a bérbeadó a
 * saját ingatlanjainak látogatásait látja, a bérlő a saját jogviszonyaiét.
 */

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { Fajta, Latogatas, Valasz } from "@/domain/latogatas";

// `satisfies` és nem `as const`: az `as const` a rendezési tömböket is
// readonly-vá teszi, a Prisma pedig azt nem fogadja el. Így a literálok
// megmaradnak — a származtatott típusok ebből jönnek —, a tömbök viszont nem.
const BETOLTES = {
  bejelento: { select: { nev: true } },
  valaszok: { include: { berlo: { select: { nev: true } } } },
  jogviszony: {
    include: {
      ingatlan: { select: { megnevezes: true } },
      berlok: { orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
    },
  },
} satisfies Prisma.SzolgaltatoiLatogatasInclude;

type Betoltott = Awaited<
  ReturnType<
    typeof prisma.szolgaltatoiLatogatas.findMany<{ include: typeof BETOLTES }>
  >
>[number];

export type LatogatasNezet = Latogatas & {
  jogviszonyCimke: string;
  bejelentoNev: string;
  megjegyzes: string | null;
  lemondasOka: string | null;
  /** Van-e olyan bérlő, akinek még nincs fiókja: a felület ezt kiírja. */
  fiokNelkuliBerlok: string[];
};

function nezette(sor: Betoltott): LatogatasNezet {
  return {
    id: sor.id,
    jogviszonyId: sor.jogviszonyId,
    bejelentoId: sor.bejelentoId,
    fajta: sor.fajta as Fajta,
    megnevezes: sor.megnevezes,
    szolgaltato: sor.szolgaltato,
    nap: sor.nap,
    idoablakTol: sor.idoablakTol,
    idoablakIg: sor.idoablakIg,
    lemondva: sor.lemondva,
    // Csak akitől választ lehet várni: fiók nélküli bérlőt nem lehet megkérdezni.
    varhatoValaszolok: sor.jogviszony.berlok
      .filter((berlo) => berlo.berloId !== null)
      .map((berlo) => ({ id: berlo.berloId as string, nev: berlo.nev })),
    valaszok: sor.valaszok.map((valasz) => ({
      berloId: valasz.berloId,
      berloNeve: valasz.berlo.nev,
      valasz: valasz.valasz as Valasz,
      indoklas: valasz.indoklas,
    })),
    jogviszonyCimke: sor.jogviszony.ingatlan.megnevezes,
    bejelentoNev: sor.bejelento.nev,
    megjegyzes: sor.megjegyzes,
    lemondasOka: sor.lemondasOka,
    fiokNelkuliBerlok: sor.jogviszony.berlok
      .filter((berlo) => berlo.berloId === null)
      .map((berlo) => berlo.nev),
  };
}

export async function berbeadoLatogatasai(
  berbeadoId: string,
): Promise<LatogatasNezet[]> {
  const sorok = await prisma.szolgaltatoiLatogatas.findMany({
    where: { jogviszony: { ingatlan: { tulajdonosId: berbeadoId } } },
    include: BETOLTES,
    orderBy: [{ nap: "asc" }, { id: "asc" }],
  });
  return sorok.map(nezette);
}

export async function berloLatogatasai(
  berloId: string,
): Promise<LatogatasNezet[]> {
  const sorok = await prisma.szolgaltatoiLatogatas.findMany({
    where: { jogviszony: { berlok: { some: { berloId } } } },
    include: BETOLTES,
    orderBy: [{ nap: "asc" }, { id: "asc" }],
  });
  return sorok.map(nezette);
}

/**
 * A teendőkhöz: csak a még el nem múlt, le nem mondott látogatások. A
 * `latogatasokbolTeendok` úgyis kiszűrné a többit, de százával álló múltbeli
 * sort fölösleges betölteni ahhoz, hogy eldobjuk.
 */
export async function nyitottLatogatasok(
  jogviszonyIdk: string[],
  ma: Date,
): Promise<Latogatas[]> {
  if (jogviszonyIdk.length === 0) return [];

  const sorok = await prisma.szolgaltatoiLatogatas.findMany({
    where: {
      jogviszonyId: { in: jogviszonyIdk },
      lemondva: null,
      nap: {
        gte: new Date(
          Date.UTC(ma.getUTCFullYear(), ma.getUTCMonth(), ma.getUTCDate()),
        ),
      },
    },
    include: BETOLTES,
  });
  return sorok.map(nezette);
}
