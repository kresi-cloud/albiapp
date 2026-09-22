/**
 * Szolgáltatói látogatás.
 *
 * Kéményseprő, mérőóra-leolvasó, szerelő, hitelesítés, érdeklődő. Eddig ez
 * SMS-ben ment, és épp az veszett el belőle, ami utólag számít: ki mit vállalt.
 *
 * A megválaszolandó kérdés nem az, hogy mikor jön a szerelő — azt a szolgáltató
 * mondja meg —, hanem hogy **ki engedi be**. Ezért a látogatásnak nem
 * „elfogadva" és „elutasítva" állapota van, hanem az, hogy a bejutás módja
 * tisztázott-e.
 *
 * Kétoldali, ugyanúgy, mint a befizetés, a fénykép és az előfizetés: az egyik
 * fél bejelenti, a bérlő a saját adatával mondja meg, mi lesz. Amíg nem mondta,
 * nem tudjuk, és ezt ki is mondjuk, ahelyett hogy megtippelnénk.
 *
 * A modul tiszta: adatot kap, állapotot és teendőt ad vissza.
 */

import { uzenet, type Uzenet } from "./nyelv";
import { napEleje, napKulonbseg } from "./penz";
import type { Teendo } from "./teendok";

export const FAJTAK = [
  "kemenysepro",
  "meroora",
  "javitas",
  "mutatas",
  "egyeb",
] as const;
export type Fajta = (typeof FAJTAK)[number];

export const VALASZOK = [
  "itthon_leszek",
  "kulccsal_beengedheto",
  "nem_jo_idopont",
] as const;
export type Valasz = (typeof VALASZOK)[number];

export type LatogatasValasz = {
  berloId: string;
  berloNeve: string;
  valasz: Valasz;
  indoklas: string | null;
};

export type Latogatas = {
  id: string;
  jogviszonyId: string;
  fajta: Fajta;
  megnevezes: string;
  szolgaltato: string | null;
  nap: Date;
  idoablakTol: string | null;
  idoablakIg: string | null;
  lemondva: Date | null;
  /** Akiktől választ várunk: csak az, akinek van fiókja. */
  varhatoValaszolok: { id: string; nev: string }[];
  valaszok: LatogatasValasz[];
};

/**
 * A látogatás állapota.
 *
 * - `lemondva` — a bejelentő visszavonta.
 * - `idopont_gond` — valamelyik bérlőnek nem jó; új időpont kell.
 * - `varakozik` — még nem nyilatkozott mindenki, akitől várunk.
 * - `itthon_lesz` — lesz otthon valaki: a bejutás nem kérdés.
 * - `kulccsal` — senki nem lesz otthon, de a bejutáshoz hozzájárultak.
 * - `elmult` — a nap elmúlt; ami eddig nem dőlt el, már nem fog.
 */
export type Allapot =
  | "lemondva"
  | "elmult"
  | "idopont_gond"
  | "varakozik"
  | "itthon_lesz"
  | "kulccsal";

/**
 * Az állapot sorrendje szándékos. A lemondás és az elmúlt nap mindent felülír,
 * mert azon már nincs mit tenni. Utána az időpontgond jön, még a várakozás
 * előtt: **egy kifogás egymagában is dönt**, mert a lakótárs nem szavazhatja le
 * azt, akinek nem jó — ugyanaz az elv, mint az előfizetés jóváhagyásánál.
 */
export function allapot(latogatas: Latogatas, ma: Date): Allapot {
  if (latogatas.lemondva) return "lemondva";
  if (napKulonbseg(ma, latogatas.nap) < 0) return "elmult";

  if (latogatas.valaszok.some((sor) => sor.valasz === "nem_jo_idopont")) {
    return "idopont_gond";
  }

  // Fiók nélküli bérlőt nem lehet megkérdezni; akit meg lehet, attól várunk.
  const valaszolt = new Set(latogatas.valaszok.map((sor) => sor.berloId));
  const hianyzik = latogatas.varhatoValaszolok.filter((sor) => !valaszolt.has(sor.id));
  if (hianyzik.length > 0) return "varakozik";

  if (latogatas.valaszok.some((sor) => sor.valasz === "itthon_leszek")) {
    return "itthon_lesz";
  }
  return "kulccsal";
}

