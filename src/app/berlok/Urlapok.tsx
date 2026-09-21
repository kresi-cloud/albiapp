"use client";

import { useActionState } from "react";
import { Mezo as MegorzoMezo, type UrlapAllapot } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import {
  berloAdataitMenti,
  berlotHozzaad,
  berlotTorol,
  jogviszonytLezarAction,
  jogviszonytUjranyitAction,
  type Eredmeny,
} from "./actions";
import { MEZO, GOMB, APRO_GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

function Mezo({
  nev,
  cimke,
  ertek,
  allapot,
  tipus = "text",
  sugo,
}: {
  nev: string;
  cimke: string;
  ertek: string;
  allapot: UrlapAllapot;
  tipus?: string;
  sugo?: string;
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
      {sugo ? <span className="text-xs text-stone-500 dark:text-stone-400">{sugo}</span> : null}
    </label>
  );
}

export type BerloAdat = {
  id: string;
  nev: string;
  email: string;
  szuletesiHely: string;
  szuletesiIdo: string;
  anyjaNeve: string;
  lakcim: string;
  igazolvanySzam: string;
  telefon: string;
  /** Ki adta meg: a bérlő maga, vagy a bérbeadó helyette. */
  forrasa: "berlo" | "berbeado" | null;
  hianyzik: number;
};

/**
 * A szerződéshez kellő adatok. A bérbeadó napi használatához ezek nem kellenek,
 * ezért lenyitható: aki csak a befizetéseket nézi, ne lássa tele az oldalt.
 */
export function BerloAdatok({ berlo }: { berlo: BerloAdat }) {
  const [allapot, kuldes, folyamatban] = useActionState(berloAdataitMenti, KEZDETI);

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm text-stone-600 underline underline-offset-2 dark:text-stone-400">
        Szerződéshez szükséges adatok
        {berlo.hianyzik > 0 ? ` — még ${berlo.hianyzik} hiányzik` : " — megvannak"}
      </summary>

      {/*
        A forrás megmutatása nem formaság: ha a bérlő maga adta meg, az az
        érvényes, és a bérbeadó tudja, hogy nem a saját gépelését látja.
      */}
      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
        {berlo.forrasa === "berlo"
          ? "Ezeket a bérlő adta meg magáról."
          : berlo.forrasa === "berbeado"
            ? "Ezeket te írtad be. Ha a bérlő belép, felülírhatja a sajátjával."
            : "Még senki nem adta meg. A bérlő belépés után maga is kitöltheti."}
      </p>

      <form action={kuldes} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="jogviszonyBerloId" value={berlo.id} />
        <Mezo nev="nev" cimke="Név" ertek={berlo.nev} allapot={allapot.allapot} />
        <Mezo
          nev="email"
          cimke="E-mail"
          ertek={berlo.email}
          tipus="email"
          allapot={allapot.allapot}
        />
        <Mezo
          nev="szuletesiHely"
          cimke="Születési hely"
          ertek={berlo.szuletesiHely}
          allapot={allapot.allapot}
        />
        <Mezo
          nev="szuletesiIdo"
          cimke="Születési idő"
          ertek={berlo.szuletesiIdo}
          tipus="date"
          allapot={allapot.allapot}
        />
        <Mezo
          nev="anyjaNeve"
          cimke="Anyja neve"
          ertek={berlo.anyjaNeve}
          allapot={allapot.allapot}
        />
        <Mezo
          nev="igazolvanySzam"
          cimke="Igazolványszám"
          ertek={berlo.igazolvanySzam}
          allapot={allapot.allapot}
        />
        <Mezo
          nev="telefon"
          cimke="Telefonszám"
          ertek={berlo.telefon}
          tipus="tel"
          allapot={allapot.allapot}
        />
        <div className="sm:col-span-2 grid gap-3">
          <Mezo
            nev="lakcim"
            cimke="Állandó lakcím"
            ertek={berlo.lakcim}
            allapot={allapot.allapot}
          />
          <button type="submit" disabled={folyamatban} className={GOMB}>
            {folyamatban ? "Mentem…" : "Adatok mentése"}
          </button>
          <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
        </div>
      </form>
    </details>
  );
}

export function BerloHozzaadas({ jogviszonyId }: { jogviszonyId: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(berlotHozzaad, KEZDETI);

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm text-stone-600 underline underline-offset-2 dark:text-stone-400">
        További bérlő hozzáadása
      </summary>
      <form action={kuldes} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
        <Mezo nev="nev" cimke="Név" ertek="" allapot={allapot.allapot} />
        <Mezo nev="email" cimke="E-mail" ertek="" tipus="email" allapot={allapot.allapot} />
        <div className="sm:col-span-2 grid gap-3">
          <button type="submit" disabled={folyamatban} className={GOMB}>
            {folyamatban ? "Hozzáadom…" : "Hozzáadás"}
          </button>
          <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
        </div>
      </form>
    </details>
  );
}

export function BerloTorles({ jogviszonyBerloId, nev }: { jogviszonyBerloId: string; nev: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(berlotTorol, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="jogviszonyBerloId" value={jogviszonyBerloId} />
      <button
        type="submit"
        disabled={folyamatban}
        className="justify-self-start text-xs text-stone-500 underline underline-offset-2 hover:text-rose-700 disabled:opacity-60 dark:text-stone-400"
      >
        {folyamatban ? "Leveszem…" : `${nev} levétele a jogviszonyról`}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

/**
 * A jogviszony lezárása nem csak állapotjelző: a záró hónap utáni előírásokat
 * törli, a záró hónapot pedig napra arányosítja. Ezért kérünk dátumot, nem
 * csak egy kattintást.
 */
export function JogviszonyLezaras({
  jogviszonyId,
  cimke,
  napCimke,
  gombCimke,
  sugo,
  maiNap,
}: {
  jogviszonyId: string;
  cimke: string;
  napCimke: string;
  gombCimke: string;
  sugo: string;
  maiNap: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(jogviszonytLezarAction, KEZDETI);

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm text-stone-600 underline underline-offset-2 dark:text-stone-400">
        {cimke}
      </summary>
      <form action={kuldes} className="mt-3 grid gap-3">
        <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
        <Mezo
          nev="vege"
          cimke={napCimke}
          ertek={maiNap}
          tipus="date"
          sugo={sugo}
          allapot={allapot.allapot}
        />
        <button type="submit" disabled={folyamatban} className={GOMB}>
          {folyamatban ? "…" : gombCimke}
        </button>
        <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
      </form>
    </details>
  );
}

/** Téves lezárás visszavonása: a jogviszony újra él, az előírások pótlódnak. */
export function JogviszonyUjranyitas({
  jogviszonyId,
  cimke,
}: {
  jogviszonyId: string;
  cimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(jogviszonytUjranyitAction, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
      <button type="submit" disabled={folyamatban} className={APRO_GOMB}>
        {folyamatban ? "…" : cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
