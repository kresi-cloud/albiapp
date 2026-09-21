/**
 * Átadás-átvételi jegyzőkönyv.
 *
 * Ez a bérlet legfontosabb bizonyítéka: a mérőóraállások, a kulcsok, a lakás
 * állapota és a már meglévő hibák. Az utóbbi azért, mert amit átadáskor nem
 * írtak fel, arra a bérlő utólag nehezen hivatkozhat, és a bérbeadó is nehezen
 * számolja fel.
 *
 * A hibákhoz felelős és határidő tartozhat. Ebből teendő lesz, mert a
 * birtokbaadáskor tett ígéretek egyébként elvesznek.
 */

import { hosszuDatum, nevsor, type Fel } from "./szerzodes";
import { uzenet, type Uzenet } from "./nyelv";

export type TetelFajta = "meroora" | "kulcs" | "hiba" | "dokumentum";

export type Tetel = {
  fajta: TetelFajta;
  megnevezes: string;
  ertek?: string | null;
  megjegyzes?: string | null;
  felelos?: string | null;
  hatarido?: Date | null;
};

export type JegyzokonyvBemenet = {
  fajta: "birtokbaadas" | "visszaadas";
  idopont: Date;
  berbeado: Fel;
  berlok: Fel[];
  ingatlan: {
    megnevezes: string;
    cim: string;
    alapteruletM2: number | null;
    helyrajziSzam: string | null;
  };
  allapotLeiras: string;
  megjegyzes?: string | null;
  tetelek: Tetel[];
};

export const FAJTA_NEVE: Record<string, string> = {
  birtokbaadas: "Birtokbaadás",
  visszaadas: "Visszaadás",
};

export const TETEL_FAJTA_NEVE: Record<TetelFajta, string> = {
  meroora: "Mérőórák",
  kulcs: "Kulcsok és hozzáférési eszközök",
  hiba: "Hibák és hiányosságok",
  dokumentum: "Átadott dokumentumok",
};

/** A szakaszok sorrendje a papíron megszokott: mérők, kulcsok, állapot, hibák. */
const SORREND: TetelFajta[] = ["meroora", "kulcs", "hiba", "dokumentum"];

export function tetelekFajtankent(tetelek: Tetel[]): { fajta: TetelFajta; tetelek: Tetel[] }[] {
  return SORREND.map((fajta) => ({
    fajta,
    tetelek: tetelek.filter((tetel) => tetel.fajta === fajta),
  })).filter((csoport) => csoport.tetelek.length > 0);
}

function idopontSzoveg(idopont: Date): string {
  const ora = String(idopont.getUTCHours()).padStart(2, "0");
  const perc = String(idopont.getUTCMinutes()).padStart(2, "0");
  return `${hosszuDatum(idopont)} ${ora}:${perc}`;
}

function felSor(fel: Fel): string {
  const reszek = [fel.lakcim, fel.igazolvanySzam ? `igazolványszám: ${fel.igazolvanySzam}` : ""]
    .filter(Boolean)
    .join("; ");
  return reszek ? `${fel.nev} (${reszek})` : fel.nev;
}

/**
 * Hiánytalan-e a jegyzőkönyv. Nem tiltás, hanem figyelmeztetés: a bérbeadó
 * tudja, hogy a helyszínen mit mért le és mit nem.
 */
export function hianyzoTetelek(bemenet: JegyzokonyvBemenet): Uzenet[] {
  const hianyok: Uzenet[] = [];
  const csoportok = new Map(tetelekFajtankent(bemenet.tetelek).map((cs) => [cs.fajta, cs.tetelek]));

  if (!csoportok.has("meroora")) {
    hianyok.push(uzenet("hiany.jegyzokonyv.nincs_meroora"));
  } else {
    for (const tetel of csoportok.get("meroora") ?? []) {
      if (!tetel.ertek || tetel.ertek.trim() === "") {
        hianyok.push(uzenet("hiany.jegyzokonyv.oraallas", { megnevezes: tetel.megnevezes }));
      }
    }
  }

  if (!csoportok.has("kulcs")) hianyok.push(uzenet("hiany.jegyzokonyv.nincs_kulcs"));
  if (bemenet.allapotLeiras.trim() === "") hianyok.push(uzenet("hiany.jegyzokonyv.allapot"));
  if (bemenet.berlok.length === 0) hianyok.push(uzenet("hiany.nincs_berlo"));

  return hianyok;
}

/**
 * Az óraállás mezője szabad szöveg ("2893 kWh", "91,058 m³"), mert a helyszínen
 * így olvassák le, és a mértékegységet is oda szokás írni. A szám elejét
 * kivesszük belőle; ha nem megy, nem tippelünk, hanem szólunk.
 */
export function oraallastKiolvas(nyers: string): number | null {
  const egyezes = /-?\d+(?:[.,]\d+)?/.exec(nyers.replace(/\s/g, ""));
  if (!egyezes) return null;
  const szam = Number(egyezes[0].replace(",", "."));
  return Number.isFinite(szam) && szam >= 0 ? szam : null;
}

