import { redirect } from "next/navigation";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { Jel } from "@/components/ui/Jel";
import { RegisztracioUrlap } from "./Urlap";

export const dynamic = "force-dynamic";

/**
 * Bérbeadói fiók készítése.
 *
 * A lap a belépés párja, és ugyanúgy néz ki: aki idejut, ugyanabban a
 * pillanatban dönt az alkalmazásról. A bérlőknek szóló mondat itt is ott áll,
 * mert a meghívóból érkező bérlő könnyen téved ide.
 */
export default async function Regisztracio() {
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
            {sz("regisztracio.cim")}
          </h1>
          <p className="mt-1 text-sm leading-snug text-halvany text-pretty">
            {sz("regisztracio.bevezeto")}
          </p>
        </div>
      </div>

      <RegisztracioUrlap nyelv={nyelv} />

      <p className="rounded-kartya border border-dashed border-keret px-4 py-3 text-sm leading-relaxed text-halvany">
        {sz("belepes.meghivo")}
      </p>
    </div>
  );
}
