import { Lapfej, Ures } from "@/components/ui/alap";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

/**
 * Az üzenetek lapjának helye.
 *
 * A fülsávon már ott az üzenetek helye, mert a navigáció rendjéről a bérbeadó
 * döntött; magát a beszélgetést másik ág építi. Addig sem mutathat a fül a
 * semmibe, és nem csak a 404 miatt: a Next a fülsáv hivatkozásait előre
 * lekéri, és egy nem létező útvonal lekérése soha nem zárul le. Ettől a
 * böngészős próbák is elakadnak, amelyek a hálózat elcsendesedésére várnak —
 * vagyis egy hiányzó lap az egész próbasort megbuktatja.
 */
export default async function Uzeneteim() {
  await kotelezoSzerep("berlo");
  const { sz } = await szovegek();

  return (
    <div className="grid gap-4">
      <Lapfej cim={sz("uzenetek.cim")} />
      <Ures>{sz("uzenetek.keszul")}</Ures>
    </div>
  );
}
