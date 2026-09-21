import { redirect } from "next/navigation";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { Jel } from "@/components/ui/Jel";
import { BelepesUrlap } from "./BelepesUrlap";

export const dynamic = "force-dynamic";

/**
 * A belépés az első képernyő, amit bárki lát az alkalmazásból — a bérbeadó
 * naponta, a meghívott bérlő pedig egyszer, és abból dönti el, komoly
 * dolgot kapott-e a kezébe. Ezért kap levegőt: egy kártya a lap közepén, a
 * jel fölötte, és semmi más. A meghívóról szóló mondat külön dobozban áll
 * alatta, mert az nem a belépéshez tartozik, hanem ahhoz, akinek még nincs
 * fiókja.
 */
export default async function Belepes() {
  const felhasznalo = await belepettFelhasznalo();
  if (felhasznalo) redirect(felhasznalo.szerep === "berlo" ? "/berlo" : "/");

  const nyelv = await aktualisNyelv();
  const { sz } = szovegekNyelvvel(nyelv);

  return (
    <div className="mx-auto grid max-w-sm gap-5 py-6 sm:py-12">
      <div className="grid justify-items-center gap-3 text-center">
        <Jel meret={44} />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {sz("belepes.cim")}
          </h1>
          <p className="mt-1 text-sm leading-snug text-halvany text-pretty">
            {sz("belepes.bevezeto")}
          </p>
        </div>
      </div>

      <BelepesUrlap nyelv={nyelv} />

      <p className="rounded-kartya border border-dashed border-keret px-4 py-3 text-sm leading-relaxed text-halvany">
        {sz("belepes.meghivo")}
      </p>
    </div>
  );
}
