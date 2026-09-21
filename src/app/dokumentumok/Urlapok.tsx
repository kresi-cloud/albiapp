"use client";

import { useActionState } from "react";
import { Mezo, Valaszto } from "@/components/megorzo";
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
          <Valaszto
            name="idoszak"
            className={MEZO}
            defaultValue={idoszakok[0].idoszak}
            allapot={allapot.allapot}
          >
            {idoszakok.map((sor) => (
              <option key={sor.idoszak} value={sor.idoszak}>
                {sor.cimke} · {forint(sor.osszegFt)} érkezett
              </option>
            ))}
          </Valaszto>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Ehhez a bérlőhöz igazolt összeg</span>
          <Mezo
            name="osszegFt"
            inputMode="numeric"
            placeholder="a teljes befolyt összeg"
            className={MEZO}
            allapot={allapot.allapot}
          />
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Üresen hagyva a hónapra beérkezett teljes összeget igazolom.
          </span>
        </label>

        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Mihez kell</span>
          <Mezo
            name="cel"
            defaultValue="a lakhatási támogatáshoz"
            className={MEZO}
            required
            allapot={allapot.allapot}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Teljesítés módja</span>
          <Valaszto
            name="teljesitesModja"
            className={MEZO}
            defaultValue="atutalas"
            allapot={allapot.allapot}
          >
            <option value="atutalas">banki átutalás</option>
            <option value="keszpenz">készpénz</option>
            <option value="egyeb">egyéb</option>
          </Valaszto>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Kiállítás helye</span>
          <Mezo name="kiallitasHelye" className={MEZO} allapot={allapot.allapot} />
        </label>
      </div>

      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? "Kiállítom…" : `Igazolás ${berloNev} részére`}
      </button>
      <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
    </form>
  );
}
