import { Allapotjelzo } from "@/components/Allapotjelzo";
import { ElszamolasTetelek } from "@/components/ElszamolasTetelek";
import { Teendolista } from "@/components/Teendolista";
import { datumNyelven, forintNyelven } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { prisma } from "@/lib/db";
import { berloNezetei, berloTeendoi } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";
import { merooraNeve } from "@/lib/rezsi";
import { ElbiralasUrlap, OraallasUrlap } from "@/app/rezsi/Urlapok";
import { meretSzoveg } from "@/domain/bizonylat";
import { bizonylatokTetelekhez } from "@/lib/bizonylat";
import { Bizonylatok } from "@/app/bizonylatok/Urlapok";
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
        <h1 className="text-2xl font-semibold tracking-tight">{sz("nav.berlemenyem")}</h1>
        <p className="text-stone-600 dark:text-stone-400">{sz("berlo.nincs_berlemeny")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          {sz("berlo.udvozles", { nev: berlo.nev })}
        </h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          {nezetek.map((nezet) => `${nezet.ingatlanMegnevezes}, ${nezet.ingatlanCim}`).join(" · ")}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{sz("berlo.teendok")}</h2>
        <Teendolista teendok={sajatTeendok} nyelv={nyelv} />
      </section>

      {meroorasJogviszonyok.map((jogviszony) => (
        <section key={`orak-${jogviszony.id}`}>
          <h2 className="mb-3 text-lg font-semibold">{sz("berlo.oraallas")}</h2>
          <ul className="grid gap-3">
            {jogviszony.ingatlan.meroorak.map((meroora) => (
              <li
                key={meroora.id}
                className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{merooraNeve(meroora.tipus, meroora.almero)}</span>
                  <span className="text-sm tabular-nums text-stone-600 dark:text-stone-400">
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
                  mertekegyseg={meroora.mertekegyseg}
                  mai={mai}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {jogviszonyok.flatMap((jogviszony) =>
        jogviszony.elszamolasok.map((elszamolas) => (
          <section key={elszamolas.id}>
            <h2 className="mb-3 text-lg font-semibold">
              {sz("berlo.elszamolas", {
                tol: datumNyelven(elszamolas.idoszakKezdete, nyelv),
                ig: datumNyelven(elszamolas.idoszakVege, nyelv),
              })}
            </h2>
            <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-sm text-stone-600 dark:text-stone-400">
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
                <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
                  {sz("berlo.elszamolas.uzeneted", { szoveg: elszamolas.berloiUzenet })}
                </p>
              ) : null}
              {elszamolas.allapot === "kiadva" ? (
                <ElbiralasUrlap elszamolasId={elszamolas.id} />
              ) : null}
            </div>
          </section>
        )),
      )}

      {nezetek.map((nezet) => (
        <section key={nezet.id}>
          <h2 className="mb-3 text-lg font-semibold">
            {sz("berlo.befizetesek", { berlemeny: nezet.ingatlanMegnevezes })}
          </h2>
          <ul className="grid gap-2">
            {nezet.egyeztetesek
              .filter((sor) => sor.eloirtTetelId !== null)
              .map((sor) => (
                <li
                  key={sor.eloirtTetelId ?? ""}
                  className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {sor.idoszak} · {forintNyelven(sor.osszegFt, nyelv)}
                    </span>
                    <Allapotjelzo allapot={sor.allapot} nyelv={nyelv} />
                  </div>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                    {sz("berlo.esedekesseg", {
                      nap: datumNyelven(sor.esedekesseg, nyelv),
                    })}{" "}
                    {u(sor.magyarazat)}
                  </p>
                  {sor.reszletezes ? (
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                      {u(sor.reszletezes)}
                    </p>
                  ) : null}

                  <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
                        {sz("berlo.utalas.sajat")}
                      </dt>
                      <dd className="tabular-nums">
                        {sor.igazolasOsszegFt !== null && sor.igazolasDatuma
                          ? `${forintNyelven(sor.igazolasOsszegFt, nyelv)} · ${datumNyelven(sor.igazolasDatuma, nyelv)}`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
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
                    <p className="mt-3 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
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
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
