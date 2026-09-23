"use server";

import { revalidatePath } from "next/cache";
import { fiokmuveletetEllenoriz, type Fiokmuvelet } from "@/domain/uzemeltetes";
import { prisma } from "@/lib/db";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { fiokotAllit } from "@/lib/uzemeltetes";

export type Eredmeny = { allapot: "ures" | "kesz" | "hiba"; uzenet: string };

function muveletet(nyers: unknown): Fiokmuvelet | null {
  if (nyers === "letilt" || nyers === "visszaenged") return nyers;
  return null;
}

/**
 * Fiók letiltása és visszaengedése.
 *
 * Hogy ki csinálja, azt a belépett felhasználóból vesszük, és azt is a
 * kiszolgáló dönti el, hogy szabad-e neki: a gomb elrejtése nem védelem.
 * A saját fiók tiltását a domain zárja ki, mert az az utolsó rendszergazdát
 * kizárná az alkalmazásból.
 */
export async function fiokot(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const { sz, u } = await szovegek();
  const admin = await belepettFelhasznalo();
  if (!admin || !admin.rendszergazda) {
    return { allapot: "hiba", uzenet: sz("uzemeltetes.hiba.nincs_jogosultsag") };
  }

  const muvelet = muveletet(urlap.get("muvelet"));
  const celId = String(urlap.get("felhasznaloId") ?? "");
  if (!muvelet || !celId) {
    return { allapot: "hiba", uzenet: sz("uzemeltetes.hiba.hianyos") };
  }

  const cel = await prisma.felhasznalo.findUnique({
    where: { id: celId },
    select: { id: true, letiltva: true },
  });
  if (!cel) return { allapot: "hiba", uzenet: sz("uzemeltetes.hiba.nincs_ilyen") };

  const kifogas = fiokmuveletetEllenoriz({
    adminId: admin.id,
    celId: cel.id,
    celLetiltva: cel.letiltva !== null,
    muvelet,
  });
  if (kifogas) return { allapot: "hiba", uzenet: u(kifogas) };

  await fiokotAllit(admin.id, cel.id, muvelet, new Date());

  revalidatePath("/rendszergazda");
  return {
    allapot: "kesz",
    uzenet: sz(muvelet === "letilt" ? "uzemeltetes.letiltva" : "uzemeltetes.visszaengedve"),
  };
}
