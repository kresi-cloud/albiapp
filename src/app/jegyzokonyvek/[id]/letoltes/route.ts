import { jegyzokonyvSzovege } from "@/domain/jegyzokonyv";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { jegyzokonyvBetoltes } from "@/lib/jegyzokonyv";

export const dynamic = "force-dynamic";

export async function GET(
  _keres: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo || felhasznalo.szerep !== "berbeado") {
    return new Response("Ehhez nincs jogosultságod.", { status: 403 });
  }

  const { id } = await params;
  const betoltott = await jegyzokonyvBetoltes(id, felhasznalo.id);
  if (!betoltott) return new Response("Nincs ilyen jegyzőkönyv.", { status: 404 });

  const szoveg = betoltott.veglegesSzoveg ?? jegyzokonyvSzovege(betoltott.bemenet);

  return new Response(szoveg, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="atadas-atveteli-jegyzokonyv.txt"`,
    },
  });
}
