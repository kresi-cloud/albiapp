/**
 * Dokumentumtár.
 *
 * Az alkalmazás négyféle papírt állít elő: bérleti szerződést, átadás-átvételi
 * jegyzőkönyvet, bérbeadói igazolást és rezsielszámolást. Ezek négy külön
 * táblában élnek, mert négy különböző dolog; a bérbeadónak és a bérlőnek viszont
 * egy listában kell látniuk őket, időrendben, mert a kérdés mindig az, hogy
 * „megvan-e már, és hol”.
 *
 * Ez a modul csak összefésül és rendez. Amit a bérlő lát, az a kiadott okirat:
 * tervezetet nem mutatunk neki, mert a tervezet még változhat.
 */

import { forint, datum } from "./penz";
import { simaSzokoz } from "./szerzodes";

export type DokumentumFajta = "szerzodes" | "jegyzokonyv" | "igazolas" | "elszamolas";

export const FAJTA_CIMKE: Record<DokumentumFajta, string> = {
  szerzodes: "Bérleti szerződés",
  jegyzokonyv: "Jegyzőkönyv",
  igazolas: "Bérbeadói igazolás",
  elszamolas: "Rezsielszámolás",
};

export type Dokumentum = {
  kulcs: string;
  fajta: DokumentumFajta;
  cim: string;
  reszlet: string;
  datum: Date;
  /** Kiadott okirat-e. Ami nem az, az tervezet, és a bérlő elől rejtve marad. */
  kiadott: boolean;
  allapotCimke: string;
  jogviszonyId: string;
  jogviszonyCimke: string;
  /** A szerkesztő oldal; csak a bérbeadónak van ilyen. */
  megnyitas?: string;
  letoltes?: string;
};

export type TarSzerzodes = {
  id: string;
  megnevezes: string;
  allapot: string;
  veglegesitve: Date | null;
  letrehozva: Date;
};

export type TarJegyzokonyv = {
  id: string;
  fajtaNeve: string;
  idopont: Date;
  allapot: string;
  veglegesitve: Date | null;
};

export type TarIgazolas = {
  id: string;
  berloNev: string;
  idoszakCimke: string;
  osszegFt: number;
  kiallitva: Date;
};

export type TarElszamolas = {
  id: string;
  idoszakKezdete: Date;
  idoszakVege: Date;
  allapot: string;
  osszegFt: number;
  kiadva: Date | null;
};

export type TarJogviszony = {
  id: string;
  cimke: string;
  szerzodesek: TarSzerzodes[];
  jegyzokonyvek: TarJegyzokonyv[];
  igazolasok: TarIgazolas[];
  elszamolasok: TarElszamolas[];
};

const ELSZAMOLAS_ALLAPOT: Record<string, string> = {
  tervezet: "tervezet",
  kiadva: "kiadva, a bérlő elbírálására vár",
  elfogadva: "a bérlő elfogadta",
  vitatott: "a bérlő vitatja",
};

/** Egy jogviszony minden papírja, időrendben, a legfrissebbel elöl. */
export function jogviszonyDokumentumai(jogviszony: TarJogviszony): Dokumentum[] {
  const sorok: Dokumentum[] = [];
  const kozos = { jogviszonyId: jogviszony.id, jogviszonyCimke: jogviszony.cimke };

  for (const szerzodes of jogviszony.szerzodesek) {
    const vegleges = szerzodes.allapot === "veglegesitve";
    sorok.push({
      ...kozos,
      kulcs: `szerzodes:${szerzodes.id}`,
      fajta: "szerzodes",
      cim: szerzodes.megnevezes,
      reszlet: vegleges
        ? "Aláírásra kész szöveg, a véglegesítéskori állapotban."
        : "Tervezet: a modulok és a paraméterek még változtathatók.",
      datum: szerzodes.veglegesitve ?? szerzodes.letrehozva,
      kiadott: vegleges,
      allapotCimke: vegleges ? "véglegesítve" : "tervezet",
      megnyitas: `/szerzodesek/${szerzodes.id}`,
      letoltes: `/szerzodesek/${szerzodes.id}/letoltes`,
    });
  }

  for (const jegyzokonyv of jogviszony.jegyzokonyvek) {
    const vegleges = jegyzokonyv.allapot === "veglegesitve";
    sorok.push({
      ...kozos,
      kulcs: `jegyzokonyv:${jegyzokonyv.id}`,
      fajta: "jegyzokonyv",
      cim: jegyzokonyv.fajtaNeve,
      reszlet: `Felvéve ${datum(jegyzokonyv.idopont)}.`,
      datum: jegyzokonyv.veglegesitve ?? jegyzokonyv.idopont,
      kiadott: vegleges,
      allapotCimke: vegleges ? "véglegesítve" : "tervezet",
      megnyitas: `/jegyzokonyvek/${jegyzokonyv.id}`,
      letoltes: `/jegyzokonyvek/${jegyzokonyv.id}/letoltes`,
    });
  }

  for (const igazolas of jogviszony.igazolasok) {
    sorok.push({
      ...kozos,
      kulcs: `igazolas:${igazolas.id}`,
      fajta: "igazolas",
      cim: `${igazolas.berloNev} · ${igazolas.idoszakCimke}`,
      reszlet: `Igazolt befizetés: ${forint(igazolas.osszegFt)}.`,
      datum: igazolas.kiallitva,
      kiadott: true,
      allapotCimke: "kiállítva",
      letoltes: `/igazolasok/${igazolas.id}/letoltes`,
    });
  }

  for (const elszamolas of jogviszony.elszamolasok) {
    const kiadott = elszamolas.allapot !== "tervezet";
    sorok.push({
      ...kozos,
      kulcs: `elszamolas:${elszamolas.id}`,
      fajta: "elszamolas",
      cim: `${datum(elszamolas.idoszakKezdete)} – ${datum(elszamolas.idoszakVege)}`,
      reszlet: `Végösszeg: ${forint(elszamolas.osszegFt)}.`,
      datum: elszamolas.kiadva ?? elszamolas.idoszakVege,
      kiadott,
      allapotCimke: ELSZAMOLAS_ALLAPOT[elszamolas.allapot] ?? elszamolas.allapot,
      letoltes: kiadott ? `/elszamolasok/${elszamolas.id}/letoltes` : undefined,
    });
  }

  return sorok;
}

