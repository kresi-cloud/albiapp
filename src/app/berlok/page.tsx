import { datum, forint } from "@/domain/penz";
import { meghivoAllapota } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { MeghivoGomb } from "./MeghivoGomb";

export const dynamic = "force-dynamic";

export default async function Berlok() {
  const berbeado = await kotelezoSzerep("berbeado");
  const most = new Date();

  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId: berbeado.id } },
    include: {
      ingatlan: true,
      berlo: true,
      meghivok: { orderBy: { letrehozva: "desc" } },
    },
    orderBy: { letrehozva: "asc" },
  });

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Bérlők</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          A bérlő meghívó linkkel készít magának fiókot. A fiók díjmentes, és
          csak a saját bérleményét látja benne.
        </p>
      </section>

      <ul className="grid gap-3">
        {jogviszonyok.map((jogviszony) => {
          const eloMeghivo = jogviszony.meghivok.find(
            (meghivo) => meghivoAllapota(meghivo, most) === "ervenyes",
          );

          return (
            <li
              key={jogviszony.id}
              className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold">{jogviszony.berloNev}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    jogviszony.berloId
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                  }`}
                >
                  {jogviszony.berloId ? "Van fiókja" : "Még nincs fiókja"}
                </span>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-400">
                {jogviszony.ingatlan.megnevezes} · {forint(jogviszony.berletiDijFt)} / hó ·
                a hónap {jogviszony.fizetesiNap}. napjára
              </p>

              {jogviszony.berloId ? (
                <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
                  Belépett fiókkal használja az oldalt: {jogviszony.berlo?.email}
                </p>
              ) : (
                <>
                  {eloMeghivo ? (
                    <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
                      Él egy meghívó {eloMeghivo.email} címre, {datum(eloMeghivo.lejar)}-ig. Ha
                      újat készítesz, a régi link azonnal érvénytelen lesz.
                    </p>
                  ) : null}
                  <MeghivoGomb
                    jogviszonyId={jogviszony.id}
                    email={jogviszony.berloEmail ?? ""}
                    cimke={eloMeghivo ? "Új meghívó készítése" : "Meghívó készítése"}
                  />
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
