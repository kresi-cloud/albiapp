"use client";

import { useActionState } from "react";
import { Mezo as MegorzoMezo, Valaszto } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import { GOMB, MEZO } from "@/components/urlap";
import { FIZETESI_NAP_MAX, REZSI_MODOK } from "@/domain/berlemeny";
import { ingatlantFelvesz, jogviszonytInditAction, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = {
  allapot: "ures",
  uzenet: "",
  hibak: [],
  figyelmeztetesek: [],
};

export type IngatlanCimkek = {
  megnevezes: string;
  megnevezesSugo: string;
  cim: string;
  cimSugo: string;
  alapterulet: string;
  helyrajzi: string;
  energetikai: string;
  kozosKoltseg: string;
  beszerzesiAr: string;
  beszerzesDatuma: string;
  adozasSugo: string;
  gomb: string;
  figyelem: string;
};

export type JogviszonyCimkek = {
  sugo: string;
  ingatlan: string;
  kezdete: string;
  dij: string;
  kozosKoltseg: string;
  kaucio: string;
  fizetesiNap: string;
  rezsi: string;
  rezsiModok: Record<string, string>;
  atalany: string;
  berlo: string;
  berloEmail: string;
  berloSugo: string;
  gomb: string;
  figyelem: string;
};

export function IngatlanUrlap({ cimkek }: { cimkek: IngatlanCimkek }) {
  const [allapot, kuldes, folyamatban] = useActionState(ingatlantFelvesz, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-3">
      <Mezo
        nev="megnevezes"
        cimke={cimkek.megnevezes}
        sugo={cimkek.megnevezesSugo}
        allapot={allapot}
        kotelezo
      />
      <Mezo
        nev="cim"
        cimke={cimkek.cim}
        sugo={cimkek.cimSugo}
        allapot={allapot}
        kotelezo
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Mezo
          nev="alapteruletM2"
          cimke={cimkek.alapterulet}
          tipus="number"
        allapot={allapot}
      />
        <Mezo
          nev="kozosKoltsegFt"
          cimke={cimkek.kozosKoltseg}
          tipus="number"
          allapot={allapot}
        />
      </div>
      <Mezo nev="helyrajziSzam" cimke={cimkek.helyrajzi}
        allapot={allapot}
      />
      <Mezo nev="energetikaiAzonosito" cimke={cimkek.energetikai}
        allapot={allapot}
      />

      <fieldset className="grid gap-3 rounded border border-stone-200 p-3 dark:border-stone-800">
        <legend className="px-1 text-xs text-stone-500 dark:text-stone-400">
          {cimkek.adozasSugo}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Mezo
            nev="beszerzesiArFt"
            cimke={cimkek.beszerzesiAr}
            tipus="number"
            allapot={allapot}
          />
          <Mezo nev="beszerzesDatuma" cimke={cimkek.beszerzesDatuma} tipus="date"
        allapot={allapot}
      />
        </div>
      </fieldset>

      <button type="submit" className={GOMB} disabled={folyamatban}>
        {folyamatban ? "…" : cimkek.gomb}
      </button>

      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} />
      <Figyelmeztetesek cimke={cimkek.figyelem} sorok={allapot.figyelmeztetesek} />
    </form>
  );
}

