"use client";

import { useActionState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import { GOMB, MEZO } from "@/components/urlap";
import { utalastRogzit, utalastTorol, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export type UtalasCimkek = {
  nyito: string;
  datum: string;
  osszeg: string;
  kozlemeny: string;
  gomb: string;
  sugo: string;
  visszavon: string;
};

function Mezo({
  nev,
  cimke,
  ertek,
  tipus = "text",
}: {
  nev: string;
  cimke: string;
  ertek: string;
  tipus?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{cimke}</span>
      <input name={nev} type={tipus} defaultValue={ertek} className={MEZO} />
    </label>
  );
}

/**
 * A bérlő saját oldala: mikor mennyit utalt. Ez nem "kipipálom, hogy fizettem":
 * a bérbeadó adata külön él, és a kettő összevetése az egyeztetés.
 */
export function Utalas({
  jogviszonyId,
  osszegFt,
  esedekesseg,
  cimkek,
}: {
  jogviszonyId: string;
  osszegFt: number;
  esedekesseg: string;
  cimkek: UtalasCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(utalastRogzit, KEZDETI);

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm text-stone-600 underline underline-offset-2 dark:text-stone-400">
        {cimkek.nyito}
      </summary>
      <form action={kuldes} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
        <Mezo nev="utalasDatuma" cimke={cimkek.datum} ertek={esedekesseg} tipus="date" />
        <Mezo nev="osszegFt" cimke={cimkek.osszeg} ertek={String(osszegFt)} />
        <div className="grid gap-3 sm:col-span-2">
          <Mezo nev="kozlemeny" cimke={cimkek.kozlemeny} ertek="" />
          <p className="text-xs text-stone-500 dark:text-stone-400">{cimkek.sugo}</p>
          <button type="submit" disabled={folyamatban} className={GOMB}>
            {folyamatban ? "…" : cimkek.gomb}
          </button>
          <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
        </div>
      </form>
    </details>
  );
}

/** Elgépelt utalás visszavonása. A bérbeadó adatához nem nyúl. */
export function UtalastVisszavon({
  igazolasId,
  cimke,
}: {
  igazolasId: string;
  cimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(utalastTorol, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="igazolasId" value={igazolasId} />
      <button
        type="submit"
        disabled={folyamatban}
        className="justify-self-start text-xs text-stone-500 underline underline-offset-2 hover:text-rose-700 disabled:opacity-60 dark:text-stone-400"
      >
        {folyamatban ? "…" : cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
