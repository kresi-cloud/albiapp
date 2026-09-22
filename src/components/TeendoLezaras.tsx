"use client";

import { useActionState } from "react";
import { teendotLezar, teendotUjranyit, type Eredmeny } from "@/app/teendok/actions";
import { APRO_GOMB, VISSZAVONO_GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

/**
 * Teendő lezárása és a lezárás visszavonása.
 *
 * Egy komponens a kettőre, mert a különbség egyetlen művelet: ha külön lenne,
 * a visszavonás előbb-utóbb elmaradna a lezárástól. A lezárás elsődleges
 * kinézetű gomb, a visszavonás halkabb — nem az a fő út, de nem is rejtett,
 * mert egy elkattintott „kész" különben csendben eltüntetné, amit valaki
 * vállalt.
 */
export function TeendoLezaras({
  kulcs,
  cimke,
  folyamatbanCimke,
  muvelet = "lezar",
}: {
  kulcs: string;
  cimke: string;
  folyamatbanCimke: string;
  muvelet?: "lezar" | "ujranyit";
}) {
  const [allapot, kuldes, folyamatban] = useActionState(
    muvelet === "ujranyit" ? teendotUjranyit : teendotLezar,
    KEZDETI,
  );

  return (
    <form action={kuldes} className="inline-block">
      <input type="hidden" name="kulcs" value={kulcs} />
      <button
        type="submit"
        disabled={folyamatban}
        className={muvelet === "ujranyit" ? VISSZAVONO_GOMB : `${APRO_GOMB} min-h-9 px-3`}
      >
        {folyamatban ? folyamatbanCimke : allapot.allapot === "hiba" ? allapot.uzenet : cimke}
      </button>
    </form>
  );
}
