"use client";

import { useActionState } from "react";
import { Mezo, Szovegdoboz, Valaszto } from "@/components/megorzo";
import { APRO_GOMB, GOMB, HALVANY_GOMB, MEZO } from "@/components/urlap";
import {
  elofizetestFelveszAction,
  elofizetestMegszuntetAction,
  nyilatkozikAction,
  type Eredmeny,
} from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "" };

function Uzenet({ allapot }: { allapot: Eredmeny }) {
  if (allapot.allapot === "ures" || !allapot.uzenet) return null;
  const hiba = allapot.allapot === "hiba";
  return (
    <p
      className={`rounded border p-2 text-sm ${
        hiba
          ? "border-gond-keret bg-gond-lap text-gond"
          : "border-rendben-keret bg-rendben-lap text-rendben"
      }`}
    >
      {allapot.uzenet}
    </p>
  );
}

export type UjCimkek = {
  nyito: string;
  fajta: string;
  fajtak: { ertek: string; cimke: string }[];
  megnevezes: string;
  megnevezesSugo: string;
  szolgaltato: string;
  elofizeto: string;
  elofizetok: { ertek: string; cimke: string }[];
  haviDij: string;
  kezdete: string;
  vege: string;
  gomb: string;
  folyamatban: string;
};

/**
 * Új előfizetés egy bérleményhez.
 *
 * Bérleményenként külön űrlap, bérleményválasztó nélkül — ugyanaz a döntés,
 * mint a beszélgetésnél: a választó és a mögötte álló adat el tud csúszni
 * egymástól, és az űrlap kerete ezt eleve kizárja.
 */
export function UjElofizetes({
  jogviszonyId,
  ingatlanNev,
  mutassukABerlemenyt,
  mai,
  cimkek,
}: {
  jogviszonyId: string;
  ingatlanNev: string;
  mutassukABerlemenyt: boolean;
  mai: string;
  cimkek: UjCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(elofizetestFelveszAction, KEZDETI);

  return (
    <details className="rounded-kartya border border-keret bg-felulet p-4">
      <summary className="cursor-pointer font-medium">
        {cimkek.nyito}
        {mutassukABerlemenyt ? (
          <span className="font-normal text-halvany">
            {" · "}
            {ingatlanNev}
          </span>
        ) : null}
      </summary>

      <form action={kuldes} className="mt-3 grid gap-3">
        <input type="hidden" name="jogviszonyId" value={jogviszonyId} />

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.fajta}</span>
          <Valaszto name="fajta" className={MEZO} allapot={allapot.allapot} defaultValue="internet">
            {cimkek.fajtak.map((fajta) => (
              <option key={fajta.ertek} value={fajta.ertek}>
                {fajta.cimke}
              </option>
            ))}
          </Valaszto>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.megnevezes}</span>
          <Mezo name="megnevezes" className={MEZO} allapot={allapot.allapot} required />
          <span className="text-xs text-nagyon-halvany">{cimkek.megnevezesSugo}</span>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.szolgaltato}</span>
          <Mezo name="szolgaltato" className={MEZO} allapot={allapot.allapot} />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.elofizeto}</span>
          <Valaszto
            name="elofizeto"
            className={MEZO}
            allapot={allapot.allapot}
            defaultValue="berbeado"
          >
            {cimkek.elofizetok.map((elofizeto) => (
              <option key={elofizeto.ertek} value={elofizeto.ertek}>
                {elofizeto.cimke}
              </option>
            ))}
          </Valaszto>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.haviDij}</span>
          <Mezo
            name="haviDijFt"
            type="number"
            min={0}
            step={1}
            className={MEZO}
            allapot={allapot.allapot}
            defaultValue="0"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.kezdete}</span>
          <Mezo
            name="kezdete"
            type="date"
            className={MEZO}
            allapot={allapot.allapot}
            defaultValue={mai}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.vege}</span>
          <Mezo name="vege" type="date" className={MEZO} allapot={allapot.allapot} />
        </label>

        <Uzenet allapot={allapot} />
        <button type="submit" disabled={folyamatban} className={`${GOMB} justify-self-start`}>
          {folyamatban ? cimkek.folyamatban : cimkek.gomb}
        </button>
      </form>
    </details>
  );
}

export function MegszuntetesUrlap({
  elofizetesId,
  cimkek,
}: {
  elofizetesId: string;
  cimkek: { gomb: string; folyamatban: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(elofizetestMegszuntetAction, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="elofizetesId" value={elofizetesId} />
      <Uzenet allapot={allapot} />
      <button type="submit" disabled={folyamatban} className={`${APRO_GOMB} justify-self-start`}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
    </form>
  );
}

/**
 * A bérlő nyilatkozata: jóváhagyás vagy kifogás, egy űrlapon.
 *
 * Az indoklás mezője mindig látszik, nem csak kifogás után: ha a kifogás
 * gombjára kattintva jelenne meg, a bérlő kétszer kattintana ugyanazért, és a
 * kiszolgáló amúgy is a beküldéskor ellenőrzi, hogy van-e indoklás.
 */
export function NyilatkozatUrlap({
  elofizetesId,
  cimkek,
}: {
  elofizetesId: string;
  cimkek: {
    indoklas: string;
    jovahagy: string;
    jovahagyom: string;
    kifogas: string;
    kifogasolom: string;
  };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(nyilatkozikAction, KEZDETI);

  return (
    <form className="mt-3 grid gap-2">
      <input type="hidden" name="elofizetesId" value={elofizetesId} />
      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.indoklas}</span>
        <Szovegdoboz name="indoklas" rows={2} className={MEZO} allapot={allapot.allapot} />
      </label>
      <Uzenet allapot={allapot} />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          formAction={kuldes}
          name="allapot"
          value="jovahagyva"
          disabled={folyamatban}
          className={GOMB}
        >
          {folyamatban ? cimkek.jovahagyom : cimkek.jovahagy}
        </button>
        <button
          type="submit"
          formAction={kuldes}
          name="allapot"
          value="kifogasolt"
          disabled={folyamatban}
          className={HALVANY_GOMB}
        >
          {folyamatban ? cimkek.kifogasolom : cimkek.kifogas}
        </button>
      </div>
    </form>
  );
}
