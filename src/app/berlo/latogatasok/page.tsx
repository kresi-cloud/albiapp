import { Latogatasok } from "@/components/Latogatasok";
import { berloLatogatasai } from "@/lib/latogatas";
import { berloNezetei } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

export default async function BerloiLatogatasok() {
  const berlo = await kotelezoSzerep("berlo");
  const { nyelv } = await szovegek();

  const ma = new Date();
  const [latogatasok, nezetek] = await Promise.all([
    berloLatogatasai(berlo.id),
    berloNezetei(berlo.id, ma),
  ]);

  return (
    <Latogatasok
      latogatasok={latogatasok}
      jogviszonyok={nezetek.map((nezet) => ({
        ertek: nezet.id,
        cimke: nezet.ingatlanMegnevezes,
      }))}
      nyelv={nyelv}
      berloId={berlo.id}
      ma={ma}
    />
  );
}
