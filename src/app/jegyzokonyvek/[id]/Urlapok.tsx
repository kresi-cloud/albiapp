"use client";

import { useActionState } from "react";
import { Mezo, Szovegdoboz, Valaszto } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import {
  jegyzokonyvTetelt,
  jegyzokonyvetMent,
  jegyzokonyvetVeglegesit,
  type Eredmeny,
} from "@/app/dokumentumok/actions";
import { MEZO, GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export type TetelNezet = {
  id: string;
  fajta: string;
  megnevezes: string;
  ertek: string;
  megjegyzes: string;
  felelos: string;
  hatarido: string;
};

export type JegyzokonyvCimkek = {
  idopont: string;
  fajtaCim: Record<string, string>;
  ertekSugo: Record<string, string>;
  megnevezes: string;
  ertek: string;
  megjegyzes: string;
  megjegyzesSugo: string;
  kiRendezi: string;
  nincsVallalas: string;
  felelosBerbeado: string;
  felelosBerlo: string;
  mikorra: string;
  allapotLeiras: string;
  egyebMegjegyzes: string;
  gomb: string;
  folyamatban: string;
};

export function JegyzokonyvUrlap({
  jegyzokonyvId,
  idopont,
  allapotLeiras,
  megjegyzes,
  tetelek,
  cimkek,
}: {
  jegyzokonyvId: string;
  idopont: string;
  allapotLeiras: string;
  megjegyzes: string;
  tetelek: TetelNezet[];
  cimkek: JegyzokonyvCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(jegyzokonyvetMent, KEZDETI);
  const fajtak = ["meroora", "kulcs", "hiba", "dokumentum"].filter((fajta) =>
    tetelek.some((tetel) => tetel.fajta === fajta),
  );

  return (
    <form action={kuldes} className="grid gap-5">
      <input type="hidden" name="jegyzokonyvId" value={jegyzokonyvId} />

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.idopont}</span>
        <Mezo
          name="idopont"
          type="datetime-local"
          defaultValue={idopont}
          className={MEZO}
          allapot={allapot.allapot}
        />
      </label>

      {fajtak.map((fajta) => (
        <section key={fajta} className="grid gap-3">
          <h3 className="font-medium">{cimkek.fajtaCim[fajta]}</h3>
          {tetelek
            .filter((tetel) => tetel.fajta === fajta)
            .map((tetel) => (
              <div
                key={tetel.id}
                className="grid gap-2 border-t border-stone-200 pt-3 first:border-0 first:pt-0 dark:border-stone-800"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <Mezo
                    name={`megnevezes_${tetel.id}`}
                    defaultValue={tetel.megnevezes}
                    className={MEZO}
                    aria-label={cimkek.megnevezes}
                    allapot={allapot.allapot}
                  />
                  <Mezo
                    name={`ertek_${tetel.id}`}
                    defaultValue={tetel.ertek}
                    placeholder={cimkek.ertekSugo[fajta]}
                    className={MEZO}
                    aria-label={cimkek.ertek}
                    allapot={allapot.allapot}
                  />
                </div>
                <Mezo
                  name={`megjegyzes_${tetel.id}`}
                  defaultValue={tetel.megjegyzes}
                  placeholder={cimkek.megjegyzesSugo}
                  className={MEZO}
                  aria-label={cimkek.megjegyzes}
                  allapot={allapot.allapot}
                />
                {fajta === "hiba" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs">
                      <span>{cimkek.kiRendezi}</span>
                      <Valaszto
                        name={`felelos_${tetel.id}`}
                        defaultValue={tetel.felelos}
                        className={MEZO}
                        allapot={allapot.allapot}
                      >
                        <option value="">{cimkek.nincsVallalas}</option>
                        <option value="berbeado">{cimkek.felelosBerbeado}</option>
                        <option value="berlo">{cimkek.felelosBerlo}</option>
                      </Valaszto>
                    </label>
                    <label className="grid gap-1 text-xs">
                      <span>{cimkek.mikorra}</span>
                      <Mezo
                        name={`hatarido_${tetel.id}`}
                        type="date"
                        defaultValue={tetel.hatarido}
                        className={MEZO}
                        allapot={allapot.allapot}
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            ))}
        </section>
      ))}

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.allapotLeiras}</span>
        <Szovegdoboz
          name="allapotLeiras"
          defaultValue={allapotLeiras}
          rows={3}
          className={MEZO}
          allapot={allapot.allapot}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.egyebMegjegyzes}</span>
        <Szovegdoboz
          name="megjegyzes"
          defaultValue={megjegyzes}
          rows={2}
          className={MEZO}
          allapot={allapot.allapot}
        />
      </label>

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function UjTetel({
  jegyzokonyvId,
  cimkek,
}: {
  jegyzokonyvId: string;
  cimkek: {
    fajta: string;
    fajtaHiba: string;
    fajtaMeroora: string;
    fajtaKulcs: string;
    fajtaDokumentum: string;
    megnevezes: string;
    megnevezesSugo: string;
    ertek: string;
    ertekSugo: string;
    gomb: string;
    folyamatban: string;
  };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(jegyzokonyvTetelt, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-2 sm:grid-cols-3">
      <input type="hidden" name="jegyzokonyvId" value={jegyzokonyvId} />
      <Valaszto
        name="fajta"
        defaultValue="hiba"
        className={MEZO}
        aria-label={cimkek.fajta}
        allapot={allapot.allapot}
      >
        <option value="hiba">{cimkek.fajtaHiba}</option>
        <option value="meroora">{cimkek.fajtaMeroora}</option>
        <option value="kulcs">{cimkek.fajtaKulcs}</option>
        <option value="dokumentum">{cimkek.fajtaDokumentum}</option>
      </Valaszto>
      <Mezo
        name="megnevezes"
        placeholder={cimkek.megnevezesSugo}
        className={MEZO}
        aria-label={cimkek.megnevezes}
        allapot={allapot.allapot}
      />
      <Mezo
        name="ertek"
        placeholder={cimkek.ertekSugo}
        className={MEZO}
        aria-label={cimkek.ertek}
        allapot={allapot.allapot}
      />
      <div className="sm:col-span-3 grid gap-2">
        <button type="submit" disabled={folyamatban} className={GOMB}>
          {folyamatban ? cimkek.folyamatban : cimkek.gomb}
        </button>
        <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
      </div>
    </form>
  );
}

export function VeglegesitesUrlap({
  jegyzokonyvId,
  cimkek,
}: {
  jegyzokonyvId: string;
  cimkek: { gomb: string; megis: string; folyamatban: string; sugo: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(jegyzokonyvetVeglegesit, KEZDETI);
  const hianyzik = allapot.allapot === "hiba" && allapot.hibak.length > 0;

  return (
    <form action={kuldes} className="grid gap-3">
      <input type="hidden" name="jegyzokonyvId" value={jegyzokonyvId} />
      {hianyzik ? <input type="hidden" name="megis" value="igen" /> : null}
      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? cimkek.folyamatban : hianyzik ? cimkek.megis : cimkek.gomb}
      </button>
      <p className="text-sm text-stone-600 dark:text-stone-400">{cimkek.sugo}</p>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
