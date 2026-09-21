import type { Metadata, Viewport } from "next";
import { Figtree, Inter } from "next/font/google";
import Link from "next/link";
import { Nyelvvalto } from "@/components/Nyelvvalto";
import { Fulsav, type Fulelem } from "@/components/ui/Fulsav";
import { Nevhuzas } from "@/components/ui/Jel";
import { IKON_UTVONAL, IkonKilepes } from "@/components/ui/ikonok";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { kilep } from "./belepes/actions";
import "./globals.css";

/**
 * A betűtípusok.
 *
 * Az Inter a szövegé: a magyar ékezetek — az ő és az ű — hibátlanok benne, és
 * azonos szélességű számjegyei vannak, ami ebben az alkalmazásban nem
 * részletkérdés, mert végig összegek állnak egymás alatt. A Figtree a
 * címeké: valamivel melegebb és kerekebb, ettől lesz az alkalmazásnak saját
 * hangja a hazai mezőny egyforma kékjei között. Kettőnél több betűtípus már
 * zaj lenne.
 */
const szovegBetu = Inter({
  subsets: ["latin-ext"],
  variable: "--betutipus-szoveg",
  display: "swap",
});

const cimBetu = Figtree({
  subsets: ["latin-ext"],
  weight: ["700", "800"],
  variable: "--betutipus-cim",
  display: "swap",
});

/** A lap címe és leírása a választott nyelven: ezt a böngésző és a megosztás mutatja. */
export async function generateMetadata(): Promise<Metadata> {
  const { sz } = await szovegek();
  return { title: "Albi", description: sz("alkalmazas.leiras") };
}

/**
 * A színsáv a telefon állapotsorát is befesti, hogy az alkalmazás ne egy
 * weblapnak látsszon egy fehér csíkkal a tetején. A `viewportFit` a kávás
 * telefonok alsó csúszkája miatt kell: a fülsáv így nem kerül alá.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1917" },
  ],
  viewportFit: "cover",
};

/**
 * A menü két részre oszlik.
 *
 * Az első négy az, amit hetente elővesz valaki: az áttekintő a belépés helye,
 * a befizetés-egyeztetés és a rezsi a termék két megkülönböztető funkciója, az
 * üzenetek pedig az egyetlen hely, ahová magától érkezik valami. A többi — az
 * ingatlan- és bérlőnyilvántartás, a dokumentumtár, a hibák, az adóösszesítő,
 * a beállítások — ritkább, és a „Több” alatt van. Telefonon ez a felosztás
 * dönti el, mi fér az alsó sávba; nagyobb kijelzőn mind a tíz kifér a
 * fejlécbe, ott nincs jelentősége.
 *
 * Az iratok azért kerültek a „Több” alá, mert a dokumentumtárat akkor nyitja
 * meg valaki, amikor éppen kell egy papír — az üzenetekbe viszont a másik fél
 * ír, és az elmaradt válasz drágább, mint egy kattintással messzebb került
 * szerződés.
 */
const BERBEADO_FULEK = [
  { kulcs: "ful.attekinto", utvonal: "/" },
  { kulcs: "ful.befizetesek", utvonal: "/befizetesek" },
  { kulcs: "ful.rezsi", utvonal: "/rezsi" },
  { kulcs: "ful.uzenetek", utvonal: "/beszelgetesek" },
];

const BERBEADO_TOBBI = [
  { kulcs: "nav.dokumentumok", utvonal: "/dokumentumok" },
  { kulcs: "nav.ingatlanok", utvonal: "/ingatlanok" },
  { kulcs: "nav.berlok", utvonal: "/berlok" },
  { kulcs: "nav.hibak", utvonal: "/hibak" },
  { kulcs: "nav.ado", utvonal: "/ado" },
  { kulcs: "nav.beallitasok", utvonal: "/beallitasok" },
];

const BERLO_FULEK = [
  { kulcs: "ful.berlemenyem", utvonal: "/berlo" },
  { kulcs: "ful.hibabejelentes", utvonal: "/berlo/hibak" },
  { kulcs: "ful.uzenetek", utvonal: "/beszelgetesek" },
  { kulcs: "ful.betekinto", utvonal: "/berlo/betekinto" },
];

const BERLO_TOBBI = [
  { kulcs: "nav.dokumentumaim", utvonal: "/berlo/dokumentumok" },
  { kulcs: "nav.jegyzokonyveim", utvonal: "/berlo/jegyzokonyvek" },
  { kulcs: "nav.adataim", utvonal: "/berlo/adatok" },
];

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const felhasznalo = await belepettFelhasznalo();
  const { nyelv, sz } = await szovegek();

  const berlo = felhasznalo?.szerep === "berlo";
  const fulek: Fulelem[] = !felhasznalo
    ? []
    : (berlo ? BERLO_FULEK : BERBEADO_FULEK).map((elem) => ({
        ...elem,
        cimke: sz(elem.kulcs),
      }));
  const tobbi: Fulelem[] = !felhasznalo
    ? []
    : (berlo ? BERLO_TOBBI : BERBEADO_TOBBI).map((elem) => ({
        ...elem,
        cimke: sz(elem.kulcs),
      }));

  const kilepesGomb = felhasznalo ? (
    <form action={kilep}>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-halvany transition-colors hover:text-szoveg"
      >
        <IkonKilepes meret={18} />
        {sz("nav.kilepes")}
      </button>
    </form>
  ) : null;

  return (
    <html lang={nyelv} className={`${szovegBetu.variable} ${cimBetu.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <header className="sticky top-0 z-30 border-b border-keret bg-felulet/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-2.5">
            <Link href={berlo ? "/berlo" : "/"} className="shrink-0">
              <Nevhuzas />
            </Link>

            {/* Nagyobb kijelzőn mind a kilenc hely kifér ide; telefonon az alsó
                fülsáv veszi át a szerepét, ezért itt el van rejtve. */}
            <nav className="hidden min-w-0 flex-1 flex-wrap items-center gap-x-1 md:flex">
              {[...fulek, ...tobbi].map((elem) => {
                const Ikon = IKON_UTVONAL[elem.utvonal];
                return (
                  <Link
                    key={elem.utvonal}
                    href={elem.utvonal}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-halvany transition-colors hover:bg-felulet-halk hover:text-szoveg"
                  >
                    {Ikon ? <Ikon meret={16} /> : null}
                    {elem.cimke}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Nyelvvalto nyelv={nyelv} cimke={sz("nav.nyelv")} />
              <span className="hidden md:inline">{kilepesGomb}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>

        <footer
          className={`mx-auto max-w-5xl px-4 text-xs text-nagyon-halvany ${felhasznalo ? "also-sav-helye md:pb-6" : "pb-6"}`}
        >
          <nav className="flex flex-wrap gap-4">
            <Link href="/jogi/adatkezeles" className="hover:text-halvany">
              {sz("jogi.adatkezeles")}
            </Link>
            <Link href="/jogi/feltetelek" className="hover:text-halvany">
              {sz("jogi.feltetelek")}
            </Link>
          </nav>
          <p className="mt-2">{sz("jogi.lablec")}</p>
        </footer>

        {felhasznalo ? (
          <Fulsav
            fulek={fulek}
            tobbi={tobbi}
            tobbCimke={sz("nav.tobb")}
            bezarasCimke={sz("nav.bezaras")}
            lablec={kilepesGomb}
          />
        ) : null}
      </body>
    </html>
  );
}
