import { Latogatasok } from "@/components/Latogatasok";
import { berbeadoLatogatasai } from "@/lib/latogatas";
import { jogviszonyNezetek } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

export default async function LatogatasokLap() {
  const berbeado = await kotelezoSzerep("berbeado");
  const { nyelv } = await szovegek();

  const ma = new Date();
  const [latogatasok, nezetek] = await Promise.all([
    berbeadoLatogatasai(berbeado.id),
    jogviszonyNezetek(berbeado.id, ma),
  ]);

  return (
    <Latogatasok
      latogatasok={latogatasok}
      jogviszonyok={nezetek.map((nezet) => ({
        ertek: nezet.id,
        cimke: `${nezet.ingatlanMegnevezes} — ${nezet.berlokNeve}`,
      }))}
      nyelv={nyelv}
      berloId={null}
      ma={ma}
    />
  );
}
