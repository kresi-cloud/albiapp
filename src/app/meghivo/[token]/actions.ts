"use server";

import { redirect } from "next/navigation";
import { emailtNormalizal, jelszotEllenoriz, meghivoAllapota } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { jelszoEgyezik, jelszotHashel } from "@/lib/jelszo";
import { munkamenetetIndit } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

/** A nevet visszaadjuk, hogy hibás jelszó után ne kelljen újra begépelni. */
export type RegisztracioEredmeny = {
  allapot: "ures" | "hiba";
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

  const email = emailtNormalizal(meghivo.email);
  const letezo = await prisma.felhasznalo.findUnique({ where: { email } });

  if (letezo) {
    // Meglévő fiókot a meghívó a fiók gazdája nélkül nem köthet a
    // jogviszonyhoz. A linket a bérbeadó is birtokolja, tehát maga az
    // elfogadás nem bizonyít semmit: enélkül a bérbeadó bárkinek a meglévő
    // fiókját hozzáköthetné a saját jogviszonyához. Ezért a **meglévő**
    // jelszót kérjük — a fiók gazdája a saját adatával mond igent, ugyanaz a
    // kétoldali elv, mint a befizetésnél vagy a fényképnél. Jelszót ez az út
    // továbbra sem ír felül, és újat sem állít be.
    if (!(await jelszoEgyezik(jelszo, letezo.jelszoHash))) {
      return {
        allapot: "hiba",
        uzenet: sz("meghivo.hiba.megleve_jelszo"),
        hibak: [],
        nev,
      };
    }

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

    await munkamenetetIndit(letezo.id);
    redirect("/berlo");
  }

  const ellenorzes = jelszotEllenoriz(jelszo, urlap.get("jelszoUjra"));
  const hibak = ellenorzes.map(u);
  if (nev === "") hibak.push(sz("meghivo.hiba.nev"));
  if (hibak.length > 0) {
    return { allapot: "hiba", uzenet: sz("meghivo.hiba.nem_kesz"), hibak, nev };
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
