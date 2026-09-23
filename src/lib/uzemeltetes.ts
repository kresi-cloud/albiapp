/**
 * Az üzemeltetői lap adatai: összesítő számok, rendszerállapot, adminnapló.
 *
 * Minden lekérdezés darabszám vagy a rendszer saját állapota. Más ember adatát
 * ez a modul nem olvassa be — a névsort a `bemutatkozas` adja, és az is csak
 * nevet és szerepet.
 */

import { prisma } from "@/lib/db";
import type { Fiokmuvelet, Osszesito } from "@/domain/uzemeltetes";
import { naploMuvelete } from "@/domain/uzemeltetes";

export async function osszesito(most: Date): Promise<Osszesito> {
  const [
    berbeadok,
    berlok,
    rendszergazdak,
    letiltottFiokok,
    ingatlanok,
    eloJogviszonyok,
    lezartJogviszonyok,
    nyitottHibak,
    varoMeghivok,
    varoElofizetesek,
    varoLatogatasok,
  ] = await Promise.all([
    prisma.felhasznalo.count({ where: { szerep: "berbeado" } }),
    prisma.felhasznalo.count({ where: { szerep: "berlo" } }),
    prisma.felhasznalo.count({ where: { rendszergazda: true } }),
    prisma.felhasznalo.count({ where: { letiltva: { not: null } } }),
    prisma.ingatlan.count(),
    prisma.jogviszony.count({ where: { statusz: "elo" } }),
    prisma.jogviszony.count({ where: { statusz: "lezart" } }),
    prisma.hibabejelentes.count({ where: { allapot: { notIn: ["lezarva", "elutasitva"] } } }),
    prisma.meghivo.count({ where: { felhasznalva: null, lejar: { gt: most } } }),
    varakozoElofizetesek(),
    varakozoLatogatasok(most),
  ]);

  return {
    berbeadok,
    berlok,
    rendszergazdak,
    letiltottFiokok,
    ingatlanok,
    eloJogviszonyok,
    lezartJogviszonyok,
    nyitottHibak,
    varoMeghivok,
    varoElofizetesek,
    varoLatogatasok,
  };
}

/**
 * Élő előfizetés, amire valamelyik fiókkal rendelkező bérlő még nem
 * nyilatkozott. Fiók nélküli bérlőt nem lehet megkérdezni, tehát rá nem is
 * várunk — különben a szám sose menne nullára.
 */
async function varakozoElofizetesek(): Promise<number> {
  const elofizetesek = await prisma.elofizetes.findMany({
    where: { vege: null },
    select: {
      id: true,
      jovahagyasok: { select: { berloId: true } },
      jogviszony: { select: { berlok: { select: { berloId: true } } } },
    },
    orderBy: [{ kezdete: "asc" }, { id: "asc" }],
  });

  return elofizetesek.filter((elofizetes) => {
    const nyilatkozott = new Set(elofizetes.jovahagyasok.map((jovahagyas) => jovahagyas.berloId));
    return elofizetes.jogviszony.berlok.some(
      (berlo) => berlo.berloId !== null && !nyilatkozott.has(berlo.berloId),
    );
  }).length;
}

/** Ugyanez a bejelentett, még el nem múlt látogatásokra. */
async function varakozoLatogatasok(most: Date): Promise<number> {
  const latogatasok = await prisma.szolgaltatoiLatogatas.findMany({
    where: { lemondva: null, nap: { gte: napEleje(most) } },
    select: {
      id: true,
      valaszok: { select: { berloId: true } },
      jogviszony: { select: { berlok: { select: { berloId: true } } } },
    },
    orderBy: [{ nap: "asc" }, { id: "asc" }],
  });

  return latogatasok.filter((latogatas) => {
    const nyilatkozott = new Set(latogatas.valaszok.map((valasz) => valasz.berloId));
    return latogatas.jogviszony.berlok.some(
      (berlo) => berlo.berloId !== null && !nyilatkozott.has(berlo.berloId),
    );
  }).length;
}

