"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { szovegek } from "@/lib/nyelv";
import { kotelezoSzerep } from "@/lib/munkamenet";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
};

function hiba(uzenet: string, hibak: string[] = []): Eredmeny {
  return { allapot: "hiba", uzenet, hibak };
}

function szoveg(ertek: FormDataEntryValue | null): string {
  return typeof ertek === "string" ? ertek.trim() : "";
}

/** Szabad szövegből egész forint. Szóköz és ezreselválasztó megengedett. */
function forintot(nyers: string): number | null {
  const tisztitott = nyers.replace(/[\s .]/g, "").replace(/Ft$/i, "");
  if (!/^\d+$/.test(tisztitott)) return null;
  return Number(tisztitott);
}

function napot(nyers: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nyers)) return null;
  const nap = new Date(`${nyers}T00:00:00.000Z`);
  return Number.isNaN(nap.getTime()) ? null : nap;
}

/** A jogviszony a bérbeadóé-e. Az űrlapból jövő azonosítóban nem bízunk. */
async function sajatJogviszony(tulajdonosId: string, jogviszonyId: string) {
  return prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId } },
    select: { id: true },
  });
}

/**
 * A bérbeadó megadja, mikor mennyi érkezett. Ez a saját oldala, nem a bérlőé:
 * a két adat külön él, és ha egyeznek, a kérdés le van zárva bizonylat nélkül.
 */
export async function beerkezestRogzit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));
  if (!(await sajatJogviszony(berbeado.id, jogviszonyId))) {
    return hiba(sz("valasz.nincs_jogosultsag"));
  }

  const nap = napot(szoveg(urlap.get("erkezesDatuma")));
  if (!nap) return hiba(sz("valasz.datum_kell"), ["erkezesDatuma"]);

  const osszegFt = forintot(szoveg(urlap.get("osszegFt")));
  if (osszegFt === null || osszegFt <= 0) return hiba(sz("valasz.osszeg_kell"), ["osszegFt"]);

  // Az előíráshoz kötés nem kötelező: a párosítás az időablak alapján megy.
  // Az előírás azonosítója csak arra kell, hogy a korábbi tagadást leváltsa.
  const eloirtTetelId = szoveg(urlap.get("eloirtTetelId")) || null;
  if (eloirtTetelId) {
    await prisma.berbeadoiIgazolas.deleteMany({
      where: { eloirtTetelId, megerkezett: false, tulajdonosId: berbeado.id },
    });
  }

  await prisma.berbeadoiIgazolas.create({
    data: {
      tulajdonosId: berbeado.id,
      jogviszonyId,
      megerkezett: true,
      erkezesDatuma: nap,
      osszegFt,
      kozlemeny: szoveg(urlap.get("kozlemeny")) || null,
    },
  });

  revalidatePath("/befizetesek");
  revalidatePath("/ado");
  revalidatePath("/");
  return { allapot: "kesz", uzenet: sz("valasz.beerkezes_rogzitve"), hibak: [] };
}

/**
 * A bérbeadó kimondja, hogy egy előírásra nem érkezett pénz. Enélkül egy
 * elmaradt utalás örökké a másik fél adatára várna, holott a bérbeadó már
 * megnézte. Ha a bérlő közben azt mondja, elutalta, ebből lesz a vita — és
 * onnantól van értelme az adott utalás bizonylatának.
 */
export async function nemErkezettMeg(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const eloirtTetelId = szoveg(urlap.get("eloirtTetelId"));
  const eloiras = await prisma.eloirtTetel.findFirst({
    where: { id: eloirtTetelId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
    select: { id: true, jogviszonyId: true, esedekesseg: true },
  });
  if (!eloiras) return hiba(sz("valasz.nincs_jogosultsag"));

  await prisma.berbeadoiIgazolas.upsert({
    where: { eloirtTetelId: eloiras.id },
    update: { megerkezett: false, osszegFt: 0, erkezesDatuma: eloiras.esedekesseg },
    create: {
      tulajdonosId: berbeado.id,
      jogviszonyId: eloiras.jogviszonyId,
      eloirtTetelId: eloiras.id,
      megerkezett: false,
      erkezesDatuma: eloiras.esedekesseg,
      osszegFt: 0,
    },
  });

  revalidatePath("/befizetesek");
  revalidatePath("/");
  return { allapot: "kesz", uzenet: sz("valasz.nem_erkezett_rogzitve"), hibak: [] };
}

/** Tévesen rögzített beérkezés visszavonása. A bérlő adatához nem nyúl. */
export async function beerkezestTorol(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const eredmeny = await prisma.berbeadoiIgazolas.deleteMany({
    where: { id: szoveg(urlap.get("igazolasId")), tulajdonosId: berbeado.id },
  });
  if (eredmeny.count === 0) return hiba(sz("valasz.nincs_jogosultsag"));

  revalidatePath("/befizetesek");
  revalidatePath("/ado");
  revalidatePath("/");
  return { allapot: "kesz", uzenet: sz("valasz.visszavonva"), hibak: [] };
}
