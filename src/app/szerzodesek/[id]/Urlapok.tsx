"use client";

import { useActionState } from "react";
import { Mezo, Valaszto } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import {
  modultValt,
  parametereketMenti,
  szerzodestVeglegesit,
  veglegesitestVisszavon,
  type Eredmeny,
} from "../actions";
import { MEZO, GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export type ModulNezet = {
  kulcs: string;
  cim: string;
  kotelezo: boolean;
  bekapcsolva: boolean;
  miert: string;
  ellenjegyzes: "nincs" | "folyamatban" | "ellenjegyzett";
};

export type ParameterNezet = {
  kulcs: string;
  cimke: string;
  tipus: "szoveg" | "szam" | "penz" | "datum" | "valaszt";
  ertek: string;
  sugo?: string;
  modulCim: string;
  valaszthatok?: { ertek: string; cimke: string }[];
};

const ELLENJEGYZES_CIMKE: Record<string, string> = {
  nincs: "Ügyvédi ellenjegyzés még nincs",
  folyamatban: "Ellenjegyzés folyamatban",
  ellenjegyzett: "Ügyvéd által ellenjegyzett",
};

/** Modulkapcsoló. Külön űrlap modulonként, hogy egy kattintás egy döntés legyen. */
export function ModulValto({
  szerzodesId,
  modul,
  szerkesztheto,
}: {
  szerzodesId: string;
  modul: ModulNezet;
  szerkesztheto: boolean;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(modultValt, KEZDETI);

  return (
    <li className="border-t border-stone-200 py-3 first:border-0 first:pt-0 dark:border-stone-800">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">{modul.cim}</span>
        {modul.kotelezo ? (
          <span className="text-xs text-stone-500 dark:text-stone-400">kötelező</span>
        ) : szerkesztheto ? (
          <form action={kuldes}>
            <input type="hidden" name="szerzodesId" value={szerzodesId} />
            <input type="hidden" name="kulcs" value={modul.kulcs} />
            <button
              type="submit"
              disabled={folyamatban}
              className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-60 ${
                modul.bekapcsolva
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                  : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
              }`}
            >
              {modul.bekapcsolva ? "Benne van" : "Nincs benne"}
            </button>
          </form>
        ) : (
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {modul.bekapcsolva ? "benne van" : "nincs benne"}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{modul.miert}</p>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        {ELLENJEGYZES_CIMKE[modul.ellenjegyzes]}
      </p>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </li>
  );
}

export function ParameterUrlap({
  szerzodesId,
  parameterek,
  kelteHelye,
  kelte,
}: {
  szerzodesId: string;
  parameterek: ParameterNezet[];
  kelteHelye: string;
  kelte: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(parametereketMenti, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-4">
      <input type="hidden" name="szerzodesId" value={szerzodesId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Kelt helye</span>
          <Mezo
            name="kelteHelye"
            defaultValue={kelteHelye}
            className={MEZO}
            allapot={allapot.allapot}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Kelt napja</span>
          <Mezo
            name="kelte"
            type="date"
            defaultValue={kelte}
            className={MEZO}
            allapot={allapot.allapot}
          />
        </label>
      </div>

      {parameterek.map((parameter) => (
        <label key={parameter.kulcs} className="grid gap-1 text-sm">
          <span className="font-medium">{parameter.cimke}</span>
          {parameter.tipus === "valaszt" ? (
            <Valaszto
              name={`p_${parameter.kulcs}`}
              defaultValue={parameter.ertek}
              className={MEZO}
              allapot={allapot.allapot}
            >
              {(parameter.valaszthatok ?? []).map((lehetoseg) => (
                <option key={lehetoseg.ertek} value={lehetoseg.ertek}>
                  {lehetoseg.cimke}
                </option>
              ))}
            </Valaszto>
          ) : (
            <Mezo
              name={`p_${parameter.kulcs}`}
              type={parameter.tipus === "datum" ? "date" : parameter.tipus === "szoveg" ? "text" : "number"}
              inputMode={parameter.tipus === "szoveg" ? undefined : "numeric"}
              defaultValue={parameter.ertek}
              className={MEZO}
              allapot={allapot.allapot}
            />
          )}
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {parameter.modulCim}
            {parameter.sugo ? ` · ${parameter.sugo}` : ""}
          </span>
        </label>
      ))}

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? "Mentem…" : "Mentés és szöveg frissítése"}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function VeglegesitesUrlap({ szerzodesId }: { szerzodesId: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(szerzodestVeglegesit, KEZDETI);
  // Csak az adathiány engedi a "mégis" gombot. A nyugtázás hiánya is hiba, de
  // abból nem lehet felhatalmazás arra, hogy a hiányzó adatokat átugorjuk:
  // különben egy kipipálatlan jelölőnégyzet csendben átvinné a figyelmeztetésen.
  const hianyzik =
    allapot.allapot === "hiba" &&
    allapot.hibak.length > 0 &&
    !allapot.hibak.includes("azonossagEllenorizve");

  return (
    <form action={kuldes} className="grid gap-3">
      <input type="hidden" name="szerzodesId" value={szerzodesId} />
      {hianyzik ? <input type="hidden" name="megis" value="igen" /> : null}

      {/*
        Az alkalmazás nem tud személyazonosságot igazolni, tehát nem is úgy
        teszünk, mintha tudna. Amit tehetünk: aláírás előtt kimondjuk, és
        megkérjük a bérbeadót, hogy nyugtázza, tényleg megnézték egymás
        okmányát. Enélkül nem véglegesítünk.
      */}
      <label className="flex items-start gap-2 rounded border border-stone-300 p-3 text-sm dark:border-stone-700">
        <input
          id="azonossag-ellenorizve"
          type="checkbox"
          name="azonossagEllenorizve"
          value="igen"
          required
          className="mt-0.5"
        />
        <span>
          Megnéztük egymás fényképes igazolványát, és az abban álló adatok egyeznek
          azzal, ami a szerződésben szerepel.
        </span>
      </label>

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban
          ? "Véglegesítem…"
          : hianyzik
            ? "Véglegesítés a hiányzó adatok nélkül"
            : "Véglegesítés"}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function VisszavonasUrlap({ szerzodesId }: { szerzodesId: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(veglegesitestVisszavon, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-2">
      <input type="hidden" name="szerzodesId" value={szerzodesId} />
      <button
        type="submit"
        disabled={folyamatban}
        className="justify-self-start text-sm text-stone-600 underline underline-offset-2 disabled:opacity-60 dark:text-stone-400"
      >
        {folyamatban ? "Visszaállítom…" : "Vissza tervezetre"}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
