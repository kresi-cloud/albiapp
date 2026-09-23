/**
 * A beszélgetések adatbázis-oldala.
 *
 * Minden lekérdezés a belépett felhasználóból indul, és a jogviszonyon át szűr:
 * bérbeadónál az ingatlan tulajdonosára, bérlőnél a saját jogviszonyaira. Az
 * űrlapból érkező azonosítót sosem hisszük el magától — a beszélgetés
 * azonosítója nem titok, csak azonosító.
 */

import type { Prisma } from "@/generated/prisma/client";
import {
  archivalt,
  beszelgetesNeve,
  elonezet,
  fajtaja,
  ugyanazATarsasag,
  uzenetetEllenoriz,
  type Resztvevo,
  type Uzenetsor,
} from "@/domain/beszelgetes";
import { prisma } from "@/lib/db";
import { szerepe } from "@/lib/munkamenet";

export type Ki = { id: string; szerep: "berbeado" | "berlo" };

export type BeszelgetesNezet = {
  id: string;
  jogviszonyId: string;
  /** Melyik bérleményről szól: egy bérbeadónak több szála lesz, és keverednének. */
  ingatlanNev: string;
  nev: string;
  fajta: ReturnType<typeof fajtaja>;
  resztvevok: Resztvevo[];
  jogviszonyVege: Date | null;
  archivalt: boolean;
  utolsoUzenet: Date;
  elonezet: string;
  darab: number;
};

/** Egy jogviszony, amiben a felhasználó benne van, a többi taggal együtt. */
export type JogviszonyTarsasag = {
  jogviszonyId: string;
  ingatlanNev: string;
  vege: Date | null;
  /** Archivált jogviszonyban nem indul új beszélgetés, ezért a választóból is kimarad. */
  archivalt: boolean;
  resztvevok: Resztvevo[];
};

/**
 * Melyik jogviszonyokban van benne a felhasználó, és kik a többiek.
 *
 * Ez az egyetlen hely, ahol eldől, ki kivel beszélhet. A fiók nélküli bérlő
 * kimarad: neki nincs hová írni, és ezt a felület ki is mondja.
 */
