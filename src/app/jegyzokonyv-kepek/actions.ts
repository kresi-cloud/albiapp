"use server";

import { revalidatePath } from "next/cache";
import { kepetEllenoriz, tipusATartalombol } from "@/domain/jegyzokonyv-kepek";
import { kepekSzama, kepetElbiral, kepetMent, kepetTorol } from "@/lib/jegyzokonyv-kepek";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
};

function hiba(uzenet: string, hibak: string[] = []): Eredmeny {
  return { allapot: "hiba", uzenet, hibak };
}

function szoveg(ertek: FormDataEntryValue | null): string {
  return typeof ertek === "string" ? ertek.trim() : "";
}

function ures(ertek: FormDataEntryValue | null): string | null {
  const s = szoveg(ertek);
  return s === "" ? null : s;
}

/** Mindkét oldal látja az albumot, ezért mindkét utat frissítjük. */
function frissit() {
  revalidatePath("/jegyzokonyvek", "layout");
  revalidatePath("/dokumentumok");
  revalidatePath("/berlo/jegyzokonyvek");
  revalidatePath("/berlo");
}

export async function kepetFeltolt(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  const { sz, u } = await szovegek();
  if (!felhasznalo) return hiba(sz("valasz.nincs_jogosultsag"));

  const ki = { id: felhasznalo.id, szerep: szerepe(felhasznalo) };
  const jegyzokonyvId = szoveg(urlap.get("jegyzokonyvId"));

  const fajl = urlap.get("kep");
  if (!(fajl instanceof File)) return hiba(sz("kep.hiba.ures"), ["kep"]);

  const baj = kepetEllenoriz(
    { nev: fajl.name, tipus: fajl.type, meretBajt: fajl.size },
    await kepekSzama(jegyzokonyvId),
  );
  if (baj) return hiba(u(baj), ["kep"]);

  // A bejelentett típus a feltöltő gépéről jön; a tartalmat viszont a másik
  // fél böngészője fogja megnyitni a mi címünkön. Ezért a fájl elejéből
  // állapítjuk meg, mi az valójában, és azt is tároljuk el.
  const tartalom = new Uint8Array(await fajl.arrayBuffer());
  const valodiTipus = tipusATartalombol(tartalom.subarray(0, 16));
  if (valodiTipus === null) return hiba(sz("kep.hiba.tartalom"), ["kep"]);

  const megnevezes = szoveg(urlap.get("megnevezes"));
  const eredmeny = await kepetMent(ki, {
    jegyzokonyvId,
    tetelId: ures(urlap.get("tetelId")),
    parjaId: ures(urlap.get("parjaId")),
    megnevezes: megnevezes === "" ? fajl.name : megnevezes,
    fajl: { nev: fajl.name, tipus: valodiTipus, tartalom },
  });

  if (eredmeny === "lezart") return hiba(sz("kep.hiba.lezart"));
  if (eredmeny === "nincs_jogosultsag") return hiba(sz("kep.hiba.nem_tied"));

  frissit();
  return { allapot: "kesz", uzenet: sz("kep.kesz"), hibak: [] };
}

export async function kepetTorolAction(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo) return hiba(sz("valasz.nincs_jogosultsag"));

  const sikerult = await kepetTorol(felhasznalo.id, szoveg(urlap.get("kepId")));
  if (!sikerult) return hiba(sz("kep.hiba.nem_tied"));

  frissit();
  return { allapot: "kesz", uzenet: sz("kep.torolve"), hibak: [] };
}

/**
 * A másik fél nyilatkozata: megerősítés, vagy kifogás a kifogás szövegével.
 * Kifogást indoklás nélkül nem fogadunk el — abból a másik fél nem tud
 * kiindulni, és pont az veszne el, amiért a kép készült.
 */
export async function kepetElbiralAction(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo) return hiba(sz("valasz.nincs_jogosultsag"));

  const dontes = szoveg(urlap.get("dontes"));
  const kifogas = szoveg(urlap.get("kifogas"));
  if (dontes === "kifogas" && kifogas === "") {
    return hiba(sz("kep.kifogas_kell"), ["kifogas"]);
  }

  const eredmeny = await kepetElbiral(
    { id: felhasznalo.id, szerep: szerepe(felhasznalo) },
    szoveg(urlap.get("kepId")),
    dontes === "kifogas" ? kifogas : null,
  );

  if (eredmeny === "sajat") return hiba(sz("kep.hiba.sajat"));
  if (eredmeny !== null) return hiba(sz("kep.hiba.nem_tied"));

  frissit();
  return {
    allapot: "kesz",
    uzenet: dontes === "kifogas" ? sz("kep.kifogas_kesz") : sz("kep.megerositve_kesz"),
    hibak: [],
  };
}
