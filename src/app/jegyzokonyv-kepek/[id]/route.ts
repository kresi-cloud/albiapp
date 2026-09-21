import { biztonsagosNev } from "@/domain/jegyzokonyv-kepek";
import { kepTartalma } from "@/lib/jegyzokonyv-kepek";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";

export const dynamic = "force-dynamic";

/**
 * Egy fénykép a jegyzőkönyv albumából.
 *
 * Mindkét fél láthatja a másikét: a megerősítés épp attól ér valamit, hogy
 * megnézik egymás képét. Kívülálló viszont nem, akkor sem, ha ismeri az
 * azonosítót — a jogosultság a jogviszonyból jön.
 *
 * A képet beágyazva adjuk vissza, nem letöltésként, mert végignézni akarják,
 * nem menteni. Ez viszont csak azért biztonságos, mert a típus nem a feltöltő
 * bemondásából jön: a feltöltéskor a fájl elejéből állapítjuk meg, és csak
 * hármat fogadunk el. A `nosniff` és a szűk `Content-Security-Policy` azt
 * zárja ki, hogy a böngésző bármi mást csináljon vele, mint kirajzolja.
 */
export async function GET(
  _keres: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return new Response("Ehhez nincs jogosultságod.", { status: 403 });

  const { id } = await params;
  const kep = await kepTartalma({ id: felhasznalo.id, szerep: szerepe(felhasznalo) }, id);
  if (!kep) return new Response("Nincs ilyen kép.", { status: 404 });

  return new Response(new Uint8Array(kep.tartalom), {
    headers: {
      "Content-Type": kep.mimeTipus,
      "Content-Disposition": `inline; filename="${biztonsagosNev(kep.id, kep.mimeTipus)}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
