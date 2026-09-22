/**
 * Hibabejelentés.
 *
 * A bérlő jelzi, mi romlott el; a bérbeadó végigviszi. Két dolgot csinál az
 * alkalmazás, amit egy üzenetváltás nem tud: határidőt számol a sürgősségből,
 * és javaslatot tesz a költségviselőre a szerződés karbantartási pontja alapján.
 *
 * A javaslat nem döntés. Ha nem derül ki, mitől romlott el, nem tippelünk:
 * ugyanaz az elv, mint a be nem sorolható befizetésnél.
 */

import { napEleje, napKulonbseg } from "./penz";
import type { Teendo } from "./teendok";

export type Terulet =
  | "epulet"
  | "kozponti_berendezes"
  | "kozos_terulet"
  | "burkolat"
  | "nyilaszaro"
  | "berendezes"
  | "haztartasi_gep"
  | "egyeb";

export type Ok = "elhasznalodas" | "karokozas" | "ismeretlen";

export type HibaSurgosseg = "veszhelyzet" | "surgos" | "normal";

export type HibaAllapot =
  | "bejelentve"
  | "atvette"
  | "folyamatban"
  | "elharitva"
  | "lezarva"
  | "elutasitva";

export type ViseloFel = "berbeado" | "berlo" | "megosztott";

export const TERULET_NEVE: Record<Terulet, string> = {
  epulet: "Épületszerkezet (fal, tető, csatorna, erkély)",
  kozponti_berendezes: "Központi berendezés (fűtés, víz-, gáz-, villanyhálózat)",
  kozos_terulet: "Közös helyiség (lépcsőház, kapu, felvonó)",
  burkolat: "Burkolat (padló, csempe, festés)",
  nyilaszaro: "Nyílászáró (ajtó, ablak, zár, redőny)",
  berendezes: "Lakásberendezés (bútor, szaniter, csaptelep)",
  haztartasi_gep: "Háztartási gép (hűtő, mosógép, sütő, kazán)",
  egyeb: "Egyéb",
};

export const OK_NEVE: Record<Ok, string> = {
  elhasznalodas: "Magától romlott el, vagy elhasználódott",
  karokozas: "Mi okoztuk",
  ismeretlen: "Nem tudom, mitől",
};

export const SURGOSSEG_NEVE: Record<HibaSurgosseg, string> = {
  veszhelyzet: "Veszélyhelyzet",
  surgos: "Sürgős",
  normal: "Ráér",
};

export const SURGOSSEG_LEIRAS: Record<HibaSurgosseg, string> = {
  veszhelyzet:
    "Csőtörés, gázszag, égett szag, áramütés veszélye, télen leállt fűtés: azonnal intézkedni kell.",
  surgos: "Használhatatlan a lakás egy része: nincs melegvíz, nem zár az ajtó, nem működik a hűtő.",
  normal: "Zavaró, de kibírja: csepegő csap, beragadt redőny, repedt csempe.",
};

export const ALLAPOT_NEVE: Record<HibaAllapot, string> = {
  bejelentve: "Bejelentve",
  atvette: "A bérbeadó átvette",
  folyamatban: "Javítás folyamatban",
  elharitva: "Elhárítva, a bérlő megerősítésére vár",
  lezarva: "Lezárva",
  elutasitva: "Elutasítva",
};

/** A nyitott állapotok: ezekre még vár valaki. */
export const NYITOTT: HibaAllapot[] = ["bejelentve", "atvette", "folyamatban", "elharitva"];

export function nyitott(allapot: HibaAllapot): boolean {
  return NYITOTT.includes(allapot);
}

/**
 * Az alkalmazás alapértelmezett válaszhatárideje. Nem jogszabályi határidő:
 * magánszemélyek bérletére nincs törvényi óraszám, ezt a terméket használó
 * felek közti elvárásnak szánjuk, és a felület ki is mondja.
 */
export const VALASZ_NAP: Record<HibaSurgosseg, number> = {
  veszhelyzet: 0,
  surgos: 3,
  normal: 8,
};

export function valaszHatarido(surgosseg: HibaSurgosseg, bejelentve: Date): Date {
  const nap = napEleje(bejelentve);
  return new Date(nap.getTime() + VALASZ_NAP[surgosseg] * 24 * 60 * 60 * 1000);
}

/** Veszélyhelyzetnél a bejelentés önmagában kevés: ezt kell addig is tenni. */
export const VESZELYHELYZETI_TEENDOK = [
  "Gázszag esetén ne kapcsolj villanyt, nyiss ablakot, zárd el a gázcsapot, és hívd a 112-t.",
  "Csőtörésnél zárd el a lakás vízfőcsapját, és ha a víz villanyszerelvényhez ér, kapcsold le a kismegszakítót.",
  "Égett szagnál vagy szikrázásnál kapcsold le a kismegszakítót, és ne használd az érintett konnektort.",
  "Telefonon is szólj a bérbeadónak: a bejelentés magától nem csörög.",
];

export type Javaslat = {
  fel: ViseloFel | null;
  indoklas: string;
};

/**
 * Javaslat a költségviselőre, a szerződés karbantartási pontja és a
 * lakástörvény (1993. évi LXXVIII. tv. 13. §) alapján:
 *
 * - az épület, a központi berendezések és a közös helyiségek a bérbeadóé,
 * - a bérlő vagy az általa beengedett személy okozta kár a bérlőé,
 * - a lakáson belül a karbantartás a bérlőé, a pótlás és a csere a bérbeadóé.
 */
