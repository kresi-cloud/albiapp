import { elszamolasSzovege } from "@/domain/dokumentumtar";
import { elszamolasIrat } from "@/lib/dokumentumtar";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

/**
 * A kiadott rezsielszámolás sima szövegként. Tervezetet nem ad ki: az még
 * változhat, és a bérlő kezében lévő papírnak egyeznie kell a felülettel.
 */
export async function GET(
  _keres: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo) return new Response(sz("letoltes.nincs_jogosultsag"), { status: 403 });

  const { id } = await params;
  const irat = await elszamolasIrat(id, felhasznalo);
  if (!irat) return new Response(sz("letoltes.nincs_elszamolas"), { status: 404 });

  const idoszak = irat.idoszakVege.toISOString().slice(0, 7);

  return new Response(elszamolasSzovege(irat), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="rezsielszamolas-${idoszak}.txt"`,
    },
  });
}
