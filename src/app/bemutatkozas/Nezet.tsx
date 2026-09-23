import {
  atlagMondata,
  ertekelesekSzama,
  iranya,
  nincsErtekelesMondata,
  szempontonkent,
  type Bemutatkozo,
} from "@/domain/bemutatkozas";
import { SZEMPONTOK, pontja, szempontNeve } from "@/domain/ertekeles";
import {
  datumNyelven,
  type Adatok,
  type Nyelv,
  type Uzenet,
} from "@/domain/nyelv";
import { Sugo, Ures } from "@/components/ui/alap";

type Szoveg = (kulcs: string, adatok?: Adatok) => string;
type Uzenetezo = (uzenet: Uzenet) => string;

/**
 * A bemutatkozó oldal törzse, ugyanaz a sajátnak és a rendszergazda nézetének.
 *
 * Egy összesített pontszám nincs rajta, és ez szándékos: a szempontok külön
 * állnak, mert külön dolgot mondanak. Az átlag mellett mindig ott a darabszám,
 * mert két értékelés átlaga nem ugyanaz, mint tízé.
 */
export function BemutatkozoNezet({
  lap,
  sajat,
  nyelv,
  sz,
  u,
}: {
  lap: Bemutatkozo;
  sajat: boolean;
  nyelv: Nyelv;
  sz: Szoveg;
  u: Uzenetezo;
}) {
  const irany = iranya(lap.szerep);
  const osszesitok = szempontonkent(lap);
  const darab = ertekelesekSzama(lap);

  return (
    <div className="grid gap-4">
      <section className="rounded-kartya border border-keret bg-felulet p-4">
        <h2 className="font-display text-base font-bold tracking-tight">
          {lap.nev}
        </h2>
        <p className="text-sm text-halvany">
          {sz(`bemutatkozas.szerep.${lap.szerep}`)}
        </p>
        {lap.bemutatkozas ? (
          <p className="mt-3 text-sm whitespace-pre-line">{lap.bemutatkozas}</p>
        ) : (
          <p className="mt-3 text-sm text-halvany">
            {sz(sajat ? "bemutatkozas.ures_sajat" : "bemutatkozas.ures_masike")}
          </p>
        )}
      </section>

      <section className="rounded-kartya border border-keret bg-felulet p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-bold tracking-tight">
            {sz("bemutatkozas.ertekelesek_cim")}
          </h2>
          <p className="text-sm text-halvany">
            {sz("bemutatkozas.darab", { darab })}
          </p>
        </div>

        {darab === 0 ? (
          <div className="mt-3">
            <Ures>{u(nincsErtekelesMondata(sajat))}</Ures>
          </div>
        ) : null}

        {osszesitok.length > 0 ? (
          <ul className="mt-3 grid gap-2 text-sm">
            {osszesitok.map((sor) => (
              <li
                key={sor.szempont}
                className="flex flex-wrap items-baseline justify-between gap-x-3"
              >
                <span>{u(szempontNeve(irany, sor.szempont))}</span>
                <span className="text-halvany">{u(atlagMondata(sor))}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {lap.ertekelesek.map((ertekeles) => (
        <section
          key={`${ertekeles.szerzoId}:${ertekeles.letrehozva.toISOString()}`}
          className="rounded-kartya border border-keret bg-felulet p-4"
        >
          <ul className="grid gap-1 text-sm">
            {SZEMPONTOK[irany].map((szempont) => {
              const pont = pontja(ertekeles, szempont);
              if (pont === null) return null;
              return (
                <li key={szempont}>
                  {sz("ertekeles.pont_cimke", {
                    szempont: u(szempontNeve(irany, szempont)),
                    pont,
                  })}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-sm whitespace-pre-line">{ertekeles.szoveg}</p>
          <p className="mt-1 text-xs text-nagyon-halvany">
            {datumNyelven(ertekeles.letrehozva, nyelv)}
          </p>
        </section>
      ))}

      <Sugo cim={sz("bemutatkozas.nem_nyilvanos_cim")}>
        {sz("bemutatkozas.nem_nyilvanos")}
      </Sugo>
      <Sugo cim={sz("bemutatkozas.rejtett_cim")}>
        {sz("bemutatkozas.rejtett")}
      </Sugo>
    </div>
  );
}
