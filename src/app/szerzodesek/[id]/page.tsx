import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULOK } from "@/domain/szerzodes-modulok";
import { hianyzoAdatok, szakaszok, zaradekSorok } from "@/domain/szerzodes-keszites";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szerzodesBemenet } from "@/lib/szerzodes";
import {
  ModulValto,
  ParameterUrlap,
  VeglegesitesUrlap,
  VisszavonasUrlap,
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

  const betoltott = await szerzodesBemenet(id, berbeado.id);
  if (!betoltott) notFound();

  const { bemenet, megnevezes, allapot, veglegesSzoveg } = betoltott;
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

  return (
    <div className="grid gap-6">
      <section>
        <Link href="/dokumentumok" className="text-sm underline underline-offset-2">
          ← Dokumentumok
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{megnevezes}</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {szerkesztheto
            ? "Tervezet. A szöveg minden mentés után újraépül a modulokból."
            : "Véglegesítve. A szöveg be van fagyasztva, egy későbbi modulfrissítés sem írja át."}
        </p>
      </section>

      <section className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        A modulok ügyvédi ellenjegyzése még nincs meg, ezért ez egyelőre tervezet:
        használat előtt nézesd át ügyvéddel. Az ellenjegyzett modulok megjelölve
        fognak megjelenni.
      </section>

      {/*
        Személyazonosságot az alkalmazás nem igazol. Ezt kimondani a szerződés
        előtt fontosabb, mint bármelyik másik figyelmeztetés a lapon.
      */}
      <section className="rounded border border-stone-300 bg-stone-50 p-3 text-sm dark:border-stone-700 dark:bg-stone-900">
        <h2 className="font-medium">Szerződés előtt: igazoljátok a személyazonosságot</h2>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Az alkalmazás nem ellenőrzi, hogy ki kicsoda: amit a felek megadtak, az a saját
          állításuk. Aláírás előtt nézzétek meg egymás fényképes igazolványát személyesen,
          és vessétek össze a szerződésben álló adatokkal.
        </p>
      </section>

      {hianyok.length > 0 ? (
        <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-medium">Ezek még hiányoznak</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-stone-600 dark:text-stone-400">
            {hianyok.map((sor) => (
              <li key={sor}>{sor}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            A bérlők adatai a <Link href="/berlok" className="underline underline-offset-2">Bérlők</Link> lapon,
            a tieid a <Link href="/beallitasok" className="underline underline-offset-2">Beállítások</Link> lapon
            tölthetők ki.
          </p>
        </section>
      ) : null}

      <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="font-medium">Modulok</h2>
        <ul className="mt-2">
          {MODULOK.map((modul) => (
            <ModulValto
              key={modul.kulcs}
              szerzodesId={id}
              szerkesztheto={szerkesztheto}
              modul={{
                kulcs: modul.kulcs,
                cim: modul.cim,
                kotelezo: modul.kotelezo,
                bekapcsolva: modul.kotelezo || valasztott.has(modul.kulcs),
                miert: modul.miert,
                ellenjegyzes: modul.ellenjegyzes,
              }}
            />
          ))}
        </ul>
      </section>

      {szerkesztheto ? (
        <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-medium">Beállítások</h2>
          <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
            Csak azt kérdezzük, ami a bekapcsolt modulokhoz kell. Ami üresen
            marad, az az alapértelmezéssel kerül a szövegbe.
          </p>
          <ParameterUrlap
            szerzodesId={id}
            parameterek={parameterek}
            kelteHelye={bemenet.kelteHelye ?? ""}
            kelte={napSzoveg(bemenet.kelte)}
          />
        </section>
      ) : null}

      <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium">A szerződés szövege</h2>
          <a
            href={`/szerzodesek/${id}/letoltes`}
            className="text-sm underline underline-offset-2"
          >
            Letöltés szövegként
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
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        {szerkesztheto ? <VeglegesitesUrlap szerzodesId={id} /> : <VisszavonasUrlap szerzodesId={id} />}
      </section>
    </div>
  );
}