/** Akiktől még várunk választ. A felület ezt írja ki, nem tippel. */
export function hianyzoValaszolok(latogatas: Latogatas): { id: string; nev: string }[] {
  const valaszolt = new Set(latogatas.valaszok.map((sor) => sor.berloId));
  return latogatas.varhatoValaszolok.filter((sor) => !valaszolt.has(sor.id));
}

/**
 * Egy mondat arról, mi lesz. Nem állapotnév, hanem az, ami a bérbeadót
 * érdekli: bejut-e a szerelő, és ha igen, hogyan.
 */
export function allapotMondata(latogatas: Latogatas, ma: Date): Uzenet {
  const mostani = allapot(latogatas, ma);

  if (mostani === "idopont_gond") {
    const kifogas = latogatas.valaszok.find((sor) => sor.valasz === "nem_jo_idopont");
    return uzenet("latogatas.allapot.idopont_gond", { nev: kifogas?.berloNeve ?? "" });
  }
  if (mostani === "varakozik") {
    const hianyzik = hianyzoValaszolok(latogatas);
    return uzenet("latogatas.allapot.varakozik", {
      nev: hianyzik.map((sor) => sor.nev).join(", "),
    });
  }
  if (mostani === "itthon_lesz") {
    const itthon = latogatas.valaszok.filter((sor) => sor.valasz === "itthon_leszek");
    return uzenet("latogatas.allapot.itthon_lesz", {
      nev: itthon.map((sor) => sor.berloNeve).join(", "),
    });
  }
  if (mostani === "kulccsal") return uzenet("latogatas.allapot.kulccsal");
  if (mostani === "lemondva") return uzenet("latogatas.allapot.lemondva");
  return uzenet("latogatas.allapot.elmult");
}

/**
 * Az időablak emberi alakja. Nem formázunk: a szolgáltató által mondott alakot
 * adjuk vissza, mert azt fogja a bérlő az SMS-sel összevetni.
 */
export function idoablak(latogatas: Latogatas): Uzenet | null {
  const { idoablakTol, idoablakIg } = latogatas;
  if (idoablakTol && idoablakIg) {
    return uzenet("latogatas.idoablak", { tol: idoablakTol, ig: idoablakIg });
  }
  if (idoablakTol) return uzenet("latogatas.idoablak_tol", { tol: idoablakTol });
  return null;
}

/**
 * Teendők a látogatásokból.
 *
 * A bérlőnek akkor van teendője, ha még nem nyilatkozott: nélküle a bérbeadó
 * nem tudja, bejut-e a szerelő. A bérbeadónak akkor, ha valakinek nem jó az
 * időpont — onnantól új időpont kell —, és akkor is, ha a nap közeledik, de még
 * nem válaszolt mindenki: a telefonálás az ő dolga, nem a rendszeré.
 *
 * Származtatott teendő: eltűnik, amint a látogatás eldőlt vagy elmúlt.
 */
