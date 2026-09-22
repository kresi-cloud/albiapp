/**
 * Az értékelés adatbázis-oldala.
 *
 * A vakság itt dől el, nem a felületen. A másik fél szövegét felfedésig nem
 * adjuk vissza — nem elrejtve, hanem meg sem kapja, hiszen egy elrejtett, de
 * betöltött szöveg a lap forrásában ott állna.
 */

import {
  irhato,
  nezet,
  parosaEnnek,
  type Allapot,
  type ErtekelesAdat,
  type Irany,
  type Paros,
  type Pont,
} from "@/domain/ertekeles";
import { prisma } from "@/lib/db";

export type Nezet = {
  jogviszonyId: string;
  cimke: string;
  /** A másik fél. Fiók nélküli bérlőnél nincs, és akkor nincs kit értékelni. */
  masikFelId: string | null;
  /** A másik fél neve. A szöveg nélkül is kiírjuk: a lap róla szól. */
  masikFelNeve: string;
  /** Van-e egyáltalán kinek írni: fiók nélküli bérlőt nem lehet értékelni. */
  vanMasikFel: boolean;
  vege: Date | null;
  allapot: Allapot;
  /** Melyik irányban ír a belépett fél. */
  sajatIrany: Irany;
  sajat: ErtekelesAdat | null;
  masike: ErtekelesAdat | null;
  irhato: boolean;
};

const PONTOKKAL = { pontok: true } as const;

function adatta(sor: {
  szerzoId: string;
  alanyId: string;
  irany: string;
  szoveg: string;
  letrehozva: Date;
  pontok: { szempont: string; pont: number }[];
}): ErtekelesAdat {
  return {
    szerzoId: sor.szerzoId,
    alanyId: sor.alanyId,
    irany: sor.irany === "berbeadorol" ? "berbeadorol" : "berlorol",
    szoveg: sor.szoveg,
    pontok: sor.pontok.map((pont) => ({
      szempont: pont.szempont,
      pont: pont.pont,
    })),
    letrehozva: sor.letrehozva,
  };
}

function nezette(
  jogviszonyId: string,
  cimke: string,
  vege: Date | null,
  sajatId: string,
  masikId: string | null,
  masikNev: string,
  sajatIrany: Irany,
  sorok: Parameters<typeof adatta>[0][],
  ma: Date,
): Nezet {
  // A párosítás a domainé, és **mindkét** azonosítóra szűr: ki írta, és
  // kiről. Két fiókos lakótársnál a bérbeadónak két értékelése van ezen az
  // egy jogviszonyon, és a szerző egymagában nem választja szét őket.
  const paros: Paros = parosaEnnek(sorok.map(adatta), sajatId, masikId);
  const lathato = nezet(paros, vege, ma);

  return {
    jogviszonyId,
    cimke,
    masikFelId: masikId,
    masikFelNeve: masikNev,
    vanMasikFel: masikId !== null,
    vege,
    allapot: lathato.allapot,
    sajatIrany,
    sajat: lathato.sajat,
    masike: lathato.masike,
    irhato: masikId !== null && irhato(paros, vege, ma),
  };
}

const BETOLTES = {
  ingatlan: {
    select: {
      megnevezes: true,
      tulajdonosId: true,
      tulajdonos: { select: { nev: true } },
    },
  },
  berlok: { select: { berloId: true, nev: true }, orderBy: { sorrend: "asc" } },
  ertekelesek: { include: PONTOKKAL },
} as const;

/**
 * A bérbeadó értékelései. Jogviszonyonként annyi sor, ahány fiókos bérlő van:
 * az értékelés személyről szól, nem a jogviszonyról, és a lakótárs nem felel
 * a másikért.
 */
export async function berbeadoErtekelesei(
  berbeadoId: string,
  ma: Date,
): Promise<Nezet[]> {
  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId: berbeadoId }, vege: { not: null } },
    include: BETOLTES,
    orderBy: { vege: "desc" },
  });

  return jogviszonyok.flatMap((jogviszony) =>
    jogviszony.berlok.map((berlo) =>
      nezette(
        jogviszony.id,
        jogviszony.ingatlan.megnevezes,
        jogviszony.vege,
        berbeadoId,
        berlo.berloId,
        berlo.nev,
        "berlorol",
        // Mindkét irányban a teljes páros kell: ki írta, és kiről. A
        // lakótárs értékelése ugyanezen a jogviszonyon áll, és nem tartozik
        // ide.
        jogviszony.ertekelesek.filter(
          (sor) =>
            (sor.szerzoId === berbeadoId && sor.alanyId === berlo.berloId) ||
            (berlo.berloId !== null &&
              sor.szerzoId === berlo.berloId &&
              sor.alanyId === berbeadoId),
        ),
        ma,
      ),
    ),
  );
}

