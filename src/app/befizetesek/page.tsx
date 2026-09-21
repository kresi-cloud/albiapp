import Link from "next/link";
import { Allapotjelzo } from "@/components/Allapotjelzo";
import { datum, forint } from "@/domain/penz";
import { egyeztetesBeallitasok, jogviszonyNezetek } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { Beerkezes, BeerkezestVisszavon, NemErkezett } from "./Urlapok";

export const dynamic = "force-dynamic";

export default async function Befizetesek() {
  const berbeado = await kotelezoSzerep("berbeado");

  const { u } = await szovegek();
  const nezetek = await jogviszonyNezetek(berbeado.id);
  const beallitasok = await egyeztetesBeallitasok(berbeado.id);

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Befizetések</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Három adat találkozik: mit kellett volna fizetni, mit mond a bérlő, és
          mit mondasz te. A két fél a saját oldalát adja meg, és ha a kettő
          egyezik, a tétel le van zárva.
        </p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Bizonylatot csak akkor kérünk, ha a két oldal nem egyezik, és akkor is
          csak arról az egy utalásról: tőled a fogadó oldalit, a bérlőtől a
          küldő oldalit. Teljes bankszámlakivonatot nem kérünk, és nem is
          fogadunk el.
        </p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Párosítási ablak: az esedékesség előtt {beallitasok.korabbiAblakNap},
          utána {beallitasok.kesobbiAblakNap} nap.{" "}
          <Link href="/beallitasok" className="underline underline-offset-2">
            Átállítom
          </Link>
        </p>
      </section>


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
                  key={`${sor.eloirtTetelId ?? "nincs"}-${sor.berbeadoiIgazolasId ?? "nincs"}`}
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
                    {u(sor.magyarazat)}
                  </p>
                  {sor.reszletezes ? (
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                      {u(sor.reszletezes)}
                    </p>
                  ) : null}

                  <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                    <Reszlet
                      cimke="Előírás"
                      ertek={sor.eloirtTetelId ? `${forint(sor.osszegFt)} · ${datum(sor.esedekesseg)}` : "—"}
                    />
                    <Reszlet
                      cimke="Amit a bérlő mond"
                      ertek={
                        sor.igazolasOsszegFt !== null && sor.igazolasDatuma
                          ? `${forint(sor.igazolasOsszegFt)} · ${datum(sor.igazolasDatuma)}`
                          : "—"
                      }
                    />
                    <Reszlet
                      cimke="Ami hozzád megérkezett"
                      ertek={
                        sor.berbeadoiOsszegFt !== null && sor.berbeadoiDatuma
                          ? `${forint(sor.berbeadoiOsszegFt)} · ${datum(sor.berbeadoiDatuma)}`
                          : sor.elteresOka === "nem_erkezett_meg"
                            ? "nem érkezett meg"
                            : "—"
                      }
                    />
                  </dl>

                  {sor.bizonylatKell ? (
                    <p className="mt-3 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                      A két oldal nem egyezik. Ilyenkor van értelme az utalás
                      bizonylatának: tőled a fogadó oldali, a bérlőtől a küldő
                      oldali. Teljes bankszámlakivonat nem kell.
                    </p>
                  ) : null}

                  {sor.berbeadoiOsszegFt === null ? (
                    <>
                      <Beerkezes
                        jogviszonyId={nezet.id}
                        eloirtTetelId={sor.eloirtTetelId}
                        osszegFt={sor.osszegFt}
                        esedekesseg={napSzoveg(sor.esedekesseg)}
                        cimkek={BEERKEZES_CIMKEK}
                      />
                      {sor.eloirtTetelId && sor.elteresOka !== "nem_erkezett_meg" ? (
                        <NemErkezett
                          eloirtTetelId={sor.eloirtTetelId}
                          cimke="Megnéztem: nem érkezett meg"
                        />
                      ) : null}
                    </>
                  ) : sor.berbeadoiIgazolasId ? (
                    <BeerkezestVisszavon
                      igazolasId={sor.berbeadoiIgazolasId}
                      cimke="Ezt tévedésből rögzítettem"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

const BEERKEZES_CIMKEK = {
  nyito: "Megérkezett? Rögzítem",
  datum: "Mikor érkezett",
  osszeg: "Mennyi érkezett (Ft)",
  kozlemeny: "Közlemény (ha van)",
  gomb: "Rögzítem",
  nem: "Megnéztem: nem érkezett meg",
  visszavon: "Ezt tévedésből rögzítettem",
};

function napSzoveg(nap: Date): string {
  return nap.toISOString().slice(0, 10);
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
