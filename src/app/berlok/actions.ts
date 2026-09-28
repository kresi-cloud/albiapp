"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { emailNekLatszik, emailtNormalizal, meghivoLejarata } from "@/domain/belepes";
import { datumNyelven } from "@/domain/nyelv";
import { prisma } from "@/lib/db";
import { meghivoToken } from "@/lib/meghivo";
import { igazolvanyGyanus } from "@/domain/szemelyes-adatok";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { dijValtozastEllenoriz, type DijValtozasBemenet } from "@/domain/berlemeny";
import { urlapForint } from "@/domain/penz";
import {
  dijValtozastRogzit,
  dijValtozastVisszavon,
  jogviszonytLezar,
  jogviszonytUjranyit,
  utolsoEloirtHonap,
  type DijValtozasHiba,
} from "@/lib/jogviszony";

export type MeghivoEredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  link: string;
};

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
};

function hiba(uzenet: string, hibak: string[] = []): Eredmeny {
  return { allapot: "hiba", uzenet, hibak };
}

function szoveg(nyers: unknown): string {
  return String(nyers ?? "").trim();
}

function napotOlvas(nyers: unknown): Date | null {
  const ertek = szoveg(nyers);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ertek)) return null;
  const nap = new Date(`${ertek}T00:00:00.000Z`);
  return Number.isNaN(nap.getTime()) ? null : nap;
}

async function alapcim(): Promise<string> {
  const fejlec = await headers();
  const gazda = fejlec.get("host") ?? "localhost:3000";
  const protokoll = fejlec.get("x-forwarded-proto") ?? (gazda.startsWith("localhost") ? "http" : "https");
  return `${protokoll}://${gazda}`;
}

/** Csak a saját jogviszonyához tartozó bérlősort engedjük módosítani. */
async function sajatBerlo(berbeadoId: string, jogviszonyBerloId: string) {
  return prisma.jogviszonyBerlo.findFirst({
    where: {
      id: jogviszonyBerloId,
      jogviszony: { ingatlan: { tulajdonosId: berbeadoId } },
    },
  });
}

export async function meghivotKeszit(
  _elozo: MeghivoEredmeny,
  urlap: FormData,
): Promise<MeghivoEredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jogviszonyBerloId = szoveg(urlap.get("jogviszonyBerloId"));

  const berlo = await sajatBerlo(berbeado.id, jogviszonyBerloId);
  if (!berlo) {
    return { allapot: "hiba", uzenet: sz("berlok.hiba.nem_tied"), link: "" };
  }

  // Akinek már van fiókja, annak a helyére nem készítünk újabb meghívót. A
  // felület sem kínálja fel, de a szabály a kiszolgálón dől el: az elfogadás
  // átírná a hely `berloId`-ját, vagyis a valódi bérlő csendben lekerülne a
  // jogviszonyról, a helyére pedig egy olyan fiók ülne, aminek a bérbeadó
  // ismeri a jelszavát — és az a fiók a bérlő nevében erősítene meg
  // fényképet, fogadna el elszámolást és írna értékelést. Ha a bérlő
  // tényleg kicserélődik, a régit le kell venni a jogviszonyról, és az
  // újat hozzáadni: az látszik is, nem csendes csere.
  if (berlo.berloId !== null) {
    return { allapot: "hiba", uzenet: sz("berlok.hiba.mar_van_fiok"), link: "" };
  }

  const email = emailtNormalizal(urlap.get("email") ?? berlo.email);
  if (!emailNekLatszik(email)) {
    return { allapot: "hiba", uzenet: sz("berlok.hiba.email"), link: "" };
  }

  const most = new Date();

  // A korábbi, még élő meghívókat lejárttá tesszük: egyszerre egy link éljen,
  // különben a régi levélből is be lehetne lépni.
  await prisma.meghivo.updateMany({
    where: { jogviszonyBerloId, felhasznalva: null, lejar: { gt: most } },
    data: { lejar: most },
  });

  const meghivo = await prisma.meghivo.create({
    data: {
      jogviszonyBerloId,
      token: meghivoToken(),
      email,
      lejar: meghivoLejarata(most),
    },
  });

  if (berlo.email !== email) {
    await prisma.jogviszonyBerlo.update({ where: { id: berlo.id }, data: { email } });
  }

  revalidatePath("/berlok");

  return {
    allapot: "kesz",
    uzenet: sz("berlok.kesz.meghivo", { email }),
    link: `${await alapcim()}/meghivo/${meghivo.token}`,
  };
}

