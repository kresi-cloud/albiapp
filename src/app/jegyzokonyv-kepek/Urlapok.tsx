"use client";

import { useActionState } from "react";
import { Mezo, Szovegdoboz, Valaszto } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import { APRO_GOMB, GOMB, MEZO } from "@/components/urlap";
import { kepetElbiralAction, kepetFeltolt, kepetTorolAction, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export type FeltoltesCimkek = {
  nyito: string;
  megnevezes: string;
  megnevezesPelda: string;
  tetel: string;
  tetelNelkul: string;
  fajl: string;
  gomb: string;
  folyamatban: string;
};

/**
 * Új kép. A megnevezés nem formaság: fél évvel később senki nem fogja tudni,
 * melyik fal melyik szobában volt, és a kiköltözéskori párosítás is ezen
 * múlik.
 */
export function KepFeltoltes({
  jegyzokonyvId,
  tetelek,
  parjaId,
  parCimke,
  cimkek,
}: {
  jegyzokonyvId: string;
  tetelek: { id: string; megnevezes: string }[];
  parjaId?: string;
  parCimke?: string;
  cimkek: FeltoltesCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(kepetFeltolt, KEZDETI);

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm text-stone-600 underline underline-offset-2 dark:text-stone-400">
        {parCimke ?? cimkek.nyito}
      </summary>
      <form action={kuldes} className="mt-3 grid gap-3">
        <input type="hidden" name="jegyzokonyvId" value={jegyzokonyvId} />
        {parjaId ? <input type="hidden" name="parjaId" value={parjaId} /> : null}

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.megnevezes}</span>
          <Mezo
            name="megnevezes"
            className={MEZO}
            placeholder={cimkek.megnevezesPelda}
            maxLength={120}
            allapot={allapot.allapot}
          />
        </label>

        {tetelek.length > 0 && !parjaId ? (
          <label className="grid gap-1 text-sm">
            <span className="font-medium">{cimkek.tetel}</span>
            <Valaszto name="tetelId" className={MEZO} allapot={allapot.allapot}>
              <option value="">{cimkek.tetelNelkul}</option>
              {tetelek.map((tetel) => (
                <option key={tetel.id} value={tetel.id}>
                  {tetel.megnevezes}
                </option>
              ))}
            </Valaszto>
          </label>
        ) : null}

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.fajl}</span>
          {/*
            A fájlmező szándékosan nem a megőrzős mezőkön megy: a böngésző
            biztonsági okból nem engedi programból kitölteni. A `capture`
            nélkül a telefon a galériát is felkínálja, nem csak a kamerát —
            a bérbeadó jellemzően már a helyszínen lefotózta.
          */}
          <input
            type="file"
            name="kep"
            accept="image/jpeg,image/png,image/webp"
            className={MEZO}
            required
          />
        </label>

        <button type="submit" disabled={folyamatban} className={GOMB}>
          {folyamatban ? cimkek.folyamatban : cimkek.gomb}
        </button>
        <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
      </form>
    </details>
  );
}

export type ElbiralasCimkek = {
  megerosit: string;
  kifogasol: string;
  kifogasSzovege: string;
  kifogasPelda: string;
};

/**
 * A másik fél nyilatkozata. Két gomb, egy űrlap: a kifogás szövege ugyanide
 * tartozik, mert indoklás nélküli kifogásból a másik fél nem tud kiindulni.
 */
export function KepElbiralas({ kepId, cimkek }: { kepId: string; cimkek: ElbiralasCimkek }) {
  const [allapot, kuldes, folyamatban] = useActionState(kepetElbiralAction, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="kepId" value={kepId} />
      <button
        type="submit"
        name="dontes"
        value="megerosites"
        disabled={folyamatban}
        className={GOMB}
      >
        {cimkek.megerosit}
      </button>
      <details>
        <summary className="cursor-pointer text-xs text-stone-600 underline underline-offset-2 dark:text-stone-400">
          {cimkek.kifogasol}
        </summary>
        <label className="mt-2 grid gap-1 text-xs">
          <span>{cimkek.kifogasSzovege}</span>
          <Szovegdoboz
            name="kifogas"
            rows={2}
            className={MEZO}
            placeholder={cimkek.kifogasPelda}
            allapot={allapot.allapot}
          />
        </label>
        <button
          type="submit"
          name="dontes"
          value="kifogas"
          disabled={folyamatban}
          className={`${APRO_GOMB} mt-2`}
        >
          {cimkek.kifogasol}
        </button>
      </details>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function KepTorles({ kepId, cimke }: { kepId: string; cimke: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(kepetTorolAction, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-1">
      <input type="hidden" name="kepId" value={kepId} />
      <button
        type="submit"
        disabled={folyamatban}
        className="justify-self-start text-xs text-stone-500 underline underline-offset-2 hover:text-rose-700 disabled:opacity-60 dark:text-stone-400"
      >
        {cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
