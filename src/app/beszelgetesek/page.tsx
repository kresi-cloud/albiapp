import Link from "next/link";
import { redirect } from "next/navigation";
import { megszolithatok } from "@/domain/beszelgetes";
import { datumIdovelNyelven } from "@/domain/nyelv";
import { beszelgetesei, tarsasagai } from "@/lib/beszelgetes";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { UjBeszelgetes } from "./Urlapok";

export const dynamic = "force-dynamic";

/**
 * A beszélgetések listája, ugyanaz a bérbeadónál és a bérlőnél.
 *
 * Nincs két külön lap a két szerepnek, mert a tartalom ugyanaz: a szálak, amiknek
 * a felhasználó résztvevője. A jogosultságot a lekérdezés adja, nem az útvonal.
 */
export default async function Beszelgetesek() {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) redirect("/belepes");

  const { sz, u, nyelv } = await szovegek();
  const ki = { id: felhasznalo.id, szerep: szerepe(felhasznalo) };
  const most = new Date();

  const [szalak, tarsasagok] = await Promise.all([
    beszelgetesei(ki, most),
    tarsasagai(ki, most),
  ]);

  // Archivált szál nem indít újat, ezért a választóból is kimarad: aki
  // kiköltözött három hónapja, annak nincs hová írni.
  const elok = tarsasagok.filter((tarsasag) => !tarsasag.archivalt);

  const nyitottak = szalak.filter((szal) => !szal.archivalt);
  const archivaltak = szalak.filter((szal) => szal.archivalt);

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">{sz("beszelgetes.cim")}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">{sz("beszelgetes.bevezeto")}</p>
      </section>

      <UjBeszelgetes
        tarsasagok={elok.map((tarsasag) => ({
          jogviszonyId: tarsasag.jogviszonyId,
          ingatlanNev: tarsasag.ingatlanNev,
          tagok: megszolithatok(tarsasag.resztvevok, ki.id).map((tag) => ({
            felhasznaloId: tag.felhasznaloId,
            nev: tag.nev,
          })),
        }))}
        cimkek={{
          nyito: sz("beszelgetes.uj"),
          sugo: sz("beszelgetes.uj_sugo"),
          cimzettek: sz("beszelgetes.cimzettek"),
          csoportSugo: sz("beszelgetes.csoport_sugo"),
          szoveg: sz("beszelgetes.uzenet"),
          pelda: sz("beszelgetes.uzenet_pelda"),
          gomb: sz("beszelgetes.kuldes"),
          folyamatban: sz("beszelgetes.kuldom"),
          nincsTars: sz("beszelgetes.nincs_tars"),
        }}
      />

      {szalak.length === 0 ? (
        <p className="text-sm text-stone-600 dark:text-stone-400">{sz("beszelgetes.nincs")}</p>
      ) : null}

      {nyitottak.length > 0 ? (
        <ul className="grid gap-2">
          {nyitottak.map((szal) => (
            <li key={szal.id}>
              <Link
                href={`/beszelgetesek/${szal.id}`}
                className="block rounded-lg border border-stone-200 bg-white p-3 hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-medium">{szal.nev}</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {datumIdovelNyelven(szal.utolsoUzenet, nyelv)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{szal.elonezet}</p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {szal.ingatlanNev} · {u({ kulcs: `beszelgetes.fajta.${szal.fajta}` })} ·{" "}
                  {sz("beszelgetes.darab", { darab: szal.darab })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {/*
        Az archivált szálak összecsukva állnak: olvashatók maradnak, de nem
        veszik el a helyet attól, amivel tényleg dolga van az olvasónak.
      */}
      {archivaltak.length > 0 ? (
        <details>
          <summary className="cursor-pointer text-sm text-stone-600 underline underline-offset-2 dark:text-stone-400">
            {sz("beszelgetes.archivaltak", { darab: archivaltak.length })}
          </summary>
          <ul className="mt-3 grid gap-2">
            {archivaltak.map((szal) => (
              <li key={szal.id}>
                <Link
                  href={`/beszelgetesek/${szal.id}`}
                  className="block rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950"
                >
                  <span className="font-medium">{szal.nev}</span>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    {szal.ingatlanNev} · {sz("beszelgetes.archivalt")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
