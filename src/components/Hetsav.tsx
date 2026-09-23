import Link from "next/link";
import type { KovetkezoHet } from "@/domain/naptar";
import { hetNapjaiNyelven, type Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import type { Surgosseg } from "@/domain/teendok";
import { napKulcs } from "@/components/Naptar";

/**
 * A következő hét nap a nyitólapon.
 *
 * A nyitólap eddig azt mondta meg, mi van hátra, azt viszont nem, hogy mikor.
 * Ez a sáv egyetlen sorban megmutatja a hét napját: melyikre esik teendő, és
 * melyik szabad. Ez az a kérdés, amit valaki reggel a telefonján megnéz.
 *
 * Hét nap, mert 360 képponton hét cella fér ki egy sorban — nyolcnál már
 * törne, és egy két sorba tört hétsáv nem sáv, hanem egy második naptár.
 *
 * A lejárt teendő nem a mai cellába kerül, hanem külön sorba fölé: a ma
 * esedékes és a két hete lejárt nem ugyanaz, és egy cellában nem is lehetne
 * megkülönböztetni őket.
 */

const PONT: Record<Surgosseg, string> = {
  lejart: "bg-gond",
  ma: "bg-figyelem",
  kozeli: "bg-albi-700",
  kesobbi: "bg-keret-eros",
};

export function Hetsav({
  het,
  nyelv,
  utvonal,
}: {
  het: KovetkezoHet;
  nyelv: Nyelv;
  /** A teendők lapja: a cellák és a lejárt sor is ide visznek. */
  utvonal: string;
}) {
  const { sz } = szovegekNyelvvel(nyelv);
  const napNevek = hetNapjaiNyelven(nyelv);

  return (
    <section className="rounded-kartya border border-keret bg-felulet p-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-bold tracking-tight">
          {sz("hetsav.cim")}
        </h2>
        <Link href={utvonal} className="shrink-0 text-xs font-semibold text-kiemelt hover:underline">
          {sz("hetsav.mind")}
        </Link>
      </div>

      {het.lejart.length > 0 ? (
        <Link
          href={utvonal}
          className="mt-2 flex min-h-9 items-center gap-2 rounded-lg border border-gond-keret bg-gond-lap px-2 text-xs font-medium text-gond"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-gond" />
          {sz("hetsav.lejart", { darab: het.lejart.length })}
        </Link>
      ) : null}

      <div className="mt-2 grid grid-cols-7 gap-0.5">
        {het.napok.map((nap) => {
          // A napnév a hétfős tömbből jön: vasárnap 0, tehát az az utolsó elem.
          const nev = napNevek[(nap.nap.getUTCDay() + 6) % 7];
          const tartalom = (
            <>
              <span
                className={`text-[0.65rem] leading-none ${
                  nap.hetvege ? "text-nagyon-halvany" : "text-halvany"
                }`}
              >
                {nev}
              </span>
              <span
                className={`mt-0.5 text-sm leading-none ${
                  nap.ma ? "font-bold text-kiemelt" : "text-szoveg"
                }`}
              >
                {nap.sorszam}
              </span>
              <span className="mt-1 flex h-1.5 items-center gap-0.5">
                {nap.jelzes ? (
                  <span className={`size-1.5 rounded-full ${PONT[nap.jelzes]}`} />
                ) : null}
                {nap.teendok.length > 1 ? (
                  <span className="text-[0.6rem] leading-none text-halvany">
                    {nap.teendok.length}
                  </span>
                ) : null}
              </span>
            </>
          );

          const osztaly = `flex min-h-12 flex-col items-center justify-center rounded-lg border ${
            nap.ma ? "border-keret-eros" : "border-transparent"
          }`;

          if (nap.teendok.length === 0) {
            return (
              <div key={nap.nap.toISOString()} className={osztaly}>
                {tartalom}
              </div>
            );
          }

          return (
            <Link
              key={nap.nap.toISOString()}
              href={`${utvonal}?nap=${napKulcs(nap.nap)}`}
              className={`${osztaly} transition-colors hover:bg-felulet-halk`}
            >
              {tartalom}
            </Link>
          );
        })}
      </div>

      {het.lejart.length === 0 && het.napok.every((nap) => nap.teendok.length === 0) ? (
        <p className="mt-2 text-center text-xs text-halvany">{sz("hetsav.szabad")}</p>
      ) : null}
    </section>
  );
}
