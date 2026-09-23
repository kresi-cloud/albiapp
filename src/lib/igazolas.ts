import { prisma } from "@/lib/db";
import { igazolhatoBefizetesek, type Befizetes } from "@/domain/igazolas";
import { jogviszonyNezetek } from "@/lib/lekerdezesek";

/**
 * Mely hónapokra állítható ki igazolás egy jogviszonyon. A párosított
 * befizetésekből jön: ami beérkezett, az igazolható, ami nem, arra nem
 * ajánlunk semmit.
 */
export async function igazolhatoIdoszakok(
  jogviszonyId: string,
  tulajdonosId: string,
): Promise<Befizetes[]> {
  const nezetek = await jogviszonyNezetek(tulajdonosId);
  const nezet = nezetek.find((sor) => sor.id === jogviszonyId);
  if (!nezet) return [];

  const befizetesek: Befizetes[] = nezet.egyeztetesek
    .filter((sor) => sor.idoszak !== null && sor.berbeadoiOsszegFt !== null)
    .map((sor) => ({
      idoszak: sor.idoszak as string,
      osszegFt: sor.berbeadoiOsszegFt ?? 0,
      napja: sor.berbeadoiDatuma ?? sor.esedekesseg,
      allapot: sor.allapot,
    }));

  return igazolhatoBefizetesek(befizetesek);
}

/** A jogviszony legutóbbi véglegesített szerződésének kelte, ha van. */
export async function szerzodesKelte(jogviszonyId: string): Promise<Date | null> {
  const szerzodes = await prisma.szerzodes.findFirst({
    where: { jogviszonyId, allapot: "veglegesitve" },
    orderBy: [{ veglegesitve: "desc" }, { id: "desc" }],
  });
  return szerzodes?.kelte ?? null;
}
