/**
 * Az alkalmazás jele és névhúzása.
 *
 * Munkanévvel dolgozunk, ezért a jel szándékosan egyszerű: egy tető, alatta
 * egy fillérrel — bérbeadás és pénz, ennyi a termék. Nem rajz, hanem két
 * vonal, mert 20 képponton, a fejlécben ennyi látszik belőle, és mert egy
 * későbbi névváltást nem szabad megdrágítania.
 */
export function Jel({ meret = 28 }: { meret?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[0.5rem] bg-albi-700 text-white"
      style={{ width: meret, height: meret }}
      aria-hidden="true"
    >
      <svg
        width={Math.round(meret * 0.62)}
        height={Math.round(meret * 0.62)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 11 12 4l8.5 7" />
        <path d="M9 20V13h6" />
        <path d="M7.5 16.5h5" />
      </svg>
    </span>
  );
}

export function Nevhuzas({ meret = 28 }: { meret?: number }) {
  return (
    <span className="flex items-center gap-2">
      <Jel meret={meret} />
      <span className="font-display text-lg leading-none font-extrabold tracking-tight">
        Albi
      </span>
    </span>
  );
}
