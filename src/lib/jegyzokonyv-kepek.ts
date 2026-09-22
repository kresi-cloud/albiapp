/**
 * A jegyzőkönyvhöz tartozó fényképek tárolása és jogosultsága.
 *
 * Minden lekérdezés a jogviszonyból vezeti le, hogy ki láthatja: a bérbeadó a
 * saját ingatlanjáéit, a bérlő azokét a jogviszonyokét, amiken rajta van. A
 * kép azonosítójának ismerete önmagában semmire nem jogosít.
 *
 * Egy dologban eltér a dokumentumtár szabályától, és ez szándékos: a bérlő a
 * **tervezet** jegyzőkönyv képeit is látja. A tervezetet azért nem mutatjuk
 * meg neki, mert még változhat — a kép viszont pont attól ér valamit, hogy
 * még a véglegesítés előtt mondja meg, hogy ezt látta-e. Megerősítés nélkül
 * az album egy fél állítása maradna.
 */

import { prisma } from "@/lib/db";
import {
  allapota,
  megerositheti,
  type Kep,
  type KepAllapot,
  type Szerep,
} from "@/domain/jegyzokonyv-kepek";

export type KepNezet = Kep & {
  allapot: KepAllapot;
  tetelId: string | null;
  meretBajt: number;
  feltoltve: Date;
  /** A belépett felhasználó töltötte-e fel: törölni csak a sajátját tudja. */
  sajat: boolean;
  /** Megerősítheti-e a belépett felhasználó. */
  megerositheto: boolean;
};

type Ki = { id: string; szerep: Szerep };

const VALASZTAS = {
  id: true,
  jegyzokonyvId: true,
  tetelId: true,
  parjaId: true,
  megnevezes: true,
  meretBajt: true,
  feltoltve: true,
  feltoltoId: true,
  megerositve: true,
  kifogas: true,
  feltolto: { select: { szerep: true } },
} as const;

type Sor = {
  id: string;
  tetelId: string | null;
  parjaId: string | null;
  megnevezes: string;
  meretBajt: number;
  feltoltve: Date;
  feltoltoId: string;
  megerositve: Date | null;
  kifogas: string | null;
  feltolto: { szerep: string };
};

function nezet(sor: Sor, ki: Ki): KepNezet {
  const kep = {
    id: sor.id,
    megnevezes: sor.megnevezes,
    feltoltoSzerep: sor.feltolto.szerep as Szerep,
    megerositve: sor.megerositve,
    kifogas: sor.kifogas,
    parjaId: sor.parjaId,
  };

  return {
    ...kep,
    allapot: allapota(kep),
    tetelId: sor.tetelId,
    meretBajt: sor.meretBajt,
    feltoltve: sor.feltoltve,
    sajat: sor.feltoltoId === ki.id,
    megerositheto: megerositheti(kep, ki.szerep),
  };
}

/**
 * Hozzáfér-e a felhasználó a jegyzőkönyvhöz. A bérbeadónál a tulajdon dönt, a
 * bérlőnél az, hogy rajta van-e a jogviszonyon.
 */
async function jegyzokonyvHozzaferes(ki: Ki, jegyzokonyvId: string) {
  return prisma.jegyzokonyv.findFirst({
    where:
      ki.szerep === "berbeado"
        ? { id: jegyzokonyvId, jogviszony: { ingatlan: { tulajdonosId: ki.id } } }
        : { id: jegyzokonyvId, jogviszony: { berlok: { some: { berloId: ki.id } } } },
    select: { id: true, jogviszonyId: true, fajta: true, allapot: true },
  });
}

