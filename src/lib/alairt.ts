/**
 * Az aláírt szerződés példányának betöltése és mentése.
 *
 * A jogosultság itt dől el, és mindig a belépett felhasználóból: a bérbeadónál
 * a tulajdon, a bérlőnél a jogviszonyon álló bérlősor. Feltölteni, cserélni,
 * törölni és rögzíteni a bérbeadó tud — ő adja ki az okiratot —, letölteni
 * mindkét fél, mert a szerződés a bérlőé is.
 */

import { prisma } from "@/lib/db";

/** A szerződés, ha a felhasználó egyáltalán láthatja. */
async function lathatoSzerzodes(
  ki: { id: string; szerep: "berbeado" | "berlo" },
  szerzodesId: string,
) {
  return prisma.szerzodes.findFirst({
    where: {
      id: szerzodesId,
      jogviszony:
        ki.szerep === "berbeado"
          ? { ingatlan: { tulajdonosId: ki.id } }
          : { berlok: { some: { berloId: ki.id } } },
    },
    select: { id: true, allapot: true },
  });
}

export type AlairtNezet = {
  id: string;
  mimeTipus: string;
  meretBajt: number;
  feltoltve: Date;
  rogzitve: Date | null;
  feltoltoNev: string;
};

export async function alairtPeldany(szerzodesId: string): Promise<AlairtNezet | null> {
  const sor = await prisma.alairtSzerzodes.findUnique({
    where: { szerzodesId },
    include: { feltolto: { select: { nev: true } } },
  });
  if (!sor) return null;
  return {
    id: sor.id,
    mimeTipus: sor.mimeTipus,
    meretBajt: sor.meretBajt,
    feltoltve: sor.feltoltve,
    rogzitve: sor.rogzitve,
    feltoltoNev: sor.feltolto.nev,
  };
}

/**
 * A fájl tartalma letöltéshez. Mindkét fél lekérheti, kívülálló nem — akkor
 * sem, ha ismeri az azonosítót: a jogosultság a jogviszonyból jön.
 */
export async function alairtTartalma(
  ki: { id: string; szerep: "berbeado" | "berlo" },
  szerzodesId: string,
): Promise<{ tartalom: Uint8Array; mimeTipus: string } | null> {
  const szerzodes = await lathatoSzerzodes(ki, szerzodesId);
  if (!szerzodes) return null;

  const sor = await prisma.alairtSzerzodes.findUnique({
    where: { szerzodesId },
    select: { tartalom: true, mimeTipus: true },
  });
  if (!sor) return null;
  return { tartalom: new Uint8Array(sor.tartalom), mimeTipus: sor.mimeTipus };
}

/**
 * Feltöltés vagy csere. Csak a bérbeadó, csak véglegesített szerződéshez, és
 * csak amíg nincs rögzítve. Az `ok` mondja meg, min bukott el, hogy a felület a
 * valódi okot írhassa ki.
 */
export async function alairtatMent(
  berbeadoId: string,
  szerzodesId: string,
  fajl: { tipus: string; tartalom: Uint8Array },
): Promise<"kesz" | "nincs_szerzodes" | "nem_vegleges" | "rogzitve"> {
  const szerzodes = await lathatoSzerzodes({ id: berbeadoId, szerep: "berbeado" }, szerzodesId);
  if (!szerzodes) return "nincs_szerzodes";
  if (szerzodes.allapot !== "veglegesitve") return "nem_vegleges";

  const megvan = await prisma.alairtSzerzodes.findUnique({
    where: { szerzodesId },
    select: { rogzitve: true },
  });
  if (megvan?.rogzitve) return "rogzitve";

  const adat = {
    feltoltoId: berbeadoId,
    mimeTipus: fajl.tipus,
    meretBajt: fajl.tartalom.byteLength,
    tartalom: Buffer.from(fajl.tartalom),
    feltoltve: new Date(),
  };
  await prisma.alairtSzerzodes.upsert({
    where: { szerzodesId },
    create: { szerzodesId, ...adat },
    update: adat,
  });
  return "kesz";
}

export async function alairtatTorol(
  berbeadoId: string,
  szerzodesId: string,
): Promise<"kesz" | "nincs" | "rogzitve"> {
  const szerzodes = await lathatoSzerzodes({ id: berbeadoId, szerep: "berbeado" }, szerzodesId);
  if (!szerzodes) return "nincs";

  const megvan = await prisma.alairtSzerzodes.findUnique({
    where: { szerzodesId },
    select: { rogzitve: true },
  });
  if (!megvan) return "nincs";
  if (megvan.rogzitve) return "rogzitve";

  await prisma.alairtSzerzodes.delete({ where: { szerzodesId } });
  return "kesz";
}

/**
 * Rögzítés: a példány végleges lesz.
 *
 * Feltételes írás, mert a rögzítés nem visszavonható: két egyszerre megnyitott
 * lapról a második kattintás különben egy már rögzített példányt „rögzítene
 * újra", és a rögzítés napja is elcsúszna attól, amikor tényleg megtörtént.
 */
export async function alairtatRogzit(
  berbeadoId: string,
  szerzodesId: string,
): Promise<"kesz" | "nincs" | "mar_rogzitve"> {
  const szerzodes = await lathatoSzerzodes({ id: berbeadoId, szerep: "berbeado" }, szerzodesId);
  if (!szerzodes) return "nincs";

  const hany = await prisma.alairtSzerzodes.updateMany({
    where: { szerzodesId, rogzitve: null },
    data: { rogzitve: new Date() },
  });
  if (hany.count > 0) return "kesz";

  const megvan = await prisma.alairtSzerzodes.findUnique({
    where: { szerzodesId },
    select: { id: true },
  });
  return megvan ? "mar_rogzitve" : "nincs";
}
