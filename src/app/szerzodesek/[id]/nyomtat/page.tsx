import Link from "next/link";
import { notFound } from "next/navigation";
import { okiratSzovege } from "@/domain/szerzodes-keszites";
import { berloiIratSzovege } from "@/lib/dokumentumtar";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { szerzodesBemenet } from "@/lib/szerzodes";
import { Nyomtatogomb } from "./Nyomtatogomb";

export const dynamic = "force-dynamic";

/**
 * A szerződés nyomtatható példánya.
 *
 * A szerződést alá kell írni, tehát papírra kell kerülnie. Eddig csak a sima
 * szöveges letöltés volt meg, amit a bérbeadónak magának kellett Wordbe
 * illesztenie és beállítania — és ott a szöveg már el is tudott csúszni attól,
 * amit az alkalmazás kiadott.
 *
 * Ez a lap ugyanazt a szöveget adja, mint a letöltés: véglegesítés után a
 * befagyasztott példányt, tervezetnél a mostani modulokból építettet. Nem
 * formázza át és nem tördeli másképp — egy okiratból nem lehet két változat.
 *
 * PDF-et a böngésző nyomtatóablaka ad („Mentés PDF-be"), ezért nincs hozzá
 * kiszolgálói PDF-készítő. Az új függőség itt nem kényelmi kérdés: egy
 * kiszolgálón futó PDF-készítő saját betűtípusokkal és saját tördeléssel
 * dolgozna, tehát a PDF előbb-utóbb mást mutatna, mint a lap.
 *
 * A bérlő is megnyithatja, de csak a véglegesítettet — ugyanaz a szabály, mint
 * a letöltésnél: a tervezet még változhat, és nem az, amit aláírtak.
 */
export default async function NyomtatasOldal({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nyelv?: string }>;
}) {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) notFound();

  const { id } = await params;
  const { sz } = await szovegek();
  // A fordítást külön kell kérni: nem a felület nyelvéből következik. A magyar
  // felületet használó bérbeadó is nyomtatni akarja az angolt a külföldi
  // bérlőjének.
  const angol = (await searchParams).nyelv === "en";

  let szoveg: string | null = null;
  let tervezet = false;

  if (felhasznalo.szerep === "berlo") {
    const irat = await berloiIratSzovege("szerzodes", id, felhasznalo.id, angol ? "en" : "hu");
    szoveg = irat?.szoveg ?? null;
  } else {
    const betoltott = await szerzodesBemenet(id, felhasznalo.id);
    if (betoltott) {
      tervezet = betoltott.allapot !== "veglegesitve";
      szoveg = angol
        ? tervezet
          ? okiratSzovege(betoltott.bemenet, "en")
          : betoltott.veglegesSzovegEn
        : (betoltott.veglegesSzoveg ?? okiratSzovege(betoltott.bemenet));
    }
  }

  if (!szoveg) notFound();

  return (
    <div className="grid gap-4">
      {/*
        A vezérlők a papírra nem kerülnek rá: a nyomtatott példányon egy
        „Nyomtatás" gomb felirata idegen test volna.
      */}
      <section className="grid gap-3 print:hidden">
        <Link
          href={`/szerzodesek/${id}`}
          className="text-sm underline underline-offset-2"
        >
          {sz("nyomtatas.vissza")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{sz("nyomtatas.cim")}</h1>
        <p className="text-sm text-halvany">{sz("nyomtatas.sugo")}</p>
        <Nyomtatogomb cimke={sz("nyomtatas.gomb")} />
      </section>

      {/*
        A tervezet a papíron is tervezet marad. Egy kinyomtatott lap mellől
        hiányzik a lap többi része, ami eddig kimondta: aki a kezébe kapja, csak
        ebből tudhatja meg, hogy ezt még nem írta alá senki.
      */}
      {tervezet ? (
        <p className="rounded border border-figyelem-keret bg-figyelem-lap p-3 text-sm font-medium text-figyelem print:border print:bg-transparent">
          {sz("nyomtatas.tervezet")}
        </p>
      ) : null}

      <pre className="okirat whitespace-pre-wrap text-sm leading-relaxed text-szoveg">
        {szoveg}
      </pre>
    </div>
  );
}
