import { Allapotjelzo } from "@/components/Allapotjelzo";
import { Teendolista } from "@/components/Teendolista";
import { datum, forint } from "@/domain/penz";
import { aktualisBerbeado, jogviszonyNezetek, teendok } from "@/lib/lekerdezesek";

export const dynamic = "force-dynamic";

/**
 * A bérlői oldal előnézete. A belépés és a meghívó a következő lépés, addig az
 * első jogviszony bérlőjének a szemszögét mutatja.
 */
export default async function BerloiNezet() {
  const berbeado = await aktualisBerbeado();
  if (!berbeado) return <p>Még nincs bérbeadó az adatbázisban.</p>;

  const ma = new Date();
  const nezetek = await jogviszonyNezetek(berbeado.id, ma);
  const sajat = nezetek[0];
  const berloTeendok = (await teendok(berbeado.id, "berlo", ma)).filter(
    (teendo) => teendo.hivatkozas?.includes(sajat?.id ?? "nincs"),
  );

  if (!sajat) return <p>Még nincs bérleti jogviszony.</p>;

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Bérlői nézet</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          {sajat.berloNev} szemszöge: {sajat.ingatlanMegnevezes}, {sajat.ingatlanCim}.
        </p>
        <p className="mt-2 rounded border border-stone-200 bg-white p-3 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
          A bérlői belépés és a meghívó a következő lépésben készül el. Ez az oldal
          most azt mutatja, mit fog látni a bérlő.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Mit kell tennem</h2>
        <Teendolista teendok={berloTeendok} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Befizetéseim</h2>
        <ul className="grid gap-2">
          {sajat.egyeztetesek
            .filter((sor) => sor.eloirtTetelId !== null)
            .map((sor) => (
              <li
                key={sor.eloirtTetelId ?? ""}
                className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {sor.idoszak} · {forint(sor.osszegFt)}
                  </span>
                  <Allapotjelzo allapot={sor.allapot} />
                </div>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Esedékesség: {datum(sor.esedekesseg)}. {sor.magyarazat}
                </p>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
