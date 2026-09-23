/**
 * A bemutatkozó oldal: amit a felhasználó magáról ír, és ami róla kiderült.
 *
 * Az értékelés önmagában csak a jogviszony két résztvevőjének szól, és a
 * jogviszony lezárása után. A bemutatkozó oldal az első hely, ahol egy
 * felhasználóról **több** jogviszony értékelése áll egymás mellett — ezért két
 * dolgot köt ki, és mindkettő termékdöntés.
 *
 * **Csak a felfedett értékelés látszik, és csak az számít bele a darabszámba
 * is.** Ha a rejtett értékelés is beleszámítana, a szám elárulná, hogy a másik
 * fél már írt — abból pedig a vakság maradéka is elveszne: aki látja, hogy
 * „1 értékelés" áll a másik oldalán, az tudja, mihez kell igazodnia. A
 * darabszám ezért nem az összes értékelés száma, hanem a láthatóké.
 *
 * **Összevont pontszám nincs.** Ugyanaz az elv, mint az egy értékelésen belül
 * (`src/domain/ertekeles.ts`): a szempontokat nem mossuk egy számmá, mert az
 * mérésnek látszana. Szempontonként viszont van értelme az átlagnak, mert ott
 * ugyanazt a dolgot mondja több ember — és mellé mindig odaírjuk, hány
 * értékelésből jött, mert kettőnek az átlaga nem ugyanaz, mint tízé.
 */

import { type ErtekelesAdat, SZEMPONTOK, type Irany } from "./ertekeles";
import { uzenet, type Uzenet } from "./nyelv";

/** Melyik irány szól egy szerepről: a bérlőről szóló értékelés a „berlorol". */
export function iranya(szerep: "berbeado" | "berlo"): Irany {
  return szerep === "berlo" ? "berlorol" : "berbeadorol";
}

export type Bemutatkozo = {
  felhasznaloId: string;
  nev: string;
  szerep: "berbeado" | "berlo";
  /** Amit magáról írt. Üresen is oldal marad: az értékelések ettől még állnak. */
  bemutatkozas: string;
  /** **Csak a felfedett** értékelések. A rejtettek ide nem jutnak el. */
  ertekelesek: ErtekelesAdat[];
};

export type SzempontOsszesito = {
  szempont: string;
  /** A pontok átlaga egy tizedesre. Csak azokból, amikben ez a szempont megvan. */
  atlag: number;
  /** Hány értékelés adott erre a szempontra pontot. */
  darab: number;
};

/** Hány látható értékelés szól róla. Ennyi, nem több: a rejtett nem számít bele. */
export function ertekelesekSzama(bemutatkozo: Bemutatkozo): number {
  return bemutatkozo.ertekelesek.length;
}

/**
 * Szempontonkénti összesítés, a szerepéhez tartozó szempontok sorrendjében.
 *
 * Amire senki nem adott pontot, az kimarad: egy „nincs adat" sor a nullával
 * összetéveszthető lenne. A sorrend a szempontlistáé, nem a pontszámé, hogy a
 * két felhasználó lapja összevethető legyen.
 */
export function szempontonkent(bemutatkozo: Bemutatkozo): SzempontOsszesito[] {
  const szempontok = SZEMPONTOK[iranya(bemutatkozo.szerep)];

  return szempontok
    .map((szempont) => {
      const pontok = bemutatkozo.ertekelesek
        .map(
          (ertekeles) =>
            ertekeles.pontok.find((sor) => sor.szempont === szempont)?.pont,
        )
        .filter((pont): pont is number => pont !== undefined);

      return {
        szempont,
        darab: pontok.length,
        atlag:
          pontok.length === 0
            ? 0
            : Math.round(
                (pontok.reduce((a, b) => a + b, 0) / pontok.length) * 10,
              ) / 10,
      };
    })
    .filter((sor) => sor.darab > 0);
}

/**
 * Ki nézheti meg valakinek a bemutatkozó oldalát.
 *
 * Egyelőre csak ő maga és az üzemeltető. A lap **nem nyilvános**: hogy egy
 * bérlő megmutathatja-e a róla szóló értékelést egy leendő bérbeadónak,
 * termékdöntés és adatvédelmi kérdés egyszerre, és a tulajdonosé az ügyvédi
 * átnézéssel együtt. Amíg nem döntött, a szűkebb kör a helyes alapértelmezés:
 * egy tévedésből kiadott értékelést nem lehet visszavenni.
 */
export function lathatja(
  nezo: { id: string; rendszergazda: boolean },
  felhasznaloId: string,
): boolean {
  return nezo.id === felhasznaloId || nezo.rendszergazda;
}

/** A szempont átlagának mondata: az átlag mellett mindig ott a darabszám. */
export function atlagMondata(sor: SzempontOsszesito): Uzenet {
  return uzenet("bemutatkozas.atlag", { atlag: sor.atlag, darab: sor.darab });
}

/** Mit írunk ki, ha még nincs látható értékelés. */
export function nincsErtekelesMondata(sajat: boolean): Uzenet {
  return uzenet(
    sajat ? "bemutatkozas.nincs_sajat" : "bemutatkozas.nincs_masike",
  );
}
