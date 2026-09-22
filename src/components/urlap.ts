/**
 * Az űrlapmezők közös osztályai.
 *
 * Azért egy helyen, mert egy mezőszabály telefonon dől el, és azt mindenütt
 * ugyanúgy kell tudni. A `w-full min-w-0` nem díszítés: a rácsba tett mező
 * alapértelmezésben a leghosszabb tartalmához (egy `select` esetén a leghosszabb
 * opcióhoz) nő, és szétfeszíti az oldalt, amit a fejlesztő nagy kijelzőjén nem
 * látni, a 360 képpontos telefonon viszont oldalirányú görgetés lesz belőle.
 *
 * A `min-h-11` a másik telefonos szabály: 44 képpont az a magasság, amit ujjal
 * biztosan el lehet találni. A 16 képpontos betűméret pedig azért kell, mert
 * ennél kisebb mezőbe kattintva az iPhone Safari ráközelít a lapra, és onnan a
 * felhasználónak magának kell visszahúznia.
 *
 * A színek a `globals.css` jelentés szerinti neveiből jönnek (`felulet`,
 * `keret`, `halvany`), ezért nincs `dark:` páros: a sötét mód magától követi
 * őket.
 */

export const MEZO =
  "w-full min-w-0 min-h-11 rounded-lg border border-keret-eros bg-felulet px-3 py-2 text-base sm:text-sm placeholder:text-nagyon-halvany focus:border-albi-500 focus:outline-none";

/**
 * Fájlmező. A böngésző alapértelmezett gombja angolul írja ki magát („Choose
 * File, No file chosen”) egy magyar felület közepén, és semmilyen stílust nem
 * vesz fel — ezért kap saját gombot a `file:` előtaggal.
 */
export const FAJLMEZO =
  "w-full min-w-0 rounded-lg border border-dashed border-keret-eros bg-felulet-halk p-2 text-sm text-halvany file:mr-3 file:min-h-9 file:cursor-pointer file:rounded-md file:border-0 file:bg-albi-700 file:px-3 file:text-sm file:font-semibold file:text-white hover:file:bg-albi-800";

const GOMB_ALAP =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/** Az elsődleges művelet: amiért a lap vagy az űrlap létezik. Lapon egy van. */
export const GOMB = `${GOMB_ALAP} justify-self-start border border-transparent bg-albi-700 text-white hover:bg-albi-800 active:bg-albi-900`;

/** Másodlagos, egyenrangú választás az elsődleges mellett. */
export const HALVANY_GOMB = `${GOMB_ALAP} justify-self-start border border-keret-eros bg-felulet text-szoveg hover:bg-felulet-halk`;

/** Kártyán belüli, sorba tett gomb: nem feszíti szét a kártyát. */
export const APRO_GOMB = `${GOMB_ALAP} border border-keret-eros bg-felulet text-szoveg hover:bg-felulet-halk`;

/**
 * Visszavonás és törlés: szöveges, mert nem ez a fő út, de nem is rejtve, mert
 * egy téves rögzítést ki kell tudni javítani.
 */
export const VISSZAVONO_GOMB =
  "justify-self-start inline-flex min-h-9 items-center rounded-md px-2 text-xs font-medium text-halvany transition-colors hover:bg-gond-lap hover:text-gond disabled:opacity-60";

/** Mezőfelirat. */
export const CIMKE = "text-sm font-medium text-szoveg";

/** Magyarázat a mező alatt. */
export const SUGOSZOVEG = "text-xs leading-relaxed text-halvany";
