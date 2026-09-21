/**
 * Belépett felhasználó: a sütiben aláírt jegy, mögötte a felhasználó sora.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jegyetKeszit, jegyetOlvas } from "@/lib/jegy";
import { prisma } from "@/lib/db";

const SUTI = "albi_munkamenet";
const ELETTARTAM_NAP = 30;

/** Fejlesztéshez van tartaléka, élesben viszont kötelező a saját titok. */
function titok(): string {
  const ertek = process.env.MUNKAMENET_TITOK;
  if (ertek && ertek.length >= 16) return ertek;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Hiányzik a MUNKAMENET_TITOK környezeti változó, pedig a munkamenet aláírásához kell.",
    );
  }
  return "fejlesztoi-titok-csak-helyben-ervenyes";
}

export async function munkamenetetIndit(felhasznaloId: string): Promise<void> {
  const lejar = Date.now() + ELETTARTAM_NAP * 24 * 60 * 60 * 1000;
  const suti = await cookies();

  suti.set(SUTI, jegyetKeszit({ felhasznaloId, lejar }, titok()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(lejar),
  });
}

export async function munkamenetetZar(): Promise<void> {
  const suti = await cookies();
  suti.delete(SUTI);
}

export async function belepettFelhasznalo() {
  const suti = await cookies();
  const jegy = jegyetOlvas(suti.get(SUTI)?.value, titok(), new Date());
  if (!jegy) return null;

  return prisma.felhasznalo.findUnique({ where: { id: jegy.felhasznaloId } });
}

/**
 * A szerep az adatbázisban szöveg, a kódban viszont két érték van. Ez a
 * szűkítés egy helyen történik, hogy ne minden hívó találgasson.
 */
export function szerepe(felhasznalo: { szerep: string }): "berbeado" | "berlo" {
  return felhasznalo.szerep === "berlo" ? "berlo" : "berbeado";
}

/** Oldalankénti őr: aki nincs belépve vagy nem ezt a szerepet viseli, a belépésre megy. */
export async function kotelezoSzerep(szerep: "berbeado" | "berlo") {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) redirect("/belepes");
  if (felhasznalo.szerep !== szerep) {
    redirect(felhasznalo.szerep === "berlo" ? "/berlo" : "/");
  }
  return felhasznalo;
}
