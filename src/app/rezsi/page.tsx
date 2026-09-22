import { datum, forint } from "@/domain/penz";
import { ElszamolasTetelek } from "@/components/ElszamolasTetelek";
import { nevsor } from "@/domain/szerzodes";
import { prisma } from "@/lib/db";
import { merooraNeve } from "@/lib/rezsi";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { ElszamolasUrlap, KiadasUrlap, OraallasUrlap } from "./Urlapok";

export const dynamic = "force-dynamic";

const ELSZAMOLAS_MODJA: Record<string, string> = {
  almero: "mérőóra szerint",
  atalany: "átalánnyal",
  kozos_koltsegben: "a közös költségben",
};

function napSzoveg(nap: Date): string {
  return nap.toISOString().slice(0, 10);
}

export default async function Rezsi() {
  const berbeado = await kotelezoSzerep("berbeado");
  const ma = new Date();

  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId: berbeado.id } },
    include: {
      berlok: { orderBy: { sorrend: "asc" } },
      ingatlan: {
        include: {
          meroorak: {
            include: {
              dijszabasok: { orderBy: { ervenyesTol: "desc" } },
              oraallasok: { orderBy: { datum: "desc" }, take: 1 },
            },
          },
        },
      },
      elszamolasok: {
        orderBy: { idoszakVege: "desc" },
        include: { tetelek: { orderBy: { sorrend: "asc" } } },
      },
    },
    orderBy: { letrehozva: "asc" },
  });

  const honapElseje = new Date(Date.UTC(ma.getUTCFullYear(), ma.getUTCMonth() - 1, 1));

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Rezsi és elszámolás</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Az óraállásokból tételes elszámolás készül, a magyar sávos árazással: a
          kedvezményes keretig kedvezményes áron, fölötte piaci áron. A kiadott
          elszámolás előírt tételként megy tovább a befizetésekhez.
        </p>
      </section>

      {jogviszonyok.map((jogviszony) => (
        <section key={jogviszony.id} className="grid gap-3">
          <div>
            <h2 className="font-semibold">
              {jogviszony.ingatlan.megnevezes} · {nevsor(jogviszony.berlok.map((berlo) => berlo.nev))}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Rezsi elszámolása {ELSZAMOLAS_MODJA[jogviszony.rezsiElszamolas] ?? jogviszony.rezsiElszamolas}
              {jogviszony.kozosKoltsegFt > 0
                ? ` · közös költség ${forint(jogviszony.kozosKoltsegFt)} / hó`
                : ""}
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <h3 className="font-medium">Mérőórák</h3>
            {jogviszony.ingatlan.meroorak.length === 0 ? (
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Ehhez az ingatlanhoz nincs mérőóra felvéve.
              </p>
            ) : (
              <ul className="mt-2 grid gap-4">
                {jogviszony.ingatlan.meroorak.map((meroora) => {
                  const utolso = meroora.oraallasok[0];
                  const dijszabas = meroora.dijszabasok[0];
                  return (
                    <li key={meroora.id} className="border-t border-stone-200 pt-3 first:border-0 first:pt-0 dark:border-stone-800">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">
                          {merooraNeve(meroora.tipus, meroora.almero)}
                        </span>
                        <span className="text-sm text-stone-600 tabular-nums dark:text-stone-400">
                          {utolso
                            ? `${utolso.ertek} ${meroora.mertekegyseg} · ${datum(utolso.datum)}`
                            : "még nincs óraállás"}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {dijszabas
                          ? `${(dijszabas.kedvezmenyesArFiller / 100).toLocaleString("hu-HU")} Ft/${meroora.mertekegyseg} a kereten belül` +
                            (dijszabas.evesKeret
                              ? `, ${dijszabas.evesKeret.toLocaleString("hu-HU")} ${meroora.mertekegyseg}/év keret, fölötte ${(dijszabas.piaciArFiller / 100).toLocaleString("hu-HU")} Ft/${meroora.mertekegyseg}`
                              : ", nincs sávhatár")
                          : "nincs díjszabás felvéve"}
                      </p>
                      <OraallasUrlap
                        merooraId={meroora.id}
                        mertekegyseg={meroora.mertekegyseg}
                        mai={napSzoveg(ma)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <h3 className="font-medium">Új elszámolás</h3>
            <ElszamolasUrlap
              jogviszonyId={jogviszony.id}
              kezdete={napSzoveg(honapElseje)}
              vege={napSzoveg(ma)}
            />
          </div>

          {jogviszony.elszamolasok.map((elszamolas) => (
            <div
              key={elszamolas.id}
              className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium">
                  {datum(elszamolas.idoszakKezdete)} – {datum(elszamolas.idoszakVege)}
                </h3>
                <span className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {elszamolas.allapot}
                </span>
              </div>

              <ElszamolasTetelek tetelek={elszamolas.tetelek} osszegFt={elszamolas.osszegFt} />

              {elszamolas.berloiUzenet ? (
                <p className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  A bérlő vitatja: {elszamolas.berloiUzenet}
                </p>
              ) : null}

              {elszamolas.allapot === "tervezet" ? (
                <KiadasUrlap
                  elszamolasId={elszamolas.id}
                  esedekesseg={napSzoveg(
                    new Date(ma.getTime() + 8 * 24 * 60 * 60 * 1000),
                  )}
                />
              ) : null}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
