"use client";

import { useActionState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import { APRO_GOMB, GOMB, MEZO } from "@/components/urlap";
import { beerkezestRogzit, beerkezestTorol, nemErkezettMeg, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

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

export type BeerkezesCimkek = {
  nyito: string;
  datum: string;
  osszeg: string;
  kozlemeny: string;
  gomb: string;
  nem: string;
  visszavon: string;
};

/**
 * A bérbeadó saját oldala: mikor mennyi érkezett. Az összeg és a dátum az
 * előírásból van előtöltve, mert a leggyakoribb eset az, hogy pontosan annyi
 * jött — de felülírható, mert az egyeztetés éppen az eltérésről szól.
 */
export function Beerkezes({
  jogviszonyId,
  eloirtTetelId,
  osszegFt,
  esedekesseg,
  cimkek,
}: {
  jogviszonyId: string;
  eloirtTetelId: string | null;
  osszegFt: number;
  esedekesseg: string;
  cimkek: BeerkezesCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(beerkezestRogzit, KEZDETI);

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm text-stone-600 underline underline-offset-2 dark:text-stone-400">
        {cimkek.nyito}
      </summary>
      <form action={kuldes} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
        {eloirtTetelId ? (
          <input type="hidden" name="eloirtTetelId" value={eloirtTetelId} />
        ) : null}
        <Mezo nev="erkezesDatuma" cimke={cimkek.datum} ertek={esedekesseg} tipus="date" />
        <Mezo nev="osszegFt" cimke={cimkek.osszeg} ertek={String(osszegFt)} />
        <div className="grid gap-3 sm:col-span-2">
          <Mezo nev="kozlemeny" cimke={cimkek.kozlemeny} ertek="" />
          <button type="submit" disabled={folyamatban} className={GOMB}>
            {folyamatban ? "…" : cimkek.gomb}
          </button>
          <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
        </div>
      </form>
    </details>
  );
}

/** A másik lehetséges válasz: megnéztem, és nem jött meg. */
export function NemErkezett({
  eloirtTetelId,
  cimke,
}: {
  eloirtTetelId: string;
  cimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(nemErkezettMeg, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="eloirtTetelId" value={eloirtTetelId} />
      <button type="submit" disabled={folyamatban} className={APRO_GOMB}>
        {folyamatban ? "…" : cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

/** Elgépelt rögzítés visszavonása. A bérlő adatához nem nyúl. */
export function BeerkezestVisszavon({
  igazolasId,
  cimke,
}: {
  igazolasId: string;
  cimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(beerkezestTorol, KEZDETI);

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
