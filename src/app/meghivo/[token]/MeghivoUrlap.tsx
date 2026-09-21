"use client";

import { useActionState } from "react";
import { meghivotElfogad, type RegisztracioEredmeny } from "./actions";
import { GOMB, MEZO } from "@/components/urlap";

const KEZDETI: RegisztracioEredmeny = { allapot: "ures", uzenet: "", hibak: [], nev: "" };

export function MeghivoUrlap({
  token,
  email,
  cimkek,
}: {
  token: string;
  email: string;
  cimkek: {
    email: string;
    emailSugo: string;
    nev: string;
    jelszo: string;
    jelszoUjra: string;
    gomb: string;
    folyamatban: string;
  };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(meghivotElfogad, KEZDETI);

  return (
    <form
      action={kuldes}
      className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <input type="hidden" name="token" value={token} />

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.email}</span>
        <input
          value={email}
          readOnly
          className="rounded border border-stone-200 bg-stone-100 px-3 py-2 text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400"
        />
        <span className="text-xs text-stone-500 dark:text-stone-400">{cimkek.emailSugo}</span>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.nev}</span>
        <input
          id="nev"
          name="nev"
          autoComplete="name"
          key={allapot.nev}
          defaultValue={allapot.nev}
          className={MEZO}
          required
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.jelszo}</span>
        <input
          id="jelszo"
          name="jelszo"
          type="password"
          autoComplete="new-password"
          className={MEZO}
          required
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.jelszoUjra}</span>
        <input
          id="jelszoUjra"
          name="jelszoUjra"
          type="password"
          autoComplete="new-password"
          className={MEZO}
          required
        />
      </label>

      <button
        type="submit"
        disabled={folyamatban}
        className={GOMB}
      >
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
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
          {allapot.hibak.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {allapot.hibak.map((hiba) => (
                <li key={hiba}>{hiba}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
