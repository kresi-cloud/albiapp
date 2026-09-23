"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { szerzodesBemenet } from "@/lib/szerzodes";
import {
  ajanlottModulok,
  hianyzoAdatok,
  modultKeres,
  okiratSzovege,
} from "@/domain/szerzodes-keszites";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
  /**
   * Melyik mezőre vonatkozik a hiba. Külön mezőben, mert a `hibak` felsorolását
   * a felhasználó olvassa: oda mezőnév nem kerülhet.
   */
  mezo?: string;
};

function hiba(uzenet: string, hibak: string[] = [], mezo?: string): Eredmeny {
  return { allapot: "hiba", uzenet, hibak, mezo };
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
  const { sz } = await szovegek();
  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));

  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId: berbeado.id } },
    include: {
      ingatlan: true,
      berlok: { orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
      elofizetesek: { include: { jovahagyasok: true } },
    },
  });
  if (!jogviszony) return hiba(sz("szerzodes.hiba.jogviszony_nem_tied"));
  if (jogviszony.berlok.length === 0) {
    return hiba(sz("szerzodes.hiba.nincs_berlo"));
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
    // Ha van előfizetés, az előfizetési pontot is ajánljuk: enélkül a
    // bérbeadónak kellene rájönnie, hogy van ilyen modul.
    elofizetesek: jogviszony.elofizetesek.map((sor) => ({
      megnevezes: sor.megnevezes,
      fajta: sor.fajta,
      szolgaltato: sor.szolgaltato,
      elofizeto: sor.elofizeto,
      haviDijFt: sor.haviDijFt,
    })),
  });

  // A kötelező modulok mindig bekerülnek a szövegbe, ezért csak a választhatókat
  // mentjük el: a lista így azt mutatja, amit a bérbeadó valóban eldöntött.
  const valaszthatok = ajanlott.filter((kulcs) => modultKeres(kulcs)?.kotelezo === false);

  const szerzodes = await prisma.szerzodes.create({
    data: {
      jogviszonyId,
      // A tervezet neve a bérbeadó akkori nyelvén készül: elmentett szöveg, ami
      // később nem tud nyelvet váltani. A szerződés szövege ettől függetlenül magyar.
      megnevezes: sz("szerzodes.megnevezes", { ingatlan: jogviszony.ingatlan.megnevezes }),
      modulok: { create: valaszthatok.map((kulcs, sorrend) => ({ kulcs, sorrend })) },
    },
  });

  revalidatePath("/szerzodesek");
  redirect(`/szerzodesek/${szerzodes.id}`);
}

/**
 * Modul be- vagy kikapcsolása. Szerződésben a kötelező modult nem lehet
 * kikapcsolni; záradékban viszont nincs kötelező modul, mert a záradék nem egy
 * második teljes szerződés — ott minden pont szabadon választható.
 */
export async function modultValt(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));
  const kulcs = szoveg(urlap.get("kulcs"));

  const modul = modultKeres(kulcs);
  if (!modul) return hiba(sz("szerzodes.hiba.nincs_modul"));

  const szerzodes = await prisma.szerzodes.findFirst({
    where: { id: szerzodesId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
    include: { modulok: true },
  });
  if (!szerzodes) return hiba(sz("szerzodes.hiba.nem_tied"));
  if (modul.kotelezo && szerzodes.fajta !== "zaradek") {
    return hiba(sz("szerzodes.hiba.kotelezo_modul"));
  }
  if (szerzodes.allapot !== "tervezet") {
    return hiba(sz("szerzodes.hiba.vegleges_nem_valtozik"));
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
    uzenet: sz(megvan ? "szerzodes.kesz.modul_ki" : "szerzodes.kesz.modul_be", {
      cim: modul.cim,
    }),
    hibak: [],
  };
}

