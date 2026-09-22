import type { Allapot } from "@/domain/egyeztetes";
import type { Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";

const STILUS: Record<Allapot, string> = {
  egyezik:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  elter: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  // A vitás nem ugyanaz, mint az eltérő: ott a két fél mond mást, és csak ott
  // kérünk bizonylatot. A várakozó pedig még semmiképp nem baj.
  vitas: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  varakozik: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  hianyzik: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

const KULCS: Record<Allapot, string> = {
  egyezik: "egyeztetes.egyezik",
  elter: "egyeztetes.elter",
  vitas: "egyeztetes.vitas_cimke",
  varakozik: "egyeztetes.varakozik_cimke",
  hianyzik: "egyeztetes.hianyzik_cimke",
};

export function Allapotjelzo({ allapot, nyelv = "hu" }: { allapot: Allapot; nyelv?: Nyelv }) {
  const { sz } = szovegekNyelvvel(nyelv);

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${STILUS[allapot]}`}
    >
      {sz(KULCS[allapot])}
    </span>
  );
}
