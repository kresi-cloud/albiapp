/**
 * A kétnyelvű példány kérdése, mindkét fél oldaláról.
 *
 * Egy helyen, mert a kérdés ugyanaz: a bérbeadó a szerződés lapján látja, a
 * bérlő a dokumentumtárában, és két külön összeállításból előbb-utóbb az
 * lenne, hogy a két lap más állapotot mutat ugyanarra a szerződésre.
 */

import type { Prisma } from "@/generated/prisma/client";
import type { Adatok } from "@/domain/nyelv";
import { prisma } from "@/lib/db";
import {
  allapota,
  kifogasok,
  kikreVarunk,
  type KetnyelvuAllapot,
  type KetnyelvuCimkek,
  type Nyilatkozat,
} from "@/domain/szerzodes-ketnyelvu";

export type KetnyelvuNezet = {
  szerzodesId: string;
  megnevezes: string;
  ingatlan: string;
  tervezet: boolean;
  allapot: KetnyelvuAllapot;
  /** Akiket megkérdezünk: a bérbeadó és minden fiókkal rendelkező bérlő. */
  kerdezettek: { id: string; nev: string }[];
  nyilatkozatok: Nyilatkozat[];
  /** Akiket nem lehet megkérdezni, mert nincs fiókjuk. Nevek. */
  fioktalanok: string[];
  sajatNyilatkozat: Nyilatkozat | null;
};

