import Link from "next/link";
import { Teendolista } from "@/components/Teendolista";
import { TeendoLezaras } from "@/components/TeendoLezaras";
import { TeendoUrlap, type JogviszonyValasztek } from "@/components/TeendoUrlap";
import { Naptar, napKulcs } from "@/components/Naptar";
import { Lapfej, NYITO, Sugo, Szakaszcim, Ures } from "@/components/ui/alap";
import {
  idoszakElsoNapja,
  idoszakNapbol,
  naptarHonap,
} from "@/domain/naptar";
import { datumNyelven, type Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { napEleje } from "@/domain/penz";
import type { Teendo, TeendoSurgosseggel } from "@/domain/teendok";

/**
 * A teendők lapja, mindkét szerepnek ugyanaz.
 *
 * Azért közös, mert a bérlő és a bérbeadó teendője ugyanaz a fogalom: csak a
 * forrásuk más, és azt a lekérdezés dönti el, nem a megjelenítés. Két külön lap
 * ugyanezt a viselkedést még egyszer leírná, és a második előbb-utóbb elmaradna
 * az elsőtől — ugyanaz az ok, amiért a záradék is a szerződés táblájában él.
 *
 * A lap két kérdésre felel. A naptár arra, hogy *mikor*; a lista arra, hogy
 * *mi*. Ha a naptárban kiválasztanak egy napot, a lista arra az egy napra szűkül
 * — nem a teljes lista fölé kerül egy nyolcadik szakasz, mert a laphossz
 * telefonon a legszűkösebb erőforrás.
 */
export function Teendolap({
  teendok,
  lezartak,
  jogviszonyok,
  nyelv,
  utvonal,
  honapParam,
  napParam,
  ma,
}: {
  teendok: TeendoSurgosseggel[];
  lezartak: Teendo[];
  jogviszonyok: JogviszonyValasztek[];
  nyelv: Nyelv;
  /** A lap saját útvonala: a naptár hivatkozásai ide mutatnak vissza. */
  utvonal: string;
  honapParam: string | null;
  napParam: string | null;
  ma: Date;
}) {
  const { sz } = szovegekNyelvvel(nyelv);

  const valasztottNap = napParam && idoszakElsoNapja(napParam.slice(0, 7))
    ? new Date(`${napParam}T00:00:00.000Z`)
    : null;
  const ervenyesNap =
    valasztottNap && !Number.isNaN(valasztottNap.getTime()) ? valasztottNap : null;

  // A nap dönti el, melyik hónap látszik: aki egy napra kattintott, ne
  // egy másik hónap rácsát kapja vissza.
  const idoszak = ervenyesNap
    ? idoszakNapbol(ervenyesNap)
    : (honapParam ?? idoszakNapbol(napEleje(ma)));

  const honap = naptarHonap(teendok, idoszak, ma);

  const napiTeendok = ervenyesNap
    ? teendok.filter(
        (teendo) =>
          napEleje(teendo.esedekesseg).getTime() === ervenyesNap.getTime(),
      )
    : [];

  const kozeliek = teendok.filter((teendo) => teendo.surgosseg !== "kesobbi");
  const kesobbiek = teendok.filter((teendo) => teendo.surgosseg === "kesobbi");

  return (
    <div className="grid gap-5">
      <Lapfej cim={sz("teendok.cim")} alcim={sz("teendok.alcim")} />

      <Sugo cim={sz("teendok.sugo.cim")}>
        <p>{sz("teendok.sugo.szarmaztatott")}</p>
        <p>{sz("teendok.sugo.sajat")}</p>
      </Sugo>

      <Naptar
        honap={honap}
        nyelv={nyelv}
        utvonal={utvonal}
        valasztottNap={ervenyesNap ? napKulcs(ervenyesNap) : null}
      />

      {ervenyesNap ? (
        <section>
          <Szakaszcim
            mellette={
              <Link href={utvonal} className="font-semibold text-kiemelt hover:underline">
                {sz("teendok.mind")}
              </Link>
            }
          >
            {datumNyelven(ervenyesNap, nyelv)}
          </Szakaszcim>
          {napiTeendok.length > 0 ? (
            <Teendolista teendok={napiTeendok} nyelv={nyelv} />
          ) : (
            <Ures>{sz("teendok.nap_ures")}</Ures>
          )}
        </section>
      ) : (
        <>
          <section>
            <Szakaszcim>{sz("teendok.most")}</Szakaszcim>
            <Teendolista teendok={kozeliek} nyelv={nyelv} />
          </section>

          {kesobbiek.length > 0 ? (
            <Osszecsukott cim={sz("teendok.kesobb")} darab={kesobbiek.length}>
              <Teendolista teendok={kesobbiek} nyelv={nyelv} />
            </Osszecsukott>
          ) : null}
        </>
      )}

      {lezartak.length > 0 ? (
        <Osszecsukott cim={sz("teendok.lezart")} darab={lezartak.length}>
          <Lezartlista lezartak={lezartak} nyelv={nyelv} />
        </Osszecsukott>
      ) : null}

      <Osszecsukott cim={sz("teendok.uj")}>
        <TeendoUrlap
          jogviszonyok={jogviszonyok}
          mai={napKulcs(napEleje(ma))}
          cimkek={{
            cim: sz("teendok.urlap.cim"),
            cimHelyorzo: sz("teendok.urlap.cim_helyorzo"),
            leiras: sz("teendok.urlap.leiras"),
            leirasSugo: sz("teendok.urlap.leiras_sugo"),
            esedekesseg: sz("teendok.urlap.esedekesseg"),
            berlemeny: sz("teendok.urlap.berlemeny"),
            berlemenyNelkul: sz("teendok.urlap.berlemeny_nelkul"),
            mentes: sz("teendok.urlap.mentes"),
            mentesFolyamatban: sz("teendok.urlap.mentes_folyamatban"),
          }}
        />
      </Osszecsukott>
    </div>
  );
}

/** Összecsukott szakasz: a nyitósor kiírja, hány tétel van mögötte. */
function Osszecsukott({
  cim,
  darab,
  children,
}: {
  cim: string;
  darab?: number;
  children: React.ReactNode;
}) {
  return (
    <details className="group">
      <summary className={`${NYITO} font-bold`}>
        <span className="font-display text-base">{cim}</span>
        {darab !== undefined ? (
          <span className="ml-2 text-sm font-medium text-halvany">({darab})</span>
        ) : null}
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

/**
 * A lezárt teendők.
 *
 * Nincs rajtuk sürgősség: egy lezárt teendő nem lehet „lejárt", és a piros
 * sáv csak azt sugallná, hogy még dolog van vele. Ami rajtuk van, az a
 * visszavonás — egy elkattintott „kész" máskülönben csendben eltüntetné, amit
 * valaki vállalt.
 */
function Lezartlista({
  lezartak,
  nyelv,
}: {
  lezartak: Teendo[];
  nyelv: Nyelv;
}) {
  const { sz, u } = szovegekNyelvvel(nyelv);

  return (
    <ul className="grid gap-2">
      {lezartak.map((teendo) => (
        <li
          key={teendo.kulcs}
          className="rounded-kartya border border-keret bg-felulet-halk p-3"
        >
          <p className="leading-snug font-medium text-halvany line-through">
            {u(teendo.cim)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="szam text-xs text-nagyon-halvany">
              {datumNyelven(teendo.esedekesseg, nyelv)}
            </span>
            <TeendoLezaras
              kulcs={teendo.kulcs}
              cimke={sz("teendo.ujranyitas")}
              folyamatbanCimke={sz("teendo.ujranyitom")}
              muvelet="ujranyit"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
