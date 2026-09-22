"use client";

import { useActionState, useState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import {
  LEPES_CIMKE,
  OK_NEVE,
  SURGOSSEG_LEIRAS,
  SURGOSSEG_NEVE,
  TERULET_NEVE,
  VESZELYHELYZETI_TEENDOK,
  VISELO_NEVE,
  type HibaAllapot,
  type HibaSurgosseg,
  type Ok,
  type Terulet,
} from "@/domain/hibabejelentes";
import { hibatBejelent, hibatLep, uzenetetKuld, viselotMent, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

const MEZO =
  "rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-950";
const GOMB =
  "justify-self-start rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900";
const HALVANY_GOMB =
  "rounded border border-stone-300 px-3 py-1.5 text-sm font-medium disabled:opacity-60 dark:border-stone-700";

const TERULETEK = Object.keys(TERULET_NEVE) as Terulet[];
const OKOK = Object.keys(OK_NEVE) as Ok[];
const SURGOSSEGEK = Object.keys(SURGOSSEG_NEVE) as HibaSurgosseg[];

export function HibaBejelentes({
  jogviszonyok,
}: {
  jogviszonyok: { id: string; cimke: string }[];
}) {
  const [allapot, kuldes, folyamatban] = useActionState(hibatBejelent, KEZDETI);
  const [surgosseg, setSurgosseg] = useState<HibaSurgosseg>("normal");

  if (jogviszonyok.length === 0) return null;

  return (
    <form action={kuldes} className="grid gap-3">
      {jogviszonyok.length === 1 ? (
        <input type="hidden" name="jogviszonyId" value={jogviszonyok[0].id} />
      ) : (
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Melyik bérlemény</span>
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
        <span className="font-medium">Mi a baj, egy mondatban</span>
        <input
          name="targy"
          className={MEZO}
          placeholder="Csöpög a mosogató csaptelepe"
          maxLength={120}
          required
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Részletek</span>
        <textarea
          name="leiras"
          className={MEZO}
          rows={3}
          placeholder="Mióta tart, mikor jelentkezik, mit próbáltatok már."
          required
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Mi romlott el</span>
        <select name="terulet" className={MEZO} defaultValue="berendezes">
          {TERULETEK.map((terulet) => (
            <option key={terulet} value={terulet}>
              {TERULET_NEVE[terulet]}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="grid gap-1 text-sm">
        <legend className="font-medium">Mitől romlott el</legend>
        <p className="text-stone-600 dark:text-stone-400">
          Ebből tudjuk megmondani, kit terhel a költség. Ha nem tudod, ne tippelj: azt is
          választhatod.
        </p>
        {OKOK.map((ok) => (
          <label key={ok} className="flex items-center gap-2">
            <input type="radio" name="ok" value={ok} defaultChecked={ok === "elhasznalodas"} />
            <span>{OK_NEVE[ok]}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="grid gap-1 text-sm">
        <legend className="font-medium">Mennyire sürgős</legend>
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
              <span className="font-medium">{SURGOSSEG_NEVE[fokozat]}</span>
              <span className="block text-stone-600 dark:text-stone-400">
                {SURGOSSEG_LEIRAS[fokozat]}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {surgosseg === "veszhelyzet" ? (
        <div className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <p className="font-medium">Amíg a bérbeadó ideér</p>
          <ul className="mt-1 list-disc pl-5">
            {VESZELYHELYZETI_TEENDOK.map((sor) => (
              <li key={sor}>{sor}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? "Küldöm…" : "Bejelentem"}
      </button>

      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function AllapotLepesek({
  hibaId,
  lepesek,
}: {
  hibaId: string;
  lepesek: HibaAllapot[];
}) {
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
            {LEPES_CIMKE[lepes]}
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
}: {
  hibaId: string;
  jelenlegi: string | null;
  javaslat: { fel: string | null; indoklas: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(viselotMent, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2 border-t border-stone-200 pt-3 dark:border-stone-800">
      <input type="hidden" name="hibaId" value={hibaId} />
      <p className="text-sm font-medium">Kit terhel a költség</p>
      <p className="text-sm text-stone-600 dark:text-stone-400">{javaslat.indoklas}</p>
      <label className="grid gap-1 text-sm">
        <span className="sr-only">Költségviselő</span>
        <select
          name="viseloFel"
          className={MEZO}
          defaultValue={jelenlegi ?? javaslat.fel ?? ""}
          aria-label="Költségviselő"
        >
          <option value="">Még nem döntöm el</option>
          {(Object.keys(VISELO_NEVE) as (keyof typeof VISELO_NEVE)[]).map((fel) => (
            <option key={fel} value={fel}>
              {VISELO_NEVE[fel]}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={folyamatban} className={HALVANY_GOMB + " justify-self-start"}>
        {folyamatban ? "Mentem…" : "Rögzítem"}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function UzenetUrlap({ hibaId }: { hibaId: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(uzenetetKuld, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="hibaId" value={hibaId} />
      <label className="grid gap-1 text-sm">
        <span className="sr-only">Üzenet</span>
        <textarea
          name="szoveg"
          rows={2}
          className={MEZO}
          placeholder="Írj a másik félnek: mikor érnek rá, mit hozzon a szerelő."
          aria-label="Üzenet"
        />
      </label>
      <button type="submit" disabled={folyamatban} className={HALVANY_GOMB + " justify-self-start"}>
        {folyamatban ? "Küldöm…" : "Üzenet küldése"}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
