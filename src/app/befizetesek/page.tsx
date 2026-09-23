import Link from "next/link";
import { Allapotjelzo } from "@/components/Allapotjelzo";
import { csoportositva } from "@/domain/egyeztetes";
import type { Nyelv, Uzenet } from "@/domain/nyelv";
import type { JogviszonyNezet } from "@/lib/lekerdezesek";
import { datumNyelven, forintNyelven, honapNyelven } from "@/domain/nyelv";
import { egyeztetesBeallitasok, jogviszonyNezetek } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { meretSzoveg } from "@/domain/bizonylat";
import { bizonylatokTetelekhez } from "@/lib/bizonylat";
import { Bizonylatok } from "@/app/bizonylatok/Urlapok";
import { Lapfej, Osszeg, Sugo, Szakaszcim } from "@/components/ui/alap";
import { IkonNyil } from "@/components/ui/ikonok";
import { Beerkezes, BeerkezestVisszavon, NemErkezett } from "./Urlapok";

export const dynamic = "force-dynamic";

export default async function Befizetesek() {
  const berbeado = await kotelezoSzerep("berbeado");

  const { nyelv, sz, u } = await szovegek();
  const nezetek = await jogviszonyNezetek(berbeado.id);
  const beallitasok = await egyeztetesBeallitasok(berbeado.id);

  // Minden előírás bizonylatait betöltjük, nem csak a vitásakét: ha a
  // bizonylatkérés ki van kapcsolva, vagy a vita rendeződött, a már feltöltött
  // fájl akkor se tűnjön el csendben.
  const bizonylatok = await bizonylatokTetelekhez(
    nezetek.flatMap((nezet) =>
      nezet.egyeztetesek
        .filter((sor) => sor.eloirtTetelId)
        .map((sor) => sor.eloirtTetelId as string),
    ),
    berbeado.id,
  );

  const bizonylatSorai = (eloirtTetelId: string) =>
    (bizonylatok.get(eloirtTetelId) ?? []).map((sor) => ({
      id: sor.id,
      oldal: sor.oldal,
      cimke: sz(`bizonylat.${sor.oldal}`),
      meret: u(meretSzoveg(sor.meretBajt)),
      feltoltve: datumNyelven(sor.feltoltve, nyelv),
      sajat: sor.sajat,
    }));

  const BIZONYLAT_CIMKEK = {
    cim: sz("bizonylat.cim"),
    feltolt: sz("bizonylat.feltolt"),
    gomb: sz("bizonylat.gomb"),
    sugo: sz("bizonylat.sugo", { max: 5 }),
    torles: sz("bizonylat.torles"),
    letoltes: sz("bizonylat.letoltes"),
    nincs: sz("bizonylat.nincs"),
    varunkRad: sz("bizonylat.varunk_rad"),
    kikapcsolva: sz("bizonylat.kikapcsolva"),
    sajatOldal: sz("bizonylat.fogado"),
    masikOldal: sz("bizonylat.kuldo"),
  };

  const BEERKEZES_CIMKEK = {
    nyito: sz("befizetesek.beerkezes_nyito"),
    datum: sz("befizetesek.beerkezes_datum"),
    osszeg: sz("befizetesek.beerkezes_osszeg"),
    kozlemeny: sz("befizetesek.beerkezes_kozlemeny"),
    gomb: sz("befizetesek.beerkezes_gomb"),
    nem: sz("befizetesek.nem_erkezett_gomb"),
    visszavon: sz("befizetesek.visszavon"),
  };

  const cimkek: Cimkek = {
    nyelv,
    u,
    nincsEloiras: sz("befizetesek.nincs_eloiras"),
    eloiras: sz("befizetesek.eloiras"),
    berloSzerint: sz("befizetesek.berlo_szerint"),
    nalad: sz("befizetesek.nalad"),
    nemErkezett: sz("befizetesek.nem_erkezett"),
    nincsAdat: sz("befizetesek.nincs_adat"),
    bizonylatMagyarazat: sz("befizetesek.vita_bizonylat"),
    visszavon: sz("befizetesek.visszavon"),
    nemErkezettGomb: sz("befizetesek.nem_erkezett_gomb"),
    beerkezes: BEERKEZES_CIMKEK,
    bizonylat: BIZONYLAT_CIMKEK,
    bizonylatSorai,
  };

  // Ami lezárult és nincs rajta rendezetlen tétel, az hátra kerül. A lezárás
  // önmagában nem elég: a kiköltözés nem fizeti ki a tartozást, és egy
  // elmaradt havi díj nem tűnhet el egy összecsukott szakasz mögé.
  const rendezetlen = (nezet: JogviszonyNezet) =>
    csoportositva(nezet.egyeztetesek, "berbeado").soronVan.length > 0;
  const elol = nezetek.filter((nezet) => !nezet.lezart || rendezetlen(nezet));
  const hatul = nezetek.filter((nezet) => nezet.lezart && !rendezetlen(nezet));

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <Lapfej cim={sz("befizetesek.cim")} alcim={sz("befizetesek.alcim")} />

        {/*
          A magyarázat összecsukva.

          Három bekezdés állt itt kinyitva minden egyes megnyitáskor — a telefon
          képernyőjének a fele —, holott az első használat után senki nem olvassa
          el újra. Az elv viszont fontos, és nem tűnhet el: a bérlő különben
          joggal hinné, hogy előbb-utóbb mégis kérünk bankszámlakivonatot. Ezért
          egy sorban áll, és aki kíváncsi rá, kinyitja.
        */}
        <Sugo cim={sz("befizetesek.sugo_cim")}>
          <p>{sz("befizetesek.sugo_harom")}</p>
          <p>{sz("befizetesek.sugo_bizonylat")}</p>
          <p>
            {sz("befizetesek.ablak", {
              elotte: beallitasok.korabbiAblakNap,
              utana: beallitasok.kesobbiAblakNap,
            })}{" "}
            <Link
              href="/beallitasok"
              className="font-semibold text-kiemelt hover:underline"
            >
              {sz("befizetesek.ablak_allit")}
            </Link>
          </p>
        </Sugo>
      </div>

      {elol.map(berlet)}

      {/*
        A lezárt bérletek egy közös, összecsukott csokorban.

        Egy bérbeadónál a bérletek nem fogynak, csak gyűlnek: öt év alatt öt
        kiköltözött bérlő öt szakaszfejlécet és öt „nincs teendő" sávot hagyna
        a lapon, örökre. Ami lezárult és el is van rendezve, az mögé kerül;
        amin még van rendezetlen tétel, az elöl marad, mert a kiköltözés nem
        fizeti ki a tartozást.
      */}
      {hatul.length > 0 ? (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-base font-bold tracking-tight">
            <span className="font-display">
              {sz("befizetesek.lezart_berletek")}
            </span>
            <span className="text-sm font-medium text-halvany">
              ({hatul.length})
            </span>
            <IkonNyil
              meret={16}
              osztaly="text-nagyon-halvany rotate-90 transition-transform group-open:-rotate-90"
            />
          </summary>
          <div className="mt-2 grid gap-6">{hatul.map(berlet)}</div>
        </details>
      ) : null}
    </div>
  );

  function berlet(nezet: JogviszonyNezet) {
    // Egy-két év alatt száz fölötti tétel gyűlik össze. Ha mind egyforma
    // súllyal áll a lapon, telefonon percekig kell görgetni ahhoz az
    // egyhez, amivel tényleg dolga van. Amivel már nincs, az nem tűnik el:
    // összecsukva, darabszámmal áll ott.
    const { soronVan, rendezett } = csoportositva(
      nezet.egyeztetesek,
      "berbeado",
    );

    // Amihez bizonylatot töltöttek fel, az akkor is teljes kártyát kap, ha
    // a vita közben rendeződött: egy fájlt nem tüntetünk el csendben.
    const bizonylatos = rendezett.filter(
      (sor) =>
        sor.eloirtTetelId && bizonylatSorai(sor.eloirtTetelId).length > 0,
    );
    const csendes = rendezett.filter((sor) => !bizonylatos.includes(sor));

    return (
      <section key={nezet.id} className="grid gap-2">
        <Szakaszcim
          mellette={sz("befizetesek.havi_dij", {
            osszeg: forintNyelven(nezet.berletiDijFt, nyelv),
          })}
        >
          {nezet.ingatlanMegnevezes}
        </Szakaszcim>
        <p className="-mt-2 text-sm text-halvany">{nezet.berlokNeve}</p>

        {nezet.egyeztetesek.length === 0 ? (
          <p className="text-sm text-halvany">
            {sz("befizetesek.nincs_tetel")}
          </p>
        ) : null}

        {soronVan.length === 0 && nezet.egyeztetesek.length > 0 ? (
          <p className="rounded-kartya border border-rendben-keret bg-rendben-lap p-3 text-sm font-medium text-rendben">
            {sz("lista.nincs_teendo")}
          </p>
        ) : null}

        {soronVan.length > 0 ? (
          <ul className="grid gap-2">
            {soronVan.map((sor) => (
              <Tetel
                key={kulcs(sor)}
                sor={sor}
                nezetId={nezet.id}
                cimkek={cimkek}
              />
            ))}
          </ul>
        ) : null}

        {bizonylatos.length > 0 ? (
          <Osszecsukott
            cim={sz("lista.rendezett_bizonylattal", {
              darab: bizonylatos.length,
            })}
          >
            {bizonylatos.map((sor) => (
              <Tetel
                key={kulcs(sor)}
                sor={sor}
                nezetId={nezet.id}
                cimkek={cimkek}
              />
            ))}
          </Osszecsukott>
        ) : null}

        {csendes.length > 0 ? (
          <Osszecsukott cim={sz("lista.rendezett", { darab: csendes.length })}>
            {csendes.map((sor) => (
              <RovidSor key={kulcs(sor)} sor={sor} cimkek={cimkek} />
            ))}
          </Osszecsukott>
        ) : null}
      </section>
    );
  }
}

