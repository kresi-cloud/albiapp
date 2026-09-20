"use client";

import { useActionState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import {
  jegyzokonyvTetelt,
  jegyzokonyvetMent,
  jegyzokonyvetVeglegesit,
  type Eredmeny,
} from "@/app/dokumentumok/actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

const MEZO =
  "rounded border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950";
const GOMB =
  "justify-self-start rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900";

export type TetelNezet = {
  id: string;
  fajta: string;
  megnevezes: string;
  ertek: string;
  megjegyzes: string;
  felelos: string;
  hatarido: string;
};

const FAJTA_CIM: Record<string, string> = {
  meroora: "Mérőórák",
  kulcs: "Kulcsok és hozzáférési eszközök",
  hiba: "Hibák és hiányosságok",
  dokumentum: "Átadott dokumentumok",
};

const ERTEK_SUGO: Record<string, string> = {
  meroora: "óraállás, mértékegységgel",
  kulcs: "darabszám",
  hiba: "",
  dokumentum: "",
};

export function JegyzokonyvUrlap({
  jegyzokonyvId,
  idopont,
  allapotLeiras,
  megjegyzes,
  tetelek,
}: {
  jegyzokonyvId: string;
  idopont: string;
  allapotLeiras: string;
  megjegyzes: string;
  tetelek: TetelNezet[];
}) {
  const [allapot, kuldes, folyamatban] = useActionState(jegyzokonyvetMent, KEZDETI);
  const fajtak = ["meroora", "kulcs", "hiba", "dokumentum"].filter((fajta) =>
    tetelek.some((tetel) => tetel.fajta === fajta),
  );

  return (
    <form action={kuldes} className="grid gap-5">
      <input type="hidden" name="jegyzokonyvId" value={jegyzokonyvId} />

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Az átadás-átvétel időpontja</span>
        <input name="idopont" type="datetime-local" defaultValue={idopont} className={MEZO} />
      </label>

      {fajtak.map((fajta) => (
        <section key={fajta} className="grid gap-3">
          <h3 className="font-medium">{FAJTA_CIM[fajta]}</h3>
          {tetelek
            .filter((tetel) => tetel.fajta === fajta)
            .map((tetel) => (
              <div
                key={tetel.id}
                className="grid gap-2 border-t border-stone-200 pt-3 first:border-0 first:pt-0 dark:border-stone-800"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    name={`megnevezes_${tetel.id}`}
                    defaultValue={tetel.megnevezes}
                    className={MEZO}
                    aria-label="Megnevezés"
                  />
                  <input
                    name={`ertek_${tetel.id}`}
                    defaultValue={tetel.ertek}
                    placeholder={ERTEK_SUGO[fajta]}
                    className={MEZO}
                    aria-label="Érték"
                  />
                </div>
                <input
                  name={`megjegyzes_${tetel.id}`}
                  defaultValue={tetel.megjegyzes}
                  placeholder="megjegyzés"
                  className={MEZO}
                  aria-label="Megjegyzés"
                />
                {fajta === "hiba" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs">
                      <span>Ki rendezi</span>
                      <select name={`felelos_${tetel.id}`} defaultValue={tetel.felelos} className={MEZO}>
                        <option value="">nincs vállalás</option>
                        <option value="berbeado">a bérbeadó</option>
                        <option value="berlo">a bérlő</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs">
                      <span>Mikorra</span>
                      <input
                        name={`hatarido_${tetel.id}`}
                        type="date"
                        defaultValue={tetel.hatarido}
                        className={MEZO}
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            ))}
        </section>
      ))}

      <label className="grid gap-1 text-sm">
        <span className="font-medium">A bérlemény állapota</span>
        <textarea name="allapotLeiras" defaultValue={allapotLeiras} rows={3} className={MEZO} />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Egyéb megjegyzés</span>
        <textarea name="megjegyzes" defaultValue={megjegyzes} rows={2} className={MEZO} />
      </label>

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? "Mentem…" : "Mentés"}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function UjTetel({ jegyzokonyvId }: { jegyzokonyvId: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(jegyzokonyvTetelt, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-2 sm:grid-cols-3">
      <input type="hidden" name="jegyzokonyvId" value={jegyzokonyvId} />
      <select name="fajta" defaultValue="hiba" className={MEZO} aria-label="Tétel fajtája">
        <option value="hiba">hiba vagy hiányosság</option>
        <option value="meroora">mérőóra</option>
        <option value="kulcs">kulcs</option>
        <option value="dokumentum">átadott dokumentum</option>
      </select>
      <input name="megnevezes" placeholder="mit rögzítesz" className={MEZO} aria-label="Megnevezés" />
      <input name="ertek" placeholder="érték, ha van" className={MEZO} aria-label="Érték" />
      <div className="sm:col-span-3 grid gap-2">
        <button type="submit" disabled={folyamatban} className={GOMB}>
          {folyamatban ? "Hozzáadom…" : "Hozzáadás"}
        </button>
        <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
      </div>
    </form>
  );
}

export function VeglegesitesUrlap({ jegyzokonyvId }: { jegyzokonyvId: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(jegyzokonyvetVeglegesit, KEZDETI);
  const hianyzik = allapot.allapot === "hiba" && allapot.hibak.length > 0;

  return (
    <form action={kuldes} className="grid gap-3">
      <input type="hidden" name="jegyzokonyvId" value={jegyzokonyvId} />
      {hianyzik ? <input type="hidden" name="megis" value="igen" /> : null}
      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban
          ? "Véglegesítem…"
          : hianyzik
            ? "Véglegesítés a hiányzó adatok nélkül"
            : "Véglegesítés"}
      </button>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Véglegesítéskor a szöveg befagy, a rögzített óraállások bekerülnek a
        mérőórák történetébe, a vállalt javításokból pedig teendő lesz.
      </p>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
