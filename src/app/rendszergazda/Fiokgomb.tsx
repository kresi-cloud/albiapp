"use client";

import { useActionState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import { gombOsztaly } from "@/components/ui/alap";
import { fiokot, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "" };

/**
 * A fiók letiltása vagy visszaengedése, egy gombbal.
 *
 * Nincs megőrzendő begépelt adat, tehát nincs szükség a megőrző mezőkre: a
 * rejtett mezők értékét a lap adja, nem a felhasználó gépeli.
 */
export function Fiokgomb({
  felhasznaloId,
  letiltva,
  cimke,
  folyamatbanCimke,
}: {
  felhasznaloId: string;
  letiltva: boolean;
  cimke: string;
  folyamatbanCimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(fiokot, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-2">
      <input type="hidden" name="felhasznaloId" value={felhasznaloId} />
      <input type="hidden" name="muvelet" value={letiltva ? "visszaenged" : "letilt"} />
      <button
        type="submit"
        className={gombOsztaly(letiltva ? "masodlagos" : "veszelyes")}
        disabled={folyamatban}
        data-fiokmuvelet={letiltva ? "visszaenged" : "letilt"}
      >
        {folyamatban ? folyamatbanCimke : cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} />
    </form>
  );
}
