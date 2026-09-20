"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { emailNekLatszik, emailtNormalizal, meghivoLejarata } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { meghivoToken } from "@/lib/meghivo";
import { kotelezoSzerep } from "@/lib/munkamenet";

export type MeghivoEredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  link: string;
};

async function alapcim(): Promise<string> {
  const fejlec = await headers();
  const gazda = fejlec.get("host") ?? "localhost:3000";
  const protokoll = fejlec.get("x-forwarded-proto") ?? (gazda.startsWith("localhost") ? "http" : "https");
  return `${protokoll}://${gazda}`;
}

export async function meghivotKeszit(
  _elozo: MeghivoEredmeny,
  urlap: FormData,
): Promise<MeghivoEredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const jogviszonyId = String(urlap.get("jogviszonyId") ?? "");

  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId: berbeado.id } },
  });
  if (!jogviszony) {
    return { allapot: "hiba", uzenet: "Ez a jogviszony nem a tiéd.", link: "" };
  }

  const email = emailtNormalizal(urlap.get("email") ?? jogviszony.berloEmail);
  if (!emailNekLatszik(email)) {
    return { allapot: "hiba", uzenet: "Adj meg egy érvényes e-mail-címet.", link: "" };
  }

  const most = new Date();

  // A korábbi, még élő meghívókat lejárttá tesszük: egyszerre egy link éljen,
  // különben a régi levélből is be lehetne lépni.
  await prisma.meghivo.updateMany({
    where: { jogviszonyId, felhasznalva: null, lejar: { gt: most } },
    data: { lejar: most },
  });

  const meghivo = await prisma.meghivo.create({
    data: { jogviszonyId, token: meghivoToken(), email, lejar: meghivoLejarata(most) },
  });

  revalidatePath("/berlok");

  return {
    allapot: "kesz",
    uzenet: `Kész a meghívó ${email} címre. Küldd el neki, és két hétig érvényes.`,
    link: `${await alapcim()}/meghivo/${meghivo.token}`,
  };
}
