import { notFound, redirect } from "next/navigation";
import { lathatja } from "@/domain/bemutatkozas";
import { gepiErtekeles } from "@/domain/gepi-ertekeles";
import { bemutatkozoLapja } from "@/lib/bemutatkozas";
import { megfigyelesek } from "@/lib/gepi-ertekeles";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { GombHivatkozas, Lapfej } from "@/components/ui/alap";
import { BemutatkozoNezet } from "../Nezet";
import { GepiNezet } from "../GepiNezet";

export const dynamic = "force-dynamic";

/**
 * Egy másik felhasználó bemutatkozó oldala.
 *
 * A lap **nem nyilvános**: csak ő maga és az üzemeltető nyithatja meg, és ezt
 * a kiszolgáló dönti el, nem a hivatkozás elrejtése. Az üzemeltető itt látja
 * egymás mellett a kettőt: amit a másik fél írt róla, és amit a rendszer mért.
 */
export default async function MasBemutatkozasa({
  params,
}: {
  params: Promise<{ felhasznaloId: string }>;
}) {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) redirect("/belepes");

  const { felhasznaloId } = await params;
  if (!lathatja({ id: felhasznalo.id, rendszergazda: felhasznalo.rendszergazda }, felhasznaloId)) {
    notFound();
  }
  if (felhasznaloId === felhasznalo.id) redirect("/bemutatkozas");

  const { sz, u, nyelv } = await szovegek();
  const ma = new Date();
  const lap = await bemutatkozoLapja(felhasznaloId, ma);
  if (!lap) notFound();

  const pontok = gepiErtekeles(await megfigyelesek(felhasznaloId, lap.szerep, ma));

  return (
    <div className="grid gap-4">
      <Lapfej
        cim={lap.nev}
        alcim={sz("bemutatkozas.admin_alcim")}
        muvelet={
          <GombHivatkozas href="/rendszergazda" suly="halk">
            {sz("bemutatkozas.vissza")}
          </GombHivatkozas>
        }
      />

      <BemutatkozoNezet lap={lap} sajat={false} nyelv={nyelv} sz={sz} u={u} />
      <GepiNezet pontok={pontok} sz={sz} u={u} />
    </div>
  );
}
