"use client";

import { useActionState } from "react";
import { Mezo as MegorzoMezo, type UrlapAllapot } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import { GOMB, MEZO } from "@/components/urlap";
import { sajatAdatokatMent, adatkerestKihagy, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export type AdatCimkek = {
  nev: string;
  szuletesiHely: string;
  szuletesiIdo: string;
  anyjaNeve: string;
  lakcim: string;
  igazolvanySzam: string;
  telefon: string;
  gomb: string;
  kesobb: string;
};

export type AdatKezdoertekek = {
  nev: string;
  szuletesiHely: string;
  szuletesiIdo: string;
  anyjaNeve: string;
  lakcim: string;
  igazolvanySzam: string;
  telefon: string;
};

/**
 * A bérlő saját adatlapja. A "most kihagyom" szándékosan ott van: aki épp
 * meghívót kapott, ne azzal találkozzon először, hogy az anyja nevét kell
 * begépelnie, mielőtt megnézhetné, mit kell fizetnie.
 */
export function SajatAdatok({
  cimkek,
  ertekek,
  kihagyhato,
}: {
  cimkek: AdatCimkek;
  ertekek: AdatKezdoertekek;
  kihagyhato: boolean;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(sajatAdatokatMent, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-3">
      <input type="hidden" name="vissza" value="/berlo" />
      <Mezo nev="nev" cimke={cimkek.nev} ertek={ertekek.nev} kotelezo allapot={allapot.allapot} />
      <Mezo
        nev="szuletesiHely"
        cimke={cimkek.szuletesiHely}
        ertek={ertekek.szuletesiHely}
        allapot={allapot.allapot}
      />
      <Mezo
        nev="szuletesiIdo"
        cimke={cimkek.szuletesiIdo}
        ertek={ertekek.szuletesiIdo}
        tipus="date"
        allapot={allapot.allapot}
      />
      <Mezo
        nev="anyjaNeve"
        cimke={cimkek.anyjaNeve}
        ertek={ertekek.anyjaNeve}
        allapot={allapot.allapot}
      />
      <Mezo nev="lakcim" cimke={cimkek.lakcim} ertek={ertekek.lakcim} allapot={allapot.allapot} />
      <Mezo
        nev="igazolvanySzam"
        cimke={cimkek.igazolvanySzam}
        ertek={ertekek.igazolvanySzam}
        allapot={allapot.allapot}
      />
      <Mezo
        nev="telefon"
        cimke={cimkek.telefon}
        ertek={ertekek.telefon}
        tipus="tel"
        allapot={allapot.allapot}
      />

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={folyamatban} className={GOMB}>
          {folyamatban ? "…" : cimkek.gomb}
        </button>
        {kihagyhato ? (
          <button
            type="submit"
            formAction={adatkerestKihagy}
            className="text-sm text-stone-500 underline underline-offset-2 dark:text-stone-400"
          >
            {cimkek.kesobb}
          </button>
        ) : null}
      </div>

      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

function Mezo({
  nev,
  cimke,
  ertek,
  allapot,
  tipus = "text",
  kotelezo = false,
}: {
  nev: string;
  cimke: string;
  ertek: string;
  allapot: UrlapAllapot;
  tipus?: string;
  kotelezo?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{cimke}</span>
      <MegorzoMezo
        id={`sajat-${nev}`}
        type={tipus}
        name={nev}
        defaultValue={ertek}
        required={kotelezo}
        allapot={allapot}
        className={MEZO}
      />
    </label>
  );
}
