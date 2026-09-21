"use server";

import { revalidatePath } from "next/cache";
import { kifogasSzovege, type Kifogas } from "@/domain/elofizetes";
import {
  elofizetestFelvesz,
  elofizetestMegszuntet,
  nyilatkozik,
  type FelvetelHiba,
  type NyilatkozatHiba,
} from "@/lib/elofizetes";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = { allapot: "ures" | "kesz" | "hiba"; uzenet: string };

const ADATKIFOGASOK: string[] = ["nincs_megnevezes", "negativ_dij", "vege_a_kezdet_elott"];

/**
 * Az előfizetés a befizetéseken és a bérlő lapján is látszik, mert előírás lesz
 * belőle; ezért mindhármat frissíteni kell, nem csak a saját lapját.
 */
function frissit(): void {
  revalidatePath("/elofizetesek");
  revalidatePath("/befizetesek");
  revalidatePath("/berlo");
  revalidatePath("/");
}

/** Egész forint az űrlapról; ami nem szám, az nulla, és a domain dönt róla. */
function forint(nyers: FormDataEntryValue | null): number {
  const ertek = Number(String(nyers ?? "").replace(/\s/g, ""));
  return Number.isFinite(ertek) ? Math.trunc(ertek) : 0;
}

function nap(nyers: FormDataEntryValue | null): Date | null {
  const szoveg = String(nyers ?? "").trim();
  if (!szoveg) return null;
  const ertek = new Date(`${szoveg}T00:00:00.000Z`);
  return Number.isNaN(ertek.getTime()) ? null : ertek;
}

/** A hiba kódja adja a szótárkulcsot: a mondat a szótárban él, mindkét nyelven. */
async function hibaSzovege(hiba: FelvetelHiba | NyilatkozatHiba): Promise<Eredmeny> {
  const { sz, u } = await szovegek();
  if (ADATKIFOGASOK.includes(hiba)) {
    return { allapot: "hiba", uzenet: u(kifogasSzovege(hiba as Kifogas)) };
  }
  const kulcs =
    hiba === "nincs_indoklas" ? "elofizetes.kifogas.nincs_indoklas" : `elofizetes.hiba.${hiba}`;
  return { allapot: "hiba", uzenet: sz(kulcs) };
}

export async function elofizetestFelveszAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const kezdete = nap(urlap.get("kezdete"));
  if (!kezdete) return { allapot: "hiba", uzenet: sz("valasz.datum_kell") };

  const hiba = await elofizetestFelvesz(berbeado.id, {
    jogviszonyId: String(urlap.get("jogviszonyId") ?? ""),
    fajta: String(urlap.get("fajta") ?? "egyeb"),
    megnevezes: String(urlap.get("megnevezes") ?? ""),
    szolgaltato: String(urlap.get("szolgaltato") ?? ""),
    elofizeto: String(urlap.get("elofizeto") ?? "berbeado"),
    haviDijFt: forint(urlap.get("haviDijFt")),
    kezdete,
    vege: nap(urlap.get("vege")),
  });
  if (hiba) return hibaSzovege(hiba);

  frissit();
  return { allapot: "kesz", uzenet: sz("elofizetes.felvettuk") };
}

export async function elofizetestMegszuntetAction(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const sikerult = await elofizetestMegszuntet(
    berbeado.id,
    String(urlap.get("elofizetesId") ?? ""),
    new Date(),
  );
  if (!sikerult) return hibaSzovege("nincs_jogosultsag");

  frissit();
  return { allapot: "kesz", uzenet: sz("elofizetes.megszuntettuk") };
}

export async function nyilatkozikAction(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berlo = await kotelezoSzerep("berlo");
  const { sz } = await szovegek();

  // A szerepet a belépett felhasználóból vesszük, a döntést az űrlapról: azt
  // a bérlő adja meg, és csak a saját jogviszonyára engedjük át.
  const allapot = String(urlap.get("allapot") ?? "") === "kifogasolt" ? "kifogasolt" : "jovahagyva";

  const hiba = await nyilatkozik(
    berlo.id,
    String(urlap.get("elofizetesId") ?? ""),
    allapot,
    String(urlap.get("indoklas") ?? ""),
  );
  if (hiba) return hibaSzovege(hiba);

  frissit();
  return { allapot: "kesz", uzenet: sz("elofizetes.nyilatkoztal") };
}
