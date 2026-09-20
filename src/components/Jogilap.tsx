import type { JogiOldal } from "@/domain/jogi";

/** Jogi tájékoztató megjelenítése. Szakaszcímek és bekezdések, semmi több. */
export function Jogilap({ oldal }: { oldal: JogiOldal }) {
  return (
    <article className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{oldal.cim}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">{oldal.bevezeto}</p>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{oldal.frissitve}</p>
      </header>

      {oldal.szakaszok.map((szakasz) => (
        <section key={szakasz.cim}>
          <h2 className="text-lg font-semibold">{szakasz.cim}</h2>
          <div className="mt-2 grid gap-2 text-sm text-stone-700 dark:text-stone-300">
            {szakasz.bekezdesek.map((bekezdes) => (
              <p key={bekezdes}>{bekezdes}</p>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
