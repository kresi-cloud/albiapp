"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { igazolvanyGyanus } from "@/domain/szemelyes-adatok";
import { berloSajatAdatait, adatkeresLatta } from "@/lib/szemelyes-adatok";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
};

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
 * A bérlő a saját személyes adatait menti. A jogviszonyt nem az űrlapból
 * vesszük: a belépett bérlő minden jogviszonyára ráírjuk, mert ugyanaz az
 * ember áll mindegyikben.
 */
export async function sajatAdatokatMent(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berlo = await kotelezoSzerep("berlo");
  const { sz } = await szovegek();

  const nev = szoveg(urlap.get("nev"));
  if (nev === "") {
    return { allapot: "hiba", uzenet: sz("adatok.mezo.nev"), hibak: ["nev"] };
  }

  const igazolvanySzam = szoveg(urlap.get("igazolvanySzam"));
  if (igazolvanyGyanus(igazolvanySzam)) {
    return { allapot: "hiba", uzenet: sz("adatok.hiba.igazolvany"), hibak: ["igazolvanySzam"] };
  }

  const darab = await berloSajatAdatait(berlo.id, {
    nev,
    szuletesiHely: szoveg(urlap.get("szuletesiHely")) || null,
    szuletesiIdo: napotOlvas(urlap.get("szuletesiIdo")),
    anyjaNeve: szoveg(urlap.get("anyjaNeve")) || null,
    lakcim: szoveg(urlap.get("lakcim")) || null,
    igazolvanySzam: igazolvanySzam || null,
    telefon: szoveg(urlap.get("telefon")) || null,
  });

  if (darab === 0) {
    return { allapot: "hiba", uzenet: sz("adatok.hiba.nincs_jogviszony"), hibak: [] };
  }

  // A mentés egyben azt is jelenti, hogy az adatkérést látta.
  await adatkeresLatta(berlo.id);

  revalidatePath("/berlo/adatok");
  revalidatePath("/berlo");
  revalidatePath("/berlok");
  revalidatePath("/szerzodesek");

  return { allapot: "kesz", uzenet: sz("adatok.kesz"), hibak: [] };
}

/**
 * "Most kihagyom": nem toljuk elé másodszor, de a teendő megmarad, és a
 * bérlő oda kerül, ahova indult.
 */
export async function adatkerestKihagy(urlap: FormData): Promise<void> {
  const berlo = await kotelezoSzerep("berlo");
  await adatkeresLatta(berlo.id);
  revalidatePath("/berlo");

  // Csak alkalmazáson belüli útvonalra engedünk vissza, hogy az űrlap ne
  // lehessen ugródeszka egy idegen címre.
  const vissza = szoveg(urlap.get("vissza"));
  redirect(/^\/[^/]/.test(vissza) ? vissza : "/berlo");
}
