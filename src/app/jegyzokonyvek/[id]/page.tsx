import Link from "next/link";
import { notFound } from "next/navigation";
import {
  hianyzoTetelek,
  jegyzokonyvSzovege,
  oraallastKiolvas,
  vallaltHibak,
} from "@/domain/jegyzokonyv";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { jegyzokonyvBetoltes } from "@/lib/jegyzokonyv";
import { JegyzokonyvUrlap, UjTetel, VeglegesitesUrlap } from "./Urlapok";

export const dynamic = "force-dynamic";

function idopontMezo(idopont: Date): string {
  return idopont.toISOString().slice(0, 16);
}

export default async function JegyzokonyvOldal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();

  const betoltott = await jegyzokonyvBetoltes(id, berbeado.id);
  if (!betoltott) notFound();

  const { bemenet, allapot, veglegesSzoveg, tetelek } = betoltott;
  const szerkesztheto = allapot === "tervezet";
  const hianyok = hianyzoTetelek(bemenet);

  // Véglegesítéskor ezek történtek. A gomb melletti üzenet a véglegesítéssel
  // együtt eltűnik, ezért az eredményt magából a jegyzőkönyvből olvassuk vissza.
  const rogzitettOraallas = tetelek.filter(
    (tetel) => tetel.fajta === "meroora" && tetel.merooraId && oraallastKiolvas(tetel.ertek) !== null,
  ).length;
  const vallalasok = vallaltHibak(bemenet.tetelek).length;

  return (
    <div className="grid gap-6">
      <section>
        <Link href="/dokumentumok" className="text-sm underline underline-offset-2">
          {sz("szerzodes.vissza")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {sz(`jegyzokonyv.fajta.${bemenet.fajta}`)} · {bemenet.ingatlan.megnevezes}
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {sz(szerkesztheto ? "jegyzokonyv.tervezet_sugo" : "jegyzokonyv.vegleges_sugo")}
        </p>
        {/* A kiadott okirat magyarul érvényes: a lap ezt kimondja. */}
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {sz("jegyzokonyv.magyar_szoveg")}
        </p>
      </section>

      {!szerkesztheto ? (
        <section className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <p>
            {rogzitettOraallas > 0
              ? sz("jegyzokonyv.oraallas_bekerult", { db: rogzitettOraallas })
              : sz("jegyzokonyv.nincs_oraallas")}
          </p>
          {vallalasok > 0 ? (
            <p className="mt-1">{sz("jegyzokonyv.vallalasok", { db: vallalasok })}</p>
          ) : null}
        </section>
      ) : null}

      {szerkesztheto && hianyok.length > 0 ? (
        <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-medium">{sz("jegyzokonyv.hianyok_cim")}</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-stone-600 dark:text-stone-400">
            {hianyok.map((sor) => (
              <li key={`${sor.kulcs}:${u(sor)}`}>{u(sor)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {szerkesztheto ? (
        <>
          <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <JegyzokonyvUrlap
              jegyzokonyvId={id}
              idopont={idopontMezo(bemenet.idopont)}
              allapotLeiras={bemenet.allapotLeiras}
              megjegyzes={bemenet.megjegyzes ?? ""}
              tetelek={tetelek}
              cimkek={{
                idopont: sz("jegyzokonyv.idopont"),
                fajtaCim: {
                  meroora: sz("jegyzokonyv.tetel.meroora"),
                  kulcs: sz("jegyzokonyv.tetel.kulcs"),
                  hiba: sz("jegyzokonyv.tetel.hiba"),
                  dokumentum: sz("jegyzokonyv.tetel.dokumentum"),
                },
                ertekSugo: {
                  meroora: sz("jegyzokonyv.ertek_sugo.meroora"),
                  kulcs: sz("jegyzokonyv.ertek_sugo.kulcs"),
                  hiba: "",
                  dokumentum: "",
                },
                megnevezes: sz("jegyzokonyv.megnevezes"),
                ertek: sz("jegyzokonyv.ertek"),
                megjegyzes: sz("jegyzokonyv.megjegyzes"),
                megjegyzesSugo: sz("jegyzokonyv.megjegyzes_sugo"),
                kiRendezi: sz("jegyzokonyv.ki_rendezi"),
                nincsVallalas: sz("jegyzokonyv.nincs_vallalas"),
                felelosBerbeado: sz("jegyzokonyv.felelos_berbeado"),
                felelosBerlo: sz("jegyzokonyv.felelos_berlo"),
                mikorra: sz("jegyzokonyv.mikorra"),
                allapotLeiras: sz("jegyzokonyv.allapot_leiras"),
                egyebMegjegyzes: sz("jegyzokonyv.egyeb_megjegyzes"),
                gomb: sz("jegyzokonyv.mentes"),
                folyamatban: sz("jegyzokonyv.mentem"),
              }}
            />
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="mb-3 font-medium">{sz("jegyzokonyv.uj_tetel_cim")}</h2>
            <UjTetel
              jegyzokonyvId={id}
              cimkek={{
                fajta: sz("jegyzokonyv.tetel_fajtaja"),
                fajtaHiba: sz("jegyzokonyv.fajta_hiba"),
                fajtaMeroora: sz("jegyzokonyv.fajta_meroora"),
                fajtaKulcs: sz("jegyzokonyv.fajta_kulcs"),
                fajtaDokumentum: sz("jegyzokonyv.fajta_dokumentum"),
                megnevezes: sz("jegyzokonyv.megnevezes"),
                megnevezesSugo: sz("jegyzokonyv.mit_rogzitesz"),
                ertek: sz("jegyzokonyv.ertek"),
                ertekSugo: sz("jegyzokonyv.ertek_ha_van"),
                gomb: sz("jegyzokonyv.hozzaadas"),
                folyamatban: sz("jegyzokonyv.hozzaadom"),
              }}
            />
          </section>
        </>
      ) : null}

      <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium">{sz("jegyzokonyv.szoveg_cim")}</h2>
          <a href={`/jegyzokonyvek/${id}/letoltes`} className="text-sm underline underline-offset-2">
            {sz("jegyzokonyv.letoltes")}
          </a>
        </div>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-relaxed">
          {veglegesSzoveg ?? jegyzokonyvSzovege(bemenet)}
        </pre>
      </section>

      {szerkesztheto ? (
        <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <VeglegesitesUrlap
            jegyzokonyvId={id}
            cimkek={{
              gomb: sz("jegyzokonyv.veglegesites"),
              megis: sz("jegyzokonyv.veglegesites_megis"),
              folyamatban: sz("jegyzokonyv.veglegesitem"),
              sugo: sz("jegyzokonyv.veglegesites_sugo"),
            }}
          />
        </section>
      ) : null}
    </div>
  );
}
