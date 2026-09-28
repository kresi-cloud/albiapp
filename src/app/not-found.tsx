import Link from "next/link";
import { Kartya, gombOsztaly, Lapfej } from "@/components/ui/alap";
import { szovegek } from "@/lib/nyelv";

/**
 * A saját hibalapunk ismeretlen vagy elavult címre.
 *
 * Enélkül a Next alapértelmezett, angol „This page could not be found" lapja
 * jött, navigáció nélkül — magyar felületen is, és a bérlőnek akkor is, amikor
 * csak egy neki nem szóló lapra tévedt. Egy zsákutca, aminek nincs kiútja:
 * onnan visszafelé csak a böngésző gombjával lehetett jönni.
 *
 * Kettőt mond, mert kétféle okból jut ide valaki: a cím elavult, vagy a
 * munkamenet járt le közben. Ezért áll itt a kezdőlap **és** a belépés is.
 */
export default async function NincsIlyenLap() {
  const { sz } = await szovegek();

  return (
    <div className="mx-auto grid max-w-md gap-4 py-6">
      <Lapfej cim={sz("nincslap.cim")} />
      <Kartya>
        <div className="grid gap-3 p-4">
          <p className="text-sm leading-relaxed text-pretty">{sz("nincslap.mit")}</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className={gombOsztaly("elsodleges")}>
              {sz("nincslap.kezdolap")}
            </Link>
            <Link href="/belepes" className={gombOsztaly("masodlagos")}>
              {sz("nincslap.belepes")}
            </Link>
          </div>
        </div>
      </Kartya>
    </div>
  );
}
