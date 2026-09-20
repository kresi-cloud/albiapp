"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { belepettFelhasznalo } from "@/lib/munkamenet";

export type Eredmeny = { allapot: "ures" | "kesz" | "hiba"; uzenet: string; hibak: string[] };

/**
 * Vállalt teendő lezárása. Csak a saját teendőjét zárhatja le bárki, és csak a
 * tárolt teendő zárható: a származtatott magától eltűnik, ha az oka megszűnik.
 */
export async function teendotLezar(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return { allapot: "hiba", uzenet: "Lépj be.", hibak: [] };

  const kulcs = String(urlap.get("kulcs") ?? "");
  const teendo = await prisma.teendo.findFirst({
    where: { kulcs, cimzettId: felhasznalo.id },
  });
  if (!teendo) return { allapot: "hiba", uzenet: "Ez a teendő nem a tiéd.", hibak: [] };

  await prisma.teendo.update({ where: { id: teendo.id }, data: { statusz: "kesz" } });

  revalidatePath("/");
  revalidatePath("/berlo");

  return { allapot: "kesz", uzenet: "Lezárva.", hibak: [] };
}
