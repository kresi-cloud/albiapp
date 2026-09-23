import { redirect } from "next/navigation";
import { bemutatkozoLapja } from "@/lib/bemutatkozas";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { Lapfej } from "@/components/ui/alap";
import { BemutatkozoNezet } from "./Nezet";
import { BemutatkozasUrlap } from "./Urlap";

export const dynamic = "force-dynamic";

/**
 * A saját bemutatkozó oldal.
 *
 * A gépi értékelés itt **nincs** rajta, és ez nem feledékenység: azt csak az
 * üzemeltető látja. Egy gépi pontszám, amit a felhasználó is lát, arra
 * ösztönözne, hogy a mutatóra játsszon, nem arra, hogy rendesen bérelje ki a
 * lakást.
 */
export default async function SajatBemutatkozas() {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) redirect("/belepes");

  const { sz, u, nyelv } = await szovegek();
  const lap = await bemutatkozoLapja(felhasznalo.id, new Date());
  if (!lap) redirect("/belepes");

  return (
    <div className="grid gap-4">
      <Lapfej cim={sz("bemutatkozas.cim")} alcim={sz("bemutatkozas.alcim")} />

      <section className="rounded-kartya border border-keret bg-felulet p-4">
        <BemutatkozasUrlap
          meglevo={lap.bemutatkozas}
          cimkek={{
            cimke: sz("bemutatkozas.mezo_cimke"),
            sugo: sz("bemutatkozas.mezo_sugo"),
            gomb: sz("bemutatkozas.ment"),
            folyamatban: sz("bemutatkozas.mentem"),
          }}
        />
      </section>

      <BemutatkozoNezet lap={lap} sajat nyelv={nyelv} sz={sz} u={u} />
    </div>
  );
}
