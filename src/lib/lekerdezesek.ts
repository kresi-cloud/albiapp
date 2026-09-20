import { prisma } from "@/lib/db";
import {
  ALAPERTELMEZETT_BEALLITASOK,
  egyeztet,
  type Egyeztetes,
  type EgyeztetesBeallitasok,
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
  berloNev: string;
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

/** A próbakörnyezet egyetlen bérbeadóval indul; a belépés a következő lépés. */
export async function aktualisBerbeado() {
  return prisma.felhasznalo.findFirst({
    where: { szerep: "berbeado" },
    orderBy: { letrehozva: "asc" },
  });
}

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

export async function jogviszonyNezetek(
  tulajdonosId: string,
  ma: Date = new Date(),
): Promise<JogviszonyNezet[]> {
  const beallitasok = await egyeztetesBeallitasok(tulajdonosId);

  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId } },
    include: {
      ingatlan: true,
      eloirtTetelek: { orderBy: { esedekesseg: "asc" } },
      berloiIgazolasok: { orderBy: { utalasDatuma: "asc" } },
      kivonattetelek: { orderBy: { konyvelesDatuma: "asc" } },
    },
    orderBy: { letrehozva: "asc" },
  });

  return jogviszonyok.map((jogviszony) => {
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
      berloNev: jogviszony.berloNev,
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
  });
}

export async function teendok(
  tulajdonosId: string,
  cimzett: "berbeado" | "berlo",
  ma: Date = new Date(),
): Promise<TeendoSurgosseggel[]> {
  const nezetek = await jogviszonyNezetek(tulajdonosId, ma);

  const egyeztetesTeendok = nezetek.flatMap((nezet) =>
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

  const rendezettEloirasok = new Set(
    nezetek.flatMap((nezet) =>
      nezet.egyeztetesek
        .filter((sor) => sor.allapot === "egyezik" && sor.eloirtTetelId)
        .map((sor) => sor.eloirtTetelId as string),
    ),
  );

  const eloirtTetelek = await prisma.eloirtTetel.findMany({
    where: { jogviszony: { ingatlan: { tulajdonosId } } },
  });

  const kozelgok = kozelgoBefizetesTeendok(
    eloirtTetelek.map((tetel) => ({
      id: tetel.id,
      jogviszonyId: tetel.jogviszonyId,
      idoszak: tetel.idoszak,
      esedekesseg: tetel.esedekesseg,
      osszegFt: tetel.osszegFt,
      rendezett: rendezettEloirasok.has(tetel.id),
    })),
    ma,
  );

  return teendoketRendez(
    [...egyeztetesTeendok, ...kozelgok]
      .filter((teendo) => teendo.cimzett === cimzett)
      .map((teendo) => ({ ...teendo, surgosseg: surgosseg(teendo.esedekesseg, ma) })),
  );
}
