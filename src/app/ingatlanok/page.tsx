import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { datumNyelven, forintNyelven, szamNyelven } from "@/domain/nyelv";
import { MEROORA_TIPUSOK, type MerooraTipus } from "@/domain/meroora";
import { merooraUzenet } from "@/lib/rezsi";
import { szovegek } from "@/lib/nyelv";
import { IngatlanUrlap, JogviszonyUrlap } from "./Urlapok";
import {
  DijszabasTorloUrlap,
  DijszabasUrlap,
  MerooraAdatUrlap,
  MerooraTorloUrlap,
  UjMerooraUrlap,
  type MerooraCimkek,
} from "./MerooraUrlapok";
import { Lapfej, NYITO, Sugo, Ures } from "@/components/ui/alap";

export const dynamic = "force-dynamic";

export default async function Ingatlanok() {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u, nyelv } = await szovegek();
  const ft = (osszegFt: number) => forintNyelven(osszegFt, nyelv);
  const nap = (ertek: Date) => datumNyelven(ertek, nyelv);
  const szamF = (ertek: number, tizedes?: number) => szamNyelven(ertek, nyelv, tizedes);
  const mai = new Date().toISOString().slice(0, 10);

  const ingatlanok = await prisma.ingatlan.findMany({
    where: { tulajdonosId: berbeado.id },
    include: {
      meroorak: {
        include: {
          dijszabasok: { orderBy: [{ ervenyesTol: "desc" }, { id: "desc" }] },
          _count: { select: { oraallasok: true } },
        },
        orderBy: [{ tipus: "asc" }, { id: "asc" }],
      },
      jogviszonyok: true,
    },
    orderBy: [{ letrehozva: "asc" }, { id: "asc" }],
  });

  // A fajták nevei egyszer, nem mérőóránként: a választóban mind a négy áll.
  const tipusNevek = Object.fromEntries(
    MEROORA_TIPUSOK.map((tipus) => [tipus, sz(`meroora.${tipus}`)]),
  );
  const merooraCimkek: MerooraCimkek = {
    tipus: sz("meroora.tipus"),
    tipusNevek,
    mertekegyseg: sz("meroora.mertekegyseg"),
    gyariSzam: sz("meroora.gyari_szam"),
    almero: sz("meroora.almero_mezo"),
    almeroSugo: sz("meroora.almero_sugo"),
    gomb: sz("meroora.gomb"),
    folyamatban: sz("meroora.folyamatban"),
  };

  const ures = ingatlanok.length === 0;

  return (
    <div className="grid gap-6">
      <Lapfej cim={sz("ingatlanok.cim")} />

      {ures ? (
        <Ures>{sz("ingatlanok.nincs")}</Ures>
      ) : (
        <ul className="grid gap-3">
          {ingatlanok.map((ingatlan) => (
            <li
              key={ingatlan.id}
              className="rounded-kartya border border-keret bg-felulet p-4"
            >
              <h2 className="font-semibold">{ingatlan.megnevezes}</h2>
              <p className="text-sm text-halvany">{ingatlan.cim}</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <Adat
                  cimke={sz("ingatlanok.alapterulet")}
                  ertek={ingatlan.alapteruletM2 ? `${ingatlan.alapteruletM2} m²` : "—"}
                />
                <Adat
                  cimke={sz("ingatlanok.kozos_koltseg")}
                  ertek={ingatlan.kozosKoltsegFt ? ft(ingatlan.kozosKoltsegFt) : "—"}
                />
                <Adat cimke={sz("ingatlanok.meroora")} ertek={String(ingatlan.meroorak.length)} />
                <Adat
                  cimke={sz("ingatlanok.jogviszony")}
                  ertek={String(ingatlan.jogviszonyok.length)}
                />
              </dl>

              {/* A mérőórák összecsukva állnak: aki már felvitte őket, annak
                  ez a lap a bérleményeiről szól, nem a díjszabásról. Amíg
                  viszont nincs kész — nincs mérőóra, vagy van, de díjszabás
                  nélkül —, nyitva marad: enélkül az almérős rezsielszámolás el
                  sem indul, és a szakasz épp az első mérőóra felvétele után
                  csukódott volna be, a bérbeadó orra előtt. */}
              <details
                open={
                  ingatlan.meroorak.length === 0 ||
                  ingatlan.meroorak.some((meroora) => meroora.dijszabasok.length === 0)
                }
                data-szakasz="meroorak"
                className="mt-3 border-t border-keret pt-2"
              >
                <summary className={NYITO}>
                  {sz("meroora.szakasz")} ({ingatlan.meroorak.length})
                </summary>

                <div className="mt-2 grid gap-4">
                  <Sugo cim={sz("meroora.szakasz")}>
                    <p>{sz("meroora.szakasz_sugo")}</p>
                  </Sugo>

                  {ingatlan.meroorak.map((meroora) => (
                    <div
                      key={meroora.id}
                      data-meroora={meroora.id}
                      className="rounded-lg border border-keret bg-felulet-halk p-3"
                    >
                      <h3 className="font-medium">
                        {u(merooraUzenet(meroora.tipus, meroora.almero))}
                        {meroora.gyariSzam ? ` · ${meroora.gyariSzam}` : ""}
                      </h3>

                      <ul className="mt-2 grid gap-2 text-sm">
                        {meroora.dijszabasok.map((dijszabas) => (
                          <li
                            key={dijszabas.id}
                            className="flex flex-wrap items-baseline justify-between gap-2"
                          >
                            <span className="tabular-nums">
                              {sz("dijszabas.sor", {
                                nap: nap(dijszabas.ervenyesTol),
                                kedvezmenyes: szamF(dijszabas.kedvezmenyesArFiller / 100),
                                egyseg: meroora.mertekegyseg,
                              })}
                            </span>
                            <DijszabasTorloUrlap
                              dijszabasId={dijszabas.id}
                              cimke={sz("dijszabas.torol")}
                            />
                          </li>
                        ))}
                        {meroora.dijszabasok.length === 0 ? (
                          <li className="text-halvany">{sz("rezsi.nincs_dijszabas")}</li>
                        ) : null}
                      </ul>

                      <details className="mt-2" data-szakasz="dijszabas">
                        <summary className={NYITO}>{sz("dijszabas.uj")}</summary>
                        <div className="mt-2">
                          <DijszabasUrlap
                            merooraId={meroora.id}
                            tipus={meroora.tipus as MerooraTipus}
                            mai={mai}
                            cimkek={{
                              ervenyesTol: sz("dijszabas.ervenyes_tol"),
                              kedvezmenyes: sz("dijszabas.kedvezmenyes", {
                                egyseg: meroora.mertekegyseg,
                              }),
                              piaci: sz("dijszabas.piaci", { egyseg: meroora.mertekegyseg }),
                              keret: sz("dijszabas.keret", { egyseg: meroora.mertekegyseg }),
                              alapdij: sz("dijszabas.alapdij"),
                              csatorna: sz("dijszabas.csatorna", {
                                egyseg: meroora.mertekegyseg,
                              }),
                              csatornaSugo: sz("dijszabas.csatorna_sugo"),
                              gomb: sz("dijszabas.gomb"),
                              folyamatban: sz("dijszabas.folyamatban"),
                            }}
                          />
                        </div>
                      </details>

                      <details className="mt-1" data-szakasz="meroora-adatok">
                        <summary className={NYITO}>{sz("meroora.modosit")}</summary>
                        <div className="mt-2 grid gap-3">
                          <MerooraAdatUrlap
                            merooraId={meroora.id}
                            tipus={meroora.tipus}
                            mertekegyseg={meroora.mertekegyseg}
                            gyariSzam={meroora.gyariSzam ?? ""}
                            almero={meroora.almero}
                            cimkek={merooraCimkek}
                            mentes={sz("meroora.modosit")}
                          />
                          {/* Törölni csak addig lehet, amíg nincs rajta mérés:
                              a korábbi elszámolások erre a mérőórára
                              hivatkoznak. A kiszolgáló is ezt tartja be. */}
                          {meroora._count.oraallasok === 0 ? (
                            <MerooraTorloUrlap
                              merooraId={meroora.id}
                              cimke={sz("meroora.torol")}
                            />
                          ) : (
                            <p className="text-xs text-halvany">
                              {sz("meroora.hiba.van_oraallas")}
                            </p>
                          )}
                        </div>
                      </details>
                    </div>
                  ))}

                  <details data-szakasz="uj-meroora" open={ingatlan.meroorak.length === 0}>
                    <summary className={NYITO}>{sz("meroora.uj")}</summary>
                    <div className="mt-2">
                      <UjMerooraUrlap ingatlanId={ingatlan.id} cimkek={merooraCimkek} />
                    </div>
                  </details>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      {/*
        Az üres állapotban a felvitel nyitva áll: az első képernyőn nincs mit
        összecsukni. Utána becsukva, mert aki már felvitte a bérleményeit, az
        nem naponta vesz fel újat.
      */}
      <details
        open={ures}
        className="rounded-kartya border border-keret bg-felulet p-4"
      >
        <summary className={NYITO}>{sz("berlemeny.uj")}</summary>
        <div className="mt-3">
          <IngatlanUrlap
            cimkek={{
              megnevezes: sz("berlemeny.mezo.megnevezes"),
              megnevezesSugo: sz("berlemeny.mezo.megnevezes_sugo"),
              cim: sz("berlemeny.mezo.cim"),
              cimSugo: sz("berlemeny.mezo.cim_sugo"),
              alapterulet: sz("berlemeny.mezo.alapterulet"),
              helyrajzi: sz("berlemeny.mezo.helyrajzi"),
              energetikai: sz("berlemeny.mezo.energetikai"),
              kozosKoltseg: sz("berlemeny.mezo.kozos_koltseg"),
              beszerzesiAr: sz("berlemeny.mezo.beszerzesi_ar"),
              beszerzesDatuma: sz("berlemeny.mezo.beszerzes_datuma"),
              adozasSugo: sz("berlemeny.mezo.adozas_sugo"),
              gomb: sz("berlemeny.gomb"),
              figyelem: sz("urlap.figyelem"),
            }}
          />
        </div>
      </details>

      {ures ? null : (
        <details className="rounded-kartya border border-keret bg-felulet p-4">
          <summary className={NYITO}>{sz("jogviszony.uj")}</summary>
          <div className="mt-3">
            <JogviszonyUrlap
              ingatlanok={ingatlanok.map((ingatlan) => ({
                id: ingatlan.id,
                megnevezes: ingatlan.megnevezes,
              }))}
              cimkek={{
                sugo: sz("jogviszony.uj_sugo"),
                ingatlan: sz("jogviszony.mezo.ingatlan"),
                kezdete: sz("jogviszony.mezo.kezdete"),
                dij: sz("jogviszony.mezo.dij"),
                kozosKoltseg: sz("jogviszony.mezo.kozos_koltseg"),
                kaucio: sz("jogviszony.mezo.kaucio"),
                fizetesiNap: sz("jogviszony.mezo.fizetesi_nap"),
                rezsi: sz("jogviszony.mezo.rezsi"),
                rezsiModok: {
                  almero: sz("jogviszony.rezsi.almero"),
                  atalany: sz("jogviszony.rezsi.atalany"),
                  kozos_koltsegben: sz("jogviszony.rezsi.kozos_koltsegben"),
                },
                atalany: sz("jogviszony.mezo.atalany"),
                berlo: sz("jogviszony.mezo.berlo"),
                berloEmail: sz("jogviszony.mezo.berlo_email"),
                berloSugo: sz("jogviszony.mezo.berlo_sugo"),
                gomb: sz("jogviszony.gomb"),
                figyelem: sz("urlap.figyelem"),
              }}
            />
          </div>
        </details>
      )}
    </div>
  );
}

function Adat({ cimke, ertek }: { cimke: string; ertek: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-nagyon-halvany">
        {cimke}
      </dt>
      <dd className="tabular-nums">{ertek}</dd>
    </div>
  );
}
