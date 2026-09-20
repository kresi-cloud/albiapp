"use server";

import { revalidatePath } from "next/cache";
import { ablakotEllenoriz } from "@/domain/egyeztetes";
import { prisma } from "@/lib/db";
import { aktualisBerbeado } from "@/lib/lekerdezesek";

export type MentesEredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
};

export async function beallitasokatMent(
  _elozo: MentesEredmeny,
  urlap: FormData,
): Promise<MentesEredmeny> {
  const berbeado = await aktualisBerbeado();
  if (!berbeado) {
    return { allapot: "hiba", uzenet: "Nincs bejelentkezett bérbeadó.", hibak: [] };
  }

  const { ablak, hibak } = ablakotEllenoriz({
    korabbiAblakNap: urlap.get("korabbiAblakNap"),
    kesobbiAblakNap: urlap.get("kesobbiAblakNap"),
  });

  if (!ablak) {
    return { allapot: "hiba", uzenet: "A beállítás nem mentve.", hibak };
  }

  await prisma.beallitasok.upsert({
    where: { berbeadoId: berbeado.id },
    update: ablak,
    create: { berbeadoId: berbeado.id, ...ablak },
  });

  // Az ablak minden párosítást újraszámol, tehát a teendők és az áttekintő is változhat.
  revalidatePath("/beallitasok");
  revalidatePath("/befizetesek");
  revalidatePath("/berlo");
  revalidatePath("/");

  return {
    allapot: "kesz",
    uzenet: `Mentve. Mostantól az esedékesség előtt ${ablak.korabbiAblakNap} és utána ${ablak.kesobbiAblakNap} nappal érkezett befizetést kötöm ugyanahhoz az előíráshoz.`,
    hibak: [],
  };
}