/**
 * Új bérlő a meglévő jogviszonyhoz. Több bérlőnél a fizetési kötelezettség
 * ugyanaz az egy előírás marad: egyetemlegesen felelnek érte.
 */
export async function berlotHozzaad(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));
  const nev = szoveg(urlap.get("nev"));
  const email = emailtNormalizal(urlap.get("email"));

  if (nev === "") return hiba(sz("berlok.hiba.nev_kell"));
  if (email !== "" && !emailNekLatszik(email)) {
    return hiba(sz("berlok.hiba.email_gyanus"));
  }

  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId: berbeado.id } },
    include: { berlok: true },
  });
  if (!jogviszony) return hiba(sz("berlok.hiba.jogviszony_nem_tied"));

  await prisma.jogviszonyBerlo.create({
    data: {
      jogviszonyId,
      nev,
      email: email === "" ? null : email,
      sorrend: jogviszony.berlok.length,
    },
  });

  revalidatePath("/berlok");
  revalidatePath("/szerzodesek");

  return {
    allapot: "kesz",
    uzenet: sz("berlok.kesz.hozzaadva", { nev }),
    hibak: [],
  };
}

/**
 * A szerződéshez és az igazolásokhoz szükséges személyes adatok. Külön űrlap,
 * mert ezeket nem a mindennapi kezeléshez, hanem a dokumentumokhoz kérjük.
 */
export async function berloAdataitMenti(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jogviszonyBerloId = szoveg(urlap.get("jogviszonyBerloId"));

  const berlo = await sajatBerlo(berbeado.id, jogviszonyBerloId);
  if (!berlo) return hiba(sz("berlok.hiba.nem_tied"));

  const nev = szoveg(urlap.get("nev"));
  if (nev === "") return hiba(sz("berlok.hiba.nev_ures"));

  const email = emailtNormalizal(urlap.get("email"));
  if (email !== "" && !emailNekLatszik(email)) {
    return hiba(sz("berlok.hiba.email_gyanus"));
  }

  // Ugyanaz a mező, ugyanaz az ellenőrzés, akárki gépeli. Eddig csak a bérlő
  // saját lapján futott: a bérbeadó által beírt elgépelt igazolványszám szó
  // nélkül bekerült a szerződésbe — épp az a hiba, ami miatt a bérlő a magáét
  // maga adja meg.
  const igazolvanySzam = szoveg(urlap.get("igazolvanySzam"));
  if (igazolvanyGyanus(igazolvanySzam)) {
    return hiba(sz("adatok.hiba.igazolvany"), ["igazolvanySzam"]);
  }

  await prisma.jogviszonyBerlo.update({
    where: { id: berlo.id },
    data: {
      nev,
      email: email === "" ? null : email,
      szuletesiHely: szoveg(urlap.get("szuletesiHely")) || null,
      szuletesiIdo: napotOlvas(urlap.get("szuletesiIdo")),
      anyjaNeve: szoveg(urlap.get("anyjaNeve")) || null,
      lakcim: szoveg(urlap.get("lakcim")) || null,
      igazolvanySzam: igazolvanySzam || null,
      telefon: szoveg(urlap.get("telefon")) || null,
      // Aki utoljára írta, az a forrás. A bérlő belépés után felülírhatja.
      adatokForrasa: "berbeado",
      adatokFrissitve: new Date(),
    },
  });

  revalidatePath("/berlok");
  revalidatePath("/szerzodesek");

  return { allapot: "kesz", uzenet: sz("berlok.kesz.adatok"), hibak: [] };
}

