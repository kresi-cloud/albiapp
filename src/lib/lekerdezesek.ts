import { prisma } from "@/lib/db";
import { nevsor } from "@/domain/szerzodes";
import {
  ALAPERTELMEZETT_BEALLITASOK,
  egyeztet,
  type BerloiIgazolas,
  type EloirtTetel,
  type Egyeztetes,
  type EgyeztetesBeallitasok,
  type Kivonattetel,
} from "@/domain/egyeztetes";
import {
  egyeztetesbolTeendok,
  kozelgoBefizetesTeendok,
  surgosseg,
  teendoketRendez,
  type TeendoSurgosseggel,
} from "@/domain/teendok";

export type JogviszonyNezet = {
  id: string;
  /** Egy jogviszonyhoz több bérlő is tartozhat: "Anna és Panna". */
  berlokNeve: string;
  ingatlanMegnevezes: string;
  ingatlanCim: string;
  berletiDijFt: number;
  egyeztetesek: (Egyeztetes & {
    idoszak: string | null;
    osszegFt: number;
    esedekesseg: Date;
    kivonatOsszegFt: number | null;
    kivonatDatuma: Date | null;
    igazolasOsszegFt: number | null;
    igazolasDatuma: Date | null;
  })[];
};

/** Amit egy jogviszonyból az egyeztetéshez betöltünk. */
type BetoltottJogviszony = {
  id: string;
  berlok: { nev: string }[];
  berletiDijFt: number;
  ingatlan: { megnevezes: string; cim: string; tulajdonosId: string };
  eloirtTetelek: EloirtTetel[];
  berloiIgazolasok: BerloiIgazolas[];
  kivonattetelek: Kivonattetel[];
};

const BETOLTES = {
  ingatlan: true,
  berlok: { orderBy: { sorrend: "asc" } },
  eloirtTetelek: { orderBy: { esedekesseg: "asc" } },
  berloiIgazolasok: { orderBy: { utalasDatuma: "asc" } },
  kivonattetelek: { orderBy: { konyvelesDatuma: "asc" } },
} as const;

/**
 * A párosítási időablak bérbeadónként állítható. Akinek még nincs mentett
 * beállítása, az az alapértelmezéssel dolgozik; a sor az első mentéskor jön létre.
 */
export async function egyeztetesBeallitasok(
  tulajdonosId: string,
): Promise<EgyeztetesBeallitasok> {
  const mentett = await prisma.beallitasok.findUnique({
    where: { berbeadoId: tulajdonosId },
  });
  if (!mentett) return ALAPERTELMEZETT_BEALLITASOK;
  return {
    korabbiAblakNap: mentett.korabbiAblakNap,
    kesobbiAblakNap: mentett.kesobbiAblakNap,
    toleranciaFt: ALAPERTELMEZETT_BEALLITASOK.toleranciaFt,
  };
}

function nezetteAlakit(
  jogviszony: BetoltottJogviszony,
  ma: Date,
  beallitasok: EgyeztetesBeallitasok,
): JogviszonyNezet {
  const eredmeny = egyeztet(
    jogviszony.eloirtTetelek,
    jogviszony.berloiIgazolasok,
    jogviszony.kivonattetelek,
    ma,
    beallitasok,
  );

  const eloirasok = new Map(jogviszony.eloirtTetelek.map((tetel) => [tetel.id, tetel]));
  const kivonatok = new Map(jogviszony.kivonattetelek.map((tetel) => [tetel.id, tetel]));
  const igazolasok = new Map(jogviszony.berloiIgazolasok.map((tetel) => [tetel.id, tetel]));

  return {
    id: jogviszony.id,
    berlokNeve: nevsor(jogviszony.berlok.map((berlo) => berlo.nev)),
    ingatlanMegnevezes: jogviszony.ingatlan.megnevezes,
    ingatlanCim: jogviszony.ingatlan.cim,
    berletiDijFt: jogviszony.berletiDijFt,
    egyeztetesek: eredmeny.map((sor) => {
      const eloiras = sor.eloirtTetelId ? eloirasok.get(sor.eloirtTetelId) : undefined;
      const kivonat = sor.kivonattetelId ? kivonatok.get(sor.kivonattetelId) : undefined;
      const igazolas = sor.berloiIgazolasId ? igazolasok.get(sor.berloiIgazolasId) : undefined;
      return {
        ...sor,
        idoszak: eloiras?.idoszak ?? null,
        osszegFt: eloiras?.osszegFt ?? 0,
        esedekesseg: eloiras?.esedekesseg ?? kivonat?.konyvelesDatuma ?? ma,
        kivonatOsszegFt: kivonat?.osszegFt ?? null,
        kivonatDatuma: kivonat?.konyvelesDatuma ?? null,
        igazolasOsszegFt: igazolas?.osszegFt ?? null,
        igazolasDatuma: igazolas?.utalasDatuma ?? null,
      };
    }),
  };
}

