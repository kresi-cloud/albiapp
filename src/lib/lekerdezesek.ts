import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  eloirasokatPotol,
  eloirasokatPotolBerlonek,
  reszletezesbol,
} from "@/lib/eloirasok";
import { nyitottHibak } from "@/lib/hibabejelentes";
import { nyitottLatogatasok } from "@/lib/latogatas";
import { ertekelesTeendoAdatai } from "@/lib/ertekeles";
import { ertekelesTeendoi } from "@/domain/ertekeles";
import { berbeadoAdatai, berloSajatSorai } from "@/lib/szemelyes-adatok";
import { BERLOHOZ_KELL, hianyzoMezok } from "@/domain/szemelyes-adatok";
import { hibakbolTeendok } from "@/domain/hibabejelentes";
import { latogatasokbolTeendok } from "@/domain/latogatas";
import { uzenet, type Uzenet } from "@/domain/nyelv";
import { nevsor } from "@/domain/szerzodes";
import {
  ALAPERTELMEZETT_BEALLITASOK,
  egyeztet,
  type BerloiIgazolas,
  type EloirtTetel,
  type Egyeztetes,
  type EgyeztetesBeallitasok,
  type BerbeadoiIgazolas,
} from "@/domain/egyeztetes";
import {
  egyeztetesbolTeendok,
  hianyzoAdatokTeendoi,
  kozelgoBefizetesTeendok,
  surgosseg,
  teendoketRendez,
  type Teendo,
  type TeendoSurgosseggel,
} from "@/domain/teendok";

export type JogviszonyNezet = {
  id: string;
  /** Egy jogviszonyhoz több bérlő is tartozhat: "Anna és Panna". */
  berlokNeve: string;
  ingatlanMegnevezes: string;
  ingatlanCim: string;
  berletiDijFt: number;
  /** Lezárt-e a jogviszony. A befizetések lapja ebből dönti el, mi kerül előre. */
  lezart: boolean;
  egyeztetesek: (Egyeztetes & {
    idoszak: string | null;
    osszegFt: number;
    esedekesseg: Date;
    berbeadoiOsszegFt: number | null;
    berbeadoiDatuma: Date | null;
    igazolasOsszegFt: number | null;
    igazolasDatuma: Date | null;
    /** Miért ennyi, ha nem a teljes havi összeg. Töredékhónapnál van kitöltve. */
    reszletezes: Uzenet | null;
  })[];
};

/** Amit egy jogviszonyból az egyeztetéshez betöltünk. */
type BetoltottJogviszony = {
  id: string;
  berlok: { nev: string }[];
  berletiDijFt: number;
  vege: Date | null;
  ingatlan: { megnevezes: string; cim: string; tulajdonosId: string };
  eloirtTetelek: (EloirtTetel & { reszletezes: string | null })[];
  berloiIgazolasok: BerloiIgazolas[];
  berbeadoiIgazolasok: BerbeadoiIgazolas[];
};

