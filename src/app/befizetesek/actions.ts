"use server";

import { revalidatePath } from "next/cache";
import { kivonatotOlvas } from "@/domain/kivonat";
import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";

export type FeltoltesEredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  beolvasott: number;
  kihagyott: number;
  hibak: string[];
};

export async function kivonatotFeltolt(
  _elozo: FeltoltesEredmeny,
  urlap: FormData,
): Promise<FeltoltesEredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");

  const jogviszonyId = String(urlap.get("jogviszonyId") ?? "");
  const fajl = urlap.get("kivonat");

  if (!(fajl instanceof File) || fajl.size === 0) {
    return { allapot: "hiba", uzenet: "Válassz ki egy kivonatfájlt.", beolvasott: 0, kihagyott: 0, hibak: [] };
  }
  if (!jogviszonyId) {
    return { allapot: "hiba", uzenet: "Válaszd ki, melyik jogviszonyhoz tartozik.", beolvasott: 0, kihagyott: 0, hibak: [] };
  }

  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId: berbeado.id } },
  });
  if (!jogviszony) {
    return { allapot: "hiba", uzenet: "Ez a jogviszony nem a tiéd.", beolvasott: 0, kihagyott: 0, hibak: [] };
  }

  const tartalom = await fajl.text();
  const eredmeny = kivonatotOlvas(tartalom);

  if (eredmeny.sorok.length === 0) {
    return {
      allapot: "hiba",
      uzenet: "Egyetlen sort sem tudtam beolvasni a fájlból.",
      beolvasott: 0,
      kihagyott: eredmeny.hibak.length,
      hibak: eredmeny.hibak.map((hiba) => `${hiba.sorszam}. sor: ${hiba.ok}`),
    };
  }

  let beolvasott = 0;
  let mar = 0;

  for (const sor of eredmeny.sorok) {
    // A bejövő pénz érdekel: a terhelések nem befizetések.
    if (sor.osszegFt <= 0) continue;

    const ujjlenyomat = `${berbeado.id}:${sor.ujjlenyomat}`;
    const letezo = await prisma.kivonattetel.findUnique({
      where: { sorUjjlenyomat: ujjlenyomat },
    });
    if (letezo) {
      mar++;
      continue;
    }

    await prisma.kivonattetel.create({
      data: {
        tulajdonosId: berbeado.id,
        jogviszonyId: jogviszony.id,
        konyvelesDatuma: sor.konyvelesDatuma,
        osszegFt: sor.osszegFt,
        kozlemeny: sor.kozlemeny,
        partnerNev: sor.partnerNev,
        forrasFajl: fajl.name,
        sorUjjlenyomat: ujjlenyomat,
      },
    });
    beolvasott++;
  }

  revalidatePath("/befizetesek");
  revalidatePath("/");

  return {
    allapot: "kesz",
    uzenet:
      beolvasott === 0
        ? "Minden sor már benne volt, új tétel nem került be."
        : `${beolvasott} új tétel került be a kivonatból.`,
    beolvasott,
    kihagyott: mar + eredmeny.hibak.length,
    hibak: eredmeny.hibak.map((hiba) => `${hiba.sorszam}. sor: ${hiba.ok}`),
  };
}
