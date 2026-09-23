import { Bejelentes, Lemondas, Valaszurlap } from "@/app/latogatasok/Urlapok";
import {
  Jelzo,
  Lapfej,
  NYITO,
  Sugo,
  Szakaszcim,
  Ures,
  type Allapotszin,
} from "@/components/ui/alap";
import {
  allapot,
  allapotMondata,
  FAJTAK,
  idoablak,
  latogatasokatRendez,
  lemondhatja,
  VALASZOK,
  type Allapot,
} from "@/domain/latogatas";
import type { LatogatasNezet } from "@/lib/latogatas";
import { datumNyelven, type Nyelv } from "@/domain/nyelv";
import { napEleje } from "@/domain/penz";
import { szovegekNyelvvel } from "@/domain/szotar";

/**
 * A látogatások lapja, mindkét szerepnek ugyanaz.
 *
 * Azért közös, mert a látogatás egy esemény, és mindkét fél ugyanazt látja
 * róla; a különbség annyi, hogy nyilatkozni a bérlő nyilatkozik. Két külön lap
 * ugyanezt még egyszer leírná, és a második előbb-utóbb elmaradna az elsőtől.
 *
 * Elöl az van, ami még hátravan; a lemondott és az elmúlt összecsukva áll. Egy
 * év alatt egy bérleményen tíz-tizenöt látogatás gyűlik össze, és a tavalyi
 * kéményseprő nem tartozik a lap tetejére.
 */

const SZIN: Record<Allapot, Allapotszin> = {
  varakozik: "figyelem",
  idopont_gond: "gond",
  itthon_lesz: "rendben",
  kulccsal: "rendben",
  lemondva: "semleges",
  elmult: "semleges",
};

const CIMKE: Record<Allapot, string> = {
  varakozik: "teendo.kozeli",
  idopont_gond: "latogatas.valasz.nem_jo_idopont",
  itthon_lesz: "latogatas.valasz.itthon_leszek",
  kulccsal: "latogatas.valasz.kulccsal_beengedheto",
  lemondva: "latogatas.allapot.lemondva",
  elmult: "latogatas.allapot.elmult",
};

export function Latogatasok({
  latogatasok,
  jogviszonyok,
  nyelv,
  berloId,
  felhasznaloId,
  ma,
}: {
  latogatasok: LatogatasNezet[];
  jogviszonyok: { ertek: string; cimke: string }[];
  nyelv: Nyelv;
  /** A belépett bérlő azonosítója, vagy null, ha bérbeadó nézi. */
  berloId: string | null;
  /** A belépett fél azonosítója, szereptől függetlenül: a lemondás ebből dől el. */
  felhasznaloId: string;
  ma: Date;
}) {
  const { sz } = szovegekNyelvvel(nyelv);
  const rendezett = latogatasokatRendez(latogatasok, ma);

  const lezart = (latogatas: LatogatasNezet) => {
    const mostani = allapot(latogatas, ma);
    return mostani === "lemondva" || mostani === "elmult";
  };
  const elol = rendezett.filter((latogatas) => !lezart(latogatas));
  const hatul = rendezett.filter(lezart);

  const urlapCimkek = {
    berlemeny: sz("latogatas.urlap.berlemeny"),
    fajta: sz("latogatas.urlap.fajta"),
    megnevezes: sz("latogatas.urlap.megnevezes"),
    megnevezesHelyorzo: sz("latogatas.urlap.megnevezes_helyorzo"),
    szolgaltato: sz("latogatas.urlap.szolgaltato"),
    nap: sz("latogatas.urlap.nap"),
    idoablak: sz("latogatas.urlap.idoablak"),
    idoablakSugo: sz("latogatas.urlap.idoablak_sugo"),
    megjegyzes: sz("latogatas.urlap.megjegyzes"),
    mentes: sz("latogatas.urlap.mentes"),
    mentesFolyamatban: sz("latogatas.urlap.mentes_folyamatban"),
  };

  return (
    <div className="grid gap-5">
      <Lapfej cim={sz("latogatas.cim")} alcim={sz("latogatas.alcim")} />

      <Sugo cim={sz("latogatas.sugo.cim")}>
        <p>{sz("latogatas.sugo.mirol")}</p>
        <p>{sz("latogatas.sugo.ketoldali")}</p>
      </Sugo>

      <section>
        <Szakaszcim>{sz("latogatas.cim")}</Szakaszcim>
        {elol.length > 0 ? (
          <ul className="grid gap-3">
            {elol.map((latogatas) => (
              <Kartya
                key={latogatas.id}
                latogatas={latogatas}
                nyelv={nyelv}
                berloId={berloId}
                felhasznaloId={felhasznaloId}
                ma={ma}
              />
            ))}
          </ul>
        ) : (
          <Ures>{sz("latogatas.nincs")}</Ures>
        )}
      </section>

      {hatul.length > 0 ? (
        <details className="group">
          <summary className={`${NYITO} font-bold`}>
            <span className="font-display text-base">
              {sz("latogatas.kesobbi")}
            </span>
            <span className="ml-2 text-sm font-medium text-halvany">
              ({hatul.length})
            </span>
          </summary>
          <ul className="mt-2 grid gap-3">
            {hatul.map((latogatas) => (
              <Kartya
                key={latogatas.id}
                latogatas={latogatas}
                nyelv={nyelv}
                berloId={berloId}
                felhasznaloId={felhasznaloId}
                ma={ma}
              />
            ))}
          </ul>
        </details>
      ) : null}

      {jogviszonyok.length > 0 ? (
        <details className="group">
          <summary className={`${NYITO} font-bold`}>
            <span className="font-display text-base">{sz("latogatas.uj")}</span>
          </summary>
          <div className="mt-2">
            <Bejelentes
              jogviszonyok={jogviszonyok}
              fajtak={FAJTAK.map((fajta) => ({
                ertek: fajta,
                cimke: sz(`latogatas.fajta.${fajta}`),
              }))}
              mai={napEleje(ma).toISOString().slice(0, 10)}
              cimkek={urlapCimkek}
            />
          </div>
        </details>
      ) : null}
    </div>
  );
}

