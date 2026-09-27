import { manifest } from "@/domain/telepites";
import { aktualisNyelv, szovegekNyelvvel } from "@/lib/nyelv";

/**
 * Az alkalmazásleíró, a felhasználó nyelvén.
 *
 * A leíró egynyelvű: a telepítő ablakban egyetlen név és egyetlen leírás
 * állhat. Ezért nem állandó fájl, hanem kérésenként készül, a nyelvi süti
 * szerint — a bérlő gyakran nem olvas magyarul, és a telepítés az első dolog,
 * amit lát az alkalmazásból.
 *
 * Ezért kell a lapon a hivatkozás mellé a `crossOrigin="use-credentials"`: a
 * böngésző a leírót alapból süti nélkül kéri le, és akkor mindenki a magyar
 * alapértelmezést kapná.
 *
 * A saját útvonal (`/manifest.json`) szándékos: a Next.js beépített
 * `app/manifest.ts` alakja maga tenné be a hivatkozást, a `use-credentials`
 * nélkül.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const nyelv = await aktualisNyelv();
  const { sz } = szovegekNyelvvel(nyelv);

  return new Response(JSON.stringify(manifest(nyelv, sz("alkalmazas.leiras")), null, 2), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      // A leíró a nyelvi sütitől függ: közbeiktatott gyorstár ne adja vissza
      // másnak azt, amit egy másik nyelvű kérésre készült.
      "Cache-Control": "private, no-store",
    },
  });
}
