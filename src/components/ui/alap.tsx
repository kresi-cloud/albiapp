import Link from "next/link";
import { IkonNyil } from "./ikonok";

/**
 * A felület alapelemei: kártya, gomb, jelzőcímke, összeg, lapfej, súgó.
 *
 * Miért egy helyen: eddig minden lap a saját kezével rakta össze a kártyáját
 * és a gombját, és ettől három különböző gomb élt egymás mellett ugyanazon a
 * lapon — fekete tömör, fehér keretes és aláhúzott szöveg —, anélkül hogy a
 * különbség bármit jelentett volna. Itt a gomb súlya döntés: egy lapon egy
 * elsődleges gomb van, az a művelet, amiért a lap létezik; minden más
 * másodlagos vagy halk.
 *
 * A színeket az `globals.css` jelentés szerinti nevei adják (`felulet`,
 * `keret`, `halvany`, `rendben`, `figyelem`, `gond`), ezért itt sehol nincs
 * `dark:` páros: a sötét mód magától következik.
 */

/* ------------------------------------------------------------------ Kártya */

export function Kartya({
  children,
  allapot = "semleges",
  osztaly = "",
}: {
  children: React.ReactNode;
  allapot?: Allapotszin;
  osztaly?: string;
}) {
  return (
    <div
      className={`rounded-kartya border bg-felulet ${KARTYA_SZIN[allapot]} ${osztaly}`}
    >
      {children}
    </div>
  );
}

/**
 * Kártya, ami egészében hivatkozás.
 *
 * Telefonon a kártya sarkába tett „Megnézem” link akkora célpont, amit ujjal
 * el kell találni; ha maga a kártya visz tovább, nincs mit eltalálni. A nyíl
 * a jobb szélen jelzi, hogy van hová menni.
 */
