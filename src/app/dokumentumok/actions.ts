"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  hianyzoTetelek,
  jegyzokonyvSzovege,
  oraallastKiolvas,
  vallaltHibak,
} from "@/domain/jegyzokonyv";
import { igazolasSzovege, type TeljesitesModja } from "@/domain/igazolas";
import { prisma } from "@/lib/db";
import { jegyzokonyvBetoltes, kezdoTetelek } from "@/lib/jegyzokonyv";
import { igazolhatoIdoszakok, szerzodesKelte } from "@/lib/igazolas";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

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

function idopontotOlvas(nyers: unknown): Date | null {
  const ertek = szoveg(nyers);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(ertek)) return napotOlvas(nyers);
  const idopont = new Date(`${ertek}:00.000Z`);
  return Number.isNaN(idopont.getTime()) ? null : idopont;
}

export async function jegyzokonyvetKeszit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));
  const fajta = szoveg(urlap.get("fajta")) === "visszaadas" ? "visszaadas" : "birtokbaadas";

  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId: berbeado.id } },
    include: { berlok: true },
  });
  if (!jogviszony) return hiba(sz("dokumentumok.hiba.jogviszony_nem_tied"));
  if (jogviszony.berlok.length === 0) {
    return hiba(sz("dokumentumok.hiba.nincs_berlo"));
  }

  const tetelek = await kezdoTetelek(jogviszonyId);

  const jegyzokonyv = await prisma.jegyzokonyv.create({
    data: {
      jogviszonyId,
      fajta,
      idopont: fajta === "birtokbaadas" ? jogviszony.kezdete : new Date(),
      tetelek: { create: tetelek },
    },
  });

  revalidatePath("/dokumentumok");
  redirect(`/jegyzokonyvek/${jegyzokonyv.id}`);
}

