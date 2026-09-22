"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { emailNekLatszik, emailtNormalizal, meghivoLejarata } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { meghivoToken } from "@/lib/meghivo";
import { kotelezoSzerep } from "@/lib/munkamenet";

export type MeghivoEredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  link: string;
};

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

async function alapcim(): Promise<string> {
  const fejlec = await headers();
  const gazda = fejlec.get("host") ?? "localhost:3000";
  const protokoll = fejlec.get("x-forwarded-proto") ?? (gazda.startsWith("localhost") ? "http" : "https");
  return `${protokoll}://${gazda}`;
}

/** Csak a saját jogviszonyához tartozó bérlősort engedjük módosítani. */
async function sajatBerlo(berbeadoId: string, jogviszonyBerloId: string) {
  return prisma.jogviszonyBerlo.findFirst({
    where: {
      id: jogviszonyBerloId,
      jogviszony: { ingatlan: { tulajdonosId: berbeadoId } },
    },
  });
}

export async function meghivotKeszit(
  _elozo: MeghivoEredmeny,
  urlap: FormData,
): Promise<MeghivoEredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const jogviszonyBerloId = szoveg(urlap.get("jogviszonyBerloId"));

  const berlo = await sajatBerlo(berbeado.id, jogviszonyBerloId);
  if (!berlo) {
    return { allapot: "hiba", uzenet: "Ez a bérlő nem a te jogviszonyodhoz tartozik.", link: "" };
  }

  const email = emailtNormalizal(urlap.get("email") ?? berlo.email);
  if (!emailNekLatszik(email)) {
    return { allapot: "hiba", uzenet: "Adj meg egy érvényes e-mail-címet.", link: "" };
  }

  const most = new Date();

  // A korábbi, még élő meghívókat lejárttá tesszük: egyszerre egy link éljen,
  // különben a régi levélből is be lehetne lépni.
  await prisma.meghivo.updateMany({
    where: { jogviszonyBerloId, felhasznalva: null, lejar: { gt: most } },
    data: { lejar: most },
  });

  const meghivo = await prisma.meghivo.create({
    data: {
      jogviszonyBerloId,
      token: meghivoToken(),
      email,
      lejar: meghivoLejarata(most),
    },
  });

  if (berlo.email !== email) {
    await prisma.jogviszonyBerlo.update({ where: { id: berlo.id }, data: { email } });
  }

  revalidatePath("/berlok");

  return {
    allapot: "kesz",
    uzenet: `Kész a meghívó ${email} címre. Küldd el neki, és két hétig érvényes.`,
    link: `${await alapcim()}/meghivo/${meghivo.token}`,
  };
}

/**
 * Új bérlő a meglévő jogviszonyhoz. Több bérlőnél a fizetési kötelezettség
 * ugyanaz az egy előírás marad: egyetemlegesen felelnek érte.
 */
export async function berlotHozzaad(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));
  const nev = szoveg(urlap.get("nev"));
  const email = emailtNormalizal(urlap.get("email"));

  if (nev === "") return hiba("Add meg a bérlő nevét.");
  if (email !== "" && !emailNekLatszik(email)) {
    return hiba("Az e-mail-cím nem tűnik érvényesnek.");
  }

  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId: berbeado.id } },
    include: { berlok: true },
  });
  if (!jogviszony) return hiba("Ez a jogviszony nem a tiéd.");

  await prisma.jogviszonyBerlo.create({
    data: {
      jogviszonyId,
      nev,
      email: email === "" ? null : email,
      sorrend: jogviszony.berlok.length,
    },
  });

  revalidatePath("/berlok");
  revalidatePath("/szerzodesek");

  return {
    allapot: "kesz",
    uzenet: `${nev} hozzáadva. A bérleti díj továbbra is egy előírás: a bérlők egyetemlegesen felelnek érte.`,
    hibak: [],
  };
}

/**
 * A szerződéshez és az igazolásokhoz szükséges személyes adatok. Külön űrlap,
 * mert ezeket nem a mindennapi kezeléshez, hanem a dokumentumokhoz kérjük.
 */
export async function berloAdataitMenti(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const jogviszonyBerloId = szoveg(urlap.get("jogviszonyBerloId"));

  const berlo = await sajatBerlo(berbeado.id, jogviszonyBerloId);
  if (!berlo) return hiba("Ez a bérlő nem a te jogviszonyodhoz tartozik.");

  const nev = szoveg(urlap.get("nev"));
  if (nev === "") return hiba("A név nem maradhat üresen.");

  const email = emailtNormalizal(urlap.get("email"));
  if (email !== "" && !emailNekLatszik(email)) {
    return hiba("Az e-mail-cím nem tűnik érvényesnek.");
  }

  await prisma.jogviszonyBerlo.update({
    where: { id: berlo.id },
    data: {
      nev,
      email: email === "" ? null : email,
      szuletesiHely: szoveg(urlap.get("szuletesiHely")) || null,
      szuletesiIdo: napotOlvas(urlap.get("szuletesiIdo")),
      anyjaNeve: szoveg(urlap.get("anyjaNeve")) || null,
      lakcim: szoveg(urlap.get("lakcim")) || null,
      igazolvanySzam: szoveg(urlap.get("igazolvanySzam")) || null,
      telefon: szoveg(urlap.get("telefon")) || null,
    },
  });

  revalidatePath("/berlok");
  revalidatePath("/szerzodesek");

  return { allapot: "kesz", uzenet: "Az adatok mentve.", hibak: [] };
}

/** Bérlő levétele a jogviszonyról. A kiállított dokumentumokat nem érinti. */
export async function berlotTorol(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const jogviszonyBerloId = szoveg(urlap.get("jogviszonyBerloId"));

  const berlo = await sajatBerlo(berbeado.id, jogviszonyBerloId);
  if (!berlo) return hiba("Ez a bérlő nem a te jogviszonyodhoz tartozik.");

  const darab = await prisma.jogviszonyBerlo.count({
    where: { jogviszonyId: berlo.jogviszonyId },
  });
  if (darab <= 1) {
    return hiba("Az utolsó bérlőt nem veszem le: jogviszony bérlő nélkül nem értelmes.");
  }

  await prisma.jogviszonyBerlo.delete({ where: { id: berlo.id } });

  revalidatePath("/berlok");
  revalidatePath("/szerzodesek");

  return { allapot: "kesz", uzenet: `${berlo.nev} levéve a jogviszonyról.`, hibak: [] };
}
