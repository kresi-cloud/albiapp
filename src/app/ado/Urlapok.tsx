"use client";

import { useActionState } from "react";
import { Mezo, Valaszto } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import { beszerzestRogzit, koltsegetRogzit, type Eredmeny } from "./actions";
import { MEZO, GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export function KoltsegUrlap({
  ingatlanok,
  fajtak,
  mai,
  cimkek,
}: {
  ingatlanok: { id: string; megnevezes: string }[];
  fajtak: { ertek: string; cimke: string }[];
  mai: string;
  cimkek: {
    ingatlan: string;
    fajta: string;
    datum: string;
    osszeg: string;
    osszegPelda: string;
    megnevezes: string;
    megnevezesPelda: string;
    gomb: string;
    folyamatban: string;
  };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(koltsegetRogzit, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">{cimkek.ingatlan}</span>
          <Valaszto name="ingatlanId" className={MEZO} required allapot={allapot.allapot}>
            {ingatlanok.map((ingatlan) => (
              <option key={ingatlan.id} value={ingatlan.id}>
                {ingatlan.megnevezes}
              </option>
            ))}
          </Valaszto>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">{cimkek.fajta}</span>
          <Valaszto name="fajta" className={MEZO} required allapot={allapot.allapot}>
            {fajtak.map((fajta) => (
              <option key={fajta.ertek} value={fajta.ertek}>
                {fajta.cimke}
              </option>
            ))}
          </Valaszto>
        </label>
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
          <span className="text-stone-500 dark:text-stone-400">{cimkek.osszeg}</span>
          <Mezo
            type="text"
            inputMode="numeric"
            name="osszegFt"
            placeholder={cimkek.osszegPelda}
            className={`${MEZO} tabular-nums`}
            required
            allapot={allapot.allapot}
          />
        </label>
      </div>
      <label className="grid gap-1 text-xs">
        <span className="text-stone-500 dark:text-stone-400">{cimkek.megnevezes}</span>
        <Mezo
          type="text"
          name="megnevezes"
          placeholder={cimkek.megnevezesPelda}
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

export function BeszerzesUrlap({
  ingatlanId,
  beszerzesiArFt,
  beszerzesDatuma,
  cimkek,
}: {
  ingatlanId: string;
  beszerzesiArFt: number | null;
  beszerzesDatuma: string | null;
  cimkek: {
    ar: string;
    arPelda: string;
    nap: string;
    gomb: string;
    folyamatban: string;
  };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(beszerzestRogzit, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="ingatlanId" value={ingatlanId} />
      <div className="flex flex-wrap gap-2">
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">{cimkek.ar}</span>
          <Mezo
            type="text"
            inputMode="numeric"
            name="beszerzesiArFt"
            defaultValue={beszerzesiArFt ? String(beszerzesiArFt) : ""}
            placeholder={cimkek.arPelda}
            className={`${MEZO} tabular-nums`}
            required
            allapot={allapot.allapot}
          />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">{cimkek.nap}</span>
          <Mezo
            type="date"
            name="beszerzesDatuma"
            defaultValue={beszerzesDatuma ?? ""}
            className={MEZO}
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
