import { adoEv } from "@/lib/ado";
import { szovegekNyelvvel } from "@/domain/szotar";
import { belepettFelhasznalo } from "@/lib/munkamenet";

/**
 * Az év összesítője CSV-ben, hogy a könyvelőnek is át lehessen adni.
 * Pontosvesszős elválasztás és BOM: így nyitja meg helyesen a magyar Excel.
 *
 * A tábla magyarul marad akkor is, ha a felület angolul megy: ez a fájl a
 * könyvelőnek készül, és a magyar adózási szakszavakat ő keresi benne.
 */
export async function GET(keres: Request): Promise<Response> {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo || felhasznalo.szerep !== "berbeado") {
    return new Response("Nincs jogosultság.", { status: 403 });
  }

  const cim = new URL(keres.url);
  const ev = Number(cim.searchParams.get("ev")) || new Date().getUTCFullYear();
  const adatok = await adoEv(felhasznalo.id, ev);
  const { sz, u } = szovegekNyelvvel("hu");

  const nap = (datum: Date | null) => (datum ? datum.toISOString().slice(0, 10) : "");
  const idezojel = (szoveg: string) => `"${szoveg.replace(/"/g, '""')}"`;

  const sorok: string[][] = [["Szakasz", "Dátum", "Megnevezés", "Bevétel", "Nem bevétel", "Költség", "Indoklás"]];

  for (const sor of adatok.bevetelSorok) {
    sorok.push([
      "Bevétel",
      nap(sor.datum),
      u(sor.megnevezes),
      String(sor.bevetelFt),
      String(sor.nemBevetelFt),
      "",
      u(sor.indoklas),
    ]);
  }

  for (const sor of adatok.koltsegSorok) {
    sorok.push([
      "Költség",
      nap(sor.datum),
      `${sor.ingatlan} · ${u(sor.megnevezes)}`,
      "",
      "",
      String(sor.osszegFt),
      sz(`ado.fajta.${sor.fajta}`),
    ]);
  }

  for (const sor of adatok.besorolatlan) {
    sorok.push([
      "Besorolatlan",
      nap(sor.datum),
      u(sor.megjegyzes),
      String(sor.osszegFt),
      "",
      "",
      "",
    ]);
  }

  const o = adatok.osszesito;
  sorok.push([]);
  sorok.push(["Összesítés", "", "Bevétel", String(o.bevetelFt), "", "", ""]);
  sorok.push(["Összesítés", "", "Nem bevétel", "", String(o.nemBevetelFt), "", ""]);
  sorok.push(["Összesítés", "", "Költség összesen", "", "", String(o.tetelesKoltsegFt), ""]);
  sorok.push(["Összesítés", "", "Adóalap 10%-os költséghányaddal", String(o.adoalapHanyadFt), "", "", ""]);
  sorok.push(["Összesítés", "", "Szja 10%-os költséghányaddal", String(o.adoHanyadFt), "", "", ""]);
  sorok.push(["Összesítés", "", "Adóalap tételes elszámolással", String(o.adoalapTetelesFt), "", "", ""]);
  sorok.push(["Összesítés", "", "Szja tételes elszámolással", String(o.adoTetelesFt), "", "", ""]);
  sorok.push([
    "Összesítés",
    "",
    "Ajánlott mód",
    "",
    "",
    "",
    o.ajanlott === "teteles" ? "tételes költségelszámolás" : "10%-os költséghányad",
  ]);

  const csv = "﻿" + sorok.map((sor) => sor.map(idezojel).join(";")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="adoosszesito-${ev}.csv"`,
    },
  });
}
