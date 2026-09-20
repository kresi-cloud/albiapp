import type { Allapot } from "@/domain/egyeztetes";

const STILUS: Record<Allapot, string> = {
  egyezik:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  elter: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  hianyzik: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

const SZOVEG: Record<Allapot, string> = {
  egyezik: "Egyezik",
  elter: "Eltér",
  hianyzik: "Hiányzik",
};

export function Allapotjelzo({ allapot }: { allapot: Allapot }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STILUS[allapot]}`}
    >
      {SZOVEG[allapot]}
    </span>
  );
}
