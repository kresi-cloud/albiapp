import Link from "next/link";
import { redirect } from "next/navigation";
import { megszolithatok } from "@/domain/beszelgetes";
import { datumIdovelNyelven } from "@/domain/nyelv";
import { beszelgetesei, tarsasagai } from "@/lib/beszelgetes";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { Lapfej, NYITO, Sugo, Ures } from "@/components/ui/alap";
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
      <section className="grid gap-3">
        <Lapfej cim={sz("beszelgetes.cim")} />
        <Sugo cim={sz("beszelgetes.sugo_cim")}>
          <p>{sz("beszelgetes.bevezeto")}</p>
        </Sugo>
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
        <Ures>{sz("beszelgetes.nincs")}</Ures>
      ) : null}

      {nyitottak.length > 0 ? (
        <ul className="grid gap-2">
          {nyitottak.map((szal) => (
            <li key={szal.id}>
              <Link
                href={`/beszelgetesek/${szal.id}`}
                className="block rounded-kartya border border-keret bg-felulet p-3 hover:border-keret-eros"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-medium">{szal.nev}</span>
                  <span className="text-xs text-nagyon-halvany">
                    {datumIdovelNyelven(szal.utolsoUzenet, nyelv)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-halvany">{szal.elonezet}</p>
                <p className="mt-1 text-xs text-nagyon-halvany">
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
          <summary className={NYITO}>
            {sz("beszelgetes.archivaltak", { darab: archivaltak.length })}
          </summary>
          <ul className="mt-3 grid gap-2">
            {archivaltak.map((szal) => (
              <li key={szal.id}>
                <Link
                  href={`/beszelgetesek/${szal.id}`}
                  className="block rounded-kartya border border-keret bg-felulet-halk p-3"
                >
                  <span className="font-medium">{szal.nev}</span>
                  <p className="mt-1 text-xs text-nagyon-halvany">
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
