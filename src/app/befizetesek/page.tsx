import Link from "next/link";
import { Allapotjelzo } from "@/components/Allapotjelzo";
import { datum, forint } from "@/domain/penz";
import { egyeztetesBeallitasok, jogviszonyNezetek } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { KivonatFeltoltes } from "./KivonatFeltoltes";

export const dynamic = "force-dynamic";

export default async function Befizetesek() {
  const berbeado = await kotelezoSzerep("berbeado");

  const nezetek = await jogviszonyNezetek(berbeado.id);
  const beallitasok = await egyeztetesBeallitasok(berbeado.id);

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Befizetések</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Három adat találkozik: mit kellett volna fizetni, mit mond a bérlő, és
          mit mutat a kivonatod.
        </p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Párosítási ablak: az esedékesség előtt {beallitasok.korabbiAblakNap},
          utána {beallitasok.kesobbiAblakNap} nap.{" "}
          <Link href="/beallitasok" className="underline underline-offset-2">
            Átállítom
          </Link>
        </p>
      </section>

      <KivonatFeltoltes
        jogviszonyok={nezetek.map((nezet) => ({
          id: nezet.id,
          cimke: `${nezet.ingatlanMegnevezes} — ${nezet.berlokNeve}`,
        }))}
      />

      {nezetek.map((nezet) => (
        <section key={nezet.id} className="grid gap-3">
          <div>
            <h2 className="font-semibold">{nezet.ingatlanMegnevezes}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {nezet.berlokNeve} · {forint(nezet.berletiDijFt)} / hó
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
                      cimke="Bérlő által igazolt befizetés"
                      ertek={
                        sor.igazolasOsszegFt !== null && sor.igazolasDatuma
                          ? `${forint(sor.igazolasOsszegFt)} · ${datum(sor.igazolasDatuma)}`
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