/** Egy jegyzőkönyv képei. A tartalmat nem olvassuk be: a listához nem kell. */
export async function kepekJegyzokonyvhoz(ki: Ki, jegyzokonyvId: string): Promise<KepNezet[]> {
  const jegyzokonyv = await jegyzokonyvHozzaferes(ki, jegyzokonyvId);
  if (!jegyzokonyv) return [];

  const sorok = await prisma.jegyzokonyvKep.findMany({
    where: { jegyzokonyvId },
    select: VALASZTAS,
    orderBy: { feltoltve: "asc" },
  });

  return sorok.map((sor) => nezet(sor, ki));
}

/**
 * A jogviszony birtokbaadáskori képei. Ezekhez köti a záró jegyzőkönyv a
 * sajátjait, és ezekből lesz a „miről kell most is képet csinálni" lista.
 */
export async function birtokbaadasiKepek(ki: Ki, jogviszonyId: string): Promise<KepNezet[]> {
  const sorok = await prisma.jegyzokonyvKep.findMany({
    where: {
      jegyzokonyv: {
        jogviszonyId,
        fajta: "birtokbaadas",
        ...(ki.szerep === "berbeado"
          ? { jogviszony: { ingatlan: { tulajdonosId: ki.id } } }
          : { jogviszony: { berlok: { some: { berloId: ki.id } } } }),
      },
    },
    select: VALASZTAS,
    orderBy: { feltoltve: "asc" },
  });

  return sorok.map((sor) => nezet(sor, ki));
}

export type MentesiHiba = "nincs_jogosultsag" | "lezart";

/**
 * Új kép. A véglegesített jegyzőkönyv albuma zárt: amit aláírtak, abba
 * utólag nem kerül be kép, és nem is tűnik el belőle.
 */
export async function kepetMent(
  ki: Ki,
  bemenet: {
    jegyzokonyvId: string;
    tetelId: string | null;
    parjaId: string | null;
    megnevezes: string;
    fajl: { nev: string; tipus: string; tartalom: Uint8Array<ArrayBuffer> };
  },
): Promise<MentesiHiba | null> {
  const jegyzokonyv = await jegyzokonyvHozzaferes(ki, bemenet.jegyzokonyvId);
  if (!jegyzokonyv) return "nincs_jogosultsag";
  if (jegyzokonyv.allapot !== "tervezet") return "lezart";

  // A tétel és a pár is ellenőrzött: az űrlapból érkező azonosítót nem
  // hisszük el magától, különben egy idegen jegyzőkönyvhöz lehetne kötni.
  const tetelId = bemenet.tetelId
    ? ((
        await prisma.jegyzokonyvTetel.findFirst({
          where: { id: bemenet.tetelId, jegyzokonyvId: bemenet.jegyzokonyvId },
          select: { id: true },
        })
      )?.id ?? null)
    : null;

  const parjaId = bemenet.parjaId
    ? ((
        await prisma.jegyzokonyvKep.findFirst({
          where: {
            id: bemenet.parjaId,
            parjaEnnek: null,
            jegyzokonyv: { jogviszonyId: jegyzokonyv.jogviszonyId, fajta: "birtokbaadas" },
          },
          select: { id: true },
        })
      )?.id ?? null)
    : null;

  await prisma.jegyzokonyvKep.create({
    data: {
      jegyzokonyvId: bemenet.jegyzokonyvId,
      tetelId,
      parjaId,
      megnevezes: bemenet.megnevezes,
      fajlNev: bemenet.fajl.nev,
      mimeTipus: bemenet.fajl.tipus,
      meretBajt: bemenet.fajl.tartalom.byteLength,
      tartalom: bemenet.fajl.tartalom,
      feltoltoId: ki.id,
    },
  });
  return null;
}

export async function kepekSzama(jegyzokonyvId: string): Promise<number> {
  return prisma.jegyzokonyvKep.count({ where: { jegyzokonyvId } });
}

/** A saját kép törlése, amíg a jegyzőkönyv tervezet. A másik félét senki. */
export async function kepetTorol(felhasznaloId: string, kepId: string): Promise<boolean> {
  const eredmeny = await prisma.jegyzokonyvKep.deleteMany({
    where: {
      id: kepId,
      feltoltoId: felhasznaloId,
      jegyzokonyv: { allapot: "tervezet" },
    },
  });
  return eredmeny.count > 0;
}

