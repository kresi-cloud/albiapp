import { redirect } from "next/navigation";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { BelepesUrlap } from "./BelepesUrlap";

export const dynamic = "force-dynamic";

export default async function Belepes() {
  const felhasznalo = await belepettFelhasznalo();
  if (felhasznalo) redirect(felhasznalo.szerep === "berlo" ? "/berlo" : "/");

  return (
    <div className="mx-auto grid max-w-sm gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Belépés</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          A bérbeadó és a bérlő ugyanitt lép be, és a szerepe szerinti oldalra érkezik.
        </p>
      </section>

      <BelepesUrlap />

      <p className="text-sm text-stone-600 dark:text-stone-400">
        Bérlőként meghívó linkkel tudsz fiókot készíteni. A linket a bérbeadód
        küldi el; ha nincs meg, kérd el tőle újra.
      </p>
    </div>
  );
}
