import { hianyzoParok, osszesit, type KepAllapot } from "@/domain/jegyzokonyv-kepek";
import type { KepNezet } from "@/lib/jegyzokonyv-kepek";
import { szovegek } from "@/lib/nyelv";
import { KepElbiralas, KepFeltoltes, KepTorles } from "./Urlapok";
import { NYITO } from "@/components/ui/alap";

/**
 * A jegyzőkönyv fényképalbuma, ugyanaz a bérbeadónál és a bérlőnél.
 *
 * A sorrend nem díszítés: elöl az áll, amivel az olvasónak dolga van — amit
 * neki kell megerősítenie, és amire kifogás érkezett. Amiben a két fél
 * egyetért, az összecsukva áll. Ugyanaz az elv, mint a befizetéseknél: egy
 * negyven képes album telefonon máskülönben kezelhetetlen.
 */

const KERET: Record<KepAllapot, string> = {
  egyoldalu: "border-figyelem-keret",
  megerositve: "border-rendben-keret",
  vitatott: "border-gond-keret",
};

export async function Album({
  jegyzokonyvId,
  fajta,
  lezart,
  kepek,
  tetelek,
  nyitoKepek = [],
}: {
  jegyzokonyvId: string;
  fajta: string;
  lezart: boolean;
  kepek: KepNezet[];
  tetelek: { id: string; megnevezes: string }[];
  /** Birtokbaadáskori képek; a záró jegyzőkönyvnél ezekhez párosítunk. */
  nyitoKepek?: KepNezet[];
}) {
  const { sz, u } = await szovegek();

  const feltoltesCimkek = {
    nyito: sz("kep.feltoltes"),
    megnevezes: sz("kep.megnevezes"),
    megnevezesPelda: sz("kep.megnevezes_pelda"),
    tetel: sz("kep.tetel"),
    tetelNelkul: sz("kep.tetel_nelkul"),
    fajl: sz("kep.fajl"),
    gomb: sz("kep.feltoltes"),
    folyamatban: sz("kep.feltoltom"),
  };

  const elbiralasCimkek = {
    megerosit: sz("kep.megerosit"),
    kifogasol: sz("kep.kifogasol"),
    kifogasSzovege: sz("kep.kifogas_szovege"),
    kifogasPelda: sz("kep.kifogas_pelda"),
  };

  const parhoz = new Map(nyitoKepek.map((kep) => [kep.id, kep]));
  // Elöl, amivel dolga van: a megerősítésre váró és a vitatott kép.
  const soronVan = kepek.filter((kep) => kep.megerositheto || kep.allapot === "vitatott");
  const rendezett = kepek.filter((kep) => !soronVan.includes(kep));
  const hianyzo = fajta === "visszaadas" ? hianyzoParok(nyitoKepek, kepek) : [];
  const osszesites = osszesit(kepek);

  function Kartya({ kep }: { kep: KepNezet }) {
    const parja = kep.parjaId ? parhoz.get(kep.parjaId) : undefined;

    return (
      <li
        className={`grid gap-2 rounded border p-2 ${KERET[kep.allapot]} bg-felulet`}
      >
        {/*
          Sima <img>, nem a keretrendszer képkomponense: a kép a saját
          kiszolgálói útvonalunkról jön, belépéshez kötve, és nem akarjuk, hogy
          bárki más átméretezze vagy gyorsítótárazza.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/jegyzokonyv-kepek/${kep.id}`}
          alt={kep.megnevezes}
          loading="lazy"
          className="aspect-square w-full rounded object-cover"
        />
        <p className="text-sm font-medium">{kep.megnevezes}</p>
        <p className="text-xs text-halvany">
          {sz(`kep.keszitette.${kep.feltoltoSzerep}`)} {u({ kulcs: `kep.allapot.${kep.allapot}` })}
        </p>

        {kep.kifogas ? (
          <p className="rounded bg-gond-lap p-2 text-xs text-gond">
            {kep.kifogas}
          </p>
        ) : null}

        {parja ? (
          <details>
            <summary className={NYITO}>
              {sz("kep.par_cim")}
            </summary>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/jegyzokonyv-kepek/${parja.id}`}
              alt={parja.megnevezes}
              loading="lazy"
              className="mt-2 aspect-square w-full rounded object-cover"
            />
          </details>
        ) : null}

        {kep.megerositheto ? <KepElbiralas kepId={kep.id} cimkek={elbiralasCimkek} /> : null}
        {kep.sajat && !lezart ? <KepTorles kepId={kep.id} cimke={sz("kep.torles")} /> : null}
      </li>
    );
  }

  return (
    <section>
      <h2 className="text-base font-semibold">{sz("kep.cim")}</h2>
      <p className="mt-1 text-sm text-halvany">{sz("kep.sugo")}</p>
      {fajta === "visszaadas" ? (
        <p className="mt-1 text-sm text-halvany">{sz("kep.sugo.zaro")}</p>
      ) : null}

      {kepek.length === 0 ? (
        <p className="mt-3 text-sm text-halvany">{sz("kep.nincs")}</p>
      ) : (
        <p className="mt-3 text-sm">{sz("kep.osszesites", { ...osszesites })}</p>
      )}

      {soronVan.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {soronVan.map((kep) => (
            <Kartya key={kep.id} kep={kep} />
          ))}
        </ul>
      ) : null}

      {rendezett.length > 0 ? (
        <details className="mt-3">
          <summary className={NYITO}>
            {sz("lista.korabbiak", { darab: rendezett.length })}
          </summary>
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {rendezett.map((kep) => (
              <Kartya key={kep.id} kep={kep} />
            ))}
          </ul>
        </details>
      ) : null}

      {hianyzo.length > 0 && !lezart ? (
        <div className="mt-4 rounded border border-figyelem-keret bg-figyelem-lap p-3 text-sm text-figyelem">
          <p>{sz("kep.par_hianyzik", { darab: hianyzo.length })}</p>
          <ul className="mt-2 grid gap-2">
            {hianyzo.map((kep) => (
              <li key={kep.id}>
                <KepFeltoltes
                  jegyzokonyvId={jegyzokonyvId}
                  tetelek={[]}
                  parjaId={kep.id}
                  parCimke={`${sz("kep.par_keszit")}: ${kep.megnevezes}`}
                  cimkek={feltoltesCimkek}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {lezart ? (
        <p className="mt-3 text-sm text-halvany">{sz("kep.lezart")}</p>
      ) : (
        <KepFeltoltes jegyzokonyvId={jegyzokonyvId} tetelek={tetelek} cimkek={feltoltesCimkek} />
      )}
    </section>
  );
}
