import { szovegekNyelvvel } from "@/domain/szotar";
import { berloSajatSorai } from "@/lib/szemelyes-adatok";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";
import { SajatAdatok } from "./Urlap";

export const dynamic = "force-dynamic";

/** Az űrlap dátummezőjének alakja; nem megjelenítés, ezért nem formázás. */
function napSzoveg(nap: Date | null): string {
  return nap ? nap.toISOString().slice(0, 10) : "";
}

/**
 * A bérlő saját adatlapja.
 *
 * Eddig ezt a bérbeadó gépelte be helyette a Bérlők lapon. Innentől a bérlő
 * adja meg a sajátját, a bérbeadónál pedig látszik, melyik adatot ki adta meg.
 */
export default async function BerloiAdatok({
  searchParams,
}: {
  searchParams: Promise<{ elso?: string }>;
}) {
  const { elso } = await searchParams;
  const berlo = await kotelezoSzerep("berlo");
  const nyelv = await aktualisNyelv();
  const { sz, u } = szovegekNyelvvel(nyelv);

  const sorok = await berloSajatSorai(berlo.id);
  // Ugyanaz az ember áll minden jogviszonyban, ezért egy űrlap elég: a
  // kezdőértékek a legutóbb kitöltött sorból jönnek.
  const alap = sorok.find((sor) => sor.allapot.megvan > 0) ?? sorok[0];
  const allapot = alap?.allapot ?? { teljes: false, hianyzo: [], megvan: 0, osszesen: 6 };

  return (
    <main className="mx-auto grid max-w-2xl gap-6 p-4">
      <header className="grid gap-2">
        <h1 className="text-xl font-semibold">{sz("adatok.cim")}</h1>
        {elso === "1" ? (
          <p className="rounded border border-stone-300 bg-stone-50 p-3 text-sm dark:border-stone-700 dark:bg-stone-900">
            {sz("adatok.elso_belepes")}
          </p>
        ) : null}
        <p className="text-sm text-stone-600 dark:text-stone-300">{sz("adatok.miert")}</p>
        <p className="text-sm text-stone-600 dark:text-stone-300">{sz("adatok.berlo_sugo")}</p>
      </header>

      <p
        className={`rounded border p-3 text-sm ${
          allapot.teljes
            ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
            : "border-stone-300 bg-stone-50 text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
        }`}
      >
        {allapot.teljes
          ? sz("adatok.teljes")
          : u({
              kulcs: "adatok.keszultseg",
              adatok: { megvan: allapot.megvan, osszesen: allapot.osszesen },
            })}
      </p>

      <SajatAdatok
        kihagyhato={berlo.adatkeresLatta === null}
        cimkek={{
          nev: sz("adatok.mezo.nev"),
          szuletesiHely: sz("adatok.mezo.szuletesiHely"),
          szuletesiIdo: sz("adatok.mezo.szuletesiIdo"),
          anyjaNeve: sz("adatok.mezo.anyjaNeve"),
          lakcim: sz("adatok.mezo.lakcim"),
          igazolvanySzam: sz("adatok.mezo.igazolvanySzam"),
          telefon: sz("adatok.mezo.telefon"),
          gomb: sz("adatok.gomb"),
          kesobb: sz("adatok.kesobb"),
        }}
        ertekek={{
          nev: alap?.adatok.nev ?? berlo.nev,
          szuletesiHely: alap?.adatok.szuletesiHely ?? "",
          szuletesiIdo: alap?.adatok.szuletesiIdo ? napSzoveg(alap.adatok.szuletesiIdo) : "",
          anyjaNeve: alap?.adatok.anyjaNeve ?? "",
          lakcim: alap?.adatok.lakcim ?? "",
          igazolvanySzam: alap?.adatok.igazolvanySzam ?? "",
          telefon: alap?.telefon ?? "",
        }}
      />

      {sorok.length > 1 ? (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {sz("adatok.sajat_oldal")}
        </p>
      ) : null}
    </main>
  );
}
