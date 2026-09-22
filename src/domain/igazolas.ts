/**
 * Bérbeadói igazolás a bérleti díj megfizetéséről.
 *
 * Albérlettámogatáshoz, ösztöndíjhoz és munkáltatói térítéshez kérik, jellemzően
 * havonta, és a bérbeadónak minden alkalommal ugyanazt kell kitöltenie. Az
 * alkalmazásban viszont már megvan, melyik hónapra mennyi és mikor érkezett, így
 * az összeget és a teljesítés napját nem kézzel írjuk be, hanem a párosított
 * befizetésből vesszük.
 *
 * Amit nem tudunk, azt nem találjuk ki: ha egy hónapra nincs beazonosított
 * befizetés, arra a hónapra nem ajánlunk igazolást.
 */

import { hosszuDatum, osszegSzoveg, tagolt, type Fel } from "./szerzodes";

export type TeljesitesModja = "atutalas" | "keszpenz" | "egyeb";

export const TELJESITES_MODJA_NEVE: Record<TeljesitesModja, string> = {
  atutalas: "banki átutalás",
  keszpenz: "készpénz",
  egyeb: "egyéb",
};

export type Befizetes = {
  /** "2026-09" */
  idoszak: string;
  osszegFt: number;
  napja: Date;
  /** Az egyeztetés állapota: csak a beazonosított befizetés igazolható. */
  allapot: string;
};

export type IgazolasBemenet = {
  berbeado: Fel;
  /** Akinek az igazolás szól. Több bérlőnél a bérbeadó választja ki. */
  berlo: Fel;
  osszesBerlo: Fel[];
  ingatlan: { cim: string };
  jogviszony: {
    kezdete: Date;
    vege: Date | null;
    berletiDijFt: number;
    szerzodesKelte: Date | null;
  };
  cel: string;
  idoszak: string;
  osszegFt: number;
  teljesitesNapja: Date;
  teljesitesModja: TeljesitesModja;
  kiallitasHelye: string;
  kiallitasNapja: Date;
};

const HONAPOK = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];

/** "2026-09" → "2026. szeptember" */
export function idoszakCimke(idoszak: string): string {
  const egyezes = /^(\d{4})-(\d{2})$/.exec(idoszak);
  if (!egyezes) return idoszak;
  const honap = HONAPOK[Number(egyezes[2]) - 1];
  return honap ? `${egyezes[1]}. ${honap}` : idoszak;
}

/**
 * Amire igazolást lehet kiállítani: ahol ténylegesen érkezett pénz. Az eltérő
 * összegű befizetés is igazolható, mert az is megtörtént — csak nem annyi, mint
 * az előírás. Amire nem érkezett semmi, arról nem állítunk ki igazolást.
 */
export function igazolhatoBefizetesek(befizetesek: Befizetes[]): Befizetes[] {
  return befizetesek
    .filter((sor) => sor.allapot !== "hianyzik" && sor.osszegFt > 0)
    .sort((a, b) => b.idoszak.localeCompare(a.idoszak));
}

export function igazolasSzovege(bemenet: IgazolasBemenet): string {
  const tobb = bemenet.osszesBerlo.length > 1;
  const idotartam = bemenet.jogviszony.vege
    ? `${hosszuDatum(bemenet.jogviszony.kezdete)} – ${hosszuDatum(bemenet.jogviszony.vege)}`
    : `${hosszuDatum(bemenet.jogviszony.kezdete)} napjától határozatlan időre`;

  const sorok: string[] = [
    "BÉRBEADÓI IGAZOLÁS",
    "",
    bemenet.cel.trim(),
    "",
    `Bérbeadó: ${bemenet.berbeado.nev}`,
  ];

  if (bemenet.berbeado.lakcim) sorok.push(`Bérbeadó címe: ${bemenet.berbeado.lakcim}`);
  sorok.push(`Bérlő: ${bemenet.berlo.nev}`);
  if (bemenet.berlo.lakcim) sorok.push(`Bérlő állandó lakcíme: ${bemenet.berlo.lakcim}`);
  sorok.push(`Bérlemény címe: ${bemenet.ingatlan.cim}`);
  sorok.push(`Bérleti jogviszony: ${idotartam}`);
  sorok.push(
    `Szerződés szerinti havi bérleti díj: ${tagolt(bemenet.jogviszony.berletiDijFt)} Ft` +
      (tobb ? ` a ${bemenet.osszesBerlo.length} bérlő együttes bérleti jogviszonyára` : ""),
  );

  sorok.push("");
  sorok.push("IGAZOLT TÁRGYHAVI TELJESÍTÉS");
  sorok.push(`Tárgyhó: ${idoszakCimke(bemenet.idoszak)}`);
  sorok.push(`A fenti bérlőhöz igazolt összeg: ${osszegSzoveg(bemenet.osszegFt)}`);
  sorok.push(`A teljesítés napja: ${hosszuDatum(bemenet.teljesitesNapja)}`);
  sorok.push(`A teljesítés módja: ${TELJESITES_MODJA_NEVE[bemenet.teljesitesModja]}`);

  sorok.push("");
  sorok.push(
    `Alulírott bérbeadó igazolom, hogy ${bemenet.berlo.nev} a fenti bérleményre vonatkozó` +
      (bemenet.jogviszony.szerzodesKelte
        ? `, ${hosszuDatum(bemenet.jogviszony.szerzodesKelte)} napján kelt`
        : "") +
      " lakásbérleti szerződés bérlője. Igazolom továbbá, hogy a fent megjelölt tárgyhónapra és " +
      "összegre vonatkozó bérletidíj-fizetés a részemre megtörtént.",
  );

  if (tobb) {
    sorok.push(
      "A bérleti szerződés szerint a bérlők a fizetési kötelezettségek teljesítéséért egyetemlegesen " +
        "felelnek; bármelyik bérlő teljesítése a teljesítés mértékéig a többi bérlőt is mentesíti.",
    );
  }

  sorok.push("");
  sorok.push(
    `Kelt: ${[bemenet.kiallitasHelye.trim(), hosszuDatum(bemenet.kiallitasNapja)]
      .filter(Boolean)
      .join(", ")}`,
  );
  if (bemenet.berbeado.email) sorok.push(`Kapcsolattartás: ${bemenet.berbeado.email}`);
  sorok.push("");
  sorok.push(bemenet.berbeado.nev);
  sorok.push("bérbeadó");
  sorok.push("");
  sorok.push(
    "Megjegyzés: ez a dokumentum nem hatósági vagy intézményi formanyomtatvány, hanem a bérletidíj-fizetés " +
      "igazolására készült bérbeadói nyilatkozat. Ha a pályázat saját űrlapot ír elő, azt is ki kell tölteni.",
  );

  return sorok.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
