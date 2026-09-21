import { ABLAK_MAX_NAP } from "@/domain/egyeztetes";
import { prisma } from "@/lib/db";
import { egyeztetesBeallitasok } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { AblakUrlap } from "./AblakUrlap";
import { BerbeadoiAdatok } from "./BerbeadoiAdatok";

export const dynamic = "force-dynamic";

export default async function Beallitasok() {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();

  const [beallitasok, sajatAdatok] = await Promise.all([
    egyeztetesBeallitasok(berbeado.id),
    prisma.berbeadoiAdatok.findUnique({ where: { berbeadoId: berbeado.id } }),
  ]);

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">{sz("beallitasok.cim")}</h1>
        <p className="mt-1 text-halvany">{sz("beallitasok.bevezeto")}</p>
      </section>

      <AblakUrlap
        korabbiAblakNap={beallitasok.korabbiAblakNap}
        kesobbiAblakNap={beallitasok.kesobbiAblakNap}
        bizonylatKeres={beallitasok.bizonylatKeres}
        maxNap={ABLAK_MAX_NAP}
        cimkek={{
          ablakCim: sz("beallitasok.ablak_cim"),
          ablakSugo: sz("beallitasok.ablak_sugo"),
          elotte: sz("beallitasok.ablak_elotte"),
          utana: sz("beallitasok.ablak_utana"),
          bizonylatCim: sz("beallitasok.bizonylat_cim"),
          bizonylatSugo: sz("beallitasok.bizonylat_sugo"),
          bizonylatKapcsolo: sz("beallitasok.bizonylat_kapcsolo"),
          gomb: sz("beallitasok.gomb"),
          folyamatban: sz("beallitasok.folyamatban"),
        }}
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
        cimkek={{
          cim: sz("beallitasok.adatok_cim"),
          sugo: sz("beallitasok.adatok_sugo"),
          mezo: {
            szuletesiHely: sz("adatok.mezo.szuletesiHely"),
            szuletesiIdo: sz("adatok.mezo.szuletesiIdo"),
            anyjaNeve: sz("adatok.mezo.anyjaNeve"),
            lakcim: sz("adatok.mezo.lakcim"),
            igazolvanySzam: sz("adatok.mezo.igazolvanySzam"),
            adoazonosito: sz("beallitasok.mezo.adoazonosito"),
            telefon: sz("adatok.mezo.telefon"),
            bankszamla: sz("adatok.mezo.bankszamla"),
            bank: sz("beallitasok.mezo.bank"),
          },
          gomb: sz("beallitasok.adatok_gomb"),
          folyamatban: sz("beallitasok.adatok_folyamatban"),
        }}
      />

      <section className="rounded-kartya border border-keret bg-felulet p-4 text-sm">
        <h2 className="font-semibold">{sz("beallitasok.tolerancia_cim")}</h2>
        <p className="mt-1 text-halvany">
          {sz("beallitasok.tolerancia_sugo")}
        </p>
      </section>
    </div>
  );
}
