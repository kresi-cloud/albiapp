/**
 * Az előfizetések adatbázis-oldala.
 *
 * A jogosultság itt dől el, nem az űrlapon: a bérbeadó csak a saját ingatlanjai
 * jogviszonyaihoz vehet fel előfizetést, a bérlő pedig csak arról nyilatkozhat,
 * ami az ő jogviszonyához tartozik.
 */

import {
  allapota,
  ellenoriz,
  varRank,
  type Allapot,
  type Bevitel,
  type ElofizetesAdat,
  type Kifogas,
} from "@/domain/elofizetes";
import { prisma } from "@/lib/db";
import { elofizetesAdatta } from "@/lib/eloirasok";

export type Nezet = {
  adat: ElofizetesAdat;
  allapot: Allapot;
  /** Kire vár még, névvel: a felület nem az azonosítókat mutatja. */
  varRank: { berloId: string; nev: string }[];
  kifogasok: { berloId: string; nev: string; indoklas: string | null }[];
  jogviszonyId: string;
  ingatlanNev: string;
  berlok: { berloId: string; nev: string }[];
};

type BerloSor = { berloId: string | null; nev: string };

function nezette(
  sor: Parameters<typeof elofizetesAdatta>[0],
  jogviszonyId: string,
  ingatlanNev: string,
  berlok: BerloSor[],
): Nezet {
  const adat = elofizetesAdatta(sor);
  const fiokosak = berlok.filter((berlo): berlo is { berloId: string; nev: string } =>
    Boolean(berlo.berloId),
  );
  const nevek = new Map(fiokosak.map((berlo) => [berlo.berloId, berlo.nev]));
  const varok = varRank(adat, fiokosak.map((berlo) => berlo.berloId));

  return {
    adat,
    allapot: allapota(adat, fiokosak.map((berlo) => berlo.berloId)),
    varRank: varok.map((berloId) => ({ berloId, nev: nevek.get(berloId) ?? "" })),
    kifogasok: adat.nyilatkozatok
      .filter((nyilatkozat) => nyilatkozat.allapot === "kifogasolt")
      .map((nyilatkozat) => ({
        berloId: nyilatkozat.berloId,
        nev: nevek.get(nyilatkozat.berloId) ?? "",
        indoklas: nyilatkozat.indoklas,
      })),
    jogviszonyId,
    ingatlanNev,
    berlok: fiokosak,
  };
}

const TELJES = {
  jovahagyasok: true,
} as const;

/** A bérbeadó összes előfizetése, jogviszonyonként. */
export async function berbeadoElofizetesei(tulajdonosId: string): Promise<Nezet[]> {
  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId } },
    include: {
      ingatlan: { select: { megnevezes: true } },
      berlok: { select: { berloId: true, nev: true }, orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
      elofizetesek: { include: TELJES, orderBy: [{ kezdete: "asc" }, { id: "asc" }] },
    },
    orderBy: [{ letrehozva: "asc" }, { id: "asc" }],
  });

  return jogviszonyok.flatMap((jogviszony) =>
    jogviszony.elofizetesek.map((sor) =>
      nezette(sor, jogviszony.id, jogviszony.ingatlan.megnevezes, jogviszony.berlok),
    ),
  );
}

/** A bérbeadó jogviszonyai, hogy legyen mihez felvenni előfizetést. */
export async function berbeadoJogviszonyai(tulajdonosId: string) {
  return prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId }, statusz: "elo" },
    select: {
      id: true,
      ingatlan: { select: { megnevezes: true } },
      berlok: { select: { berloId: true, nev: true }, orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
    },
    orderBy: [{ letrehozva: "asc" }, { id: "asc" }],
  });
}

/** A bérlő előfizetései: amiről nyilatkoznia kell vagy már nyilatkozott. */
export async function berloElofizetesei(berloId: string): Promise<Nezet[]> {
  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { berlok: { some: { berloId } } },
    include: {
      ingatlan: { select: { megnevezes: true } },
      berlok: { select: { berloId: true, nev: true }, orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
      elofizetesek: { include: TELJES, orderBy: [{ kezdete: "asc" }, { id: "asc" }] },
    },
    orderBy: [{ letrehozva: "asc" }, { id: "asc" }],
  });

  return jogviszonyok.flatMap((jogviszony) =>
    jogviszony.elofizetesek.map((sor) =>
      nezette(sor, jogviszony.id, jogviszony.ingatlan.megnevezes, jogviszony.berlok),
    ),
  );
}

export type FelvetelHiba = Kifogas | "nincs_jogosultsag";

export async function elofizetestFelvesz(
  tulajdonosId: string,
  bemenet: Bevitel & {
    jogviszonyId: string;
    fajta: string;
    szolgaltato: string;
    elofizeto: string;
  },
): Promise<FelvetelHiba | null> {
  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: bemenet.jogviszonyId, ingatlan: { tulajdonosId } },
    select: { id: true },
  });
  if (!jogviszony) return "nincs_jogosultsag";

  const kifogas = ellenoriz(bemenet);
  if (kifogas) return kifogas;

  await prisma.elofizetes.create({
    data: {
      jogviszonyId: jogviszony.id,
      fajta: bemenet.fajta,
      megnevezes: bemenet.megnevezes.trim(),
      szolgaltato: bemenet.szolgaltato.trim() || null,
      elofizeto: bemenet.elofizeto,
      haviDijFt: bemenet.haviDijFt,
      kezdete: bemenet.kezdete,
      vege: bemenet.vege,
    },
  });
  return null;
}

/**
 * Megszüntetés: dátumot kap, nem törlést.
 *
 * Törölni nem lehet, mert a lefutott hónapok előírásai mögött ez az előfizetés
 * áll, és a bérlő már ki is fizette őket. A megszűnés napja után nem írunk elő
 * többet, a múlthoz viszont nem nyúlunk — ugyanaz a szabály, mint a jogviszony
 * lezárásánál.
 */
export async function elofizetestMegszuntet(
  tulajdonosId: string,
  elofizetesId: string,
  nap: Date,
): Promise<boolean> {
  const eredmeny = await prisma.elofizetes.updateMany({
    where: {
      id: elofizetesId,
      jogviszony: { ingatlan: { tulajdonosId } },
      vege: null,
    },
    data: { vege: nap },
  });
  return eredmeny.count > 0;
}

export type NyilatkozatHiba = "nincs_jogosultsag" | "mar_nyilatkozott" | "nincs_indoklas";

export async function nyilatkozik(
  berloId: string,
  elofizetesId: string,
  allapot: "jovahagyva" | "kifogasolt",
  indoklas: string,
): Promise<NyilatkozatHiba | null> {
  const elofizetes = await prisma.elofizetes.findFirst({
    where: { id: elofizetesId, jogviszony: { berlok: { some: { berloId } } } },
    include: { jovahagyasok: { where: { berloId } } },
  });
  if (!elofizetes) return "nincs_jogosultsag";
  if (elofizetes.jovahagyasok.length > 0) return "mar_nyilatkozott";
  // Kifogás indoklás nélkül nincs: abból a bérbeadó nem tud kiindulni.
  if (allapot === "kifogasolt" && indoklas.trim().length === 0) return "nincs_indoklas";

  await prisma.elofizetesJovahagyas.create({
    data: {
      elofizetesId,
      berloId,
      allapot,
      indoklas: allapot === "kifogasolt" ? indoklas.trim() : null,
    },
  });
  return null;
}
