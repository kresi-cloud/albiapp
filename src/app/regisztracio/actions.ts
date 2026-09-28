"use server";

import { redirect } from "next/navigation";
import { emailtNormalizal, regisztraciotEllenoriz } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { jelszotHashel } from "@/lib/jelszo";
import { munkamenetetIndit } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

/** A nevet és a címet visszaadjuk, hogy elutasításkor ne kelljen újragépelni. */
export type RegisztracioEredmeny = {
  allapot: "ures" | "hiba";
  uzenet: string;
  hibak: string[];
  nev: string;
  email: string;
};

/**
 * Bérbeadói fiók készítése.
 *
 * Eddig fiókot egyedül a példaadat hozott létre: aki élesben kipróbálta volna
 * az alkalmazást, a belépőlapon elakadt, mert nem volt hová regisztrálni.
 *
 * Bérlő itt nem készít fiókot. A bérlőt meghívó hozza, és az köti a fiókot a
 * jogviszonyhoz; egy magától regisztráló bérlői fiók nem tartozna sehová.
 *
 * Ami itt megmarad: aki végigpróbálja a címeket, a „már van fiók" üzenetből
 * megtudja, hogy egy cím foglalt-e. Ugyanaz a rés, mint a meghívónál, és
 * ugyanaz zárja le: e-mailes megerősítés, az pedig a küldőszolgáltatáson
 * múlik. Némán elfogadni nem lehet — akkor az sem tudná meg, hogy nem lett
 * fiókja, aki tényleg most regisztrál.
 */
export async function regisztral(
  _elozo: RegisztracioEredmeny,
  urlap: FormData,
): Promise<RegisztracioEredmeny> {
  const { sz, u } = await szovegek();
  const nev = String(urlap.get("nev") ?? "").trim();
  const email = emailtNormalizal(urlap.get("email"));
  const jelszo = String(urlap.get("jelszo") ?? "");

  const hibak = regisztraciotEllenoriz({
    nev,
    email,
    jelszo,
    jelszoUjra: urlap.get("jelszoUjra"),
  }).map(u);

  if (hibak.length > 0) {
    return {
      allapot: "hiba",
      uzenet: sz("regisztracio.hiba.nem_kesz"),
      hibak,
      nev,
      email,
    };
  }

  const foglalt = await prisma.felhasznalo.findUnique({ where: { email } });
  if (foglalt) {
    return {
      allapot: "hiba",
      uzenet: sz("regisztracio.hiba.foglalt"),
      hibak: [],
      nev,
      email,
    };
  }

  const jelszoHash = await jelszotHashel(jelszo);
  const berbeado = await prisma.felhasznalo.create({
    data: { email, nev, jelszoHash, szerep: "berbeado" },
  });

  await munkamenetetIndit(berbeado.id);
  // Első belépéskor egyszer elkérjük a saját adatait, ugyanúgy, mint a
  // meghívóból érkező bérlőtől.
  redirect("/beallitasok?elso=1");
}
