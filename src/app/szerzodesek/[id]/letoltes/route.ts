import { okiratSzovege } from "@/domain/szerzodes-keszites";
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
  keres: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo) return new Response(sz("letoltes.nincs_jogosultsag"), { status: 403 });

  const { id } = await params;
  // A fordítást külön kérni kell. Nem a felület nyelvéből következik: a magyar
  // bérbeadó is le akarja tölteni az angolt a külföldi bérlőjének, a magyarul
  // olvasó bérlő pedig attól még a magyar példányt kapja.
  const angol = new URL(keres.url).searchParams.get("nyelv") === "en";

  if (felhasznalo.szerep === "berlo") {
    const szoveg = await berloiIratSzovege("szerzodes", id, felhasznalo.id, angol ? "en" : "hu");
    if (!szoveg) {
      return new Response(
        sz(angol ? "letoltes.nincs_forditas" : "letoltes.nincs_vegleges_szerzodes"),
        { status: 404 },
      );
    }
    return valasz(szoveg, angol ? "lease-agreement-translation" : "berleti-szerzodes");
  }

  const betoltott = await szerzodesBemenet(id, felhasznalo.id);
  if (!betoltott) return new Response(sz("letoltes.nincs_szerzodes"), { status: 404 });

  if (angol) {
    // Véglegesített szerződésnél a befagyasztott fordítás megy, tervezetnél a
    // mostani modulszövegekből készült — ugyanúgy, ahogy a magyarnál.
    const szoveg =
      betoltott.allapot === "veglegesitve"
        ? betoltott.veglegesSzovegEn
        : okiratSzovege(betoltott.bemenet, "en");
    if (!szoveg) return new Response(sz("letoltes.nincs_forditas"), { status: 404 });
    return valasz(
      szoveg,
      betoltott.allapot === "veglegesitve"
        ? "lease-agreement-translation"
        : "lease-agreement-draft-translation",
    );
  }

  const szoveg = betoltott.veglegesSzoveg ?? okiratSzovege(betoltott.bemenet);
  const fajlnev =
    betoltott.allapot === "veglegesitve" ? "berleti-szerzodes" : "berleti-szerzodes-tervezet";

  return valasz(szoveg, fajlnev);
}
