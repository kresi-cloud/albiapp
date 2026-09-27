import { TELEPITES_MODOK } from "@/domain/telepites";
import { szovegek } from "@/lib/nyelv";
import { Kartya, Lapfej } from "@/components/ui/alap";
import { Telepitogomb } from "@/components/Telepitogomb";

/**
 * Hogyan kerül az Albi a telefonra és a gépre.
 *
 * Belépés nélkül is elérhető, a láblécből: a meghívóból érkező bérlő így még
 * a saját fiókja előtt fel tudja tenni.
 *
 * A lap kimondja azt is, amit a telepítés **nem** ad. Telepítve is minden
 * adat a kiszolgálóról jön, tehát internet nélkül nem mutat semmit — enélkül
 * a felhasználó joggal hinné, hogy ettől offline is elérhető lesz a bérlete.
 */
export default async function Telepites() {
  const { sz } = await szovegek();

  return (
    <div className="grid gap-4">
      <Lapfej cim={sz("telepites.cim")} alcim={sz("telepites.alcim")} />

      <Telepitogomb cimke={sz("telepites.gomb")} mar={sz("telepites.mar_telepitve")} />

      <p className="text-sm leading-relaxed text-pretty">{sz("telepites.mit_ad")}</p>
      <p className="text-sm leading-relaxed text-halvany text-pretty">
        {sz("telepites.mit_nem")}
      </p>

      {/* Telefonon egymás alatt, gépen egymás mellett: három rövid lista,
          amiből mindenki a sajátját olvassa el. */}
      <div className="grid gap-3 sm:grid-cols-3">
        {TELEPITES_MODOK.map((mod) => (
          <Kartya key={mod.kulcs}>
            <div className="p-4" data-telepitesmod={mod.kulcs}>
              <h2 className="font-display text-base font-bold tracking-tight">
                {sz(mod.cim)}
              </h2>
              <ol className="mt-2 grid list-decimal gap-1.5 pl-4 text-sm leading-snug text-halvany">
                {mod.lepesek.map((kulcs) => (
                  <li key={kulcs}>{sz(kulcs)}</li>
                ))}
              </ol>
            </div>
          </Kartya>
        ))}
      </div>
    </div>
  );
}
