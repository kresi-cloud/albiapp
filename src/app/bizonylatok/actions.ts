"use server";

import { revalidatePath } from "next/cache";
import { bizonylatotEllenoriz } from "@/domain/bizonylat";
import { bizonylatKerheto, bizonylatotMent, bizonylatotTorol } from "@/lib/bizonylat";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
};

function hiba(uzenet: string, hibak: string[] = []): Eredmeny {
  return { allapot: "hiba", uzenet, hibak };
}

function szoveg(ertek: FormDataEntryValue | null): string {
  return typeof ertek === "string" ? ertek.trim() : "";
}

/** Mindkét oldalt érinti, ezért mindkét lapot frissítjük. */
function frissit() {
  revalidatePath("/befizetesek");
  revalidatePath("/berlo");
  revalidatePath("/");
}

/**
 * Bizonylat feltöltése egy vitás előíráshoz. Hogy melyik oldalét, az a
 * szerepből következik, nem az űrlapból: a bérlőnek küldő oldali bizonylata
 * van, a bérbeadónak fogadó oldali.
 */
export async function bizonylatotFeltolt(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  const { sz, u } = await szovegek();
  if (!felhasznalo) return hiba(sz("valasz.nincs_jogosultsag"));

  const ki = { id: felhasznalo.id, szerep: szerepe(felhasznalo) };

  const eloirtTetelId = szoveg(urlap.get("eloirtTetelId"));
  if (!(await bizonylatKerheto(ki, eloirtTetelId))) {
    // Vagy nem az övé, vagy nem vitás. Bizonylatot csak vitáshoz fogadunk el.
    return hiba(sz("bizonylat.hiba.nincs_vita"));
  }

  const fajl = urlap.get("bizonylat");
  if (!(fajl instanceof File)) return hiba(sz("bizonylat.hiba.ures"), ["bizonylat"]);

  const baj = bizonylatotEllenoriz({
    nev: fajl.name,
    tipus: fajl.type,
    meretBajt: fajl.size,
  });
  if (baj) return hiba(u(baj), ["bizonylat"]);

  await bizonylatotMent(ki, eloirtTetelId, {
    nev: fajl.name,
    tipus: fajl.type,
    tartalom: new Uint8Array(await fajl.arrayBuffer()),
  });

  frissit();
  return { allapot: "kesz", uzenet: sz("bizonylat.kesz"), hibak: [] };
}

/** A saját bizonylat törlése. A másik félét senki nem törölheti. */
export async function bizonylatotTorolAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo) return hiba(sz("valasz.nincs_jogosultsag"));

  const sikerult = await bizonylatotTorol(felhasznalo.id, szoveg(urlap.get("bizonylatId")));
  if (!sikerult) return hiba(sz("valasz.nincs_jogosultsag"));

  frissit();
  return { allapot: "kesz", uzenet: sz("bizonylat.torolve"), hibak: [] };
}
