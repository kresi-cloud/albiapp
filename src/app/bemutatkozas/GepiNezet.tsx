import {
  gepiSzempontNeve,
  vanGepiPont,
  type GepiPont,
} from "@/domain/gepi-ertekeles";
import { type Adatok, type Uzenet } from "@/domain/nyelv";
import { Sugo, Ures } from "@/components/ui/alap";

type Szoveg = (kulcs: string, adatok?: Adatok) => string;
type Uzenetezo = (uzenet: Uzenet) => string;

/**
 * A rendszer saját értékelése, csak az üzemeltetőnek.
 *
 * Minden szám mellett ott a minta mérete és az indoklás. Amire nincs elég
 * adat, az is látszik, üres ponttal: az üzemeltetőnek tudnia kell, mit nem tud
 * a rendszer — egy kihagyott sor azt sugallná, hogy a szempont nem is létezik.
 */
export function GepiNezet({
  pontok,
  sz,
  u,
}: {
  pontok: GepiPont[];
  sz: Szoveg;
  u: Uzenetezo;
}) {
  return (
    <section className="rounded-kartya border border-keret bg-felulet p-4">
      <h2 className="font-display text-base font-bold tracking-tight">
        {sz("gepi.cim")}
      </h2>
      <p className="text-sm text-halvany">{sz("gepi.alcim")}</p>

      {!vanGepiPont(pontok) ? (
        <div className="mt-3">
          <Ures>{sz("gepi.nincs_semmi")}</Ures>
        </div>
      ) : null}

      <ul className="mt-3 grid gap-3 text-sm">
        {pontok.map((sor) => (
          <li
            key={sor.szempont}
            className="border-t border-keret pt-3 first:border-t-0 first:pt-0"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-medium">
                {u(gepiSzempontNeve(sor.szempont))}
              </span>
              <span className="text-halvany">
                {sor.pont === null
                  ? sz("gepi.nincs_pont")
                  : sz("gepi.pont", { pont: sor.pont, minta: sor.minta })}
              </span>
            </div>
            <p className="mt-1 text-xs text-halvany">{u(sor.reszletezes)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <Sugo cim={sz("gepi.miert_cim")}>{sz("gepi.miert")}</Sugo>
      </div>
    </section>
  );
}