// `satisfies` és nem `as const`: az `as const` a rendezési tömböket is
// readonly-vá teszi, a Prisma pedig azt nem fogadja el.
const BETOLTES = {
  nyelvNyilatkozatok: true,
  jogviszony: {
    include: {
      ingatlan: { select: { megnevezes: true, tulajdonosId: true } },
      berlok: { orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
    },
  },
} satisfies Prisma.SzerzodesInclude;

type Betoltott = Awaited<
  ReturnType<typeof prisma.szerzodes.findFirst<{ include: typeof BETOLTES }>>
>;

async function nezette(
  szerzodes: NonNullable<Betoltott>,
  felhasznaloId: string,
): Promise<KetnyelvuNezet> {
  const tulajdonos = await prisma.felhasznalo.findUnique({
    where: { id: szerzodes.jogviszony.ingatlan.tulajdonosId },
    select: { id: true, nev: true },
  });

  const kerdezettek = [
    ...(tulajdonos ? [{ id: tulajdonos.id, nev: tulajdonos.nev }] : []),
    ...szerzodes.jogviszony.berlok
      .filter((berlo) => berlo.berloId !== null)
      .map((berlo) => ({ id: berlo.berloId as string, nev: berlo.nev })),
  ];

  const nyilatkozatok: Nyilatkozat[] = szerzodes.nyelvNyilatkozatok.map((sor) => ({
    felhasznaloId: sor.felhasznaloId,
    tamogatja: sor.tamogatja,
    indoklas: sor.indoklas,
  }));

  return {
    szerzodesId: szerzodes.id,
    megnevezes: szerzodes.megnevezes,
    ingatlan: szerzodes.jogviszony.ingatlan.megnevezes,
    tervezet: szerzodes.allapot === "tervezet",
    allapot: allapota(
      kerdezettek.map((fel) => fel.id),
      nyilatkozatok,
    ),
    kerdezettek,
    nyilatkozatok,
    fioktalanok: szerzodes.jogviszony.berlok
      .filter((berlo) => berlo.berloId === null)
      .map((berlo) => berlo.nev),
    sajatNyilatkozat:
      nyilatkozatok.find((sor) => sor.felhasznaloId === felhasznaloId) ?? null,
  };
}

/** Egy szerződés kérdése. A jogosultság a jogviszonyból jön, nem az űrlapból. */
export async function ketnyelvuNezet(
  szerzodesId: string,
  felhasznaloId: string,
): Promise<KetnyelvuNezet | null> {
  const szerzodes = await prisma.szerzodes.findFirst({
    where: {
      id: szerzodesId,
      OR: [
        { jogviszony: { ingatlan: { tulajdonosId: felhasznaloId } } },
        { jogviszony: { berlok: { some: { berloId: felhasznaloId } } } },
      ],
    },
    include: BETOLTES,
  });
  if (!szerzodes) return null;
  return nezette(szerzodes, felhasznaloId);
}

/**
 * A bérlő nyitott kérdései: a tervezetben álló szerződések, amikre még
 * nyilatkoznia kell.
 *
 * A bérlő a tervezet **szövegét** továbbra sem látja — az még változhat —, de a
 * kérdésre válaszolnia kell, mert a döntésnek az aláírás előtt van értelme.
 * Ugyanaz a szándékos kivétel, mint a jegyzőkönyv fényképeinél: a megerősítés
 * akkor ér valamit, ha a véglegesítés előtt történik.
 */
export async function berloKetnyelvuKerdesei(berloId: string): Promise<KetnyelvuNezet[]> {
  const szerzodesek = await prisma.szerzodes.findMany({
    where: {
      allapot: "tervezet",
      jogviszony: { berlok: { some: { berloId } } },
    },
    include: BETOLTES,
    orderBy: [{ letrehozva: "desc" }, { id: "desc" }],
  });
  return Promise.all(szerzodesek.map((szerzodes) => nezette(szerzodes, berloId)));
}

/**
 * A bérbeadó nyitott kérdései: a tervezetben álló szerződései.
 */
export async function berbeadoKetnyelvuKerdesei(
  tulajdonosId: string,
): Promise<KetnyelvuNezet[]> {
  const szerzodesek = await prisma.szerzodes.findMany({
    where: {
      allapot: "tervezet",
      jogviszony: { ingatlan: { tulajdonosId } },
    },
    include: BETOLTES,
    orderBy: [{ letrehozva: "desc" }, { id: "desc" }],
  });
  return Promise.all(szerzodesek.map((szerzodes) => nezette(szerzodes, tulajdonosId)));
}

/**
 * A felirat-készítés is egy helyen áll, ugyanabból az okból: a bérbeadó és a
 * bérlő ugyanazt a mondatot olvassa ugyanarról az állapotról.
 */
export function ketnyelvuCimkek(
  nezet: KetnyelvuNezet,
  sz: (kulcs: string, adat?: Adatok) => string,
): KetnyelvuCimkek {
  const nevek = new Map(nezet.kerdezettek.map((fel) => [fel.id, fel.nev]));
  const varunk = kikreVarunk(
    nezet.kerdezettek.map((fel) => fel.id),
    nezet.nyilatkozatok,
  ).map((id) => nevek.get(id) ?? "");

  return {
    kerdes: sz("ketnyelvu.kerdes"),
    mindenkiSugo: sz("ketnyelvu.mindenki_sugo"),
    allapot: sz(`ketnyelvu.allapot.${nezet.allapot}`),
    varunk: varunk.length > 0 ? sz("ketnyelvu.varunk", { nev: varunk.join(", ") }) : "",
    kifogasok: kifogasok(
      nezet.kerdezettek.map((fel) => fel.id),
      nezet.nyilatkozatok,
    ).map((sor) =>
      sz("ketnyelvu.kifogas_sora", {
        nev: nevek.get(sor.felhasznaloId) ?? "",
        indoklas: sor.indoklas,
      }),
    ),
    nincsFiok: nezet.fioktalanok.map((nev) => sz("ketnyelvu.nincs_fiok", { nev })),
    sajat: !nezet.sajatNyilatkozat
      ? ""
      : nezet.sajatNyilatkozat.tamogatja
        ? sz("ketnyelvu.sajat_tamogatom")
        : sz("ketnyelvu.sajat_kifogas", { indoklas: nezet.sajatNyilatkozat.indoklas }),
    valtoztathato: sz("ketnyelvu.valtoztathato"),
    tamogatom: sz("ketnyelvu.tamogatom"),
    kifogasolom: sz("ketnyelvu.kifogasolom"),
    indoklas: sz("ketnyelvu.indoklas"),
    indoklasSugo: sz("ketnyelvu.indoklas_sugo"),
    folyamatban: sz("ketnyelvu.nyilatkozom"),
  };
}
