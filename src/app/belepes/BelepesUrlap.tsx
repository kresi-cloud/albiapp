"use client";

import { useActionState } from "react";
import { belep, type BelepesEredmeny } from "./actions";

const KEZDETI: BelepesEredmeny = { allapot: "ures", uzenet: "", email: "" };

export function BelepesUrlap() {
  const [allapot, kuldes, folyamatban] = useActionState(belep, KEZDETI);

  return (
    <form
      action={kuldes}
      className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <label className="grid gap-1 text-sm">
        <span className="font-medium">E-mail-cím</span>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          key={allapot.email}
          defaultValue={allapot.email}
          className="rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
          required
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Jelszó</span>
        <input
          id="jelszo"
          name="jelszo"
          type="password"
          autoComplete="current-password"
          className="rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
          required
        />
      </label>

      <button
        type="submit"
        disabled={folyamatban}
        className="justify-self-start rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
      >
        {folyamatban ? "Belépés…" : "Belépés"}
      </button>

      {allapot.allapot === "hiba" ? (
        <p className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {allapot.uzenet}
        </p>
      ) : null}
    </form>
  );
}
