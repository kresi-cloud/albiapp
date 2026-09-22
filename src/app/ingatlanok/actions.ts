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
import { ingatlantLetrehoz, jogviszonytIndit } from "@/lib/berlemeny";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
  /** Amit elmentettünk, de szólunk róla. Üres, ha nincs ilyen. */
  figyelmeztetesek: string[];
};

function szoveg(nyers: unknown): string {
  return String(nyers ?? "").trim();
}

/** Üres mező nem nulla: a "nem adtam meg" és a "nulla forint" nem ugyanaz. */
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
    kozosKoltsegFt: szamotOlvas(urlap.get("kozosKoltsegFt")),
    beszerzesiArFt: szamotOlvas(urlap.get("beszerzesiArFt")),
    beszerzesDatuma: napotOlvas(urlap.get("beszerzesDatuma")),
  };

  const kifogasok = ingatlantEllenoriz(bemenet);
  if (kifogasok.length > 0) {
    return {
      allapot: "hiba",
      uzenet: u(kifogasok[0].uzenet),
      hibak: kifogasok.map((kifogas) => kifogas.mezo),
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
    hibak: [],
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
    berletiDijFt: szamotOlvas(urlap.get("berletiDijFt")),
    kozosKoltsegFt: szamotOlvas(urlap.get("kozosKoltsegFt")),
    kaucioFt: szamotOlvas(urlap.get("kaucioFt")),
    fizetesiNap: szamotOlvas(urlap.get("fizetesiNap")),
    rezsiElszamolas: szoveg(urlap.get("rezsiElszamolas")),
    rezsiAtalanyFt: szamotOlvas(urlap.get("rezsiAtalanyFt")),
    berloNeve: szoveg(urlap.get("berloNeve")),
  };

  const kifogasok = jogviszonytEllenoriz(bemenet);
  if (kifogasok.length > 0) {
    return {
      allapot: "hiba",
      uzenet: u(kifogasok[0].uzenet),
      hibak: kifogasok.map((kifogas) => kifogas.mezo),
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
      hibak: ["ingatlanId"],
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
    hibak: [],
    figyelmeztetesek: jogviszonyFigyelmeztetesei(bemenet, ma).map(u),
  };
}