export async function tarsasagai(ki: Ki, most: Date): Promise<JogviszonyTarsasag[]> {
  const jogviszonyok = await prisma.jogviszony.findMany({
    where:
      ki.szerep === "berbeado"
        ? { ingatlan: { tulajdonosId: ki.id } }
        : { berlok: { some: { berloId: ki.id } } },
    include: {
      ingatlan: { include: { tulajdonos: true } },
      berlok: { include: { berlo: true }, orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
    },
    orderBy: [{ kezdete: "desc" }, { id: "desc" }],
  });

  return jogviszonyok.map((jogviszony) => {
    const resztvevok: Resztvevo[] = [
      {
        felhasznaloId: jogviszony.ingatlan.tulajdonos.id,
        nev: jogviszony.ingatlan.tulajdonos.nev,
        szerep: "berbeado" as const,
      },
      ...jogviszony.berlok
        .filter((berlo) => berlo.berlo !== null)
        .map((berlo) => ({
          felhasznaloId: berlo.berlo!.id,
          nev: berlo.berlo!.nev,
          szerep: szerepe(berlo.berlo!),
        })),
    ];

    return {
      jogviszonyId: jogviszony.id,
      ingatlanNev: jogviszony.ingatlan.megnevezes,
      vege: jogviszony.vege,
      archivalt: archivalt(jogviszony.vege, most),
      resztvevok,
    };
  });
}

function nezette(
  beszelgetes: {
    id: string;
    jogviszonyId: string;
    utolsoUzenet: Date;
    resztvevok: { felhasznalo: { id: string; nev: string; szerep: string } }[];
    uzenetek: { szoveg: string }[];
    _count: { uzenetek: number };
    jogviszony: { vege: Date | null; ingatlan: { megnevezes: string } };
  },
  ki: Ki,
  most: Date,
): BeszelgetesNezet {
  const resztvevok: Resztvevo[] = beszelgetes.resztvevok.map((tag) => ({
    felhasznaloId: tag.felhasznalo.id,
    nev: tag.felhasznalo.nev,
    szerep: szerepe(tag.felhasznalo),
  }));

  return {
    id: beszelgetes.id,
    jogviszonyId: beszelgetes.jogviszonyId,
    ingatlanNev: beszelgetes.jogviszony.ingatlan.megnevezes,
    nev: beszelgetesNeve(resztvevok, ki.id),
    fajta: fajtaja(resztvevok),
    resztvevok,
    jogviszonyVege: beszelgetes.jogviszony.vege,
    archivalt: archivalt(beszelgetes.jogviszony.vege, most),
    utolsoUzenet: beszelgetes.utolsoUzenet,
    elonezet: elonezet(beszelgetes.uzenetek[0]?.szoveg ?? ""),
    darab: beszelgetes._count.uzenetek,
  };
}

// `satisfies` és nem `as const`: az `as const` a rendezési tömböket is
// readonly-vá teszi, a Prisma pedig azt nem fogadja el. Így a literálok
// megmaradnak — a származtatott típusok ebből jönnek —, a tömbök viszont nem.
const TELJES = {
  resztvevok: { include: { felhasznalo: true } },
  uzenetek: { orderBy: [{ kuldve: "desc" }, { id: "desc" }], take: 1 },
  _count: { select: { uzenetek: true } },
  jogviszony: { include: { ingatlan: true } },
} satisfies Prisma.BeszelgetesInclude;

/**
 * Kié a beszélgetés. A résztvevői sor egymagában nem elég: a jogviszonyról
 * levett bérlő résztvevő marad, a bérlemény ügyei viszont már nem rá
 * tartoznak, és a szál addigi üzeneteit is tovább olvasná. Ezért a mostani
 * tartozást is kérjük — a bérbeadónál a tulajdont, a bérlőnél a bérlősort.
 */
function ove(ki: Ki) {
  return {
    resztvevok: { some: { felhasznaloId: ki.id } },
    jogviszony:
      ki.szerep === "berbeado"
        ? { ingatlan: { tulajdonosId: ki.id } }
        : { berlok: { some: { berloId: ki.id } } },
  };
}

/** A felhasználó összes beszélgetése, a legfrissebbel elöl. */
export async function beszelgetesei(ki: Ki, most: Date): Promise<BeszelgetesNezet[]> {
  const sorok = await prisma.beszelgetes.findMany({
    where: ove(ki),
    include: TELJES,
    orderBy: [{ utolsoUzenet: "desc" }, { id: "desc" }],
  });

  return sorok.map((sor) => nezette(sor, ki, most));
}

/**
 * Egy beszélgetés a benne lévő üzenetekkel. `null`, ha a felhasználó nem
 * résztvevője: nem azt mondjuk meg, hogy létezik, csak azt, hogy nem az övé.
 */
export async function beszelgetes(
  ki: Ki,
  beszelgetesId: string,
  most: Date,
): Promise<{ fej: BeszelgetesNezet; uzenetek: Uzenetsor[] } | null> {
  const sor = await prisma.beszelgetes.findFirst({
    where: { id: beszelgetesId, ...ove(ki) },
    include: TELJES,
  });
  if (!sor) return null;

  const uzenetek = await prisma.beszelgetesUzenet.findMany({
    where: { beszelgetesId },
    include: { szerzo: true },
    orderBy: [{ kuldve: "asc" }, { id: "asc" }],
  });

  return {
    fej: nezette(sor, ki, most),
    uzenetek: uzenetek.map((uzenet) => ({
      id: uzenet.id,
      szerzoId: uzenet.szerzoId,
      szerzoNev: uzenet.szerzo.nev,
      szoveg: uzenet.szoveg,
      kuldve: uzenet.kuldve,
    })),
  };
}

export type KuldesHiba =
  | "nincs_jogosultsag"
  | "archivalt"
  | "nincs_cimzett"
  | "ures"
  | "hosszu";

/**
 * Üzenet küldése egy meglévő szálba.
 *
 * A jogosultságot a résztvevői sor adja, nem az űrlap. Az archivált szálba
 * írást itt tiltjuk, nem a felületen: a gomb elrejtése nem védelem.
 */
export async function uzenetetKuld(
  ki: Ki,
  beszelgetesId: string,
  szoveg: string,
  most: Date,
): Promise<KuldesHiba | null> {
  const kifogas = uzenetetEllenoriz(szoveg);
  if (kifogas) return kifogas;

  const sor = await prisma.beszelgetes.findFirst({
    where: { id: beszelgetesId, ...ove(ki) },
    include: { jogviszony: true },
  });
  if (!sor) return "nincs_jogosultsag";
  if (archivalt(sor.jogviszony.vege, most)) return "archivalt";

  await prisma.$transaction([
    prisma.beszelgetesUzenet.create({
      data: { beszelgetesId, szerzoId: ki.id, szoveg: szoveg.trim() },
    }),
    prisma.beszelgetes.update({
      where: { id: beszelgetesId },
      data: { utolsoUzenet: new Date() },
    }),
  ]);
  return null;
}

/**
 * Új beszélgetés — de csak az első üzenettel együtt.
 *
 * Ha ugyanezzel a társasággal már van szál ebben a jogviszonyban, abba írunk.
 * Máskülönben aki kétszer ír ugyanannak a két embernek, két együzenetes szálat
 * kapna, és a másodikban nem látná, mit beszéltek az elsőben.
 *
 * Visszaadja a beszélgetés azonosítóját, hogy a hívó rá tudjon navigálni.
 */
export async function beszelgetestIndit(
  ki: Ki,
  jogviszonyId: string,
  cimzettek: string[],
  szoveg: string,
  most: Date,
): Promise<{ hiba: KuldesHiba } | { beszelgetesId: string }> {
  const kifogas = uzenetetEllenoriz(szoveg);
  if (kifogas) return { hiba: kifogas };

  const tarsasagok = await tarsasagai(ki, most);
  const tarsasag = tarsasagok.find((sor) => sor.jogviszonyId === jogviszonyId);
  if (!tarsasag) return { hiba: "nincs_jogosultsag" };
  if (tarsasag.archivalt) return { hiba: "archivalt" };

  // A címzettek nem az űrlapból nyernek jogosultságot: csak az számít, aki
  // ennek a jogviszonynak tényleg a tagja, és van fiókja.
  const ervenyes = cimzettek.filter((id) =>
    tarsasag.resztvevok.some((tag) => tag.felhasznaloId === id && tag.felhasznaloId !== ki.id),
  );
  if (ervenyes.length === 0) return { hiba: "nincs_cimzett" };

  const tagok = [ki.id, ...ervenyes];

  const meglevok = await prisma.beszelgetes.findMany({
    where: { jogviszonyId, ...ove(ki) },
    include: { resztvevok: true },
  });
  const meglevo = meglevok.find((sor) =>
    ugyanazATarsasag(
      sor.resztvevok.map((tag) => tag.felhasznaloId),
      tagok,
    ),
  );

  if (meglevo) {
    const hiba = await uzenetetKuld(ki, meglevo.id, szoveg, most);
    return hiba ? { hiba } : { beszelgetesId: meglevo.id };
  }

  const uj = await prisma.beszelgetes.create({
    data: {
      jogviszonyId,
      resztvevok: { create: tagok.map((felhasznaloId) => ({ felhasznaloId })) },
      uzenetek: { create: [{ szerzoId: ki.id, szoveg: szoveg.trim() }] },
    },
  });
  return { beszelgetesId: uj.id };
}

/** Hány olyan beszélgetése van, amiben az utolsó szó nem az övé. */
export async function valaszraVaroDarab(ki: Ki): Promise<number> {
  const sorok = await prisma.beszelgetes.findMany({
    where: ove(ki),
    include: { uzenetek: { orderBy: [{ kuldve: "desc" }, { id: "desc" }], take: 1 } },
  });
  return sorok.filter((sor) => sor.uzenetek[0] && sor.uzenetek[0].szerzoId !== ki.id).length;
}
