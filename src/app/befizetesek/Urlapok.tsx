"use client";

import { useActionState } from "react";
import { Mezo as MegorzoMezo, type UrlapAllapot } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import { APRO_GOMB, CIMKE, GOMB, MEZO, VISSZAVONO_GOMB } from "@/components/urlap";
import { beerkezestRogzit, beerkezestTorol, nemErkezettMeg, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

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
    <label className="grid gap-1">
      <span className={CIMKE}>{cimke}</span>
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

export type BeerkezesCimkek = {
  nyito: string;
  datum: string;
  osszeg: string;
  kozlemeny: string;
  gomb: string;
  nem: string;
  visszavon: string;
};

/**
 * A bérbeadó saját oldala: mikor mennyi érkezett. Az összeg és a dátum az
 * előírásból van előtöltve, mert a leggyakoribb eset az, hogy pontosan annyi
 * jött — de felülírható, mert az egyeztetés éppen az eltérésről szól.
 *
 * A nyitósor gombnak van kiszerelve, nem aláhúzott szövegnek: ez a lap fő
 * művelete, és telefonon a szöveges hivatkozás a legrosszabb célpont. A
 * `list-none` a böngésző saját kis háromszögét veszi le, ami egy gomb közepén
 * csak zavar.
 */
export function Beerkezes({
  jogviszonyId,
  eloirtTetelId,
  osszegFt,
  esedekesseg,
  cimkek,
}: {
  jogviszonyId: string;
  eloirtTetelId: string | null;
  osszegFt: number;
  esedekesseg: string;
  cimkek: BeerkezesCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(beerkezestRogzit, KEZDETI);

  return (
    <details className="mt-3">
      <summary className={`${GOMB} w-full list-none sm:w-auto`}>{cimkek.nyito}</summary>
      <form action={kuldes} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
        {eloirtTetelId ? (
          <input type="hidden" name="eloirtTetelId" value={eloirtTetelId} />
        ) : null}
        <Mezo
          nev="erkezesDatuma"
          cimke={cimkek.datum}
          ertek={esedekesseg}
          tipus="date"
          allapot={allapot.allapot}
        />
        <Mezo
          nev="osszegFt"
          cimke={cimkek.osszeg}
          ertek={String(osszegFt)}
          allapot={allapot.allapot}
        />
        <div className="grid gap-3 sm:col-span-2">
          <Mezo nev="kozlemeny" cimke={cimkek.kozlemeny} ertek="" allapot={allapot.allapot} />
          <button type="submit" disabled={folyamatban} className={GOMB}>
            {folyamatban ? "…" : cimkek.gomb}
          </button>
          <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
        </div>
      </form>
    </details>
  );
}

/** A másik lehetséges válasz: megnéztem, és nem jött meg. */
export function NemErkezett({
  eloirtTetelId,
  cimke,
}: {
  eloirtTetelId: string;
  cimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(nemErkezettMeg, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid justify-items-start gap-2">
      <input type="hidden" name="eloirtTetelId" value={eloirtTetelId} />
      <button type="submit" disabled={folyamatban} className={APRO_GOMB}>
        {folyamatban ? "…" : cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

/** Elgépelt rögzítés visszavonása. A bérlő adatához nem nyúl. */
export function BeerkezestVisszavon({
  igazolasId,
  cimke,
}: {
  igazolasId: string;
  cimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(beerkezestTorol, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid justify-items-start gap-2">
      <input type="hidden" name="igazolasId" value={igazolasId} />
      <button type="submit" disabled={folyamatban} className={VISSZAVONO_GOMB}>
        {folyamatban ? "…" : cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