/** A bérlő értékelései: minden lezárt jogviszonyára egy, a bérbeadóról. */
export async function berloErtekelesei(
  berloId: string,
  ma: Date,
): Promise<Nezet[]> {
  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { berlok: { some: { berloId } }, vege: { not: null } },
    include: BETOLTES,
    orderBy: { vege: "desc" },
  });

  return jogviszonyok.map((jogviszony) =>
    nezette(
      jogviszony.id,
      jogviszony.ingatlan.megnevezes,
      jogviszony.vege,
      berloId,
      jogviszony.ingatlan.tulajdonosId,
      jogviszony.ingatlan.tulajdonos.nev,
      "berbeadorol",
      // A bérbeadó ugyanezen a jogviszonyon a lakótársról is írhatott: az
      // nem ennek a bérlőnek az értékelése, és be sem töltjük.
      jogviszony.ertekelesek.filter(
        (sor) =>
          (sor.szerzoId === berloId &&
            sor.alanyId === jogviszony.ingatlan.tulajdonosId) ||
          (sor.szerzoId === jogviszony.ingatlan.tulajdonosId &&
            sor.alanyId === berloId),
      ),
      ma,
    ),
  );
}

/**
 * Egy páros nézete a belépett félnek, vagy null, ha nincs hozzá köze.
 *
 * A jogviszony egymagában nem azonosítja: két lakótársnál a bérbeadónak két
 * külön értékelése van ugyanazon a jogviszonyon, és a kettő nem ugyanaz.
 */
export async function ertekelesNezet(
  jogviszonyId: string,
  masikFelId: string,
  felhasznaloId: string,
  szerep: "berbeado" | "berlo",
  ma: Date,
): Promise<Nezet | null> {
  const lista =
    szerep === "berbeado"
      ? await berbeadoErtekelesei(felhasznaloId, ma)
      : await berloErtekelesei(felhasznaloId, ma);
  return (
    lista.find(
      (sor) =>
        sor.jogviszonyId === jogviszonyId && sor.masikFelId === masikFelId,
    ) ?? null
  );
}

/**
 * A saját értékelés mentése. Felfedés után nem hív ide semmi, de a
 * kiszolgáló ettől még ellenőrzi: a felület elrejtett gombja nem védelem.
 */
export async function ertekelestMent(
  jogviszonyId: string,
  szerzoId: string,
  alanyId: string,
  irany: Irany,
  szoveg: string,
  pontok: Pont[],
): Promise<void> {
  const meglevo = await prisma.ertekeles.findUnique({
    where: {
      jogviszonyId_szerzoId_alanyId: { jogviszonyId, szerzoId, alanyId },
    },
  });

  const ertekelesId = meglevo
    ? (
        await prisma.ertekeles.update({
          where: { id: meglevo.id },
          data: { szoveg, irany },
        })
      ).id
    : (
        await prisma.ertekeles.create({
          data: { jogviszonyId, szerzoId, alanyId, irany, szoveg },
        })
      ).id;

  // A pontokat lecseréljük, nem egyesével írjuk át: a szempontok listája
  // kódban él, tehát egy korábbi értékelésben állhat olyan szempont, ami már
  // nincs a listán, és annak a módosítás után nem szabad ott maradnia.
  await prisma.ertekelesPont.deleteMany({ where: { ertekelesId } });
  await prisma.ertekelesPont.createMany({
    data: pontok.map((pont) => ({
      ertekelesId,
      szempont: pont.szempont,
      pont: pont.pont,
    })),
  });
}

/** Amiből teendő lesz: minden lezárt jogviszony párosa, a belépett fél szemszögéből. */
export async function ertekelesTeendoAdatai(
  felhasznaloId: string,
  szerep: "berbeado" | "berlo",
  ma: Date,
): Promise<
  {
    jogviszonyId: string;
    masikFelId: string;
    cimke: string;
    vege: Date | null;
    paros: Paros;
  }[]
> {
  const lista =
    szerep === "berbeado"
      ? await berbeadoErtekelesei(felhasznaloId, ma)
      : await berloErtekelesei(felhasznaloId, ma);

  return lista
    .filter(
      (sor): sor is Nezet & { masikFelId: string } => sor.masikFelId !== null,
    )
    .map((sor) => ({
      jogviszonyId: sor.jogviszonyId,
      masikFelId: sor.masikFelId,
      cimke: sor.cimke,
      vege: sor.vege,
      // `masike` felfedésig szándékosan null, de a teendő ettől nem téved: a
      // teendő csak akkor van, ha a **saját** hiányzik, és olyankor a másiké
      // egymagában úgysem fed fel semmit. Amint mindkettő megvan, a saját nem
      // hiányzik, tehát nincs miből teendő legyen.
      paros: { sajat: sor.sajat, masike: sor.masike },
    }));
}
