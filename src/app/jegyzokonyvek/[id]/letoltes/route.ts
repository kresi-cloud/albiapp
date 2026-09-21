import { jegyzokonyvSzovege } from "@/domain/jegyzokonyv";
import { berloiIratSzovege } from "@/lib/dokumentumtar";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { jegyzokonyvBetoltes } from "@/lib/jegyzokonyv";

export const dynamic = "force-dynamic";

function valasz(szoveg: string): Response {
  return new Response(szoveg, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="atadas-atveteli-jegyzokonyv.txt"`,
    },
  });
}

/** A bérlő a véglegesített jegyzőkönyvét töltheti le: az a közös bizonyíték. */
export async function GET(
  _keres: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo) return new Response(sz("letoltes.nincs_jogosultsag"), { status: 403 });

  const { id } = await params;

  if (felhasznalo.szerep === "berlo") {
    const szoveg = await berloiIratSzovege("jegyzokonyv", id, felhasznalo.id);
    if (!szoveg) {
      return new Response(sz("letoltes.nincs_vegleges_jegyzokonyv"), { status: 404 });
    }
    return valasz(szoveg);
  }

  const betoltott = await jegyzokonyvBetoltes(id, felhasznalo.id);
  if (!betoltott) return new Response(sz("letoltes.nincs_jegyzokonyv"), { status: 404 });

  return valasz(betoltott.veglegesSzoveg ?? jegyzokonyvSzovege(betoltott.bemenet));
}
