"use client";

import { useActionState } from "react";
import { teendotLezar, type Eredmeny } from "@/app/teendok/actions";
import { APRO_GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export function TeendoLezaras({
  kulcs,
  cimke,
  folyamatbanCimke,
}: {
  kulcs: string;
  cimke: string;
  folyamatbanCimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(teendotLezar, KEZDETI);

  return (
    <form action={kuldes} className="inline-block">
      <input type="hidden" name="kulcs" value={kulcs} />
      <button
        type="submit"
        disabled={folyamatban}
        className={`${APRO_GOMB} min-h-9 px-3`}
      >
        {folyamatban ? folyamatbanCimke : allapot.allapot === "hiba" ? allapot.uzenet : cimke}
      </button>
    </form>
  );
}
