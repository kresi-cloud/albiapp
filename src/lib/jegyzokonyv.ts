import { prisma } from "@/lib/db";
import { type JegyzokonyvBemenet, type Tetel } from "@/domain/jegyzokonyv";

export type BetoltottJegyzokonyv = {
  bemenet: JegyzokonyvBemenet;
  id: string;
  jogviszonyId: string;
  allapot: string;
  veglegesSzoveg: string | null;
  /** A tételek adatbázisbeli azonosítója, hogy szerkeszteni is lehessen őket. */
  tetelek: {
    id: string;
    fajta: string;
    merooraId: string | null;
    megnevezes: string;
    ertek: string;
    megjegyzes: string;
    felelos: string;
    hatarido: string;
  }[];
};

function napSzoveg(nap: Date | null): string {
  return nap ? nap.toISOString().slice(0, 10) : "";
}

export async function jegyzokonyvBetoltes(
  jegyzokonyvId: string,
  tulajdonosId: string,
): Promise<BetoltottJegyzokonyv | null> {
  const jegyzokonyv = await prisma.jegyzokonyv.findFirst({
    where: { id: jegyzokonyvId, jogviszony: { ingatlan: { tulajdonosId } } },
    include: {
      tetelek: { orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
      jogviszony: {
        include: { ingatlan: true, berlok: { orderBy: [{ sorrend: "asc" }, { id: "asc" }] } },
      },
    },
  });
  if (!jegyzokonyv) return null;

  const berbeado = await prisma.felhasznalo.findUnique({
    where: { id: tulajdonosId },
    include: { berbeadoiAdatok: true },
  });
  if (!berbeado) return null;

  const tetelek: Tetel[] = jegyzokonyv.tetelek.map((tetel) => ({
    fajta: tetel.fajta as Tetel["fajta"],
    megnevezes: tetel.megnevezes,
    ertek: tetel.ertek,
    megjegyzes: tetel.megjegyzes,
    felelos: tetel.felelos,
    hatarido: tetel.hatarido,
  }));

  return {
    id: jegyzokonyv.id,
    jogviszonyId: jegyzokonyv.jogviszonyId,
    allapot: jegyzokonyv.allapot,
    veglegesSzoveg: jegyzokonyv.veglegesSzoveg,
    tetelek: jegyzokonyv.tetelek.map((tetel) => ({
      id: tetel.id,
      fajta: tetel.fajta,
      merooraId: tetel.merooraId,
      megnevezes: tetel.megnevezes,
      ertek: tetel.ertek ?? "",
      megjegyzes: tetel.megjegyzes ?? "",
      felelos: tetel.felelos ?? "",
      hatarido: napSzoveg(tetel.hatarido),
    })),
    bemenet: {
      fajta: jegyzokonyv.fajta as "birtokbaadas" | "visszaadas",
      idopont: jegyzokonyv.idopont,
      berbeado: {
        nev: berbeado.nev,
        email: berbeado.email,
        lakcim: berbeado.berbeadoiAdatok?.lakcim ?? null,
        igazolvanySzam: berbeado.berbeadoiAdatok?.igazolvanySzam ?? null,
      },
      berlok: jegyzokonyv.jogviszony.berlok.map((berlo) => ({
        nev: berlo.nev,
        lakcim: berlo.lakcim,
        igazolvanySzam: berlo.igazolvanySzam,
      })),
      ingatlan: {
        megnevezes: jegyzokonyv.jogviszony.ingatlan.megnevezes,
        cim: jegyzokonyv.jogviszony.ingatlan.cim,
        alapteruletM2: jegyzokonyv.jogviszony.ingatlan.alapteruletM2,
        helyrajziSzam: jegyzokonyv.jogviszony.ingatlan.helyrajziSzam,
      },
      allapotLeiras: jegyzokonyv.allapotLeiras,
      megjegyzes: jegyzokonyv.megjegyzes,
      tetelek,
    },
  };
}

/**
 * A jegyzőkönyv kezdő tételei: minden mérőórához egy sor, és a szokásos
 * kulcsfajták. Üres lapra senki nem szeret írni, és a mérőórát kifelejteni a
 * legdrágább hiba.
 */
export async function kezdoTetelek(jogviszonyId: string) {
  const jogviszony = await prisma.jogviszony.findUnique({
    where: { id: jogviszonyId },
    include: { ingatlan: { include: { meroorak: true } } },
  });
  if (!jogviszony) return [];

  const { merooraNeve } = await import("@/lib/rezsi");

  const merok = jogviszony.ingatlan.meroorak.map((meroora, index) => ({
    fajta: "meroora",
    merooraId: meroora.id,
    megnevezes: meroora.gyariSzam
      ? `${merooraNeve(meroora.tipus, meroora.almero)} (${meroora.gyariSzam})`
      : merooraNeve(meroora.tipus, meroora.almero),
    ertek: "",
    sorrend: index,
  }));

  const kulcsok = ["Lakáskulcs-garnitúra", "Kapukulcs vagy kapunyitó", "Postaládakulcs"].map(
    (megnevezes, index) => ({
      fajta: "kulcs",
      megnevezes,
      ertek: "",
      sorrend: merok.length + index,
    }),
  );

  return [...merok, ...kulcsok];
}
