/**
 * A vitás befizetéshez tartozó bizonylatok tárolása.
 *
 * Két szabály él itt, és egyik sem az űrlapból jön:
 *  - hogy melyik oldal bizonylatát töltöd fel, az a szerepedből következik,
 *  - és csak olyan előírásra fogadunk el bizonylatot, ami tényleg vitás.
 *
 * A második azért fontos, mert e nélkül bárki feltölthetne bármihez bármit, és
 * a "bizonylatot csak vitánál kérünk" ígéretből semmi nem maradna.
 */

import { oldalaEnnek, type Oldal } from "@/domain/bizonylat";
import { prisma } from "@/lib/db";
import { berloNezetei, jogviszonyNezetek } from "@/lib/lekerdezesek";

export type BizonylatNezet = {
  id: string;
  oldal: Oldal;
  fajlNev: string;
  meretBajt: number;
  feltoltve: Date;
  /** A belépett felhasználó töltötte-e fel: csak a sajátját törölheti. */
  sajat: boolean;
};

/**
 * Vitás-e az előírás, és hozzáfér-e a felhasználó. A `bizonylatKell` mezőt a
 * domain számolja; itt csak megkérdezzük, hogy ne két helyen dőljön el.
 */
export async function bizonylatKerheto(
  felhasznalo: { id: string; szerep: "berbeado" | "berlo" },
  eloirtTetelId: string,
): Promise<boolean> {
  const nezetek =
    felhasznalo.szerep === "berbeado"
      ? await jogviszonyNezetek(felhasznalo.id)
      : await berloNezetei(felhasznalo.id);

  return nezetek.some((nezet) =>
    nezet.egyeztetesek.some((sor) => sor.eloirtTetelId === eloirtTetelId && sor.bizonylatKell),
  );
}

/**
 * Több előírás bizonylatai egy lekérdezéssel, előírásonként csoportosítva. A
 * tartalmat nem olvassuk be: a listához a méret és a dátum elég.
 *
 * Azokat is betöltjük, amik már nem vitásak. Aki kikapcsolja a bizonylatkérést,
 * vagy rendezi a vitát, attól még ne tűnjön el csendben a fájl, amit a másik
 * fél feltöltött.
 */
export async function bizonylatokTetelekhez(
  eloirtTetelIdk: string[],
  felhasznaloId: string,
): Promise<Map<string, BizonylatNezet[]>> {
  const csoportok = new Map<string, BizonylatNezet[]>();
  if (eloirtTetelIdk.length === 0) return csoportok;

  const sorok = await prisma.bizonylat.findMany({
    where: { eloirtTetelId: { in: eloirtTetelIdk } },
    select: {
      id: true,
      eloirtTetelId: true,
      oldal: true,
      fajlNev: true,
      meretBajt: true,
      feltoltve: true,
      feltoltoId: true,
    },
    orderBy: { feltoltve: "asc" },
  });

  for (const sor of sorok) {
    const lista = csoportok.get(sor.eloirtTetelId) ?? [];
    lista.push({
      id: sor.id,
      oldal: sor.oldal as Oldal,
      fajlNev: sor.fajlNev,
      meretBajt: sor.meretBajt,
      feltoltve: sor.feltoltve,
      sajat: sor.feltoltoId === felhasznaloId,
    });
    csoportok.set(sor.eloirtTetelId, lista);
  }

  return csoportok;
}

/**
 * Feltöltés. Oldalanként egy bizonylat van: az újratöltés a régit váltja fel,
 * mert egy utalásnak egy bizonylata van, és a félrefotózottat ki kell tudni
 * cserélni.
 */
export async function bizonylatotMent(
  felhasznalo: { id: string; szerep: "berbeado" | "berlo" },
  eloirtTetelId: string,
  fajl: { nev: string; tipus: string; tartalom: Uint8Array<ArrayBuffer> },
): Promise<void> {
  const oldal = oldalaEnnek(felhasznalo.szerep);

  await prisma.bizonylat.upsert({
    where: { eloirtTetelId_oldal: { eloirtTetelId, oldal } },
    update: {
      feltoltoId: felhasznalo.id,
      fajlNev: fajl.nev,
      mimeTipus: fajl.tipus,
      meretBajt: fajl.tartalom.byteLength,
      tartalom: fajl.tartalom,
      feltoltve: new Date(),
    },
    create: {
      eloirtTetelId,
      oldal,
      feltoltoId: felhasznalo.id,
      fajlNev: fajl.nev,
      mimeTipus: fajl.tipus,
      meretBajt: fajl.tartalom.byteLength,
      tartalom: fajl.tartalom,
    },
  });
}

/** A saját bizonylat törlése. A másik félét senki nem törölheti. */
export async function bizonylatotTorol(
  felhasznaloId: string,
  bizonylatId: string,
): Promise<boolean> {
  const eredmeny = await prisma.bizonylat.deleteMany({
    where: { id: bizonylatId, feltoltoId: felhasznaloId },
  });
  return eredmeny.count > 0;
}

/**
 * Letöltéshez: a tartalom, de csak annak, akinek köze van az előíráshoz. A
 * jogosultságot itt is a jogviszonyból vezetjük le, nem abból, hogy valaki
 * ismeri a bizonylat azonosítóját.
 */
export async function bizonylatTartalma(
  felhasznalo: { id: string; szerep: "berbeado" | "berlo" },
  bizonylatId: string,
) {
  return prisma.bizonylat.findFirst({
    where: {
      id: bizonylatId,
      eloirtTetel: {
        jogviszony:
          felhasznalo.szerep === "berbeado"
            ? { ingatlan: { tulajdonosId: felhasznalo.id } }
            : { berlok: { some: { berloId: felhasznalo.id } } },
      },
    },
    select: { oldal: true, fajlNev: true, mimeTipus: true, tartalom: true },
  });
}
