"use client";

import { useActionState } from "react";
import { teendotLezar, type Eredmeny } from "@/app/teendok/actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export function TeendoLezaras({ kulcs }: { kulcs: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(teendotLezar, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 inline-block">
      <input type="hidden" name="kulcs" value={kulcs} />
      <button
        type="submit"
        disabled={folyamatban}
        className="text-sm text-stone-600 underline underline-offset-2 disabled:opacity-60 dark:text-stone-400"
      >
        {folyamatban ? "Lezárom…" : allapot.allapot === "hiba" ? allapot.uzenet : "Kész"}
      </button>
    </form>
  );
}
