"use server";

import { revalidatePath } from "next/cache";
import {
  ingatlanFigyelmeztetesei,
  ingatlantEllenoriz,
  jogviszonyFigyelmeztetesei,
  jogviszonytEllenoriz,
  type IngatlanBemenet,
  type JogviszonyBemenet,
} from "@/domain/berlemeny";
import {
  dijszabasFigyelmeztetesei,
  dijszabastEllenoriz,
  merooratEllenoriz,
  tipusE,
  type MerooraBemenet,
} from "@/domain/meroora";
import { ingatlantLetrehoz, jogviszonytIndit } from "@/lib/berlemeny";
import {
  dijszabastFelvesz,
  dijszabastTorol,
  merooratFelvesz,
  merooratModosit,
  merooratTorol,
  sajatMeroora,
  type DijszabasHiba,
  type MerooraTorlesHiba,
} from "@/lib/meroora";
import { urlapFiller, urlapForint } from "@/domain/penz";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  /**
   * Melyik mezőkre vonatkozik a hiba. Nem `hibak`, mert azt a felsorolást a
   * felhasználó olvassa: oda mezőnév nem kerülhet. Ez a megjelölésé, a
   * felületen nem látszik — ugyanaz az elv, mint a szerződés `mezo` mezőjénél.
   */
  mezok: string[];
  /** Amit elmentettünk, de szólunk róla. Üres, ha nincs ilyen. */
  figyelmeztetesek: string[];
};

function szoveg(nyers: unknown): string {
  return String(nyers ?? "").trim();
}

/**
 * Nem pénz, hanem darabszám: alapterület, fizetési nap. Itt a pont tizedesjel,
 * és nincs ezres tagolás — az összegmezők az `urlapForint`-on mennek át.
 */
function szamotOlvas(nyers: unknown): number | null {
  const ertek = szoveg(nyers).replace(/\s/g, "");
  if (ertek === "") return null;
  const szam = Number(ertek);
  return Number.isFinite(szam) ? Math.round(szam) : Number.NaN;
}

function napotOlvas(nyers: unknown): Date | null {
  const ertek = szoveg(nyers);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ertek)) return null;
  const nap = new Date(`${ertek}T00:00:00.000Z`);
  return Number.isNaN(nap.getTime()) ? null : nap;
}

export async function ingatlantFelvesz(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();

  const bemenet: IngatlanBemenet = {
    megnevezes: szoveg(urlap.get("megnevezes")),
    cim: szoveg(urlap.get("cim")),
    alapteruletM2: szamotOlvas(urlap.get("alapteruletM2")),
    helyrajziSzam: szoveg(urlap.get("helyrajziSzam")) || null,
    energetikaiAzonosito: szoveg(urlap.get("energetikaiAzonosito")) || null,
    kozosKoltsegFt: urlapForint(urlap.get("kozosKoltsegFt")),
    beszerzesiArFt: urlapForint(urlap.get("beszerzesiArFt")),
    beszerzesDatuma: napotOlvas(urlap.get("beszerzesDatuma")),
  };

  const kifogasok = ingatlantEllenoriz(bemenet);
  if (kifogasok.length > 0) {
    return {
      allapot: "hiba",
      uzenet: u(kifogasok[0].uzenet),
      mezok: kifogasok.map((kifogas) => kifogas.mezo),
      figyelmeztetesek: [],
    };
  }

  await ingatlantLetrehoz(berbeado.id, bemenet);

  revalidatePath("/ingatlanok");
  revalidatePath("/berlok");
  revalidatePath("/ado");

  return {
    allapot: "kesz",
    uzenet: sz("berlemeny.mentve"),
    mezok: [],
    figyelmeztetesek: ingatlanFigyelmeztetesei(bemenet).map(u),
  };
}

