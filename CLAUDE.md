# Albi — fejlesztési megállapodások

Magánszemély bérbeadóknak készülő alkalmazás. Az első kiadás mércéje: minden
funkcióterületen legalább annyit tudjon, mint a legjobb hazai megoldás, és a
befizetés-egyeztetésben, a magyar rezsilogikában és az adóösszesítőben
egyértelműen jobbat.

## Nyelv

- A felhasználói felület, a hibaüzenetek és a dokumentáció magyarul vannak.
- A kód azonosítói is magyarul: `eloirtTetel`, `kivonattetel`, `egyeztetes`.
  Az ok gyakorlati: ezeknek a szakkifejezéseknek nincs jó angol párjuk, és a
  félrefordítás a pénzügyi logikában hiba forrása.
- Kivétel a keretrendszer által előírt nevek (`page.tsx`, `layout.tsx`).

## Szerkezeti szabályok

- `src/domain` tiszta TypeScript: nem importál Next.js-t, Prismát, adatbázist.
  Minden pénzügyi számítás és egyeztetés itt él, tesztekkel.
- `src/lib` köti össze a domaint az adatbázissal.
- `src/app` csak megjelenítés és űrlapkezelés.
- Pénz mindig egész forint (`Int`), soha nem lebegőpontos.
- Dátumnál naptári napot számolunk, UTC nap elejére vágva.

## Az egyeztetés alapelve

Az előírt tétel (`EloirtTetel`), a bérlő által igazolt befizetés
(`BerloiIgazolas`) és a bankszámlakivonat sora (`Kivonattetel`) három külön adat,
és egyik sem írja felül a másikat. Az `Egyeztetes` csak az összevetés eredménye.
Aki ezt egyetlen "befizetve" jelölésre egyszerűsítené, azzal pont az
eltéréskezelés veszne el, ami a termék lényege.

A felületen ez a három szó szerepel, és a kódban is ezek az azonosítók:
"előírt tétel", "bérlő által igazolt befizetés", és az állapotoknál
"egyezik / eltér / hiányzik".

A párosítási időablak (hány nappal az esedékesség előtt és után kötünk egy
befizetést az előíráshoz) bérbeadónként állítható, a `Beallitasok` táblában.
Az összegtolerancia ezzel szemben szándékosan fix nulla: bármekkora eltérésnél
egyeztetés indul.

## Mit jelent, hogy kész

- `npx eslint .`, `npm run typecheck`, `npm test` és `npm run build` zöld.
- Pénzügyi számítás nem kerül ki teszt nélkül.
- Telefonon is használható 360 képpont széles kijelzőtől.
- Magyar formátumok: dátum, forint, ezres elválasztás.
- Személyes adat nem kerül naplóba.
