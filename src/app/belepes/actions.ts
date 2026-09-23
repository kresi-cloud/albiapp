"use server";

import { redirect } from "next/navigation";
import { emailtNormalizal } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { jelszoEgyezik } from "@/lib/jelszo";
import { munkamenetetIndit, munkamenetetZar } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

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
  const { sz } = await szovegek();
  const email = emailtNormalizal(urlap.get("email"));
  const jelszo = String(urlap.get("jelszo") ?? "");

  if (!email || !jelszo) {
    return { allapot: "hiba", uzenet: sz("belepes.hiba.hianyos"), email };
  }

  // Ismeretlen címre és rossz jelszóra ugyanaz a válasz: így nem lehet
  // végigpróbálgatni, kinek van egyáltalán fiókja.
  const elutasitas: BelepesEredmeny = {
    allapot: "hiba",
    uzenet: sz("belepes.hiba.rossz"),
    email,
  };

  const felhasznalo = await prisma.felhasznalo.findUnique({ where: { email } });
  if (!felhasznalo) return elutasitas;
  if (!(await jelszoEgyezik(jelszo, felhasznalo.jelszoHash))) return elutasitas;

  // A letiltott fiók ugyanazt a választ kapja, mint a rossz jelszó. Nem
  // udvariasságból: aki a címet végigpróbálja, abból is megtudná, hogy van
  // ott fiók, csak épp letiltva — és az is információ, ami nem az övé.
  if (felhasznalo.letiltva) return elutasitas;

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
