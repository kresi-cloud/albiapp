"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szerzodesBemenet } from "@/lib/szerzodes";
import {
  ajanlottModulok,
  hianyzoAdatok,
  modultKeres,
  szerzodesSzovege,
} from "@/domain/szerzodes-keszites";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
};

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

/** Új tervezet a jogviszony adataiból, az ajánlott modulkészlettel. */
export async function szerzodestKeszit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));

  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId: berbeado.id } },
    include: { ingatlan: true, berlok: { orderBy: { sorrend: "asc" } } },
  });
  if (!jogviszony) return hiba("Ez a jogviszony nem a tiéd.");
  if (jogviszony.berlok.length === 0) {
    return hiba("Előbb vedd fel a bérlőt a jogviszonyhoz, különben nincs kivel szerződni.");
  }

  const berbeadoiAdatok = await prisma.berbeadoiAdatok.findUnique({
    where: { berbeadoId: berbeado.id },
  });

  const ajanlott = ajanlottModulok({
    berbeado: {
      nev: berbeado.nev,
      email: berbeado.email,
      lakcim: berbeadoiAdatok?.lakcim ?? null,
      bankszamla: berbeadoiAdatok?.bankszamla ?? null,
    },
    berlok: jogviszony.berlok.map((berlo) => ({ nev: berlo.nev })),
    ingatlan: {
      megnevezes: jogviszony.ingatlan.megnevezes,
      cim: jogviszony.ingatlan.cim,
      alapteruletM2: jogviszony.ingatlan.alapteruletM2,
      helyrajziSzam: jogviszony.ingatlan.helyrajziSzam,
      energetikaiAzonosito: jogviszony.ingatlan.energetikaiAzonosito,
      kozosKoltsegFt: jogviszony.ingatlan.kozosKoltsegFt,
    },
    jogviszony: {
      kezdete: jogviszony.kezdete,
      vege: jogviszony.vege,
      berletiDijFt: jogviszony.berletiDijFt,
      kozosKoltsegFt: jogviszony.kozosKoltsegFt,
      kaucioFt: jogviszony.kaucioFt,
      fizetesiNap: jogviszony.fizetesiNap,
      rezsiElszamolas: jogviszony.rezsiElszamolas,
      rezsiAtalanyFt: jogviszony.rezsiAtalanyFt,
    },
  });

  // A kötelező modulok mindig bekerülnek a szövegbe, ezért csak a választhatókat
  // mentjük el: a lista így azt mutatja, amit a bérbeadó valóban eldöntött.
  const valaszthatok = ajanlott.filter((kulcs) => modultKeres(kulcs)?.kotelezo === false);

  const szerzodes = await prisma.szerzodes.create({
    data: {
      jogviszonyId,
      megnevezes: `Bérleti szerződés – ${jogviszony.ingatlan.megnevezes}`,
      modulok: { create: valaszthatok.map((kulcs, sorrend) => ({ kulcs, sorrend })) },
    },
  });

  revalidatePath("/szerzodesek");
  redirect(`/szerzodesek/${szerzodes.id}`);
}

