/**
 * Melyik nyelven beszélünk ezen a kérésen.
 *
 * Az ezen az eszközön tett utolsó kifejezett választás dönt: a süti. Ez azért
 * fontos, mert a meghívóból érkező bérlő még fiók nélkül állítja át a nyelvet,
 * és a belépés nem veheti el tőle. Süti híján a fiókban mentett nyelv jön,
 * hogy a másik eszközén is a sajátját kapja.
 */

import { cookies } from "next/headers";
import { nyelvet, type Nyelv, type Szovegezo } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { belepettFelhasznalo } from "@/lib/munkamenet";

const SUTI = "albi_nyelv";
const ELETTARTAM_NAP = 365;

export async function nyelvSutit(nyelv: Nyelv): Promise<void> {
  const suti = await cookies();
  suti.set(SUTI, nyelv, {
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + ELETTARTAM_NAP * 24 * 60 * 60 * 1000),
  });
}

export async function aktualisNyelv(): Promise<Nyelv> {
  const suti = await cookies();
  const valasztott = suti.get(SUTI)?.value;
  if (valasztott) return nyelvet(valasztott);

  const felhasznalo = await belepettFelhasznalo();
  return nyelvet(felhasznalo?.nyelv);
}

/** A szövegező egy kéréshez: a nyelv és a szótár összekötve. */
export async function szovegek(): Promise<Szovegezo> {
  return szovegekNyelvvel(await aktualisNyelv());
}

export { szovegekNyelvvel };
