import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FAJTA_NEVE,
  hianyzoTetelek,
  jegyzokonyvSzovege,
  oraallastKiolvas,
  vallaltHibak,
} from "@/domain/jegyzokonyv";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { jegyzokonyvBetoltes } from "@/lib/jegyzokonyv";
import { birtokbaadasiKepek, kepekJegyzokonyvhoz } from "@/lib/jegyzokonyv-kepek";
import { Album } from "@/app/jegyzokonyv-kepek/Album";
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

  const betoltott = await jegyzokonyvBetoltes(id, berbeado.id);
  if (!betoltott) notFound();

  const { bemenet, allapot, veglegesSzoveg, tetelek } = betoltott;
  const szerkesztheto = allapot === "tervezet";
  const hianyok = hianyzoTetelek(bemenet);

  const ki = { id: berbeado.id, szerep: "berbeado" as const };
  const kepek = await kepekJegyzokonyvhoz(ki, id);
  // A záró jegyzőkönyvnél a birtokbaadáskori képekhez párosítunk; a
  // birtokbaadásnál nincs mihez, ott ez üres.
  const nyitoKepek =
    bemenet.fajta === "visszaadas"
      ? await birtokbaadasiKepek(ki, betoltott.jogviszonyId)
      : [];

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
          ← Dokumentumok
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {FAJTA_NEVE[bemenet.fajta] ?? bemenet.fajta} · {bemenet.ingatlan.megnevezes}
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {szerkesztheto
            ? "Tervezet. Töltsd ki a helyszínen, aztán véglegesítsd."
            : "Véglegesítve. A szöveg be van fagyasztva."}
        </p>
      </section>

      {!szerkesztheto ? (
        <section className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <p>
            {rogzitettOraallas > 0
              ? `${rogzitettOraallas} óraállás bekerült a mérőórák történetébe, így az elszámolás innen indul.`
              : "Óraállás nem került rögzítésre."}
          </p>
          {vallalasok > 0 ? (
            <p className="mt-1">
              {vallalasok} vállalásból teendő lett, az áttekintőn látod őket.
            </p>
          ) : null}
        </section>
      ) : null}

      {szerkesztheto && hianyok.length > 0 ? (
        <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-medium">Ezek még hiányoznak</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-stone-600 dark:text-stone-400">
            {hianyok.map((sor) => (
              <li key={sor}>{sor}</li>
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
            />
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="mb-3 font-medium">Új tétel</h2>
            <UjTetel jegyzokonyvId={id} />
          </section>
        </>
      ) : null}

      <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <Album
          jegyzokonyvId={id}
          fajta={bemenet.fajta}
          lezart={!szerkesztheto}
          kepek={kepek}
          tetelek={tetelek.map((tetel) => ({ id: tetel.id, megnevezes: tetel.megnevezes }))}
          nyitoKepek={nyitoKepek}
        />
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium">A jegyzőkönyv szövege</h2>
          <a href={`/jegyzokonyvek/${id}/letoltes`} className="text-sm underline underline-offset-2">
            Letöltés szövegként
          </a>
        </div>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-relaxed">
          {veglegesSzoveg ?? jegyzokonyvSzovege(bemenet)}
        </pre>
      </section>

      {szerkesztheto ? (
        <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <VeglegesitesUrlap jegyzokonyvId={id} />
        </section>
      ) : null}
    </div>
  );
}
