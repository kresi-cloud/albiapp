import { biztonsagosNev } from "@/domain/alairt";
import { alairtTartalma } from "@/lib/alairt";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

/**
 * Az aláírt szerződés feltöltött példánya.
 *
 * Mindkét fél letöltheti: az okirat a bérlőé is. Kívülálló nem, akkor sem, ha
 * ismeri az azonosítót — a jogosultság a jogviszonyból jön.
 *
 * A fájlnevet nem a feltöltöttből vesszük, és a tartalmat letöltésként adjuk
 * vissza, nem beágyazva: egy feltöltött fájlt nem futtatunk a saját címünkön.
 */
export async function GET(
  _keres: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const felhasznalo = await belepettFelhasznalo();
  const { sz } = await szovegek();
  if (!felhasznalo) return new Response(sz("letoltes.nincs_jogosultsag"), { status: 403 });

  const { id } = await params;
  const alairt = await alairtTartalma(
    { id: felhasznalo.id, szerep: szerepe(felhasznalo) },
    id,
  );
  if (!alairt) return new Response(sz("alairt.hiba.nincs"), { status: 404 });

  return new Response(new Uint8Array(alairt.tartalom), {
    headers: {
      "Content-Type": alairt.mimeTipus,
      "Content-Disposition": `attachment; filename="${biztonsagosNev(alairt.mimeTipus)}"`,
      // Feltöltött tartalom a saját címünkön: a böngésző ne találgassa a
      // típust, és semmit ne futtasson belőle.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
