import { prisma } from "@/lib/db";
import { belepettFelhasznalo } from "@/lib/munkamenet";

export const dynamic = "force-dynamic";

/**
 * A kiállított igazolás szövege. Okirat, ezért a mentett szöveget adjuk vissza.
 *
 * A bérlő a neki szólót töltheti le. A lakótársét nem: az igazolás névre szól,
 * és nevesíti a befizetést is.
 */
export async function GET(
  _keres: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return new Response("Ehhez nincs jogosultságod.", { status: 403 });

  const { id } = await params;
  const igazolas = await prisma.igazolas.findFirst({
    where: {
      id,
      jogviszonyBerlo:
        felhasznalo.szerep === "berlo"
          ? { berloId: felhasznalo.id }
          : { jogviszony: { ingatlan: { tulajdonosId: felhasznalo.id } } },
    },
  });
  if (!igazolas) return new Response("Nincs ilyen igazolás.", { status: 404 });

  return new Response(igazolas.szoveg, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="berbeadoi-igazolas-${igazolas.idoszak}.txt"`,
    },
  });
}
