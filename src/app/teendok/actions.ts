"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = { allapot: "ures" | "kesz" | "hiba"; uzenet: string; hibak: string[] };

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

/**
 * Egy teendő változása mindkét fél listáját és mindkét kezdőlapot érinti, mert
 * a kezdőlap kiemelt sávja ugyanabból a lekérdezésből jön.
 */
function frissit(): void {
  revalidatePath("/teendok");
  revalidatePath("/berlo/teendok");
  revalidatePath("/");
  revalidatePath("/berlo");
}

/**
 * Saját teendő felvétele.
 *
 * A teendők többsége származtatott: a rendszer állapotából jön, és magától
 * eltűnik, ha az oka megszűnik. Ez a kettő azonban nem fedi le a bérlet
 * hétköznapját — a kéményseprő érkezése, a biztosítás évfordulója, a felmondási
 * határidő előtti döntés nem következik semmiből, amit az alkalmazás tud.
 * Ezért lehet kézzel is felvenni teendőt, és az tárolt: van saját sora, tehát
 * le is lehet zárni, és a lezárás vissza is vonható.
 *
 * A kulcs előtagja elválasztja a származtatottaktól, hogy egy kézzel felvett
 * teendő soha ne üsse ki azt, amit a rendszer állít elő.
 */
export async function teendotFelvesz(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const { sz } = await szovegek();
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return hiba(sz("teendo.hiba.lepj_be"));

  const cim = szoveg(urlap.get("cim"));
  const leiras = szoveg(urlap.get("leiras"));
  const esedekesseg = napotOlvas(urlap.get("esedekesseg"));
  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));

  const hianyok: string[] = [];
  if (cim === "") hianyok.push(sz("teendo.hiba.cim"));
  if (!esedekesseg) hianyok.push(sz("teendo.hiba.esedekesseg"));
  if (hianyok.length > 0) return hiba(sz("teendo.hiba.hianyos"), hianyok);

  // A bérleményhez kötés nem kötelező, de ha megadták, a kiszolgáló ellenőrzi,
  // hogy a felhasználónak tényleg köze van hozzá — nem az űrlap dönti el.
  let kotes: string | null = null;
  if (jogviszonyId !== "") {
    const jogviszony = await prisma.jogviszony.findFirst({
      where:
        felhasznalo.szerep === "berlo"
          ? { id: jogviszonyId, berlok: { some: { berloId: felhasznalo.id } } }
          : { id: jogviszonyId, ingatlan: { tulajdonosId: felhasznalo.id } },
      select: { id: true },
    });
    if (!jogviszony) return hiba(sz("valasz.nincs_hozzaferes"));
    kotes = jogviszony.id;
  }

  await prisma.teendo.create({
    data: {
      cimzettId: felhasznalo.id,
      jogviszonyId: kotes,
      tipus: "sajat",
      cim,
      leiras: leiras === "" ? null : leiras,
      esedekesseg: esedekesseg as Date,
      kulcs: `sajat:${felhasznalo.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    },
  });

  frissit();
  return { allapot: "kesz", uzenet: sz("teendo.kesz.felveve"), hibak: [] };
}

/**
 * Vállalt teendő lezárása. Csak a saját teendőjét zárhatja le bárki, és csak a
 * tárolt teendő zárható: a származtatott magától eltűnik, ha az oka megszűnik.
 */
export async function teendotLezar(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo) return hiba(sz("teendo.hiba.lepj_be"));

  const kulcs = szoveg(urlap.get("kulcs"));
  const teendo = await prisma.teendo.findFirst({
    where: { kulcs, cimzettId: felhasznalo.id },
  });
  if (!teendo) return hiba(sz("teendo.hiba.nem_tied"));

  await prisma.teendo.update({ where: { id: teendo.id }, data: { statusz: "kesz" } });

  frissit();

  return { allapot: "kesz", uzenet: sz("teendo.kesz.lezarva"), hibak: [] };
}

/**
 * A lezárás visszavonása. Egy elkattintott „kész" különben csendben eltüntetné
 * azt, amit valaki vállalt — ugyanaz az elv, mint a jogviszony lezárásánál: a
 * javítás útja megmarad.
 */
export async function teendotUjranyit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo) return hiba(sz("teendo.hiba.lepj_be"));

  const kulcs = szoveg(urlap.get("kulcs"));
  const teendo = await prisma.teendo.findFirst({
    where: { kulcs, cimzettId: felhasznalo.id },
  });
  if (!teendo) return hiba(sz("teendo.hiba.nem_tied"));

  await prisma.teendo.update({ where: { id: teendo.id }, data: { statusz: "nyitott" } });

  frissit();

  return { allapot: "kesz", uzenet: sz("teendo.kesz.ujranyitva"), hibak: [] };
}
