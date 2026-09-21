import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { forintNyelven } from "@/domain/nyelv";
import { szovegek } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

export default async function Ingatlanok() {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz , nyelv } = await szovegek();
  const ft = (osszegFt: number) => forintNyelven(osszegFt, nyelv);

  const ingatlanok = await prisma.ingatlan.findMany({
    where: { tulajdonosId: berbeado.id },
    include: { meroorak: true, jogviszonyok: true },
    orderBy: { letrehozva: "asc" },
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{sz("ingatlanok.cim")}</h1>

      {ingatlanok.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">{sz("ingatlanok.nincs")}</p>
      ) : (
        <ul className="grid gap-3">
          {ingatlanok.map((ingatlan) => (
            <li
              key={ingatlan.id}
              className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
            >
              <h2 className="font-semibold">{ingatlan.megnevezes}</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400">{ingatlan.cim}</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <Adat
                  cimke={sz("ingatlanok.alapterulet")}
                  ertek={ingatlan.alapteruletM2 ? `${ingatlan.alapteruletM2} m²` : "—"}
                />
                <Adat
                  cimke={sz("ingatlanok.kozos_koltseg")}
                  ertek={ingatlan.kozosKoltsegFt ? ft(ingatlan.kozosKoltsegFt) : "—"}
                />
                <Adat cimke={sz("ingatlanok.meroora")} ertek={String(ingatlan.meroorak.length)} />
                <Adat
                  cimke={sz("ingatlanok.jogviszony")}
                  ertek={String(ingatlan.jogviszonyok.length)}
                />
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Adat({ cimke, ertek }: { cimke: string; ertek: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {cimke}
      </dt>
      <dd className="tabular-nums">{ertek}</dd>
    </div>
  );
}