/** A paraméterek mentése. Az üresen hagyott mező visszaáll alapértelmezésre. */
export async function parametereketMenti(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  const szerzodes = await prisma.szerzodes.findFirst({
    where: { id: szerzodesId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
  });
  if (!szerzodes) return hiba(sz("szerzodes.hiba.nem_tied"));
  if (szerzodes.allapot !== "tervezet") {
    return hiba(sz("szerzodes.hiba.vegleges_nem_valtozik"));
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
  return { allapot: "kesz", uzenet: sz("szerzodes.kesz.parameterek"), hibak: [] };
}

/**
 * Véglegesítés: a szöveget befagyasztjuk. Ami hiányzik, azt itt még jelezzük,
 * de nem tiltjuk: a bérbeadó tudja, hogy papíron kitölti-e.
 */
export async function szerzodestVeglegesit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  const betoltott = await szerzodesBemenet(szerzodesId, berbeado.id);
  if (!betoltott) return hiba(sz("szerzodes.hiba.nem_tied"));
  if (betoltott.allapot !== "tervezet") return hiba(sz("szerzodes.hiba.mar_vegleges"));

  // A személyazonosság nyugtázása nélkül nem véglegesítünk. Ez nem igazolás:
  // az alkalmazás nem tudja ellenőrizni, ki kicsoda, ezért a felek nézik meg
  // egymás okmányát, és a bérbeadó ezt itt nyugtázza.
  if (szoveg(urlap.get("azonossagEllenorizve")) !== "igen") {
    return hiba(sz("szerzodes.hiba.nyugtazas"), [], "azonossagEllenorizve");
  }

  const hianyok = hianyzoAdatok(betoltott.bemenet);
  if (hianyok.length > 0 && szoveg(urlap.get("megis")) !== "igen") {
    return hiba(sz("szerzodes.hiba.hianyok"), hianyok.map(u));
  }

  await prisma.szerzodes.update({
    where: { id: szerzodesId },
    data: {
      allapot: "veglegesitve",
      veglegesSzoveg: okiratSzovege(betoltott.bemenet),
      // A fordítás ugyanitt fagy be. Ha később készülne, a modulkatalógus
      // közben változhatna, és a fordítás már nem azt mondaná, amit a mellette
      // álló magyar szöveg.
      veglegesSzovegEn: okiratSzovege(betoltott.bemenet, "en"),
      veglegesitve: new Date(),
    },
  });

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  revalidatePath("/szerzodesek");
  return {
    allapot: "kesz",
    uzenet: sz("szerzodes.kesz.veglegesitve"),
    hibak: [],
  };
}

/** Véglegesítés visszavonása, amíg nem írták alá. */
export async function veglegesitestVisszavon(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  const szerzodes = await prisma.szerzodes.findFirst({
    where: { id: szerzodesId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
  });
  if (!szerzodes) return hiba(sz("szerzodes.hiba.nem_tied"));

  await prisma.szerzodes.update({
    where: { id: szerzodesId },
    data: { allapot: "tervezet", veglegesSzoveg: null, veglegesSzovegEn: null, veglegesitve: null },
  });

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  revalidatePath("/szerzodesek");
  return { allapot: "kesz", uzenet: sz("szerzodes.kesz.visszaallt"), hibak: [] };
}

/**
 * Záradék egy hatályos szerződéshez.
 *
 * Amit a felek aláírtak, azt nem írjuk át: a `veglegesSzoveg` be is fagyasztja.
 * Ha a szerződés utóbb kiegészül — például előfizetéssel —, az külön okirat,
 * ami megnevezi az alapszerződést, és kimondja, hogy a többi rendelkezés
 * változatlanul hatályban marad.
 *
 * A záradék ugyanabban a táblában él, mint a szerződés, mert minden más
 * ugyanaz: modulokból épül, ugyanúgy véglegesül, ugyanúgy kerül a
 * dokumentumtárba, és a bérlő ugyanúgy csak véglegesítés után látja.
 */
export async function zaradekotKeszit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const alapId = szoveg(urlap.get("szerzodesId"));

  const alap = await prisma.szerzodes.findFirst({
    where: {
      id: alapId,
      fajta: "szerzodes",
      allapot: "veglegesitve",
      jogviszony: { ingatlan: { tulajdonosId: berbeado.id } },
    },
    include: { jogviszony: { include: { ingatlan: true } } },
  });
  // Tervezethez nem kell záradék: azt még szerkeszteni lehet.
  if (!alap) return hiba(sz("szerzodes.hiba.zaradek_csak_veglegeshez"));

  const zaradek = await prisma.szerzodes.create({
    data: {
      jogviszonyId: alap.jogviszonyId,
      fajta: "zaradek",
      alapSzerzodesId: alap.id,
      megnevezes: sz("szerzodes.zaradek_megnevezes", {
        ingatlan: alap.jogviszony.ingatlan.megnevezes,
      }),
      // Az előfizetési pont eleve be van kapcsolva: a záradék jellemzően épp
      // ezért készül, és üres záradékkal senki nem kezd semmit.
      modulok: { create: [{ kulcs: "elofizetesek", sorrend: 0 }] },
    },
  });

  revalidatePath("/szerzodesek");
  redirect(`/szerzodesek/${zaradek.id}`);
}