// `satisfies` és nem `as const`: az `as const` a rendezési tömböket is
// readonly-vá teszi, a Prisma pedig azt nem fogadja el. Így a literálok
// megmaradnak — a származtatott típusok ebből jönnek —, a tömbök viszont nem.
const BETOLTES = {
  ingatlan: true,
  berlok: { orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
  eloirtTetelek: { orderBy: [{ esedekesseg: "asc" }, { id: "asc" }] },
  berloiIgazolasok: { orderBy: [{ utalasDatuma: "asc" }, { id: "asc" }] },
  berbeadoiIgazolasok: { orderBy: [{ erkezesDatuma: "asc" }, { id: "asc" }] },
} satisfies Prisma.JogviszonyInclude;

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
    bizonylatKeres: mentett.bizonylatKeres,
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
    jogviszony.berbeadoiIgazolasok,
    ma,
    beallitasok,
  );

  const eloirasok = new Map(jogviszony.eloirtTetelek.map((tetel) => [tetel.id, tetel]));
  const berbeadoiak = new Map(
    jogviszony.berbeadoiIgazolasok.map((tetel) => [tetel.id, tetel]),
  );
  const igazolasok = new Map(jogviszony.berloiIgazolasok.map((tetel) => [tetel.id, tetel]));

  return {
    id: jogviszony.id,
    berlokNeve: nevsor(jogviszony.berlok.map((berlo) => berlo.nev)),
    ingatlanMegnevezes: jogviszony.ingatlan.megnevezes,
    ingatlanCim: jogviszony.ingatlan.cim,
    berletiDijFt: jogviszony.berletiDijFt,
    lezart: jogviszony.vege !== null,
    egyeztetesek: eredmeny.map((sor) => {
      const eloiras = sor.eloirtTetelId ? eloirasok.get(sor.eloirtTetelId) : undefined;
      const berbeadoi = sor.berbeadoiIgazolasId
        ? berbeadoiak.get(sor.berbeadoiIgazolasId)
        : undefined;
      const igazolas = sor.berloiIgazolasId ? igazolasok.get(sor.berloiIgazolasId) : undefined;
      return {
        ...sor,
        idoszak: eloiras?.idoszak ?? null,
        osszegFt: eloiras?.osszegFt ?? 0,
        esedekesseg: eloiras?.esedekesseg ?? berbeadoi?.erkezesDatuma ?? ma,
        berbeadoiOsszegFt: berbeadoi?.megerkezett ? berbeadoi.osszegFt : null,
        berbeadoiDatuma: berbeadoi?.megerkezett ? berbeadoi.erkezesDatuma : null,
        igazolasOsszegFt: igazolas?.osszegFt ?? null,
        igazolasDatuma: igazolas?.utalasDatuma ?? null,
        reszletezes: eloiras ? reszletezesbol(eloiras.reszletezes) : null,
      };
    }),
  };
}

export async function jogviszonyNezetek(
  tulajdonosId: string,
  ma: Date = new Date(),
): Promise<JogviszonyNezet[]> {
  // A hiányzó havi előírások pótlása, mielőtt egyeztetnénk: különben egy új
  // hónap díja meg sem jelenne, és a bérlő azt hinné, nincs mit fizetnie.
  await eloirasokatPotol(tulajdonosId, ma);

  const beallitasok = await egyeztetesBeallitasok(tulajdonosId);

  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId } },
    include: BETOLTES,
    orderBy: [{ letrehozva: "asc" }, { id: "asc" }],
  });

  return jogviszonyok.map((jogviszony) => nezetteAlakit(jogviszony, ma, beallitasok));
}