type Sor = JogviszonyNezet["egyeztetesek"][number];
type Forditas = (ertek: Uzenet) => string;
type BizonylatCimkek = Parameters<typeof Bizonylatok>[0]["cimkek"];
type BizonylatSorok = Parameters<typeof Bizonylatok>[0]["meglevok"];

/** Amit a lap a kártyáinak lead: minden szöveg kulcsból, egy helyen feloldva. */
type Cimkek = {
  nyelv: Nyelv;
  u: Forditas;
  nincsEloiras: string;
  eloiras: string;
  berloSzerint: string;
  nalad: string;
  nemErkezett: string;
  nincsAdat: string;
  bizonylatMagyarazat: string;
  visszavon: string;
  nemErkezettGomb: string;
  beerkezes: Parameters<typeof Beerkezes>[0]["cimkek"];
  bizonylat: BizonylatCimkek;
  bizonylatSorai: (eloirtTetelId: string) => BizonylatSorok;
};

/** A React-kulcs: egy tételhez legfeljebb egy beérkezés tartozik. */
function kulcs(sor: Sor): string {
  return `${sor.eloirtTetelId ?? "nincs"}-${sor.berbeadoiIgazolasId ?? "nincs"}`;
}

/** Összecsukott lista: a nyitósor kiírja, hány tétel van mögötte. */
function Osszecsukott({
  cim,
  children,
}: {
  cim: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-kartya border border-keret bg-felulet">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-semibold text-halvany">
        <span className="min-w-0 flex-1">{cim}</span>
        <IkonNyil
          meret={16}
          osztaly="shrink-0 rotate-90 transition-transform group-open:-rotate-90"
        />
      </summary>
      <ul className="grid gap-2 p-3 pt-0">{children}</ul>
    </details>
  );
}

