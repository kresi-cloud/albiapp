import Link from "next/link";
import { KOLTSEGHANYAD, SZJA_KULCS } from "@/domain/ado";
import { datumNyelven, forintNyelven } from "@/domain/nyelv";
import { adoEv, adoEvek, KOLTSEG_FAJTA_LISTA } from "@/lib/ado";
import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { BeszerzesUrlap, KoltsegUrlap } from "./Urlapok";
import { Lapfej, NYITO, Sugo, Szakaszcim } from "@/components/ui/alap";

export const dynamic = "force-dynamic";

export default async function Ado({
  searchParams,
}: {
  searchParams: Promise<{ ev?: string }>;
}) {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u , nyelv } = await szovegek();
  const ft = (osszegFt: number) => forintNyelven(osszegFt, nyelv);
  const nap = (ertek: Date) => datumNyelven(ertek, nyelv);
  const { ev: evParam } = await searchParams;

  const evek = await adoEvek(berbeado.id);
  const ev = evek.includes(Number(evParam)) ? Number(evParam) : evek[0];

  const [osszesites, ingatlanok] = await Promise.all([
    adoEv(berbeado.id, ev),
    prisma.ingatlan.findMany({
      where: { tulajdonosId: berbeado.id },
      orderBy: { letrehozva: "asc" },
    }),
  ]);

  const { osszesito } = osszesites;
  const tetelesAzAjanlott = osszesito.ajanlott === "teteles";

  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <Lapfej cim={sz("ado.cim", { ev })} />
        <div className="flex flex-wrap gap-2 text-sm">
          {evek.map((evszam) => (
            <Link
              key={evszam}
              href={`/ado?ev=${evszam}`}
              // A választott év a márkaszínt kapja, nem fordított feketét: az
              // sötét módban külön párost kívánna, és épp az a baj, amit a
              // jelentés szerinti nevekkel kiváltottunk.
              className={`inline-flex min-h-9 items-center rounded-lg border px-3 ${
                evszam === ev
                  ? "border-transparent bg-albi-700 font-semibold text-white"
                  : "border-keret-eros hover:bg-felulet-halk"
              }`}
            >
              {evszam}
            </Link>
          ))}
          <a
            href={`/ado/letoltes?ev=${ev}`}
            className="rounded border border-keret-eros px-3 py-1 underline-offset-2 hover:underline"
          >
            {sz("ado.letoltes")}
          </a>
        </div>
      </section>

      <Sugo cim={sz("ado.sugo_cim")}>
        <p>{sz("ado.bevezeto")}</p>
      </Sugo>

      <section className="grid gap-3 sm:grid-cols-3">
        <Szamlap cimke={sz("ado.bevetel")} ertek={ft(osszesito.bevetelFt)} />
        <Szamlap
          cimke={sz("ado.nem_bevetel")}
          ertek={ft(osszesito.nemBevetelFt)}
          alcim={sz("ado.nem_bevetel_alcim")}
        />
        <Szamlap cimke={sz("ado.koltseg")} ertek={ft(osszesito.tetelesKoltsegFt)} />
      </section>

      <section className="rounded-kartya border border-keret bg-felulet p-4">
        <h2 className="font-semibold">{sz("ado.melyik_mod")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Mod
            cim={sz("ado.mod.hanyad", { szazalek: Math.round(KOLTSEGHANYAD * 100) })}
            adoalap={ft(osszesito.adoalapHanyadFt)}
            ado={ft(osszesito.adoHanyadFt)}
            ajanlott={!tetelesAzAjanlott}
            magyarazat={sz("ado.mod.hanyad_magyarazat", {
              szazalek: Math.round((1 - KOLTSEGHANYAD) * 100),
            })}
            ajanlottCimke={sz("ado.ajanlott")}
            adoalapCimke={sz("ado.adoalap")}
            adoCimke={sz("ado.szja")}
          />
          <Mod
            cim={sz("ado.mod.teteles")}
            adoalap={ft(osszesito.adoalapTetelesFt)}
            ado={ft(osszesito.adoTetelesFt)}
            ajanlott={tetelesAzAjanlott}
            magyarazat={sz("ado.mod.teteles_magyarazat")}
            ajanlottCimke={sz("ado.ajanlott")}
            adoalapCimke={sz("ado.adoalap")}
            adoCimke={sz("ado.szja")}
          />
        </div>
        <p className="mt-3 text-sm text-halvany">
          {osszesito.megtakaritasFt === 0
            ? sz("ado.egyforma")
            : sz("ado.megtakaritas", {
                mod: tetelesAzAjanlott ? sz("ado.mod.teteles_rag") : sz("ado.mod.hanyad_rag"),
                osszeg: ft(osszesito.megtakaritasFt),
                kulcs: Math.round(SZJA_KULCS * 100),
              })}
        </p>
      </section>

      <section>
        <Szakaszcim>{sz("ado.befolyt")}</Szakaszcim>
        {osszesites.bevetelSorok.length === 0 ? (
          <p className="text-sm text-halvany">
            {sz("ado.nincs_bevetel")}
          </p>
        ) : (
          <Lista darab={osszesites.bevetelSorok.length} cimke={sz("lista.korabbiak", { darab: osszesites.bevetelSorok.length })}>
            {osszesites.bevetelSorok.map((sor, sorszam) => (
              <li
                key={`${sor.datum.toISOString()}-${sorszam}`}
                className="rounded-kartya border border-keret bg-felulet p-3 text-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {nap(sor.datum)} · {u(sor.megnevezes)}
                  </span>
                  <span className="tabular-nums">
                    {sor.nemBevetelFt > 0 ? (
                      <span className="text-nagyon-halvany">
                        {ft(sor.nemBevetelFt)} · {sz("ado.nem_bevetel_jelzes")}
                      </span>
                    ) : (
                      ft(sor.bevetelFt)
                    )}
                  </span>
                </div>
                <p className="mt-1 text-halvany">{u(sor.indoklas)}</p>
              </li>
            ))}
          </Lista>
        )}
      </section>

      {osszesites.besorolatlan.length > 0 ? (
        <section>
          <Szakaszcim>{sz("ado.besorolatlan")}</Szakaszcim>
          <ul className="grid gap-2">
            {osszesites.besorolatlan.map((sor, sorszam) => (
              <li
                key={`${sor.datum.toISOString()}-${sorszam}`}
                className="rounded-lg border border-figyelem-keret bg-figyelem-lap p-3 text-sm text-figyelem"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{nap(sor.datum)}</span>
                  <span className="tabular-nums">{ft(sor.osszegFt)}</span>
                </div>
                <p className="mt-1">{u(sor.megjegyzes)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <Szakaszcim>{sz("ado.koltsegek")}</Szakaszcim>
        {osszesites.koltsegSorok.length === 0 ? (
          <p className="text-sm text-halvany">
            {sz("ado.nincs_koltseg")}
          </p>
        ) : (
          <Lista darab={osszesites.koltsegSorok.length} cimke={sz("lista.korabbiak", { darab: osszesites.koltsegSorok.length })}>
            {osszesites.koltsegSorok.map((sor, sorszam) => (
              <li
                key={`${sor.megnevezes}-${sorszam}`}
                className="rounded-kartya border border-keret bg-felulet p-3 text-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {sor.datum ? `${nap(sor.datum)} · ` : ""}
                    {u(sor.megnevezes)}
                  </span>
                  <span className="tabular-nums">{ft(sor.osszegFt)}</span>
                </div>
                <p className="mt-1 text-halvany">
                  {sor.ingatlan} · {sz(`ado.fajta.${sor.fajta}`)}
                </p>
              </li>
            ))}
          </Lista>
        )}
      </section>

      {ingatlanok.length > 0 ? (
        <section className="rounded-kartya border border-keret bg-felulet p-4">
          <h2 className="font-semibold">{sz("ado.uj_koltseg")}</h2>
          <p className="mb-3 text-sm text-halvany">
            {sz("ado.uj_koltseg_sugo")}
          </p>
          <KoltsegUrlap
            ingatlanok={ingatlanok.map((ingatlan) => ({
              id: ingatlan.id,
              megnevezes: ingatlan.megnevezes,
            }))}
            fajtak={KOLTSEG_FAJTA_LISTA.map((fajta) => ({
              ertek: fajta.ertek,
              cimke: sz(fajta.kulcs),
            }))}
            mai={new Date().toISOString().slice(0, 10)}
            cimkek={{
              ingatlan: sz("ado.urlap.ingatlan"),
              fajta: sz("ado.urlap.fajta"),
              datum: sz("ado.urlap.datum"),
              osszeg: sz("ado.urlap.osszeg"),
              osszegPelda: sz("ado.urlap.osszeg_pelda"),
              megnevezes: sz("ado.urlap.megnevezes"),
              megnevezesPelda: sz("ado.urlap.megnevezes_pelda"),
              gomb: sz("ado.urlap.gomb"),
              folyamatban: sz("ado.urlap.folyamatban"),
            }}
          />
        </section>
      ) : null}

      <section>
        <Szakaszcim>{sz("ado.ertekcsokkenes")}</Szakaszcim>
        <p className="mb-3 text-sm text-halvany">
          {sz("ado.ertekcsokkenes_sugo")}
        </p>
        <ul className="grid gap-3">
          {ingatlanok.map((ingatlan) => (
            <li
              key={ingatlan.id}
              className="rounded-kartya border border-keret bg-felulet p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{ingatlan.megnevezes}</span>
                <span className="text-sm tabular-nums text-halvany">
                  {ingatlan.beszerzesiArFt
                    ? ft(ingatlan.beszerzesiArFt)
                    : sz("ado.nincs_megadva")}
                </span>
              </div>
              <BeszerzesUrlap
                ingatlanId={ingatlan.id}
                beszerzesiArFt={ingatlan.beszerzesiArFt}
                beszerzesDatuma={
                  ingatlan.beszerzesDatuma
                    ? ingatlan.beszerzesDatuma.toISOString().slice(0, 10)
                    : null
                }
                cimkek={{
                  ar: sz("ado.beszerzes.ar"),
                  arPelda: sz("ado.beszerzes.ar_pelda"),
                  nap: sz("ado.beszerzes.nap"),
                  gomb: sz("ado.beszerzes.gomb"),
                  folyamatban: sz("ado.beszerzes.folyamatban"),
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-nagyon-halvany">{sz("ado.lablec")}</p>
    </div>
  );
}

function Szamlap({ cimke, ertek, alcim }: { cimke: string; ertek: string; alcim?: string }) {
  return (
    <div className="rounded-kartya border border-keret bg-felulet p-4">
      <div className="text-xs uppercase tracking-wide text-nagyon-halvany">
        {cimke}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{ertek}</div>
      {alcim ? (
        <div className="mt-1 text-xs text-nagyon-halvany">{alcim}</div>
      ) : null}
    </div>
  );
}

function Mod({
  cim,
  adoalap,
  ado,
  ajanlott,
  magyarazat,
  ajanlottCimke,
  adoalapCimke,
  adoCimke,
}: {
  cim: string;
  /** Kész, formázott összeg: a nyelv a lapon van kézben. */
  adoalap: string;
  ado: string;
  ajanlott: boolean;
  magyarazat: string;
  ajanlottCimke: string;
  adoalapCimke: string;
  adoCimke: string;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        ajanlott
          ? "border-rendben-keret bg-rendben-lap"
          : "border-keret"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">{cim}</span>
        {ajanlott ? (
          <span className="rounded-full bg-rendben-lap px-2 py-0.5 text-xs font-medium text-rendben">
            {ajanlottCimke}
          </span>
        ) : null}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-nagyon-halvany">{adoalapCimke}</dt>
          <dd className="tabular-nums">{adoalap}</dd>
        </div>
        <div>
          <dt className="text-xs text-nagyon-halvany">{adoCimke}</dt>
          <dd className="font-semibold tabular-nums">{ado}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-halvany">{magyarazat}</p>
    </div>
  );
}

/**
 * Hosszú tételsor. Az összesítő a lényeg, a sorok a mögötte lévő bizonyíték:
 * minden számhoz tartozik indoklás, és azokat nem vesszük el, csak összecsukjuk.
 *
 * Rövid listát nem csukunk össze: három sor mögé kattintani rosszabb, mint
 * elolvasni őket.
 */
const HOSSZU_LISTA = 8;

function Lista({
  darab,
  cimke,
  children,
}: {
  darab: number;
  cimke: string;
  children: React.ReactNode;
}) {
  const lista = <ul className="grid gap-2">{children}</ul>;
  if (darab <= HOSSZU_LISTA) return lista;

  return (
    <details className="rounded-kartya border border-keret bg-felulet">
      <summary className={`${NYITO} px-3`}>{cimke}</summary>
      <div className="p-3 pt-0">{lista}</div>
    </details>
  );
}
