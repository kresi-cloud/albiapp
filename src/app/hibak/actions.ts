"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import {
  allapotNeve,
  lepesLehetseges,
  OKOK,
  SURGOSSEGEK,
  TERULETEK,
  type HibaAllapot,
  type HibaSurgosseg,
  type Ok,
  type Terulet,
} from "@/domain/hibabejelentes";

export type Eredmeny = { allapot: "ures" | "kesz" | "hiba"; uzenet: string; hibak: string[] };

const URES: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

function hiba(uzenet: string, hibak: string[] = []): Eredmeny {
  return { allapot: "hiba", uzenet, hibak };
}

function szoveg(nyers: unknown): string {
  return String(nyers ?? "").trim();
}

/** Mindkét fél listáját és a kezdőlapok teendőit is érinti egy változás. */
function frissit(): void {
  revalidatePath("/hibak");
  revalidatePath("/berlo/hibak");
  revalidatePath("/");
  revalidatePath("/berlo");
}

/** A jogviszony, amihez a belépett felhasználó hozzáfér, szerepével együtt. */
async function elerhetoJogviszony(felhasznaloId: string, szerep: string, jogviszonyId: string) {
  return prisma.jogviszony.findFirst({
    where:
      szerep === "berlo"
        ? { id: jogviszonyId, berlok: { some: { berloId: felhasznaloId } } }
        : { id: jogviszonyId, ingatlan: { tulajdonosId: felhasznaloId } },
    select: { id: true },
  });
}

/** Az a bejelentés, amit a belépett felhasználó láthat. */
async function elerhetoHiba(felhasznaloId: string, szerep: string, hibaId: string) {
  return prisma.hibabejelentes.findFirst({
    where:
      szerep === "berlo"
        ? { id: hibaId, jogviszony: { berlok: { some: { berloId: felhasznaloId } } } }
        : { id: hibaId, jogviszony: { ingatlan: { tulajdonosId: felhasznaloId } } },
  });
}

export async function hibatBejelent(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const { sz } = await szovegek();
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return hiba(sz("valasz.lepj_be"));

  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));
  const jogviszony = await elerhetoJogviszony(felhasznalo.id, felhasznalo.szerep, jogviszonyId);
  if (!jogviszony) return hiba(sz("valasz.nincs_hozzaferes"));

  const targy = szoveg(urlap.get("targy"));
  const leiras = szoveg(urlap.get("leiras"));
  const terulet = szoveg(urlap.get("terulet")) as Terulet;
  const ok = szoveg(urlap.get("ok")) as Ok;
  const surgosseg = szoveg(urlap.get("surgosseg")) as HibaSurgosseg;

  const hianyok: string[] = [];
  if (targy === "") hianyok.push(sz("valasz.hiany.targy"));
  if (leiras === "") hianyok.push(sz("valasz.hiany.leiras"));
  if (!TERULETEK.includes(terulet)) hianyok.push(sz("valasz.hiany.terulet"));
  if (!OKOK.includes(ok)) hianyok.push(sz("valasz.hiany.ok"));
  if (!SURGOSSEGEK.includes(surgosseg)) hianyok.push(sz("valasz.hiany.surgosseg"));
  if (hianyok.length > 0) return hiba(sz("valasz.potold"), hianyok);

  await prisma.hibabejelentes.create({
    data: {
      jogviszonyId,
      bejelentoId: felhasznalo.id,
      targy,
      leiras,
      terulet,
      ok,
      surgosseg,
    },
  });

  frissit();

  return {
    allapot: "kesz",
    uzenet: sz(
      surgosseg === "veszhelyzet" ? "valasz.bejelentve.veszely" : "valasz.bejelentve",
    ),
    hibak: [],
  };
}

/** Állapotlépés. Hogy ki mit léphet, az a domainben van, nem az űrlapon. */
export async function hibatLep(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const { sz, u } = await szovegek();
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return hiba(sz("valasz.lepj_be"));

  const hibaId = szoveg(urlap.get("hibaId"));
  const cel = szoveg(urlap.get("cel")) as HibaAllapot;

  const bejelentes = await elerhetoHiba(felhasznalo.id, felhasznalo.szerep, hibaId);
  if (!bejelentes) return hiba(sz("valasz.nem_tied"));

  const szerep = felhasznalo.szerep === "berlo" ? "berlo" : "berbeado";
  if (!lepesLehetseges(bejelentes.allapot as HibaAllapot, cel, szerep)) {
    return hiba(sz("valasz.lepes_nem_lehet"));
  }

  const most = new Date();
  await prisma.hibabejelentes.update({
    where: { id: bejelentes.id },
    data: {
      allapot: cel,
      atvetve: cel === "atvette" && !bejelentes.atvetve ? most : bejelentes.atvetve,
      elharitva: cel === "elharitva" ? most : cel === "folyamatban" ? null : bejelentes.elharitva,
      lezarva: cel === "lezarva" || cel === "elutasitva" ? most : null,
    },
  });

  frissit();

  return {
    allapot: "kesz",
    uzenet: sz("valasz.uj_allapot", { allapot: u(allapotNeve(cel)) }),
    hibak: [],
  };
}

/** A költségviselőt csak a bérbeadó mondhatja ki, és csak ő írhatja felül. */
export async function viselotMent(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const { sz } = await szovegek();
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo || felhasznalo.szerep !== "berbeado") {
    return hiba(sz("valasz.csak_berbeado"));
  }

  const hibaId = szoveg(urlap.get("hibaId"));
  const viselo = szoveg(urlap.get("viseloFel"));
  if (!["berbeado", "berlo", "megosztott", ""].includes(viselo)) {
    return hiba(sz("valasz.ismeretlen_viselo"));
  }

  const bejelentes = await elerhetoHiba(felhasznalo.id, "berbeado", hibaId);
  if (!bejelentes) return hiba(sz("valasz.nem_tied"));

  await prisma.hibabejelentes.update({
    where: { id: bejelentes.id },
    data: { viseloFel: viselo === "" ? null : viselo },
  });

  frissit();

  return {
    allapot: "kesz",
    uzenet: sz(viselo === "" ? "valasz.viselo_torolve" : "valasz.viselo_mentve"),
    hibak: [],
  };
}

export async function uzenetetKuld(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const { sz } = await szovegek();
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return hiba(sz("valasz.lepj_be"));

  const hibaId = szoveg(urlap.get("hibaId"));
  const uzenet = szoveg(urlap.get("szoveg"));
  if (uzenet === "") return URES;

  const bejelentes = await elerhetoHiba(felhasznalo.id, felhasznalo.szerep, hibaId);
  if (!bejelentes) return hiba(sz("valasz.nem_tied"));

  await prisma.hibaUzenet.create({
    data: { hibabejelentesId: bejelentes.id, szerzoId: felhasznalo.id, szoveg: uzenet },
  });

  frissit();

  return { allapot: "kesz", uzenet: sz("valasz.elkuldve"), hibak: [] };
}
