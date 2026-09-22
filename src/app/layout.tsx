import type { Metadata } from "next";
import Link from "next/link";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { kilep } from "./belepes/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Albi",
  description: "Bérbeadás egy helyen: befizetés, rezsi, elszámolás.",
};

const BERBEADO_MENU = [
  { cim: "Áttekintő", utvonal: "/" },
  { cim: "Ingatlanok", utvonal: "/ingatlanok" },
  { cim: "Bérlők", utvonal: "/berlok" },
  { cim: "Befizetések", utvonal: "/befizetesek" },
  { cim: "Rezsi", utvonal: "/rezsi" },
  { cim: "Szerződések", utvonal: "/szerzodesek" },
  { cim: "Adó", utvonal: "/ado" },
  { cim: "Beállítások", utvonal: "/beallitasok" },
];

const BERLO_MENU = [{ cim: "Bérleményem", utvonal: "/berlo" }];

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const felhasznalo = await belepettFelhasznalo();
  const menu = !felhasznalo
    ? []
    : felhasznalo.szerep === "berlo"
      ? BERLO_MENU
      : BERBEADO_MENU;

  return (
    <html lang="hu">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
        <header className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
            <Link href={felhasznalo?.szerep === "berlo" ? "/berlo" : "/"} className="text-lg font-semibold tracking-tight">
              Albi
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {menu.map((elem) => (
                <Link
                  key={elem.utvonal}
                  href={elem.utvonal}
                  className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                  {elem.cim}
                </Link>
              ))}
            </nav>
            {felhasznalo ? (
              <form action={kilep} className="ml-auto">
                <button
                  type="submit"
                  className="text-sm text-stone-600 underline underline-offset-2 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                  Kilépés
                </button>
              </form>
            ) : null}
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
