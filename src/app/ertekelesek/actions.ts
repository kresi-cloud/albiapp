"use server";

import { revalidatePath } from "next/cache";
import {
  LEGKISEBB_PONT,
  SZEMPONTOK,
  ellenoriz,
  kifogasSzovege,
  type Irany,
  type Pont,
} from "@/domain/ertekeles";
import { ertekelesNezet, ertekelestMent } from "@/lib/ertekeles";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export type Eredmeny = { allapot: "ures" | "kesz" | "hiba"; uzenet: string; hibak: string[] };

function pont(nyers: FormDataEntryValue | null): number {
  const ertek = Number(String(nyers ?? "").trim());
  return Number.isFinite(ertek) ? ertek : LEGKISEBB_PONT - 1;
}

/**
 * A saját értékelés mentése.
 *
 * A jogosultság és az időzítés a kiszolgálón dől el, nem az űrlapon: az irány
 * a szerepből következik, az alany a jogviszonyból, és hogy egyáltalán lehet-e
 * még írni, azt a domain mondja meg. Enélkül az, hogy „felfedés után nem lehet
 * módosítani", egy elrejtett gomb ígérete maradna.
 */
export async function ertekelestIr(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  const { sz, u } = await szovegek();
  if (!felhasznalo) return { allapot: "hiba", uzenet: sz("ertekeles.hiba.nem_tied"), hibak: [] };

  const szerep = szerepe(felhasznalo);
  const jogviszonyId = String(urlap.get("jogviszonyId") ?? "");
  const masikFelId = String(urlap.get("masikFelId") ?? "");
  const nezet = await ertekelesNezet(jogviszonyId, masikFelId, felhasznalo.id, szerep, new Date());
  if (!nezet || nezet.masikFelId === null) {
    return { allapot: "hiba", uzenet: sz("ertekeles.hiba.nem_tied"), hibak: [] };
  }
  if (!nezet.irhato) {
    return {
      allapot: "hiba",
      uzenet: u(kifogasSzovege(nezet.allapot === "nem_ideje" ? "nem_ideje" : "mar_felfedve")),
      hibak: [],
    };
  }

  const irany: Irany = nezet.sajatIrany;
  const pontok: Pont[] = SZEMPONTOK[irany].map((szempont) => ({
    szempont,
    pont: pont(urlap.get(`pont_${szempont}`)),
  }));
  const szoveg = String(urlap.get("szoveg") ?? "");

  const kifogasok = ellenoriz({ irany, szoveg, pontok });
  if (kifogasok.length > 0) {
    return {
      allapot: "hiba",
      uzenet: u(kifogasSzovege(kifogasok[0])),
      hibak: kifogasok.map((kifogas) => u(kifogasSzovege(kifogas))),
    };
  }

  await ertekelestMent(jogviszonyId, felhasznalo.id, nezet.masikFelId, irany, szoveg, pontok);

  revalidatePath("/ertekelesek");
  revalidatePath(szerep === "berbeado" ? "/" : "/berlo");
  return { allapot: "kesz", uzenet: sz("ertekeles.kesz"), hibak: [] };
}