export function latogatasokbolTeendok(
  latogatasok: Latogatas[],
  ma: Date,
  belepettBerloId?: string,
): Teendo[] {
  const teendok: Teendo[] = [];

  for (const latogatas of latogatasok) {
    const mostani = allapot(latogatas, ma);
    const hivatkozas = `/latogatasok?jogviszony=${latogatas.jogviszonyId}`;
    const berloiHivatkozas = `/berlo/latogatasok?jogviszony=${latogatas.jogviszonyId}`;
    const adatok = { megnevezes: latogatas.megnevezes };

    if (mostani === "varakozik") {
      const hianyzik = hianyzoValaszolok(latogatas);
      // A bérlő csak a saját nyilatkozatáról kap teendőt: a lakótársét nem ő
      // adja meg, tehát nem is tud vele mit kezdeni.
      if (belepettBerloId && hianyzik.some((sor) => sor.id === belepettBerloId)) {
        teendok.push({
          kulcs: `latogatas:${latogatas.id}:valasz:${belepettBerloId}`,
          cimzett: "berlo",
          tipus: "latogatas_valasz",
          cim: uzenet("teendo.latogatas.valasz", adatok),
          leiras: uzenet("teendo.latogatas.varakozik"),
          esedekesseg: napEleje(latogatas.nap),
          hivatkozas: berloiHivatkozas,
        });
      }

      teendok.push({
        kulcs: `latogatas:${latogatas.id}:surgetes`,
        cimzett: "berbeado",
        tipus: "latogatas_varakozik",
        cim: uzenet("teendo.latogatas.surgetes", adatok),
        leiras: uzenet("teendo.latogatas.kire_var", {
          nev: hianyzik.map((sor) => sor.nev).join(", "),
        }),
        esedekesseg: napEleje(latogatas.nap),
        hivatkozas,
      });
      continue;
    }

    if (mostani === "idopont_gond") {
      teendok.push({
        kulcs: `latogatas:${latogatas.id}:uj_idopont`,
        cimzett: "berbeado",
        tipus: "latogatas_idopont",
        cim: uzenet("teendo.latogatas.uj_idopont", adatok),
        leiras: uzenet("teendo.latogatas.kifogas"),
        esedekesseg: napEleje(latogatas.nap),
        hivatkozas,
      });
    }
  }

  return teendok;
}

export type Kifogas = { mezo: string; uzenet: Uzenet };

/**
 * A bejelentés ellenőrzése.
 *
 * Kifogás az, ami nélkül az adat értelmetlen: megnevezés és nap. Az időablak
 * nem kötelező — sok szolgáltató nem is ad meg —, de ha megadják, legyen
 * értelmes sorrendben, különben a bérlő egy olyan ablakot lát, ami visszafelé
 * megy.
 */
export function bejelentestEllenoriz(bemenet: {
  megnevezes: string;
  nap: Date | null;
  idoablakTol: string;
  idoablakIg: string;
}): Kifogas[] {
  const kifogasok: Kifogas[] = [];

  if (bemenet.megnevezes.trim() === "") {
    kifogasok.push({ mezo: "megnevezes", uzenet: uzenet("latogatas.hiba.megnevezes") });
  }
  if (!bemenet.nap || Number.isNaN(bemenet.nap.getTime())) {
    kifogasok.push({ mezo: "nap", uzenet: uzenet("latogatas.hiba.nap") });
  }

  const ora = /^\d{1,2}:\d{2}$/;
  for (const [mezo, ertek] of [
    ["idoablakTol", bemenet.idoablakTol],
    ["idoablakIg", bemenet.idoablakIg],
  ] as const) {
    if (ertek.trim() !== "" && !ora.test(ertek.trim())) {
      kifogasok.push({ mezo, uzenet: uzenet("latogatas.hiba.ora") });
    }
  }

  const tol = bemenet.idoablakTol.trim();
  const ig = bemenet.idoablakIg.trim();
  if (ora.test(tol) && ora.test(ig) && percben(ig) <= percben(tol)) {
    kifogasok.push({ mezo: "idoablakIg", uzenet: uzenet("latogatas.hiba.sorrend") });
  }

  return kifogasok;
}

function percben(ora: string): number {
  const [oraResz, percResz] = ora.split(":");
  return Number(oraResz) * 60 + Number(percResz);
}

/**
 * Rendezés: ami előbb jön, az van elöl, a lemondott és az elmúlt pedig hátul.
 * Egy múlt heti kéményseprő nem áll a jövő hetei elé csak azért, mert később
 * jelentették be.
 */
export function latogatasokatRendez<T extends Latogatas>(latogatasok: T[], ma: Date): T[] {
  const rang = (latogatas: T) => {
    const mostani = allapot(latogatas, ma);
    return mostani === "lemondva" || mostani === "elmult" ? 1 : 0;
  };

  return [...latogatasok].sort((a, b) => {
    const kulonbseg = rang(a) - rang(b);
    if (kulonbseg !== 0) return kulonbseg;
    return a.nap.getTime() - b.nap.getTime();
  });
}
