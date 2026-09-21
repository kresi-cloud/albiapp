"use client";

import { useActionState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import { ALAPERTELMEZETT_ELETTARTAM, ELETTARTAM_NAPOK } from "@/domain/betekinto";
import type { Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { GOMB, MEZO, APRO_GOMB } from "@/components/urlap";
import { betekintotAd, betekintotVon, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export function BetekintoUrlap({
  jogviszonyok,
  nyelv = "hu",
}: {
  jogviszonyok: { id: string; cimke: string }[];
  nyelv?: Nyelv;
}) {
  const { sz } = szovegekNyelvvel(nyelv);
  const [allapot, kuldes, folyamatban] = useActionState(betekintotAd, KEZDETI);

  if (jogviszonyok.length === 0) return null;

  return (
    <form action={kuldes} className="grid gap-3">
      {jogviszonyok.length === 1 ? (
        <input type="hidden" name="jogviszonyId" value={jogviszonyok[0].id} />
      ) : (
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{sz("betekinto.urlap.jogviszony")}</span>
          <select name="jogviszonyId" className={MEZO}>
            {jogviszonyok.map((jogviszony) => (
              <option key={jogviszony.id} value={jogviszony.id}>
                {jogviszony.cimke}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{sz("betekinto.urlap.cel")}</span>
        <input
          name="cel"
          className={MEZO}
          placeholder={sz("betekinto.urlap.cel_pelda")}
          required
        />
        <span className="text-xs text-stone-600 dark:text-stone-400">
          {sz("betekinto.urlap.cel_sugo")}
        </span>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{sz("betekinto.urlap.elettartam")}</span>
        <select name="napok" className={MEZO} defaultValue={String(ALAPERTELMEZETT_ELETTARTAM)}>
          {ELETTARTAM_NAPOK.map((napok) => (
            <option key={napok} value={napok}>
              {sz("betekinto.urlap.nap", { napok })}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="osszegetMutat"
          value="igen"
          defaultChecked
          className="mt-1"
        />
        <span>
          <span className="font-medium">{sz("betekinto.urlap.osszeg")}</span>
          <span className="block text-xs text-stone-600 dark:text-stone-400">
            {sz("betekinto.urlap.osszeg_sugo")}
          </span>
        </span>
      </label>

      <button type="submit" className={GOMB} disabled={folyamatban}>
        {sz("betekinto.urlap.gomb")}
      </button>

      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function VisszavonGomb({ id, cimke }: { id: string; cimke: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(betekintotVon, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={APRO_GOMB} disabled={folyamatban}>
        {cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
