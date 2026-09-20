"use client";

import { useActionState } from "react";
import type { Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { belep, type BelepesEredmeny } from "./actions";
import { GOMB, MEZO } from "@/components/urlap";

const KEZDETI: BelepesEredmeny = { allapot: "ures", uzenet: "", email: "" };

export function BelepesUrlap({ nyelv = "hu" }: { nyelv?: Nyelv }) {
  const { sz } = szovegekNyelvvel(nyelv);
  const [allapot, kuldes, folyamatban] = useActionState(belep, KEZDETI);

  return (
    <form
      action={kuldes}
      className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <label className="grid gap-1 text-sm">
        <span className="font-medium">{sz("belepes.email")}</span>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          key={allapot.email}
          defaultValue={allapot.email}
          className={MEZO}
          required
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{sz("belepes.jelszo")}</span>
        <input
          id="jelszo"
          name="jelszo"
          type="password"
          autoComplete="current-password"
          className={MEZO}
          required
        />
      </label>

      <button
        type="submit"
        disabled={folyamatban}
        className={GOMB}
      >
        {folyamatban ? sz("belepes.folyamatban") : sz("belepes.gomb")}
      </button>

      {allapot.allapot === "hiba" ? (
        <p className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {allapot.uzenet}
        </p>
      ) : null}
    </form>
  );
}
