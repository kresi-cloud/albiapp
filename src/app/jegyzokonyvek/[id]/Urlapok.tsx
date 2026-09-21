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
          <h3 className="font-medium">{FAJTA_CIM[fajta]}</h3>
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
                    aria-label="Megnevezés"
                    allapot={allapot.allapot}
                  />
                  <Mezo
                    name={`ertek_${tetel.id}`}
                    defaultValue={tetel.ertek}
                    placeholder={ERTEK_SUGO[fajta]}
                    className={MEZO}
                    aria-label="Érték"
                    allapot={allapot.allapot}
                  />
                </div>
                <Mezo
                  name={`megjegyzes_${tetel.id}`}
                  defaultValue={tetel.megjegyzes}
                  placeholder="megjegyzés"
                  className={MEZO}
                  aria-label="Megjegyzés"
                  allapot={allapot.allapot}
                />
                {fajta === "hiba" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs">
                      <span>Ki rendezi</span>
                      <Valaszto
                        name={`felelos_${tetel.id}`}
                        defaultValue={tetel.felelos}
                        className={MEZO}
                        allapot={allapot.allapot}
                      >
                        <option value="">nincs vállalás</option>
                        <option value="berbeado">a bérbeadó</option>
                        <option value="berlo">a bérlő</option>
                      </Valaszto>
                    </label>
                    <label className="grid gap-1 text-xs">
                      <span>Mikorra</span>
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
        <span className="font-medium">A bérlemény állapota</span>
        <Szovegdoboz
          name="allapotLeiras"
          defaultValue={allapotLeiras}
          rows={3}
          className={MEZO}
          allapot={allapot.allapot}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Egyéb megjegyzés</span>
        <Szovegdoboz
          name="megjegyzes"
          defaultValue={megjegyzes}
          rows={2}
          className={MEZO}
          allapot={allapot.allapot}
        />
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
      <Valaszto
        name="fajta"
        defaultValue="hiba"
        className={MEZO}
        aria-label="Tétel fajtája"
        allapot={allapot.allapot}
      >
        <option value="hiba">hiba vagy hiányosság</option>
        <option value="meroora">mérőóra</option>
        <option value="kulcs">kulcs</option>
        <option value="dokumentum">átadott dokumentum</option>
      </Valaszto>
      <Mezo
        name="megnevezes"
        placeholder="mit rögzítesz"
        className={MEZO}
        aria-label="Megnevezés"
        allapot={allapot.allapot}
      />
      <Mezo
        name="ertek"
        placeholder="érték, ha van"
        className={MEZO}
        aria-label="Érték"
        allapot={allapot.allapot}
      />
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
