import { ABLAK_MAX_NAP } from "@/domain/egyeztetes";
import { prisma } from "@/lib/db";
import { egyeztetesBeallitasok } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { AblakUrlap } from "./AblakUrlap";
import { BerbeadoiAdatok } from "./BerbeadoiAdatok";

export const dynamic = "force-dynamic";

export default async function Beallitasok() {
  const berbeado = await kotelezoSzerep("berbeado");

  const [beallitasok, sajatAdatok] = await Promise.all([
    egyeztetesBeallitasok(berbeado.id),
    prisma.berbeadoiAdatok.findUnique({ where: { berbeadoId: berbeado.id } }),
  ]);

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Beállítások</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Ami itt változik, az a befizetések párosítására hat: a rendszer
          azonnal újraszámolja az állapotokat és a teendőket.
        </p>
      </section>

      <AblakUrlap
        korabbiAblakNap={beallitasok.korabbiAblakNap}
        kesobbiAblakNap={beallitasok.kesobbiAblakNap}
        bizonylatKeres={beallitasok.bizonylatKeres}
        maxNap={ABLAK_MAX_NAP}
      />

      <BerbeadoiAdatok
        adatok={{
          szuletesiHely: sajatAdatok?.szuletesiHely ?? "",
          szuletesiIdo: sajatAdatok?.szuletesiIdo?.toISOString().slice(0, 10) ?? "",
          anyjaNeve: sajatAdatok?.anyjaNeve ?? "",
          lakcim: sajatAdatok?.lakcim ?? "",
          igazolvanySzam: sajatAdatok?.igazolvanySzam ?? "",
          adoazonosito: sajatAdatok?.adoazonosito ?? "",
          telefon: sajatAdatok?.telefon ?? "",
          bankszamla: sajatAdatok?.bankszamla ?? "",
          bank: sajatAdatok?.bank ?? "",
        }}
      />

      <section className="rounded-lg border border-stone-200 bg-white p-4 text-sm dark:border-stone-800 dark:bg-stone-900">
        <h2 className="font-semibold">Összegeltérés</h2>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Az elfogadott eltérés nulla forint, és ez nem állítható. Bármekkora
          különbség az előírt és a beérkezett összeg között „eltér” állapotot
          kap, vagyis egyeztetés indul róla. Így egyetlen hiányzó forint sem
          tűnik el csendben.
        </p>
      </section>
    </div>
  );
}
