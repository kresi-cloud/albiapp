"use client";

import { useActionState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import { CIMKE, FAJLMEZO, GOMB, SUGOSZOVEG, VISSZAVONO_GOMB } from "@/components/urlap";
import { ELFOGADOTT_TIPUSOK } from "@/domain/bizonylat";
import { bizonylatotFeltolt, bizonylatotTorolAction, type Eredmeny } from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export type BizonylatSor = {
  id: string;
  oldal: "kuldo" | "fogado";
  cimke: string;
  meret: string;
  feltoltve: string;
  sajat: boolean;
};

export type BizonylatCimkek = {
  cim: string;
  kikapcsolva: string;
  feltolt: string;
  gomb: string;
  sugo: string;
  torles: string;
  letoltes: string;
  nincs: string;
  varunkRad: string;
  sajatOldal: string;
  masikOldal: string;
};

/**
 * A bizonylatok blokkja egy vitás tételnél. Mindkét fél látja mindkét oldal
 * bizonylatát — a vitát épp az dönti el, hogy megnézik egymásét —, de csak a
 * sajátját töltheti fel és törölheti.
 */
export function Bizonylatok({
  eloirtTetelId,
  sajatOldal,
  meglevok,
  kerheto,
  cimkek,
}: {
  eloirtTetelId: string;
  sajatOldal: "kuldo" | "fogado";
  meglevok: BizonylatSor[];
  /** Kérünk-e most bizonylatot. Ha nem, a meglévők akkor is látszanak. */
  kerheto: boolean;
  cimkek: BizonylatCimkek;
}) {
  const sajat = meglevok.find((sor) => sor.oldal === sajatOldal);
  const masik = meglevok.find((sor) => sor.oldal !== sajatOldal);

  return (
    <div className="mt-3 rounded-lg border border-keret bg-felulet-halk p-3">
      <h4 className="text-sm font-semibold">{cimkek.cim}</h4>

      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        <Oldal
          oldal={sajatOldal}
          cimke={cimkek.sajatOldal}
          sor={sajat}
          cimkek={cimkek}
          varunkRad={kerheto}
        />
        <Oldal
          oldal={sajatOldal === "kuldo" ? "fogado" : "kuldo"}
          cimke={cimkek.masikOldal}
          sor={masik}
          cimkek={cimkek}
        />
      </dl>

      {sajat?.sajat ? <Torles bizonylatId={sajat.id} cimke={cimkek.torles} /> : null}
      {kerheto ? (
        <Feltoltes eloirtTetelId={eloirtTetelId} cimkek={cimkek} />
      ) : (
        <p className={`mt-3 ${SUGOSZOVEG}`}>{cimkek.kikapcsolva}</p>
      )}
    </div>
  );
}

function Oldal({
  oldal,
  cimke,
  sor,
  cimkek,
  varunkRad = false,
}: {
  oldal: "kuldo" | "fogado";
  cimke: string;
  sor: BizonylatSor | undefined;
  cimkek: BizonylatCimkek;
  varunkRad?: boolean;
}) {
  // A `data-oldal` a böngészős próbának ad fogódzót: a két blokk szövege
  // nyelvfüggő, az oldal viszont nem.
  return (
    <div data-oldal={oldal}>
      <dt className="text-xs font-medium text-halvany">{cimke}</dt>
      <dd className="mt-0.5">
        {sor ? (
          <>
            <a
              href={`/bizonylatok/${sor.id}`}
              className="font-semibold text-kiemelt hover:underline"
              rel="noopener"
            >
              {cimkek.letoltes}
            </a>{" "}
            <span className="szam text-xs text-halvany">
              {sor.meret} · {sor.feltoltve}
            </span>
          </>
        ) : (
          <span className="text-nagyon-halvany">
            {varunkRad ? cimkek.varunkRad : cimkek.nincs}
          </span>
        )}
      </dd>
    </div>
  );
}

function Feltoltes({
  eloirtTetelId,
  cimkek,
}: {
  eloirtTetelId: string;
  cimkek: BizonylatCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(bizonylatotFeltolt, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="eloirtTetelId" value={eloirtTetelId} />
      <label className="grid gap-1">
        <span className={CIMKE}>{cimkek.feltolt}</span>
        <input
          type="file"
          name="bizonylat"
          accept={ELFOGADOTT_TIPUSOK.join(",")}
          className={FAJLMEZO}
        />
      </label>
      <p className={SUGOSZOVEG}>{cimkek.sugo}</p>
      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? "…" : cimkek.gomb}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

function Torles({ bizonylatId, cimke }: { bizonylatId: string; cimke: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(bizonylatotTorolAction, KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid justify-items-start gap-2">
      <input type="hidden" name="bizonylatId" value={bizonylatId} />
      <button type="submit" disabled={folyamatban} className={VISSZAVONO_GOMB}>
        {folyamatban ? "…" : cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
