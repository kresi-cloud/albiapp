"use client";

import { useActionState, useState } from "react";
import {
  latogatasraValaszol,
  latogatastBejelent,
  latogatastLemond,
  type Eredmeny,
} from "./actions";
import { Mezo, Szovegdoboz, Valaszto, Valasztogomb } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import { CIMKE, GOMB, MEZO, SUGOSZOVEG, VISSZAVONO_GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export type Valasztek = { ertek: string; cimke: string };

/**
 * Látogatás bejelentése.
 *
 * A mezők a megőrző mezők: egy elutasított mentés nem viheti el a begépelt
 * adatot. Itt ez azért fáj különösen, mert a szolgáltató SMS-ét a
 * felhasználó jellemzően egyszer olvassa el, és onnan gépeli át.
 */
export function Bejelentes({
  jogviszonyok,
  fajtak,
  mai,
  cimkek,
}: {
  jogviszonyok: Valasztek[];
  fajtak: Valasztek[];
  mai: string;
  cimkek: Record<string, string>;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(latogatastBejelent, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-3">
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />

      {jogviszonyok.length > 1 ? (
        <label className="grid gap-1">
          <span className={CIMKE}>{cimkek.berlemeny}</span>
          <Valaszto
            allapot={allapot.allapot}
            name="jogviszonyId"
            defaultValue={jogviszonyok[0]?.ertek ?? ""}
            className={MEZO}
          >
            {jogviszonyok.map((sor) => (
              <option key={sor.ertek} value={sor.ertek}>
                {sor.cimke}
              </option>
            ))}
          </Valaszto>
        </label>
      ) : (
        <input type="hidden" name="jogviszonyId" value={jogviszonyok[0]?.ertek ?? ""} />
      )}

      <label className="grid gap-1">
        <span className={CIMKE}>{cimkek.fajta}</span>
        <Valaszto
          allapot={allapot.allapot}
          name="fajta"
          defaultValue={fajtak[0]?.ertek ?? ""}
          className={MEZO}
        >
          {fajtak.map((sor) => (
            <option key={sor.ertek} value={sor.ertek}>
              {sor.cimke}
            </option>
          ))}
        </Valaszto>
      </label>

      <label className="grid gap-1">
        <span className={CIMKE}>{cimkek.megnevezes}</span>
        <Mezo
          allapot={allapot.allapot}
          name="megnevezes"
          type="text"
          maxLength={120}
          placeholder={cimkek.megnevezesHelyorzo}
          className={MEZO}
        />
      </label>

      <label className="grid gap-1">
        <span className={CIMKE}>{cimkek.szolgaltato}</span>
        <Mezo
          allapot={allapot.allapot}
          name="szolgaltato"
          type="text"
          maxLength={120}
          className={MEZO}
        />
      </label>

      <label className="grid gap-1">
        <span className={CIMKE}>{cimkek.nap}</span>
        <Mezo
          allapot={allapot.allapot}
          name="nap"
          type="date"
          defaultValue={mai}
          className={MEZO}
        />
      </label>

      <div className="grid gap-1">
        <span className={CIMKE}>{cimkek.idoablak}</span>
        <div className="flex items-center gap-2">
          <Mezo
            allapot={allapot.allapot}
            name="idoablakTol"
            type="text"
            inputMode="numeric"
            placeholder="9:00"
            maxLength={5}
            className={MEZO}
          />
          <span className="shrink-0 text-halvany">–</span>
          <Mezo
            allapot={allapot.allapot}
            name="idoablakIg"
            type="text"
            inputMode="numeric"
            placeholder="11:00"
            maxLength={5}
            className={MEZO}
          />
        </div>
        <span className={SUGOSZOVEG}>{cimkek.idoablakSugo}</span>
      </div>

      <label className="grid gap-1">
        <span className={CIMKE}>{cimkek.megjegyzes}</span>
        <Szovegdoboz
          allapot={allapot.allapot}
          name="megjegyzes"
          rows={2}
          maxLength={500}
          className={MEZO}
        />
      </label>

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? cimkek.mentesFolyamatban : cimkek.mentes}
      </button>
    </form>
  );
}

/**
 * A bérlő válasza.
 *
 * Rádiógomb, nem legördülő: három választás van, és mind a három egy-egy
 * mondat, amit el kell olvasni. Az indoklás mezője csak a kifogásnál jön elő,
 * mert a másik két válaszhoz nincs mit hozzáfűzni — de ott kötelező.
 */
export function Valaszurlap({
  latogatasId,
  valasztott,
  valaszok,
  cimkek,
}: {
  latogatasId: string;
  valasztott: string | null;
  valaszok: Valasztek[];
  cimkek: Record<string, string>;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(latogatasraValaszol, KEZDETI);
  const [valasz, valasztAllit] = useState(valasztott ?? "");

  return (
    <form action={kuldes} className="mt-3 grid gap-2 border-t border-keret pt-3">
      <input type="hidden" name="latogatasId" value={latogatasId} />
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />

      <span className={CIMKE}>{cimkek.kerdes}</span>
      {valaszok.map((sor) => (
        <label key={sor.ertek} className="flex min-h-11 items-center gap-2 text-sm">
          <Valasztogomb
            name="valasz"
            value={sor.ertek}
            jelolt={valasz === sor.ertek}
            onChange={() => valasztAllit(sor.ertek)}
          />
          <span className="min-w-0 flex-1 text-pretty">{sor.cimke}</span>
        </label>
      ))}

      {valasz === "nem_jo_idopont" ? (
        <label className="grid gap-1">
          <span className={SUGOSZOVEG}>{cimkek.indoklasSugo}</span>
          <Szovegdoboz
            allapot={allapot.allapot}
            name="indoklas"
            rows={2}
            maxLength={300}
            className={MEZO}
          />
        </label>
      ) : null}

      <button type="submit" disabled={folyamatban || valasz === ""} className={GOMB}>
        {folyamatban ? cimkek.mentesFolyamatban : cimkek.mentes}
      </button>
    </form>
  );
}

/**
 * Lemondás. Ok nélkül nincs: a bérlő ebből tudja meg, kell-e otthon lennie.
 * Halk gomb, mert nem ez a fő út, de nem is rejtett: egy elmaradt kéményseprő
 * miatt senki ne várjon otthon egy délelőttöt.
 */
export function Lemondas({
  latogatasId,
  cimkek,
}: {
  latogatasId: string;
  cimkek: Record<string, string>;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(latogatastLemond, KEZDETI);

  return (
    <details className="mt-2">
      <summary className={`${VISSZAVONO_GOMB} list-none`}>{cimkek.lemondas}</summary>
      <form action={kuldes} className="mt-2 grid gap-2">
        <input type="hidden" name="latogatasId" value={latogatasId} />
        <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
        <Mezo
          allapot={allapot.allapot}
          name="oka"
          type="text"
          maxLength={200}
          placeholder={cimkek.oka}
          className={MEZO}
        />
        <button type="submit" disabled={folyamatban} className={GOMB}>
          {folyamatban ? cimkek.lemondasFolyamatban : cimkek.lemondas}
        </button>
      </form>
    </details>
  );
}
