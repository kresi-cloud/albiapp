import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULOK } from "@/domain/szerzodes-modulok";
import {
  hianyzoAdatok,
  okiratSzovege,
  szakaszok,
  alairasSorok,
  zaradekBevezeto,
  ZARADEK_ZARO,
} from "@/domain/szerzodes-keszites";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { szerzodesBemenet } from "@/lib/szerzodes";
import { NYITO } from "@/components/ui/alap";
import {
  ModulValto,
  ParameterUrlap,
  VeglegesitesUrlap,
  VisszavonasUrlap,
  ZaradekUrlap,
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

  const { bemenet, megnevezes, allapot, veglegesSzoveg, veglegesSzovegEn, fajta } = betoltott;
  // Véglegesítés után a befagyasztott fordítás, tervezetnél a mostani
  // modulszövegekből készült. Ami a fordítás előtt lett véglegesítve, ahhoz
  // nincs és nem is lesz: egy most készült fordítás már nem ahhoz a szöveghez
  // tartozna.
  const forditas =
    allapot === "veglegesitve" ? veglegesSzovegEn : okiratSzovege(bemenet, "en");
  // A záradék nem egy második teljes szerződés: kötelező pontja nincs, és
  // amit a felek már aláírtak, azt nem írjuk le újra.
  const zaradek = fajta === "zaradek";
  const kotelezoek = zaradek ? [] : MODULOK.filter((modul) => modul.kotelezo);
  const valaszthato = zaradek ? MODULOK : MODULOK.filter((modul) => !modul.kotelezo);
  const szerkesztheto = allapot === "tervezet";
  const valasztott = new Set(bemenet.valasztottModulok);
  const hianyok = hianyzoAdatok(bemenet);

  // Csak a bekerülő modulok paramétereit kérjük be: a kikapcsolt modul kérdései
  // csak zavarnának.
  const parameterek: ParameterNezet[] = MODULOK.filter(
    (modul) => (modul.kotelezo && !zaradek) || valasztott.has(modul.kulcs),
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
        <p className="mt-1 text-sm text-halvany">
          {sz(szerkesztheto ? "szerzodes.tervezet_sugo" : "szerzodes.vegleges_sugo")}
        </p>
        {/*
          A záradék önmagában nem értelmezhető: az olvasónak tudnia kell, melyik
          szerződéshez tartozik, és hogy a többi pont változatlanul hatályban marad.
        */}
        {zaradek ? (
          <p className="mt-2 rounded border border-keret-eros bg-felulet-halk p-3 text-sm">
            {bemenet.alap
              ? sz("szerzodes.zaradek_alapja", { nev: bemenet.alap.megnevezes })
              : sz("szerzodes.zaradek_sugo")}
          </p>
        ) : null}
      </section>

      <section className="rounded border border-figyelem-keret bg-figyelem-lap p-3 text-sm text-figyelem">
        {sz("szerzodes.ellenjegyzes_figyelmeztetes")}
      </section>

      {/*
        A szerződés szövege magyarul érvényes, tehát magyarul is marad. Ezt a lap
        kimondja, különben az angol felületen a magyar pontok hibának látszanak.
      */}
      <section className="text-sm text-halvany">
        {sz("szerzodes.magyar_szoveg")}
      </section>

      {/*
        Személyazonosságot az alkalmazás nem igazol. Ezt kimondani a szerződés
        előtt fontosabb, mint bármelyik másik figyelmeztetés a lapon.
      */}
      <section className="rounded border border-keret-eros bg-felulet-halk p-3 text-sm">
        <h2 className="font-medium">{sz("szerzodes.azonossag_cim")}</h2>
        <p className="mt-1 text-halvany">
          {sz("szerzodes.azonossag_sugo")}
        </p>
      </section>

      {hianyok.length > 0 ? (
        <section className="rounded-kartya border border-keret bg-felulet p-4">
          <h2 className="font-medium">{sz("szerzodes.hianyok_cim")}</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-halvany">
            {hianyok.map((sor) => (
              <li key={`${sor.kulcs}:${u(sor)}`}>{u(sor)}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-halvany">
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
      <section className="rounded-kartya border border-keret bg-felulet p-4">
        <h2 className="font-medium">{sz("szerzodes.dontes_cim")}</h2>
        <p className="mb-2 mt-1 text-sm text-halvany">
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

      <details className="rounded-kartya border border-keret bg-felulet p-4">
        <summary className={NYITO}>
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
        <section className="rounded-kartya border border-keret bg-felulet p-4">
          <h2 className="font-medium">{sz("szerzodes.beallitasok_cim")}</h2>
          <p className="mb-3 text-sm text-halvany">
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
        látszik.

        A véglegesített szöveg korábban alapból nyitva volt, azzal az
        indokkal, hogy azt olvasni jön vissza az ember. Ettől viszont a
        véglegesített szerződés lapja tizenkilenc telefonképernyő lett, és ezt
        semmi nem szólta be: a méretkapu csak tervezetet mért, mert a
        példaadatban nincs véglegesített szerződés. A korlát nem emelhető, tehát
        ez is csukva áll — egy koppintás, és ugyanúgy ott a teljes szöveg.
      */}
      <details className="rounded-kartya border border-keret bg-felulet p-4">
        <summary className={NYITO}>
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
            {/*
              A záradék bevezetője és záró mondata nem modul, hanem a záradék
              elhagyhatatlan része; a tervezetben is látszania kell, különben a
              bérbeadó csak a véglegesítés után látná, mit ír alá.
            */}
            {zaradek ? (
              <p className="text-szoveg">{zaradekBevezeto(bemenet)}</p>
            ) : null}
            {kesz.map((szakasz) => (
              <article key={szakasz.kulcs}>
                <h3 className="font-medium">
                  {szakasz.sorszam}. {szakasz.cim}
                </h3>
                {szakasz.bekezdesek.map((bekezdes, index) => (
                  <p key={index} className="mt-1 text-szoveg">
                    {bekezdes}
                  </p>
                ))}
              </article>
            ))}
            {zaradek ? <p className="text-szoveg">{ZARADEK_ZARO}</p> : null}
            <pre className="whitespace-pre-wrap border-t border-keret pt-4 text-szoveg">
              {alairasSorok(bemenet).join("\n")}
            </pre>
          </div>
        )}
      </details>

      {/*
        A fordítás külön szakasz, összecsukva. Nem a magyar szöveg mellé tesszük,
        mert nem az a szerződés: aki ide nyit be, az kifejezetten a tájékoztató
        példányt keresi. A tervezetnél a mostani modulszövegekből készül, a
        véglegesítettnél a befagyasztott példány jön — ugyanaz a szabály, mint a
        magyarnál.
      */}
      <details className="rounded-kartya border border-keret bg-felulet p-4">
        <summary className={NYITO}>{sz("szerzodes.forditas_cim")}</summary>
        <p className="mt-3 text-sm text-halvany">{sz("szerzodes.forditas_sugo")}</p>
        {forditas ? (
          <>
            <div className="mt-3">
              <a
                href={`/szerzodesek/${id}/letoltes?nyelv=en`}
                className="text-sm underline underline-offset-2"
              >
                {sz("szerzodes.letoltes_angolul")}
              </a>
            </div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-relaxed">
              {forditas}
            </pre>
          </>
        ) : (
          <p className="mt-3 text-sm text-szoveg">{sz("szerzodes.forditas_nincs_meg")}</p>
        )}
      </details>

      <section className="rounded-kartya border border-keret bg-felulet p-4">
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
          <>
            <VisszavonasUrlap
              szerzodesId={id}
              cimkek={{
                gomb: sz("szerzodes.vissza_tervezetre"),
                folyamatban: sz("szerzodes.visszaallitom"),
              }}
            />
            {/* Záradékot csak szerződéshez lehet készíteni, záradékhoz nem. */}
            {zaradek ? null : (
              <ZaradekUrlap
                szerzodesId={id}
                cimkek={{
                  sugo: sz("szerzodes.zaradek_miert"),
                  gomb: sz("szerzodes.zaradek_gomb"),
                  folyamatban: sz("szerzodes.zaradekot_keszitek"),
                }}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
