"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import {
  bejelentestEllenoriz,
  FAJTAK,
  VALASZOK,
  type Fajta,
  type Valasz,
} from "@/domain/latogatas";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
};

function hiba(uzenet: string, hibak: string[] = []): Eredmeny {
  return { allapot: "hiba", uzenet, hibak };
}

function szoveg(nyers: unknown): string {
  return String(nyers ?? "").trim();
}

function napotOlvas(nyers: unknown): Date | null {
  const ertek = szoveg(nyers);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ertek)) return null;
  const nap = new Date(`${ertek}T00:00:00.000Z`);
  return Number.isNaN(nap.getTime()) ? null : nap;
}

function frissit(): void {
  revalidatePath("/latogatasok");
  revalidatePath("/berlo/latogatasok");
  revalidatePath("/teendok");
  revalidatePath("/berlo/teendok");
  revalidatePath("/");
  revalidatePath("/berlo");
}

/** Az a jogviszony, amihez a belépett felhasználónak tényleg köze van. */
async function elerhetoJogviszony(
  felhasznaloId: string,
  szerep: string,
  jogviszonyId: string,
) {
  return prisma.jogviszony.findFirst({
    where:
      szerep === "berlo"
        ? { id: jogviszonyId, berlok: { some: { berloId: felhasznaloId } } }
        : { id: jogviszonyId, ingatlan: { tulajdonosId: felhasznaloId } },
    select: { id: true },
  });
}

/**
 * Látogatás bejelentése.
 *
 * Bejelenteni mindkét fél tud: a kéményseprőt a bérbeadó hívja, a saját
 * szerelőjét viszont a bérlő. Nyilatkozni viszont mindig a bérlő nyilatkozik,
 * mert a kérdés az ő lakásába való bejutásról szól.
 */
export async function latogatastBejelent(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const { sz } = await szovegek();
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return hiba(sz("valasz.lepj_be"));

  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));
  const jogviszony = await elerhetoJogviszony(
    felhasznalo.id,
    felhasznalo.szerep,
    jogviszonyId,
  );
  if (!jogviszony) return hiba(sz("valasz.nincs_hozzaferes"));

  const fajta = szoveg(urlap.get("fajta")) as Fajta;
  if (!FAJTAK.includes(fajta)) return hiba(sz("latogatas.hiba.fajta"));

  const bemenet = {
    megnevezes: szoveg(urlap.get("megnevezes")),
    nap: napotOlvas(urlap.get("nap")),
    idoablakTol: szoveg(urlap.get("idoablakTol")),
    idoablakIg: szoveg(urlap.get("idoablakIg")),
  };

  const kifogasok = bejelentestEllenoriz(bemenet);
  if (kifogasok.length > 0) {
    const { u } = await szovegek();
    return hiba(
      sz("latogatas.hiba.hianyos"),
      kifogasok.map((kifogas) => u(kifogas.uzenet)),
    );
  }

  await prisma.szolgaltatoiLatogatas.create({
    data: {
      jogviszonyId: jogviszony.id,
      bejelentoId: felhasznalo.id,
      fajta,
      megnevezes: bemenet.megnevezes,
      szolgaltato: szoveg(urlap.get("szolgaltato")) || null,
      nap: bemenet.nap as Date,
      idoablakTol: bemenet.idoablakTol || null,
      idoablakIg: bemenet.idoablakIg || null,
      megjegyzes: szoveg(urlap.get("megjegyzes")) || null,
    },
  });

  frissit();
  return {
    allapot: "kesz",
    uzenet: sz("latogatas.kesz.bejelentve"),
    hibak: [],
  };
}

/**
 * A bérlő válasza.
 *
 * Csak bérlő nyilatkozhat, és csak a saját nevében: a lakótárs helyett senki.
 * A kifogás indoklás nélkül nincs, mert abból a másik fél nem tud új időpontot
 * javasolni — ugyanaz, mint a fénykép és az előfizetés kifogásánál.
 */
export async function latogatasraValaszol(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const { sz } = await szovegek();
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return hiba(sz("valasz.lepj_be"));
  if (felhasznalo.szerep !== "berlo")
    return hiba(sz("latogatas.hiba.csak_berlo"));

  const latogatasId = szoveg(urlap.get("latogatasId"));
  const valasz = szoveg(urlap.get("valasz")) as Valasz;
  if (!VALASZOK.includes(valasz)) return hiba(sz("latogatas.hiba.valasz"));

  const indoklas = szoveg(urlap.get("indoklas"));
  if (valasz === "nem_jo_idopont" && indoklas === "") {
    return hiba(sz("latogatas.hiba.indoklas"));
  }

  const latogatas = await prisma.szolgaltatoiLatogatas.findFirst({
    where: {
      id: latogatasId,
      lemondva: null,
      jogviszony: { berlok: { some: { berloId: felhasznalo.id } } },
    },
    select: { id: true },
  });
  if (!latogatas) return hiba(sz("valasz.nincs_hozzaferes"));

  // A nyilatkozat módosítható: aki tévedett, ki tudja javítani, és a legutolsó
  // szava számít. Ezért `upsert`, nem `create`.
  await prisma.latogatasValasz.upsert({
    where: {
      latogatasId_berloId: {
        latogatasId: latogatas.id,
        berloId: felhasznalo.id,
      },
    },
    create: {
      latogatasId: latogatas.id,
      berloId: felhasznalo.id,
      valasz,
      indoklas: indoklas || null,
    },
    update: { valasz, indoklas: indoklas || null },
  });

  frissit();
  return {
    allapot: "kesz",
    uzenet: sz("latogatas.kesz.valaszolva"),
    hibak: [],
  };
}

/**
 * Lemondás.
 *
 * Törölni nem lehet, csak lemondani, ugyanúgy, ahogy az előfizetést sem
 * töröljük: a bérlő már nyilatkozott rá, és egy eltűnt sor mellől az ő
 * nyilatkozata is eltűnne. A lemondás oka nem formaság: a bérlő ebből tudja
 * meg, kell-e otthon lennie.
 */
export async function latogatastLemond(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const { sz } = await szovegek();
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return hiba(sz("valasz.lepj_be"));

  const latogatasId = szoveg(urlap.get("latogatasId"));
  const oka = szoveg(urlap.get("oka"));
  if (oka === "") return hiba(sz("latogatas.hiba.lemondas_oka"));

  // A lemondás a bejelentőé, nem a jogviszony bármelyik résztvevőjéé. A bérlő
  // a saját jogviszonyán is csak azt mondhatja le, amit ő szervezett: a
  // bérbeadó bejelentette szerelőt nem tudja lefújni, arra a „nem jó időpont"
  // válasz való. Ezt a kiszolgáló dönti el, nem a gomb elrejtése.
  const latogatas = await prisma.szolgaltatoiLatogatas.findFirst({
    where: { id: latogatasId, bejelentoId: felhasznalo.id, lemondva: null },
    select: { id: true },
  });
  if (!latogatas) return hiba(sz("latogatas.hiba.nem_te_jelentetted"));

  await prisma.szolgaltatoiLatogatas.update({
    where: { id: latogatas.id },
    data: { lemondva: new Date(), lemondasOka: oka },
  });

  frissit();
  return { allapot: "kesz", uzenet: sz("latogatas.kesz.lemondva"), hibak: [] };
}