/**
 * Bérlő levétele a jogviszonyról.
 *
 * Akinek már állítottunk ki igazolást, azt nem lehet levenni. Az `Igazolas`
 * a bérlő során lóg (`onDelete: Cascade`), tehát a levétel a kiadott okiratot
 * is elvinné — mindkét fél tárából —, holott az a bérlőé is: ugyanaz az elv,
 * amit a fiók letiltásánál kimondtunk, hogy a kiadott okirat nem a miénk.
 *
 * Aki igazolást kapott, az ténylegesen ott lakott és fizetett abban a
 * hónapban; az ő részvételét a jogviszony lezárása zárja le, nem a levétel.
 * A levétel arra való, akit tévedésből vagy még okirat előtt vettek fel.
 */
export async function berlotTorol(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jogviszonyBerloId = szoveg(urlap.get("jogviszonyBerloId"));

  const berlo = await sajatBerlo(berbeado.id, jogviszonyBerloId);
  if (!berlo) return hiba(sz("berlok.hiba.nem_tied"));

  const darab = await prisma.jogviszonyBerlo.count({
    where: { jogviszonyId: berlo.jogviszonyId },
  });
  if (darab <= 1) {
    return hiba(sz("berlok.hiba.utolso_berlo"));
  }

  const igazolasok = await prisma.igazolas.count({
    where: { jogviszonyBerloId: berlo.id },
  });
  if (igazolasok > 0) {
    return hiba(sz("berlok.hiba.van_igazolasa", { nev: berlo.nev, darab: igazolasok }));
  }

  await prisma.jogviszonyBerlo.delete({ where: { id: berlo.id } });

  revalidatePath("/berlok");
  revalidatePath("/szerzodesek");

  return { allapot: "kesz", uzenet: sz("berlok.kesz.torolve", { nev: berlo.nev }), hibak: [] };
}

export async function jogviszonytLezarAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, nyelv } = await szovegek();

  const nyersNap = szoveg(urlap.get("vege"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nyersNap)) {
    return hiba(sz("valasz.lezaras_datum_kell"), ["vege"]);
  }
  const vege = new Date(`${nyersNap}T00:00:00.000Z`);
  if (Number.isNaN(vege.getTime())) {
    return hiba(sz("valasz.lezaras_datum_kell"), ["vege"]);
  }

  const eredmeny = await jogviszonytLezar(berbeado.id, szoveg(urlap.get("jogviszonyId")), vege);
  if (eredmeny.allapot === "nincs_jogosultsag") return hiba(sz("valasz.nincs_jogosultsag"));
  if (eredmeny.allapot === "mar_lezart") return hiba(sz("valasz.mar_lezart"));
  if (eredmeny.allapot === "vege_a_kezdet_elott") {
    return hiba(
      sz("valasz.lezaras_vege_a_kezdet_elott", { kezdete: datumNyelven(eredmeny.kezdete, nyelv) }),
      ["vege"],
    );
  }

  revalidatePath("/berlok");
  revalidatePath("/befizetesek");
  revalidatePath("/");
  return {
    allapot: "kesz",
    uzenet:
      eredmeny.megtartottEloirasok > 0
        ? sz("valasz.lezarva_megtartott", {
            torolt: eredmeny.toroltEloirasok,
            aranyositott: eredmeny.aranyositottEloirasok,
            megtartott: eredmeny.megtartottEloirasok,
          })
        : sz("valasz.lezarva", {
            torolt: eredmeny.toroltEloirasok,
            aranyositott: eredmeny.aranyositottEloirasok,
          }),
    hibak: [],
  };
}

export async function jogviszonytUjranyitAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const sikerult = await jogviszonytUjranyit(berbeado.id, szoveg(urlap.get("jogviszonyId")));
  if (!sikerult) return hiba(sz("valasz.nincs_jogosultsag"));

  revalidatePath("/berlok");
  revalidatePath("/befizetesek");
  revalidatePath("/");
  return { allapot: "kesz", uzenet: sz("valasz.ujranyitva"), hibak: [] };
}

