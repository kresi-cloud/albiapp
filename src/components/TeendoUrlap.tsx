"use client";

import { useActionState } from "react";
import { teendotFelvesz, type Eredmeny } from "@/app/teendok/actions";
import { Mezo, Szovegdoboz, Valaszto } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import { CIMKE, GOMB, MEZO, SUGOSZOVEG } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export type JogviszonyValasztek = { id: string; cimke: string };

/**
 * Saját teendő felvétele.
 *
 * A mezők a megőrző mezők, mert egy elutasított mentés nem viheti el a
 * begépelt sort — itt pont az a bosszantó, hogy a szöveg hosszabb, mint a
 * javítás, amiért elutasítottuk.
 */
export function TeendoUrlap({
  jogviszonyok,
  mai,
  cimkek,
}: {
  jogviszonyok: JogviszonyValasztek[];
  /** A mai nap "ÉÉÉÉ-HH-NN" alakban: ez a határidő alapértelmezése. */
  mai: string;
  cimkek: {
    cim: string;
    cimHelyorzo: string;
    leiras: string;
    leirasSugo: string;
    esedekesseg: string;
    berlemeny: string;
    berlemenyNelkul: string;
    mentes: string;
    mentesFolyamatban: string;
  };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(teendotFelvesz, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-3">
      <Uzenetsav
        allapot={allapot.allapot}
        uzenet={allapot.uzenet}
        hibak={allapot.hibak}
      />

      <label className="grid gap-1">
        <span className={CIMKE}>{cimkek.cim}</span>
        <Mezo
          allapot={allapot.allapot}
          name="cim"
          type="text"
          maxLength={120}
          placeholder={cimkek.cimHelyorzo}
          className={MEZO}
        />
      </label>

      <label className="grid gap-1">
        <span className={CIMKE}>{cimkek.esedekesseg}</span>
        <Mezo
          allapot={allapot.allapot}
          name="esedekesseg"
          type="date"
          defaultValue={mai}
          className={MEZO}
        />
      </label>

      {jogviszonyok.length > 0 ? (
        <label className="grid gap-1">
          <span className={CIMKE}>{cimkek.berlemeny}</span>
          <Valaszto allapot={allapot.allapot} name="jogviszonyId" className={MEZO}>
            <option value="">{cimkek.berlemenyNelkul}</option>
            {jogviszonyok.map((sor) => (
              <option key={sor.id} value={sor.id}>
                {sor.cimke}
              </option>
            ))}
          </Valaszto>
        </label>
      ) : null}

      <label className="grid gap-1">
        <span className={CIMKE}>{cimkek.leiras}</span>
        <Szovegdoboz
          allapot={allapot.allapot}
          name="leiras"
          rows={2}
          maxLength={500}
          className={MEZO}
        />
        <span className={SUGOSZOVEG}>{cimkek.leirasSugo}</span>
      </label>

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? cimkek.mentesFolyamatban : cimkek.mentes}
      </button>
    </form>
  );
}
