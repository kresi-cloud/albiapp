import { notFound, redirect } from "next/navigation";
import { bemutatkozoLista } from "@/lib/bemutatkozas";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { KartyaHivatkozas, Lapfej, Sugo, Ures } from "@/components/ui/alap";

export const dynamic = "force-dynamic";

/**
 * Az üzemeltetői lista: innen nyílnak a bemutatkozó oldalak.
 *
 * A rendszergazda jelölő kizárólag az adatbázisban állítható. Nincs felület,
 * amivel valaki magának adhatná meg: egy jogosultság, ami a felületről
 * kérhető, előbb-utóbb kikerül oda, ahol nem kellene.
 */
export default async function Rendszergazda() {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) redirect("/belepes");
  if (!felhasznalo.rendszergazda) notFound();

  const { sz } = await szovegek();
  const sorok = await bemutatkozoLista(new Date());

  return (
    <div className="grid gap-4">
      <Lapfej cim={sz("rendszergazda.cim")} alcim={sz("rendszergazda.alcim")} />

      <Sugo cim={sz("rendszergazda.sugo_cim")}>{sz("rendszergazda.sugo")}</Sugo>

      {sorok.length === 0 ? <Ures>{sz("rendszergazda.nincs")}</Ures> : null}

      <ul className="grid gap-2">
        {sorok.map((sor) => (
          <li key={sor.id}>
            <KartyaHivatkozas
              href={
                sor.id === felhasznalo.id ? "/bemutatkozas" : `/bemutatkozas/${sor.id}`
              }
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-medium">{sor.nev}</span>
                <span className="text-sm text-halvany">
                  {sz(`bemutatkozas.szerep.${sor.szerep}`)}
                </span>
              </div>
              <p className="mt-1 text-sm text-halvany">
                {sz("bemutatkozas.darab", { darab: sor.ertekelesekSzama })}
              </p>
            </KartyaHivatkozas>
          </li>
        ))}
      </ul>
    </div>
  );
}
