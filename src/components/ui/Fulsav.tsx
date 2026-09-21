"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IKON_UTVONAL, IkonTobb } from "./ikonok";

/**
 * Az alsó fülsáv — a telefonos navigáció.
 *
 * Miért lett erre szükség: a fejlécben kilenc szöveges hivatkozás állt
 * egymás mellett, 360 képponton öt sorba törve. Ez a képernyő felső
 * negyedét elvette minden egyes lapon, ráadásul a hüvelykujjtól a
 * legtávolabbi sávban — pont ott, ahová telefonon a legnehezebb elérni.
 *
 * Helyette: négy gyakran használt hely az alsó sávban, ahol az ujj amúgy is
 * van, plusz egy „Több”, ami a ritkábbakat hozza elő. A négy kiválasztása nem
 * ízlés kérdése: a befizetés-egyeztetés, a rezsi és az adó a termék három
 * megkülönböztető funkciója, az áttekintő pedig a belépés helye. Az ingatlan-
 * és bérlőnyilvántartást havonta ha egyszer nyitja meg valaki.
 *
 * Nagyobb kijelzőn a sáv eltűnik, ott a fejléc vízszintes menüje marad, mert
 * ott elfér, és ott az egér útja a felső sávhoz a rövidebb.
 */

export type Fulelem = { kulcs: string; utvonal: string; cimke: string };

export function Fulsav({
  fulek,
  tobbi,
  tobbCimke,
  bezarasCimke,
  lablec,
}: {
  /** Az alsó sávban látszó helyek. */
  fulek: Fulelem[];
  /** Ami a „Több” alá kerül. Ha üres, a „Több” gomb sem jelenik meg. */
  tobbi: Fulelem[];
  tobbCimke: string;
  bezarasCimke: string;
  /** Nyelvváltó és kilépés — ezek is a „Több” lapjára kerülnek telefonon. */
  lablec?: React.ReactNode;
}) {
  const utvonal = usePathname();
  const [nyitva, nyitvaAllit] = useState(false);

  // Navigáció után magától csukódjon be: aki választott a listából, az már nem
  // a listát akarja nézni.
  useEffect(() => {
    nyitvaAllit(false);
  }, [utvonal]);

  const tobbiAktiv = tobbi.some((elem) => aktiv(utvonal, elem.utvonal));

  return (
    <>
      {nyitva ? (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => nyitvaAllit(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-keret bg-felulet pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
            onClick={(esemeny) => esemeny.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-keret-eros" />
            <nav className="grid gap-1 p-3">
              {tobbi.map((elem) => {
                const Ikon = IKON_UTVONAL[elem.utvonal];
                return (
                  <Link
                    key={elem.utvonal}
                    href={elem.utvonal}
                    className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                      aktiv(utvonal, elem.utvonal)
                        ? "bg-kiemelt-lap text-kiemelt"
                        : "text-szoveg hover:bg-felulet-halk"
                    }`}
                  >
                    {Ikon ? <Ikon meret={20} /> : null}
                    {elem.cimke}
                  </Link>
                );
              })}
            </nav>
            {lablec ? (
              <div className="flex flex-wrap items-center gap-3 border-t border-keret px-4 py-3">
                {lablec}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <nav
        aria-label={tobbCimke}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-keret bg-felulet pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {fulek.map((elem) => {
            const Ikon = IKON_UTVONAL[elem.utvonal];
            const be = aktiv(utvonal, elem.utvonal) && !nyitva;
            return (
              <li key={elem.utvonal} className="min-w-0 flex-1">
                <Link
                  href={elem.utvonal}
                  aria-current={be ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 ${
                    be ? "text-kiemelt" : "text-halvany"
                  }`}
                >
                  {Ikon ? <Ikon meret={22} /> : null}
                  <span className="w-full truncate text-center text-[11px] leading-4 font-medium">
                    {elem.cimke}
                  </span>
                </Link>
              </li>
            );
          })}
          {tobbi.length > 0 ? (
            <li className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => nyitvaAllit((elozo) => !elozo)}
                aria-expanded={nyitva}
                className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 px-1 ${
                  nyitva || tobbiAktiv ? "text-kiemelt" : "text-halvany"
                }`}
              >
                <IkonTobb meret={22} />
                <span className="w-full truncate text-center text-[11px] leading-4 font-medium">
                  {nyitva ? bezarasCimke : tobbCimke}
                </span>
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
    </>
  );
}

/**
 * Melyik fül van kiemelve.
 *
 * Az áttekintő és a bérlemény lapja gyökérútvonal, ezért azokra csak a pontos
 * egyezés számít — különben minden aloldalon az áttekintő világítana.
 */
function aktiv(jelenlegi: string, utvonal: string) {
  if (utvonal === "/" || utvonal === "/berlo") return jelenlegi === utvonal;
  return jelenlegi === utvonal || jelenlegi.startsWith(`${utvonal}/`);
}
