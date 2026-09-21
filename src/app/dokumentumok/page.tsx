import Link from "next/link";
import { Dokumentumlista } from "@/components/Dokumentumlista";
import { datumNyelven, forintNyelven } from "@/domain/nyelv";
import { idoszakCimke } from "@/domain/igazolas";
import { nevsor } from "@/domain/szerzodes";
import { prisma } from "@/lib/db";
import { berbeadoTara } from "@/lib/dokumentumtar";
import { igazolhatoIdoszakok } from "@/lib/igazolas";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { UjIgazolas, UjJegyzokonyv, UjSzerzodes } from "./Urlapok";

export const dynamic = "force-dynamic";

const DOBOZ =
  "rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900";

export default async function Dokumentumok() {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz , nyelv } = await szovegek();
  const ft = (osszegFt: number) => forintNyelven(osszegFt, nyelv);
  const nap = (ertek: Date) => datumNyelven(ertek, nyelv);

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

  const tar = await berbeadoTara(berbeado.id);

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
        <h1 className="text-2xl font-semibold tracking-tight">{sz("dokumentumok.cim")}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">{sz("dokumentumok.bevezeto")}</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{sz("dokumentumok.tar_cim")}</h2>
        <Dokumentumlista
          dokumentumok={tar}
          uresUzenet={sz("dokumentumok.tar_ures")}
          nyelv={nyelv}
        />
      </section>

      {jogviszonyok.map((jogviszony) => {
        const idoszakok = idoszakokJogviszonyonkent.get(jogviszony.id) ?? [];

        return (
          <section key={jogviszony.id} className="grid gap-3">
            <div>
              <h2 className="font-semibold">{jogviszony.ingatlan.megnevezes}</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {jogviszony.berlok.length === 0
                  ? sz("dokumentumok.nincs_berlo")
                  : nevsor(jogviszony.berlok.map((berlo) => berlo.nev))}{" "}
                · {sz("kozos.havi_dij", { osszeg: ft(jogviszony.berletiDijFt) })}
              </p>
            </div>

            <div className={DOBOZ}>
              <h3 className="font-medium">{sz("dokumentumok.szerzodes_cim")}</h3>
              {jogviszony.szerzodesek.length === 0 ? (
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  {sz("dokumentumok.nincs_szerzodes")}
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
                          ? sz("dokumentum.veglegesitve_nap", { nap: nap(szerzodes.veglegesitve) })
                          : sz("dokumentum.tervezet")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <UjSzerzodes
                jogviszonyId={jogviszony.id}
                cimke={sz("dokumentumok.uj_szerzodes")}
                folyamatbanCimke={sz("dokumentumok.keszitem")}
              />
            </div>

            <div className={DOBOZ}>
              <h3 className="font-medium">{sz("dokumentumok.jegyzokonyv_cim")}</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {sz("dokumentumok.jegyzokonyv_sugo")}
              </p>
              {jogviszony.jegyzokonyvek.length > 0 ? (
                <ul className="mt-2 grid gap-1 text-sm">
                  {jogviszony.jegyzokonyvek.map((jegyzokonyv) => (
                    <li key={jegyzokonyv.id} className="flex flex-wrap justify-between gap-2">
                      <Link
                        href={`/jegyzokonyvek/${jegyzokonyv.id}`}
                        className="underline underline-offset-2"
                      >
                        {sz(`jegyzokonyv.fajta.${jegyzokonyv.fajta}`)} ·{" "}
                        {nap(jegyzokonyv.idopont)}
                      </Link>
                      <span className="text-stone-600 dark:text-stone-400">
                        {jegyzokonyv.allapot === "veglegesitve"
                          ? sz("dokumentum.veglegesitve")
                          : sz("dokumentum.tervezet")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <UjJegyzokonyv
                  jogviszonyId={jogviszony.id}
                  fajta="birtokbaadas"
                  cimke={sz("jegyzokonyv.fajta.birtokbaadas")}
                  folyamatbanCimke={sz("dokumentumok.keszitem")}
                />
                <UjJegyzokonyv
                  jogviszonyId={jogviszony.id}
                  fajta="visszaadas"
                  cimke={sz("jegyzokonyv.fajta.visszaadas")}
                  folyamatbanCimke={sz("dokumentumok.keszitem")}
                />
              </div>
            </div>

            <div className={DOBOZ}>
              <h3 className="font-medium">{sz("dokumentumok.igazolas_cim")}</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {sz("dokumentumok.igazolas_sugo")}
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
                            {ft(igazolas.osszegFt)}
                          </a>
                          <span className="text-stone-600 dark:text-stone-400">
                            {sz("dokumentum.kiallitva_nap", { nap: nap(igazolas.kiallitva) })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <UjIgazolas
                    jogviszonyBerloId={berlo.id}
                    idoszakok={idoszakok.map((sor) => ({
                      idoszak: sor.idoszak,
                      cimke: idoszakCimke(sor.idoszak),
                      osszeg: ft(sor.osszegFt),
                    }))}
                    cimkek={{
                      nincs: sz("dokumentumok.igazolas_nincs", { nev: berlo.nev }),
                      idoszak: sz("dokumentumok.igazolas_idoszak"),
                      osszeg: sz("dokumentumok.igazolas_osszeg"),
                      osszegPelda: sz("dokumentumok.igazolas_osszeg_pelda"),
                      osszegSugo: sz("dokumentumok.igazolas_osszeg_sugo"),
                      cel: sz("dokumentumok.igazolas_cel"),
                      celAlap: sz("dokumentumok.igazolas_cel_alap"),
                      mod: sz("dokumentumok.igazolas_mod"),
                      modAtutalas: sz("dokumentumok.igazolas_mod_atutalas"),
                      modKeszpenz: sz("dokumentumok.igazolas_mod_keszpenz"),
                      modEgyeb: sz("dokumentumok.igazolas_mod_egyeb"),
                      hely: sz("dokumentumok.igazolas_hely"),
                      gomb: sz("dokumentumok.igazolas_gomb", { nev: berlo.nev }),
                      folyamatban: sz("dokumentumok.igazolas_folyamatban"),
                    }}
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
