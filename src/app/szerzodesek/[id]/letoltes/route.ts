import { szerzodesSzovege } from "@/domain/szerzodes-keszites";
import { berloiIratSzovege } from "@/lib/dokumentumtar";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { szerzodesBemenet } from "@/lib/szerzodes";

export const dynamic = "force-dynamic";

function valasz(szoveg: string, fajlnev: string): Response {
  return new Response(szoveg, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fajlnev}.txt"`,
    },
  });
}

/**
 * A szerződés sima szövegként. Wordbe és nyomtatásba is ezt viszi tovább.
 *
 * A bérlő is letöltheti a sajátját, de csak a véglegesített szöveget: a tervezet
 * még változhat, és nem az, amit aláírtak.
 */
export async function GET(
  _keres: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo) return new Response(sz("letoltes.nincs_jogosultsag"), { status: 403 });

  const { id } = await params;

  if (felhasznalo.szerep === "berlo") {
    const szoveg = await berloiIratSzovege("szerzodes", id, felhasznalo.id);
    if (!szoveg) {
      return new Response(sz("letoltes.nincs_vegleges_szerzodes"), { status: 404 });
    }
    return valasz(szoveg, "berleti-szerzodes");
  }

  const betoltott = await szerzodesBemenet(id, felhasznalo.id);
  if (!betoltott) return new Response(sz("letoltes.nincs_szerzodes"), { status: 404 });

  const szoveg = betoltott.veglegesSzoveg ?? szerzodesSzovege(betoltott.bemenet);
  const fajlnev =
    betoltott.allapot === "veglegesitve" ? "berleti-szerzodes" : "berleti-szerzodes-tervezet";

  return valasz(szoveg, fajlnev);
}
