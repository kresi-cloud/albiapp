import { haviAllapotNeve, mondatok } from "@/domain/betekinto";
import { datumNyelven, forintNyelven, honapNyelven } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { nyilvanosNezet } from "@/lib/betekinto";
import { aktualisNyelv } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

/**
 * A betekintő nyilvános oldala. Nincs belépés: a token maga a jogosultság, és
 * a link visszavonható. A megnyitást a lekérdezés jegyzi fel, hogy a bérlő
 * lássa, hányszor nézték meg — időponttal, és semmi mással.
 *
 * A sorrend a szülői olvasathoz igazodik: elöl az, hol tart most a bérlemény,
 * utána a hónapról hónapra bontás, és csak a végén az összesített előzmény.
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

  const { osszesites } = nezet;

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

      {osszesites.honapok === 0 ? null : (
        <section>
          <h2 className="mb-2 text-lg font-semibold">{sz("betekinto.nyilvanos.most")}</h2>
          <div
            className={`grid gap-1 rounded-lg border p-4 text-sm ${
              osszesites.nyitottFt === 0
                ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            }`}
          >
            {osszesites.nyitottFt === 0 ? (
              <p>{sz("betekinto.nyilvanos.nyitott_nincs")}</p>
            ) : (
              <>
                <p className="font-medium">
                  {nezet.osszegetMutat
                    ? sz("betekinto.nyilvanos.nyitott", {
                        osszeg: forintNyelven(osszesites.nyitottFt, nyelv),
                      })
                    : u({
                        kulcs: "betekinto.mondat.hianyzo",
                        adatok: { hianyzo: osszesites.hianyzo },
                      })}
                </p>
                <p className="text-xs">{sz("betekinto.nyilvanos.nyitott_sugo")}</p>
              </>
            )}
          </div>
        </section>
      )}

      {nezet.honapok.length === 0 ? null : (
        <section>
          <h2 className="mb-1 text-lg font-semibold">{sz("betekinto.nyilvanos.havi_cim")}</h2>
          <p className="mb-2 text-xs text-stone-600 dark:text-stone-400">
            {sz("betekinto.nyilvanos.havi_sugo")}
          </p>
          <ul className="grid gap-2">
            {nezet.honapok.map((honap) => (
              <li
                key={honap.idoszak}
                className="grid gap-1 rounded-lg border border-stone-200 bg-white p-3 text-sm dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-medium">{honapNyelven(honap.idoszak, nyelv)}</span>
                  <span
                    className={
                      honap.allapot === "hianyzik"
                        ? "text-xs text-amber-700 dark:text-amber-400"
                        : "text-xs text-stone-600 dark:text-stone-400"
                    }
                  >
                    {u(haviAllapotNeve(honap))}
                  </span>
                </div>
                {nezet.osszegetMutat ? (
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {sz("betekinto.nyilvanos.eloirt")}: {forintNyelven(honap.eloirtFt, nyelv)}
                    {" · "}
                    {sz("betekinto.nyilvanos.erkezett")}:{" "}
                    {forintNyelven(honap.erkezettFt, nyelv)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold">{sz("betekinto.nyilvanos.cim")}</h2>
        <ul className="grid gap-2">
          {mondatok(osszesites).map((mondat) => (
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
