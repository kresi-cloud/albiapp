"use server";

import { redirect } from "next/navigation";
import { emailtNormalizal, jelszotEllenoriz, meghivoAllapota } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { jelszotHashel } from "@/lib/jelszo";
import { munkamenetetIndit } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

/** A nevet visszaadjuk, hogy hibás jelszó után ne kelljen újra begépelni. */
export type RegisztracioEredmeny = {
  allapot: "ures" | "hiba" | "letezo";
  uzenet: string;
  hibak: string[];
  nev: string;
};

export async function meghivotElfogad(
  _elozo: RegisztracioEredmeny,
  urlap: FormData,
): Promise<RegisztracioEredmeny> {
  const { sz, u } = await szovegek();
  const token = String(urlap.get("token") ?? "");
  const nev = String(urlap.get("nev") ?? "").trim();
  const jelszo = String(urlap.get("jelszo") ?? "");

  const meghivo = await prisma.meghivo.findUnique({
    where: { token },
    include: { jogviszonyBerlo: true },
  });

  if (!meghivo || meghivoAllapota(meghivo, new Date()) !== "ervenyes") {
    return {
      allapot: "hiba",
      uzenet: sz("meghivo.hiba.ervenytelen"),
      hibak: [],
      nev,
    };
  }

  const ellenorzes = jelszotEllenoriz(jelszo, urlap.get("jelszoUjra"));
  const hibak = ellenorzes.map(u);
  if (nev === "") hibak.push(sz("meghivo.hiba.nev"));
  if (hibak.length > 0) {
    return { allapot: "hiba", uzenet: sz("meghivo.hiba.nem_kesz"), hibak, nev };
  }

  const email = emailtNormalizal(meghivo.email);
  const letezo = await prisma.felhasznalo.findUnique({ where: { email } });

  if (letezo) {
    // Meglévő fiók jelszavát a meghívó nem írhatja felül: a link a bérbeadónál
    // is megvan, így azzal bárki átvehetné a bérlő fiókját.
    await prisma.$transaction([
      prisma.jogviszonyBerlo.update({
        where: { id: meghivo.jogviszonyBerloId },
        data: { berloId: letezo.id },
      }),
      prisma.meghivo.update({
        where: { id: meghivo.id },
        data: { felhasznalva: new Date() },
      }),
    ]);
    return {
      allapot: "letezo",
      uzenet: sz("meghivo.letezo_fiok"),
      hibak: [],
      nev,
    };
  }

  const jelszoHash = await jelszotHashel(jelszo);
  const berlo = await prisma.felhasznalo.create({
    data: { email, nev, jelszoHash, szerep: "berlo" },
  });

  await prisma.$transaction([
    prisma.jogviszonyBerlo.update({
      where: { id: meghivo.jogviszonyBerloId },
      data: { berloId: berlo.id, nev },
    }),
    prisma.meghivo.update({
      where: { id: meghivo.id },
      data: { felhasznalva: new Date() },
    }),
  ]);

  await munkamenetetIndit(berlo.id);
  redirect("/berlo");
}
