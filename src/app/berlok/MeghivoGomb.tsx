"use client";

import { useActionState } from "react";
import { meghivotKeszit, type MeghivoEredmeny } from "./actions";

const KEZDETI: MeghivoEredmeny = { allapot: "ures", uzenet: "", link: "" };

export function MeghivoGomb({
  jogviszonyBerloId,
  email,
  cimke,
}: {
  jogviszonyBerloId: string;
  email: string;
  cimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(meghivotKeszit, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="jogviszonyBerloId" value={jogviszonyBerloId} />

      <label className="grid gap-1 text-sm">
        <span className="font-medium">A bérlő e-mail-címe</span>
        <input
          name="email"
          type="email"
          defaultValue={email}
          className="rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
          required
        />
      </label>

      <button
        type="submit"
        disabled={folyamatban}
        className="justify-self-start rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
      >
        {folyamatban ? "Készítem…" : cimke}
      </button>

      {allapot.allapot !== "ures" ? (
        <div
          className={`rounded border p-3 text-sm ${
            allapot.allapot === "hiba"
              ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
              : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          }`}
        >
          <p>{allapot.uzenet}</p>
          {allapot.link ? (
            <input
              readOnly
              value={allapot.link}
              onFocus={(esemeny) => esemeny.currentTarget.select()}
              className="mt-2 w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200"
            />
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
