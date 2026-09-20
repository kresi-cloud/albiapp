"use client";

import { useActionState } from "react";
import { Uzenetsav } from "@/components/Uzenetsav";
import { forint } from "@/domain/penz";
import { szerzodestKeszit, type Eredmeny as SzerzodesEredmeny } from "@/app/szerzodesek/actions";
import { igazolastKiallit, jegyzokonyvetKeszit, type Eredmeny } from "./actions";
import { MEZO, GOMB, HALVANY_GOMB } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };
const SZERZODES_KEZDETI: SzerzodesEredmeny = { allapot: "ures", uzenet: "", hibak: [] };

export function UjSzerzodes({ jogviszonyId }: { jogviszonyId: string }) {
  const [allapot, kuldes, folyamatban] = useActionState(szerzodestKeszit, SZERZODES_KEZDETI);

  return (
    <form action={kuldes} className="mt-2 grid gap-2">
      <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
      <button type="submit" disabled={folyamatban} className={HALVANY_GOMB}>
        {folyamatban ? "Készítem…" : "Szerződéstervezet készítése"}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export function UjJegyzokonyv({
  jogviszonyId,
  fajta,
  cimke,
}: {
  jogviszonyId: string;
  fajta: "birtokbaadas" | "visszaadas";
  cimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(jegyzokonyvetKeszit, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-2">
      <input type="hidden" name="jogviszonyId" value={jogviszonyId} />
      <input type="hidden" name="fajta" value={fajta} />
      <button type="submit" disabled={folyamatban} className={HALVANY_GOMB}>
        {folyamatban ? "Készítem…" : cimke}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}

export type IdoszakValaszthato = { idoszak: string; cimke: string; osszegFt: number };

export function UjIgazolas({
  jogviszonyBerloId,
  berloNev,
  idoszakok,
}: {
  jogviszonyBerloId: string;
  berloNev: string;
  idoszakok: IdoszakValaszthato[];
}) {
  const [allapot, kuldes, folyamatban] = useActionState(igazolastKiallit, KEZDETI);

  if (idoszakok.length === 0) {
    return (
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        {berloNev}: még nincs beazonosított befizetés, amiről igazolást lehetne kiállítani.
      </p>
    );
  }

  return (
    <form action={kuldes} className="mt-2 grid gap-3">
      <input type="hidden" name="jogviszonyBerloId" value={jogviszonyBerloId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Tárgyhó</span>
          <select name="idoszak" className={MEZO} defaultValue={idoszakok[0].idoszak}>
            {idoszakok.map((sor) => (
              <option key={sor.idoszak} value={sor.idoszak}>
                {sor.cimke} · {forint(sor.osszegFt)} érkezett
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Ehhez a bérlőhöz igazolt összeg</span>
          <input
            name="osszegFt"
            inputMode="numeric"
            placeholder="a teljes befolyt összeg"
            className={MEZO}
          />
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Üresen hagyva a hónapra beérkezett teljes összeget igazolom.
          </span>
        </label>

        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Mihez kell</span>
          <input
            name="cel"
            defaultValue="a lakhatási támogatáshoz"
            className={MEZO}
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Teljesítés módja</span>
          <select name="teljesitesModja" className={MEZO} defaultValue="atutalas">
            <option value="atutalas">banki átutalás</option>
            <option value="keszpenz">készpénz</option>
            <option value="egyeb">egyéb</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Kiállítás helye</span>
          <input name="kiallitasHelye" className={MEZO} />
        </label>
      </div>

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? "Kiállítom…" : `Igazolás ${berloNev} részére`}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
