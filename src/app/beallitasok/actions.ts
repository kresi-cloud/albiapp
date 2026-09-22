"use server";

import { revalidatePath } from "next/cache";
import { ablakotEllenoriz } from "@/domain/egyeztetes";
import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { adatkeresLatta } from "@/lib/szemelyes-adatok";

export type MentesEredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
};

export async function beallitasokatMent(
  _elozo: MentesEredmeny,
  urlap: FormData,
): Promise<MentesEredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");

  const { ablak, hibak } = ablakotEllenoriz({
    korabbiAblakNap: urlap.get("korabbiAblakNap"),
    kesobbiAblakNap: urlap.get("kesobbiAblakNap"),
  });

  if (!ablak) {
    return { allapot: "hiba", uzenet: "A beállítás nem mentve.", hibak };
  }

  // A jelöletlen kapcsoló nem küld értéket: a hiánya a "nem" válasz.
  const bizonylatKeres = urlap.get("bizonylatKeres") !== null;
  const mentendo = { ...ablak, bizonylatKeres };

  await prisma.beallitasok.upsert({
    where: { berbeadoId: berbeado.id },
    update: mentendo,
    create: { berbeadoId: berbeado.id, ...mentendo },
  });

  // Az ablak minden párosítást újraszámol, tehát a teendők és az áttekintő is változhat.
  revalidatePath("/beallitasok");
  revalidatePath("/befizetesek");
  revalidatePath("/berlo");
  revalidatePath("/");

  return {
    allapot: "kesz",
    uzenet:
      `Mentve. Mostantól az esedékesség előtt ${ablak.korabbiAblakNap} és utána ` +
      `${ablak.kesobbiAblakNap} nappal érkezett befizetést kötöm ugyanahhoz az előíráshoz. ` +
      (bizonylatKeres
        ? "Vitás tételnél bizonylatot kérek mindkét féltől."
        : "Vitás tételnél nem kérek bizonylatot."),
    hibak: [],
  };
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

/**
 * A bérbeadó szerződéshez kellő adatai. A belépéshez egyik sem kell, ezért
 * külön táblában élnek, és csak a dokumentumok készítésekor olvassuk őket.
 */
export async function berbeadoiAdatokatMent(
  _elozo: MentesEredmeny,
  urlap: FormData,
): Promise<MentesEredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");

  const adatok = {
    szuletesiHely: szoveg(urlap.get("szuletesiHely")) || null,
    szuletesiIdo: napotOlvas(urlap.get("szuletesiIdo")),
    anyjaNeve: szoveg(urlap.get("anyjaNeve")) || null,
    lakcim: szoveg(urlap.get("lakcim")) || null,
    igazolvanySzam: szoveg(urlap.get("igazolvanySzam")) || null,
    adoazonosito: szoveg(urlap.get("adoazonosito")) || null,
    telefon: szoveg(urlap.get("telefon")) || null,
    bankszamla: szoveg(urlap.get("bankszamla")) || null,
    bank: szoveg(urlap.get("bank")) || null,
  };

  await prisma.berbeadoiAdatok.upsert({
    where: { berbeadoId: berbeado.id },
    update: adatok,
    create: { berbeadoId: berbeado.id, ...adatok },
  });

  // A mentés egyben azt is jelenti, hogy az első belépéskori adatkérést látta.
  await adatkeresLatta(berbeado.id);

  revalidatePath("/beallitasok");
  revalidatePath("/szerzodesek");

  return { allapot: "kesz", uzenet: "Az adataid mentve.", hibak: [] };
}
