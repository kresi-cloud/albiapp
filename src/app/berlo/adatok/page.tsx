import { szovegekNyelvvel } from "@/domain/szotar";
import { berloSajatSorai } from "@/lib/szemelyes-adatok";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";
import { Kartya, Lapfej, Sugo } from "@/components/ui/alap";
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
    // A lap nem nyit saját `main`-t: az elrendezésben már van egy, és a
    // kettő egymásba ágyazva dupla margót és két főtartalmat jelentene.
    <div className="mx-auto grid max-w-2xl gap-5">
      <Lapfej cim={sz("adatok.cim")} alcim={sz("adatok.miert")} />

      {elso === "1" ? (
        <p className="rounded-kartya border border-dashed border-keret px-4 py-3 text-sm leading-relaxed">
          {sz("adatok.elso_belepes")}
        </p>
      ) : null}

      {/* A készültség a lap egyetlen állapotmondata, ezért kártyában áll,
          nem a bevezető bekezdései közt: aki most tér vissza, ebből tudja
          meg, van-e még dolga. */}
      <Kartya allapot={allapot.teljes ? "rendben" : "semleges"} osztaly="px-4 py-3">
        <p className={`text-sm font-medium ${allapot.teljes ? "text-rendben" : "text-szoveg"}`}>
          {allapot.teljes
            ? sz("adatok.teljes")
            : u({
                kulcs: "adatok.keszultseg",
                adatok: { megvan: allapot.megvan, osszesen: allapot.osszesen },
              })}
        </p>
      </Kartya>

      <Sugo cim={sz("adatok.berlo_sugo_cim")}>
        <p>{sz("adatok.berlo_sugo")}</p>
      </Sugo>

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
        <p className="text-xs text-nagyon-halvany">
          {sz("adatok.sajat_oldal")}
        </p>
      ) : null}
    </div>
  );
}
