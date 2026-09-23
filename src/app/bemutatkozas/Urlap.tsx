"use client";

import { useActionState } from "react";
import { Szovegdoboz } from "@/components/megorzo";
import { GOMB, CIMKE, MEZO, SUGOSZOVEG } from "@/components/urlap";
import { bemutatkozastIr, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "" };

/**
 * A saját bemutatkozás űrlapja.
 *
 * A szöveg a `Szovegdoboz`-on megy át, tehát egy elutasított mentés nem viszi
 * el a begépelt bekezdést.
 */
export function BemutatkozasUrlap({
  meglevo,
  cimkek,
}: {
  meglevo: string;
  cimkek: { cimke: string; sugo: string; gomb: string; folyamatban: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(
    bemutatkozastIr,
    KEZDETI,
  );

  return (
    <form action={kuldes} className="grid gap-2">
      <label className={CIMKE} htmlFor="bemutatkozas">
        {cimkek.cimke}
      </label>
      <p className={SUGOSZOVEG}>{cimkek.sugo}</p>
      <Szovegdoboz
        id="bemutatkozas"
        name="bemutatkozas"
        rows={5}
        className={MEZO}
        defaultValue={meglevo}
        allapot={allapot.allapot}
      />
      <button type="submit" className={GOMB} disabled={folyamatban}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
      {allapot.uzenet ? (
        <p
          className={
            allapot.allapot === "hiba"
              ? "text-sm text-gond"
              : "text-sm text-rendben"
          }
        >
          {allapot.uzenet}
        </p>
      ) : null}
    </form>
  );
}
