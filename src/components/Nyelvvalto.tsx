import { NYELVEK, NYELV_NEVE, type Nyelv } from "@/domain/nyelv";
import { nyelvetValt } from "@/app/nyelv/actions";

/**
 * Nyelvváltó a fejlécben. Külön gomb nyelvenként, nem legördülő: két nyelvnél a
 * legördülő két kattintás, a gomb egy, és látszik, melyik az aktív.
 *
 * A két gomb egy közös keretben áll, mint egy kapcsoló: így egy elemnek
 * látszik, nem két különálló apró gombnak, és az is világos, hogy a kettő
 * egymás alternatívája.
 */
export function Nyelvvalto({ nyelv, cimke }: { nyelv: Nyelv; cimke: string }) {
  return (
    <form
      action={nyelvetValt}
      className="flex items-center gap-0.5 rounded-kartya border border-keret bg-felulet-halk p-0.5"
    >
      <span className="sr-only">{cimke}</span>
      {NYELVEK.map((valaszthato) => (
        <button
          key={valaszthato}
          type="submit"
          name="nyelv"
          value={valaszthato}
          aria-current={valaszthato === nyelv ? "true" : undefined}
          className={`rounded-[0.3rem] px-2 py-1 text-xs font-semibold uppercase transition-colors ${
            valaszthato === nyelv
              ? "bg-felulet text-szoveg shadow-xs"
              : "text-halvany hover:text-szoveg"
          }`}
          title={NYELV_NEVE[valaszthato]}
        >
          {valaszthato}
        </button>
      ))}
    </form>
  );
}
