"use server";

import { revalidatePath } from "next/cache";
import { osszegetForintra } from "@/domain/penz";
import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = { allapot: "ures" | "kesz" | "hiba"; uzenet: string; hibak: string[] };

function hiba(uzenet: string): Eredmeny {
  return { allapot: "hiba", uzenet, hibak: [] };
}

function napotOlvas(nyers: unknown): Date | null {
  const szoveg = String(nyers ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(szoveg)) return null;
  const nap = new Date(`${szoveg}T00:00:00.000Z`);
  return Number.isNaN(nap.getTime()) ? null : nap;
}

/** Költség rögzítése a tételes adóelszámoláshoz. */
export async function koltsegetRogzit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const ingatlanId = String(urlap.get("ingatlanId") ?? "");
  const nap = napotOlvas(urlap.get("datum"));
  const megnevezes = String(urlap.get("megnevezes") ?? "").trim();
  const fajta = String(urlap.get("fajta") ?? "egyeb");
  const osszegFt = osszegetForintra(String(urlap.get("osszegFt") ?? ""));

  if (!nap) return hiba(sz("ado.hiba.datum"));
  if (megnevezes === "") return hiba(sz("ado.hiba.megnevezes"));
  if (osszegFt === null || osszegFt <= 0) return hiba(sz("ado.hiba.osszeg"));

  const ingatlan = await prisma.ingatlan.findFirst({
    where: { id: ingatlanId, tulajdonosId: berbeado.id },
  });
  if (!ingatlan) return hiba(sz("ado.hiba.ingatlan"));

  await prisma.koltseg.create({
    data: { ingatlanId: ingatlan.id, datum: nap, megnevezes, fajta, osszegFt },
  });

  revalidatePath("/ado");
  return { allapot: "kesz", uzenet: sz("ado.kesz.koltseg", { megnevezes }), hibak: [] };
}

/** Az értékcsökkenés alapja: mennyiért és mikor vetted az ingatlant. */
export async function beszerzestRogzit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const ingatlanId = String(urlap.get("ingatlanId") ?? "");
  const nap = napotOlvas(urlap.get("beszerzesDatuma"));
  const ar = osszegetForintra(String(urlap.get("beszerzesiArFt") ?? ""));

  if (ar === null || ar <= 0) return hiba(sz("ado.hiba.beszerzesi_ar"));

  const ingatlan = await prisma.ingatlan.findFirst({
    where: { id: ingatlanId, tulajdonosId: berbeado.id },
  });
  if (!ingatlan) return hiba(sz("ado.hiba.ingatlan"));

  await prisma.ingatlan.update({
    where: { id: ingatlan.id },
    data: { beszerzesiArFt: ar, beszerzesDatuma: nap },
  });

  revalidatePath("/ado");
  return {
    allapot: "kesz",
    uzenet: sz("ado.kesz.beszerzes"),
    hibak: [],
  };
}