export async function jogviszonyNezetek(
  tulajdonosId: string,
  ma: Date = new Date(),
): Promise<JogviszonyNezet[]> {
  const beallitasok = await egyeztetesBeallitasok(tulajdonosId);

  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId } },
    include: BETOLTES,
    orderBy: { letrehozva: "asc" },
  });

  return jogviszonyok.map((jogviszony) => nezetteAlakit(jogviszony, ma, beallitasok));
}

/** A bérlő csak a saját jogviszonyait látja, de ugyanazzal az ablakkal, mint a bérbeadó. */
export async function berloNezetei(
  berloId: string,
  ma: Date = new Date(),
): Promise<JogviszonyNezet[]> {
  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { berlok: { some: { berloId } } },
    include: BETOLTES,
    orderBy: { letrehozva: "asc" },
  });

  const nezetek: JogviszonyNezet[] = [];
  for (const jogviszony of jogviszonyok) {
    const beallitasok = await egyeztetesBeallitasok(jogviszony.ingatlan.tulajdonosId);
    nezetek.push(nezetteAlakit(jogviszony, ma, beallitasok));
  }
  return nezetek;
}

function nezetekbolTeendok(nezetek: JogviszonyNezet[]) {
  return nezetek.flatMap((nezet) =>
    egyeztetesbolTeendok(
      nezet.egyeztetesek.map((sor) => ({
        jogviszonyId: nezet.id,
        eloirtTetelId: sor.eloirtTetelId,
        idoszak: sor.idoszak,
        allapot: sor.allapot,
        elteresOka: sor.elteresOka,
        elteresFt: sor.elteresFt,
        osszegFt: sor.osszegFt,
        esedekesseg: sor.esedekesseg,
      })),
    ),
  );
}

function rendezettEloirasok(nezetek: JogviszonyNezet[]): Set<string> {
  return new Set(
    nezetek.flatMap((nezet) =>
      nezet.egyeztetesek
        .filter((sor) => sor.allapot === "egyezik" && sor.eloirtTetelId)
        .map((sor) => sor.eloirtTetelId as string),
    ),
  );
}

async function kozelgok(
  nezetek: JogviszonyNezet[],
  jogviszonyIdk: string[],
  ma: Date,
) {
  const eloirtTetelek = await prisma.eloirtTetel.findMany({
    where: { jogviszonyId: { in: jogviszonyIdk } },
  });
  const rendezett = rendezettEloirasok(nezetek);

  return kozelgoBefizetesTeendok(
    eloirtTetelek.map((tetel) => ({
      id: tetel.id,
      jogviszonyId: tetel.jogviszonyId,
      idoszak: tetel.idoszak,
      esedekesseg: tetel.esedekesseg,
      osszegFt: tetel.osszegFt,
      rendezett: rendezett.has(tetel.id),
    })),
    ma,
  );
}

export async function teendok(
  tulajdonosId: string,
  cimzett: "berbeado" | "berlo",
  ma: Date = new Date(),
): Promise<TeendoSurgosseggel[]> {
  const nezetek = await jogviszonyNezetek(tulajdonosId, ma);

  return teendoketRendez(
    [
      ...nezetekbolTeendok(nezetek),
      ...(await kozelgok(nezetek, nezetek.map((nezet) => nezet.id), ma)),
    ]
      .filter((teendo) => teendo.cimzett === cimzett)
      .map((teendo) => ({ ...teendo, surgosseg: surgosseg(teendo.esedekesseg, ma) })),
  );
}

export async function berloTeendoi(
  berloId: string,
  ma: Date = new Date(),
): Promise<TeendoSurgosseggel[]> {
  const nezetek = await berloNezetei(berloId, ma);

  return teendoketRendez(
    [
      ...nezetekbolTeendok(nezetek),
      ...(await kozelgok(nezetek, nezetek.map((nezet) => nezet.id), ma)),
    ]
      .filter((teendo) => teendo.cimzett === "berlo")
      .map((teendo) => ({ ...teendo, surgosseg: surgosseg(teendo.esedekesseg, ma) })),
  );
}
