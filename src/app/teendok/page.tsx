import { Teendolap } from "@/components/Teendolap";
import { jogviszonyNezetek, lezartTeendok, teendok } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

export default async function Teendok({
  searchParams,
}: {
  searchParams: Promise<{ honap?: string; nap?: string }>;
}) {
  const berbeado = await kotelezoSzerep("berbeado");
  const { nyelv } = await szovegek();
  const { honap, nap } = await searchParams;

  const ma = new Date();
  const [sajatTeendok, lezartak, nezetek] = await Promise.all([
    teendok(berbeado.id, "berbeado", ma),
    lezartTeendok(berbeado.id, "berbeado"),
    jogviszonyNezetek(berbeado.id, ma),
  ]);

  return (
    <Teendolap
      teendok={sajatTeendok}
      lezartak={lezartak}
      jogviszonyok={nezetek.map((nezet) => ({
        id: nezet.id,
        cimke: `${nezet.ingatlanMegnevezes} — ${nezet.berlokNeve}`,
      }))}
      nyelv={nyelv}
      utvonal="/teendok"
      honapParam={honap ?? null}
      napParam={nap ?? null}
      ma={ma}
    />
  );
}