export function KartyaHivatkozas({
  href,
  children,
  allapot = "semleges",
}: {
  href: string;
  children: React.ReactNode;
  allapot?: Allapotszin;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-kartya border bg-felulet p-4 transition-colors hover:border-keret-eros ${KARTYA_SZIN[allapot]}`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <IkonNyil
        meret={18}
        osztaly="mt-0.5 shrink-0 text-nagyon-halvany transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

/* ------------------------------------------------------------------- Színek */

export type Allapotszin = "semleges" | "rendben" | "figyelem" | "gond";

const KARTYA_SZIN: Record<Allapotszin, string> = {
  semleges: "border-keret",
  rendben: "border-rendben-keret",
  figyelem: "border-figyelem-keret",
  gond: "border-gond-keret",
};

const JELZO_SZIN: Record<Allapotszin, string> = {
  semleges: "bg-felulet-halk text-halvany",
  rendben: "bg-rendben-lap text-rendben",
  figyelem: "bg-figyelem-lap text-figyelem",
  gond: "bg-gond-lap text-gond",
};

/* -------------------------------------------------------------------- Jelző */

/** Rövid állapotcímke: egyezik, hiányzik, vitás. */
export function Jelzo({
  allapot = "semleges",
  children,
}: {
  allapot?: Allapotszin;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${JELZO_SZIN[allapot]}`}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------------- Gomb */

export type Gombsuly = "elsodleges" | "masodlagos" | "halk" | "veszelyes";

const GOMB_SZIN: Record<Gombsuly, string> = {
  elsodleges:
    "bg-albi-700 text-white hover:bg-albi-800 active:bg-albi-900 border border-transparent",
  masodlagos:
    "bg-felulet text-szoveg border border-keret-eros hover:bg-felulet-halk",
  halk: "bg-transparent text-halvany border border-transparent hover:bg-felulet-halk hover:text-szoveg",
  veszelyes: "bg-transparent text-gond border border-gond-keret hover:bg-gond-lap",
};

/**
 * A gomb magassága mindenhol legalább 44 képpont: ez az a méret, amit ujjal
 * biztosan el lehet találni. A `halk` az egyetlen kivétel, az szövegben áll.
 */
const GOMB_ALAP =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function gombOsztaly(suly: Gombsuly = "masodlagos", tovabbi = "") {
  return `${GOMB_ALAP} ${GOMB_SZIN[suly]} ${tovabbi}`;
}

export function Gomb({
  suly = "masodlagos",
  osztaly = "",
  ...tovabbi
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  suly?: Gombsuly;
  osztaly?: string;
}) {
  return <button className={gombOsztaly(suly, osztaly)} {...tovabbi} />;
}

export function GombHivatkozas({
  href,
  suly = "masodlagos",
  osztaly = "",
  children,
}: {
  href: string;
  suly?: Gombsuly;
  osztaly?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={gombOsztaly(suly, osztaly)}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------- Összeg */

/**
 * Pénzösszeg kiírása.
 *
 * A szám ebben az alkalmazásban a lényeg, ezért kap saját súlyt és azonos
 * szélességű számjegyeket: egy lista összegei így egymás alatt összemérhetők,
 * és nem ugrál a tizedespont.
 */
export function Osszeg({
  ertek,
  meret = "kozepes",
  szin = "semleges",
}: {
  ertek: string;
  meret?: "kicsi" | "kozepes" | "nagy";
  szin?: Allapotszin;
}) {
  const meretek = {
    kicsi: "text-sm font-semibold",
    kozepes: "text-lg font-semibold",
    nagy: "text-3xl font-bold tracking-tight",
  };
  const szinek: Record<Allapotszin, string> = {
    semleges: "text-szoveg",
    rendben: "text-rendben",
    figyelem: "text-figyelem",
    gond: "text-gond",
  };
  return (
    <span className={`szam ${meretek[meret]} ${szinek[szin]}`}>{ertek}</span>
  );
}

/** Egy szám és a neve, összegzősávban. */
export function Mutato({
  cimke,
  ertek,
  szin = "semleges",
  hivatkozas,
}: {
  cimke: string;
  ertek: string;
  szin?: Allapotszin;
  hivatkozas?: string;
}) {
  const belso = (
    <>
      <div className="text-xs leading-tight font-medium text-halvany">{cimke}</div>
      <div className="mt-1">
        <Osszeg ertek={ertek} meret="kozepes" szin={szin} />
      </div>
    </>
  );

  if (hivatkozas) {
    return (
      <Link
        href={hivatkozas}
        className="rounded-lg border border-keret bg-felulet px-3 py-2.5 transition-colors hover:border-keret-eros"
      >
        {belso}
      </Link>
    );
  }
  return (
    <div className="rounded-lg border border-keret bg-felulet px-3 py-2.5">
      {belso}
    </div>
  );
}

/* -------------------------------------------------------------------- Lapfej */

/** A lap címe és egy mondat arról, mire való. Hosszabb magyarázat a `Sugo`-ba. */
export function Lapfej({
  cim,
  alcim,
  muvelet,
}: {
  cim: string;
  alcim?: string;
  muvelet?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">
          {cim}
        </h1>
        {alcim ? (
          <p className="mt-1 text-sm leading-snug text-halvany text-pretty">
            {alcim}
          </p>
        ) : null}
      </div>
      {muvelet ? <div className="shrink-0">{muvelet}</div> : null}
    </div>
  );
}

/**
 * Összecsukott magyarázat.
 *
 * A lapok tetején eddig három bekezdésnyi tájékoztató állt, amit az első
 * használat után soha többé nem olvas el senki, viszont minden megnyitáskor
 * elvette a képernyő felét. Ugyanaz a szöveg itt egy sorban áll, és aki
 * kíváncsi rá, kinyitja. Natív `details`, tehát kiszolgáló nélkül is működik.
 */
export function Sugo({
  cim,
  children,
}: {
  cim: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-keret bg-felulet-halk">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-medium text-halvany">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-keret-eros text-xs">
          ?
        </span>
        <span className="min-w-0 flex-1">{cim}</span>
        <IkonNyil
          meret={16}
          osztaly="shrink-0 rotate-90 transition-transform group-open:-rotate-90"
        />
      </summary>
      <div className="grid gap-2 px-3 pt-1 pb-3 text-sm leading-relaxed text-halvany">
        {children}
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------- Szakasz */

/** Szakaszcím a lapon belül. */
export function Szakaszcim({
  children,
  mellette,
}: {
  children: React.ReactNode;
  mellette?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-base font-bold tracking-tight">
        {children}
      </h2>
      {mellette ? (
        <span className="shrink-0 text-xs text-halvany">{mellette}</span>
      ) : null}
    </div>
  );
}

/** Üres állapot: nem hibaüzenet, hanem nyugtázás, hogy nincs teendő. */
export function Ures({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-kartya border border-dashed border-keret px-4 py-6 text-center text-sm text-halvany">
      {children}
    </p>
  );
}