function napEleje(nap: Date): Date {
  return new Date(Date.UTC(nap.getUTCFullYear(), nap.getUTCMonth(), nap.getUTCDate()));
}

export type Rendszerallapot = {
  /** Az adatbázis válaszideje egy triviális lekérdezésre, ezredmásodpercben. */
  valaszidoMs: number;
  /** Hány migráció futott le, és melyik az utolsó. */
  migraciok: number;
  utolsoMigracio: string | null;
  /** Éles vagy fejlesztői kiszolgáló. */
  eles: boolean;
};

/**
 * A rendszer saját állapota.
 *
 * A válaszidőt egy `select 1`-gyel mérjük, nem egy valódi lekérdezéssel: azt
 * akarjuk tudni, mennyi az út odáig és vissza, nem azt, hogy egy tábla mekkora.
 * A migrációk a Prisma saját táblájából jönnek — ha ez a lekérdezés elszáll,
 * inkább nem írunk ki semmit, mint hogy a lap is elszálljon: az üzemeltetőnek
 * pont akkor kell a lap, amikor baj van.
 */
export async function rendszerallapot(): Promise<Rendszerallapot> {
  const kezdet = Date.now();
  await prisma.$queryRaw`select 1`;
  const valaszidoMs = Date.now() - kezdet;

  let migraciok = 0;
  let utolsoMigracio: string | null = null;
  try {
    const sorok = await prisma.$queryRaw<{ migration_name: string }[]>`
      select migration_name from "_prisma_migrations"
      where finished_at is not null
      order by finished_at asc, migration_name asc
    `;
    migraciok = sorok.length;
    utolsoMigracio = sorok.length ? sorok[sorok.length - 1].migration_name : null;
  } catch {
    // A migrációs tábla hiányozhat (például egy `db push`-sal felhúzott
    // adatbázison). Ettől a lap többi része még igaz.
  }

  return {
    valaszidoMs,
    migraciok,
    utolsoMigracio,
    eles: process.env.NODE_ENV === "production",
  };
}

export type Naplosor = {
  id: string;
  muvelet: string;
  mikor: Date;
  adminNev: string;
  targyNev: string | null;
};

/** Az utolsó üzemeltetői műveletek. Ennél régebbiért az adatbázishoz kell nyúlni. */
export async function adminNaplo(darab = 20): Promise<Naplosor[]> {
  const sorok = await prisma.adminNaplo.findMany({
    take: darab,
    orderBy: [{ mikor: "desc" }, { id: "desc" }],
    select: {
      id: true,
      muvelet: true,
      mikor: true,
      targyId: true,
      admin: { select: { nev: true } },
    },
  });

  const targyak = await prisma.felhasznalo.findMany({
    where: { id: { in: sorok.map((sor) => sor.targyId) } },
    select: { id: true, nev: true },
    orderBy: [{ id: "asc" }],
  });
  const nevek = new Map(targyak.map((targy) => [targy.id, targy.nev]));

  return sorok.map((sor) => ({
    id: sor.id,
    muvelet: sor.muvelet,
    mikor: sor.mikor,
    adminNev: sor.admin.nev,
    targyNev: nevek.get(sor.targyId) ?? null,
  }));
}

/**
 * A fiók letiltása vagy visszaengedése, a naplósorral együtt, egy
 * tranzakcióban: napló nélküli tiltás nem történhet meg. Egy napló, ami a
 * műveletek egy részéről lemarad, rosszabb a semminél, mert hinni lehet neki.
 */
export async function fiokotAllit(
  adminId: string,
  celId: string,
  muvelet: Fiokmuvelet,
  most: Date,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.felhasznalo.update({
      where: { id: celId },
      data: { letiltva: muvelet === "letilt" ? most : null },
    });
    await tx.adminNaplo.create({
      data: { adminId, muvelet: naploMuvelete(muvelet), targyId: celId, mikor: most },
    });
  });
}
