import Link from "next/link";
import { KOLTSEGHANYAD, SZJA_KULCS } from "@/domain/ado";
import { datum, forint } from "@/domain/penz";
import { adoEv, adoEvek, koltsegFajtaNeve, KOLTSEG_FAJTA_LISTA } from "@/lib/ado";
import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { BeszerzesUrlap, KoltsegUrlap } from "./Urlapok";

export const dynamic = "force-dynamic";

export default async function Ado({
  searchParams,
}: {
  searchParams: Promise<{ ev?: string }>;
}) {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
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
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Adóösszesítő · {ev}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Ez összesítő, nem bevallás: a bevallást te adod be, ezekkel a számokkal
          ellenőrizve. A bevétel pénzforgalmi, vagyis az számít, ami ebben az évben
          tényleg megérkezett.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {evek.map((evszam) => (
            <Link
              key={evszam}
              href={`/ado?ev=${evszam}`}
              className={`rounded border px-3 py-1 ${
                evszam === ev
                  ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                  : "border-stone-300 dark:border-stone-700"
              }`}
            >
              {evszam}
            </Link>
          ))}
          <a
            href={`/ado/letoltes?ev=${ev}`}
            className="rounded border border-stone-300 px-3 py-1 underline-offset-2 hover:underline dark:border-stone-700"
          >
            Letöltés táblázatba
          </a>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Szamlap cimke="Bevétel" ertek={forint(osszesito.bevetelFt)} />
        <Szamlap
          cimke="Nem bevétel"
          ertek={forint(osszesito.nemBevetelFt)}
          alcim="mért, továbbhárított rezsi"
        />
        <Szamlap cimke="Költség" ertek={forint(osszesito.tetelesKoltsegFt)} />
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="font-semibold">Melyik elszámolással jársz jobban</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Mod
            cim={`${Math.round(KOLTSEGHANYAD * 100)}%-os költséghányad`}
            adoalap={osszesito.adoalapHanyadFt}
            ado={osszesito.adoHanyadFt}
            ajanlott={!tetelesAzAjanlott}
            magyarazat="Nem kell számlákat gyűjteni: a bevétel 90%-a az adóalap."
          />
          <Mod
            cim="Tételes költségelszámolás"
            adoalap={osszesito.adoalapTetelesFt}
            ado={osszesito.adoTetelesFt}
            ajanlott={tetelesAzAjanlott}
            magyarazat="A ténylegesen felmerült költségek, számlával, az értékcsökkenéssel együtt."
          />
        </div>
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
          {osszesito.megtakaritasFt === 0
            ? "A két mód most ugyanannyit hoz."
            : `A ${tetelesAzAjanlott ? "tételes elszámolással" : "költséghányaddal"} ${forint(osszesito.megtakaritasFt)} adóval kevesebbet fizetsz. Az szja kulcsa ${Math.round(SZJA_KULCS * 100)}%.`}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Ami befolyt</h2>
        {osszesites.bevetelSorok.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Ebben az évben még nem érkezett párosított befizetés.
          </p>
        ) : (
          <Lista darab={osszesites.bevetelSorok.length} cimke={sz("lista.korabbiak", { darab: osszesites.bevetelSorok.length })}>
            {osszesites.bevetelSorok.map((sor, sorszam) => (
              <li
                key={`${sor.datum.toISOString()}-${sorszam}`}
                className="rounded-lg border border-stone-200 bg-white p-3 text-sm dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {datum(sor.datum)} · {sor.megnevezes}
                  </span>
                  <span className="tabular-nums">
                    {sor.nemBevetelFt > 0 ? (
                      <span className="text-stone-500 dark:text-stone-400">
                        {forint(sor.nemBevetelFt)} · nem bevétel
                      </span>
                    ) : (
                      forint(sor.bevetelFt)
                    )}
                  </span>
                </div>
                <p className="mt-1 text-stone-600 dark:text-stone-400">{sor.indoklas}</p>
              </li>
            ))}
          </Lista>
        )}
      </section>

      {osszesites.besorolatlan.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Besorolatlan befizetés</h2>
          <ul className="grid gap-2">
            {osszesites.besorolatlan.map((sor, sorszam) => (
              <li
                key={`${sor.datum.toISOString()}-${sorszam}`}
                className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{datum(sor.datum)}</span>
                  <span className="tabular-nums">{forint(sor.osszegFt)}</span>
                </div>
                <p className="mt-1">{sor.megjegyzes}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Költségek</h2>
        {osszesites.koltsegSorok.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Ebben az évben még nincs rögzített költség.
          </p>
        ) : (
          <Lista darab={osszesites.koltsegSorok.length} cimke={sz("lista.korabbiak", { darab: osszesites.koltsegSorok.length })}>
            {osszesites.koltsegSorok.map((sor, sorszam) => (
              <li
                key={`${sor.megnevezes}-${sorszam}`}
                className="rounded-lg border border-stone-200 bg-white p-3 text-sm dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {sor.datum ? `${datum(sor.datum)} · ` : ""}
                    {sor.megnevezes}
                  </span>
                  <span className="tabular-nums">{forint(sor.osszegFt)}</span>
                </div>
                <p className="mt-1 text-stone-600 dark:text-stone-400">
                  {sor.ingatlan} · {koltsegFajtaNeve(sor.fajta)}
                </p>
              </li>
            ))}
          </Lista>
        )}
      </section>

      {ingatlanok.length > 0 ? (
        <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-semibold">Új költség</h2>
          <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
            Csak a tételes elszámolásnál számít, de érdemes rögzíteni: év végén
            derül ki, melyik móddal jársz jobban.
          </p>
          <KoltsegUrlap
            ingatlanok={ingatlanok.map((ingatlan) => ({
              id: ingatlan.id,
              megnevezes: ingatlan.megnevezes,
            }))}
            fajtak={KOLTSEG_FAJTA_LISTA}
            mai={new Date().toISOString().slice(0, 10)}
          />
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Értékcsökkenés alapja</h2>
        <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
          A tételes elszámolásban az épület beszerzési árának évi 2%-a leírható,
          a kiadott napokra arányosítva. Enélkül a tételes mód hiányos.
        </p>
        <ul className="grid gap-3">
          {ingatlanok.map((ingatlan) => (
            <li
              key={ingatlan.id}
              className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{ingatlan.megnevezes}</span>
                <span className="text-sm tabular-nums text-stone-600 dark:text-stone-400">
                  {ingatlan.beszerzesiArFt ? forint(ingatlan.beszerzesiArFt) : "nincs megadva"}
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
              />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-stone-500 dark:text-stone-400">
        Az összesítő a rögzített adatokból számol, és nem helyettesíti a
        könyvelőt. A mért, továbbhárított közüzemi díj azért nem bevétel, mert a
        tényleges fogyasztás szerint hárul át; az átalányban fizetett rezsi
        viszont bevétel.
      </p>
    </div>
  );
}

function Szamlap({ cimke, ertek, alcim }: { cimke: string; ertek: string; alcim?: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {cimke}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{ertek}</div>
      {alcim ? (
        <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">{alcim}</div>
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
}: {
  cim: string;
  adoalap: number;
  ado: number;
  ajanlott: boolean;
  magyarazat: string;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        ajanlott
          ? "border-emerald-400 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
          : "border-stone-200 dark:border-stone-800"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">{cim}</span>
        {ajanlott ? (
          <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
            ezzel jársz jobban
          </span>
        ) : null}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-stone-500 dark:text-stone-400">Adóalap</dt>
          <dd className="tabular-nums">{forint(adoalap)}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500 dark:text-stone-400">Szja</dt>
          <dd className="font-semibold tabular-nums">{forint(ado)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">{magyarazat}</p>
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
    <details className="rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <summary className="cursor-pointer p-3 text-sm font-medium">{cimke}</summary>
      <div className="p-3 pt-0">{lista}</div>
    </details>
  );
}
