"use client";

import { useActionState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import { szerzodestKeszit, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export function UjSzerzodes({ jogviszonyId }: { jogviszonyId: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(szerzodestKeszit, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
      <button
        type="submit"
        disabled={folyamatban}
        className="justify-self-start rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
      >
        {folyamatban ? "Készítem…" : "Szerződéstervezet készítése"}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
