/**
 * A felület ikonkészlete.
 *
 * Miért saját, és miért nem ikoncsomag: a navigációhoz tizenhárom jel kell,
 * egy csomag ennek a százszorosát hozná magával, és a stílusa sem a miénk
 * lenne. Ezek vonalas ikonok, mind ugyanazzal a vonalvastagsággal és
 * lekerekítéssel rajzolva, `currentColor`-ral — így a színüket az veszi fel,
 * ami köré kerülnek, és sötét módban nincs velük külön teendő.
 *
 * Az ikon a szöveg mellett áll, nem helyette: az alsó fülsávon is ott a
 * felirat, mert a vesszőkulcs és a százalékjel önmagában senkinek nem mondja
 * meg, hogy adóösszesítőt takar.
 */

type IkonTulajdonsagok = {
  /** Képpontban. A fülsávon 22, szövegben 16 a szokásos. */
  meret?: number;
  osztaly?: string;
};

function Rajz({
  meret = 20,
  osztaly,
  children,
}: IkonTulajdonsagok & { children: React.ReactNode }) {
  return (
    <svg
      width={meret}
      height={meret}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={osztaly}
    >
      {children}
    </svg>
  );
}

export function IkonAttekinto(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </Rajz>
  );
}

export function IkonBefizetesek(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <rect x="2.5" y="6" width="19" height="12.5" rx="2.5" />
      <circle cx="12" cy="12.25" r="2.75" />
      <path d="M6 10v4.5M18 10v4.5" />
    </Rajz>
  );
}

export function IkonRezsi(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <path d="M12 3s5.5 5.4 5.5 9.4a5.5 5.5 0 0 1-11 0C6.5 8.4 12 3 12 3Z" />
      <path d="M12 17.5a3 3 0 0 1-3-3" />
    </Rajz>
  );
}

export function IkonDokumentumok(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <path d="M14 2.75H7A1.75 1.75 0 0 0 5.25 4.5v15A1.75 1.75 0 0 0 7 21.25h10a1.75 1.75 0 0 0 1.75-1.75V7.5Z" />
      <path d="M14 2.75V7.5h4.75" />
      <path d="M8.75 12.5h6.5M8.75 16h4.5" />
    </Rajz>
  );
}

export function IkonTobb(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </Rajz>
  );
}

export function IkonIngatlanok(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <path d="M3.75 20.5V6.25L11 3.5v17" />
      <path d="M11 9.75h6.75a1.5 1.5 0 0 1 1.5 1.5V20.5" />
      <path d="M2.5 20.5h19" />
      <path d="M6.75 9.5h1.5M6.75 13.5h1.5M14.5 13.5h1.5M14.5 16.75h1.5" />
    </Rajz>
  );
}

export function IkonBerlok(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <circle cx="9.25" cy="8.25" r="3.25" />
      <path d="M2.75 20.25c0-3.2 2.9-5.5 6.5-5.5s6.5 2.3 6.5 5.5" />
      <path d="M16.25 5.4a3.25 3.25 0 0 1 0 5.7" />
      <path d="M18 15.3c2.05.7 3.5 2.4 3.5 4.95" />
    </Rajz>
  );
}

export function IkonHibak(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <path d="M14.9 6.1a3.9 3.9 0 0 1 5.1 5.1l-8.6 8.6a2.3 2.3 0 0 1-3.2-3.2Z" />
      <path d="M14.9 6.1 9.6 3.5 3.5 9.6l2.6 5.3" />
    </Rajz>
  );
}

export function IkonAdo(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <rect x="4.75" y="2.75" width="14.5" height="18.5" rx="2.25" />
      <path d="M8.5 7h7" />
      <path d="M8.75 11.5h.01M12 11.5h.01M15.25 11.5h.01M8.75 15h.01M12 15h.01M15.25 15v3.25M8.75 18.25h3.25" />
    </Rajz>
  );
}

export function IkonBeallitasok(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.4a1.6 1.6 0 0 0 .32 1.77l.06.06a1.95 1.95 0 1 1-2.76 2.76l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47v.17a1.95 1.95 0 1 1-3.9 0v-.09a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a1.95 1.95 0 1 1-2.76-2.76l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H3.4a1.95 1.95 0 1 1 0-3.9h.09a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a1.95 1.95 0 1 1 2.76-2.76l.06.06a1.6 1.6 0 0 0 1.77.32h.08a1.6 1.6 0 0 0 .97-1.47V3.4a1.95 1.95 0 1 1 3.9 0v.09a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a1.95 1.95 0 1 1 2.76 2.76l-.06.06a1.6 1.6 0 0 0-.32 1.77v.08a1.6 1.6 0 0 0 1.47.97h.17a1.95 1.95 0 1 1 0 3.9h-.09a1.6 1.6 0 0 0-1.46.97Z" />
    </Rajz>
  );
}

export function IkonBerlemenyem(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <circle cx="8" cy="14.5" r="3.5" />
      <path d="M10.6 12.1 20 2.75" />
      <path d="M17.25 5.5 19.5 7.75M14.75 8l2.25 2.25" />
    </Rajz>
  );
}

export function IkonBetekinto(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <path d="M2.5 12S6 5.75 12 5.75 21.5 12 21.5 12 18 18.25 12 18.25 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </Rajz>
  );
}

export function IkonAdataim(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.5 20.5c0-3.6 3.35-6.25 7.5-6.25s7.5 2.65 7.5 6.25" />
    </Rajz>
  );
}

export function IkonHibabejelentes(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <path d="M12 3.25 21.5 20H2.5Z" />
      <path d="M12 9.75v4.5M12 17.25h.01" />
    </Rajz>
  );
}

export function IkonKilepes(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <path d="M14.5 3.75H18A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25h-3.5" />
      <path d="M10 16.5 14.5 12 10 7.5" />
      <path d="M14.5 12h-11" />
    </Rajz>
  );
}

export function IkonNyil(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <path d="M9 5.5 15.5 12 9 18.5" />
    </Rajz>
  );
}

export function IkonJegyzokonyv(t: IkonTulajdonsagok) {
  return (
    <Rajz {...t}>
      <rect x="3" y="4.75" width="18" height="14.5" rx="2.25" />
      <circle cx="9.25" cy="10" r="1.75" />
      <path d="M3 16.5 8 12l3.5 3 3-2.5L21 18" />
    </Rajz>
  );
}

/** A navigáció ikonjai útvonal szerint, hogy a menü adatból épülhessen. */
export const IKON_UTVONAL: Record<
  string,
  (t: IkonTulajdonsagok) => React.ReactElement
> = {
  "/": IkonAttekinto,
  "/ingatlanok": IkonIngatlanok,
  "/berlok": IkonBerlok,
  "/befizetesek": IkonBefizetesek,
  "/rezsi": IkonRezsi,
  "/hibak": IkonHibak,
  "/dokumentumok": IkonDokumentumok,
  "/ado": IkonAdo,
  "/beallitasok": IkonBeallitasok,
  "/berlo": IkonBerlemenyem,
  "/berlo/hibak": IkonHibabejelentes,
  "/berlo/dokumentumok": IkonDokumentumok,
  "/berlo/jegyzokonyvek": IkonJegyzokonyv,
  "/berlo/betekinto": IkonBetekinto,
  "/berlo/adatok": IkonAdataim,
};
