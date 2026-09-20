"use server";

import { revalidatePath } from "next/cache";
import { ELETTARTAM_NAPOK } from "@/domain/betekinto";
import { betekintotKeszit, betekintotVisszavon } from "@/lib/betekinto";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = { allapot: "ures" | "kesz" | "hiba"; uzenet: string; hibak: string[] };

function szoveg(nyers: unknown): string {
  return String(nyers ?? "").trim();
}

export async function betekintotAd(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berlo = await kotelezoSzerep("berlo");
  const { sz } = await szovegek();

  const cel = szoveg(urlap.get("cel"));
  if (cel === "") {
    return { allapot: "hiba", uzenet: sz("valasz.betekinto_cel_kell"), hibak: ["cel"] };
  }

  const napok = Number(szoveg(urlap.get("napok")));
  const token = await betekintotKeszit({
    berloId: berlo.id,
    jogviszonyId: szoveg(urlap.get("jogviszonyId")),
    cel,
    napok: (ELETTARTAM_NAPOK as readonly number[]).includes(napok) ? napok : ELETTARTAM_NAPOK[1],
    osszegetMutat: szoveg(urlap.get("osszegetMutat")) === "igen",
  });

  if (!token) {
    return { allapot: "hiba", uzenet: sz("valasz.betekinto_nincs_jogviszony"), hibak: [] };
  }

  revalidatePath("/berlo/betekinto");
  return { allapot: "kesz", uzenet: sz("valasz.betekinto_kesz"), hibak: [] };
}

export async function betekintotVon(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berlo = await kotelezoSzerep("berlo");
  const { sz } = await szovegek();

  const sikerult = await betekintotVisszavon(berlo.id, szoveg(urlap.get("id")));
  if (!sikerult) {
    return { allapot: "hiba", uzenet: sz("valasz.betekinto_nincs_jogviszony"), hibak: [] };
  }

  revalidatePath("/berlo/betekinto");
  return { allapot: "kesz", uzenet: sz("valasz.betekinto_visszavonva"), hibak: [] };
}
