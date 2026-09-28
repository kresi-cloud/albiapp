/**
 * Mérőóra és díjszabás tárolása.
 *
 * Három szabály él itt, és egyik sem az űrlapból jön:
 *  - a mérőóra a bérbeadó saját bérleményéé,
 *  - amire már épül mérés vagy kiadott elszámolás, azt nem visszük el,
 *  - a díjszabás nem íródik felül, hanem újat veszünk fel: a régi elszámolások
 *    így ugyanazt mutatják, mint amikor kiadtuk őket.
 */

import { prisma } from "@/lib/db";

export type MerooraTorlesHiba =
  | "nem_tied"
  | "van_oraallas"
  | "van_elszamolas";

/** A mérőóra a bérbeadóé-e. Az űrlapból jövő azonosítóban nem bízunk. */
export async function sajatMeroora(tulajdonosId: string, merooraId: string) {
  return prisma.meroora.findFirst({
    where: { id: merooraId, ingatlan: { tulajdonosId } },
    select: { id: true, tipus: true, mertekegyseg: true, ingatlanId: true },
  });
}

export async function merooratFelvesz(
  tulajdonosId: string,
  ingatlanId: string,
  adat: { tipus: string; mertekegyseg: string; gyariSzam: string | null; almero: boolean },
): Promise<boolean> {
  const ingatlan = await prisma.ingatlan.findFirst({
    where: { id: ingatlanId, tulajdonosId },
    select: { id: true },
  });
  if (!ingatlan) return false;

  await prisma.meroora.create({ data: { ingatlanId, ...adat } });
  return true;
}

/**
 * Az adatok javítása.
 *
 * A mértékegység csak addig javítható, amíg nincs egyetlen óraállás sem: a
 * meglévő mérések számai abban a mértékegységben értendők, és egy átírás
 * visszamenőleg tenné mássá a korábbi elszámolásokat. A gyári szám és az
 * almérő-jelölés ettől függetlenül javítható — azok leírják az órát, nem
 * a mérést.
 */
export async function merooratModosit(
  tulajdonosId: string,
  merooraId: string,
  adat: { tipus: string; mertekegyseg: string; gyariSzam: string | null; almero: boolean },
): Promise<"kesz" | MerooraTorlesHiba> {
  const meroora = await prisma.meroora.findFirst({
    where: { id: merooraId, ingatlan: { tulajdonosId } },
    select: { id: true, mertekegyseg: true, tipus: true, _count: { select: { oraallasok: true } } },
  });
  if (!meroora) return "nem_tied";

  const merestErint =
    adat.mertekegyseg !== meroora.mertekegyseg || adat.tipus !== meroora.tipus;
  if (merestErint && meroora._count.oraallasok > 0) return "van_oraallas";

  await prisma.meroora.update({ where: { id: merooraId }, data: adat });
  return "kesz";
}

export async function merooratTorol(
  tulajdonosId: string,
  merooraId: string,
): Promise<"kesz" | MerooraTorlesHiba> {
  const meroora = await prisma.meroora.findFirst({
    where: { id: merooraId, ingatlan: { tulajdonosId } },
    select: {
      id: true,
      _count: { select: { oraallasok: true, tetelek: true, jegyzokonyvTetelek: true } },
    },
  });
  if (!meroora) return "nem_tied";
  if (meroora._count.tetelek > 0 || meroora._count.jegyzokonyvTetelek > 0) {
    return "van_elszamolas";
  }
  if (meroora._count.oraallasok > 0) return "van_oraallas";

  await prisma.meroora.delete({ where: { id: merooraId } });
  return "kesz";
}

export type DijszabasHiba = "nem_tied" | "van_mar" | "elszamolt";

export async function dijszabastFelvesz(
  tulajdonosId: string,
  merooraId: string,
  adat: {
    ervenyesTol: Date;
    kedvezmenyesArFiller: number;
    piaciArFiller: number;
    evesKeret: number | null;
    alapdijFt: number;
    csatornaArFiller: number;
  },
): Promise<"kesz" | DijszabasHiba> {
  const meroora = await sajatMeroora(tulajdonosId, merooraId);
  if (!meroora) return "nem_tied";

  // Két díjszabás ugyanarra a napra: onnantól a sorrend döntené el, melyik
  // érvényes, Postgresen pedig az azonos rendezőkulcsú sorok sorrendje nincs
  // garantálva — ugyanaz az elszámolás két futásra más árat adna.
  const utkozes = await prisma.dijszabas.findFirst({
    where: { merooraId, ervenyesTol: adat.ervenyesTol },
    select: { id: true },
  });
  if (utkozes) return "van_mar";

  await prisma.dijszabas.create({ data: { merooraId, ...adat } });
  return "kesz";
}

/**
 * Díjszabás törlése.
 *
 * Csak addig, amíg nem épül rá kiadott elszámolás: a kiadott okirat szövege az
 * akkori árat idézi, és a bérlő azt fogja a számlájával összevetni. Áremeléshez
 * nem törölni kell, hanem újat felvenni későbbi érvényességi nappal.
 */
export async function dijszabastTorol(
  tulajdonosId: string,
  dijszabasId: string,
): Promise<"kesz" | DijszabasHiba> {
  const dijszabas = await prisma.dijszabas.findFirst({
    where: { id: dijszabasId, meroora: { ingatlan: { tulajdonosId } } },
    select: { id: true, merooraId: true, ervenyesTol: true },
  });
  if (!dijszabas) return "nem_tied";

  const epult = await prisma.elszamolasTetel.findFirst({
    where: {
      merooraId: dijszabas.merooraId,
      elszamolas: { idoszakVege: { gte: dijszabas.ervenyesTol } },
    },
    select: { id: true },
  });
  if (epult) return "elszamolt";

  await prisma.dijszabas.delete({ where: { id: dijszabasId } });
  return "kesz";
}

export type AllasHiba = "nem_tied" | "elszamolt";

/**
 * Óraállás visszavonása.
 *
 * A sajátját mindenki visszavonhatja, a másikét senki — ugyanaz az elv, mint a
 * befizetési nyilatkozatnál. Amire viszont már épül elszámolás, azt nem: a
 * kiadott okirat számai abból a mérésből jöttek. Elgépelt állás helyett ilyenkor
 * új leolvasás jön, mai nappal.
 */
export async function oraallastVisszavon(
  felhasznaloId: string,
  oraallasId: string,
): Promise<"kesz" | AllasHiba> {
  const allas = await prisma.oraallas.findFirst({
    where: { id: oraallasId, rogzitoId: felhasznaloId },
    select: { id: true, merooraId: true, datum: true },
  });
  if (!allas) return "nem_tied";

  const epult = await prisma.elszamolasTetel.findFirst({
    where: {
      merooraId: allas.merooraId,
      elszamolas: { idoszakVege: { gte: allas.datum } },
    },
    select: { id: true },
  });
  if (epult) return "elszamolt";

  await prisma.oraallas.delete({ where: { id: oraallasId } });
  return "kesz";
}
