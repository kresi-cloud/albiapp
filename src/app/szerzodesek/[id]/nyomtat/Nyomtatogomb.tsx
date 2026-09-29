"use client";

import { GOMB } from "@/components/urlap";

/**
 * A nyomtatás indítása.
 *
 * PDF-et nem a kiszolgálón állítunk elő: a böngésző nyomtatóablakában ott a
 * „Mentés PDF-be", és az ugyanazt a szöveget adja, amit a papír. Így nincs új
 * függőség, nincs betűtípus-csomag a kiszolgálón, és nem kell attól tartani,
 * hogy a PDF mást mutat, mint a lap — ez ugyanaz az elv, mint a
 * `veglegesSzoveg`-nél: egy szöveg van, nem kettő.
 */
export function Nyomtatogomb({ cimke }: { cimke: string }) {
  return (
    <button type="button" className={GOMB} onClick={() => window.print()}>
      {cimke}
    </button>
  );
}
