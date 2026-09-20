import { Allapotjelzo } from "@/components/Allapotjelzo";
import { datum, forint } from "@/domain/penz";
import { aktualisBerbeado, jogviszonyNezetek } from "@/lib/lekerdezesek";
import { KivonatFeltoltes } from "./KivonatFeltoltes";

export const dynamic = "force-dynamic";

export default async function Befizetesek() {
  const berbeado = await aktualisBerbeado();
  if (!berbeado) return <p>Még nincs bérbeadó az adatbázisban.</p>;

  const nezetek = await jogviszonyNezetek(berbeado.id);

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Befizetések</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Három adat találkozik: mit kellett volna fizetni, mit mond a bérlő, és
          mit mutat a kivonatod.
        </p>
      </section>

      <KivonatFeltoltes
        jogviszonyok={nezetek.map((nezet) => ({
          id: nezet.id,
          cimke: `${nezet.ingatlanMegnevezes} — ${nezet.berloNev}`,
        }))}
      />

      {nezetek.map((nezet) => (
        <section key={nezet.id} className="grid gap-3">
          <div>
            <h2 className="font-semibold">{nezet.ingatlanMegnevezes}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {nezet.berloNev} · {forint(nezet.berletiDijFt)} / hó
            </p>
          </div>

          {nezet.egyeztetesek.length === 0 ? (
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Ehhez a jogviszonyhoz még nincs egyeztetendő tétel.
            </p>
          ) : (
            <ul className="grid gap-2">
              {nezet.egyeztetesek.map((sor) => (
                <li
                  key={`${sor.eloirtTetelId ?? "nincs"}-${sor.kivonattetelId ?? "nincs"}`}
                  className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {sor.idoszak ?? "Nincs előírás"}
                      {sor.osszegFt > 0 ? ` · ${forint(sor.osszegFt)}` : ""}
                    </span>
                    <Allapotjelzo allapot={sor.allapot} />
                  </div>

                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                    {sor.magyarazat}
                  </p>

                  <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                    <Reszlet
                      cimke="Előírás"
                      ertek={sor.eloirtTetelId ? `${forint(sor.osszegFt)} · ${datum(sor.esedekesseg)}` : "—"}
                    />
                    <Reszlet
                      cimke="A bérlő jelölése"
                      ertek={
                        sor.jelolesOsszegFt !== null && sor.jelolesDatuma
                          ? `${forint(sor.jelolesOsszegFt)} · ${datum(sor.jelolesDatuma)}`
                          : "—"
                      }
                    />
                    <Reszlet
                      cimke="A kivonaton"
                      ertek={
                        sor.kivonatOsszegFt !== null && sor.kivonatDatuma
                          ? `${forint(sor.kivonatOsszegFt)} · ${datum(sor.kivonatDatuma)}`
                          : "—"
                      }
                    />
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function Reszlet({ cimke, ertek }: { cimke: string; ertek: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {cimke}
      </dt>
      <dd className="tabular-nums">{ertek}</dd>
    </div>
  );
}
