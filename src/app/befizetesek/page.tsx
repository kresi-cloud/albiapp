import Link from "next/link";
import { Allapotjelzo } from "@/components/Allapotjelzo";
import { csoportositva } from "@/domain/egyeztetes";
import type { Nyelv, Szovegezo, Uzenet } from "@/domain/nyelv";
import type { JogviszonyNezet } from "@/lib/lekerdezesek";
import { datumNyelven, forintNyelven } from "@/domain/nyelv";
import { egyeztetesBeallitasok, jogviszonyNezetek } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { meretSzoveg } from "@/domain/bizonylat";
import { bizonylatokTetelekhez } from "@/lib/bizonylat";
import { Bizonylatok } from "@/app/bizonylatok/Urlapok";
import { Beerkezes, BeerkezestVisszavon, NemErkezett } from "./Urlapok";

export const dynamic = "force-dynamic";

export default async function Befizetesek() {
  const berbeado = await kotelezoSzerep("berbeado");

  const { sz, u , nyelv } = await szovegek();
  const ft = (osszegFt: number) => forintNyelven(osszegFt, nyelv);
  const nap = (ertek: Date) => datumNyelven(ertek, nyelv);
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
      feltoltve: nap(sor.feltoltve),
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

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">{sz("befizetesek.cim")}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">{sz("befizetesek.bevezeto")}</p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {sz("befizetesek.bizonylat_szabaly")}
        </p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {sz("befizetesek.ablak", {
            elotte: beallitasok.korabbiAblakNap,
            utana: beallitasok.kesobbiAblakNap,
          })}{" "}
          <Link href="/beallitasok" className="underline underline-offset-2">
            {sz("befizetesek.ablak_atallitom")}
          </Link>
        </p>
      </section>


      {nezetek.map((nezet) => {
        // Egy-két év alatt száz fölötti tétel gyűlik össze. Ha mind egyforma
        // súllyal áll a lapon, telefonon percekig kell görgetni ahhoz az
        // egyhez, amivel tényleg dolga van. Amivel már nincs, az nem tűnik el:
        // összecsukva, darabszámmal áll ott.
        const { soronVan, rendezett } = csoportositva(nezet.egyeztetesek, "berbeado");

        // Amihez bizonylatot töltöttek fel, az akkor is teljes kártyát kap, ha
        // a vita közben rendeződött: egy fájlt nem tüntetünk el csendben.
        const bizonylatos = rendezett.filter(
          (sor) => sor.eloirtTetelId && bizonylatSorai(sor.eloirtTetelId).length > 0,
        );
        const csendes = rendezett.filter((sor) => !bizonylatos.includes(sor));

        return (
          <section key={nezet.id} className="grid gap-3">
            <div>
              <h2 className="font-semibold">{nezet.ingatlanMegnevezes}</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {nezet.berlokNeve} · {sz("kozos.havi_dij", { osszeg: ft(nezet.berletiDijFt) })}
              </p>
            </div>

            {nezet.egyeztetesek.length === 0 ? (
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {sz("befizetesek.nincs_tetel")}
              </p>
            ) : null}

            {soronVan.length === 0 && nezet.egyeztetesek.length > 0 ? (
              <p className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                {sz("lista.nincs_teendo")}
              </p>
            ) : null}

            {soronVan.length > 0 ? (
              <ul className="grid gap-2">
                {soronVan.map((sor) => (
                  <Kartya
                    key={kulcs(sor)}
                    sor={sor}
                    nezetId={nezet.id}
                    sz={sz}
                    u={u}
                    nyelv={nyelv}
                    bizonylatSorai={bizonylatSorai}
                    bizonylatCimkek={BIZONYLAT_CIMKEK}
                  />
                ))}
              </ul>
            ) : null}

            {bizonylatos.length > 0 ? (
              <details className="rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                <summary className="cursor-pointer p-3 text-sm font-medium">
                  {sz("lista.rendezett_bizonylattal", { darab: bizonylatos.length })}
                </summary>
                <ul className="grid gap-2 p-3 pt-0">
                  {bizonylatos.map((sor) => (
                    <Kartya
                      key={kulcs(sor)}
                      sor={sor}
                      nezetId={nezet.id}
                      sz={sz}
                      u={u}
                      nyelv={nyelv}
                      bizonylatSorai={bizonylatSorai}
                      bizonylatCimkek={BIZONYLAT_CIMKEK}
                    />
                  ))}
                </ul>
              </details>
            ) : null}

            {csendes.length > 0 ? (
              <details className="rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                <summary className="cursor-pointer p-3 text-sm font-medium">
                  {sz("lista.rendezett", { darab: csendes.length })}
                </summary>
                <ul className="grid gap-2 p-3 pt-0">
                  {csendes.map((sor) => (
                    <RovidSor key={kulcs(sor)} sor={sor} sz={sz} u={u} nyelv={nyelv} />
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

type Sor = JogviszonyNezet["egyeztetesek"][number];
type Forditas = (ertek: Uzenet) => string;
type Szoveg = Szovegezo["sz"];
/** A nyelvet is leadjuk, mert a formázás és az összecsukott kártyák is azzal mennek. */
type BizonylatCimkek = Parameters<typeof Bizonylatok>[0]["cimkek"];
type BizonylatSorok = Parameters<typeof Bizonylatok>[0]["meglevok"];

/** A React-kulcs: egy tételhez legfeljebb egy beérkezés tartozik. */
function kulcs(sor: Sor): string {
  return `${sor.eloirtTetelId ?? "nincs"}-${sor.berbeadoiIgazolasId ?? "nincs"}`;
}

/**
 * A teljes kártya: minden adat és minden művelet. Azok a tételek kapják, amikkel
 * a bérbeadónak tényleg dolga van, és azok, amikhez bizonylat tartozik.
 */
function Kartya({
  sor,
  nezetId,
  sz,
  u,
  nyelv,
  bizonylatSorai,
  bizonylatCimkek,
}: {
  sor: Sor;
  nezetId: string;
  sz: Szoveg;
  u: Forditas;
  nyelv: Nyelv;
  bizonylatSorai: (eloirtTetelId: string) => BizonylatSorok;
  bizonylatCimkek: BizonylatCimkek;
}) {
  const ft = (osszegFt: number) => forintNyelven(osszegFt, nyelv);
  const nap = (ertek: Date) => datumNyelven(ertek, nyelv);

  return (
    <li className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">
          {sor.idoszak ?? sz("befizetesek.nincs_eloiras")}
          {sor.osszegFt > 0 ? ` · ${ft(sor.osszegFt)}` : ""}
        </span>
        <Allapotjelzo allapot={sor.allapot} nyelv={nyelv} />
      </div>

      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{u(sor.magyarazat)}</p>
      {sor.reszletezes ? (
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{u(sor.reszletezes)}</p>
      ) : null}

      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <Reszlet
          cimke={sz("befizetesek.oszlop.eloiras")}
          ertek={sor.eloirtTetelId ? `${ft(sor.osszegFt)} · ${nap(sor.esedekesseg)}` : "—"}
        />
        <Reszlet
          cimke={sz("befizetesek.oszlop.berlo")}
          ertek={
            sor.igazolasOsszegFt !== null && sor.igazolasDatuma
              ? `${ft(sor.igazolasOsszegFt)} · ${nap(sor.igazolasDatuma)}`
              : "—"
          }
        />
        <Reszlet
          cimke={sz("befizetesek.oszlop.berbeado")}
          ertek={
            sor.berbeadoiOsszegFt !== null && sor.berbeadoiDatuma
              ? `${ft(sor.berbeadoiOsszegFt)} · ${nap(sor.berbeadoiDatuma)}`
              : sor.elteresOka === "nem_erkezett_meg"
                ? sz("befizetesek.nem_erkezett_ertek")
                : "—"
          }
        />
      </dl>

      {sor.bizonylatKell ? (
        <p className="mt-3 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          {sz("befizetesek.vita_magyarazat")}
        </p>
      ) : null}

      {sor.eloirtTetelId &&
      (sor.bizonylatKell || bizonylatSorai(sor.eloirtTetelId).length > 0) ? (
        <Bizonylatok
          eloirtTetelId={sor.eloirtTetelId}
          sajatOldal="fogado"
          meglevok={bizonylatSorai(sor.eloirtTetelId)}
          kerheto={sor.bizonylatKell}
          cimkek={bizonylatCimkek}
        />
      ) : null}

      {sor.berbeadoiOsszegFt === null ? (
        <>
          <Beerkezes
            jogviszonyId={nezetId}
            eloirtTetelId={sor.eloirtTetelId}
            osszegFt={sor.osszegFt}
            esedekesseg={napSzoveg(sor.esedekesseg)}
            cimkek={beerkezesCimkek(sz)}
          />
          {sor.eloirtTetelId && sor.elteresOka !== "nem_erkezett_meg" ? (
            <NemErkezett
              eloirtTetelId={sor.eloirtTetelId}
              cimke={sz("beerkezes.nem")}
            />
          ) : null}
        </>
      ) : sor.berbeadoiIgazolasId ? (
        <BeerkezestVisszavon
          igazolasId={sor.berbeadoiIgazolasId}
          cimke={sz("beerkezes.visszavon")}
        />
      ) : null}
    </li>
  );
}

/**
 * A rendezett tétel rövid sora. Az adat ugyanaz, csak nem kap három hasábot és
 * két űrlapot: amit már nem kell csinálni, azt nem kell nagyban mutatni. A
 * javítás útja megmarad, mert egy téves rögzítés később is kiderülhet.
 */
function RovidSor({
  sor,
  sz,
  u,
  nyelv,
}: {
  sor: Sor;
  sz: Szoveg;
  u: Forditas;
  nyelv: Nyelv;
}) {
  const ft = (osszegFt: number) => forintNyelven(osszegFt, nyelv);

  return (
    <li className="rounded border border-stone-200 p-3 text-sm dark:border-stone-800">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">
          {sor.idoszak ?? sz("befizetesek.nincs_eloiras")}
          {sor.osszegFt > 0 ? ` · ${ft(sor.osszegFt)}` : ""}
        </span>
        <Allapotjelzo allapot={sor.allapot} nyelv={nyelv} />
      </div>
      <p className="mt-1 text-stone-600 dark:text-stone-400">{u(sor.magyarazat)}</p>
      {sor.berbeadoiIgazolasId ? (
        <BeerkezestVisszavon
          igazolasId={sor.berbeadoiIgazolasId}
          cimke={sz("beerkezes.visszavon")}
        />
      ) : null}
    </li>
  );
}

function beerkezesCimkek(sz: Szoveg) {
  return {
    nyito: sz("beerkezes.nyito"),
    datum: sz("beerkezes.datum"),
    osszeg: sz("beerkezes.osszeg"),
    kozlemeny: sz("beerkezes.kozlemeny"),
    gomb: sz("beerkezes.gomb"),
    nem: sz("beerkezes.nem"),
    visszavon: sz("beerkezes.visszavon"),
  };
}

function napSzoveg(nap: Date): string {
  return nap.toISOString().slice(0, 10);
}

function Reszlet({ cimke, ertek }: { cimke: string; ertek: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {cimke}
      </dt>
      <dd className="tabular-nums">{ertek}</dd>
    </div>
  );
}
