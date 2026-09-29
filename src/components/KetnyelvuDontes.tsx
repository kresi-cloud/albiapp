"use client";

import { useActionState } from "react";
import { Szovegdoboz } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import { MEZO, APRO_GOMB, GOMB, SUGOSZOVEG } from "@/components/urlap";
import { ketnyelvurolNyilatkozik, type Eredmeny } from "@/app/szerzodesek/actions";
import type { KetnyelvuCimkek } from "@/domain/szerzodes-ketnyelvu";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

/**
 * A kétnyelvű példány kétoldali döntése.
 *
 * Ugyanaz a komponens a bérbeadó és a bérlő lapján: a kérdés mindkét félnek
 * ugyanaz, és két példányban megírva a kettő előbb-utóbb elcsúszna egymástól.
 *
 * Két gomb, nem egy jelölőnégyzet: a „támogatom" és a „kifogásolom" két külön
 * nyilatkozat, és a kifogásnak indoklása is van. A be nem küldött harmadik
 * eset — hogy valaki még nem nyilatkozott — pont attól látszik, hogy egyik
 * gombot sem nyomta meg.
 */
export function KetnyelvuDontes({
  szerzodesId,
  nyilatkozhat,
  cimkek,
}: {
  szerzodesId: string;
  nyilatkozhat: boolean;
  cimkek: KetnyelvuCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(ketnyelvurolNyilatkozik, KEZDETI);

  return (
    <div className="grid gap-3" data-szakasz="ketnyelvu">
      <p className="font-medium">{cimkek.kerdes}</p>
      <p className={SUGOSZOVEG}>{cimkek.mindenkiSugo}</p>
      <p className="text-sm">{cimkek.allapot}</p>

      {cimkek.varunk ? <p className={SUGOSZOVEG}>{cimkek.varunk}</p> : null}
      {cimkek.kifogasok.map((sor) => (
        <p key={sor} className="rounded border border-gond-keret bg-gond-lap p-2 text-sm text-gond">
          {sor}
        </p>
      ))}
      {/* Fiók nélküli bérlőt nem lehet megkérdezni, és ezt kimondjuk: a
          bérbeadó különben azt hinné, hogy valaki hallgat. */}
      {cimkek.nincsFiok.map((sor) => (
        <p key={sor} className={SUGOSZOVEG}>
          {sor}
        </p>
      ))}

      {cimkek.sajat ? <p className="text-sm">{cimkek.sajat}</p> : null}

      {nyilatkozhat ? (
        <form action={kuldes} className="grid gap-2">
          <input type="hidden" name="szerzodesId" value={szerzodesId} />
          <label className="grid gap-1 text-sm">
            <span className="font-medium">{cimkek.indoklas}</span>
            <Szovegdoboz
              name="indoklas"
              rows={2}
              className={MEZO}
              allapot={allapot.allapot}
            />
            <span className={SUGOSZOVEG}>{cimkek.indoklasSugo}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              name="tamogatja"
              value="igen"
              disabled={folyamatban}
              className={GOMB}
            >
              {folyamatban ? cimkek.folyamatban : cimkek.tamogatom}
            </button>
            <button
              type="submit"
              name="tamogatja"
              value="nem"
              disabled={folyamatban}
              className={APRO_GOMB}
            >
              {cimkek.kifogasolom}
            </button>
          </div>
          <p className={SUGOSZOVEG}>{cimkek.valtoztathato}</p>
          <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
        </form>
      ) : null}
    </div>
  );
}