/** Modul be- vagy kikapcsolása. Kötelező modult nem lehet kikapcsolni. */
export async function modultValt(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const szerzodesId = szoveg(urlap.get("szerzodesId"));
  const kulcs = szoveg(urlap.get("kulcs"));

  const modul = modultKeres(kulcs);
  if (!modul) return hiba("Nincs ilyen modul.");
  if (modul.kotelezo) return hiba("Ez a modul kötelező, nem kapcsolható ki.");

  const szerzodes = await prisma.szerzodes.findFirst({
    where: { id: szerzodesId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
    include: { modulok: true },
  });
  if (!szerzodes) return hiba("Ez a szerződés nem a tiéd.");
  if (szerzodes.allapot !== "tervezet") {
    return hiba("A véglegesített szerződés szövege nem változtatható.");
  }

  const megvan = szerzodes.modulok.find((sor) => sor.kulcs === kulcs);
  if (megvan) {
    await prisma.szerzodesModul.delete({ where: { id: megvan.id } });
  } else {
    await prisma.szerzodesModul.create({
      data: { szerzodesId, kulcs, sorrend: szerzodes.modulok.length },
    });
  }

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  return {
    allapot: "kesz",
    uzenet: megvan ? `„${modul.cim}” kikapcsolva.` : `„${modul.cim}” bekapcsolva.`,
    hibak: [],
  };
}

/** A paraméterek mentése. Az üresen hagyott mező visszaáll alapértelmezésre. */
export async function parametereketMenti(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  const szerzodes = await prisma.szerzodes.findFirst({
    where: { id: szerzodesId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
  });
  if (!szerzodes) return hiba("Ez a szerződés nem a tiéd.");
  if (szerzodes.allapot !== "tervezet") {
    return hiba("A véglegesített szerződés szövege nem változtatható.");
  }

  const kelteHelye = szoveg(urlap.get("kelteHelye"));
  const kelte = napotOlvas(urlap.get("kelte"));

  const mentendok: { kulcs: string; ertek: string }[] = [];
  for (const [kulcs, nyers] of urlap.entries()) {
    if (!kulcs.startsWith("p_")) continue;
    mentendok.push({ kulcs: kulcs.slice(2), ertek: szoveg(nyers) });
  }

  await prisma.$transaction([
    prisma.szerzodes.update({
      where: { id: szerzodesId },
      data: { kelteHelye, kelte },
    }),
    ...mentendok.map((sor) =>
      sor.ertek === ""
        ? prisma.szerzodesParameter.deleteMany({ where: { szerzodesId, kulcs: sor.kulcs } })
        : prisma.szerzodesParameter.upsert({
            where: { szerzodesId_kulcs: { szerzodesId, kulcs: sor.kulcs } },
            create: { szerzodesId, kulcs: sor.kulcs, ertek: sor.ertek },
            update: { ertek: sor.ertek },
          }),
    ),
  ]);

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  return { allapot: "kesz", uzenet: "A beállítások mentve, a szöveg frissült.", hibak: [] };
}

/**
 * Véglegesítés: a szöveget befagyasztjuk. Ami hiányzik, azt itt még jelezzük,
 * de nem tiltjuk: a bérbeadó tudja, hogy papíron kitölti-e.
 */
export async function szerzodestVeglegesit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  const betoltott = await szerzodesBemenet(szerzodesId, berbeado.id);
  if (!betoltott) return hiba("Ez a szerződés nem a tiéd.");
  if (betoltott.allapot !== "tervezet") return hiba("Ez a szerződés már véglegesített.");

  // A személyazonosság nyugtázása nélkül nem véglegesítünk. Ez nem igazolás:
  // az alkalmazás nem tudja ellenőrizni, ki kicsoda, ezért a felek nézik meg
  // egymás okmányát, és a bérbeadó ezt itt nyugtázza.
  if (szoveg(urlap.get("azonossagEllenorizve")) !== "igen") {
    return hiba(
      "Előbb nyugtázd, hogy megnéztétek egymás fényképes igazolványát.",
      ["azonossagEllenorizve"],
    );
  }

  const hianyok = hianyzoAdatok(betoltott.bemenet);
  if (hianyok.length > 0 && szoveg(urlap.get("megis")) !== "igen") {
    return hiba("Hiányzó adatok. Pótold őket, vagy véglegesítsd így.", hianyok);
  }

  await prisma.szerzodes.update({
    where: { id: szerzodesId },
    data: {
      allapot: "veglegesitve",
      veglegesSzoveg: szerzodesSzovege(betoltott.bemenet),
      veglegesitve: new Date(),
    },
  });

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  revalidatePath("/szerzodesek");
  return {
    allapot: "kesz",
    uzenet: "A szerződés véglegesítve. A szövege innentől nem változik.",
    hibak: [],
  };
}

/** Véglegesítés visszavonása, amíg nem írták alá. */
export async function veglegesitestVisszavon(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  const szerzodes = await prisma.szerzodes.findFirst({
    where: { id: szerzodesId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
  });
  if (!szerzodes) return hiba("Ez a szerződés nem a tiéd.");

  await prisma.szerzodes.update({
    where: { id: szerzodesId },
    data: { allapot: "tervezet", veglegesSzoveg: null, veglegesitve: null },
  });

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  revalidatePath("/szerzodesek");
  return { allapot: "kesz", uzenet: "Visszaállt tervezetre, újra szerkeszthető.", hibak: [] };
}
