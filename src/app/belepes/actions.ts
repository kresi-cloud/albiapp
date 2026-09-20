"use server";

import { redirect } from "next/navigation";
import { emailtNormalizal } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { jelszoEgyezik } from "@/lib/jelszo";
import { munkamenetetIndit, munkamenetetZar } from "@/lib/munkamenet";

/** A címet visszaadjuk, hogy hibás jelszó után ne kelljen újra begépelni. */
export type BelepesEredmeny = {
  allapot: "ures" | "hiba";
  uzenet: string;
  email: string;
};

export async function belep(
  _elozo: BelepesEredmeny,
  urlap: FormData,
): Promise<BelepesEredmeny> {
  const email = emailtNormalizal(urlap.get("email"));
  const jelszo = String(urlap.get("jelszo") ?? "");

  if (!email || !jelszo) {
    return { allapot: "hiba", uzenet: "Add meg az e-mail-címet és a jelszót.", email };
  }

  // Ismeretlen címre és rossz jelszóra ugyanaz a válasz: így nem lehet
  // végigpróbálgatni, kinek van egyáltalán fiókja.
  const elutasitas: BelepesEredmeny = {
    allapot: "hiba",
    uzenet: "Nem stimmel az e-mail-cím vagy a jelszó.",
    email,
  };

  const felhasznalo = await prisma.felhasznalo.findUnique({ where: { email } });
  if (!felhasznalo) return elutasitas;
  if (!(await jelszoEgyezik(jelszo, felhasznalo.jelszoHash))) return elutasitas;

  await munkamenetetIndit(felhasznalo.id);
  redirect(felhasznalo.szerep === "berlo" ? "/berlo" : "/");
}

export async function kilep(): Promise<void> {
  await munkamenetetZar();
  redirect("/belepes");
}