/**
 * Azok a hibák, amelyeknek van felelőse és határideje. Ezekből lesz teendő, így
 * a birtokbaadáskor tett ígéret nem a jegyzőkönyv aljában marad.
 */
export function vallaltHibak(tetelek: Tetel[]): Tetel[] {
  return tetelek.filter(
    (tetel) => tetel.fajta === "hiba" && tetel.felelos && tetel.hatarido,
  );
}

/** A jegyzőkönyv sima szövegként: ezt nyomtatja ki és írja alá a két fél. */
export function jegyzokonyvSzovege(bemenet: JegyzokonyvBemenet): string {
  const tobb = bemenet.berlok.length > 1;
  const sorok: string[] = [
    `BÉRLEMÉNY ÁTADÁS-ÁTVÉTELI JEGYZŐKÖNYV`,
    "",
    `${FAJTA_NEVE[bemenet.fajta] ?? bemenet.fajta} · ${idopontSzoveg(bemenet.idopont)}`,
    "",
    `Bérlemény: ${bemenet.ingatlan.cim}` +
      (bemenet.ingatlan.helyrajziSzam ? ` (${bemenet.ingatlan.helyrajziSzam} hrsz.)` : "") +
      (bemenet.ingatlan.alapteruletM2 ? `, ${bemenet.ingatlan.alapteruletM2} m²` : ""),
    `Bérbeadó: ${felSor(bemenet.berbeado)}`,
    ...bemenet.berlok.map((berlo) => `Bérlő: ${felSor(berlo)}`),
    "",
  ];

  let sorszam = 0;
  for (const csoport of tetelekFajtankent(bemenet.tetelek)) {
    if (csoport.fajta === "hiba") continue;
    sorszam += 1;
    sorok.push(`${sorszam}. ${TETEL_FAJTA_NEVE[csoport.fajta]}`);
    for (const tetel of csoport.tetelek) {
      const reszek = [tetel.megnevezes, tetel.ertek, tetel.megjegyzes].filter(
        (resz) => resz && String(resz).trim() !== "",
      );
      sorok.push(`- ${reszek.join(" · ")}`);
    }
    sorok.push("");
  }

  sorszam += 1;
  sorok.push(`${sorszam}. A bérlemény állapota`);
  sorok.push(bemenet.allapotLeiras.trim() || "Nincs rögzítve.");
  sorok.push("");

  const hibak = bemenet.tetelek.filter((tetel) => tetel.fajta === "hiba");
  sorszam += 1;
  sorok.push(`${sorszam}. Hibák és hiányosságok`);
  sorok.push(
    "A Bérlemény a jegyzőkönyvben és a csatolt fényképeken feltüntetett állapotban kerül átadásra. " +
      "A jegyzőkönyvben nem rögzített, az átadáskor észszerű vizsgálattal felismerhető hibára vagy " +
      `hiányra ${tobb ? "a Bérlők" : "a Bérlő"} utóbb nem ${tobb ? "hivatkozhatnak" : "hivatkozhat"}.`,
  );
  if (hibak.length === 0) {
    sorok.push("A Felek hibát vagy hiányosságot nem rögzítettek.");
  } else {
    for (const hiba of hibak) {
      const vallalas =
        hiba.felelos && hiba.hatarido
          ? ` Vállalás: ${hiba.felelos === "berbeado" ? "a Bérbeadó" : tobb ? "a Bérlők" : "a Bérlő"}, ${hosszuDatum(hiba.hatarido)} napjáig.`
          : "";
      const reszek = [hiba.megnevezes, hiba.megjegyzes].filter(
        (resz) => resz && String(resz).trim() !== "",
      );
      sorok.push(`- ${reszek.join(" · ")}${vallalas}`);
    }
  }
  sorok.push("");

  if (bemenet.megjegyzes && bemenet.megjegyzes.trim() !== "") {
    sorszam += 1;
    sorok.push(`${sorszam}. Egyéb megjegyzés`);
    sorok.push(bemenet.megjegyzes.trim());
    sorok.push("");
  }

  sorok.push(
    "A Felek a mérőórák sértetlenségét és a fenti adatok helyességét közösen ellenőrizték. " +
      `${tobb ? "A Bérlők kijelentik" : "A Bérlő kijelenti"}, hogy a Bérleményt – a jegyzőkönyvben rögzített ` +
      "hibák és hiányosságok mellett – rendeltetésszerű használatra alkalmas állapotban " +
      `${bemenet.fajta === "birtokbaadas" ? (tobb ? "vették át" : "vette át") : (tobb ? "adták vissza" : "adta vissza")}.`,
  );
  sorok.push("");
  sorok.push(`Kelt: ${hosszuDatum(bemenet.idopont)}`);
  sorok.push("");
  sorok.push("Bérbeadó:");
  sorok.push(bemenet.berbeado.nev);
  sorok.push("");
  sorok.push(tobb ? "Bérlők:" : "Bérlő:");
  sorok.push(nevsor(bemenet.berlok.map((berlo) => berlo.nev)));

  return sorok.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
