import Link from "next/link";
import { datum, forint } from "@/domain/penz";
import { idoszakCimke } from "@/domain/igazolas";
import { FAJTA_NEVE } from "@/domain/jegyzokonyv";
import { nevsor } from "@/domain/szerzodes";
import { prisma } from "@/lib/db";
import { igazolhatoIdoszakok } from "@/lib/igazolas";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { UjIgazolas, UjJegyzokonyv, UjSzerzodes } from "./Urlapok";

export const dynamic = "force-dynamic";

const DOBOZ =
  "rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900";

export default async function Dokumentumok() {
  const berbeado = await kotelezoSzerep("berbeado");

  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId: berbeado.id } },
    include: {
      ingatlan: true,
      berlok: {
        orderBy: { sorrend: "asc" },
        include: { igazolasok: { orderBy: { kiallitva: "desc" } } },
      },
      szerzodesek: { orderBy: { letrehozva: "desc" } },
      jegyzokonyvek: { orderBy: { idopont: "desc" } },
    },
    orderBy: { letrehozva: "asc" },
  });

  const idoszakokJogviszonyonkent = new Map(
    await Promise.all(
      jogviszonyok.map(
        async (jogviszony) =>
          [jogviszony.id, await igazolhatoIdoszakok(jogviszony.id, berbeado.id)] as const,
      ),
    ),
  );

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Dokumentumok</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Szerződés, átadás-átvételi jegyzőkönyv és bérbeadói igazolás. Mind abból
          az adatból készül, amit már felvettél, ezért nem kell újra begépelni, és
          nem térhet el attól, amit a befizetéseknél látsz.
        </p>
      </section>

      {jogviszonyok.map((jogviszony) => {
        const idoszakok = idoszakokJogviszonyonkent.get(jogviszony.id) ?? [];

        return (
          <section key={jogviszony.id} className="grid gap-3">
            <div>
              <h2 className="font-semibold">{jogviszony.ingatlan.megnevezes}</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {jogviszony.berlok.length === 0
                  ? "Még nincs bérlő felvéve"
                  : nevsor(jogviszony.berlok.map((berlo) => berlo.nev))}{" "}
                · {forint(jogviszony.berletiDijFt)} / hó
              </p>
            </div>

            <div className={DOBOZ}>
              <h3 className="font-medium">Bérleti szerződés</h3>
              {jogviszony.szerzodesek.length === 0 ? (
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Még nincs szerződés ehhez a jogviszonyhoz.
                </p>
              ) : (
                <ul className="mt-2 grid gap-1 text-sm">
                  {jogviszony.szerzodesek.map((szerzodes) => (
                    <li key={szerzodes.id} className="flex flex-wrap justify-between gap-2">
                      <Link
                        href={`/szerzodesek/${szerzodes.id}`}
                        className="underline underline-offset-2"
                      >
                        {szerzodes.megnevezes}
                      </Link>
                      <span className="text-stone-600 dark:text-stone-400">
                        {szerzodes.allapot === "veglegesitve" && szerzodes.veglegesitve
                          ? `véglegesítve ${datum(szerzodes.veglegesitve)}`
                          : "tervezet"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <UjSzerzodes jogviszonyId={jogviszony.id} />
            </div>

            <div className={DOBOZ}>
              <h3 className="font-medium">Átadás-átvételi jegyzőkönyv</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                A birtokbaadáskor felvett óraállások lesznek az első rezsielszámolás
                kiindulópontjai, a vállalt javításokból pedig teendő lesz.
              </p>
              {jogviszony.jegyzokonyvek.length > 0 ? (
                <ul className="mt-2 grid gap-1 text-sm">
                  {jogviszony.jegyzokonyvek.map((jegyzokonyv) => (
                    <li key={jegyzokonyv.id} className="flex flex-wrap justify-between gap-2">
                      <Link
                        href={`/jegyzokonyvek/${jegyzokonyv.id}`}
                        className="underline underline-offset-2"
                      >
                        {FAJTA_NEVE[jegyzokonyv.fajta] ?? jegyzokonyv.fajta} ·{" "}
                        {datum(jegyzokonyv.idopont)}
                      </Link>
                      <span className="text-stone-600 dark:text-stone-400">
                        {jegyzokonyv.allapot === "veglegesitve" ? "véglegesítve" : "tervezet"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <UjJegyzokonyv
                  jogviszonyId={jogviszony.id}
                  fajta="birtokbaadas"
                  cimke="Birtokbaadási jegyzőkönyv"
                />
                <UjJegyzokonyv
                  jogviszonyId={jogviszony.id}
                  fajta="visszaadas"
                  cimke="Visszaadási jegyzőkönyv"
                />
              </div>
            </div>

            <div className={DOBOZ}>
              <h3 className="font-medium">Bérbeadói igazolás</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Albérlettámogatáshoz, ösztöndíjhoz, munkáltatói térítéshez. Az
                összeget és a teljesítés napját a párosított befizetésből veszem.
              </p>

              {jogviszony.berlok.map((berlo) => (
                <div
                  key={berlo.id}
                  className="mt-4 border-t border-stone-200 pt-3 first:border-0 dark:border-stone-800"
                >
                  {berlo.igazolasok.length > 0 ? (
                    <ul className="grid gap-1 text-sm">
                      {berlo.igazolasok.map((igazolas) => (
                        <li key={igazolas.id} className="flex flex-wrap justify-between gap-2">
                          <a
                            href={`/igazolasok/${igazolas.id}/letoltes`}
                            className="underline underline-offset-2"
                          >
                            {berlo.nev} · {idoszakCimke(igazolas.idoszak)} ·{" "}
                            {forint(igazolas.osszegFt)}
                          </a>
                          <span className="text-stone-600 dark:text-stone-400">
                            kiállítva {datum(igazolas.kiallitva)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <UjIgazolas
                    jogviszonyBerloId={berlo.id}
                    berloNev={berlo.nev}
                    idoszakok={idoszakok.map((sor) => ({
                      idoszak: sor.idoszak,
                      cimke: idoszakCimke(sor.idoszak),
                      osszegFt: sor.osszegFt,
                    }))}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
