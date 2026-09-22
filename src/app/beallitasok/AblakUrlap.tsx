"use client";

import { useActionState } from "react";
import { beallitasokatMent, type MentesEredmeny } from "./actions";
import { GOMB, MEZO } from "@/components/urlap";

const KEZDETI: MentesEredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export function AblakUrlap({
  korabbiAblakNap,
  kesobbiAblakNap,
  bizonylatKeres,
  maxNap,
}: {
  korabbiAblakNap: number;
  kesobbiAblakNap: number;
  bizonylatKeres: boolean;
  maxNap: number;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(beallitasokatMent, KEZDETI);

  return (
    <form
      action={kuldes}
      className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <div>
        <h2 className="font-semibold">Párosítási időablak</h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Ennyi napon belül kötöm ugyanahhoz a havi előíráshoz a beérkezett
          befizetést. Ami az ablakon kívül érkezik, külön tételként jelenik meg.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Esedékesség előtt (nap)</span>
          <input
            id="korabbiAblakNap"
            name="korabbiAblakNap"
            type="number"
            inputMode="numeric"
            min={0}
            max={maxNap}
            defaultValue={korabbiAblakNap}
            className={`${MEZO} tabular-nums`}
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Esedékesség után (nap)</span>
          <input
            id="kesobbiAblakNap"
            name="kesobbiAblakNap"
            type="number"
            inputMode="numeric"
            min={0}
            max={maxNap}
            defaultValue={kesobbiAblakNap}
            className={`${MEZO} tabular-nums`}
            required
          />
        </label>
      </div>

      <div className="border-t border-stone-200 pt-3 dark:border-stone-800">
        <h2 className="font-semibold">Bizonylat vitás befizetésnél</h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Ha a te adatod és a bérlőé nem fedi egymást, kérhetjük mindkettőtöktől
          annak az egy utalásnak a bizonylatát: tőled a fogadó oldalit, a
          bérlőtől a küldő oldalit. Teljes bankszámlakivonatot soha nem kérünk,
          és nem is fogadunk el. Ha ezt nem szeretnéd, kapcsold ki: a vita
          attól még látszik, csak papírt nem kérünk hozzá. A már feltöltött
          bizonylatok a kikapcsolástól nem tűnnek el.
        </p>

        <label className="mt-3 flex items-start gap-2 text-sm">
          <input
            id="bizonylatKeres"
            name="bizonylatKeres"
            type="checkbox"
            defaultChecked={bizonylatKeres}
            className="mt-0.5"
          />
          <span className="font-medium">Kérjünk bizonylatot vitás tételnél</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={folyamatban}
        className={GOMB}
      >
        {folyamatban ? "Mentés…" : "Mentés"}
      </button>

      {allapot.allapot !== "ures" ? (
        <div
          className={`rounded border p-3 text-sm ${
            allapot.allapot === "hiba"
              ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
              : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
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
