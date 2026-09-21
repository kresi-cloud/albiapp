import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULOK } from "@/domain/szerzodes-modulok";
import { hianyzoAdatok, szakaszok, zaradekSorok } from "@/domain/szerzodes-keszites";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { szerzodesBemenet } from "@/lib/szerzodes";
import {
  ModulValto,
  ParameterUrlap,
  VeglegesitesUrlap,
  VisszavonasUrlap,
  type ModulCimkek,
  type ParameterNezet,
} from "./Urlapok";

export const dynamic = "force-dynamic";

function napSzoveg(nap: Date | null | undefined): string {
  return nap ? nap.toISOString().slice(0, 10) : "";
}

export default async function SzerzodesOldal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();

  const betoltott = await szerzodesBemenet(id, berbeado.id);
  if (!betoltott) notFound();

  const { bemenet, megnevezes, allapot, veglegesSzoveg } = betoltott;
  const kotelezoek = MODULOK.filter((modul) => modul.kotelezo);
  const valaszthato = MODULOK.filter((modul) => !modul.kotelezo);
  const szerkesztheto = allapot === "tervezet";
  const valasztott = new Set(bemenet.valasztottModulok);
  const hianyok = hianyzoAdatok(bemenet);

  // Csak a bekerülő modulok paramétereit kérjük be: a kikapcsolt modul kérdései
  // csak zavarnának.
  const parameterek: ParameterNezet[] = MODULOK.filter(
    (modul) => modul.kotelezo || valasztott.has(modul.kulcs),
  ).flatMap((modul) =>
    modul.parameterek.map((parameter) => ({
      kulcs: parameter.kulcs,
      cimke: parameter.cimke,
      tipus: parameter.tipus,
      ertek: bemenet.parameterek[parameter.kulcs] ?? parameter.alapertelmezes,
      sugo: parameter.sugo,
      modulCim: modul.cim,
      valaszthatok: parameter.valaszthatok,
    })),
  );

  const kesz = szakaszok(bemenet);

  const modulCimkek: ModulCimkek = {
    kotelezo: sz("szerzodes.kotelezo_jelzes"),
    benneVan: sz("szerzodes.benne_van"),
    nincsBenne: sz("szerzodes.nincs_benne"),
    benneVanJelzes: sz("szerzodes.benne_van_jelzes"),
    nincsBenneJelzes: sz("szerzodes.nincs_benne_jelzes"),
    ellenjegyzes: {
      nincs: sz("szerzodes.ellenjegyzes.nincs"),
      folyamatban: sz("szerzodes.ellenjegyzes.folyamatban"),
      ellenjegyzett: sz("szerzodes.ellenjegyzes.ellenjegyzett"),
    },
  };

  return (
    <div className="grid gap-6">
      <section>
        <Link href="/dokumentumok" className="text-sm underline underline-offset-2">
          {sz("szerzodes.vissza")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{megnevezes}</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {sz(szerkesztheto ? "szerzodes.tervezet_sugo" : "szerzodes.vegleges_sugo")}
        </p>
      </section>

      <section className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        {sz("szerzodes.ellenjegyzes_figyelmeztetes")}
      </section>

      {/*
        A szerződés szövege magyarul érvényes, tehát magyarul is marad. Ezt a lap
        kimondja, különben az angol felületen a magyar pontok hibának látszanak.
      */}
      <section className="text-sm text-stone-600 dark:text-stone-400">
        {sz("szerzodes.magyar_szoveg")}
      </section>

      {/*
        Személyazonosságot az alkalmazás nem igazol. Ezt kimondani a szerződés
        előtt fontosabb, mint bármelyik másik figyelmeztetés a lapon.
      */}
      <section className="rounded border border-stone-300 bg-stone-50 p-3 text-sm dark:border-stone-700 dark:bg-stone-900">
        <h2 className="font-medium">{sz("szerzodes.azonossag_cim")}</h2>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          {sz("szerzodes.azonossag_sugo")}
        </p>
      </section>

      {hianyok.length > 0 ? (
        <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-medium">{sz("szerzodes.hianyok_cim")}</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-stone-600 dark:text-stone-400">
            {hianyok.map((sor) => (
              <li key={`${sor.kulcs}:${u(sor)}`}>{u(sor)}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {sz("szerzodes.hianyok_hol")}
          </p>
          <p className="mt-1 flex flex-wrap gap-4 text-sm">
            <Link href="/berlok" className="underline underline-offset-2">
              {sz("nav.berlok")}
            </Link>
            <Link href="/beallitasok" className="underline underline-offset-2">
              {sz("nav.beallitasok")}
            </Link>
          </p>
        </section>
      ) : null}

      {/*
        A kötelező modulok külön állnak, összecsukva. Nincs rajtuk mit
        eldönteni — minden szerződésben benne vannak —, viszont a "miért"
        mondatukkal együtt ennyien elnyomják azt a tucatot, ahol tényleg
        választani kell. Nem tűnnek el: a nyitósor kiírja, hányan vannak.
      */}
      <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="font-medium">{sz("szerzodes.dontes_cim")}</h2>
        <p className="mb-2 mt-1 text-sm text-stone-600 dark:text-stone-400">
          {sz("szerzodes.dontes_sugo")}
        </p>
        <ul>
          {valaszthato.map((modul) => (
            <ModulValto
              key={modul.kulcs}
              szerzodesId={id}
              szerkesztheto={szerkesztheto}
              modul={{
                kulcs: modul.kulcs,
                cim: modul.cim,
                kotelezo: modul.kotelezo,
                bekapcsolva: valasztott.has(modul.kulcs),
                miert: modul.miert,
                ellenjegyzes: modul.ellenjegyzes,
              }}
              cimkek={modulCimkek}
            />
          ))}
        </ul>
      </section>

      <details className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <summary className="cursor-pointer font-medium">
          {sz("szerzodes.kotelezoek_nyito", { db: kotelezoek.length })}
        </summary>
        <ul className="mt-2">
          {kotelezoek.map((modul) => (
            <ModulValto
              key={modul.kulcs}
              szerzodesId={id}
              szerkesztheto={szerkesztheto}
              modul={{
                kulcs: modul.kulcs,
                cim: modul.cim,
                kotelezo: modul.kotelezo,
                bekapcsolva: true,
                miert: modul.miert,
                ellenjegyzes: modul.ellenjegyzes,
              }}
              cimkek={modulCimkek}
            />
          ))}
        </ul>
      </details>

      {szerkesztheto ? (
        <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-medium">{sz("szerzodes.beallitasok_cim")}</h2>
          <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
            {sz("szerzodes.beallitasok_sugo")}
          </p>
          <ParameterUrlap
            szerzodesId={id}
            parameterek={parameterek}
            kelteHelye={bemenet.kelteHelye ?? ""}
            kelte={napSzoveg(bemenet.kelte)}
            cimkek={{
              kelteHelye: sz("szerzodes.kelt_helye"),
              kelte: sz("szerzodes.kelt_napja"),
              gomb: sz("szerzodes.mentes"),
              folyamatban: sz("szerzodes.mentem"),
            }}
          />
        </section>
      ) : null}

      {/*
        A szerződés szövege húsz telefonképernyő. Ha nyitva áll, a modulok
        átállítása és a véglegesítés is az aljára kerül, vagyis minden
        próbálkozás után végig kell görgetni rajta. Összecsukva áll, de nem
        rejtve: a nyitósor kiírja, hány szakaszból áll, és egy koppintásra
        látszik. A véglegesített szöveg alapból nyitva van, mert azt olvasni
        jön vissza az ember.
      */}
      <details
        open={veglegesSzoveg !== null}
        className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
      >
        <summary className="cursor-pointer font-medium">
          {sz("szerzodes.szoveg_nyito", { db: kesz.length })}
        </summary>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <a
            href={`/szerzodesek/${id}/letoltes`}
            className="text-sm underline underline-offset-2"
          >
            {sz("szerzodes.letoltes")}
          </a>
        </div>

        {veglegesSzoveg ? (
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-relaxed">
            {veglegesSzoveg}
          </pre>
        ) : (
          <div className="mt-3 grid gap-4 text-sm leading-relaxed">
            {kesz.map((szakasz) => (
              <article key={szakasz.kulcs}>
                <h3 className="font-medium">
                  {szakasz.sorszam}. {szakasz.cim}
                </h3>
                {szakasz.bekezdesek.map((bekezdes, index) => (
                  <p key={index} className="mt-1 text-stone-700 dark:text-stone-300">
                    {bekezdes}
                  </p>
                ))}
              </article>
            ))}
            <pre className="whitespace-pre-wrap border-t border-stone-200 pt-4 text-stone-700 dark:border-stone-800 dark:text-stone-300">
              {zaradekSorok(bemenet).join("\n")}
            </pre>
          </div>
        )}
      </details>

      <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        {szerkesztheto ? (
          <VeglegesitesUrlap
            szerzodesId={id}
            cimkek={{
              nyugtazas: sz("szerzodes.nyugtazas"),
              gomb: sz("szerzodes.veglegesites"),
              megis: sz("szerzodes.veglegesites_megis"),
              folyamatban: sz("szerzodes.veglegesitem"),
            }}
          />
        ) : (
          <VisszavonasUrlap
            szerzodesId={id}
            cimkek={{
              gomb: sz("szerzodes.vissza_tervezetre"),
              folyamatban: sz("szerzodes.visszaallitom"),
            }}
          />
        )}
      </section>
    </div>
  );
}
