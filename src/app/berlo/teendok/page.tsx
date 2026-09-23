import { Teendolap } from "@/components/Teendolap";
import { berloNezetei, berloTeendoi, lezartTeendok } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

export default async function BerloiTeendok({
  searchParams,
}: {
  searchParams: Promise<{ honap?: string; nap?: string }>;
}) {
  const berlo = await kotelezoSzerep("berlo");
  const { nyelv } = await szovegek();
  const { honap, nap } = await searchParams;

  const ma = new Date();
  const [sajatTeendok, lezartak, nezetek] = await Promise.all([
    berloTeendoi(berlo.id, ma),
    lezartTeendok(berlo.id, "berlo"),
    berloNezetei(berlo.id, ma),
  ]);

  return (
    <Teendolap
      teendok={sajatTeendok}
      lezartak={lezartak}
      jogviszonyok={nezetek.map((nezet) => ({
        id: nezet.id,
        cimke: nezet.ingatlanMegnevezes,
      }))}
      nyelv={nyelv}
      utvonal="/berlo/teendok"
      honapParam={honap ?? null}
      napParam={nap ?? null}
      ma={ma}
    />
  );
}
