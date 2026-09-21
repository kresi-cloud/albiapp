"use client";

import { useActionState } from "react";
import { Mezo } from "@/components/megorzo";
import { beallitasokatMent, type MentesEredmeny } from "./actions";
import { GOMB, MEZO } from "@/components/urlap";

const KEZDETI: MentesEredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export function AblakUrlap({
  korabbiAblakNap,
  kesobbiAblakNap,
  bizonylatKeres,
  maxNap,
  cimkek,
}: {
  korabbiAblakNap: number;
  kesobbiAblakNap: number;
  bizonylatKeres: boolean;
  maxNap: number;
  cimkek: {
    ablakCim: string;
    ablakSugo: string;
    elotte: string;
    utana: string;
    bizonylatCim: string;
    bizonylatSugo: string;
    bizonylatKapcsolo: string;
    gomb: string;
    folyamatban: string;
  };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(beallitasokatMent, KEZDETI);

  return (
    <form
      action={kuldes}
      className="grid gap-3 rounded-kartya border border-keret bg-felulet p-4"
    >
      <div>
        <h2 className="font-semibold">{cimkek.ablakCim}</h2>
        <p className="text-sm text-halvany">{cimkek.ablakSugo}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.elotte}</span>
          <Mezo
            id="korabbiAblakNap"
            name="korabbiAblakNap"
            type="number"
            inputMode="numeric"
            min={0}
            max={maxNap}
            defaultValue={korabbiAblakNap}
            className={`${MEZO} tabular-nums`}
            required
            allapot={allapot.allapot}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.utana}</span>
          <Mezo
            id="kesobbiAblakNap"
            name="kesobbiAblakNap"
            type="number"
            inputMode="numeric"
            min={0}
            max={maxNap}
            defaultValue={kesobbiAblakNap}
            className={`${MEZO} tabular-nums`}
            required
            allapot={allapot.allapot}
          />
        </label>
      </div>

      <div className="border-t border-keret pt-3">
        <h2 className="font-semibold">{cimkek.bizonylatCim}</h2>
        <p className="text-sm text-halvany">{cimkek.bizonylatSugo}</p>

        <label className="mt-3 flex items-start gap-2 text-sm">
          <input
            id="bizonylatKeres"
            name="bizonylatKeres"
            type="checkbox"
            defaultChecked={bizonylatKeres}
            className="mt-0.5"
          />
          <span className="font-medium">{cimkek.bizonylatKapcsolo}</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={folyamatban}
        className={GOMB}
      >
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>

      {allapot.allapot !== "ures" ? (
        <div
          className={`rounded border p-3 text-sm ${
            allapot.allapot === "hiba"
              ? "border-gond-keret bg-gond-lap text-gond"
              : "border-rendben-keret bg-rendben-lap text-rendben"
          }`}
        >
          <p>{allapot.uzenet}</p>
          {allapot.hibak.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {allapot.hibak.map((hiba) => (
                <li key={hiba}>{hiba}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
