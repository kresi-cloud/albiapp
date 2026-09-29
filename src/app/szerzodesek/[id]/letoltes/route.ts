import { ketnyelvuSzovege, okiratSzovege } from "@/domain/szerzodes-keszites";
import { berloiIratSzovege, berloiKetnyelvu } from "@/lib/dokumentumtar";
import { allapota as ketnyelvuAllapota } from "@/domain/szerzodes-ketnyelvu";
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
 * A kétnyelvű példány szövege.
 *
 * Véglegesítésnél a befagyasztott példány jön, tervezetnél a mostani
 * modulokból építve — ugyanaz a szabály, mint a magyarnál és a fordításnál. A
 * bérlő viszont csak a véglegesítettet kapja meg: a tervezet még változhat.
 */
async function ketnyelvuLetoltes(
  id: string,
  felhasznalo: { id: string; szerep: string },
): Promise<string | null> {
  if (felhasznalo.szerep === "berlo") {
    const irat = await berloiKetnyelvu(id, felhasznalo.id);
    return irat;
  }
  const betoltott = await szerzodesBemenet(id, felhasznalo.id);
  if (!betoltott) return null;
  if (betoltott.allapot === "veglegesitve") return betoltott.veglegesSzovegKet;
  return ketnyelvuAllapota(
    betoltott.nyelvKerdezettek.map((fel) => fel.id),
    betoltott.nyelvNyilatkozatok,
  ) === "tamogatott"
    ? ketnyelvuSzovege(betoltott.bemenet)
    : null;
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
  const kertNyelv = new URL(keres.url).searchParams.get("nyelv");
  const angol = kertNyelv === "en";
  // A kétnyelvű példány csak akkor van, ha a felek mindegyike támogatta: egy
  // üres letöltés azt ígérné, hogy minden szerződéshez jár ilyen.
  const ketnyelvu = kertNyelv === "ket";

  if (ketnyelvu) {
    const szoveg = await ketnyelvuLetoltes(id, felhasznalo);
    if (!szoveg) return new Response(sz("letoltes.nincs_ketnyelvu"), { status: 404 });
    return valasz(szoveg, "berleti-szerzodes-ketnyelvu");
  }

  if (felhasznalo.szerep === "berlo") {
    const irat = await berloiIratSzovege("szerzodes", id, felhasznalo.id, angol ? "en" : "hu");
    if (!irat) {
      return new Response(
        sz(angol ? "letoltes.nincs_forditas" : "letoltes.nincs_vegleges_szerzodes"),
        { status: 404 },
      );
    }
    return valasz(
      irat.szoveg,
      irat.zaradek
        ? angol
          ? "lease-agreement-addendum-translation"
          : "szerzodes-zaradek"
        : angol
          ? "lease-agreement-translation"
          : "berleti-szerzodes",
    );
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
      betoltott.fajta === "zaradek"
        ? betoltott.allapot === "veglegesitve"
          ? "lease-agreement-addendum-translation"
          : "lease-agreement-addendum-draft-translation"
        : betoltott.allapot === "veglegesitve"
          ? "lease-agreement-translation"
          : "lease-agreement-draft-translation",
    );
  }

  const szoveg = betoltott.veglegesSzoveg ?? okiratSzovege(betoltott.bemenet);
  // A záradék külön okirat, tehát külön fájlnév is jár neki: mindkettő
  // „berleti-szerzodes.txt" néven jött le, és a második felülírta az elsőt a
  // letöltések mappájában — pont azt a kettőt, aminek egymás mellett kell
  // állnia.
  const fajlnev =
    betoltott.fajta === "zaradek"
      ? betoltott.allapot === "veglegesitve"
        ? "szerzodes-zaradek"
        : "szerzodes-zaradek-tervezet"
      : betoltott.allapot === "veglegesitve"
        ? "berleti-szerzodes"
        : "berleti-szerzodes-tervezet";

  return valasz(szoveg, fajlnev);
}
