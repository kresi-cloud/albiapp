import { szerzodesSzovege } from "@/domain/szerzodes-keszites";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szerzodesBemenet } from "@/lib/szerzodes";

export const dynamic = "force-dynamic";

/** A szerződés sima szövegként. Wordbe és nyomtatásba is ezt viszi tovább. */
export async function GET(
  _keres: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo || felhasznalo.szerep !== "berbeado") {
    return new Response("Ehhez nincs jogosultságod.", { status: 403 });
  }

  const { id } = await params;
  const betoltott = await szerzodesBemenet(id, felhasznalo.id);
  if (!betoltott) return new Response("Nincs ilyen szerződés.", { status: 404 });

  const szoveg = betoltott.veglegesSzoveg ?? szerzodesSzovege(betoltott.bemenet);
  const fajlnev = betoltott.allapot === "veglegesitve" ? "berleti-szerzodes" : "berleti-szerzodes-tervezet";

  return new Response(szoveg, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fajlnev}.txt"`,
    },
  });
}
