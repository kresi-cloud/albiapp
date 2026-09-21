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
}: {
  ingatlanok: { id: string; megnevezes: string }[];
  fajtak: { ertek: string; cimke: string }[];
  mai: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(koltsegetRogzit, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">Ingatlan</span>
          <Valaszto name="ingatlanId" className={MEZO} required allapot={allapot.allapot}>
            {ingatlanok.map((ingatlan) => (
              <option key={ingatlan.id} value={ingatlan.id}>
                {ingatlan.megnevezes}
              </option>
            ))}
          </Valaszto>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">Mi volt ez</span>
          <Valaszto name="fajta" className={MEZO} required allapot={allapot.allapot}>
            {fajtak.map((fajta) => (
              <option key={fajta.ertek} value={fajta.ertek}>
                {fajta.cimke}
              </option>
            ))}
          </Valaszto>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">Dátum</span>
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
          <span className="text-stone-500 dark:text-stone-400">Összeg</span>
          <Mezo
            type="text"
            inputMode="numeric"
            name="osszegFt"
            placeholder="pl. 45 000"
            className={`${MEZO} tabular-nums`}
            required
            allapot={allapot.allapot}
          />
        </label>
      </div>
      <label className="grid gap-1 text-xs">
        <span className="text-stone-500 dark:text-stone-400">Megnevezés</span>
        <Mezo
          type="text"
          name="megnevezes"
          placeholder="pl. Kazán karbantartás, számla 2026/114"
          className={MEZO}
          required
          allapot={allapot.allapot}
        />
      </label>
      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? "Rögzítés…" : "Költség rögzítése"}
      </button>
      <Uzenetsav {...allapot} />
    </form>
  );
}

export function BeszerzesUrlap({
  ingatlanId,
  beszerzesiArFt,
  beszerzesDatuma,
}: {
  ingatlanId: string;
  beszerzesiArFt: number | null;
  beszerzesDatuma: string | null;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(beszerzestRogzit, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="ingatlanId" value={ingatlanId} />
      <div className="flex flex-wrap gap-2">
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">Beszerzési ár</span>
          <Mezo
            type="text"
            inputMode="numeric"
            name="beszerzesiArFt"
            defaultValue={beszerzesiArFt ? String(beszerzesiArFt) : ""}
            placeholder="pl. 58 000 000"
            className={`${MEZO} tabular-nums`}
            required
            allapot={allapot.allapot}
          />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-stone-500 dark:text-stone-400">Vásárlás napja</span>
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
        {folyamatban ? "Mentés…" : "Mentés"}
      </button>
      <Uzenetsav {...allapot} />
    </form>
  );
}
