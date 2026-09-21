import { datumNyelven, forintNyelven, szamNyelven } from "@/domain/nyelv";
import { ElszamolasTetelek } from "@/components/ElszamolasTetelek";
import { nevsor } from "@/domain/szerzodes";
import { prisma } from "@/lib/db";
import { merooraUzenet } from "@/lib/rezsi";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { ElszamolasUrlap, KiadasUrlap, OraallasUrlap } from "./Urlapok";
import { Lapfej, Sugo } from "@/components/ui/alap";

export const dynamic = "force-dynamic";

function napSzoveg(nap: Date): string {
  return nap.toISOString().slice(0, 10);
}

export default async function Rezsi() {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u , nyelv } = await szovegek();
  const ft = (osszegFt: number) => forintNyelven(osszegFt, nyelv);
  const nap = (ertek: Date) => datumNyelven(ertek, nyelv);
  const szamF = (ertek: number, tizedes?: number) => szamNyelven(ertek, nyelv, tizedes);
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
      <Lapfej cim={sz("rezsi.cim")} />

      <Sugo cim={sz("rezsi.sugo_cim")}>
        <p>{sz("rezsi.bevezeto")}</p>
      </Sugo>

      {jogviszonyok.map((jogviszony) => (
        <section key={jogviszony.id} className="grid gap-3">
          <div>
            <h2 className="font-semibold">
              {jogviszony.ingatlan.megnevezes} · {nevsor(jogviszony.berlok.map((berlo) => berlo.nev))}
            </h2>
            <p className="text-sm text-halvany">
              {sz("rezsi.mod", { mod: sz(`rezsi.mod.${jogviszony.rezsiElszamolas}`) })}
              {jogviszony.kozosKoltsegFt > 0
                ? ` · ${sz("rezsi.kozos_koltseg", { osszeg: ft(jogviszony.kozosKoltsegFt) })}`
                : ""}
            </p>
          </div>

          <div className="rounded-kartya border border-keret bg-felulet p-4">
            <h3 className="font-medium">{sz("rezsi.meroorak")}</h3>
            {jogviszony.ingatlan.meroorak.length === 0 ? (
              <p className="mt-1 text-sm text-halvany">
                {sz("rezsi.nincs_meroora")}
              </p>
            ) : (
              <ul className="mt-2 grid gap-4">
                {jogviszony.ingatlan.meroorak.map((meroora) => {
                  const utolso = meroora.oraallasok[0];
                  const dijszabas = meroora.dijszabasok[0];
                  return (
                    <li key={meroora.id} className="border-t border-keret pt-3 first:border-0 first:pt-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">
                          {u(merooraUzenet(meroora.tipus, meroora.almero))}
                        </span>
                        <span className="text-sm text-halvany tabular-nums">
                          {utolso
                            ? `${utolso.ertek} ${meroora.mertekegyseg} · ${nap(utolso.datum)}`
                            : sz("rezsi.nincs_oraallas")}
                        </span>
                      </div>
                      <p className="text-xs text-nagyon-halvany">
                        {dijszabas
                          ? sz("rezsi.dijszabas", {
                              ar: szamF(dijszabas.kedvezmenyesArFiller / 100),
                              egyseg: meroora.mertekegyseg,
                            }) +
                            (dijszabas.evesKeret
                              ? sz("rezsi.dijszabas_keret", {
                                  keret: szamF(dijszabas.evesKeret),
                                  egyseg: meroora.mertekegyseg,
                                  piaci: szamF(dijszabas.piaciArFiller / 100),
                                })
                              : sz("rezsi.dijszabas_nincs_savhatar")) +
                            (dijszabas.csatornaArFiller > 0
                              ? sz("rezsi.dijszabas_csatorna", {
                                  ar: szamF(dijszabas.csatornaArFiller / 100),
                                  egyseg: meroora.mertekegyseg,
                                })
                              : "")
                          : sz("rezsi.nincs_dijszabas")}
                      </p>
                      <OraallasUrlap
                        merooraId={meroora.id}
                        mai={napSzoveg(ma)}
                        cimkek={{
                          datum: sz("rezsi.oraallas.datum"),
                          ertek: sz("rezsi.oraallas.ertek", { egyseg: meroora.mertekegyseg }),
                          gomb: sz("rezsi.oraallas.gomb"),
                          folyamatban: sz("rezsi.oraallas.folyamatban"),
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-kartya border border-keret bg-felulet p-4">
            <h3 className="font-medium">{sz("rezsi.uj_elszamolas")}</h3>
            <ElszamolasUrlap
              jogviszonyId={jogviszony.id}
              kezdete={napSzoveg(honapElseje)}
              vege={napSzoveg(ma)}
              cimkek={{
                kezdete: sz("rezsi.elszamolas.kezdete"),
                vege: sz("rezsi.elszamolas.vege"),
                gomb: sz("rezsi.elszamolas.gomb"),
                folyamatban: sz("rezsi.elszamolas.folyamatban"),
              }}
            />
          </div>

          {jogviszony.elszamolasok.map((elszamolas) => (
            <div
              key={elszamolas.id}
              className="rounded-kartya border border-keret bg-felulet p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium">
                  {nap(elszamolas.idoszakKezdete)} – {nap(elszamolas.idoszakVege)}
                </h3>
                <span className="text-xs uppercase tracking-wide text-nagyon-halvany">
                  {sz(`dokumentum.elszamolas.allapot.${elszamolas.allapot}`)}
                </span>
              </div>

              <ElszamolasTetelek
                tetelek={elszamolas.tetelek}
                osszegFt={elszamolas.osszegFt}
                nyelv={nyelv}
              />

              {elszamolas.berloiUzenet ? (
                <p className="mt-3 rounded border border-figyelem-keret bg-figyelem-lap p-3 text-sm text-figyelem">
                  {sz("rezsi.vitatja", { uzenet: elszamolas.berloiUzenet })}
                </p>
              ) : null}

              {elszamolas.allapot === "tervezet" ? (
                <KiadasUrlap
                  elszamolasId={elszamolas.id}
                  esedekesseg={napSzoveg(
                    new Date(ma.getTime() + 8 * 24 * 60 * 60 * 1000),
                  )}
                  cimkek={{
                    hatarido: sz("rezsi.kiadas.hatarido"),
                    gomb: sz("rezsi.kiadas.gomb"),
                    folyamatban: sz("rezsi.kiadas.folyamatban"),
                  }}
                />
              ) : null}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
