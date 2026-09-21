"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MAX_HOSSZ } from "@/domain/beszelgetes";
import { beszelgetestIndit, uzenetetKuld, type KuldesHiba } from "@/lib/beszelgetes";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = { allapot: "ures" | "kesz" | "hiba"; uzenet: string };

/**
 * A hiba kódja adja a szótárkulcsot, a mondat a szótárban él. Így a bérlő a
 * saját nyelvén kapja meg azt is, amiért nem ment el, amit írt.
 */
async function hibaSzovege(hiba: KuldesHiba): Promise<Eredmeny> {
  const { sz } = await szovegek();
  return {
    allapot: "hiba",
    uzenet:
      hiba === "hosszu"
        ? sz("beszelgetes.hiba.hosszu", { max: MAX_HOSSZ })
        : sz(`beszelgetes.hiba.${hiba}`),
  };
}

/** Mindkét út ugyanazt a listát mutatja, tehát mindkettőt frissíteni kell. */
function frissit(beszelgetesId?: string): void {
  revalidatePath("/beszelgetesek");
  if (beszelgetesId) revalidatePath(`/beszelgetesek/${beszelgetesId}`);
  revalidatePath("/");
  revalidatePath("/berlo");
}

/**
 * Üzenet egy meglévő szálba.
 *
 * Siker után `kesz` az állapot, és az űrlap ettől ürül ki — a megőrzős mezők
 * erre az egy jelzésre figyelnek. Elutasításnál a begépelt szöveg ott marad,
 * ami itt különösen számít: egy hosszabb üzenetet senki nem ír le másodszor
 * ugyanúgy.
 */
export async function uzenetetKuldAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) {
    const { sz } = await szovegek();
    return { allapot: "hiba", uzenet: sz("valasz.lepj_be") };
  }

  const beszelgetesId = String(urlap.get("beszelgetesId") ?? "");
  const szoveg = String(urlap.get("szoveg") ?? "");

  const hiba = await uzenetetKuld(
    { id: felhasznalo.id, szerep: szerepe(felhasznalo) },
    beszelgetesId,
    szoveg,
    new Date(),
  );
  if (hiba) return hibaSzovege(hiba);

  frissit(beszelgetesId);
  return { allapot: "kesz", uzenet: "" };
}

/**
 * Új beszélgetés az első üzenettel. Üres szálat nem nyitunk, tehát ez az
 * egyetlen út: a címzett és az első mondat egyszerre érkezik.
 *
 * Siker után átnavigálunk a szálra. Aki most írt valakinek, azt akarja látni,
 * hogy az üzenete ott van, nem egy listát, amiben meg kell keresnie.
 */
export async function beszelgetestInditAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) {
    const { sz } = await szovegek();
    return { allapot: "hiba", uzenet: sz("valasz.lepj_be") };
  }

  const eredmeny = await beszelgetestIndit(
    { id: felhasznalo.id, szerep: szerepe(felhasznalo) },
    String(urlap.get("jogviszonyId") ?? ""),
    urlap.getAll("cimzett").map(String).filter(Boolean),
    String(urlap.get("szoveg") ?? ""),
    new Date(),
  );
  if ("hiba" in eredmeny) return hibaSzovege(eredmeny.hiba);

  frissit(eredmeny.beszelgetesId);
  redirect(`/beszelgetesek/${eredmeny.beszelgetesId}`);
}