export async function jogviszonytInditAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();
  const ma = new Date();

  const bemenet: JogviszonyBemenet = {
    kezdete: napotOlvas(urlap.get("kezdete")),
    berletiDijFt: urlapForint(urlap.get("berletiDijFt")),
    kozosKoltsegFt: urlapForint(urlap.get("kozosKoltsegFt")),
    kaucioFt: urlapForint(urlap.get("kaucioFt")),
    fizetesiNap: szamotOlvas(urlap.get("fizetesiNap")),
    rezsiElszamolas: szoveg(urlap.get("rezsiElszamolas")),
    rezsiAtalanyFt: urlapForint(urlap.get("rezsiAtalanyFt")),
    berloNeve: szoveg(urlap.get("berloNeve")),
  };

  const kifogasok = jogviszonytEllenoriz(bemenet);
  if (kifogasok.length > 0) {
    return {
      allapot: "hiba",
      uzenet: u(kifogasok[0].uzenet),
      mezok: kifogasok.map((kifogas) => kifogas.mezo),
      figyelmeztetesek: [],
    };
  }

  // Az ingatlan tulajdonosát a lib ellenőrzi: az űrlapból érkező azonosítót
  // sosem hisszük el magától.
  const jogviszonyId = await jogviszonytIndit(
    berbeado.id,
    szoveg(urlap.get("ingatlanId")),
    { ...bemenet, berloEmail: szoveg(urlap.get("berloEmail")) || null },
  );

  if (jogviszonyId === null) {
    return {
      allapot: "hiba",
      uzenet: sz("berlemeny.hiba.cim"),
      mezok: ["ingatlanId"],
      figyelmeztetesek: [],
    };
  }

  revalidatePath("/ingatlanok");
  revalidatePath("/berlok");
  revalidatePath("/befizetesek");
  revalidatePath("/");

  return {
    allapot: "kesz",
    uzenet: sz("jogviszony.mentve"),
    mezok: [],
    figyelmeztetesek: jogviszonyFigyelmeztetesei(bemenet, ma).map(u),
  };
}

/* ------------------------------------------------------- Mérőóra és díjszabás */

function merooraUrlaprol(urlap: FormData): MerooraBemenet {
  return {
    tipus: szoveg(urlap.get("tipus")),
    mertekegyseg: szoveg(urlap.get("mertekegyseg")),
    gyariSzam: szoveg(urlap.get("gyariSzam")) || null,
    almero: urlap.get("almero") !== null,
  };
}

/**
 * A mérőóra- és díjszabás-űrlapok hibája. A paraméter neve szándékosan nem
 * `hibak`: az a felhasználónak szóló felsorolás neve az `Uzenetsav`-ban, ez
 * pedig a mondat, amiből az első kerül ki. (Több kifogásból továbbra is csak
 * az első látszik; ez a lap így működött eddig is.)
 */
function merooraHiba(uzenetek: string[]): Eredmeny {
  return { allapot: "hiba", uzenet: uzenetek[0], mezok: [], figyelmeztetesek: [] };
}

function merooraFrissit(): void {
  revalidatePath("/ingatlanok");
  revalidatePath("/rezsi");
  revalidatePath("/berlo");
}

function merooraUzenete(sz: (kulcs: string) => string, hiba: MerooraTorlesHiba): string {
  if (hiba === "van_elszamolas") return sz("meroora.hiba.van_elszamolas");
  if (hiba === "van_oraallas") return sz("meroora.hiba.van_oraallas");
  return sz("meroora.hiba.nem_tied");
}

function dijszabasUzenete(sz: (kulcs: string) => string, hiba: DijszabasHiba): string {
  if (hiba === "van_mar") return sz("dijszabas.hiba.van_mar");
  if (hiba === "elszamolt") return sz("dijszabas.hiba.elszamolt");
  return sz("meroora.hiba.nem_tied");
}

/**
 * A mérőóra a bérleményhez tartozik, nem a bérlethez: a következő bérlő
 * ugyanazon az órán folytatja. Ezért a felvitele is itt van, az ingatlan
 * mellett, nem a rezsilapon.
 */
