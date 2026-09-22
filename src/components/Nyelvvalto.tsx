import { NYELVEK, NYELV_NEVE, type Nyelv } from "@/domain/nyelv";
import { nyelvetValt } from "@/app/nyelv/actions";

/**
 * Nyelvváltó a fejlécben. Külön gomb nyelvenként, nem legördülő: két nyelvnél a
 * legördülő két kattintás, a gomb egy, és látszik, melyik az aktív.
 */
export function Nyelvvalto({ nyelv, cimke }: { nyelv: Nyelv; cimke: string }) {
  return (
    <form action={nyelvetValt} className="flex items-center gap-1">
      <span className="sr-only">{cimke}</span>
      {NYELVEK.map((valaszthato) => (
        <button
          key={valaszthato}
          type="submit"
          name="nyelv"
          value={valaszthato}
          aria-current={valaszthato === nyelv ? "true" : undefined}
          className={`rounded px-1.5 py-0.5 text-xs font-medium uppercase ${
            valaszthato === nyelv
              ? "bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100"
              : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          }`}
          title={NYELV_NEVE[valaszthato]}
        >
          {valaszthato}
        </button>
      ))}
    </form>
  );
}
