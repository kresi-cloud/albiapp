import { Hibakartya } from "@/components/Hibakartya";
import { nyitott } from "@/domain/hibabejelentes";
import { prisma } from "@/lib/db";
import { berbeadoHibai } from "@/lib/hibabejelentes";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { aktualisNyelv, szovegek } from "@/lib/nyelv";
import { HibaBejelentes } from "./Urlapok";

export const dynamic = "force-dynamic";

export default async function Hibak() {
  const berbeado = await kotelezoSzerep("berbeado");
  const nyelv = await aktualisNyelv();
  const { sz } = await szovegek();
  const ma = new Date();

  const [hibak, jogviszonyok] = await Promise.all([
    berbeadoHibai(berbeado.id),
    prisma.jogviszony.findMany({
      where: { ingatlan: { tulajdonosId: berbeado.id } },
      include: { ingatlan: true },
      orderBy: { letrehozva: "asc" },
    }),
  ]);

  const nyitottak = hibak.filter((hiba) => nyitott(hiba.allapot));
  const lezartak = hibak.filter((hiba) => !nyitott(hiba.allapot));

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">{sz("hibak.cim")}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">{sz("hibak.bevezeto")}</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          {nyitottak.length > 0
            ? sz("hibak.nyitottak_darab", { darab: nyitottak.length })
            : sz("hibak.nyitottak")}
        </h2>
        {nyitottak.length === 0 ? (
          <p className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
            {sz("hibak.nincs_nyitott")}
          </p>
        ) : (
          <ul className="grid gap-3">
            {nyitottak.map((hiba) => (
              <Hibakartya
                key={hiba.id}
                hiba={hiba}
                szerep="berbeado"
                ma={ma}
                nyelv={nyelv}
                berlemenyCimke={`${hiba.jogviszonyCimke} · ${hiba.berlokNeve}`}
              />
            ))}
          </ul>
        )}
      </section>

      {/*
        A lezárt bejelentések csak gyűlnek, és nincs velük dolga senkinek. A
        nyitottak viszont pont azért vannak itt, hogy elöl legyenek: egy év
        után a lezártak alá temetve nem lennének azok.
      */}
      {lezartak.length > 0 ? (
        <details className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <summary className="cursor-pointer font-medium">
            {sz("hibak.lezartak", { darab: lezartak.length })}
          </summary>
          <ul className="mt-3 grid gap-3">
            {lezartak.map((hiba) => (
              <Hibakartya
                key={hiba.id}
                hiba={hiba}
                szerep="berbeado"
                ma={ma}
                nyelv={nyelv}
                berlemenyCimke={`${hiba.jogviszonyCimke} · ${hiba.berlokNeve}`}
              />
            ))}
          </ul>
        </details>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold">{sz("hibak.sajat_cim")}</h2>
        <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">{sz("hibak.sajat_sugo")}</p>
        <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <HibaBejelentes
            nyelv={nyelv}
            jogviszonyok={jogviszonyok.map((jogviszony) => ({
              id: jogviszony.id,
              cimke: jogviszony.ingatlan.megnevezes,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
