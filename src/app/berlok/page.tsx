import { datum, forint } from "@/domain/penz";
import { meghivoAllapota } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { MeghivoGomb } from "./MeghivoGomb";
import { BerloAdatok, BerloHozzaadas, BerloTorles } from "./Urlapok";

export const dynamic = "force-dynamic";

function napSzoveg(nap: Date | null): string {
  return nap ? nap.toISOString().slice(0, 10) : "";
}

export default async function Berlok() {
  const berbeado = await kotelezoSzerep("berbeado");
  const most = new Date();

  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId: berbeado.id } },
    include: {
      ingatlan: true,
      berlok: {
        orderBy: { sorrend: "asc" },
        include: {
          berlo: true,
          meghivok: { orderBy: { letrehozva: "desc" } },
        },
      },
    },
    orderBy: { letrehozva: "asc" },
  });

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Bérlők</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Egy bérleményhez több bérlő is tartozhat. A bérleti díj ilyenkor is egy
          előírás marad: a bérlők egyetemlegesen felelnek érte, és bármelyikük
          fizetése a többit is mentesíti. A bérlő meghívó linkkel készít magának
          díjmentes fiókot, amelyben csak a saját bérleményét látja.
        </p>
      </section>

      <ul className="grid gap-4">
        {jogviszonyok.map((jogviszony) => (
          <li
            key={jogviszony.id}
            className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
          >
            <h2 className="font-semibold">{jogviszony.ingatlan.megnevezes}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {forint(jogviszony.berletiDijFt)} / hó · a hónap {jogviszony.fizetesiNap}. napjára ·{" "}
              {jogviszony.berlok.length === 1
                ? "egy bérlő"
                : `${jogviszony.berlok.length} bérlő, egyetemleges felelősséggel`}
            </p>

            <ul className="mt-3 grid gap-4">
              {jogviszony.berlok.map((berlo) => {
                const eloMeghivo = berlo.meghivok.find(
                  (meghivo) => meghivoAllapota(meghivo, most) === "ervenyes",
                );

                return (
                  <li
                    key={berlo.id}
                    className="border-t border-stone-200 pt-3 first:border-0 first:pt-0 dark:border-stone-800"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-medium">{berlo.nev}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          berlo.berloId
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                        }`}
                      >
                        {berlo.berloId ? "Van fiókja" : "Még nincs fiókja"}
                      </span>
                    </div>

                    {berlo.berloId ? (
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                        Belépett fiókkal használja az oldalt: {berlo.berlo?.email}
                      </p>
                    ) : (
                      <>
                        {eloMeghivo ? (
                          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                            Él egy meghívó {eloMeghivo.email} címre, {datum(eloMeghivo.lejar)}-ig. Ha
                            újat készítesz, a régi link azonnal érvénytelen lesz.
                          </p>
                        ) : null}
                        <MeghivoGomb
                          jogviszonyBerloId={berlo.id}
                          email={berlo.email ?? ""}
                          cimke={eloMeghivo ? "Új meghívó készítése" : "Meghívó készítése"}
                        />
                      </>
                    )}

                    <BerloAdatok
                      berlo={{
                        id: berlo.id,
                        nev: berlo.nev,
                        email: berlo.email ?? "",
                        szuletesiHely: berlo.szuletesiHely ?? "",
                        szuletesiIdo: napSzoveg(berlo.szuletesiIdo),
                        anyjaNeve: berlo.anyjaNeve ?? "",
                        lakcim: berlo.lakcim ?? "",
                        igazolvanySzam: berlo.igazolvanySzam ?? "",
                      }}
                    />

                    {jogviszony.berlok.length > 1 ? (
                      <BerloTorles jogviszonyBerloId={berlo.id} nev={berlo.nev} />
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <BerloHozzaadas jogviszonyId={jogviszony.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
