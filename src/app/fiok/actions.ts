"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  emailNekLatszik,
  emailtNormalizal,
  jelszotEllenoriz,
} from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { jelszoEgyezik, jelszotHashel } from "@/lib/jelszo";
import { belepettFelhasznalo, munkamenetetIndit } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
};

function hiba(uzenet: string, hibak: string[] = []): Eredmeny {
  return { allapot: "hiba", uzenet, hibak };
}

/**
 * Belépett felhasználó, szereptől függetlenül: a fiók mindkét szerepé.
 *
 * Aki közben kilépett vagy letiltották, a belépőlapra megy, nem hibalapra: a
 * munkamenet lejárta nem rendellenesség, hanem a harminc nap vége.
 */
async function sajatFiok() {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) redirect("/belepes");
  return felhasznalo;
}

function frissit(): void {
  revalidatePath("/fiok");
  revalidatePath("/");
}

/**
 * A saját név módosítása.
 *
 * Eddig a bérbeadó neve sehol nem volt javítható: egy elgépelt név a
 * szerződésen és minden igazoláson ott maradt. A már véglegesített okiratok
 * szövege ettől nem változik meg — azt a `veglegesSzoveg` befagyasztotta.
 */
export async function nevetMent(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const felhasznalo = await sajatFiok();
  const { sz } = await szovegek();
  const nev = String(urlap.get("nev") ?? "").trim();

  if (nev === "") return hiba(sz("fiok.hiba.nev"));

  await prisma.felhasznalo.update({
    where: { id: felhasznalo.id },
    data: { nev },
  });

  frissit();
  return { allapot: "kesz", uzenet: sz("fiok.nev_kesz"), hibak: [] };
}

/**
 * Jelszócsere.
 *
 * A mostani jelszót azért kérjük, mert nélküle egy nyitva hagyott gépnél bárki
 * átvenné a fiókot. A csere a **korábbi munkameneteket is elveszi**
 * (`munkamenetekTol`): a süti harminc napig él, tehát enélkül a csere pont
 * attól nem venné el a hozzáférést, akinek a régi jelszó a kezébe került. A
 * saját munkamenetünket rögtön újranyitjuk, különben a felhasználó a saját
 * jelszócseréjétől lépne ki.
 */
export async function jelszotCserel(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const felhasznalo = await sajatFiok();
  const { sz, u } = await szovegek();

  const mostani = String(urlap.get("mostani") ?? "");
  if (!(await jelszoEgyezik(mostani, felhasznalo.jelszoHash))) {
    return hiba(sz("fiok.hiba.mostani_jelszo"));
  }

  const uj = String(urlap.get("jelszo") ?? "");
  const hibak = jelszotEllenoriz(uj, urlap.get("jelszoUjra")).map(u);
  if (hibak.length > 0) return hiba(sz("regisztracio.hiba.nem_kesz"), hibak);

  await prisma.felhasznalo.update({
    where: { id: felhasznalo.id },
    data: { jelszoHash: await jelszotHashel(uj), munkamenetekTol: new Date() },
  });
  await munkamenetetIndit(felhasznalo.id);

  frissit();
  return { allapot: "kesz", uzenet: sz("fiok.jelszo_kesz"), hibak: [] };
}

/**
 * E-mail-cím módosítása.
 *
 * Ezzel a címmel lép be a felhasználó, tehát az elgépelt cím kizárná magát —
 * megerősítő levelet ugyanis egyelőre nem küldünk. A mostani jelszót ezért is
 * kérjük: enélkül egy nyitva hagyott gépen a fiók címét írná át valaki, és a
 * gazdája csak a következő belépésnél venné észre.
 */
export async function emailtCserel(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const felhasznalo = await sajatFiok();
  const { sz } = await szovegek();

  const mostani = String(urlap.get("mostani") ?? "");
  if (!(await jelszoEgyezik(mostani, felhasznalo.jelszoHash))) {
    return hiba(sz("fiok.hiba.mostani_jelszo"));
  }

  const email = emailtNormalizal(urlap.get("email"));
  if (!emailNekLatszik(email)) return hiba(sz("fiok.hiba.email"));
  if (email === felhasznalo.email) return hiba(sz("fiok.hiba.ugyanaz_email"));

  const foglalt = await prisma.felhasznalo.findUnique({ where: { email } });
  if (foglalt) return hiba(sz("fiok.hiba.foglalt_email"));

  await prisma.felhasznalo.update({
    where: { id: felhasznalo.id },
    data: { email },
  });

  frissit();
  return { allapot: "kesz", uzenet: sz("fiok.email_kesz"), hibak: [] };
}
