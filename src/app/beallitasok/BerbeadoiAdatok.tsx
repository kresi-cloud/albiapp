"use client";

import { useActionState } from "react";
import { Mezo as MegorzoMezo, type UrlapAllapot } from "@/components/megorzo";
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

/**
 * A mező a közös megőrzőn megy, nem nyers `<input>`-en.
 *
 * Kilenc mezőről van szó, és a mentés el is tud bukni: egy elgépelt
 * adóazonosítóra vagy igazolványszámra a kiszolgáló nem ment semmit. A React a
 * művelet lefutása után visszaállítja az űrlapot, tehát nyers mezővel a
 * figyelmeztetés mellett mind a kilenc kiürült — az anyja neve és a
 * bankszámlaszám is —, és egyetlen rossz számjegy miatt mindent újra kellett
 * gépelni. Pont az az eset, amiért a `megorzo.tsx` van.
 */
function Mezo({
  nev,
  cimke,
  ertek,
  allapot,
  tipus = "text",
}: {
  nev: string;
  cimke: string;
  ertek: string;
  allapot: UrlapAllapot;
  tipus?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{cimke}</span>
      <MegorzoMezo
        name={nev}
        type={tipus}
        defaultValue={ertek}
        allapot={allapot}
        className={MEZO}
      />
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
    <section className="rounded-kartya border border-keret bg-felulet p-4">
      <h2 className="font-semibold">{cimkek.cim}</h2>
      <p className="mt-1 text-sm text-halvany">{cimkek.sugo}</p>

      <form action={kuldes} className="mt-3 grid gap-3 sm:grid-cols-2">
        <Mezo nev="szuletesiHely" cimke={cimkek.mezo.szuletesiHely} ertek={adatok.szuletesiHely} allapot={allapot.allapot} />
        <Mezo
          nev="szuletesiIdo"
          cimke={cimkek.mezo.szuletesiIdo}
          ertek={adatok.szuletesiIdo}
          tipus="date"
          allapot={allapot.allapot}
        />
        <Mezo nev="anyjaNeve" cimke={cimkek.mezo.anyjaNeve} ertek={adatok.anyjaNeve} allapot={allapot.allapot} />
        <Mezo
          nev="igazolvanySzam"
          cimke={cimkek.mezo.igazolvanySzam}
          ertek={adatok.igazolvanySzam}
          allapot={allapot.allapot}
        />
        <Mezo nev="adoazonosito" cimke={cimkek.mezo.adoazonosito} ertek={adatok.adoazonosito} allapot={allapot.allapot} />
        <Mezo
          nev="telefon"
          cimke={cimkek.mezo.telefon}
          ertek={adatok.telefon}
          tipus="tel"
          allapot={allapot.allapot}
        />
        <Mezo nev="bank" cimke={cimkek.mezo.bank} ertek={adatok.bank} allapot={allapot.allapot} />
        <div className="grid gap-3 sm:col-span-2">
          <Mezo nev="lakcim" cimke={cimkek.mezo.lakcim} ertek={adatok.lakcim} allapot={allapot.allapot} />
          <Mezo nev="bankszamla" cimke={cimkek.mezo.bankszamla} ertek={adatok.bankszamla} allapot={allapot.allapot} />
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
