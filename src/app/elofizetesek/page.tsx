import { redirect } from "next/navigation";
import { figyelmeztetesek, FAJTAK } from "@/domain/elofizetes";
import { datumNyelven, forintNyelven, type Nyelv } from "@/domain/nyelv";
import {
  berbeadoElofizetesei,
  berbeadoJogviszonyai,
  berloElofizetesei,
  type Nezet,
} from "@/lib/elofizetes";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { Lapfej, NYITO, Sugo, Ures } from "@/components/ui/alap";
import { MegszuntetesUrlap, NyilatkozatUrlap, UjElofizetes } from "./Urlapok";

export const dynamic = "force-dynamic";

function napSzoveg(nap: Date): string {
  return nap.toISOString().slice(0, 10);
}

/**
 * Az előfizetések lapja, ugyanaz a két szerepnek.
 *
 * A bérbeadó veszi fel és szünteti meg őket, a bérlő nyilatkozik róluk; a
 * kártya tartalma ugyanaz, mert ugyanarról az adatról van szó, és a két félnek
 * ugyanazt kell látnia ahhoz, hogy a jóváhagyás érjen valamit.
 */
export default async function Elofizetesek() {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) redirect("/belepes");

  const { sz, u, nyelv } = await szovegek();
  const szerep = szerepe(felhasznalo);
  const berbeado = szerep === "berbeado";
  const ma = new Date();

  const elofizetesek = berbeado
    ? await berbeadoElofizetesei(felhasznalo.id)
    : await berloElofizetesei(felhasznalo.id);
  const jogviszonyok = berbeado ? await berbeadoJogviszonyai(felhasznalo.id) : [];

  // Elöl az, amivel az olvasónak dolga van: amire még vár valaki, vagy amit
  // kifogásoltak. Ami le van zárva, az összecsukva áll.
  const nyitott = elofizetesek.filter((sor) => sor.allapot !== "jovahagyva" && !sor.adat.vege);
  const rendezett = elofizetesek.filter((sor) => sor.allapot === "jovahagyva" || sor.adat.vege);

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <Lapfej cim={sz("elofizetes.cim")} />
        <Sugo cim={sz("elofizetes.sugo_cim")}>
          <p>{berbeado ? sz("elofizetes.bevezeto") : sz("elofizetes.berlo.bevezeto")}</p>
        </Sugo>
      </section>

      {berbeado ? (
        <div className="grid gap-3">
          {jogviszonyok.map((jogviszony) => (
            <UjElofizetes
              key={jogviszony.id}
              jogviszonyId={jogviszony.id}
              ingatlanNev={jogviszony.ingatlan.megnevezes}
              mutassukABerlemenyt={jogviszonyok.length > 1}
              mai={napSzoveg(ma)}
              cimkek={{
                nyito: sz("elofizetes.uj"),
                fajta: sz("elofizetes.mezo.fajta"),
                fajtak: FAJTAK.map((fajta) => ({
                  ertek: fajta,
                  cimke: sz(`elofizetes.fajta.${fajta}`),
                })),
                megnevezes: sz("elofizetes.mezo.megnevezes"),
                megnevezesSugo: sz("elofizetes.mezo.megnevezes_sugo"),
                szolgaltato: sz("elofizetes.mezo.szolgaltato"),
                elofizeto: sz("elofizetes.mezo.elofizeto"),
                elofizetok: [
                  { ertek: "berbeado", cimke: sz("elofizetes.elofizeto.berbeado") },
                  { ertek: "berlo", cimke: sz("elofizetes.elofizeto.berlo") },
                ],
                haviDij: sz("elofizetes.mezo.havi_dij"),
                kezdete: sz("elofizetes.mezo.kezdete"),
                vege: sz("elofizetes.mezo.vege"),
                gomb: sz("elofizetes.gomb.felvesz"),
                folyamatban: sz("elofizetes.gomb.felveszem"),
              }}
            />
          ))}
        </div>
      ) : null}

      {elofizetesek.length === 0 ? (
        <Ures>{sz("elofizetes.nincs")}</Ures>
      ) : null}

      {nyitott.length > 0 ? (
        <ul className="grid gap-3">
          {nyitott.map((sor) => (
            <li key={sor.adat.id}>
              <Kartya
                sor={sor}
                berbeado={berbeado}
                sajatId={felhasznalo.id}
                nyelv={nyelv}
                sz={sz}
                u={u}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {rendezett.length > 0 ? (
        <details>
          <summary className={NYITO}>
            {sz("elofizetes.rendezettek", { darab: rendezett.length })}
          </summary>
          <ul className="mt-3 grid gap-3">
            {rendezett.map((sor) => (
              <li key={sor.adat.id}>
                <Kartya
                  sor={sor}
                  berbeado={berbeado}
                  sajatId={felhasznalo.id}
                  nyelv={nyelv}
                  sz={sz}
                  u={u}
                />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

type Szovegezo = Awaited<ReturnType<typeof szovegek>>;

function Kartya({
  sor,
  berbeado,
  sajatId,
  nyelv,
  sz,
  u,
}: {
  sor: Nezet;
  berbeado: boolean;
  sajatId: string;
  nyelv: Nyelv;
  sz: Szovegezo["sz"];
  u: Szovegezo["u"];
}) {
  const { adat } = sor;
  const nap = (ertek: Date) => datumNyelven(ertek, nyelv);
  const sajat = adat.nyilatkozatok.find((nyilatkozat) => nyilatkozat.berloId === sajatId);

  return (
    <div className="rounded-kartya border border-keret bg-felulet p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">{adat.megnevezes}</span>
        <span className="text-xs uppercase tracking-wide text-nagyon-halvany">
          {sz(`elofizetes.allapot.${sor.allapot}`)}
        </span>
      </div>

      <p className="mt-1 text-sm text-halvany">
        {sz(`elofizetes.fajta.${adat.fajta}`)}
        {adat.szolgaltato ? ` · ${adat.szolgaltato}` : ""} · {sor.ingatlanNev}
      </p>

      <p className="mt-1 text-sm">
        {sz(`elofizetes.elofizeto.${adat.elofizeto}`)}
        {adat.haviDijFt > 0
          ? ` · ${sz("elofizetes.havi_dij", { osszeg: forintNyelven(adat.haviDijFt, nyelv) })}`
          : ""}
      </p>

      <p className="mt-1 text-xs text-nagyon-halvany">
        {adat.vege
          ? sz("elofizetes.idoszak_zart", { kezdete: nap(adat.kezdete), vege: nap(adat.vege) })
          : sz("elofizetes.idoszak", { kezdete: nap(adat.kezdete) })}
      </p>

      {/* Mi lesz ebből pénzben: a bérbeadó ne találgassa, a bérlő ne lepődjön meg. */}
      <p className="mt-2 text-sm text-halvany">
        {adat.elofizeto === "berlo"
          ? sz("elofizetes.berlo_fizeti_kozvetlenul")
          : sor.allapot === "jovahagyva"
            ? sz("elofizetes.eloiras_lesz")
            : sz("elofizetes.jovahagyas_elott")}
      </p>

      {figyelmeztetesek(adat).map((figyelmeztetes) => (
        <p
          key={figyelmeztetes.kulcs}
          className="mt-2 rounded-lg border border-figyelem-keret bg-figyelem-lap p-2 text-sm text-figyelem"
        >
          {u(figyelmeztetes)}
        </p>
      ))}

      {sor.berlok.length === 0 ? (
        <p className="mt-2 text-sm text-halvany">
          {sz("elofizetes.nincs_fiokos_berlo")}
        </p>
      ) : sor.varRank.length > 0 ? (
        <p className="mt-2 text-sm text-halvany">
          {sz("elofizetes.varunk_rad", {
            nevek: sor.varRank.map((berlo) => berlo.nev).join(", "),
          })}
        </p>
      ) : null}

      {/* A kifogás ott marad a kártyán: egy nemet nem tüntetünk el csendben. */}
      {sor.kifogasok
        .filter((kifogas) => kifogas.berloId !== sajatId)
        .map((kifogas) => (
          <p
            key={kifogas.berloId}
            className="mt-2 rounded border border-gond-keret bg-gond-lap p-2 text-sm text-gond"
          >
            {sz("elofizetes.masik_kifogasa", {
              nev: kifogas.nev,
              indoklas: kifogas.indoklas ?? "",
            })}
          </p>
        ))}

      {berbeado ? (
        adat.vege ? (
          <p className="mt-2 text-sm text-halvany">
            {sz("elofizetes.megszunt", { vege: nap(adat.vege) })}
          </p>
        ) : (
          <MegszuntetesUrlap
            elofizetesId={adat.id}
            cimkek={{
              gomb: sz("elofizetes.gomb.megszuntet"),
              folyamatban: sz("elofizetes.gomb.megszuntetem"),
            }}
          />
        )
      ) : sajat ? (
        <p className="mt-2 text-sm text-halvany">
          {sajat.allapot === "kifogasolt"
            ? sz("elofizetes.sajat_nyilatkozat.kifogasolt", { indoklas: sajat.indoklas ?? "" })
            : sz("elofizetes.sajat_nyilatkozat.jovahagyva")}
        </p>
      ) : (
        <NyilatkozatUrlap
          elofizetesId={adat.id}
          cimkek={{
            indoklas: sz("elofizetes.mezo.indoklas"),
            jovahagy: sz("elofizetes.gomb.jovahagy"),
            jovahagyom: sz("elofizetes.gomb.jovahagyom"),
            kifogas: sz("elofizetes.gomb.kifogas"),
            kifogasolom: sz("elofizetes.gomb.kifogasolom"),
          }}
        />
      )}
    </div>
  );
}
