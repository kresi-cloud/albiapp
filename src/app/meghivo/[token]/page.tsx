import Link from "next/link";
import { JELSZO_MIN_HOSSZ, meghivoAllapota } from "@/domain/belepes";
import { szovegekNyelvvel } from "@/domain/szotar";
import { prisma } from "@/lib/db";
import { aktualisNyelv } from "@/lib/nyelv";
import { MeghivoUrlap } from "./MeghivoUrlap";
import { Lapfej } from "@/components/ui/alap";

export const dynamic = "force-dynamic";

export default async function MeghivoOldal({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const nyelv = await aktualisNyelv();
  const { sz } = szovegekNyelvvel(nyelv);

  const meghivo = await prisma.meghivo.findUnique({
    where: { token },
    include: { jogviszonyBerlo: { include: { jogviszony: { include: { ingatlan: true } } } } },
  });

  const allapot = meghivo ? meghivoAllapota(meghivo, new Date()) : null;

  if (!meghivo || allapot !== "ervenyes") {
    return (
      <div className="mx-auto grid max-w-sm gap-4">
        <Lapfej
          cim={sz("meghivo.nem_el")}
          alcim={sz(allapot === "felhasznalt" ? "meghivo.felhasznalt" : "meghivo.lejart")}
        />
        <Link href="/belepes" className="underline underline-offset-2">
          {sz("belepes.cim")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-sm gap-6">
      <section>
        <Lapfej
          cim={sz("meghivo.fiok")}
          alcim={sz("meghivo.bevezeto", {
            berlemeny: meghivo.jogviszonyBerlo.jogviszony.ingatlan.megnevezes,
            cim: meghivo.jogviszonyBerlo.jogviszony.ingatlan.cim,
          })}
        />
        <p className="mt-2 text-sm text-halvany">
          {sz("meghivo.jelszo_sugo", { hossz: JELSZO_MIN_HOSSZ })}
        </p>
        <p className="mt-2 text-sm text-halvany">{sz("meghivo.megleve_fiok_sugo")}</p>
      </section>

      <MeghivoUrlap
        token={token}
        email={meghivo.email}
        cimkek={{
          email: sz("belepes.email"),
          emailSugo: sz("meghivo.email_sugo"),
          nev: sz("meghivo.nev"),
          jelszo: sz("belepes.jelszo"),
          jelszoUjra: sz("meghivo.jelszo_ujra"),
          gomb: sz("meghivo.gomb"),
          folyamatban: sz("meghivo.folyamatban"),
        }}
      />
    </div>
  );
}
