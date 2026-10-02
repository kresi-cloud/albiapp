"use server";

import { revalidatePath } from "next/cache";
import { urlapForint } from "@/domain/penz";
import { prisma } from "@/lib/db";
import { szovegek } from "@/lib/nyelv";
import { kotelezoSzerep } from "@/lib/munkamenet";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
};

function hiba(uzenet: string): Eredmeny {
  return { allapot: "hiba", uzenet, hibak: [] };
}

function szoveg(ertek: FormDataEntryValue | null): string {
  return typeof ertek === "string" ? ertek.trim() : "";
}

/**
 * Szabad szövegből egész forint, a közös olvasóval.
 *
 * Saját olvasója volt, és a pontot mindig ezreselválasztónak vette: a
 * „1000.50" százezer-ötven lett, miközben ugyanaz a szöveg az igazolás
 * űrlapján ezer forintot jelentett. Egy alkalmazásban egy összegolvasó van.
 */
function forintot(nyers: string): number | null {
  const ertek = urlapForint(nyers);
  return ertek === null || Number.isNaN(ertek) ? null : ertek;
}

function napot(nyers: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nyers)) return null;
  const nap = new Date(`${nyers}T00:00:00.000Z`);
  return Number.isNaN(nap.getTime()) ? null : nap;
}

/**
 * A bérlő megadja a saját oldalát: mikor mennyit utalt, milyen közleménnyel.
 * Ez nem felülírja a bérbeadó adatát, és a bérbeadóé sem ezt: a kettő
 * összevetése az egyeztetés. Teljes bankszámlakivonatot soha nem kérünk.
 */
export async function utalastRogzit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berlo = await kotelezoSzerep("berlo");
  const { sz } = await szovegek();

  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));
  const sajat = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, berlok: { some: { berloId: berlo.id } } },
    select: { id: true },
  });
  if (!sajat) return hiba(sz("valasz.nincs_jogosultsag"));

  const nap = napot(szoveg(urlap.get("utalasDatuma")));
  if (!nap) return hiba(sz("valasz.datum_kell"));

  const osszegFt = forintot(szoveg(urlap.get("osszegFt")));
  if (osszegFt === null || osszegFt <= 0) return hiba(sz("valasz.osszeg_kell"));

  await prisma.berloiIgazolas.create({
    data: {
      jogviszonyId,
      szerzoId: berlo.id,
      utalasDatuma: nap,
      osszegFt,
      kozlemeny: szoveg(urlap.get("kozlemeny")) || null,
    },
  });

  revalidatePath("/berlo");
  revalidatePath("/befizetesek");
  return { allapot: "kesz", uzenet: sz("valasz.utalas_rogzitve"), hibak: [] };
}

/**
 * Elgépelt utalás visszavonása. A bérbeadó adatához nem nyúl — és a
 * lakótárséhoz sem.
 *
 * A szűrés korábban csak a jogviszonyra ment, a sornak pedig nem volt
 * szerzője: két lakótárs közül bármelyik visszavonhatta a másik
 * nyilatkozatát, és a másik csak abból vette volna észre, hogy a tétel megint
 * a bérbeadóra vár. A saját oldalát mindenki maga adja meg, tehát maga is
 * veszi vissza — ugyanaz az elv, mint a bizonylatnál, ahol a feltöltő fájlját
 * nem írjuk felül a lakótárséval.
 *
 * A mező előtt született sorokon nincs szerző, és azokat a jogviszony bármelyik
 * bérlője visszavonhatja: nem tudjuk, ki írta, és egy visszavonhatatlan sor
 * rosszabb lenne.
 */
export async function utalastTorol(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berlo = await kotelezoSzerep("berlo");
  const { sz } = await szovegek();

  const eredmeny = await prisma.berloiIgazolas.deleteMany({
    where: {
      id: szoveg(urlap.get("igazolasId")),
      jogviszony: { berlok: { some: { berloId: berlo.id } } },
      OR: [{ szerzoId: berlo.id }, { szerzoId: null }],
    },
  });
  if (eredmeny.count === 0) return hiba(sz("valasz.nincs_jogosultsag"));

  revalidatePath("/berlo");
  revalidatePath("/befizetesek");
  return { allapot: "kesz", uzenet: sz("valasz.visszavonva"), hibak: [] };
}
