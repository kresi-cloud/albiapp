"use client";

import { useActionState, useState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import type { Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import {
  lepesCimke,
  okNeve,
  OKOK,
  surgossegLeirasa,
  surgossegNeve,
  SURGOSSEGEK,
  teruletNeve,
  TERULETEK,
  VESZELYHELYZETI_TEENDOK,
  viseloNeve,
  type HibaAllapot,
  type HibaSurgosseg,
  type Javaslat,
  type ViseloFel,
} from "@/domain/hibabejelentes";
import { hibatBejelent, hibatLep, uzenetetKuld, viselotMent, type Eredmeny } from "./actions";
import { MEZO, GOMB, APRO_GOMB as HALVANY_GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

const VISELOK: ViseloFel[] = ["berbeado", "berlo", "megosztott"];

export function HibaBejelentes({
  jogviszonyok,
  nyelv = "hu",
}: {
  jogviszonyok: { id: string; cimke: string }[];
  nyelv?: Nyelv;
}) {
  const { sz, u } = szovegekNyelvvel(nyelv);
  const [allapot, kuldes, folyamatban] = useActionState(hibatBejelent, KEZDETI);
  const [surgosseg, setSurgosseg] = useState<HibaSurgosseg>("normal");

  if (jogviszonyok.length === 0) return null;

  return (
    <form action={kuldes} className="grid gap-3">
      {jogviszonyok.length === 1 ? (
        <input type="hidden" name="jogviszonyId" value={jogviszonyok[0].id} />
      ) : (
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{sz("hiba.urlap.berlemeny")}</span>
          <select name="jogviszonyId" className={MEZO} defaultValue={jogviszonyok[0].id}>
            {jogviszonyok.map((jogviszony) => (
              <option key={jogviszony.id} value={jogviszony.id}>
                {jogviszony.cimke}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{sz("hiba.urlap.targy")}</span>
        <input
          name="targy"
          className={MEZO}
          placeholder={sz("hiba.urlap.targy_pelda")}
          maxLength={120}
          required
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{sz("hiba.urlap.leiras")}</span>
        <textarea
          name="leiras"
          className={MEZO}
          rows={3}
          placeholder={sz("hiba.urlap.leiras_pelda")}
          required
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{sz("hiba.urlap.terulet")}</span>
        <select name="terulet" className={MEZO} defaultValue="berendezes">
          {TERULETEK.map((terulet) => (
            <option key={terulet} value={terulet}>
              {u(teruletNeve(terulet))}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="grid gap-1 text-sm">
        <legend className="font-medium">{sz("hiba.urlap.ok")}</legend>
        <p className="text-stone-600 dark:text-stone-400">{sz("hiba.urlap.ok_sugo")}</p>
        {OKOK.map((ok) => (
          <label key={ok} className="flex items-center gap-2">
            <input type="radio" name="ok" value={ok} defaultChecked={ok === "elhasznalodas"} />
            <span>{u(okNeve(ok))}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="grid gap-1 text-sm">
        <legend className="font-medium">{sz("hiba.urlap.surgosseg")}</legend>
        {SURGOSSEGEK.map((fokozat) => (
          <label key={fokozat} className="flex items-start gap-2">
            <input
              type="radio"
              name="surgosseg"
              value={fokozat}
              className="mt-1"
              checked={surgosseg === fokozat}
              onChange={() => setSurgosseg(fokozat)}
            />
            <span>
              <span className="font-medium">{u(surgossegNeve(fokozat))}</span>
              <span className="block text-stone-600 dark:text-stone-400">
                {u(surgossegLeirasa(fokozat))}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {surgosseg === "veszhelyzet" ? (
        <div className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <p className="font-medium">{sz("hiba.urlap.veszely_cim")}</p>
          <ul className="mt-1 list-disc pl-5">
            {VESZELYHELYZETI_TEENDOK.map((sor) => (
              <li key={sor.kulcs}>{u(sor)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? sz("hiba.urlap.kuldom") : sz("hiba.urlap.kuldes")}
      </button>

      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function AllapotLepesek({
  hibaId,
  lepesek,
  nyelv = "hu",
}: {
  hibaId: string;
  lepesek: HibaAllapot[];
  nyelv?: Nyelv;
}) {
  const { u } = szovegekNyelvvel(nyelv);
  const [allapot, kuldes, folyamatban] = useActionState(hibatLep, KEZDETI);

  if (lepesek.length === 0) return null;

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="hibaId" value={hibaId} />
      <div className="flex flex-wrap gap-2">
        {lepesek.map((lepes) => (
          <button
            key={lepes}
            type="submit"
            name="cel"
            value={lepes}
            disabled={folyamatban}
            className={HALVANY_GOMB}
          >
            {u(lepesCimke(lepes))}
          </button>
        ))}
      </div>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function ViseloUrlap({
  hibaId,
  jelenlegi,
  javaslat,
  nyelv = "hu",
}: {
  hibaId: string;
  jelenlegi: ViseloFel | null;
  javaslat: Javaslat;
  nyelv?: Nyelv;
}) {
  const { sz, u } = szovegekNyelvvel(nyelv);
  const [allapot, kuldes, folyamatban] = useActionState(viselotMent, KEZDETI);

  return (
    <form
      action={kuldes}
      className="mt-3 grid gap-2 border-t border-stone-200 pt-3 dark:border-stone-800"
    >
      <input type="hidden" name="hibaId" value={hibaId} />
      <p className="text-sm font-medium">{sz("hiba.urlap.viselo")}</p>
      <p className="text-sm text-stone-600 dark:text-stone-400">{u(javaslat.indoklas)}</p>
      <label className="grid gap-1 text-sm">
        <span className="sr-only">{sz("hiba.urlap.viselo")}</span>
        <select
          name="viseloFel"
          className={MEZO}
          defaultValue={jelenlegi ?? javaslat.fel ?? ""}
          aria-label={sz("hiba.urlap.viselo")}
        >
          <option value="">{sz("hiba.urlap.viselo_nincs")}</option>
          {VISELOK.map((fel) => (
            <option key={fel} value={fel}>
              {u(viseloNeve(fel))}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={folyamatban} className={`${HALVANY_GOMB} justify-self-start`}>
        {folyamatban ? sz("hiba.urlap.mentem") : sz("hiba.urlap.rogzitem")}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function UzenetUrlap({ hibaId, nyelv = "hu" }: { hibaId: string; nyelv?: Nyelv }) {
  const { sz } = szovegekNyelvvel(nyelv);
  const [allapot, kuldes, folyamatban] = useActionState(uzenetetKuld, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="hibaId" value={hibaId} />
      <label className="grid gap-1 text-sm">
        <span className="sr-only">{sz("hiba.urlap.uzenet")}</span>
        <textarea
          name="szoveg"
          rows={2}
          className={MEZO}
          placeholder={sz("hiba.urlap.uzenet_pelda")}
          aria-label={sz("hiba.urlap.uzenet")}
        />
      </label>
      <button type="submit" disabled={folyamatban} className={`${HALVANY_GOMB} justify-self-start`}>
        {folyamatban ? sz("hiba.urlap.kuldom") : sz("hiba.urlap.uzenet_kuldes")}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