/* ------------------------------------------------------------- Díjemelés */

/** „2026-10" alakú hónapmezőből a hónap első napja. */
function honapotOlvas(nyers: unknown): Date | null {
  const ertek = szoveg(nyers);
  if (!/^\d{4}-\d{2}$/.test(ertek)) return null;
  const nap = new Date(`${ertek}-01T00:00:00.000Z`);
  return Number.isNaN(nap.getTime()) ? null : nap;
}

function dijFrissit(): void {
  revalidatePath("/berlok");
  revalidatePath("/befizetesek");
  revalidatePath("/berlo");
  revalidatePath("/");
}

function dijValtozasUzenete(sz: (kulcs: string) => string, baj: DijValtozasHiba): string {
  if (baj === "van_mar") return sz("dijvaltozas.hiba.van_mar");
  if (baj === "eloirtuk") return sz("dijvaltozas.hiba.eloirtuk");
  return sz("dijvaltozas.hiba.nem_tied");
}

/**
 * Díjemelés rögzítése.
 *
 * Az új összegek a megadott hónap elejétől érvényesek, és csak olyan hónaptól,
 * amire még nincs előírás: meglévő előírást soha nem írunk át — amire egyszer
 * egyeztettek, azt egy későbbi emelés nem változtathatja meg. A hónapot a
 * kiszolgáló vágja a hónap első napjára, nem az űrlap.
 *
 * Eddig díjemelésre egyáltalán nem volt mód: az egyetlen „kiút" a lezárás és
 * egy új jogviszony volt, ami kettévágta a bérlet történetét.
 */
export async function dijValtozastRogzitAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();

  const jogviszony = await prisma.jogviszony.findFirst({
    where: {
      id: szoveg(urlap.get("jogviszonyId")),
      ingatlan: { tulajdonosId: berbeado.id },
    },
    select: { id: true, kezdete: true, rezsiElszamolas: true },
  });
  if (!jogviszony) return hiba(sz("dijvaltozas.hiba.nem_tied"));

  const bemenet: DijValtozasBemenet = {
    ervenyesTol: honapotOlvas(urlap.get("ervenyesTol")),
    berletiDijFt: urlapForint(urlap.get("berletiDijFt")),
    kozosKoltsegFt: urlapForint(urlap.get("kozosKoltsegFt")) ?? 0,
    rezsiAtalanyFt: urlapForint(urlap.get("rezsiAtalanyFt")) ?? 0,
    rezsiElszamolas: jogviszony.rezsiElszamolas,
    kezdete: jogviszony.kezdete,
    utolsoEloirtHonap: await utolsoEloirtHonap(jogviszony.id),
  };

  const kifogasok = dijValtozastEllenoriz(bemenet);
  if (kifogasok.length > 0) {
    return hiba(u(kifogasok[0].uzenet), kifogasok.map((kifogas) => kifogas.mezo));
  }

  const eredmeny = await dijValtozastRogzit(berbeado.id, jogviszony.id, {
    ervenyesTol: bemenet.ervenyesTol as Date,
    berletiDijFt: bemenet.berletiDijFt as number,
    kozosKoltsegFt: bemenet.kozosKoltsegFt as number,
    rezsiAtalanyFt: bemenet.rezsiAtalanyFt as number,
  });
  if (eredmeny !== "kesz") return hiba(dijValtozasUzenete(sz, eredmeny));

  dijFrissit();
  return { allapot: "kesz", uzenet: sz("dijvaltozas.kesz"), hibak: [] };
}

export async function dijValtozastVisszavonAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const eredmeny = await dijValtozastVisszavon(
    berbeado.id,
    szoveg(urlap.get("dijValtozasId")),
  );
  if (eredmeny !== "kesz") return hiba(dijValtozasUzenete(sz, eredmeny));

  dijFrissit();
  return { allapot: "kesz", uzenet: sz("dijvaltozas.visszavonva"), hibak: [] };
}
