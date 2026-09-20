"use client";

import { useActionState } from "react";
import { kivonatotFeltolt, type FeltoltesEredmeny } from "./actions";
import { GOMB, MEZO } from "@/components/urlap";

const KEZDETI: FeltoltesEredmeny = {
  allapot: "ures",
  uzenet: "",
  beolvasott: 0,
  kihagyott: 0,
  hibak: [],
};

export function KivonatFeltoltes({
  jogviszonyok,
}: {
  jogviszonyok: { id: string; cimke: string }[];
}) {
  const [allapot, kuldes, folyamatban] = useActionState(kivonatotFeltolt, KEZDETI);

  return (
    <form
      action={kuldes}
      className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <div>
        <h2 className="font-semibold">Kivonat feltöltése</h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          A bankod CSV-kivonatát várom. A fejlécet felismerem, a már beolvasott
          sorokat pedig nem veszem fel újra.
        </p>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Melyik jogviszonyhoz?</span>
        <select
          id="jogviszonyId"
          name="jogviszonyId"
          className={MEZO}
          required
        >
          {jogviszonyok.map((jogviszony) => (
            <option key={jogviszony.id} value={jogviszony.id}>
              {jogviszony.cimke}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Kivonatfájl</span>
        <input
          id="kivonat"
          name="kivonat"
          type="file"
          accept=".csv,text/csv,text/plain"
          className={MEZO}
          required
        />
      </label>

      <button
        type="submit"
        disabled={folyamatban}
        className={GOMB}
      >
        {folyamatban ? "Beolvasás…" : "Feltöltés"}
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
