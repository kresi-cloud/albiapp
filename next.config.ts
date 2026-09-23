import type { NextConfig } from "next";

/**
 * Böngészőnek szóló védelem. Nem a kiszolgálói jogosultságot váltja ki — azt
 * minden művelet maga ellenőrzi —, hanem azt zárja le, amit a böngésző a mi
 * nevünkben tenne meg: idegen lapba ágyazást, típuskitalálást, hivatkozó cím
 * kiszivárgását.
 *
 * A `frame-ancestors` azért fontos, mert az alkalmazás minden lapja űrlapos:
 * egy láthatatlan keretbe ágyazott lezárás- vagy visszavonás-gomb kattintása
 * a belépett felhasználó nevében futna le.
 */
const FEJLECEK = [
  // Keretbe ágyazást semmi nem indokol. A `frame-ancestors` a mai szabvány, az
  // X-Frame-Options a régi böngészőké: a kettő ugyanazt mondja.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  // A feltöltött bizonylatot és fényképet a tartalma alapján adjuk vissza; ez
  // tiltja meg, hogy a böngésző mégis mást találjon ki belőle.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // A betekintő címe magában hordozza a tokent, tehát nem mehet ki egy idegen
  // oldalnak hivatkozóként.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // HTTPS-en maradunk. Helyi futtatásnál a böngésző ezt figyelmen kívül hagyja.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // A pg a hálózati kapcsolatot natív modulokra is bízhatja, ezért nem szabad a
  // szerveroldali csomagba fordítani: futásidőben kell betöltődnie.
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "@prisma/client"],
  async headers() {
    return [{ source: "/:path*", headers: FEJLECEK }];
  },
};

export default nextConfig;
