import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { forintNyelven } from "@/domain/nyelv";
import { szovegek } from "@/lib/nyelv";
import { IngatlanUrlap, JogviszonyUrlap } from "./Urlapok";
import { Lapfej, NYITO, Ures } from "@/components/ui/alap";

export const dynamic = "force-dynamic";

export default async function Ingatlanok() {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, nyelv } = await szovegek();
  const ft = (osszegFt: number) => forintNyelven(osszegFt, nyelv);

  const ingatlanok = await prisma.ingatlan.findMany({
    where: { tulajdonosId: berbeado.id },
    include: { meroorak: true, jogviszonyok: true },
    orderBy: [{ letrehozva: "asc" }, { id: "asc" }],
  });

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