export function koltsegJavaslat(terulet: Terulet, ok: Ok): Javaslat {
  if (ok === "karokozas") {
    return {
      fel: "berlo",
      indoklas:
        "A bérlő vagy az általa beengedett személy okozta kár helyreállítása a szerződés " +
        "karbantartási pontja szerint a bérlőt terheli.",
    };
  }

  if (terulet === "epulet" || terulet === "kozponti_berendezes" || terulet === "kozos_terulet") {
    return {
      fel: "berbeado",
      indoklas:
        "Épületszerkezeti, központi berendezési vagy közös helyiséget érintő hiba. A lakástörvény " +
        "13. § (2) bekezdése és a szerződés szerint ez a bérbeadó dolga, függetlenül attól, hogy " +
        "mitől romlott el.",
    };
  }

  if (ok === "ismeretlen") {
    return {
      fel: null,
      indoklas:
        "Amíg nem derül ki, mitől romlott el, nem tippelek. Nézzétek meg együtt, és utána mondd ki, " +
        "kit terhel a költség.",
    };
  }

  return {
    fel: "megosztott",
    indoklas:
      "Elhasználódás a lakáson belül: a rendes használattal járó kisebb karbantartás a bérlőé, a " +
      "pótlás és a csere a bérbeadóé (lakástörvény 13. § (1), és a szerződés karbantartási pontja).",
  };
}

export const VISELO_NEVE: Record<ViseloFel, string> = {
  berbeado: "A bérbeadót terheli",
  berlo: "A bérlőt terheli",
  megosztott: "Megosztva: karbantartás a bérlőé, csere a bérbeadóé",
};

/**
 * Ki milyen állapotba viheti a bejelentést. A bérlő nem mondhatja elhárítottnak,
 * a bérbeadó nem zárhatja le a bérlő megerősítése nélkül: a hiba lezárása is
 * kétoldali, mint a befizetés egyeztetése.
 */
export function lepesek(allapot: HibaAllapot, szerep: "berbeado" | "berlo"): HibaAllapot[] {
  if (szerep === "berbeado") {
    switch (allapot) {
      case "bejelentve":
        return ["atvette", "folyamatban", "elutasitva"];
      case "atvette":
        return ["folyamatban", "elharitva", "elutasitva"];
      case "folyamatban":
        return ["elharitva", "elutasitva"];
      case "elharitva":
        return ["folyamatban"];
      default:
        return [];
    }
  }

  // A bérlő csak a saját oldalán dönthet: elfogadja az elhárítást, vagy visszanyitja.
  if (allapot === "elharitva") return ["lezarva", "folyamatban"];
  if (allapot === "elutasitva") return ["folyamatban"];
  return [];
}

export function lepesLehetseges(
  allapot: HibaAllapot,
  cel: HibaAllapot,
  szerep: "berbeado" | "berlo",
): boolean {
  return lepesek(allapot, szerep).includes(cel);
}

export const LEPES_CIMKE: Record<HibaAllapot, string> = {
  bejelentve: "Visszaállítom bejelentettre",
  atvette: "Átvettem",
  folyamatban: "Javítás elindult",
  elharitva: "Elhárítottam",
  lezarva: "Rendben van, lezárom",
  elutasitva: "Elutasítom",
};

export type HibaTeendohoz = {
  id: string;
  jogviszonyId: string;
  targy: string;
  surgosseg: HibaSurgosseg;
  allapot: HibaAllapot;
  bejelentve: Date;
};

/**
 * Nyitott hibából teendő lesz mindkét félnek: a bérbeadónak, amíg nem válaszolt
 * vagy nem hárította el, a bérlőnek, amíg meg nem erősítette az elhárítást.
 * Származtatott teendő: ha a hiba lezárul, magától eltűnik.
 */
export function hibakbolTeendok(hibak: HibaTeendohoz[]): Teendo[] {
  const teendok: Teendo[] = [];

  for (const hiba of hibak) {
    if (hiba.allapot === "elharitva") {
      teendok.push({
        kulcs: `hiba:${hiba.id}:berlo`,
        cimzett: "berlo",
        tipus: "hiba_megerosites",
        cim: "Erősítsd meg, hogy a hiba rendben van",
        leiras: `${hiba.targy}. A bérbeadó elhárítottnak jelölte.`,
        esedekesseg: valaszHatarido("normal", hiba.bejelentve),
        hivatkozas: `/berlo/hibak#${hiba.id}`,
      });
      continue;
    }

    if (!nyitott(hiba.allapot)) continue;

    teendok.push({
      kulcs: `hiba:${hiba.id}:berbeado`,
      cimzett: "berbeado",
      tipus: "hiba_nyitott",
      cim:
        hiba.allapot === "bejelentve"
          ? `Új hibabejelentés: ${hiba.targy}`
          : `Nyitott hiba: ${hiba.targy}`,
      leiras: `${SURGOSSEG_NEVE[hiba.surgosseg]} · ${ALLAPOT_NEVE[hiba.allapot]}`,
      esedekesseg: valaszHatarido(hiba.surgosseg, hiba.bejelentve),
      hivatkozas: `/hibak#${hiba.id}`,
    });
  }

  return teendok;
}

/** Hány napja vár a bejelentés, és lejárt-e a vállalt válaszidő. */
export function keses(
  surgosseg: HibaSurgosseg,
  bejelentve: Date,
  ma: Date,
): { napja: number; lejart: boolean } {
  const napja = napKulonbseg(bejelentve, ma);
  return { napja, lejart: napKulonbseg(valaszHatarido(surgosseg, bejelentve), ma) > 0 };
}