export function JogviszonyUrlap({
  cimkek,
  ingatlanok,
}: {
  cimkek: JogviszonyCimkek;
  ingatlanok: { id: string; megnevezes: string }[];
}) {
  const [allapot, kuldes, folyamatban] = useActionState(jogviszonytInditAction, KEZDETI);

  if (ingatlanok.length === 0) return null;

  return (
    <form action={kuldes} className="grid gap-3">
      <p className="text-sm text-stone-600 dark:text-stone-400">{cimkek.sugo}</p>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.ingatlan}</span>
        <Valaszto name="ingatlanId" className={MEZO} allapot={allapot.allapot}>
          {ingatlanok.map((ingatlan) => (
            <option key={ingatlan.id} value={ingatlan.id}>
              {ingatlan.megnevezes}
            </option>
          ))}
        </Valaszto>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Mezo
          nev="kezdete"
          cimke={cimkek.kezdete}
          tipus="date"
          allapot={allapot}
          kotelezo
        />
        <Mezo
          nev="fizetesiNap"
          cimke={cimkek.fizetesiNap}
          tipus="number"
          alap="5"
          min={1}
          max={FIZETESI_NAP_MAX}
          allapot={allapot}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Mezo
          nev="berletiDijFt"
          cimke={cimkek.dij}
          tipus="number"
          allapot={allapot}
          kotelezo
        />
        <Mezo
          nev="kozosKoltsegFt"
          cimke={cimkek.kozosKoltseg}
          tipus="number"
          allapot={allapot}
        />
      </div>

      <Mezo
        nev="kaucioFt"
        cimke={cimkek.kaucio}
        tipus="number"
        allapot={allapot}
      />

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.rezsi}</span>
        <Valaszto
          name="rezsiElszamolas"
          className={MEZO}
          defaultValue={REZSI_MODOK[0]}
          allapot={allapot.allapot}
        >
          {REZSI_MODOK.map((mod) => (
            <option key={mod} value={mod}>
              {cimkek.rezsiModok[mod]}
            </option>
          ))}
        </Valaszto>
      </label>

      <Mezo
        nev="rezsiAtalanyFt"
        cimke={cimkek.atalany}
        tipus="number"
        allapot={allapot}
      />

      <Mezo
        nev="berloNeve"
        cimke={cimkek.berlo}
        sugo={cimkek.berloSugo}
        allapot={allapot}
        kotelezo
      />
      <Mezo nev="berloEmail" cimke={cimkek.berloEmail} tipus="email"
        allapot={allapot}
      />

      <button type="submit" className={GOMB} disabled={folyamatban}>
        {folyamatban ? "…" : cimkek.gomb}
      </button>

      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} />
      <Figyelmeztetesek cimke={cimkek.figyelem} sorok={allapot.figyelmeztetesek} />
    </form>
  );
}

/**
 * Amit elmentettünk, de szólunk róla. Külön a hibától és külön a sikertől:
 * a mentés megtörtént, és a bérbeadó ettől még tudja meg, minek mi lesz a
 * következménye.
 */
function Figyelmeztetesek({ cimke, sorok }: { cimke: string; sorok: string[] }) {
  if (sorok.length === 0) return null;

  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <p className="font-medium">{cimke}</p>
      <ul className="mt-1 grid gap-1">
        {sorok.map((sor) => (
          <li key={sor}>{sor}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Egy mező. A begépelt érték egy elutasított mentést is túlél, de ezt nem itt
 * intézzük: a közös `megorzo` mező csinálja, ugyanúgy, mint az alkalmazás
 * többi űrlapján. Itt ezen felül annyi van, hogy a hibás mező kerete piros.
 */
function Mezo({
  nev,
  cimke,
  sugo,
  tipus = "text",
  alap,
  min,
  max,
  kotelezo = false,
  allapot,
}: {
  nev: string;
  cimke: string;
  sugo?: string;
  tipus?: string;
  alap?: string;
  min?: number;
  max?: number;
  kotelezo?: boolean;
  allapot: Eredmeny;
}) {
  const hibas = allapot.hibak.includes(nev);

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{cimke}</span>
      <MegorzoMezo
        type={tipus}
        name={nev}
        defaultValue={alap ?? ""}
        min={min}
        max={max}
        required={kotelezo}
        allapot={allapot.allapot}
        className={`${MEZO} ${hibas ? "border-rose-400 dark:border-rose-700" : ""}`}
      />
      {sugo ? (
        <span className="text-xs text-stone-600 dark:text-stone-400">{sugo}</span>
      ) : null}
    </label>
  );
}
