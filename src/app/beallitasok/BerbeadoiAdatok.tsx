"use client";

import { useActionState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import { berbeadoiAdatokatMent, type MentesEredmeny } from "./actions";
import { GOMB, MEZO } from "@/components/urlap";

const KEZDETI: MentesEredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export type Adatok = {
  szuletesiHely: string;
  szuletesiIdo: string;
  anyjaNeve: string;
  lakcim: string;
  igazolvanySzam: string;
  adoazonosito: string;
  telefon: string;
  bankszamla: string;
  bank: string;
};

function Mezo({ nev, cimke, ertek, tipus = "text" }: { nev: string; cimke: string; ertek: string; tipus?: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{cimke}</span>
      <input name={nev} type={tipus} defaultValue={ertek} className={MEZO} />
    </label>
  );
}

export type AdatCimkek = {
  cim: string;
  sugo: string;
  mezo: Record<keyof Adatok, string>;
  gomb: string;
  folyamatban: string;
};

export function BerbeadoiAdatok({ adatok, cimkek }: { adatok: Adatok; cimkek: AdatCimkek }) {
  const [allapot, kuldes, folyamatban] = useActionState(berbeadoiAdatokatMent, KEZDETI);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <h2 className="font-semibold">{cimkek.cim}</h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{cimkek.sugo}</p>

      <form action={kuldes} className="mt-3 grid gap-3 sm:grid-cols-2">
        <Mezo nev="szuletesiHely" cimke={cimkek.mezo.szuletesiHely} ertek={adatok.szuletesiHely} />
        <Mezo
          nev="szuletesiIdo"
          cimke={cimkek.mezo.szuletesiIdo}
          ertek={adatok.szuletesiIdo}
          tipus="date"
        />
        <Mezo nev="anyjaNeve" cimke={cimkek.mezo.anyjaNeve} ertek={adatok.anyjaNeve} />
        <Mezo
          nev="igazolvanySzam"
          cimke={cimkek.mezo.igazolvanySzam}
          ertek={adatok.igazolvanySzam}
        />
        <Mezo nev="adoazonosito" cimke={cimkek.mezo.adoazonosito} ertek={adatok.adoazonosito} />
        <Mezo nev="telefon" cimke={cimkek.mezo.telefon} ertek={adatok.telefon} tipus="tel" />
        <Mezo nev="bank" cimke={cimkek.mezo.bank} ertek={adatok.bank} />
        <div className="grid gap-3 sm:col-span-2">
          <Mezo nev="lakcim" cimke={cimkek.mezo.lakcim} ertek={adatok.lakcim} />
          <Mezo nev="bankszamla" cimke={cimkek.mezo.bankszamla} ertek={adatok.bankszamla} />
          <button
            type="submit"
            disabled={folyamatban}
            className={GOMB}
          >
            {folyamatban ? cimkek.folyamatban : cimkek.gomb}
          </button>
          <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
        </div>
      </form>
    </section>
  );
}
