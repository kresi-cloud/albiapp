"use client";

import { useActionState } from "react";
import { Mezo, Valaszto } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import {
  modultValt,
  parametereketMenti,
  szerzodestVeglegesit,
  veglegesitestVisszavon,
  zaradekotKeszit,
  type Eredmeny,
} from "../actions";
import { MEZO, GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export type ModulNezet = {
  kulcs: string;
  cim: string;
  kotelezo: boolean;
  bekapcsolva: boolean;
  miert: string;
  ellenjegyzes: "nincs" | "folyamatban" | "ellenjegyzett";
};

export type ParameterNezet = {
  kulcs: string;
  cimke: string;
  tipus: "szoveg" | "szam" | "penz" | "datum" | "valaszt";
  ertek: string;
  sugo?: string;
  modulCim: string;
  valaszthatok?: { ertek: string; cimke: string }[];
};

export type ModulCimkek = {
  kotelezo: string;
  benneVan: string;
  nincsBenne: string;
  benneVanJelzes: string;
  nincsBenneJelzes: string;
  ellenjegyzes: Record<ModulNezet["ellenjegyzes"], string>;
};

/** Modulkapcsoló. Külön űrlap modulonként, hogy egy kattintás egy döntés legyen. */
export function ModulValto({
  szerzodesId,
  modul,
  szerkesztheto,
  cimkek,
}: {
  szerzodesId: string;
  modul: ModulNezet;
  szerkesztheto: boolean;
  cimkek: ModulCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(modultValt, KEZDETI);

  return (
    <li className="border-t border-keret py-3 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">{modul.cim}</span>
        {modul.kotelezo ? (
          <span className="text-xs text-nagyon-halvany">{cimkek.kotelezo}</span>
        ) : szerkesztheto ? (
          <form action={kuldes}>
            <input type="hidden" name="szerzodesId" value={szerzodesId} />
            <input type="hidden" name="kulcs" value={modul.kulcs} />
            <button
              type="submit"
              disabled={folyamatban}
              className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-60 ${
                modul.bekapcsolva
                  ? "bg-rendben-lap text-rendben"
                  : "bg-felulet-halk text-szoveg"
              }`}
            >
              {modul.bekapcsolva ? cimkek.benneVan : cimkek.nincsBenne}
            </button>
          </form>
        ) : (
          <span className="text-xs text-nagyon-halvany">
            {modul.bekapcsolva ? cimkek.benneVanJelzes : cimkek.nincsBenneJelzes}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-halvany">{modul.miert}</p>
      <p className="mt-1 text-xs text-nagyon-halvany">
        {cimkek.ellenjegyzes[modul.ellenjegyzes]}
      </p>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </li>
  );
}

export function ParameterUrlap({
  szerzodesId,
  parameterek,
  kelteHelye,
  kelte,
  cimkek,
}: {
  szerzodesId: string;
  parameterek: ParameterNezet[];
  kelteHelye: string;
  kelte: string;
  cimkek: { kelteHelye: string; kelte: string; gomb: string; folyamatban: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(parametereketMenti, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-4">
      <input type="hidden" name="szerzodesId" value={szerzodesId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.kelteHelye}</span>
          <Mezo
            name="kelteHelye"
            defaultValue={kelteHelye}
            className={MEZO}
            allapot={allapot.allapot}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.kelte}</span>
          <Mezo
            name="kelte"
            type="date"
            defaultValue={kelte}
            className={MEZO}
            allapot={allapot.allapot}
          />
        </label>
      </div>

      {parameterek.map((parameter) => (
        <label key={parameter.kulcs} className="grid gap-1 text-sm">
          <span className="font-medium">{parameter.cimke}</span>
          {parameter.tipus === "valaszt" ? (
            <Valaszto
              name={`p_${parameter.kulcs}`}
              defaultValue={parameter.ertek}
              className={MEZO}
              allapot={allapot.allapot}
            >
              {(parameter.valaszthatok ?? []).map((lehetoseg) => (
                <option key={lehetoseg.ertek} value={lehetoseg.ertek}>
                  {lehetoseg.cimke}
                </option>
              ))}
            </Valaszto>
          ) : (
            <Mezo
              name={`p_${parameter.kulcs}`}
              type={parameter.tipus === "datum" ? "date" : parameter.tipus === "szoveg" ? "text" : "number"}
              inputMode={parameter.tipus === "szoveg" ? undefined : "numeric"}
              defaultValue={parameter.ertek}
              className={MEZO}
              allapot={allapot.allapot}
            />
          )}
          <span className="text-xs text-nagyon-halvany">
            {parameter.modulCim}
            {parameter.sugo ? ` · ${parameter.sugo}` : ""}
          </span>
        </label>
      ))}

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function VeglegesitesUrlap({
  szerzodesId,
  cimkek,
}: {
  szerzodesId: string;
  cimkek: { nyugtazas: string; gomb: string; megis: string; folyamatban: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(szerzodestVeglegesit, KEZDETI);
  // Csak az adathiány engedi a "mégis" gombot. A nyugtázás hiánya is hiba, de
  // abból nem lehet felhatalmazás arra, hogy a hiányzó adatokat átugorjuk:
  // különben egy kipipálatlan jelölőnégyzet csendben átvinné a figyelmeztetésen.
  // A hiba melyik mezőre vonatkozik, azt a `mezo` mondja meg, nem a felsorolás:
  // a felsorolást a felhasználó olvassa, oda mezőnév nem kerülhet.
  const hianyzik =
    allapot.allapot === "hiba" &&
    allapot.hibak.length > 0 &&
    allapot.mezo !== "azonossagEllenorizve";

  return (
    <form action={kuldes} className="grid gap-3">
      <input type="hidden" name="szerzodesId" value={szerzodesId} />
      {hianyzik ? <input type="hidden" name="megis" value="igen" /> : null}

      {/*
        Az alkalmazás nem tud személyazonosságot igazolni, tehát nem is úgy
        teszünk, mintha tudna. Amit tehetünk: aláírás előtt kimondjuk, és
        megkérjük a bérbeadót, hogy nyugtázza, tényleg megnézték egymás
        okmányát. Enélkül nem véglegesítünk.
      */}
      <label className="flex items-start gap-2 rounded border border-keret-eros p-3 text-sm">
        <input
          id="azonossag-ellenorizve"
          type="checkbox"
          name="azonossagEllenorizve"
          value="igen"
          required
          className="mt-0.5"
        />
        <span>{cimkek.nyugtazas}</span>
      </label>

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? cimkek.folyamatban : hianyzik ? cimkek.megis : cimkek.gomb}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

/**
 * Záradék indítása egy hatályos szerződéshez.
 *
 * Az aláírt szöveget nem írjuk át, ezért a kiegészítés külön okirat. A gomb
 * csak véglegesített szerződésen jelenik meg: tervezetet még szerkeszteni
 * lehet, ahhoz nem kell záradék.
 */
export function ZaradekUrlap({
  szerzodesId,
  cimkek,
}: {
  szerzodesId: string;
  cimkek: { gomb: string; folyamatban: string; sugo: string };
}) {
  const [, kuldes, folyamatban] = useActionState(zaradekotKeszit, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2 border-t border-keret pt-3">
      <input type="hidden" name="szerzodesId" value={szerzodesId} />
      <p className="text-sm text-halvany">{cimkek.sugo}</p>
      <button type="submit" disabled={folyamatban} className={`${GOMB} justify-self-start`}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
    </form>
  );
}

export function VisszavonasUrlap({
  szerzodesId,
  cimkek,
}: {
  szerzodesId: string;
  cimkek: { gomb: string; folyamatban: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(veglegesitestVisszavon, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-2">
      <input type="hidden" name="szerzodesId" value={szerzodesId} />
      <button
        type="submit"
        disabled={folyamatban}
        className="justify-self-start text-sm text-halvany underline underline-offset-2 disabled:opacity-60"
      >
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
