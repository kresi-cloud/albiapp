import { Dokumentumlista } from "@/components/Dokumentumlista";
import { szovegekNyelvvel } from "@/domain/szotar";
import { berloTara } from "@/lib/dokumentumtar";
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

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">{sz("dokumentum.oldal.cim")}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          {sz("dokumentum.oldal.bevezeto")}
        </p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {sz("dokumentum.oldal.magyarul")}
        </p>
      </section>

      <Dokumentumlista
        dokumentumok={dokumentumok}
        nyelv={nyelv}
        uresUzenet={sz("dokumentum.oldal.ures")}
      />
    </div>
  );
}
