/**
 * Az Albi szervizmunkása (service worker).
 *
 * Két dolgot csinál, és a harmadikat szándékosan nem.
 *
 * 1. Kapcsolat nélkül a saját offline lapunkat adja vissza a böngésző
 *    hibaoldala helyett. Ettől lesz az alkalmazás telepíthető is: a böngészők
 *    ezt kérik számon — egy telepített alkalmazás nem állhat meg egy
 *    dinoszauruszos hibalapon.
 * 2. A fordítás állandó részeit (`/_next/static/…`) és az ikonokat eltárolja.
 *    Ezek tartalomfüggő néven érkeznek, tehát soha nem avulnak el: ami egyszer
 *    letöltődött, az örökre ugyanaz.
 *
 * 3. **Kiszolgálói választ nem tárol el.** Egyetlen lapot sem, egyetlen
 *    bizonylatot, fényképet vagy okiratot sem. Ezek mind a belépett
 *    felhasználó adatai: a készüléken hagyott másolatot a kilépés nem viszi
 *    el, a fiók letiltása nem éri el, és a következő felhasználó ugyanazon a
 *    gépen megnyithatná. Ugyanaz az elv, mint a betekintőnél — amit egyszer
 *    kiadtunk, azt nem lehet visszavenni.
 *
 * A POST-hoz hozzá sem nyúlunk: minden kiszolgálói művelet — belépés,
 * egyeztetés, lezárás — érintetlenül megy a kiszolgálóhoz.
 */

const VERZIO = "albi-1";
const ALLOMANY_TAR = `${VERZIO}-allomany`;
const LAP_TAR = `${VERZIO}-lap`;
const OFFLINE = "/offline";

/** Amit szabad eltenni: tartalomfüggő néven érkezik, és senkié. */
function tarolhato(utvonal) {
  return utvonal.startsWith("/_next/static/") || utvonal.startsWith("/ikonok/");
}

self.addEventListener("install", (esemeny) => {
  esemeny.waitUntil(
    (async () => {
      const tar = await caches.open(LAP_TAR);
      // Süti nélkül kérjük le: ami a készüléken marad, abban ne legyen semmi,
      // ami a belépett felhasználóé. Így a tárolt lapon a fejléc is úgy áll,
      // mintha senki nem lenne belépve.
      const valasz = await fetch(OFFLINE, { credentials: "omit", cache: "reload" });
      if (valasz.ok) await tar.put(OFFLINE, valasz);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (esemeny) => {
  esemeny.waitUntil(
    (async () => {
      // A korábbi változatok tárait eldobjuk: egy új kiadás után a régi
      // fordítás darabjai már senkinek nem kellenek.
      const nevek = await caches.keys();
      await Promise.all(
        nevek.filter((nev) => !nev.startsWith(VERZIO)).map((nev) => caches.delete(nev)),
      );
      await self.clients.claim();
    })(),
  );
});

async function tarbol(keres) {
  const tar = await caches.open(ALLOMANY_TAR);
  const tarolt = await tar.match(keres);
  if (tarolt) return tarolt;

  const valasz = await fetch(keres);
  // Csak a teljes, saját eredetű választ tesszük el: a 206-os darabot és az
  // átirányítást nem.
  if (valasz.ok && valasz.status === 200 && valasz.type === "basic") {
    await tar.put(keres, valasz.clone());
  }
  return valasz;
}

self.addEventListener("fetch", (esemeny) => {
  const keres = esemeny.request;
  if (keres.method !== "GET") return;

  const cim = new URL(keres.url);
  if (cim.origin !== self.location.origin) return;

  // Lapkérés: mindig a kiszolgálótól, és csak akkor jön az offline lap, ha
  // tényleg nincs kapcsolat. Elavult másolatot soha nem mutatunk: rossz
  // egyenleget látni rosszabb, mint semmit.
  if (keres.mode === "navigate") {
    esemeny.respondWith(
      fetch(keres).catch(async () => {
        const tarolt = await caches.match(OFFLINE, { cacheName: LAP_TAR });
        return tarolt ?? Response.error();
      }),
    );
    return;
  }

  if (tarolhato(cim.pathname)) esemeny.respondWith(tarbol(keres));
});
