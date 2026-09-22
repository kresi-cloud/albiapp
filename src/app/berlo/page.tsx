import Link from "next/link";
import { Allapotjelzo } from "@/components/Allapotjelzo";
import { csoportositva } from "@/domain/egyeztetes";
import { kovetkezoHet } from "@/domain/naptar";
import { ElszamolasTetelek } from "@/components/ElszamolasTetelek";
import { Hetsav } from "@/components/Hetsav";
import { Teendolista } from "@/components/Teendolista";
import { datumNyelven, forintNyelven, honapNyelven } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { prisma } from "@/lib/db";
import { berloNezetei, berloTeendoi } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";
import { merooraUzenet } from "@/lib/rezsi";
import { ElbiralasUrlap, OraallasUrlap } from "@/app/rezsi/Urlapok";
import { meretSzoveg } from "@/domain/bizonylat";
import { bizonylatokTetelekhez } from "@/lib/bizonylat";
import { Bizonylatok } from "@/app/bizonylatok/Urlapok";
import { Lapfej, NYITO, Szakaszcim } from "@/components/ui/alap";
import { Utalas, UtalastVisszavon } from "./Urlapok";

export const dynamic = "force-dynamic";

/** A bérlő oldala: csak a saját jogviszonyai, ugyanazokkal az állapotokkal. */
export default async function BerloiNezet() {
  const berlo = await kotelezoSzerep("berlo");
  const nyelv = await aktualisNyelv();
  const { sz, u } = szovegekNyelvvel(nyelv);

  const ma = new Date();
  const [nezetek, sajatTeendok, jogviszonyok] = await Promise.all([
    berloNezetei(berlo.id, ma),
    berloTeendoi(berlo.id, ma),
    prisma.jogviszony.findMany({
      where: { berlok: { some: { berloId: berlo.id } } },
      include: {
        ingatlan: {
          include: {
            meroorak: { include: { oraallasok: { orderBy: { datum: "desc" }, take: 1 } } },
          },
        },
        elszamolasok: {
          where: { allapot: { not: "tervezet" } },
          orderBy: { idoszakVege: "desc" },
          include: { tetelek: { orderBy: { sorrend: "asc" } } },
        },
      },
      orderBy: { letrehozva: "asc" },
    }),
  ]);

  const mai = ma.toISOString().slice(0, 10);

  // Minden előírás bizonylatait betöltjük, nem csak a vitásakét: ha a
  // bérbeadó kikapcsolja a bizonylatkérést, vagy a vita rendeződik, a már
  // feltöltött fájl akkor se tűnjön el csendben.
  const bizonylatok = await bizonylatokTetelekhez(
    nezetek
      .flatMap((nezet) => nezet.egyeztetesek)
      .filter((sor) => sor.eloirtTetelId)
      .map((sor) => sor.eloirtTetelId as string),
    berlo.id,
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
    sajatOldal: sz("bizonylat.kuldo"),
    masikOldal: sz("bizonylat.fogado"),
  };
  const meroorasJogviszonyok = jogviszonyok.filter(
    (jogviszony) => jogviszony.rezsiElszamolas === "almero",
  );

  if (nezetek.length === 0) {
    return (
      <div className="grid gap-3">
        <Lapfej cim={sz("nav.berlemenyem")} alcim={sz("berlo.nincs_berlemeny")} />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Lapfej
        cim={sz("berlo.udvozles", { nev: berlo.nev })}
        alcim={nezetek
          .map((nezet) => `${nezet.ingatlanMegnevezes}, ${nezet.ingatlanCim}`)
          .join(" · ")}
      />

      {/* Ugyanaz a sáv, mint a bérbeadó áttekintőjén: a lista azt mondja meg,
          mi van hátra, a sáv azt, hogy mikor. A bérlőnek ez a fontosabb, mert
          az ő teendői jellemzően határidősek. */}
      <Hetsav het={kovetkezoHet(sajatTeendok, ma)} nyelv={nyelv} utvonal="/berlo/teendok" />

      <section>
        <Szakaszcim
          mellette={
            <Link
              href="/berlo/teendok"
              className="font-semibold text-kiemelt hover:underline"
            >
              {sz("hetsav.mind")}
            </Link>
          }
        >
          {sz("berlo.teendok")}
        </Szakaszcim>
        <Teendolista
          teendok={sajatTeendok.filter((teendo) => teendo.surgosseg !== "kesobbi")}
          nyelv={nyelv}
        />
      </section>

      {sajatTeendok.some((teendo) => teendo.surgosseg === "kesobbi") ? (
        <details className="group">
          <summary className={`${NYITO} font-bold`}>
            <span className="font-display text-base">{sz("teendok.kesobb")}</span>
            <span className="ml-2 text-sm font-medium text-halvany">
              ({sajatTeendok.filter((teendo) => teendo.surgosseg === "kesobbi").length})
            </span>
          </summary>
          <div className="mt-2">
            <Teendolista
              teendok={sajatTeendok.filter((teendo) => teendo.surgosseg === "kesobbi")}
              nyelv={nyelv}
            />
          </div>
        </details>
      ) : null}

      {meroorasJogviszonyok.map((jogviszony) => (
        <section key={`orak-${jogviszony.id}`}>
          <Szakaszcim>{sz("berlo.oraallas")}</Szakaszcim>
          <ul className="grid gap-3">
            {jogviszony.ingatlan.meroorak.map((meroora) => (
              <li
                key={meroora.id}
                className="rounded-kartya border border-keret bg-felulet p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {u(merooraUzenet(meroora.tipus, meroora.almero))}
                  </span>
                  <span className="text-sm tabular-nums text-halvany">
                    {meroora.oraallasok[0]
                      ? sz("berlo.oraallas.legutobb", {
                          ertek: meroora.oraallasok[0].ertek,
                          egyseg: meroora.mertekegyseg,
                          nap: datumNyelven(meroora.oraallasok[0].datum, nyelv),
                        })
                      : sz("berlo.oraallas.nincs")}
                  </span>
                </div>
                <OraallasUrlap
                  merooraId={meroora.id}
                  mai={mai}
                  cimkek={{
                    datum: sz("rezsi.oraallas.datum"),
                    ertek: sz("rezsi.oraallas.ertek", { egyseg: meroora.mertekegyseg }),
                    gomb: sz("rezsi.oraallas.gomb"),
                    folyamatban: sz("rezsi.oraallas.folyamatban"),
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {jogviszonyok.flatMap((jogviszony) =>
        jogviszony.elszamolasok.map((elszamolas) => (
          <section key={elszamolas.id}>
            <Szakaszcim>
              {sz("berlo.elszamolas", {
                tol: datumNyelven(elszamolas.idoszakKezdete, nyelv),
                ig: datumNyelven(elszamolas.idoszakVege, nyelv),
              })}
            </Szakaszcim>
            <div className="rounded-kartya border border-keret bg-felulet p-4">
              <p className="text-sm text-halvany">
                {elszamolas.allapot === "kiadva"
                  ? sz("berlo.elszamolas.kiadva")
                  : elszamolas.allapot === "elfogadva"
                    ? sz("berlo.elszamolas.elfogadva")
                    : sz("berlo.elszamolas.vitatott")}
              </p>
              <ElszamolasTetelek
                tetelek={elszamolas.tetelek}
                osszegFt={elszamolas.osszegFt}
                nyelv={nyelv}
              />
              {elszamolas.berloiUzenet ? (
                <p className="mt-3 text-sm text-halvany">
                  {sz("berlo.elszamolas.uzeneted", { szoveg: elszamolas.berloiUzenet })}
                </p>
              ) : null}
              {elszamolas.allapot === "kiadva" ? (
                <ElbiralasUrlap
                  elszamolasId={elszamolas.id}
                  cimkek={{
                    sugo: sz("rezsi.elbiralas.sugo"),
                    elfogad: sz("rezsi.elbiralas.elfogad"),
                    vitat: sz("rezsi.elbiralas.vitat"),
                  }}
                />
              ) : null}
            </div>
          </section>
        )),
      )}

      {nezetek.map((nezet) => {
        // Ugyanaz a gond, mint a bérbeadói oldalon: egy tanév után annyi a
        // tétel, hogy telefonon percekig kell görgetni ahhoz az egyhez, amivel
        // dolga van. Amit már mindkét fél letudott, az összecsukva áll.
        const tetelek = nezet.egyeztetesek.filter((sor) => sor.eloirtTetelId !== null);
        const { soronVan, rendezett } = csoportositva(tetelek, "berlo");
        const bizonylatos = rendezett.filter(
          (sor) => sor.eloirtTetelId && bizonylatSorai(sor.eloirtTetelId).length > 0,
        );
        const csendes = rendezett.filter((sor) => !bizonylatos.includes(sor));

        return (
          <section key={nezet.id}>
            <Szakaszcim>
              {sz("berlo.befizetesek", { berlemeny: nezet.ingatlanMegnevezes })}
            </Szakaszcim>

            {soronVan.length === 0 && tetelek.length > 0 ? (
              <p className="mb-3 rounded-lg border border-rendben-keret bg-rendben-lap p-3 text-sm text-rendben">
                {sz("lista.nincs_teendo")}
              </p>
            ) : null}

            {soronVan.length > 0 ? (
              <ul className="grid gap-2">{soronVan.map(Tetel)}</ul>
            ) : null}

            {bizonylatos.length > 0 ? (
              <details className="mt-3 rounded-kartya border border-keret bg-felulet">
                <summary className={`${NYITO} px-3`}>
                  {sz("lista.rendezett_bizonylattal", { darab: bizonylatos.length })}
                </summary>
                <ul className="grid gap-2 p-3 pt-0">{bizonylatos.map(Tetel)}</ul>
              </details>
            ) : null}

            {csendes.length > 0 ? (
              <details className="mt-3 rounded-kartya border border-keret bg-felulet">
                <summary className={`${NYITO} px-3`}>
                  {sz("lista.rendezett", { darab: csendes.length })}
                </summary>
                <ul className="grid gap-2 p-3 pt-0">{csendes.map(Tetel)}</ul>
              </details>
            ) : null}
          </section>
        );

        function Tetel(sor: (typeof tetelek)[number]) {
          return (
                    <li
                      key={sor.eloirtTetelId ?? ""}
                      data-idoszak={sor.idoszak ?? ""}
                      data-osszeg={sor.osszegFt}
                      className="rounded-kartya border border-keret bg-felulet p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">
                          {sor.idoszak ? `${honapNyelven(sor.idoszak, nyelv)} · ` : ""}
                          {forintNyelven(sor.osszegFt, nyelv)}
                        </span>
                        <Allapotjelzo allapot={sor.allapot} nyelv={nyelv} />
                      </div>
                      <p className="mt-1 text-sm text-halvany">
                        {sz("berlo.esedekesseg", {
                          nap: datumNyelven(sor.esedekesseg, nyelv),
                        })}{" "}
                        {u(sor.magyarazat)}
                      </p>
                      {sor.reszletezes ? (
                        <p className="mt-1 text-sm text-nagyon-halvany">
                          {u(sor.reszletezes)}
                        </p>
                      ) : null}

                      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-nagyon-halvany">
                            {sz("berlo.utalas.sajat")}
                          </dt>
                          <dd className="tabular-nums">
                            {sor.igazolasOsszegFt !== null && sor.igazolasDatuma
                              ? `${forintNyelven(sor.igazolasOsszegFt, nyelv)} · ${datumNyelven(sor.igazolasDatuma, nyelv)}`
                              : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-nagyon-halvany">
                            {sz("berlo.utalas.berbeado")}
                          </dt>
                          <dd className="tabular-nums">
                            {sor.berbeadoiOsszegFt !== null && sor.berbeadoiDatuma
                              ? `${forintNyelven(sor.berbeadoiOsszegFt, nyelv)} · ${datumNyelven(sor.berbeadoiDatuma, nyelv)}`
                              : sor.elteresOka === "nem_erkezett_meg"
                                ? sz("berlo.utalas.nem_erkezett")
                                : "—"}
                          </dd>
                        </div>
                      </dl>

                      {sor.bizonylatKell ? (
                        <p className="mt-3 rounded border border-gond-keret bg-gond-lap p-3 text-sm text-gond">
                          {sz("berlo.utalas.bizonylat")}
                        </p>
                      ) : null}

                      {sor.eloirtTetelId &&
                      (sor.bizonylatKell || bizonylatSorai(sor.eloirtTetelId).length > 0) ? (
                        <Bizonylatok
                          eloirtTetelId={sor.eloirtTetelId}
                          sajatOldal="kuldo"
                          meglevok={bizonylatSorai(sor.eloirtTetelId)}
                          kerheto={sor.bizonylatKell}
                          cimkek={BIZONYLAT_CIMKEK}
                        />
                      ) : null}

                      {sor.berloiIgazolasId ? (
                        <UtalastVisszavon
                          igazolasId={sor.berloiIgazolasId}
                          cimke={sz("berlo.utalas.visszavon")}
                        />
                      ) : (
                        <Utalas
                          jogviszonyId={nezet.id}
                          osszegFt={sor.osszegFt}
                          esedekesseg={sor.esedekesseg.toISOString().slice(0, 10)}
                          cimkek={{
                            nyito: sz("berlo.utalas.nyito"),
                            datum: sz("berlo.utalas.datum"),
                            osszeg: sz("berlo.utalas.osszeg"),
                            kozlemeny: sz("berlo.utalas.kozlemeny"),
                            gomb: sz("berlo.utalas.gomb"),
                            sugo: sz("berlo.utalas.sugo"),
                            visszavon: sz("berlo.utalas.visszavon"),
                          }}
                        />
                      )}
                    </li>
          );
        }
      })}
    </div>
  );
}