/**
 * A teljes kártya: minden adat és minden művelet. Azok a tételek kapják, amikkel
 * a bérbeadónak tényleg dolga van, és azok, amikhez bizonylat tartozik.
 */
function Tetel({
  sor,
  nezetId,
  cimkek,
}: {
  sor: Sor;
  nezetId: string;
  cimkek: Cimkek;
}) {
  const { nyelv, u } = cimkek;
  const bizonylatai = sor.eloirtTetelId
    ? cimkek.bizonylatSorai(sor.eloirtTetelId)
    : [];

  return (
    // A `data-*` a böngészős próbának ad nyelv- és megjelenésfüggetlen
    // fogódzót, ugyanúgy, ahogy a bizonylatblokk `data-oldal`-ja. Enélkül a
    // próba a képernyőn látható szövegre szűrt — és amint a hónap emberi
    // alakot kapott („2026. szeptember” a „2026-09” helyett), egy csomó
    // állítás elvesztette a keresett sort.
    <li
      data-idoszak={sor.idoszak ?? ""}
      data-osszeg={sor.osszegFt}
      className="rounded-kartya border border-keret bg-felulet p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-halvany">
            {sor.idoszak
              ? honapNyelven(sor.idoszak, nyelv)
              : cimkek.nincsEloiras}
          </div>
          {sor.osszegFt > 0 ? (
            <div className="mt-0.5">
              <Osszeg
                ertek={forintNyelven(sor.osszegFt, nyelv)}
                meret="kozepes"
              />
            </div>
          ) : null}
        </div>
        <Allapotjelzo allapot={sor.allapot} nyelv={nyelv} />
      </div>

      <p className="mt-2 text-sm leading-snug text-halvany text-pretty">
        {u(sor.magyarazat)}
      </p>
      {sor.reszletezes ? (
        <p className="mt-1 text-sm leading-snug text-nagyon-halvany text-pretty">
          {u(sor.reszletezes)}
        </p>
      ) : null}

      <Harmas sor={sor} cimkek={cimkek} />

      {sor.bizonylatKell ? (
        <p className="mt-3 rounded-lg border border-gond-keret bg-gond-lap p-3 text-sm leading-relaxed text-gond">
          {cimkek.bizonylatMagyarazat}
        </p>
      ) : null}

      {sor.eloirtTetelId && (sor.bizonylatKell || bizonylatai.length > 0) ? (
        <Bizonylatok
          eloirtTetelId={sor.eloirtTetelId}
          sajatOldal="fogado"
          meglevok={bizonylatai}
          kerheto={sor.bizonylatKell}
          cimkek={cimkek.bizonylat}
        />
      ) : null}

      {sor.berbeadoiOsszegFt === null ? (
        <>
          <Beerkezes
            jogviszonyId={nezetId}
            eloirtTetelId={sor.eloirtTetelId}
            osszegFt={sor.osszegFt}
            esedekesseg={napSzoveg(sor.esedekesseg)}
            cimkek={cimkek.beerkezes}
          />
          {sor.eloirtTetelId && sor.elteresOka !== "nem_erkezett_meg" ? (
            <NemErkezett
              eloirtTetelId={sor.eloirtTetelId}
              cimke={cimkek.nemErkezettGomb}
            />
          ) : null}
        </>
      ) : sor.berbeadoiIgazolasId ? (
        <BeerkezestVisszavon
          igazolasId={sor.berbeadoiIgazolasId}
          cimke={cimkek.visszavon}
        />
      ) : null}
    </li>
  );
}

