import { uzenet, type Uzenet } from "@/domain/nyelv";
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
  kihagyott: Uzenet[];
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
              oraallasok: { orderBy: [{ datum: "asc" }, { id: "asc" }] },
            },
          },
        },
      },
    },
  });
  if (!jogviszony) return { tetelek: [], osszegFt: 0, napok: 0, kihagyott: [] };

  const kihagyott: Uzenet[] = [];
  const meroorak: ElszamolasBemenet["meroorak"] = [];

  // Mérőórát csak akkor olvasunk, ha a jogviszony tényleges fogyasztás szerint
  // számol el. Átalánynál és közös költségbe foglalt rezsinél nincs mit mérni.
  const meroorasElszamolas = jogviszony.rezsiElszamolas === "almero";

  for (const meroora of meroorasElszamolas ? jogviszony.ingatlan.meroorak : []) {
    const megnevezes = merooraNeve(meroora.tipus, meroora.almero);

    const nyito = utolsoAllas(meroora.oraallasok, idoszakKezdete);
    const zaro = utolsoAllas(meroora.oraallasok, idoszakVege);

    if (!nyito || !zaro || nyito.id === zaro.id) {
      kihagyott.push(uzenet("rezsi.kihagyott.oraallas", { nev: merooraUzenet(meroora.tipus, meroora.almero) }));
      continue;
    }

    const dijszabas = ervenyesDijszabas(meroora.dijszabasok, idoszakVege);
    if (!dijszabas) {
      kihagyott.push(uzenet("rezsi.kihagyott.dijszabas", { nev: merooraUzenet(meroora.tipus, meroora.almero) }));
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
        csatornaArFiller: dijszabas.csatornaArFiller,
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

/**
 * A mérőóra neve a felületre, fordíthatóan. A jegyzőkönyv és az elszámolás a
 * `merooraNeve`-t használja: azok kiadott okiratok, és magyarul maradnak.
 */
export function merooraUzenet(tipus: string, almero: boolean): Uzenet {
  const ismert = ["villany", "viz", "gaz", "futes"].includes(tipus);
  const nev = ismert ? uzenet(`meroora.${tipus}`) : uzenet("nyers", { szoveg: tipus });
  return almero ? uzenet("meroora.almero", { nev }) : nev;
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
