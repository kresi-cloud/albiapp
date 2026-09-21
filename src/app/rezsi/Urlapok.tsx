"use client";

import { useActionState } from "react";
import { Mezo, Szovegdoboz } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import {
  elszamolastElbiral,
  elszamolastKeszitAction,
  elszamolastKiad,
  oraallastRogzit,
  type Eredmeny,
} from "./actions";
import { MEZO, GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export function OraallasUrlap({
  merooraId,
  mai,
  cimkek,
}: {
  merooraId: string;
  mai: string;
  cimkek: { datum: string; ertek: string; gomb: string; folyamatban: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(oraallastRogzit, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="merooraId" value={merooraId} />
      <div className="flex flex-wrap gap-2">
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">{cimkek.datum}</span>
          <Mezo
            type="date"
            name="datum"
            defaultValue={mai}
            className={MEZO}
            required
            allapot={allapot.allapot}
          />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">{cimkek.ertek}</span>
          <Mezo
            type="text"
            inputMode="decimal"
            name="ertek"
            className={`${MEZO} tabular-nums`}
            required
            allapot={allapot.allapot}
          />
        </label>
      </div>
      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
      <Uzenetsav {...allapot} />
    </form>
  );
}

export function ElszamolasUrlap({
  jogviszonyId,
  kezdete,
  vege,
  cimkek,
}: {
  jogviszonyId: string;
  kezdete: string;
  vege: string;
  cimkek: { kezdete: string; vege: string; gomb: string; folyamatban: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(elszamolastKeszitAction, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
      <div className="flex flex-wrap gap-2">
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">{cimkek.kezdete}</span>
          <Mezo
            type="date"
            name="kezdete"
            defaultValue={kezdete}
            className={MEZO}
            required
            allapot={allapot.allapot}
          />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">{cimkek.vege}</span>
          <Mezo
            type="date"
            name="vege"
            defaultValue={vege}
            className={MEZO}
            required
            allapot={allapot.allapot}
          />
        </label>
      </div>
      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
      <Uzenetsav {...allapot} />
    </form>
  );
}

export function KiadasUrlap({
  elszamolasId,
  esedekesseg,
  cimkek,
}: {
  elszamolasId: string;
  esedekesseg: string;
  cimkek: { hatarido: string; gomb: string; folyamatban: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(elszamolastKiad, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="elszamolasId" value={elszamolasId} />
      <label className="grid gap-1 text-xs">
        <span className="text-stone-500 dark:text-stone-400">{cimkek.hatarido}</span>
        <Mezo
          type="date"
          name="esedekesseg"
          defaultValue={esedekesseg}
          className={MEZO}
          required
          allapot={allapot.allapot}
        />
      </label>
      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
      <Uzenetsav {...allapot} />
    </form>
  );
}

export function ElbiralasUrlap({
  elszamolasId,
  cimkek,
}: {
  elszamolasId: string;
  cimkek: { sugo: string; elfogad: string; vitat: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(elszamolastElbiral, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="elszamolasId" value={elszamolasId} />
      <label className="grid gap-1 text-xs">
        <span className="text-stone-500 dark:text-stone-400">{cimkek.sugo}</span>
        <Szovegdoboz name="berloiUzenet" rows={2} className={MEZO} allapot={allapot.allapot} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="dontes"
          value="elfogadva"
          disabled={folyamatban}
          className={GOMB}
        >
          {cimkek.elfogad}
        </button>
        <button
          type="submit"
          name="dontes"
          value="vitatott"
          disabled={folyamatban}
          className="justify-self-start rounded border border-stone-300 px-4 py-2 text-sm font-medium disabled:opacity-60 dark:border-stone-700"
        >
          {cimkek.vitat}
        </button>
      </div>
      <Uzenetsav {...allapot} />
    </form>
  );
}