/**
 * A három adat egymás alatt: mit kellett fizetni, mit mond a bérlő, mit mondasz
 * te.
 *
 * Ez a termék lényege, és eddig három névtelen hasábként állt egy `dl`-ben,
 * telefonon egymás alá törve — a három adat egymáshoz való viszonya, vagyis
 * pont az, amiért az egész funkció van, sehol nem látszott. Most egy kereten
 * belül, azonos szélességű számokkal, egymás alatt áll: így ránézésre látszik,
 * melyik kettő egyezik és melyik lóg ki. A bérbeadó saját sora kiemelt
 * háttérrel megy, mert egy vitánál először azt keresi, ő mit mondott.
 */
function Harmas({ sor, cimkek }: { sor: Sor; cimkek: Cimkek }) {
  const { nyelv } = cimkek;

  const ertek = (
    osszegFt: number | null,
    nap: Date | null,
    helyette?: string,
  ) =>
    osszegFt !== null && nap
      ? {
          osszeg: forintNyelven(osszegFt, nyelv),
          nap: datumNyelven(nap, nyelv),
        }
      : { osszeg: helyette ?? cimkek.nincsAdat, nap: null };

  return (
    <dl className="mt-3 divide-y divide-keret overflow-hidden rounded-lg border border-keret">
      <OldalSor
        cimke={cimkek.eloiras}
        {...ertek(sor.eloirtTetelId ? sor.osszegFt : null, sor.esedekesseg)}
      />
      <OldalSor
        cimke={cimkek.berloSzerint}
        {...ertek(sor.igazolasOsszegFt, sor.igazolasDatuma)}
      />
      <OldalSor
        cimke={cimkek.nalad}
        sajat
        {...ertek(
          sor.berbeadoiOsszegFt,
          sor.berbeadoiDatuma,
          sor.elteresOka === "nem_erkezett_meg"
            ? cimkek.nemErkezett
            : undefined,
        )}
      />
    </dl>
  );
}

