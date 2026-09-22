import Link from "next/link";
import { datum, forint } from "@/domain/penz";
import { nevsor } from "@/domain/szerzodes";
import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { UjSzerzodes } from "./Urlapok";

export const dynamic = "force-dynamic";

export default async function Szerzodesek() {
  const berbeado = await kotelezoSzerep("berbeado");

  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId: berbeado.id } },
    include: {
      ingatlan: true,
      berlok: { orderBy: { sorrend: "asc" } },
      szerzodesek: { orderBy: { letrehozva: "desc" }, include: { modulok: true } },
    },
    orderBy: { letrehozva: "asc" },
  });

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Szerződések</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          A szerződés modulokból áll: a kötelező pontok mindig benne vannak, a
          többit te kapcsolod be. A bérlemény, a bérleti díj, a bérlők és az
          óvadék abból jön, amit már felvettél, ezért nem kell kétszer megadni, és
          nem térhet el a befizetés-egyeztetéstől.
        </p>
      </section>

      {jogviszonyok.map((jogviszony) => (
        <section
          key={jogviszony.id}
          className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
        >
          <h2 className="font-semibold">{jogviszony.ingatlan.megnevezes}</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {jogviszony.berlok.length === 0
              ? "Még nincs bérlő felvéve"
              : nevsor(jogviszony.berlok.map((berlo) => berlo.nev))}{" "}
            · {forint(jogviszony.berletiDijFt)} / hó
          </p>

          {jogviszony.szerzodesek.length > 0 ? (
            <ul className="mt-3 grid gap-2">
              {jogviszony.szerzodesek.map((szerzodes) => (
                <li
                  key={szerzodes.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-t border-stone-200 pt-2 first:border-0 first:pt-0 dark:border-stone-800"
                >
                  <Link
                    href={`/szerzodesek/${szerzodes.id}`}
                    className="font-medium underline underline-offset-2"
                  >
                    {szerzodes.megnevezes}
                  </Link>
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    {szerzodes.allapot === "veglegesitve" && szerzodes.veglegesitve
                      ? `véglegesítve ${datum(szerzodes.veglegesitve)}`
                      : `tervezet · ${szerzodes.modulok.length} választott modul`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
              Ehhez a jogviszonyhoz még nincs szerződés.
            </p>
          )}

          <UjSzerzodes jogviszonyId={jogviszony.id} />
        </section>
      ))}
    </div>
  );
}
