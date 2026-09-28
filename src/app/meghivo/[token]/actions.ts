"use server";

import { redirect } from "next/navigation";
import {
  emailtNormalizal,
  jelszotEllenoriz,
  meghivoAllapota,
} from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { jelszoEgyezik, jelszotHashel } from "@/lib/jelszo";
import { munkamenetetIndit } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

/** A nevet visszaadjuk, hogy hibás jelszó után ne kelljen újra begépelni. */
export type RegisztracioEredmeny = {
  allapot: "ures" | "hiba";
  uzenet: string;
  hibak: string[];
  nev: string;
};

export async function meghivotElfogad(
  _elozo: RegisztracioEredmeny,
  urlap: FormData,
): Promise<RegisztracioEredmeny> {
  const { sz, u } = await szovegek();
  const token = String(urlap.get("token") ?? "");
  const nev = String(urlap.get("nev") ?? "").trim();
  const jelszo = String(urlap.get("jelszo") ?? "");

  const meghivo = await prisma.meghivo.findUnique({
    where: { token },
    include: { jogviszonyBerlo: true },
  });

  if (!meghivo || meghivoAllapota(meghivo, new Date()) !== "ervenyes") {
    return {
      allapot: "hiba",
      uzenet: sz("meghivo.hiba.ervenytelen"),
      hibak: [],
      nev,
    };
  }

  const email = emailtNormalizal(meghivo.email);
  const letezo = await prisma.felhasznalo.findUnique({ where: { email } });

  if (letezo) {
    // Meglévő fiókot a meghívó a fiók gazdája nélkül nem köthet a
    // jogviszonyhoz. A linket a bérbeadó is birtokolja, tehát maga az
    // elfogadás nem bizonyít semmit: enélkül a bérbeadó bárkinek a meglévő
    // fiókját hozzáköthetné a saját jogviszonyához. Ezért a **meglévő**
    // jelszót kérjük — a fiók gazdája a saját adatával mond igent, ugyanaz a
    // kétoldali elv, mint a befizetésnél vagy a fényképnél. Jelszót ez az út
    // továbbra sem ír felül, és újat sem állít be.
    if (!(await jelszoEgyezik(jelszo, letezo.jelszoHash))) {
      // A rossz jelszót számoljuk, és a meghívó elfogy tőle. A link a
      // bérbeadónál is megvan: korlát nélkül ez a mező a fiók gazdája elleni
      // jelszópróbálgató felület lenne.
      await prisma.meghivo.update({
        where: { id: meghivo.id },
        data: { rosszJelszo: { increment: 1 } },
      });
      return {
        allapot: "hiba",
        uzenet: sz("meghivo.hiba.megleve_jelszo"),
        hibak: [],
        nev,
      };
    }

    // És csak bérlői fiók ülhet bérlői helyre.
    //
    // A szerep azt dönti el, melyik alkalmazást látja a felhasználó: egy
    // bérbeadói fiók a bérlői helyen egyetlen bérlői lapot sem nyit meg,
    // tehát nem tud nyilatkozni se látogatásról, se előfizetésről, se
    // értékelésről — azok örökké „várakozik" állapotban maradnának, és a
    // másik fél ezt sehonnan nem tudná meg. A meghívó ettől még elhasználódna,
    // és a helyre újat sem lehetne készíteni. A legkönnyebben a bérbeadó
    // saját címére küldött meghívóval áll elő.
    if (letezo.szerep !== "berlo") {
      return {
        allapot: "hiba",
        uzenet: sz("meghivo.hiba.nem_berloi_fiok"),
        hibak: [],
        nev,
      };
    }

    // Letiltott fiókot sem kötünk a jogviszonyhoz: a `belepettFelhasznalo`
    // null-t adna rá, tehát az elfogadás után azonnal kilépne — a hely viszont
    // már foglalt lenne.
    if (letezo.letiltva) {
      return {
        allapot: "hiba",
        uzenet: sz("meghivo.hiba.letiltott_fiok"),
        hibak: [],
        nev,
      };
    }

    if (
      !(await helyetElfoglal(meghivo.id, meghivo.jogviszonyBerloId, letezo.id))
    ) {
      return {
        allapot: "hiba",
        uzenet: sz("meghivo.hiba.mar_ul_ott"),
        hibak: [],
        nev,
      };
    }

    await munkamenetetIndit(letezo.id);
    redirect("/berlo");
  }

  const ellenorzes = jelszotEllenoriz(jelszo, urlap.get("jelszoUjra"));
  const hibak = ellenorzes.map(u);
  if (nev === "") hibak.push(sz("meghivo.hiba.nev"));
  if (hibak.length > 0) {
    return { allapot: "hiba", uzenet: sz("meghivo.hiba.nem_kesz"), hibak, nev };
  }

  const jelszoHash = await jelszotHashel(jelszo);
  const berlo = await prisma.felhasznalo.create({
    data: { email, nev, jelszoHash, szerep: "berlo" },
  });

  if (
    !(await helyetElfoglal(
      meghivo.id,
      meghivo.jogviszonyBerloId,
      berlo.id,
      nev,
    ))
  ) {
    return {
      allapot: "hiba",
      uzenet: sz("meghivo.hiba.mar_ul_ott"),
      hibak: [],
      nev,
    };
  }

  await munkamenetetIndit(berlo.id);
  redirect("/berlo");
}

/**
 * A hely elfoglalása és a meghívó elhasználása, feltételes írással.
 *
 * Mindkét írás `updateMany`, a feltétel a `where`-ben van: a hely csak akkor
 * kerül a fiókhoz, ha **még üres**, és a meghívó csak akkor lesz elhasznált, ha
 * **még nem az**. Feltétel nélküli `update`-tel két egyszerre megnyitott link
 * mindegyike átment, az elsőként beülő fiókot pedig a második csendben
 * leváltotta a jogviszonyról — épp az, amit a „meghívót csak üres helyre
 * készítünk" szabály meg akar akadályozni. Egy kérésben, egy tranzakcióban:
 * félúton megállva vagy foglalt hely maradna élő meghívóval, vagy fordítva.
 */
async function helyetElfoglal(
  meghivoId: string,
  jogviszonyBerloId: string,
  berloId: string,
  nev?: string,
): Promise<boolean> {
  return prisma
    .$transaction(async (tx) => {
      const hely = await tx.jogviszonyBerlo.updateMany({
        where: { id: jogviszonyBerloId, berloId: null },
        data: nev === undefined ? { berloId } : { berloId, nev },
      });
      if (hely.count === 0) return false;

      const meghivo = await tx.meghivo.updateMany({
        where: { id: meghivoId, felhasznalva: null },
        data: { felhasznalva: new Date() },
      });
      if (meghivo.count === 0) throw new HelyFoglalt();

      return true;
    })
    .catch((baj) => {
      if (baj instanceof HelyFoglalt) return false;
      throw baj;
    });
}

/** Csak a tranzakció visszagördítésére való; a hívó `false`-ot lát belőle. */
class HelyFoglalt extends Error {}
