import { Allapotjelzo } from "@/components/Allapotjelzo";
import { ElszamolasTetelek } from "@/components/ElszamolasTetelek";
import { Teendolista } from "@/components/Teendolista";
import { datum, forint } from "@/domain/penz";
import { prisma } from "@/lib/db";
import { berloNezetei, berloTeendoi } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { merooraNeve } from "@/lib/rezsi";
import { ElbiralasUrlap, OraallasUrlap } from "@/app/rezsi/Urlapok";

export const dynamic = "force-dynamic";

/** A bérlő oldala: csak a saját jogviszonyai, ugyanazokkal az állapotokkal. */
export default async function BerloiNezet() {
  const berlo = await kotelezoSzerep("berlo");

  const ma = new Date();
  const [nezetek, sajatTeendok, jogviszonyok] = await Promise.all([
    berloNezetei(berlo.id, ma),
    berloTeendoi(berlo.id, ma),
    prisma.jogviszony.findMany({
      where: { berloId: berlo.id },
      include: {
        ingatlan: {
          include: {
            meroorak: { include: { oraallasok: { orderBy: { datum: "desc" }, take: 1 } } },
          },
        },
        elszamolasok: {
          where: { allapot: { not: "tervezet" } },
          orderBy: { idoszakVege: "desc" },
          include: { tetelek: { orderBy: { sorrend: "asc" } } },
        },
      },
      orderBy: { letrehozva: "asc" },
    }),
  ]);

  const mai = ma.toISOString().slice(0, 10);
  const meroorasJogviszonyok = jogviszonyok.filter(
    (jogviszony) => jogviszony.rezsiElszamolas === "almero",
  );

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

      {meroorasJogviszonyok.map((jogviszony) => (
        <section key={`orak-${jogviszony.id}`}>
          <h2 className="mb-3 text-lg font-semibold">Óraállás beküldése</h2>
          <ul className="grid gap-3">
            {jogviszony.ingatlan.meroorak.map((meroora) => (
              <li
                key={meroora.id}
                className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{merooraNeve(meroora.tipus, meroora.almero)}</span>
                  <span className="text-sm tabular-nums text-stone-600 dark:text-stone-400">
                    {meroora.oraallasok[0]
                      ? `legutóbb ${meroora.oraallasok[0].ertek} ${meroora.mertekegyseg} · ${datum(meroora.oraallasok[0].datum)}`
                      : "még nincs óraállás"}
                  </span>
                </div>
                <OraallasUrlap
                  merooraId={meroora.id}
                  mertekegyseg={meroora.mertekegyseg}
                  mai={mai}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {jogviszonyok.flatMap((jogviszony) =>
        jogviszony.elszamolasok.map((elszamolas) => (
          <section key={elszamolas.id}>
            <h2 className="mb-3 text-lg font-semibold">
              Rezsielszámolás · {datum(elszamolas.idoszakKezdete)} – {datum(elszamolas.idoszakVege)}
            </h2>
            <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {elszamolas.allapot === "kiadva"
                  ? "Nézd át a tételeket. Ha bármelyik nem stimmel, vitasd, és írd meg, melyik."
                  : elszamolas.allapot === "elfogadva"
                    ? "Ezt az elszámolást elfogadtad."
                    : "Ezt az elszámolást vitattad, a bérbeadó látja az üzenetedet."}
              </p>
              <ElszamolasTetelek tetelek={elszamolas.tetelek} osszegFt={elszamolas.osszegFt} />
              {elszamolas.berloiUzenet ? (
                <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
                  Amit írtál: {elszamolas.berloiUzenet}
                </p>
              ) : null}
              {elszamolas.allapot === "kiadva" ? (
                <ElbiralasUrlap elszamolasId={elszamolas.id} />
              ) : null}
            </div>
          </section>
        )),
      )}

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
