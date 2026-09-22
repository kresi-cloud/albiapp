/**
 * Hibabejelentések betöltése. A jogosultság itt dől el: a bérbeadó a saját
 * ingatlanjainak bejelentéseit látja, a bérlő a saját jogviszonyaiét.
 */

import { prisma } from "@/lib/db";
import { nevsor } from "@/domain/szerzodes";
import type { HibaAllapot, HibaSurgosseg, HibaTeendohoz, Ok, Terulet } from "@/domain/hibabejelentes";

export type HibaUzenetNezet = {
  id: string;
  szerzoNev: string;
  sajat: boolean;
  szoveg: string;
  letrehozva: Date;
};

export type HibaNezet = {
  id: string;
  jogviszonyId: string;
  jogviszonyCimke: string;
  berlokNeve: string;
  bejelentoNev: string;
  targy: string;
  leiras: string;
  terulet: Terulet;
  ok: Ok;
  surgosseg: HibaSurgosseg;
  allapot: HibaAllapot;
  viseloFel: "berbeado" | "berlo" | "megosztott" | null;
  bejelentve: Date;
  elharitva: Date | null;
  lezarva: Date | null;
  uzenetek: HibaUzenetNezet[];
};

const BETOLTES = {
  bejelento: true,
  uzenetek: { orderBy: { letrehozva: "asc" }, include: { szerzo: true } },
  jogviszony: {
    include: {
      ingatlan: true,
      berlok: { orderBy: { sorrend: "asc" } },
    },
  },
} as const;

type Betoltott = Awaited<
  ReturnType<typeof prisma.hibabejelentes.findMany<{ include: typeof BETOLTES }>>
>[number];

function nezette(hiba: Betoltott, nezoId: string): HibaNezet {
  return {
    id: hiba.id,
    jogviszonyId: hiba.jogviszonyId,
    jogviszonyCimke: hiba.jogviszony.ingatlan.megnevezes,
    berlokNeve: nevsor(hiba.jogviszony.berlok.map((berlo) => berlo.nev)),
    bejelentoNev: hiba.bejelento.nev,
    targy: hiba.targy,
    leiras: hiba.leiras,
    terulet: hiba.terulet as Terulet,
    ok: hiba.ok as Ok,
    surgosseg: hiba.surgosseg as HibaSurgosseg,
    allapot: hiba.allapot as HibaAllapot,
    viseloFel: (hiba.viseloFel as HibaNezet["viseloFel"]) ?? null,
    bejelentve: hiba.bejelentve,
    elharitva: hiba.elharitva,
    lezarva: hiba.lezarva,
    uzenetek: hiba.uzenetek.map((uzenet) => ({
      id: uzenet.id,
      szerzoNev: uzenet.szerzo.nev,
      sajat: uzenet.szerzoId === nezoId,
      szoveg: uzenet.szoveg,
      letrehozva: uzenet.letrehozva,
    })),
  };
}

export async function berbeadoHibai(berbeadoId: string): Promise<HibaNezet[]> {
  const sorok = await prisma.hibabejelentes.findMany({
    where: { jogviszony: { ingatlan: { tulajdonosId: berbeadoId } } },
    include: BETOLTES,
    orderBy: { bejelentve: "desc" },
  });
  return sorok.map((hiba) => nezette(hiba, berbeadoId));
}

export async function berloHibai(berloId: string): Promise<HibaNezet[]> {
  const sorok = await prisma.hibabejelentes.findMany({
    where: { jogviszony: { berlok: { some: { berloId } } } },
    include: BETOLTES,
    orderBy: { bejelentve: "desc" },
  });
  return sorok.map((hiba) => nezette(hiba, berloId));
}

/** A teendőkhöz elég a nyitott hibák váza; a beszélgetést nem töltjük be hozzá. */
export async function nyitottHibak(
  jogviszonyIdk: string[],
): Promise<HibaTeendohoz[]> {
  if (jogviszonyIdk.length === 0) return [];

  const sorok = await prisma.hibabejelentes.findMany({
    where: {
      jogviszonyId: { in: jogviszonyIdk },
      allapot: { notIn: ["lezarva", "elutasitva"] },
    },
    select: {
      id: true,
      jogviszonyId: true,
      targy: true,
      surgosseg: true,
      allapot: true,
      bejelentve: true,
    },
  });

  return sorok.map((hiba) => ({
    id: hiba.id,
    jogviszonyId: hiba.jogviszonyId,
    targy: hiba.targy,
    surgosseg: hiba.surgosseg as HibaSurgosseg,
    allapot: hiba.allapot as HibaAllapot,
    bejelentve: hiba.bejelentve,
  }));
}

/**
 * A bérbeadó elérhetősége, amit a bérlő veszélyhelyzetnél lát. Csak a nevet és a
 * kapcsolattartási adatot adjuk ki, semmi mást a bérbeadói adatlapról.
 */
export async function berbeadoElerhetosege(
  jogviszonyId: string,
): Promise<{ nev: string; email: string; telefon: string | null } | null> {
  const jogviszony = await prisma.jogviszony.findUnique({
    where: { id: jogviszonyId },
    include: { ingatlan: { include: { tulajdonos: { include: { berbeadoiAdatok: true } } } } },
  });
  if (!jogviszony) return null;

  const tulajdonos = jogviszony.ingatlan.tulajdonos;
  return {
    nev: tulajdonos.nev,
    email: tulajdonos.email,
    telefon: tulajdonos.berbeadoiAdatok?.telefon ?? null,
  };
}