export async function jegyzokonyvetMent(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jegyzokonyvId = szoveg(urlap.get("jegyzokonyvId"));

  const jegyzokonyv = await prisma.jegyzokonyv.findFirst({
    where: { id: jegyzokonyvId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
    include: { tetelek: true },
  });
  if (!jegyzokonyv) return hiba(sz("jegyzokonyv.hiba.nem_tied"));
  if (jegyzokonyv.allapot !== "tervezet") {
    return hiba(sz("jegyzokonyv.hiba.vegleges"));
  }

  const idopont = idopontotOlvas(urlap.get("idopont"));
  if (!idopont) return hiba(sz("jegyzokonyv.hiba.idopont"));

  const frissitesek = jegyzokonyv.tetelek.map((tetel) =>
    prisma.jegyzokonyvTetel.update({
      where: { id: tetel.id },
      data: {
        megnevezes: szoveg(urlap.get(`megnevezes_${tetel.id}`)) || tetel.megnevezes,
        ertek: szoveg(urlap.get(`ertek_${tetel.id}`)) || null,
        megjegyzes: szoveg(urlap.get(`megjegyzes_${tetel.id}`)) || null,
        felelos: szoveg(urlap.get(`felelos_${tetel.id}`)) || null,
        hatarido: napotOlvas(urlap.get(`hatarido_${tetel.id}`)),
      },
    }),
  );

  await prisma.$transaction([
    prisma.jegyzokonyv.update({
      where: { id: jegyzokonyvId },
      data: {
        idopont,
        allapotLeiras: szoveg(urlap.get("allapotLeiras")),
        megjegyzes: szoveg(urlap.get("megjegyzes")) || null,
      },
    }),
    ...frissitesek,
  ]);

  revalidatePath(`/jegyzokonyvek/${jegyzokonyvId}`);
  return { allapot: "kesz", uzenet: sz("jegyzokonyv.kesz.mentve"), hibak: [] };
}

export async function jegyzokonyvTetelt(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jegyzokonyvId = szoveg(urlap.get("jegyzokonyvId"));
  const fajta = szoveg(urlap.get("fajta"));
  const megnevezes = szoveg(urlap.get("megnevezes"));

  if (!["meroora", "kulcs", "hiba", "dokumentum"].includes(fajta)) {
    return hiba(sz("jegyzokonyv.hiba.tetelfajta"));
  }
  if (megnevezes === "") return hiba(sz("jegyzokonyv.hiba.megnevezes"));

  const jegyzokonyv = await prisma.jegyzokonyv.findFirst({
    where: { id: jegyzokonyvId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
    include: { tetelek: true },
  });
  if (!jegyzokonyv) return hiba(sz("jegyzokonyv.hiba.nem_tied"));
  if (jegyzokonyv.allapot !== "tervezet") {
    return hiba(sz("jegyzokonyv.hiba.vegleges"));
  }

  await prisma.jegyzokonyvTetel.create({
    data: {
      jegyzokonyvId,
      fajta,
      megnevezes,
      ertek: szoveg(urlap.get("ertek")) || null,
      sorrend: jegyzokonyv.tetelek.length,
    },
  });

  revalidatePath(`/jegyzokonyvek/${jegyzokonyvId}`);
  return { allapot: "kesz", uzenet: sz("jegyzokonyv.kesz.tetel", { megnevezes }), hibak: [] };
}

/**
 * Véglegesítés. Három dolog történik: a szöveg befagy, a rögzített óraállások
 * bekerülnek a mérőórák történetébe, a vállalt javításokból pedig teendő lesz.
 */
export async function jegyzokonyvetVeglegesit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();
  const jegyzokonyvId = szoveg(urlap.get("jegyzokonyvId"));

  const betoltott = await jegyzokonyvBetoltes(jegyzokonyvId, berbeado.id);
  if (!betoltott) return hiba(sz("jegyzokonyv.hiba.nem_tied"));
  if (betoltott.allapot !== "tervezet") return hiba(sz("jegyzokonyv.hiba.mar_vegleges"));

  const hianyok = hianyzoTetelek(betoltott.bemenet);
  if (hianyok.length > 0 && szoveg(urlap.get("megis")) !== "igen") {
    return hiba(sz("jegyzokonyv.hiba.hianyok"), hianyok.map(u));
  }

  const idopont = betoltott.bemenet.idopont;
  const olvashatatlan: string[] = [];

  const oraallasok = betoltott.tetelek
    .filter((tetel) => tetel.fajta === "meroora" && tetel.merooraId)
    .map((tetel) => {
      const ertek = oraallastKiolvas(tetel.ertek);
      if (ertek === null) {
        if (tetel.ertek.trim() !== "") olvashatatlan.push(tetel.megnevezes);
        return null;
      }
      return {
        merooraId: tetel.merooraId as string,
        datum: idopont,
        ertek,
        rogzitoId: berbeado.id,
      };
    })
    .filter((sor): sor is NonNullable<typeof sor> => sor !== null);

  const vallalasok = vallaltHibak(betoltott.bemenet.tetelek);

  await prisma.$transaction(async (tranzakcio) => {
    await tranzakcio.jegyzokonyv.update({
      where: { id: jegyzokonyvId },
      data: {
        allapot: "veglegesitve",
        veglegesSzoveg: jegyzokonyvSzovege(betoltott.bemenet),
        veglegesitve: new Date(),
      },
    });

    for (const oraallas of oraallasok) {
      await tranzakcio.oraallas.create({ data: oraallas });
    }

    for (const [index, vallalas] of vallalasok.entries()) {
      const kulcs = `jegyzokonyv:${jegyzokonyvId}:${index}`;
      // A tárolt teendő szövege a bérbeadó akkori nyelvén készül: egy elmentett
      // mondat nem tud később nyelvet váltani, a származtatott teendő viszont igen.
      const felelosNeve = sz(
        vallalas.felelos === "berbeado" ? "teendo.vallalo.berbeado" : "teendo.vallalo.berlo",
      );
      await tranzakcio.teendo.upsert({
        where: { kulcs },
        create: {
          kulcs,
          cimzettId: berbeado.id,
          jogviszonyId: betoltott.jogviszonyId,
          tipus: "jegyzokonyvi_vallalas",
          cim: vallalas.megnevezes,
          leiras: sz("teendo.jegyzokonyvi_vallalas", { felelos: felelosNeve }),
          esedekesseg: vallalas.hatarido as Date,
          hivatkozas: `/jegyzokonyvek/${jegyzokonyvId}`,
        },
        update: { esedekesseg: vallalas.hatarido as Date },
      });
    }
  });

  revalidatePath(`/jegyzokonyvek/${jegyzokonyvId}`);
  revalidatePath("/dokumentumok");
  revalidatePath("/rezsi");
  revalidatePath("/");

  const reszek = [sz("jegyzokonyv.kesz.veglegesitve")];
  if (oraallasok.length > 0) {
    reszek.push(sz("jegyzokonyv.kesz.oraallasok", { db: oraallasok.length }));
  }
  if (vallalasok.length > 0) {
    reszek.push(sz("jegyzokonyv.kesz.vallalasok", { db: vallalasok.length }));
  }

  return {
    allapot: "kesz",
    uzenet: reszek.join(" "),
    hibak: olvashatatlan.map((nev) => sz("jegyzokonyv.hiba.olvashatatlan", { nev })),
  };
}

/** Igazolás kiállítása egy bérlőnek, a párosított befizetés adataiból. */
export async function igazolastKiallit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jogviszonyBerloId = szoveg(urlap.get("jogviszonyBerloId"));
  const idoszak = szoveg(urlap.get("idoszak"));
  const cel = szoveg(urlap.get("cel"));

  const berlo = await prisma.jogviszonyBerlo.findFirst({
    where: {
      id: jogviszonyBerloId,
      jogviszony: { ingatlan: { tulajdonosId: berbeado.id } },
    },
    include: {
      jogviszony: { include: { ingatlan: true, berlok: { orderBy: { sorrend: "asc" } } } },
    },
  });
  if (!berlo) return hiba(sz("igazolas.hiba.nem_tied"));
  if (cel === "") return hiba(sz("igazolas.hiba.cel"));

  const befizetesek = await igazolhatoIdoszakok(berlo.jogviszonyId, berbeado.id);
  const befizetes = befizetesek.find((sor) => sor.idoszak === idoszak);
  if (!befizetes) {
    return hiba(sz("igazolas.hiba.nincs_befizetes"));
  }

  const modja = szoveg(urlap.get("teljesitesModja"));
  const teljesitesModja: TeljesitesModja =
    modja === "keszpenz" || modja === "egyeb" ? modja : "atutalas";

  const megadottOsszeg = Number(szoveg(urlap.get("osszegFt")).replace(/\s/g, ""));
  const osszegFt =
    Number.isFinite(megadottOsszeg) && megadottOsszeg > 0
      ? Math.round(megadottOsszeg)
      : befizetes.osszegFt;
  if (osszegFt > befizetes.osszegFt) {
    return hiba(sz("igazolas.hiba.tobb", { osszeg: befizetes.osszegFt }));
  }

  const adatok = await prisma.berbeadoiAdatok.findUnique({ where: { berbeadoId: berbeado.id } });
  const kelte = await szerzodesKelte(berlo.jogviszonyId);
  const ma = new Date();

  const szovegTartalom = igazolasSzovege({
    berbeado: {
      nev: berbeado.nev,
      email: berbeado.email,
      lakcim: adatok?.lakcim ?? null,
    },
    berlo: { nev: berlo.nev, lakcim: berlo.lakcim },
    osszesBerlo: berlo.jogviszony.berlok.map((sor) => ({ nev: sor.nev, lakcim: sor.lakcim })),
    ingatlan: { cim: berlo.jogviszony.ingatlan.cim },
    jogviszony: {
      kezdete: berlo.jogviszony.kezdete,
      vege: berlo.jogviszony.vege,
      berletiDijFt: berlo.jogviszony.berletiDijFt,
      szerzodesKelte: kelte,
    },
    cel,
    idoszak,
    osszegFt,
    teljesitesNapja: befizetes.napja,
    teljesitesModja,
    kiallitasHelye: szoveg(urlap.get("kiallitasHelye")),
    kiallitasNapja: ma,
  });

  await prisma.igazolas.create({
    data: {
      jogviszonyBerloId,
      cel,
      idoszak,
      osszegFt,
      teljesitesNapja: befizetes.napja,
      teljesitesModja,
      szoveg: szovegTartalom,
      kiallitva: ma,
    },
  });

  revalidatePath("/dokumentumok");
  return {
    allapot: "kesz",
    uzenet: sz("igazolas.kesz", { nev: berlo.nev }),
    hibak: [],
  };
}
