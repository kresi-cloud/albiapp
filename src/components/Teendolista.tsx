import Link from "next/link";
import type { Surgosseg, TeendoSurgosseggel } from "@/domain/teendok";
import { datumNyelven, type Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { TeendoLezaras } from "./TeendoLezaras";

const CIMKE: Record<Surgosseg, string> = {
  lejart: "teendo.lejart",
  ma: "teendo.ma",
  kozeli: "teendo.kozeli",
  kesobbi: "teendo.kesobbi",
};

const STILUS: Record<Surgosseg, string> = {
  lejart: "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40",
  ma: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  kozeli: "border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900",
  kesobbi: "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900",
};

export function Teendolista({
  teendok,
  nyelv,
}: {
  teendok: TeendoSurgosseggel[];
  nyelv: Nyelv;
}) {
  const { sz, u } = szovegekNyelvvel(nyelv);

  if (teendok.length === 0) {
    return (
      <p className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
        {sz("teendo.nincs")}
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {teendok.map((teendo) => (
        <li
          key={teendo.kulcs}
          className={`rounded-lg border p-3 ${STILUS[teendo.surgosseg]}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium">{u(teendo.cim)}</span>
            <span className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {sz(CIMKE[teendo.surgosseg])} · {datumNyelven(teendo.esedekesseg, nyelv)}
            </span>
          </div>
          {teendo.leiras ? (
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {u(teendo.leiras)}
            </p>
          ) : null}
          <div className="flex flex-wrap items-baseline gap-4">
            {teendo.hivatkozas ? (
              <Link
                href={teendo.hivatkozas}
                className="mt-2 inline-block text-sm text-blue-700 underline underline-offset-2 dark:text-blue-400"
              >
                {sz("teendo.megnezem")}
              </Link>
            ) : null}
            {teendo.tarolt ? (
              <TeendoLezaras
                kulcs={teendo.kulcs}
                cimke={sz("teendo.kesz")}
                folyamatbanCimke={sz("teendo.lezarom")}
              />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
