import Link from "next/link";
import type { Surgosseg, TeendoSurgosseggel } from "@/domain/teendok";
import { datumNyelven, type Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { Jelzo, Ures, type Allapotszin } from "@/components/ui/alap";
import { IkonNyil } from "@/components/ui/ikonok";
import { TeendoLezaras } from "./TeendoLezaras";

const CIMKE: Record<Surgosseg, string> = {
  lejart: "teendo.lejart",
  ma: "teendo.ma",
  kozeli: "teendo.kozeli",
  kesobbi: "teendo.kesobbi",
};

const SZIN: Record<Surgosseg, Allapotszin> = {
  lejart: "gond",
  ma: "figyelem",
  kozeli: "semleges",
  kesobbi: "semleges",
};

/**
 * A sürgősség színe egy bal oldali sávon jelenik meg, nem a kártya teljes
 * hátterén.
 *
 * Korábban az egész kártya rózsaszín lett, ha lejárt. Öt lejárt teendőnél ez
 * öt rózsaszín téglalap egymás alatt: a szín így semmit nem emel ki, mert
 * minden ki van emelve, és a szöveg is nehezebben olvasható rajta. Egy vékony
 * sáv a szélen ugyanazt mondja el, és futólag végigpásztázva is látszik, hol
 * kezdődik a sorban a sürgős rész.
 */
const SAV: Record<Surgosseg, string> = {
  lejart: "bg-gond",
  ma: "bg-figyelem",
  kozeli: "bg-keret-eros",
  kesobbi: "bg-keret",
};

export function Teendolista({
  teendok,
  nyelv,
}: {
  teendok: TeendoSurgosseggel[];
  nyelv: Nyelv;
}) {
  const { sz, u } = szovegekNyelvvel(nyelv);

  if (teendok.length === 0) {
    return <Ures>{sz("teendo.nincs")}</Ures>;
  }

  return (
    <ul className="grid gap-2">
      {teendok.map((teendo) => {
        const fej = (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Jelzo allapot={SZIN[teendo.surgosseg]}>{sz(CIMKE[teendo.surgosseg])}</Jelzo>
              <span className="szam text-xs text-halvany">
                {datumNyelven(teendo.esedekesseg, nyelv)}
              </span>
            </div>
            <p className="mt-1.5 leading-snug font-semibold text-pretty">{u(teendo.cim)}</p>
            {teendo.leiras ? (
              <p className="szam mt-0.5 text-sm text-halvany">{u(teendo.leiras)}</p>
            ) : null}
          </>
        );

        // Ahol csak megnézni lehet valamit, ott az egész kártya visz oda: egy
        // telefonon a sarokba tett hivatkozás akkora célpont, amit el kell
        // találni, a kártya viszont nem. Ahol lezárható a teendő, ott marad a
        // külön hivatkozás, mert gomb nem állhat hivatkozáson belül.
        const egeszenHivatkozas = Boolean(teendo.hivatkozas) && !teendo.tarolt;

        return (
          <li
            key={teendo.kulcs}
            className="flex overflow-hidden rounded-kartya border border-keret bg-felulet"
          >
            <div className={`w-1 shrink-0 ${SAV[teendo.surgosseg]}`} aria-hidden="true" />
            {egeszenHivatkozas ? (
              <Link
                href={teendo.hivatkozas as string}
                className="group flex min-w-0 flex-1 items-center gap-3 p-3 transition-colors hover:bg-felulet-halk"
              >
                <span className="min-w-0 flex-1">{fej}</span>
                <IkonNyil
                  meret={18}
                  osztaly="shrink-0 text-nagyon-halvany transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ) : (
              <div className="min-w-0 flex-1 p-3">
                {fej}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {teendo.hivatkozas ? (
                    <Link
                      href={teendo.hivatkozas}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-albi-700 hover:text-albi-800 dark:text-albi-300"
                    >
                      {sz("teendo.megnezem")}
                      <IkonNyil meret={14} />
                    </Link>
                  ) : null}
                  {teendo.tarolt ? (
                    <TeendoLezaras
                      kulcs={teendo.kulcs}
                      cimke={sz("teendo.kesz")}
                      folyamatbanCimke={sz("teendo.lezarom")}
                    />
                  ) : null}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
