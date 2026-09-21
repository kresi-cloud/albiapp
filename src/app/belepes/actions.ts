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

  // Első belépéskor egyszer elkérjük a saját adatait: a szerződéshez kellenek,
  // és aláírás előtt kapkodva rosszabb megadni. Kihagyható, és a hiányra
  // onnantól teendő emlékeztet — nem toljuk elé minden belépéskor.
  const berlo = felhasznalo.szerep === "berlo";
  if (felhasznalo.adatkeresLatta === null) {
    redirect(berlo ? "/berlo/adatok?elso=1" : "/beallitasok?elso=1");
  }

  redirect(berlo ? "/berlo" : "/");
}

export async function kilep(): Promise<void> {
  await munkamenetetZar();
  redirect("/belepes");
}