export type MegerositesiHiba = "nincs_jogosultsag" | "sajat" | "mar_dontott";

/**
 * A másik fél nyilatkozata a képről: megerősítés vagy kifogás.
 *
 * A kifogás nem törli a képet, és a megerősítés sem hitelesíti: mindkettő egy
 * fél állítása, és mindkettő ott marad a kép mellett. Aki feltöltötte, a
 * sajátjára nem bólinthat rá.
 *
 * Véglegesített jegyzőkönyvnél is megy, mert ez a nyilatkozó saját adata, és
 * az albumot nem változtatja meg.
 */
export async function kepetElbiral(
  ki: Ki,
  kepId: string,
  kifogas: string | null,
): Promise<MegerositesiHiba | null> {
  const sor = await prisma.jegyzokonyvKep.findFirst({
    where: {
      id: kepId,
      jegyzokonyv:
        ki.szerep === "berbeado"
          ? { jogviszony: { ingatlan: { tulajdonosId: ki.id } } }
          : { jogviszony: { berlok: { some: { berloId: ki.id } } } },
    },
    select: { id: true, megerositve: true, kifogas: true, feltolto: { select: { szerep: true } } },
  });
  if (!sor) return "nincs_jogosultsag";

  const kep = {
    feltoltoSzerep: sor.feltolto.szerep as Szerep,
    megerositve: sor.megerositve,
    kifogas: sor.kifogas,
  };
  if (kep.feltoltoSzerep === ki.szerep) return "sajat";
  if (!megerositheti(kep, ki.szerep)) return "mar_dontott";

  await prisma.jegyzokonyvKep.update({
    where: { id: kepId },
    data: {
      megerositoId: ki.id,
      megerositve: new Date(),
      kifogas: kifogas && kifogas !== "" ? kifogas : null,
    },
  });
  return null;
}

/** Letöltéshez: a tartalom, de csak annak, akinek köze van a jogviszonyhoz. */
export async function kepTartalma(ki: Ki, kepId: string) {
  return prisma.jegyzokonyvKep.findFirst({
    where: {
      id: kepId,
      jegyzokonyv:
        ki.szerep === "berbeado"
          ? { jogviszony: { ingatlan: { tulajdonosId: ki.id } } }
          : { jogviszony: { berlok: { some: { berloId: ki.id } } } },
    },
    select: { id: true, mimeTipus: true, tartalom: true },
  });
}

export type BerloiJegyzokonyv = {
  id: string;
  fajta: string;
  idopont: Date;
  allapot: string;
  ingatlan: string;
  kepek: KepNezet[];
};

/**
 * A bérlő jegyzőkönyvei a képeikkel. Itt szándékosan a tervezetek is benne
 * vannak: a megerősítés akkor ér valamit, ha a véglegesítés előtt történik.
 */
export async function berloJegyzokonyvei(berloId: string): Promise<BerloiJegyzokonyv[]> {
  const ki: Ki = { id: berloId, szerep: "berlo" };
  const sorok = await prisma.jegyzokonyv.findMany({
    where: { jogviszony: { berlok: { some: { berloId } } } },
    include: {
      jogviszony: { include: { ingatlan: { select: { megnevezes: true } } } },
      kepek: { select: VALASZTAS, orderBy: { feltoltve: "asc" } },
    },
    orderBy: { idopont: "desc" },
  });

  return sorok.map((sor) => ({
    id: sor.id,
    fajta: sor.fajta,
    idopont: sor.idopont,
    allapot: sor.allapot,
    ingatlan: sor.jogviszony.ingatlan.megnevezes,
    kepek: sor.kepek.map((kep) => nezet(kep, ki)),
  }));
}
