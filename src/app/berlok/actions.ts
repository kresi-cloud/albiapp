"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { emailNekLatszik, emailtNormalizal, meghivoLejarata } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { meghivoToken } from "@/lib/meghivo";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { jogviszonytLezar, jogviszonytUjranyit } from "@/lib/jogviszony";

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
  const { sz } = await szovegek();
  const jogviszonyBerloId = szoveg(urlap.get("jogviszonyBerloId"));

  const berlo = await sajatBerlo(berbeado.id, jogviszonyBerloId);
  if (!berlo) {
    return { allapot: "hiba", uzenet: sz("berlok.hiba.nem_tied"), link: "" };
  }

  const email = emailtNormalizal(urlap.get("email") ?? berlo.email);
  if (!emailNekLatszik(email)) {
    return { allapot: "hiba", uzenet: sz("berlok.hiba.email"), link: "" };
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
    uzenet: sz("berlok.kesz.meghivo", { email }),
    link: `${await alapcim()}/meghivo/${meghivo.token}`,
  };
}

/**
 * Új bérlő a meglévő jogviszonyhoz. Több bérlőnél a fizetési kötelezettség
 * ugyanaz az egy előírás marad: egyetemlegesen felelnek érte.
 */
export async function berlotHozzaad(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));
  const nev = szoveg(urlap.get("nev"));
  const email = emailtNormalizal(urlap.get("email"));

  if (nev === "") return hiba(sz("berlok.hiba.nev_kell"));
  if (email !== "" && !emailNekLatszik(email)) {
    return hiba(sz("berlok.hiba.email_gyanus"));
  }

  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId: berbeado.id } },
    include: { berlok: true },
  });
  if (!jogviszony) return hiba(sz("berlok.hiba.jogviszony_nem_tied"));

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
    uzenet: sz("berlok.kesz.hozzaadva", { nev }),
    hibak: [],
  };
}

/**
 * A szerződéshez és az igazolásokhoz szükséges személyes adatok. Külön űrlap,
 * mert ezeket nem a mindennapi kezeléshez, hanem a dokumentumokhoz kérjük.
 */
export async function berloAdataitMenti(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jogviszonyBerloId = szoveg(urlap.get("jogviszonyBerloId"));

  const berlo = await sajatBerlo(berbeado.id, jogviszonyBerloId);
  if (!berlo) return hiba(sz("berlok.hiba.nem_tied"));

  const nev = szoveg(urlap.get("nev"));
  if (nev === "") return hiba(sz("berlok.hiba.nev_ures"));

  const email = emailtNormalizal(urlap.get("email"));
  if (email !== "" && !emailNekLatszik(email)) {
    return hiba(sz("berlok.hiba.email_gyanus"));
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
      // Aki utoljára írta, az a forrás. A bérlő belépés után felülírhatja.
      adatokForrasa: "berbeado",
      adatokFrissitve: new Date(),
    },
  });

  revalidatePath("/berlok");
  revalidatePath("/szerzodesek");

  return { allapot: "kesz", uzenet: sz("berlok.kesz.adatok"), hibak: [] };
}

/** Bérlő levétele a jogviszonyról. A kiállított dokumentumokat nem érinti. */
export async function berlotTorol(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jogviszonyBerloId = szoveg(urlap.get("jogviszonyBerloId"));

  const berlo = await sajatBerlo(berbeado.id, jogviszonyBerloId);
  if (!berlo) return hiba(sz("berlok.hiba.nem_tied"));

  const darab = await prisma.jogviszonyBerlo.count({
    where: { jogviszonyId: berlo.jogviszonyId },
  });
  if (darab <= 1) {
    return hiba(sz("berlok.hiba.utolso_berlo"));
  }

  await prisma.jogviszonyBerlo.delete({ where: { id: berlo.id } });

  revalidatePath("/berlok");
  revalidatePath("/szerzodesek");

  return { allapot: "kesz", uzenet: sz("berlok.kesz.torolve", { nev: berlo.nev }), hibak: [] };
}

export async function jogviszonytLezarAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const nyersNap = szoveg(urlap.get("vege"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nyersNap)) {
    return hiba(sz("valasz.lezaras_datum_kell"), ["vege"]);
  }
  const vege = new Date(`${nyersNap}T00:00:00.000Z`);
  if (Number.isNaN(vege.getTime())) {
    return hiba(sz("valasz.lezaras_datum_kell"), ["vege"]);
  }

  const eredmeny = await jogviszonytLezar(berbeado.id, szoveg(urlap.get("jogviszonyId")), vege);
  if (!eredmeny) return hiba(sz("valasz.nincs_jogosultsag"));

  revalidatePath("/berlok");
  revalidatePath("/befizetesek");
  revalidatePath("/");
  return {
    allapot: "kesz",
    uzenet: sz("valasz.lezarva", {
      torolt: eredmeny.toroltEloirasok,
      aranyositott: eredmeny.aranyositottEloirasok,
    }),
    hibak: [],
  };
}

export async function jogviszonytUjranyitAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const sikerult = await jogviszonytUjranyit(berbeado.id, szoveg(urlap.get("jogviszonyId")));
  if (!sikerult) return hiba(sz("valasz.nincs_jogosultsag"));

  revalidatePath("/berlok");
  revalidatePath("/befizetesek");
  revalidatePath("/");
  return { allapot: "kesz", uzenet: sz("valasz.ujranyitva"), hibak: [] };
}
