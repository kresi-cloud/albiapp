/**
 * Az űrlapmezők közös osztályai.
 *
 * Azért egy helyen, mert egy mezőszabály telefonon dől el, és azt mindenütt
 * ugyanúgy kell tudni. A `w-full min-w-0` nem díszítés: a rácsba tett mező
 * alapértelmezésben a leghosszabb tartalmához (egy `select` esetén a leghosszabb
 * opcióhoz) nő, és szétfeszíti az oldalt, amit a fejlesztő nagy kijelzőjén nem
 * látni, a 360 képpontos telefonon viszont oldalirányú görgetés lesz belőle.
 */

export const MEZO =
  "w-full min-w-0 rounded border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950";

export const GOMB =
  "justify-self-start rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900";

export const HALVANY_GOMB =
  "justify-self-start rounded border border-stone-300 px-3 py-2 text-sm font-medium disabled:opacity-60 dark:border-stone-700";

/** Kártyán belüli, sorba tett gomb: nem feszíti szét a kártyát. */
export const APRO_GOMB =
  "rounded border border-stone-300 px-3 py-1.5 text-sm font-medium disabled:opacity-60 dark:border-stone-700";
