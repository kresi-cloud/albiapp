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

export function BerbeadoiAdatok({ adatok }: { adatok: Adatok }) {
  const [allapot, kuldes, folyamatban] = useActionState(berbeadoiAdatokatMent, KEZDETI);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <h2 className="font-semibold">A te adataid a szerződéshez</h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        Ezek a szerződésbe és az igazolásokba kerülnek. A belépéshez egyik sem
        kell, és naplóba sem írjuk őket. A telefonszámodat a bérlő a
        hibabejelentésnél látja: veszélyhelyzetben az alkalmazás nem csörög.
      </p>

      <form action={kuldes} className="mt-3 grid gap-3 sm:grid-cols-2">
        <Mezo nev="szuletesiHely" cimke="Születési hely" ertek={adatok.szuletesiHely} />
        <Mezo nev="szuletesiIdo" cimke="Születési idő" ertek={adatok.szuletesiIdo} tipus="date" />
        <Mezo nev="anyjaNeve" cimke="Anyja neve" ertek={adatok.anyjaNeve} />
        <Mezo nev="igazolvanySzam" cimke="Igazolványszám" ertek={adatok.igazolvanySzam} />
        <Mezo nev="adoazonosito" cimke="Adóazonosító jel" ertek={adatok.adoazonosito} />
        <Mezo nev="telefon" cimke="Telefonszám" ertek={adatok.telefon} tipus="tel" />
        <Mezo nev="bank" cimke="Bank neve" ertek={adatok.bank} />
        <div className="grid gap-3 sm:col-span-2">
          <Mezo nev="lakcim" cimke="Állandó lakcím" ertek={adatok.lakcim} />
          <Mezo nev="bankszamla" cimke="Bankszámlaszám" ertek={adatok.bankszamla} />
          <button
            type="submit"
            disabled={folyamatban}
            className={GOMB}
          >
            {folyamatban ? "Mentem…" : "Mentés"}
          </button>
          <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
        </div>
      </form>
    </section>
  );
}
