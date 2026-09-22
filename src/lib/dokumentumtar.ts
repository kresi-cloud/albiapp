/**
 * A dokumentumtár betöltése. Négy tábla, egy lista: a jogosultság itt dől el,
 * az összefésülés és a szűrés a domainben.
 */

import { prisma } from "@/lib/db";
import {
  berloDokumentumai,
  dokumentumtar,
  type Dokumentum,
  type TarJogviszony,
} from "@/domain/dokumentumtar";
import { idoszakCimke } from "@/domain/igazolas";
import { FAJTA_NEVE } from "@/domain/jegyzokonyv";
import { nevsor } from "@/domain/szerzodes";

const BETOLTES = {
  ingatlan: true,
  berlok: {
    orderBy: { sorrend: "asc" },
    include: { igazolasok: { orderBy: { kiallitva: "desc" } } },
  },
  szerzodesek: { orderBy: { letrehozva: "desc" } },
  jegyzokonyvek: { orderBy: { idopont: "desc" } },
  elszamolasok: { orderBy: { idoszakVege: "desc" } },
} as const;

type Betoltott = Awaited<
  ReturnType<typeof prisma.jogviszony.findMany<{ include: typeof BETOLTES }>>
>[number];

/**
 * `sajatBerloId` esetén csak annak a bérlőnek az igazolásai kerülnek bele. Az
 * igazolás névre szól, és a befizetést is nevesíti, ezért a lakótárs nem látja.
 */
function tarra(jogviszony: Betoltott, sajatBerloId?: string): TarJogviszony {
  return {
    id: jogviszony.id,
    cimke: jogviszony.ingatlan.megnevezes,
    szerzodesek: jogviszony.szerzodesek.map((szerzodes) => ({
      id: szerzodes.id,
      megnevezes: szerzodes.megnevezes,
      allapot: szerzodes.allapot,
      veglegesitve: szerzodes.veglegesitve,
      letrehozva: szerzodes.letrehozva,
    })),
    jegyzokonyvek: jogviszony.jegyzokonyvek.map((jegyzokonyv) => ({
      id: jegyzokonyv.id,
      fajtaNeve: FAJTA_NEVE[jegyzokonyv.fajta] ?? jegyzokonyv.fajta,
      idopont: jegyzokonyv.idopont,
      allapot: jegyzokonyv.allapot,
      veglegesitve: jegyzokonyv.veglegesitve,
    })),
    igazolasok: jogviszony.berlok
      .filter((berlo) => sajatBerloId === undefined || berlo.berloId === sajatBerloId)
      .flatMap((berlo) =>
        berlo.igazolasok.map((igazolas) => ({
          id: igazolas.id,
          berloNev: berlo.nev,
          idoszakCimke: idoszakCimke(igazolas.idoszak),
          osszegFt: igazolas.osszegFt,
          kiallitva: igazolas.kiallitva,
        })),
      ),
    elszamolasok: jogviszony.elszamolasok.map((elszamolas) => ({
      id: elszamolas.id,
      idoszakKezdete: elszamolas.idoszakKezdete,
      idoszakVege: elszamolas.idoszakVege,
      allapot: elszamolas.allapot,
      osszegFt: elszamolas.osszegFt,
      kiadva: elszamolas.kiadva,
    })),
  };
}

export async function berbeadoTara(berbeadoId: string): Promise<Dokumentum[]> {
  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId: berbeadoId } },
    include: BETOLTES,
    orderBy: { letrehozva: "asc" },
  });
  return dokumentumtar(jogviszonyok.map((jogviszony) => tarra(jogviszony)));
}

/** A bérlő a saját jogviszonyainak kiadott okiratait látja, tervezetet nem. */
export async function berloTara(berloId: string): Promise<Dokumentum[]> {
  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { berlok: { some: { berloId } } },
    include: BETOLTES,
    orderBy: { letrehozva: "asc" },
  });
  return berloDokumentumai(
    dokumentumtar(jogviszonyok.map((jogviszony) => tarra(jogviszony, berloId))),
  );
}

/**
 * Egy véglegesített szerződés vagy jegyzőkönyv szövege a bérlőnek. Tervezetet
 * nem ad vissza: amíg nincs véglegesítve, a szöveg még változhat.
 */
export async function berloiIratSzovege(
  fajta: "szerzodes" | "jegyzokonyv",
  id: string,
  berloId: string,
): Promise<string | null> {
  const szures = {
    id,
    allapot: "veglegesitve",
    jogviszony: { berlok: { some: { berloId } } },
  } as const;

  const irat =
    fajta === "szerzodes"
      ? await prisma.szerzodes.findFirst({ where: szures, select: { veglegesSzoveg: true } })
      : await prisma.jegyzokonyv.findFirst({ where: szures, select: { veglegesSzoveg: true } });

  return irat?.veglegesSzoveg ?? null;
}

export type ElszamolasIratAdat = {
  ingatlanMegnevezes: string;
  ingatlanCim: string;
  berlokNeve: string;
  idoszakKezdete: Date;
  idoszakVege: Date;
  tetelek: {
    megnevezes: string;
    mennyiseg: number | null;
    mertekegyseg: string | null;
    reszletezes: string;
    osszegFt: number;
  }[];
  osszegFt: number;
};

/**
 * Egy kiadott elszámolás letöltéshez. Tervezetet nem adunk ki: az még változhat,
 * és a bérlő kezében lévő papírnak egyeznie kell azzal, amit a felületen lát.
 */
export async function elszamolasIrat(
  elszamolasId: string,
  nezo: { id: string; szerep: string },
): Promise<ElszamolasIratAdat | null> {
  const elszamolas = await prisma.elszamolas.findFirst({
    where: {
      id: elszamolasId,
      allapot: { not: "tervezet" },
      jogviszony:
        nezo.szerep === "berlo"
          ? { berlok: { some: { berloId: nezo.id } } }
          : { ingatlan: { tulajdonosId: nezo.id } },
    },
    include: {
      tetelek: { orderBy: { sorrend: "asc" } },
      jogviszony: {
        include: { ingatlan: true, berlok: { orderBy: { sorrend: "asc" } } },
      },
    },
  });
  if (!elszamolas) return null;

  return {
    ingatlanMegnevezes: elszamolas.jogviszony.ingatlan.megnevezes,
    ingatlanCim: elszamolas.jogviszony.ingatlan.cim,
    berlokNeve: nevsor(elszamolas.jogviszony.berlok.map((berlo) => berlo.nev)),
    idoszakKezdete: elszamolas.idoszakKezdete,
    idoszakVege: elszamolas.idoszakVege,
    tetelek: elszamolas.tetelek.map((tetel) => ({
      megnevezes: tetel.megnevezes,
      mennyiseg: tetel.mennyiseg,
      mertekegyseg: tetel.mertekegyseg,
      reszletezes: tetel.reszletezes,
      osszegFt: tetel.osszegFt,
    })),
    osszegFt: elszamolas.osszegFt,
  };
}
