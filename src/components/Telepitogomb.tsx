"use client";

import { useEffect, useState } from "react";
import { gombOsztaly } from "@/components/ui/alap";

/**
 * A böngésző telepítési ajánlata, gombként.
 *
 * Androidon és gépen a böngésző maga szól, hogy telepíthető az oldal — de a
 * saját sávjában, amit sokan észre sem vesznek. Ezt az ajánlatot fogjuk el, és
 * tesszük ki oda, ahol a telepítésről szó van.
 *
 * iOS-en ilyen ajánlat **nincs**, és nem is lesz: ott a megosztás menüjében
 * van a „Hozzáadás a Főképernyőhöz”. Ezért a gomb hiánya nem hiba, és ezért
 * áll a lapon a kézi leírás is — az iPhone-os bérlő csak abból tudja meg,
 * hogyan teheti fel.
 */
type Telepitoesemeny = Event & { prompt: () => Promise<unknown> };

export function Telepitogomb({ cimke, mar }: { cimke: string; mar: string }) {
  const [ajanlat, ajanlatotAllit] = useState<Telepitoesemeny | null>(null);
  const [telepitve, telepitveAllit] = useState(false);

  useEffect(() => {
    // Az alkalmazás saját ablakában nincs mit telepíteni. A `standalone`
    // az iOS régebbi jelzése ugyanerre.
    const iosJel = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    telepitveAllit(window.matchMedia("(display-mode: standalone)").matches || iosJel);

    const elfog = (esemeny: Event) => {
      // A böngésző saját sávja helyett mi kérdezünk, a maga helyén.
      esemeny.preventDefault();
      ajanlatotAllit(esemeny as Telepitoesemeny);
    };
    const kesz = () => {
      ajanlatotAllit(null);
      telepitveAllit(true);
    };

    window.addEventListener("beforeinstallprompt", elfog);
    window.addEventListener("appinstalled", kesz);
    return () => {
      window.removeEventListener("beforeinstallprompt", elfog);
      window.removeEventListener("appinstalled", kesz);
    };
  }, []);

  if (telepitve) {
    return (
      <p className="text-sm text-halvany" data-telepites="mar">
        {mar}
      </p>
    );
  }

  if (!ajanlat) return null;

  return (
    <p>
      <button
        type="button"
        className={gombOsztaly("elsodleges")}
        data-telepites="gomb"
        onClick={() => {
          // Az ajánlat egyszer használható: a visszautasítás után a böngésző
          // dönti el, mikor kínálja fel újra.
          ajanlat.prompt().catch(() => {});
          ajanlatotAllit(null);
        }}
      >
        {cimke}
      </button>
    </p>
  );
}
