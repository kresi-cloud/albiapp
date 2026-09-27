import { NYELVEK } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/lib/nyelv";
import { Kartya, gombOsztaly } from "@/components/ui/alap";

/**
 * Ez a lap akkor jön elő, amikor nincs internetkapcsolat.
 *
 * A szervizmunkás ezt az egy lapot tartja a készüléken, és kapcsolat híján ezt
 * adja vissza minden lapkérésre. Két dolgot kell megmondania: hogy miért nincs
 * itt semmi (az Albi mindent a kiszolgálóról tölt), és hogy ettől nem veszett
 * el semmi.
 *
 * **Mindkét nyelven kiírjuk**, nem a választott nyelven. A lap a készüléken áll
 * el, és nem a kérés pillanatában készül: nem tudhatjuk, ki nézi majd, és a
 * bérlő gyakran nem olvas magyarul. Két rövid bekezdés ára ez, cserébe nem
 * fordulhat elő, hogy pont az nem érti, akinek szól.
 *
 * A szervizmunkás ezért süti nélkül kéri le és teszi el: ami a készüléken
 * marad, abban ne legyen semmi, ami a belépett felhasználóé.
 */
export default async function Offline() {
  // A szövegező maga tudja, melyik nyelvé: külön mező nem kell mellé.
  const nyelvek = NYELVEK.map((nyelv) => szovegekNyelvvel(nyelv));

  return (
    <div className="mx-auto grid max-w-xl gap-4 py-6">
      {nyelvek.map(({ nyelv, sz }, sorszam) => (
        <Kartya key={nyelv}>
          <div className="grid gap-2 p-4" lang={nyelv}>
            <h1 className="font-display text-xl font-bold tracking-tight">
              {sz("offline.cim")}
            </h1>
            <p className="text-sm leading-relaxed text-pretty">{sz("offline.mit")}</p>
            <p className="text-sm leading-relaxed text-halvany text-pretty">
              {sz("offline.adat")}
            </p>
            {/* A gomb mindkét nyelvi kártyán ott van: lentről felfelé is
                olvassa valaki. */}
            <p className="mt-1">
              {/* Szándékosan `<a>`, nem `<Link>`: a lapon belüli léptetés a
                  már betöltött alkalmazáson belül maradna, és kapcsolat nélkül
                  némán elbukna. Itt épp az a cél, hogy a böngésző újra
                  megpróbálja lekérni a lapot a kiszolgálótól. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className={gombOsztaly(sorszam === 0 ? "elsodleges" : "masodlagos")}>
                {sz("offline.ujra")}
              </a>
            </p>
          </div>
        </Kartya>
      ))}
    </div>
  );
}
