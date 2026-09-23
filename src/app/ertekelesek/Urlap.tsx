"use client";

import { useActionState } from "react";
import { LEGKISEBB_PONT, LEGNAGYOBB_PONT } from "@/domain/ertekeles";
import { Szovegdoboz, Valasztogomb, useMegorzottErtek, type UrlapAllapot } from "@/components/megorzo";
import { GOMB, MEZO } from "@/components/urlap";
import { ertekelestIr, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

const PONTOK = Array.from(
  { length: LEGNAGYOBB_PONT - LEGKISEBB_PONT + 1 },
  (_, eltolas) => LEGKISEBB_PONT + eltolas,
);

export type Cimkek = {
  cim: string;
  modosithato: string;
  szovegCimke: string;
  szovegSugo: string;
  gomb: string;
  folyamatban: string;
};

/**
 * A saját értékelés űrlapja.
 *
 * A pontok rádiógombok, nem legördülő: öt lehetőség mellett a legördülő két
 * koppintás, és telefonon a választólista eltakarja a kérdést, amire válaszol.
 * A szöveg a `Szovegdoboz`-on megy, tehát egy elutasított mentés nem viszi el.
 */
export function ErtekelesUrlap({
  jogviszonyId,
  masikFelId,
  szempontok,
  meglevoSzoveg,
  meglevoPontok,
  cimkek,
}: {
  jogviszonyId: string;
  masikFelId: string;
  szempontok: { kulcs: string; cimke: string }[];
  meglevoSzoveg: string;
  meglevoPontok: Record<string, number>;
  cimkek: Cimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(ertekelestIr, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-3">
      <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
      <input type="hidden" name="masikFelId" value={masikFelId} />

      <p className="text-sm font-medium">{cimkek.cim}</p>
      <p className="text-sm text-halvany">{cimkek.modosithato}</p>

      {szempontok.map((szempont) => (
        <Szempont
          key={szempont.kulcs}
          kulcs={szempont.kulcs}
          cimke={szempont.cimke}
          kezdo={meglevoPontok[szempont.kulcs] ?? 0}
          allapot={allapot.allapot}
        />
      ))}

      <label className="grid gap-1 text-sm font-medium">
        {cimkek.szovegCimke}
        <Szovegdoboz
          allapot={allapot.allapot}
          name="szoveg"
          rows={4}
          defaultValue={meglevoSzoveg}
          className={MEZO}
        />
        <span className="font-normal text-halvany">{cimkek.szovegSugo}</span>
      </label>

      {allapot.uzenet ? (
        <p
          className={`rounded border p-2 text-sm ${
            allapot.allapot === "hiba"
              ? "border-gond-keret bg-gond-lap text-gond"
              : "border-rendben-keret bg-rendben-lap text-rendben"
          }`}
        >
          {allapot.uzenet}
        </p>
      ) : null}

      <button type="submit" className={GOMB} disabled={folyamatban}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
    </form>
  );
}

/**
 * Egy szempont öt gombja.
 *
 * Saját komponens, mert a megőrzés horoggal megy, horgot pedig nem lehet
 * ciklusban hívni. A pont ugyanúgy megmarad egy elutasított mentés után, mint
 * a szöveg: aki három szempontot végigkattintott, ne kezdje elölről azért,
 * mert a magyarázat lemaradt.
 */
function Szempont({
  kulcs,
  cimke,
  kezdo,
  allapot,
}: {
  kulcs: string;
  cimke: string;
  kezdo: number;
  allapot: UrlapAllapot;
}) {
  const [ertek, allit] = useMegorzottErtek(allapot, kezdo === 0 ? "" : String(kezdo));

  return (
    <fieldset className="grid gap-1">
      <legend className="text-sm font-medium">{cimke}</legend>
      <div className="flex flex-wrap gap-2">
        {PONTOK.map((pont) => (
          <label
            key={pont}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded border border-keret px-3 text-base has-checked:border-keret-eros has-checked:bg-felulet-halk"
          >
            <Valasztogomb
              name={`pont_${kulcs}`}
              value={String(pont)}
              jelolt={ertek === String(pont)}
              onChange={() => allit(String(pont))}
              className="sr-only"
            />
            {pont}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
