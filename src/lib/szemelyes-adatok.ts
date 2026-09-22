import {
  BERBEADOHOZ_KELL,
  BERLOHOZ_KELL,
  adatokTeljesek,
  hianyzoMezok,
  type Mezo,
  type SzemelyesAdatok,
} from "@/domain/szemelyes-adatok";
import { prisma } from "./db";

export type AdatAllapot = {
  teljes: boolean;
  hianyzo: Mezo[];
  megvan: number;
  osszesen: number;
};

function allapot(adatok: SzemelyesAdatok, kell: readonly Mezo[]): AdatAllapot {
  const hianyzo = hianyzoMezok(adatok, kell);
  return {
    teljes: hianyzo.length === 0,
    hianyzo,
    megvan: kell.length - hianyzo.length,
    osszesen: kell.length,
  };
}

/** A bérbeadó saját adatai és az, mennyi hiányzik még belőlük. */
export async function berbeadoAdatai(berbeadoId: string): Promise<{
  adatok: SzemelyesAdatok;
  allapot: AdatAllapot;
}> {
  const felhasznalo = await prisma.felhasznalo.findUniqueOrThrow({
    where: { id: berbeadoId },
    include: { berbeadoiAdatok: true },
  });

  const adatok: SzemelyesAdatok = {
    nev: felhasznalo.nev,
    szuletesiHely: felhasznalo.berbeadoiAdatok?.szuletesiHely ?? null,
    szuletesiIdo: felhasznalo.berbeadoiAdatok?.szuletesiIdo ?? null,
    anyjaNeve: felhasznalo.berbeadoiAdatok?.anyjaNeve ?? null,
    lakcim: felhasznalo.berbeadoiAdatok?.lakcim ?? null,
    igazolvanySzam: felhasznalo.berbeadoiAdatok?.igazolvanySzam ?? null,
    bankszamla: felhasznalo.berbeadoiAdatok?.bankszamla ?? null,
  };

  return { adatok, allapot: allapot(adatok, BERBEADOHOZ_KELL) };
}

export type BerloiSor = {
  id: string;
  jogviszonyId: string;
  berlemeny: string;
  adatok: SzemelyesAdatok;
  telefon: string | null;
  email: string | null;
  forrasa: "berlo" | "berbeado" | null;
  allapot: AdatAllapot;
};

function berloiSor(sor: {
  id: string;
  jogviszonyId: string;
  nev: string;
  email: string | null;
  telefon: string | null;
  szuletesiHely: string | null;
  szuletesiIdo: Date | null;
  anyjaNeve: string | null;
  lakcim: string | null;
  igazolvanySzam: string | null;
  adatokForrasa: string | null;
  jogviszony: { ingatlan: { megnevezes: string } };
}): BerloiSor {
  const adatok: SzemelyesAdatok = {
    nev: sor.nev,
    szuletesiHely: sor.szuletesiHely,
    szuletesiIdo: sor.szuletesiIdo,
    anyjaNeve: sor.anyjaNeve,
    lakcim: sor.lakcim,
    igazolvanySzam: sor.igazolvanySzam,
  };

  return {
    id: sor.id,
    jogviszonyId: sor.jogviszonyId,
    berlemeny: sor.jogviszony.ingatlan.megnevezes,
    adatok,
    telefon: sor.telefon,
    email: sor.email,
    forrasa: sor.adatokForrasa === "berlo" || sor.adatokForrasa === "berbeado" ? sor.adatokForrasa : null,
    allapot: allapot(adatok, BERLOHOZ_KELL),
  };
}

const BERLOI_MEZOK = {
  include: { jogviszony: { include: { ingatlan: true } } },
} as const;

/**
 * A belépett bérlő saját sorai. Egy bérlőnek több jogviszonya is lehet, és
 * ugyanaz az ember áll mindegyikben: amit egyszer megad, mindegyikre érvényes.
 */
export async function berloSajatSorai(berloId: string): Promise<BerloiSor[]> {
  const sorok = await prisma.jogviszonyBerlo.findMany({
    where: { berloId },
    orderBy: { letrehozva: "asc" },
    ...BERLOI_MEZOK,
  });
  return sorok.map(berloiSor);
}

/** Egy jogviszony bérlői, a bérbeadó oldaláról nézve. */
export async function jogviszonyBerloi(
  tulajdonosId: string,
  jogviszonyId: string,
): Promise<BerloiSor[]> {
  const sorok = await prisma.jogviszonyBerlo.findMany({
    where: { jogviszonyId, jogviszony: { ingatlan: { tulajdonosId } } },
    orderBy: { sorrend: "asc" },
    ...BERLOI_MEZOK,
  });
  return sorok.map(berloiSor);
}

export type BerloiAdatMentes = {
  nev: string;
  szuletesiHely: string | null;
  szuletesiIdo: Date | null;
  anyjaNeve: string | null;
  lakcim: string | null;
  igazolvanySzam: string | null;
  telefon: string | null;
};

/**
 * A bérlő a saját adatait menti. Minden jogviszonyára ráírjuk: ugyanaz az
 * ember, és nem várható el tőle, hogy lakásonként újra begépelje.
 *
 * A szűrés a belépett bérlőre megy, nem arra, amit az űrlap küld.
 */
export async function berloSajatAdatait(
  berloId: string,
  adatok: BerloiAdatMentes,
): Promise<number> {
  const eredmeny = await prisma.jogviszonyBerlo.updateMany({
    where: { berloId },
    data: { ...adatok, adatokForrasa: "berlo", adatokFrissitve: new Date() },
  });
  return eredmeny.count;
}

/** Megjegyezzük, hogy az adatkérést megmutattuk: másodszor már nem toljuk elé. */
export async function adatkeresLatta(felhasznaloId: string): Promise<void> {
  await prisma.felhasznalo.update({
    where: { id: felhasznaloId },
    data: { adatkeresLatta: new Date() },
  });
}

/**
 * Véglegesíthető-e a szerződés. A hiányt itt döntjük el, egy helyen, hogy a
 * felület és a művelet ne mondhasson mást.
 */
export async function szerzodesAdatai(
  tulajdonosId: string,
  jogviszonyId: string,
): Promise<{ berbeado: AdatAllapot; berlok: BerloiSor[]; keszAllitasra: boolean }> {
  const [berbeado, berlok] = await Promise.all([
    berbeadoAdatai(tulajdonosId),
    jogviszonyBerloi(tulajdonosId, jogviszonyId),
  ]);

  const mindenBerlo = berlok.every((sor) => sor.allapot.teljes);
  return {
    berbeado: berbeado.allapot,
    berlok,
    keszAllitasra: berbeado.allapot.teljes && berlok.length > 0 && mindenBerlo,
  };
}

/** Csak azért van külön, hogy a domain szabálya egy helyen dőljön el. */
export function teljes(adatok: SzemelyesAdatok, berbeadoE: boolean): boolean {
  return adatokTeljesek(adatok, berbeadoE ? BERBEADOHOZ_KELL : BERLOHOZ_KELL);
}