function OldalSor({
  cimke,
  osszeg,
  nap,
  sajat = false,
}: {
  cimke: string;
  osszeg: string;
  nap: string | null;
  sajat?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2 ${
        sajat ? "bg-felulet-halk" : ""
      }`}
    >
      <dt className="text-xs font-medium text-halvany">{cimke}</dt>
      <dd className="flex items-baseline gap-2">
        <span
          className={`szam text-sm ${nap ? "font-semibold" : "text-nagyon-halvany"}`}
        >
          {osszeg}
        </span>
        {nap ? <span className="szam text-xs text-halvany">{nap}</span> : null}
      </dd>
    </div>
  );
}

/**
 * A rendezett tétel rövid sora. Az adat ugyanaz, csak nem kap három sort és
 * két űrlapot: amit már nem kell csinálni, azt nem kell nagyban mutatni. A
 * javítás útja megmarad, mert egy téves rögzítés később is kiderülhet.
 */
function RovidSor({ sor, cimkek }: { sor: Sor; cimkek: Cimkek }) {
  const { nyelv, u } = cimkek;

  return (
    <li
      data-idoszak={sor.idoszak ?? ""}
      data-osszeg={sor.osszegFt}
      className="rounded-lg border border-keret px-3 py-2.5 text-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="flex items-baseline gap-2">
          <span className="text-halvany">
            {sor.idoszak
              ? honapNyelven(sor.idoszak, nyelv)
              : cimkek.nincsEloiras}
          </span>
          {sor.osszegFt > 0 ? (
            <Osszeg ertek={forintNyelven(sor.osszegFt, nyelv)} meret="kicsi" />
          ) : null}
        </span>
        <Allapotjelzo allapot={sor.allapot} nyelv={nyelv} />
      </div>
      <p className="mt-0.5 text-halvany">{u(sor.magyarazat)}</p>
      {sor.berbeadoiIgazolasId ? (
        <BeerkezestVisszavon
          igazolasId={sor.berbeadoiIgazolasId}
          cimke={cimkek.visszavon}
        />
      ) : null}
    </li>
  );
}

function napSzoveg(nap: Date): string {
  return nap.toISOString().slice(0, 10);
}
