"use client";

import { useActionState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import { szerzodestKeszit, type Eredmeny as SzerzodesEredmeny } from "@/app/szerzodesek/actions";
import { igazolastKiallit, jegyzokonyvetKeszit, type Eredmeny } from "./actions";
import { MEZO, GOMB, HALVANY_GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };
const SZERZODES_KEZDETI: SzerzodesEredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export function UjSzerzodes({
  jogviszonyId,
  cimke,
  folyamatbanCimke,
}: {
  jogviszonyId: string;
  cimke: string;
  folyamatbanCimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(szerzodestKeszit, SZERZODES_KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
      <button type="submit" disabled={folyamatban} className={HALVANY_GOMB}>
        {folyamatban ? folyamatbanCimke : cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function UjJegyzokonyv({
  jogviszonyId,
  fajta,
  cimke,
  folyamatbanCimke,
}: {
  jogviszonyId: string;
  fajta: "birtokbaadas" | "visszaadas";
  cimke: string;
  folyamatbanCimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(jegyzokonyvetKeszit, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-2">
      <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
      <input type="hidden" name="fajta" value={fajta} />
      <button type="submit" disabled={folyamatban} className={HALVANY_GOMB}>
        {folyamatban ? folyamatbanCimke : cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

/** Az összeg már formázva jön a laptól: a nyelv ott van kézben. */
export type IdoszakValaszthato = { idoszak: string; cimke: string; osszeg: string };

export function UjIgazolas({
  jogviszonyBerloId,
  idoszakok,
  cimkek,
}: {
  jogviszonyBerloId: string;
  idoszakok: IdoszakValaszthato[];
  cimkek: {
    nincs: string;
    idoszak: string;
    idoszakSor: string;
    osszeg: string;
    osszegPelda: string;
    osszegSugo: string;
    cel: string;
    celAlap: string;
    mod: string;
    modAtutalas: string;
    modKeszpenz: string;
    modEgyeb: string;
    hely: string;
    gomb: string;
    folyamatban: string;
  };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(igazolastKiallit, KEZDETI);

  if (idoszakok.length === 0) {
    return (
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        {cimkek.nincs}
      </p>
    );
  }

  return (
    <form action={kuldes} className="mt-2 grid gap-3">
      <input type="hidden" name="jogviszonyBerloId" value={jogviszonyBerloId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.idoszak}</span>
          <select name="idoszak" className={MEZO} defaultValue={idoszakok[0].idoszak}>
            {idoszakok.map((sor) => (
              <option key={sor.idoszak} value={sor.idoszak}>
                {cimkek.idoszakSor
                  .replace("{honap}", sor.cimke)
                  .replace("{osszeg}", sor.osszeg)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.osszeg}</span>
          <input
            name="osszegFt"
            inputMode="numeric"
            placeholder={cimkek.osszegPelda}
            className={MEZO}
          />
          <span className="text-xs text-stone-500 dark:text-stone-400">{cimkek.osszegSugo}</span>
        </label>

        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="font-medium">{cimkek.cel}</span>
          {/*
            A cél szövege a magyar igazolásba kerül, ezért az alapértéket is a
            szótár magyar sora adja, angol felületen is.
          */}
          <input name="cel" defaultValue={cimkek.celAlap} className={MEZO} required />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.mod}</span>
          <select name="teljesitesModja" className={MEZO} defaultValue="atutalas">
            <option value="atutalas">{cimkek.modAtutalas}</option>
            <option value="keszpenz">{cimkek.modKeszpenz}</option>
            <option value="egyeb">{cimkek.modEgyeb}</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.hely}</span>
          <input name="kiallitasHelye" className={MEZO} />
        </label>
      </div>

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
