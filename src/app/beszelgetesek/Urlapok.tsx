"use client";

import { useActionState } from "react";
import { Szovegdoboz } from "@/components/megorzo";
import { GOMB, MEZO } from "@/components/urlap";
import {
  beszelgetestInditAction,
  uzenetetKuldAction,
  type Eredmeny,
} from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "" };

function Hibasav({ allapot }: { allapot: Eredmeny }) {
  if (allapot.allapot !== "hiba" || !allapot.uzenet) return null;
  return (
    <p className="rounded border border-rose-300 bg-rose-50 p-2 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
      {allapot.uzenet}
    </p>
  );
}

export type ValaszCimkek = {
  cimke: string;
  pelda: string;
  gomb: string;
  folyamatban: string;
};

/**
 * Válasz egy meglévő szálba.
 *
 * A szövegdoboz a megőrzős mezőkön megy: ha a kiszolgáló elutasítja, a
 * begépelt üzenet ott marad. Egy hosszabb üzenetet senki nem ír le másodszor
 * ugyanúgy, és ez az az eset, ahol ez a legfájóbb.
 */
export function Valasz({
  beszelgetesId,
  cimkek,
}: {
  beszelgetesId: string;
  cimkek: ValaszCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(uzenetetKuldAction, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="beszelgetesId" value={beszelgetesId} />
      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.cimke}</span>
        <Szovegdoboz
          name="szoveg"
          rows={3}
          placeholder={cimkek.pelda}
          className={MEZO}
          allapot={allapot.allapot}
          required
        />
      </label>
      <Hibasav allapot={allapot} />
      <button type="submit" disabled={folyamatban} className={`${GOMB} justify-self-start`}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
    </form>
  );
}

export type IranyitoTarsasag = {
  jogviszonyId: string;
  ingatlanNev: string;
  tagok: { felhasznaloId: string; nev: string }[];
};

export type UjCimkek = {
  nyito: string;
  sugo: string;
  cimzettek: string;
  csoportSugo: string;
  szoveg: string;
  pelda: string;
  gomb: string;
  folyamatban: string;
  nincsTars: string;
};

/**
 * Új beszélgetés egy bérleményhez.
 *
 * Bérleményenként külön űrlap, és nincs bérleményválasztó. Egy próba pont ezt
 * fogta meg: amíg a címzettek listája minden bérlemény lakóit együtt mutatta,
 * a választó egy másik bérleményen állhatott, és a kiszolgáló — helyesen —
 * elutasította, hogy „jelöld be, kinek írsz”, holott be volt jelölve. A
 * beszélgetés a jogviszonyhoz tartozik, tehát a jogviszony ne külön mező
 * legyen, amivel el lehet csúszni, hanem magának az űrlapnak a kerete.
 *
 * Nincs külön „indítás” gomb az üzenet nélkül sem: a beszélgetés az első
 * üzenettel jön létre, tehát a címzett és a mondat egyszerre megy el. A
 * címzettek jelölőnégyzetek, mert ugyanez az űrlap indít kétirányút és
 * csoportosat is — a különbség csak az, hányat pipál be az ember.
 */
function EgyTarsasag({
  tarsasag,
  cimkek,
  mutassukABerlemenyt,
}: {
  tarsasag: IranyitoTarsasag;
  cimkek: UjCimkek;
  mutassukABerlemenyt: boolean;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(beszelgetestInditAction, KEZDETI);

  return (
    <details className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <summary className="cursor-pointer font-medium">
        {cimkek.nyito}
        {mutassukABerlemenyt ? (
          <span className="font-normal text-stone-600 dark:text-stone-400">
            {" · "}
            {tarsasag.ingatlanNev}
          </span>
        ) : null}
      </summary>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{cimkek.sugo}</p>

      <form action={kuldes} className="mt-3 grid gap-3">
        <input type="hidden" name="jogviszonyId" value={tarsasag.jogviszonyId} />

        <fieldset className="grid gap-1 text-sm">
          <legend className="font-medium">{cimkek.cimzettek}</legend>
          <p className="text-xs text-stone-500 dark:text-stone-400">{cimkek.csoportSugo}</p>
          {tarsasag.tagok.map((tag) => (
            <label key={tag.felhasznaloId} className="flex items-center gap-2">
              <input type="checkbox" name="cimzett" value={tag.felhasznaloId} />
              <span>{tag.nev}</span>
            </label>
          ))}
        </fieldset>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.szoveg}</span>
          <Szovegdoboz
            name="szoveg"
            rows={3}
            placeholder={cimkek.pelda}
            className={MEZO}
            allapot={allapot.allapot}
            required
          />
        </label>

        <Hibasav allapot={allapot} />
        <button type="submit" disabled={folyamatban} className={`${GOMB} justify-self-start`}>
          {folyamatban ? cimkek.folyamatban : cimkek.gomb}
        </button>
      </form>
    </details>
  );
}

export function UjBeszelgetes({
  tarsasagok,
  cimkek,
}: {
  tarsasagok: IranyitoTarsasag[];
  cimkek: UjCimkek;
}) {
  // Akihez nincs kinek írni, annak ne egy üres űrlap álljon a lapon: mondjuk
  // meg, miért nincs, mert a bérlő neve különben csak hiányzik a listából.
  const van = tarsasagok.filter((tarsasag) => tarsasag.tagok.length > 0);

  if (van.length === 0) {
    return <p className="text-sm text-stone-600 dark:text-stone-400">{cimkek.nincsTars}</p>;
  }

  return (
    <div className="grid gap-3">
      {van.map((tarsasag) => (
        <EgyTarsasag
          key={tarsasag.jogviszonyId}
          tarsasag={tarsasag}
          cimkek={cimkek}
          mutassukABerlemenyt={van.length > 1}
        />
      ))}
    </div>
  );
}
