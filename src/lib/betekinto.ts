/**
 * Betekintő linkek betöltése és kiadása.
 *
 * A jogosultság itt dől el: a bérlő csak a saját jogviszonyára adhat ki
 * betekintőt, és csak a sajátját vonhatja vissza. A nyilvános nézet nem kér
 * belépést — a token maga a jogosultság —, ezért minden lekérdezés ellenőrzi,
 * hogy a link él-e, és csak azt adja vissza, ami a nézetre tartozik.
 */

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  ELETTARTAM_NAPOK,
  allapota,
  lejarat,
  osszesit,
  telepules,
  type Allapot,
  type BetekintoTetel,
  type Osszesites,
} from "@/domain/betekinto";

export type BetekintoSor = {
  id: string;
  token: string;
  cel: string;
  osszegetMutat: boolean;
  lejar: Date;
  letrehozva: Date;
  allapot: Allapot;
  megnyitasok: number;
  utolsoMegnyitas: Date | null;
};

export type NyilvanosNezet = {
  cel: string;
  telepules: string | null;
  jogviszonyKezdete: Date;
  jogviszonyEl: boolean;
  berloNeve: string;
  berletiDijFt: number | null;
  osszesites: Osszesites;
  kiadva: Date;
  lejar: Date;
};

function token(): string {
  return randomBytes(24).toString("base64url");
}

/** Amit a bérlő lát a saját linkjeiről. */
export async function berloBetekintoi(berloId: string, most = new Date()): Promise<BetekintoSor[]> {
  const sorok = await prisma.betekinto.findMany({
    where: { berloId },
    orderBy: { letrehozva: "desc" },
    include: { megnyitasok: { orderBy: { mikor: "desc" }, take: 1 }, _count: { select: { megnyitasok: true } } },
  });

  return sorok.map((sor) => ({
    id: sor.id,
    token: sor.token,
    cel: sor.cel,
    osszegetMutat: sor.osszegetMutat,
    lejar: sor.lejar,
    letrehozva: sor.letrehozva,
    allapot: allapota(sor, most),
    megnyitasok: sor._count.megnyitasok,
    utolsoMegnyitas: sor.megnyitasok[0]?.mikor ?? null,
  }));
}

/** A bérlő jogviszonyai, amikre betekintőt adhat ki. */
export async function berloJogviszonyai(berloId: string) {
  const sorok = await prisma.jogviszonyBerlo.findMany({
    where: { berloId },
    include: { jogviszony: { include: { ingatlan: true } } },
    orderBy: { letrehozva: "asc" },
  });

  return sorok.map((sor) => ({
    id: sor.jogviszonyId,
    // A bérlő a saját nézetében látja a pontos címet: az a saját lakása.
    cimke: sor.jogviszony.ingatlan.megnevezes,
  }));
}

export async function betekintotKeszit(bemenet: {
  berloId: string;
  jogviszonyId: string;
  cel: string;
  napok: number;
  osszegetMutat: boolean;
  most?: Date;
}): Promise<string | null> {
  const most = bemenet.most ?? new Date();
  const sajat = await prisma.jogviszonyBerlo.findFirst({
    where: { berloId: bemenet.berloId, jogviszonyId: bemenet.jogviszonyId },
  });
  if (!sajat) return null;

  const napok = (ELETTARTAM_NAPOK as readonly number[]).includes(bemenet.napok)
    ? bemenet.napok
    : ELETTARTAM_NAPOK[1];

  const betekinto = await prisma.betekinto.create({
    data: {
      jogviszonyId: bemenet.jogviszonyId,
      berloId: bemenet.berloId,
      token: token(),
      cel: bemenet.cel,
      osszegetMutat: bemenet.osszegetMutat,
      lejar: lejarat(most, napok),
    },
  });
  return betekinto.token;
}

export async function betekintotVisszavon(berloId: string, id: string): Promise<boolean> {
  const eredmeny = await prisma.betekinto.updateMany({
    where: { id, berloId, visszavonva: null },
    data: { visszavonva: new Date() },
  });
  return eredmeny.count > 0;
}

/**
 * A nyilvános nézet adata. Lejárt vagy visszavont linkre `null` jön, és a
 * megnyitást csak akkor jegyezzük fel, ha a nézet tényleg kiadásra került.
 */
export async function nyilvanosNezet(
  nyersToken: string,
  most = new Date(),
): Promise<NyilvanosNezet | null> {
  const betekinto = await prisma.betekinto.findUnique({
    where: { token: nyersToken },
    include: {
      berlo: true,
      jogviszony: {
        include: {
          ingatlan: true,
          eloirtTetelek: { include: { egyeztetes: true } },
        },
      },
    },
  });
  if (!betekinto || allapota(betekinto, most) !== "elo") return null;

  const tetelek: BetekintoTetel[] = betekinto.jogviszony.eloirtTetelek
    .filter((tetel) => tetel.tipus === "berleti_dij" && tetel.esedekesseg <= most)
    .map((tetel) => ({
      idoszak: tetel.idoszak,
      allapot: (tetel.egyeztetes?.allapot ?? "hianyzik") as BetekintoTetel["allapot"],
      keses: tetel.egyeztetes?.keses ?? 0,
      osszegFt: tetel.osszegFt,
    }));

  await prisma.betekintoMegnyitas.create({ data: { betekintoId: betekinto.id } });

  return {
    cel: betekinto.cel,
    telepules: telepules(betekinto.jogviszony.ingatlan.cim),
    jogviszonyKezdete: betekinto.jogviszony.kezdete,
    jogviszonyEl: betekinto.jogviszony.statusz === "elo",
    berloNeve: betekinto.berlo.nev,
    berletiDijFt: betekinto.osszegetMutat ? betekinto.jogviszony.berletiDijFt : null,
    osszesites: osszesit(tetelek),
    kiadva: betekinto.letrehozva,
    lejar: betekinto.lejar,
  };
}
