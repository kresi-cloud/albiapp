import { Dokumentumlista } from "@/components/Dokumentumlista";
import { berloTara } from "@/lib/dokumentumtar";
import { kotelezoSzerep } from "@/lib/munkamenet";

export const dynamic = "force-dynamic";

/**
 * A bérlő dokumentumai. Csak a kiadott okiratok: szerződés a véglegesítés után,
 * véglegesített jegyzőkönyv, kiállított igazolás, kiadott rezsielszámolás.
 */
export default async function BerloiDokumentumok() {
  const berlo = await kotelezoSzerep("berlo");
  const dokumentumok = await berloTara(berlo.id);

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Dokumentumaim</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Minden papír, ami a bérleményedről kiadásra került: a szerződés, az
          átadás-átvételi jegyzőkönyv, a rezsielszámolások és a bérbeadói igazolások.
          Mindegyik letölthető, és ugyanazt tartalmazza, amit a bérbeadó lát.
        </p>
      </section>

      <Dokumentumlista
        dokumentumok={dokumentumok}
        uresUzenet="Még nincs kiadott dokumentumod. Amint a bérbeadó véglegesít egyet, itt megjelenik."
      />
    </div>
  );
}
