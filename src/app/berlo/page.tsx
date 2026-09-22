import { Allapotjelzo } from "@/components/Allapotjelzo";
import { Teendolista } from "@/components/Teendolista";
import { datum, forint } from "@/domain/penz";
import { berloNezetei, berloTeendoi } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";

export const dynamic = "force-dynamic";

/** A bérlő oldala: csak a saját jogviszonyai, ugyanazokkal az állapotokkal. */
export default async function BerloiNezet() {
  const berlo = await kotelezoSzerep("berlo");

  const ma = new Date();
  const [nezetek, sajatTeendok] = await Promise.all([
    berloNezetei(berlo.id, ma),
    berloTeendoi(berlo.id, ma),
  ]);

  if (nezetek.length === 0) {
    return (
      <div className="grid gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Bérleményem</h1>
        <p className="text-stone-600 dark:text-stone-400">
          Ehhez a fiókhoz még nincs bérlemény kötve. Szólj a bérbeadódnak, hogy
          küldjön meghívót.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Szia, {berlo.nev}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          {nezetek.map((nezet) => `${nezet.ingatlanMegnevezes}, ${nezet.ingatlanCim}`).join(" · ")}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Mit kell tennem</h2>
        <Teendolista teendok={sajatTeendok} />
      </section>

      {nezetek.map((nezet) => (
        <section key={nezet.id}>
          <h2 className="mb-3 text-lg font-semibold">
            Befizetéseim · {nezet.ingatlanMegnevezes}
          </h2>
          <ul className="grid gap-2">
            {nezet.egyeztetesek
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
      ))}
    </div>
  );
}
