"use server";

import { revalidatePath } from "next/cache";
import { bemutatkozastMent } from "@/lib/bemutatkozas";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = { allapot: "ures" | "kesz" | "hiba"; uzenet: string };

/** Hosszabb szöveget nem tárolunk: a bemutatkozás nem önéletrajz. */
const LEGHOSSZABB = 1200;

/**
 * A saját bemutatkozó szöveg mentése.
 *
 * Azt, hogy kié a szöveg, a belépett felhasználóból vesszük, nem az űrlapból:
 * az űrlapon nincs is felhasználóazonosító, és nem is szabad legyen — a
 * rendszergazda is csak olvassa mások lapját, nem írja.
 */
export async function bemutatkozastIr(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo)
    return { allapot: "hiba", uzenet: sz("bemutatkozas.hiba.nincs_belepve") };

  const szoveg = String(urlap.get("bemutatkozas") ?? "");
  if (szoveg.length > LEGHOSSZABB) {
    return {
      allapot: "hiba",
      uzenet: sz("bemutatkozas.hiba.tul_hosszu", { jel: LEGHOSSZABB }),
    };
  }

  await bemutatkozastMent(felhasznalo.id, szoveg);

  revalidatePath("/bemutatkozas");
  return { allapot: "kesz", uzenet: sz("bemutatkozas.kesz") };
}
