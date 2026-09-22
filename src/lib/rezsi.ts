import { prisma } from "@/lib/db";
import {
  elszamolastKeszit,
  ervenyesDijszabas,
  type ElszamolasBemenet,
  type Tetel,
} from "@/domain/rezsi";

export type Osszeallitas = {
  tetelek: Tetel[];
  osszegFt: number;
  napok: number;
  /** Amit nem tudtunk elszámolni, és miért. A bérbeadónak ez is információ. */
  kihagyott: string[];
};

/**
 * Elszámolás összeállítása a rögzített óraállásokból és díjszabásokból.
 * Nem ment semmit: ez a előnézet, amit a bérbeadó lát, mielőtt kiadná.
 */
export async function elszamolastOsszeallit(
  jogviszonyId: string,
  idoszakKezdete: Date,
  idoszakVege: Date,
): Promise<Osszeallitas> {
  const jogviszony = await prisma.jogviszony.findUnique({
    where: { id: jogviszonyId },
    include: {
      ingatlan: {
        include: {
          meroorak: {
            include: {
              dijszabasok: true,
              oraallasok: { orderBy: { datum: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!jogviszony) return { tetelek: [], osszegFt: 0, napok: 0, kihagyott: [] };

  const kihagyott: string[] = [];
  const meroorak: ElszamolasBemenet["meroorak"] = [];

  // Mérőórát csak akkor olvasunk, ha a jogviszony tényleges fogyasztás szerint
  // számol el. Átalánynál és közös költségbe foglalt rezsinél nincs mit mérni.
  const meroorasElszamolas = jogviszony.rezsiElszamolas === "almero";

  for (const meroora of meroorasElszamolas ? jogviszony.ingatlan.meroorak : []) {
    const megnevezes = merooraNeve(meroora.tipus, meroora.almero);

    const nyito = utolsoAllas(meroora.oraallasok, idoszakKezdete);
    const zaro = utolsoAllas(meroora.oraallasok, idoszakVege);

    if (!nyito || !zaro || nyito.id === zaro.id) {
      kihagyott.push(
        `${megnevezes}: az időszak elejéhez és végéhez is kell egy-egy óraállás.`,
      );
      continue;
    }

    const dijszabas = ervenyesDijszabas(meroora.dijszabasok, idoszakVege);
    if (!dijszabas) {
      kihagyott.push(`${megnevezes}: nincs erre az időszakra érvényes díjszabás.`);
      continue;
    }

    meroorak.push({
      id: meroora.id,
      megnevezes,
      mertekegyseg: meroora.mertekegyseg,
      dijszabas: {
        kedvezmenyesArFiller: dijszabas.kedvezmenyesArFiller,
        piaciArFiller: dijszabas.piaciArFiller,
        evesKeret: dijszabas.evesKeret,
        alapdijFt: dijszabas.alapdijFt,
      },
      nyito: { datum: nyito.datum, ertek: nyito.ertek },
      zaro: { datum: zaro.datum, ertek: zaro.ertek },
    });
  }

  const eredmeny = elszamolastKeszit({
    idoszakKezdete,
    idoszakVege,
    meroorak,
    // Átalányos elszámolásnál a mérőórák helyett a havi átalány megy ki.
    atalanyFt: jogviszony.rezsiElszamolas === "atalany" ? jogviszony.rezsiAtalanyFt : 0,
    kozosKoltsegFt: jogviszony.kozosKoltsegFt,
  });

  return { ...eredmeny, kihagyott };
}

function utolsoAllas<T extends { datum: Date }>(allasok: T[], napig: Date): T | null {
  const jeloltek = allasok.filter((allas) => allas.datum.getTime() <= napig.getTime());
  return jeloltek[jeloltek.length - 1] ?? null;
}

export function merooraNeve(tipus: string, almero: boolean): string {
  const nevek: Record<string, string> = {
    villany: "Villany",
    viz: "Víz",
    gaz: "Gáz",
    futes: "Fűtés",
  };
  return `${nevek[tipus] ?? tipus}${almero ? " (almérő)" : ""}`;
}
