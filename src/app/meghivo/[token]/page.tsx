import Link from "next/link";
import { JELSZO_MIN_HOSSZ, meghivoAllapota } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { MeghivoUrlap } from "./MeghivoUrlap";

export const dynamic = "force-dynamic";

export default async function MeghivoOldal({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const meghivo = await prisma.meghivo.findUnique({
    where: { token },
    include: { jogviszonyBerlo: { include: { jogviszony: { include: { ingatlan: true } } } } },
  });

  const allapot = meghivo ? meghivoAllapota(meghivo, new Date()) : null;

  if (!meghivo || allapot !== "ervenyes") {
    return (
      <div className="mx-auto grid max-w-sm gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">A meghívó nem él</h1>
        <p className="text-stone-600 dark:text-stone-400">
          {allapot === "felhasznalt"
            ? "Ezt a meghívót már felhasználták. Ha te készítetted el vele a fiókodat, lépj be."
            : "Ez a link lejárt vagy nem létezik. Kérj újat a bérbeadódtól."}
        </p>
        <Link href="/belepes" className="underline underline-offset-2">
          Belépés
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-sm gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Fiók készítése</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          {meghivo.jogviszonyBerlo.jogviszony.ingatlan.megnevezes} ({meghivo.jogviszonyBerlo.jogviszony.ingatlan.cim}) bérlőjeként
          hívtak meg. A fiók díjmentes, és csak a saját bérleményedet látod benne.
        </p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          A jelszó legyen legalább {JELSZO_MIN_HOSSZ} karakter. Hosszabb jelszó
          jobban véd, mint a kevert írásjelek.
        </p>
      </section>

      <MeghivoUrlap token={token} email={meghivo.email} />
    </div>
  );
}