function Kartya({
  latogatas,
  nyelv,
  berloId,
  felhasznaloId,
  ma,
}: {
  latogatas: LatogatasNezet;
  nyelv: Nyelv;
  berloId: string | null;
  felhasznaloId: string;
  ma: Date;
}) {
  const { sz, u } = szovegekNyelvvel(nyelv);
  const mostani = allapot(latogatas, ma);
  const ablak = idoablak(latogatas);
  const sajatValasz = berloId
    ? latogatas.valaszok.find((sor) => sor.berloId === berloId)
    : undefined;
  const lezart = mostani === "lemondva" || mostani === "elmult";

  return (
    <li className="rounded-kartya border border-keret bg-felulet p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Jelzo allapot={SZIN[mostani]}>{sz(CIMKE[mostani])}</Jelzo>
        <span className="szam text-xs text-halvany">
          {datumNyelven(latogatas.nap, nyelv)}
          {ablak ? ` · ${u(ablak)}` : ""}
        </span>
      </div>

      <p className="mt-1.5 leading-snug font-semibold text-pretty">
        {latogatas.megnevezes}
      </p>
      <p className="text-sm text-halvany">
        {sz(`latogatas.fajta.${latogatas.fajta}`)}
        {latogatas.szolgaltato ? ` · ${latogatas.szolgaltato}` : ""}
      </p>

      <p className="mt-2 text-sm leading-snug text-pretty">
        {u(allapotMondata(latogatas, ma))}
      </p>

      {latogatas.lemondva && latogatas.lemondasOka ? (
        <p className="mt-1 text-sm text-halvany">
          {sz("latogatas.lemondva_mert", { oka: latogatas.lemondasOka })}
        </p>
      ) : null}

      {latogatas.megjegyzes ? (
        <p className="mt-1 text-sm text-halvany text-pretty">
          {latogatas.megjegyzes}
        </p>
      ) : null}

      {/* A kifogás indoklása a másik fél egyetlen kiindulópontja: ez nem
          rejtőzhet el egy megnyitandó szakaszban. */}
      {latogatas.valaszok
        .filter((sor) => sor.valasz === "nem_jo_idopont" && sor.indoklas)
        .map((sor) => (
          <p key={sor.berloId} className="mt-1 text-sm text-gond text-pretty">
            {sor.berloNeve}: {sor.indoklas}
          </p>
        ))}

      <p className="mt-2 text-xs text-nagyon-halvany">
        {sz("latogatas.bejelento", { nev: latogatas.bejelentoNev })}
      </p>

      {latogatas.fiokNelkuliBerlok.length > 0 && !lezart ? (
        <p className="mt-1 text-xs text-nagyon-halvany text-pretty">
          {sz("latogatas.fiok_nelkul", {
            nev: latogatas.fiokNelkuliBerlok.join(", "),
          })}
        </p>
      ) : null}

      {berloId && !lezart ? (
        <Valaszurlap
          latogatasId={latogatas.id}
          valasztott={sajatValasz?.valasz ?? null}
          valaszok={VALASZOK.map((valasz) => ({
            ertek: valasz,
            cimke: sz(`latogatas.valasz.${valasz}`),
          }))}
          cimkek={{
            kerdes: sz("latogatas.valaszolj"),
            indoklasSugo: sz("latogatas.urlap.valasz_indoklas"),
            mentes: sz("latogatas.urlap.valasz_mentes"),
            mentesFolyamatban: sz("latogatas.urlap.valasz_folyamatban"),
          }}
        />
      ) : null}

      {!lezart && lemondhatja(latogatas, felhasznaloId) ? (
        <Lemondas
          latogatasId={latogatas.id}
          cimkek={{
            lemondas: sz("latogatas.lemondas"),
            lemondasFolyamatban: sz("latogatas.lemondas_folyamatban"),
            oka: sz("latogatas.lemondas_oka"),
          }}
        />
      ) : null}
    </li>
  );
}
