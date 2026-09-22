"use server";

import { revalidatePath } from "next/cache";
import { nyelvet } from "@/domain/nyelv";
import { prisma } from "@/lib/db";
import { nyelvSutit } from "@/lib/nyelv";
import { belepettFelhasznalo } from "@/lib/munkamenet";

/**
 * Nyelvváltás. A sütibe mindig beírjuk, mert belépés előtt is kell; belépve a
 * felhasználó sorába is, hogy a másik eszközén is ezt kapja.
 */
export async function nyelvetValt(urlap: FormData): Promise<void> {
  const nyelv = nyelvet(String(urlap.get("nyelv") ?? ""));
  await nyelvSutit(nyelv);

  const felhasznalo = await belepettFelhasznalo();
  if (felhasznalo) {
    await prisma.felhasznalo.update({ where: { id: felhasznalo.id }, data: { nyelv } });
  }

  revalidatePath("/", "layout");
}
