import { Teendolista } from "@/components/Teendolista";
import { jogviszonyNezetek, teendok } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { forintNyelven } from "@/domain/nyelv";

export const dynamic = "force-dynamic";

export default async function Attekinto() {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz , nyelv } = await szovegek();
  const ft = (osszegFt: number) => forintNyelven(osszegFt, nyelv);

  const ma = new Date();
  const [sajatTeendok, nezetek] = await Promise.all([
    teendok(berbeado.id, "berbeado", ma),
    jogviszonyNezetek(berbeado.id, ma),
  ]);

  const kozeliek = sajatTeendok.filter((teendo) => teendo.surgosseg !== "kesobbi");
  const kesobbiek = sajatTeendok.filter((teendo) => teendo.surgosseg === "kesobbi");

  const osszesEgyeztetes = nezetek.flatMap((nezet) => nezet.egyeztetesek);
  const elmaradasFt = osszesEgyeztetes
    .filter((sor) => sor.allapot !== "egyezik" && sor.elteresFt < 0)
    .reduce((osszeg, sor) => osszeg + Math.abs(sor.elteresFt), 0);

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">{sz("attekinto.cim")}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          {sz("attekinto.udvozles", { nev: berbeado.nev })}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Osszegzo cimke={sz("attekinto.jogviszony")} ertek={String(nezetek.length)} />
        <Osszegzo
          cimke={sz("attekinto.rendezetlen")}
          ertek={String(osszesEgyeztetes.filter((sor) => sor.allapot !== "egyezik").length)}
        />
        <Osszegzo cimke={sz("attekinto.elmaradas")} ertek={ft(elmaradasFt)} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{sz("attekinto.kozeli")}</h2>
        <Teendolista teendok={kozeliek} nyelv={nyelv} />
      </section>

      {kesobbiek.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-600 dark:text-stone-400">
            {sz("attekinto.kesobbi")}
          </h2>
          <Teendolista teendok={kesobbiek} nyelv={nyelv} />
        </section>
      ) : null}
    </div>
  );
}

function Osszegzo({ cimke, ertek }: { cimke: string; ertek: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {cimke}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{ertek}</div>
    </div>
  );
}