export function dokumentumtar(jogviszonyok: TarJogviszony[]): Dokumentum[] {
  return jogviszonyok
    .flatMap(jogviszonyDokumentumai)
    .sort((a, b) => b.datum.getTime() - a.datum.getTime());
}

/** A bérlő csak a kiadott okiratokat látja, és szerkesztő oldalt nem nyit. */
export function berloDokumentumai(dokumentumok: Dokumentum[]): Dokumentum[] {
  return dokumentumok
    .filter((sor) => sor.kiadott)
    .map((sor) => ({ ...sor, megnyitas: undefined }));
}

export function fajtankent(
  dokumentumok: Dokumentum[],
): { fajta: DokumentumFajta; dokumentumok: Dokumentum[] }[] {
  const sorrend: DokumentumFajta[] = ["szerzodes", "jegyzokonyv", "elszamolas", "igazolas"];
  return sorrend
    .map((fajta) => ({
      fajta,
      dokumentumok: dokumentumok.filter((sor) => sor.fajta === fajta),
    }))
    .filter((csoport) => csoport.dokumentumok.length > 0);
}

export type IratTetel = {
  megnevezes: string;
  mennyiseg: number | null;
  mertekegyseg: string | null;
  reszletezes: string;
  osszegFt: number;
};

export type ElszamolasIrat = {
  ingatlanMegnevezes: string;
  ingatlanCim: string;
  berlokNeve: string;
  idoszakKezdete: Date;
  idoszakVege: Date;
  tetelek: IratTetel[];
  osszegFt: number;
};

function mennyisegSzoveg(tetel: IratTetel): string {
  if (tetel.mennyiseg === null) return "";
  const szam = simaSzokoz(
    new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 2 }).format(tetel.mennyiseg),
  );
  const egyseg = tetel.mertekegyseg ? ` ${tetel.mertekegyseg}` : "";
  return ` (${szam}${egyseg})`;
}

/**
 * Az elszámolás sima szövegként, hogy a bérlő el tudja tenni és össze tudja adni.
 * A végösszeg a kerekített tételek összege, ahogy a számításban is.
 */
export function elszamolasSzovege(irat: ElszamolasIrat): string {
  const sorok: string[] = [
    "REZSIELSZÁMOLÁS",
    "",
    `Bérlemény: ${irat.ingatlanMegnevezes}, ${irat.ingatlanCim}`,
    `Bérlő: ${irat.berlokNeve}`,
    `Időszak: ${datum(irat.idoszakKezdete)} – ${datum(irat.idoszakVege)}`,
    "",
    "TÉTELEK",
    "",
  ];

  for (const tetel of irat.tetelek) {
    sorok.push(
      `${tetel.megnevezes}${mennyisegSzoveg(tetel)}: ${simaSzokoz(forint(tetel.osszegFt))}`,
      `    ${tetel.reszletezes}`,
      "",
    );
  }

  sorok.push(
    `Összesen: ${simaSzokoz(forint(irat.osszegFt))}`,
    "",
    "A végösszeg a fenti, forintra kerekített tételek összege. Ha bármelyik sor nem stimmel,",
    "az alkalmazásban vitatható, és a bérbeadó látja, melyik tételről van szó.",
  );

  return sorok.join("\n");
}
