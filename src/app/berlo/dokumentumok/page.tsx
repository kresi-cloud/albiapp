import { Dokumentumlista } from "@/components/Dokumentumlista";
import { Lapfej, Sugo } from "@/components/ui/alap";
import { szovegekNyelvvel } from "@/domain/szotar";
import { berloTara } from "@/lib/dokumentumtar";
import { berloKetnyelvuKerdesei, ketnyelvuCimkek } from "@/lib/ketnyelvu";
import { KetnyelvuDontes } from "@/components/KetnyelvuDontes";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

/**
 * A bérlő dokumentumai. Csak a kiadott okiratok: szerződés a véglegesítés után,
 * véglegesített jegyzőkönyv, kiállított igazolás, kiadott rezsielszámolás.
 */
export default async function BerloiDokumentumok() {
  const berlo = await kotelezoSzerep("berlo");
  const nyelv = await aktualisNyelv();
  const { sz } = szovegekNyelvvel(nyelv);
  const dokumentumok = await berloTara(berlo.id);
  // A tervezet szövegét a bérlő továbbra sem látja — az még változhat —, de a
  // kétnyelvű példányról neki is nyilatkoznia kell, és annak a véglegesítés
  // előtt van értelme. Ugyanaz a szándékos kivétel, mint a jegyzőkönyv
  // fényképeinél.
  const ketnyelvuKerdesek = await berloKetnyelvuKerdesei(berlo.id);

  return (
    <div className="grid gap-5">
      <Lapfej cim={sz("dokumentum.oldal.cim")} />

      <Sugo cim={sz("dokumentum.oldal.sugo_cim")}>
        <p>{sz("dokumentum.oldal.bevezeto")}</p>
      </Sugo>

      {/* Hogy az okirat magyarul érvényes, azt nem csukjuk össze: az angol
          felületen álló bérlő pont ezt nem sejti magától. */}
      <p className="rounded-kartya border border-dashed border-keret px-4 py-3 text-sm leading-relaxed text-halvany">
        {sz("dokumentum.oldal.magyarul")}
      </p>

      {ketnyelvuKerdesek.map((kerdes) => (
        <section
          key={kerdes.szerzodesId}
          className="rounded-kartya border border-keret bg-felulet p-4"
        >
          <h2 className="font-medium">{sz("ketnyelvu.cim")}</h2>
          <p className="mb-1 mt-1 text-sm text-nagyon-halvany">{kerdes.ingatlan}</p>
          <p className="mb-3 text-sm text-halvany">{sz("ketnyelvu.sugo")}</p>
          <KetnyelvuDontes
            szerzodesId={kerdes.szerzodesId}
            nyilatkozhat
            cimkek={ketnyelvuCimkek(kerdes, sz)}
          />
        </section>
      ))}

      <Dokumentumlista
        dokumentumok={dokumentumok}
        nyelv={nyelv}
        uresUzenet={sz("dokumentum.oldal.ures")}
      />
    </div>
  );
}
