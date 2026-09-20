import { mondatok } from "@/domain/betekinto";
import { datumNyelven, forintNyelven } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { nyilvanosNezet } from "@/lib/betekinto";
import { aktualisNyelv } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

/**
 * A betekintő nyilvános oldala. Nincs belépés: a token maga a jogosultság, és
 * a link rövid életű. A megnyitást a lekérdezés jegyzi fel, hogy a bérlő lássa,
 * hányszor nézték meg — időponttal, és semmi mással.
 */
export default async function BetekintoOldal({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const nyelv = await aktualisNyelv();
  const { sz, u } = szovegekNyelvvel(nyelv);
  const nezet = await nyilvanosNezet(token);

  if (!nezet) {
    return (
      <div className="mx-auto grid max-w-lg gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {sz("betekinto.nyilvanos.nincs")}
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          {sz("betekinto.nyilvanos.nincs_bevezeto")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-lg gap-6">
      <section>
        <p className="text-sm text-stone-600 dark:text-stone-400">{nezet.cel}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {sz("betekinto.nyilvanos.berlo", { nev: nezet.berloNeve })}
        </h1>
      </section>

      <section className="grid gap-1 rounded-lg border border-stone-200 bg-white p-4 text-sm dark:border-stone-800 dark:bg-stone-900">
        {nezet.telepules ? (
          <p>{sz("betekinto.nyilvanos.telepules", { telepules: nezet.telepules })}</p>
        ) : null}
        <p>
          {sz("betekinto.nyilvanos.kezdete", {
            nap: datumNyelven(nezet.jogviszonyKezdete, nyelv),
          })}
        </p>
        <p>
          {nezet.jogviszonyEl
            ? sz("betekinto.nyilvanos.el")
            : sz("betekinto.nyilvanos.lezart")}
        </p>
        {nezet.berletiDijFt === null ? null : (
          <p>
            {sz("betekinto.nyilvanos.dij", {
              dij: forintNyelven(nezet.berletiDijFt, nyelv),
            })}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">{sz("betekinto.nyilvanos.cim")}</h2>
        <ul className="grid gap-2">
          {mondatok(nezet.osszesites).map((mondat) => (
            <li
              key={mondat.kulcs}
              className="rounded-lg border border-stone-200 bg-white p-3 text-sm dark:border-stone-800 dark:bg-stone-900"
            >
              {u(mondat)}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-2 text-xs text-stone-600 dark:text-stone-400">
        <p>{sz("betekinto.nyilvanos.honnan")}</p>
        <p>{sz("betekinto.nyilvanos.nincs_pontszam")}</p>
        <p>
          {sz("betekinto.nyilvanos.kiadva", {
            nap: datumNyelven(nezet.kiadva, nyelv),
            lejar: datumNyelven(nezet.lejar, nyelv),
          })}
        </p>
      </section>
    </div>
  );
}
