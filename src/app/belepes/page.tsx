import { redirect } from "next/navigation";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { BelepesUrlap } from "./BelepesUrlap";

export const dynamic = "force-dynamic";

export default async function Belepes() {
  const felhasznalo = await belepettFelhasznalo();
  if (felhasznalo) redirect(felhasznalo.szerep === "berlo" ? "/berlo" : "/");

  const nyelv = await aktualisNyelv();
  const { sz } = szovegekNyelvvel(nyelv);

  return (
    <div className="mx-auto grid max-w-sm gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">{sz("belepes.cim")}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">{sz("belepes.bevezeto")}</p>
      </section>

      <BelepesUrlap nyelv={nyelv} />

      <p className="text-sm text-stone-600 dark:text-stone-400">{sz("belepes.meghivo")}</p>
    </div>
  );
}
