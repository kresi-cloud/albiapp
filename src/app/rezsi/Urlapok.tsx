"use client";

import { useActionState } from "react";
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
  mertekegyseg,
  mai,
}: {
  merooraId: string;
  mertekegyseg: string;
  mai: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(oraallastRogzit, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="merooraId" value={merooraId} />
      <div className="flex flex-wrap gap-2">
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">Dátum</span>
          <input type="date" name="datum" defaultValue={mai} className={MEZO} required />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">Óraállás ({mertekegyseg})</span>
          <input
            type="text"
            inputMode="decimal"
            name="ertek"
            className={`${MEZO} tabular-nums`}
            required
          />
        </label>
      </div>
      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? "Rögzítés…" : "Óraállás rögzítése"}
      </button>
      <Uzenetsav {...allapot} />
    </form>
  );
}

export function ElszamolasUrlap({
  jogviszonyId,
  kezdete,
  vege,
}: {
  jogviszonyId: string;
  kezdete: string;
  vege: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(elszamolastKeszitAction, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
      <div className="flex flex-wrap gap-2">
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">Időszak kezdete</span>
          <input type="date" name="kezdete" defaultValue={kezdete} className={MEZO} required />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">Időszak vége</span>
          <input type="date" name="vege" defaultValue={vege} className={MEZO} required />
        </label>
      </div>
      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? "Számolás…" : "Elszámolás készítése"}
      </button>
      <Uzenetsav {...allapot} />
    </form>
  );
}

export function KiadasUrlap({
  elszamolasId,
  esedekesseg,
}: {
  elszamolasId: string;
  esedekesseg: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(elszamolastKiad, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="elszamolasId" value={elszamolasId} />
      <label className="grid gap-1 text-xs">
        <span className="text-stone-500 dark:text-stone-400">Fizetési határidő</span>
        <input
          type="date"
          name="esedekesseg"
          defaultValue={esedekesseg}
          className={MEZO}
          required
        />
      </label>
      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? "Kiadás…" : "Kiadom a bérlőnek"}
      </button>
      <Uzenetsav {...allapot} />
    </form>
  );
}

export function ElbiralasUrlap({ elszamolasId }: { elszamolasId: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(elszamolastElbiral, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="elszamolasId" value={elszamolasId} />
      <label className="grid gap-1 text-xs">
        <span className="text-stone-500 dark:text-stone-400">
          Ha vitatod, írd le, melyik tétellel van baj
        </span>
        <textarea name="berloiUzenet" rows={2} className={MEZO} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="dontes"
          value="elfogadva"
          disabled={folyamatban}
          className={GOMB}
        >
          Elfogadom
        </button>
        <button
          type="submit"
          name="dontes"
          value="vitatott"
          disabled={folyamatban}
          className="justify-self-start rounded border border-stone-300 px-4 py-2 text-sm font-medium disabled:opacity-60 dark:border-stone-700"
        >
          Vitatom
        </button>
      </div>
      <Uzenetsav {...allapot} />
    </form>
  );
}