/** A bérlő csak a saját jogviszonyait látja, de ugyanazzal az ablakkal, mint a bérbeadó. */
export async function berloNezetei(
  berloId: string,
  ma: Date = new Date(),
): Promise<JogviszonyNezet[]> {
  await eloirasokatPotolBerlonek(berloId, ma);

  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { berlok: { some: { berloId } } },
    include: BETOLTES,
    orderBy: [{ letrehozva: "asc" }, { id: "asc" }],
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

/**
 * A tárolt teendők: amiket nem a rendszer állapotából vezetünk le, hanem valaki
 * vállalt. Ilyen a jegyzőkönyvben rögzített javítás. Ezeket le is lehet zárni,
 * ezért van saját soruk az adatbázisban.
 */
async function tarolt(
  cimzettId: string,
  cimzett: "berbeado" | "berlo",
  statusz: "nyitott" | "kesz" = "nyitott",
): Promise<Teendo[]> {
  const sorok = await prisma.teendo.findMany({
    where: { cimzettId, statusz },
    orderBy: [{ esedekesseg: "asc" }, { id: "asc" }],
  });

  return sorok.map((sor) => ({
    kulcs: sor.kulcs,
    cimzett,
    tipus: sor.tipus,
    // Tárolt teendőnél a szöveget valaki beírta: azt nem fordítjuk, csak átadjuk.
    cim: uzenet("nyers", { szoveg: sor.cim }),
    leiras: sor.leiras ? uzenet("nyers", { szoveg: sor.leiras }) : undefined,
    esedekesseg: sor.esedekesseg,
    hivatkozas: sor.hivatkozas ?? undefined,
    tarolt: true,
  }));
}

/**
 * A lezárt tárolt teendők. Azért külön lekérdezés, és nem a lista egy szűrése,
 * mert a nyitott teendő a lap tárgya, a lezárt pedig csak a visszavonás útja:
 * a kezdőlap és a naptár ezt soha nem kéri el.
 */
export async function lezartTeendok(
  cimzettId: string,
  cimzett: "berbeado" | "berlo",
): Promise<Teendo[]> {
  return tarolt(cimzettId, cimzett, "kesz");
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
  const jogviszonyIdk = nezetek.map((nezet) => nezet.id);

  return teendoketRendez(
    [
      ...nezetekbolTeendok(nezetek),
      ...(await kozelgok(nezetek, jogviszonyIdk, ma)),
      ...hibakbolTeendok(await nyitottHibak(jogviszonyIdk)),
      ...latogatasokbolTeendok(await nyitottLatogatasok(jogviszonyIdk, ma), ma),
      ...hianyzoAdatokTeendoi(await berbeadoiAdathianyok(tulajdonosId), ma),
      ...ertekelesTeendoi(
        await ertekelesTeendoAdatai(tulajdonosId, "berbeado", ma),
        "berbeado",
        ma,
      ),
      ...(cimzett === "berbeado" ? await tarolt(tulajdonosId, "berbeado") : []),
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
  const jogviszonyIdk = nezetek.map((nezet) => nezet.id);

  return teendoketRendez(
    [
      ...nezetekbolTeendok(nezetek),
      ...(await kozelgok(nezetek, jogviszonyIdk, ma)),
      ...hibakbolTeendok(await nyitottHibak(jogviszonyIdk)),
      ...latogatasokbolTeendok(await nyitottLatogatasok(jogviszonyIdk, ma), ma, berloId),
      ...hianyzoAdatokTeendoi(await berloiAdathianyok(berloId), ma),
      ...ertekelesTeendoi(await ertekelesTeendoAdatai(berloId, "berlo", ma), "berlo", ma),
      ...(await tarolt(berloId, "berlo")),
    ]
      .filter((teendo) => teendo.cimzett === "berlo")
      .map((teendo) => ({ ...teendo, surgosseg: surgosseg(teendo.esedekesseg, ma) })),
  );
}

/**
 * A bérbeadó adathiányai: a sajátja, és minden bérlőé, akinek a szerződéshez
 * kellő adatai hiányosak. A bérlőét azért látja, mert szerződést ő állít ki.
 */
async function berbeadoiAdathianyok(tulajdonosId: string) {
  const [sajat, berlok] = await Promise.all([
    berbeadoAdatai(tulajdonosId),
    prisma.jogviszonyBerlo.findMany({
      where: { jogviszony: { ingatlan: { tulajdonosId }, statusz: "elo" } },
      include: { jogviszony: { include: { ingatlan: true } } },
    }),
  ]);

  const hianyok = [
    {
      cimzett: "berbeado" as const,
      kulcsResz: `berbeado:${tulajdonosId}`,
      darab: sajat.allapot.hianyzo.length,
      hivatkozas: "/beallitasok",
    },
  ];

  for (const sor of berlok) {
    hianyok.push({
      cimzett: "berbeado" as const,
      kulcsResz: `berlo:${sor.id}`,
      darab: hianyzoMezok(
        {
          nev: sor.nev,
          szuletesiHely: sor.szuletesiHely,
          szuletesiIdo: sor.szuletesiIdo,
          anyjaNeve: sor.anyjaNeve,
          lakcim: sor.lakcim,
          igazolvanySzam: sor.igazolvanySzam,
        },
        BERLOHOZ_KELL,
      ).length,
      hivatkozas: "/berlok",
    });
  }

  return hianyok;
}

/** A bérlő csak a sajátjáról kap teendőt. */
async function berloiAdathianyok(berloId: string) {
  const sorok = await berloSajatSorai(berloId);
  const legjobb = sorok.reduce(
    (eddig, sor) => Math.min(eddig, sor.allapot.hianyzo.length),
    Number.POSITIVE_INFINITY,
  );

  if (!Number.isFinite(legjobb)) return [];

  return [
    {
      cimzett: "berlo" as const,
      kulcsResz: `berlo-sajat:${berloId}`,
      darab: legjobb,
      hivatkozas: "/berlo/adatok",
    },
  ];
}
