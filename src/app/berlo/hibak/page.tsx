import { Hibakartya } from "@/components/Hibakartya";
import { nyitott } from "@/domain/hibabejelentes";
import { szovegekNyelvvel } from "@/domain/szotar";
import { prisma } from "@/lib/db";
import { berbeadoElerhetosege, berloHibai } from "@/lib/hibabejelentes";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";
import { HibaBejelentes } from "@/app/hibak/Urlapok";

export const dynamic = "force-dynamic";

/** A bérlő hibabejelentései: ugyanazok a kártyák, csak a saját lépéseivel. */
export default async function BerloiHibak() {
  const berlo = await kotelezoSzerep("berlo");
  const nyelv = await aktualisNyelv();
  const { sz } = szovegekNyelvvel(nyelv);
  const ma = new Date();

  const [hibak, jogviszonyok] = await Promise.all([
    berloHibai(berlo.id),
    prisma.jogviszony.findMany({
      where: { berlok: { some: { berloId: berlo.id } } },
      include: { ingatlan: true },
      orderBy: { letrehozva: "asc" },
    }),
  ]);

  const elerhetosegek = await Promise.all(
    jogviszonyok.map(async (jogviszony) => ({
      jogviszony,
      berbeado: await berbeadoElerhetosege(jogviszony.id),
    })),
  );

  const nyitottak = hibak.filter((hiba) => nyitott(hiba.allapot));
  const lezartak = hibak.filter((hiba) => !nyitott(hiba.allapot));

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">{sz("hiba.oldal.cim")}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">{sz("hiba.oldal.bevezeto")}</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{sz("hiba.oldal.uj")}</h2>
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

      <section>
        <h2 className="mb-3 text-lg font-semibold">{sz("hiba.oldal.elerhetoseg")}</h2>
        <ul className="grid gap-2">
          {elerhetosegek.map(({ jogviszony, berbeado }) => (
            <li
              key={jogviszony.id}
              className="rounded-lg border border-stone-200 bg-white p-4 text-sm dark:border-stone-800 dark:bg-stone-900"
            >
              <p className="font-medium">{jogviszony.ingatlan.megnevezes}</p>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                {berbeado?.nev ?? "Bérbeadó"} · {berbeado?.email ?? ""}
                {berbeado?.telefon ? ` · ${berbeado.telefon}` : ""}
              </p>
              {berbeado && !berbeado.telefon ? (
                <p className="mt-1 text-stone-600 dark:text-stone-400">
                  {sz("hiba.oldal.nincs_telefon")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          {sz("hiba.oldal.nyitottak")}
          {nyitottak.length > 0 ? ` (${nyitottak.length})` : ""}
        </h2>
        {nyitottak.length === 0 ? (
          <p className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
            {sz("hiba.oldal.nincs_nyitott")}
          </p>
        ) : (
          <ul className="grid gap-3">
            {nyitottak.map((hiba) => (
              <Hibakartya
                key={hiba.id}
                hiba={hiba}
                szerep="berlo"
                ma={ma}
                nyelv={nyelv}
                berlemenyCimke={hiba.jogviszonyCimke}
              />
            ))}
          </ul>
        )}
      </section>

      {lezartak.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{sz("hiba.oldal.lezartak")}</h2>
          <ul className="grid gap-3">
            {lezartak.map((hiba) => (
              <Hibakartya
                key={hiba.id}
                hiba={hiba}
                szerep="berlo"
                ma={ma}
                nyelv={nyelv}
                berlemenyCimke={hiba.jogviszonyCimke}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
