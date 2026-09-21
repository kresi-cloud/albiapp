import { biztonsagosNev, type Oldal } from "@/domain/bizonylat";
import { bizonylatTartalma } from "@/lib/bizonylat";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";

export const dynamic = "force-dynamic";

/**
 * A vitás befizetéshez feltöltött bizonylat.
 *
 * Mindkét fél láthatja a másikét: a vitát épp az dönti el, hogy egymás
 * bizonylatát megnézik. Kívülálló viszont nem, akkor sem, ha ismeri az
 * azonosítót: a jogosultság a jogviszonyból jön.
 *
 * A fájlnevet nem a feltöltöttből vesszük, és a tartalmat letöltésként adjuk
 * vissza, nem beágyazva: egy feltöltött fájlt nem futtatunk a saját címünkön.
 */
export async function GET(
  _keres: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) return new Response("Ehhez nincs jogosultságod.", { status: 403 });

  const { id } = await params;
  const bizonylat = await bizonylatTartalma(
    { id: felhasznalo.id, szerep: szerepe(felhasznalo) },
    id,
  );
  if (!bizonylat) return new Response("Nincs ilyen bizonylat.", { status: 404 });

  return new Response(new Uint8Array(bizonylat.tartalom), {
    headers: {
      "Content-Type": bizonylat.mimeTipus,
      "Content-Disposition": `attachment; filename="${biztonsagosNev(
        bizonylat.oldal as Oldal,
        bizonylat.fajlNev,
      )}"`,
      // Feltöltött tartalom a saját címünkön: a böngésző ne találgassa a
      // típust, és semmit ne futtasson belőle.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
