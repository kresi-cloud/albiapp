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

import { uzenet, type Uzenet } from "./nyelv";
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

export const TERULETEK: Terulet[] = [
  "epulet",
  "kozponti_berendezes",
  "kozos_terulet",
  "burkolat",
  "nyilaszaro",
  "berendezes",
  "haztartasi_gep",
  "egyeb",
];

export const OKOK: Ok[] = ["elhasznalodas", "karokozas", "ismeretlen"];

export const SURGOSSEGEK: HibaSurgosseg[] = ["veszhelyzet", "surgos", "normal"];

/**
 * A feliratok a szótárban vannak, mert a bérlő angolul is olvashatja őket. A
 * domain csak a kulcsot mondja meg; a szöveg egy helyen él.
 */
export function teruletNeve(terulet: Terulet): Uzenet {
  return uzenet(`hiba.terulet.${terulet}`);
}

export function okNeve(ok: Ok): Uzenet {
  return uzenet(`hiba.ok.${ok}`);
}

export function surgossegNeve(surgosseg: HibaSurgosseg): Uzenet {
  return uzenet(`hiba.surgosseg.${surgosseg}`);
}

export function surgossegLeirasa(surgosseg: HibaSurgosseg): Uzenet {
  return uzenet(`hiba.surgosseg_leiras.${surgosseg}`);
}

export function allapotNeve(allapot: HibaAllapot): Uzenet {
  return uzenet(`hiba.allapot.${allapot}`);
}

export function viseloNeve(fel: ViseloFel): Uzenet {
  return uzenet(`hiba.viselo.${fel}`);
}

export function lepesCimke(allapot: HibaAllapot): Uzenet {
  return uzenet(`hiba.lepes.${allapot}`);
}

/** Veszélyhelyzetnél a bejelentés önmagában kevés: ezt kell addig is tenni. */
export const VESZELYHELYZETI_TEENDOK: Uzenet[] = [
  uzenet("hiba.veszely.gaz"),
  uzenet("hiba.veszely.viz"),
  uzenet("hiba.veszely.aram"),
  uzenet("hiba.veszely.telefon"),
];

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

export type Javaslat = {
  fel: ViseloFel | null;
  indoklas: Uzenet;
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
    return { fel: "berlo", indoklas: uzenet("hiba.javaslat.karokozas") };
  }

  if (terulet === "epulet" || terulet === "kozponti_berendezes" || terulet === "kozos_terulet") {
    return { fel: "berbeado", indoklas: uzenet("hiba.javaslat.berbeadoi") };
  }

  if (ok === "ismeretlen") {
    return { fel: null, indoklas: uzenet("hiba.javaslat.ismeretlen") };
  }

  return { fel: "megosztott", indoklas: uzenet("hiba.javaslat.megosztott") };
}

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
        cim: uzenet("teendo.hiba.megerosites"),
        leiras: uzenet("teendo.hiba.elharitva", { targy: hiba.targy }),
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
          ? uzenet("teendo.hiba.uj", { targy: hiba.targy })
          : uzenet("teendo.hiba.nyitott", { targy: hiba.targy }),
      leiras: uzenet("teendo.hiba.allapotsor", {
        surgosseg: surgossegNeve(hiba.surgosseg),
        allapot: allapotNeve(hiba.allapot),
      }),
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
