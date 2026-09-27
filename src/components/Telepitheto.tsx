"use client";

import { useEffect } from "react";

/**
 * A szervizmunkás bejelentkeztetése.
 *
 * Ettől lesz az alkalmazás telepíthető, és ettől jön kapcsolat nélkül a saját
 * offline lapunk a böngésző hibaoldala helyett. Semmit nem rajzol ki: egy
 * sornyi mellékhatás, aminek nincs felülete.
 *
 * Ha a böngésző nem ismeri a szervizmunkást — régi iOS, vagy privát ablak —,
 * az alkalmazás ugyanúgy működik, csak nem telepíthető. Ezért a hiba itt
 * elnyelt: nincs mit mondani róla a felhasználónak.
 */
export function Telepitheto() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
