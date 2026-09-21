import type { Metadata } from "next";
import Link from "next/link";
import { Nyelvvalto } from "@/components/Nyelvvalto";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { kilep } from "./belepes/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Albi",
  description: "Bérbeadás egy helyen: befizetés, rezsi, elszámolás.",
};

const BERBEADO_MENU = [
  { kulcs: "nav.attekinto", utvonal: "/" },
  { kulcs: "nav.ingatlanok", utvonal: "/ingatlanok" },
  { kulcs: "nav.berlok", utvonal: "/berlok" },
  { kulcs: "nav.befizetesek", utvonal: "/befizetesek" },
  { kulcs: "nav.rezsi", utvonal: "/rezsi" },
  { kulcs: "nav.hibak", utvonal: "/hibak" },
  { kulcs: "nav.dokumentumok", utvonal: "/dokumentumok" },
  { kulcs: "nav.ado", utvonal: "/ado" },
  { kulcs: "nav.beallitasok", utvonal: "/beallitasok" },
];

const BERLO_MENU = [
  { kulcs: "nav.berlemenyem", utvonal: "/berlo" },
  { kulcs: "nav.hibabejelentes", utvonal: "/berlo/hibak" },
  { kulcs: "nav.dokumentumaim", utvonal: "/berlo/dokumentumok" },
  { kulcs: "nav.betekinto", utvonal: "/berlo/betekinto" },
  { kulcs: "nav.adataim", utvonal: "/berlo/adatok" },
];

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const felhasznalo = await belepettFelhasznalo();
  const { nyelv, sz } = await szovegek();

  const menu = !felhasznalo
    ? []
    : felhasznalo.szerep === "berlo"
      ? BERLO_MENU
      : BERBEADO_MENU;

  return (
    <html lang={nyelv}>
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
        <header className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
            <Link
              href={felhasznalo?.szerep === "berlo" ? "/berlo" : "/"}
              className="text-lg font-semibold tracking-tight"
            >
              Albi
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {menu.map((elem) => (
                <Link
                  key={elem.utvonal}
                  href={elem.utvonal}
                  className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                  {sz(elem.kulcs)}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <Nyelvvalto nyelv={nyelv} cimke={sz("nav.nyelv")} />
              {felhasznalo ? (
                <form action={kilep}>
                  <button
                    type="submit"
                    className="text-sm text-stone-600 underline underline-offset-2 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                  >
                    {sz("nav.kilepes")}
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 pb-8 text-xs text-stone-500 dark:text-stone-400">
          <nav className="flex flex-wrap gap-4">
            <Link href="/jogi/adatkezeles" className="underline underline-offset-2">
              {sz("jogi.adatkezeles")}
            </Link>
            <Link href="/jogi/feltetelek" className="underline underline-offset-2">
              {sz("jogi.feltetelek")}
            </Link>
          </nav>
          <p className="mt-2">{sz("jogi.lablec")}</p>
        </footer>
      </body>
    </html>
  );
}
