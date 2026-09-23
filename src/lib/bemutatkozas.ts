/**
 * A bemutatkozó oldal adatbázis-oldala.
 *
 * Itt dől el, melyik értékelés jut el egyáltalán a laphoz. A vakság szabálya
 * ugyanaz, mint az értékelések lapján, és ugyanúgy a kiszolgálón érvényesül: a
 * rejtett értékelést nem elrejtve adjuk át, hanem be sem töltjük a nézetbe.
 * Egy elrejtett, de betöltött szöveg ott állna a lap forrásában.
 */

import { type Bemutatkozo } from "@/domain/bemutatkozas";
import { ablakKezdete, felfedve, type ErtekelesAdat, type Paros } from "@/domain/ertekeles";
import { prisma } from "@/lib/db";

type Sor = {
  szerzoId: string;
  alanyId: string;
  irany: string;
  szoveg: string;
  letrehozva: Date;
  pontok: { szempont: string; pont: number }[];
};

function adatta(sor: Sor): ErtekelesAdat {
  return {
    szerzoId: sor.szerzoId,
    alanyId: sor.alanyId,
    irany: sor.irany === "berbeadorol" ? "berbeadorol" : "berlorol",
    szoveg: sor.szoveg,
    pontok: sor.pontok.map((pont) => ({
      szempont: pont.szempont,
      pont: pont.pont,
    })),
    letrehozva: sor.letrehozva,
  };
}

/**
 * Egy felhasználó bemutatkozó oldala, vagy null, ha nincs ilyen felhasználó.
 *
 * A jogosultságot **nem** itt ellenőrizzük, hanem a hívó lapon
 * (`lathatja`): ez a függvény azt adja vissza, ami az oldalon állhat, és a lap
 * dönti el, megnyithatja-e valaki.
 */
export async function bemutatkozoLapja(
  felhasznaloId: string,
  ma: Date,
): Promise<Bemutatkozo | null> {
  const felhasznalo = await prisma.felhasznalo.findUnique({
    where: { id: felhasznaloId },
    select: { id: true, nev: true, szerep: true, bemutatkozas: true },
  });
  if (!felhasznalo) return null;

  // A róla szóló értékelések mellé a jogviszony összes értékelése is kell: a
  // felfedés a **párostól** függ, nem magától a sorótól.
  const rola = await prisma.ertekeles.findMany({
    where: { alanyId: felhasznaloId },
    include: {
      pontok: true,
      jogviszony: {
        select: {
          vege: true,
          ertekelesAblak: true,
          ertekelesek: { include: { pontok: true } },
        },
      },
    },
    orderBy: [{ letrehozva: "desc" }, { id: "desc" }],
  });

  const lathatoak = rola
    .filter((sor) => {
      const parja =
        sor.jogviszony.ertekelesek.find(
          (masik) =>
            masik.szerzoId === felhasznaloId && masik.alanyId === sor.szerzoId,
        ) ?? null;
      const paros: Paros = {
        sajat: parja === null ? null : adatta(parja),
        masike: adatta(sor),
      };
      // Az ablak kezdete itt sem a beírt kiköltözési nap: a lezáráskor
      // eltárolt kezdet, ugyanúgy, mint az értékelések lapján. Enélkül egy
      // visszakeltezett lezárás ezen a lapon fedné fel a rejtett szöveget,
      // miközben a másik lapon még rejtve marad.
      const kezdet = ablakKezdete(sor.jogviszony.vege, sor.jogviszony.ertekelesAblak);
      return felfedve(paros, kezdet, ma);
    })
    .map(adatta);

  return {
    felhasznaloId: felhasznalo.id,
    nev: felhasznalo.nev,
    szerep: felhasznalo.szerep === "berlo" ? "berlo" : "berbeado",
    bemutatkozas: felhasznalo.bemutatkozas,
    ertekelesek: lathatoak,
  };
}

/** A saját bemutatkozó szöveg mentése. Csak a sajátját írhatja bárki. */
export async function bemutatkozastMent(
  felhasznaloId: string,
  szoveg: string,
): Promise<void> {
  await prisma.felhasznalo.update({
    where: { id: felhasznaloId },
    data: { bemutatkozas: szoveg.trim() },
  });
}

export type AdminSor = {
  id: string;
  nev: string;
  szerep: "berbeado" | "berlo";
  /** Hány látható értékelés szól róla. A rejtett ebben sem szerepel. */
  ertekelesekSzama: number;
};

/**
 * Az üzemeltetői lista: kinek van bemutatkozó oldala.
 *
 * A darabszám itt is csak a felfedett értékeléseket számolja. A rendszergazda
 * hozzáfér az adatbázishoz, tehát ez nem titkosítás — de a felület ne az az
 * egy hely legyen, ahol a vakság ígérete megtörik.
 */
export async function bemutatkozoLista(ma: Date): Promise<AdminSor[]> {
  const felhasznalok = await prisma.felhasznalo.findMany({
    select: { id: true, nev: true, szerep: true },
    orderBy: [{ szerep: "asc" }, { nev: "asc" }, { id: "asc" }],
  });

  const sorok: AdminSor[] = [];
  for (const felhasznalo of felhasznalok) {
    const lap = await bemutatkozoLapja(felhasznalo.id, ma);
    sorok.push({
      id: felhasznalo.id,
      nev: felhasznalo.nev,
      szerep: felhasznalo.szerep === "berlo" ? "berlo" : "berbeado",
      ertekelesekSzama: lap?.ertekelesek.length ?? 0,
    });
  }
  return sorok;
}
