import type { JogiOldal } from "@/domain/jogi";
import { Lapfej, Szakaszcim } from "@/components/ui/alap";

/** Jogi tájékoztató megjelenítése. Szakaszcímek és bekezdések, semmi több. */
export function Jogilap({ oldal }: { oldal: JogiOldal }) {
  return (
    <article className="mx-auto grid max-w-2xl gap-6">
      <header>
        <Lapfej cim={oldal.cim} alcim={oldal.bevezeto} />
        <p className="mt-2 text-xs text-nagyon-halvany">{oldal.frissitve}</p>
      </header>

      {oldal.szakaszok.map((szakasz) => (
        <section key={szakasz.cim}>
          <Szakaszcim>{szakasz.cim}</Szakaszcim>
          <div className="grid gap-2 text-sm leading-relaxed text-szoveg">
            {szakasz.bekezdesek.map((bekezdes) => (
              <p key={bekezdes}>{bekezdes}</p>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
