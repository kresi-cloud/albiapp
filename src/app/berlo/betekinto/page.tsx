import { allapotNeve } from "@/domain/betekinto";
import { datumNyelven } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { berloBetekintoi, berloJogviszonyai } from "@/lib/betekinto";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";
import { BetekintoUrlap, VisszavonGomb } from "./Urlapok";

export const dynamic = "force-dynamic";

/**
 * A bérlő betekintő linkjei. Az ő oldala, mert az ő adatáról van szó: ő dönti
 * el, kinek adja ki, mennyi időre, és mikor vonja vissza.
 */
export default async function Betekintok() {
  const berlo = await kotelezoSzerep("berlo");
  const nyelv = await aktualisNyelv();
  const { sz, u } = szovegekNyelvvel(nyelv);

  const [linkek, jogviszonyok] = await Promise.all([
    berloBetekintoi(berlo.id),
    berloJogviszonyai(berlo.id),
  ]);

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">{sz("betekinto.oldal.cim")}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          {sz("betekinto.oldal.bevezeto")}
        </p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {sz("betekinto.oldal.mit_nem")}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{sz("betekinto.urlap.cim")}</h2>
        <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <BetekintoUrlap nyelv={nyelv} jogviszonyok={jogviszonyok} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{sz("betekinto.lista.cim")}</h2>
        {linkek.length === 0 ? (
          <p className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
            {sz("betekinto.lista.ures")}
          </p>
        ) : (
          <ul className="grid gap-3">
            {linkek.map((link) => (
              <li
                key={link.id}
                className="grid gap-2 rounded-lg border border-stone-200 bg-white p-4 text-sm dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-medium">{link.cel}</span>
                  <span className="text-xs text-stone-600 dark:text-stone-400">
                    {u(allapotNeve(link.allapot))}
                  </span>
                </div>

                {link.allapot === "elo" ? (
                  <p className="overflow-x-auto rounded bg-stone-100 px-2 py-1 font-mono text-xs dark:bg-stone-800">
                    /betekinto/{link.token}
                  </p>
                ) : null}

                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {sz("betekinto.lista.lejar", { nap: datumNyelven(link.lejar, nyelv) })}
                  {" · "}
                  {link.megnyitasok === 0
                    ? sz("betekinto.lista.megnyitas_soha")
                    : sz("betekinto.lista.megnyitas", { darab: link.megnyitasok })}
                  {link.utolsoMegnyitas
                    ? ` · ${sz("betekinto.lista.utoljara", {
                        nap: datumNyelven(link.utolsoMegnyitas, nyelv),
                      })}`
                    : ""}
                </p>

                {link.allapot === "elo" ? (
                  <VisszavonGomb id={link.id} cimke={sz("betekinto.lista.visszavon")} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