export async function merooratFelveszAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();

  const bemenet = merooraUrlaprol(urlap);
  const kifogasok = merooratEllenoriz(bemenet);
  if (kifogasok.length > 0) return merooraHiba(kifogasok.map(u));

  const sikerult = await merooratFelvesz(
    berbeado.id,
    szoveg(urlap.get("ingatlanId")),
    bemenet,
  );
  if (!sikerult) return merooraHiba([sz("berlemeny.hiba.cim")]);

  merooraFrissit();
  return { allapot: "kesz", uzenet: sz("meroora.kesz"), mezok: [], figyelmeztetesek: [] };
}

export async function merooratModositAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();

  const bemenet = merooraUrlaprol(urlap);
  const kifogasok = merooratEllenoriz(bemenet);
  if (kifogasok.length > 0) return merooraHiba(kifogasok.map(u));

  const eredmeny = await merooratModosit(
    berbeado.id,
    szoveg(urlap.get("merooraId")),
    bemenet,
  );
  if (eredmeny !== "kesz") return merooraHiba([merooraUzenete(sz, eredmeny)]);

  merooraFrissit();
  return { allapot: "kesz", uzenet: sz("meroora.modositva"), mezok: [], figyelmeztetesek: [] };
}

export async function merooratTorolAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const eredmeny = await merooratTorol(berbeado.id, szoveg(urlap.get("merooraId")));
  if (eredmeny !== "kesz") return merooraHiba([merooraUzenete(sz, eredmeny)]);

  merooraFrissit();
  return { allapot: "kesz", uzenet: sz("meroora.torolve"), mezok: [], figyelmeztetesek: [] };
}

export async function dijszabastFelveszAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();

  const meroora = await sajatMeroora(berbeado.id, szoveg(urlap.get("merooraId")));
  if (!meroora) return merooraHiba([sz("meroora.hiba.nem_tied")]);
  if (!tipusE(meroora.tipus)) return merooraHiba([sz("meroora.hiba.tipus")]);

  const keretNyers = szoveg(urlap.get("evesKeret"));
  const bemenet = {
    tipus: meroora.tipus,
    ervenyesTol: napotOlvas(urlap.get("ervenyesTol")),
    kedvezmenyesArFiller: urlapFiller(urlap.get("kedvezmenyesAr")),
    piaciArFiller: urlapFiller(urlap.get("piaciAr")),
    // Az üres keret nem hiányzó adat, hanem érvényes eset: nincs sáv.
    evesKeret: keretNyers === "" ? null : Number(keretNyers.replace(",", ".")),
    alapdijFt: urlapForint(urlap.get("alapdijFt")) ?? 0,
    csatornaArFiller: urlapFiller(urlap.get("csatornaAr")) ?? 0,
  };

  const kifogasok = dijszabastEllenoriz(bemenet);
  if (kifogasok.length > 0) return merooraHiba(kifogasok.map(u));

  const eredmeny = await dijszabastFelvesz(berbeado.id, meroora.id, {
    ervenyesTol: bemenet.ervenyesTol as Date,
    kedvezmenyesArFiller: bemenet.kedvezmenyesArFiller as number,
    piaciArFiller: bemenet.piaciArFiller as number,
    evesKeret: bemenet.evesKeret,
    alapdijFt: bemenet.alapdijFt,
    csatornaArFiller: bemenet.csatornaArFiller,
  });
  if (eredmeny !== "kesz") return merooraHiba([dijszabasUzenete(sz, eredmeny)]);

  merooraFrissit();
  return {
    allapot: "kesz",
    uzenet: sz("dijszabas.kesz"),
    mezok: [],
    figyelmeztetesek: dijszabasFigyelmeztetesei(bemenet).map(u),
  };
}

export async function dijszabastTorolAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const eredmeny = await dijszabastTorol(berbeado.id, szoveg(urlap.get("dijszabasId")));
  if (eredmeny !== "kesz") return merooraHiba([dijszabasUzenete(sz, eredmeny)]);

  merooraFrissit();
  return { allapot: "kesz", uzenet: sz("dijszabas.torolve"), mezok: [], figyelmeztetesek: [] };
}
