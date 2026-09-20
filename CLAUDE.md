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

## Belépés és jogosultság

Minden oldal és minden szerveroldali művelet a belépett felhasználóból indul ki
(`kotelezoSzerep`), soha nem abból, amit az űrlap küld. A bérbeadói adatokhoz a
lekérdezés mindig szűr a tulajdonosra, a bérlői oldal a saját jogviszonyaira.

A bérlő fiókja meghívóval készül. A meghívó egyszer használható és lejár, és
meglévő fiók jelszavát soha nem írja felül: a link a bérbeadónál is megvan.

## A rezsielszámolás alapelve

Az egységár fillérben, egészben számol (`Int`), és forintra csak a kész tétel
kerekít. Az elszámolás végösszege a kerekített tételek összege, nem a
kerekítetlen összeg kerekítése: a bérlő össze fogja adni a sorokat.

Az éves kedvezményes keret az elszámolt napokra arányosítva jár. Minden tételhez
tartozik emberi nyelvű részletezés; számot magyarázat nélkül nem küldünk ki.

## Az adóösszesítő alapelve

Összesítő, nem bevallás; a felület is ezt mondja. A bevétel pénzforgalmi: a
párosított kivonattételekből számol, nem az előírásokból.

A fogyasztás szerint mért, továbbhárított közüzemi díj nem bevétel; az átalány
igen. Vegyes elszámolásnál a befizetés a tételek arányában oszlik meg, és a
kerekítés maradéka a nem mért részre kerül, hogy a két rész összege pontosan a
befizetés legyen. Minden bevételi sor mellé indoklás kerül.

Amit nem tudunk besorolni (előírás nélkül beérkezett pénz), azt nem tippeljük
meg: külön listán megy a bérbeadóhoz.

## A bérleti szerződés alapelve

Egy jogviszonyhoz több bérlő tartozhat (`JogviszonyBerlo`). A fizetési
kötelezettség ettől nem lesz több: a bérleti díj egy előírt tétel marad, és a
bérlők egyetemlegesen felelnek érte. A befizetés-egyeztetés ezért a jogviszony
szintjén dolgozik, nem bérlőnként.

A szerződés modulokból áll, a katalógus kódban van
(`src/domain/szerzodes-modulok.ts`), nem az adatbázisban: jogi szöveg, amit
verziózni és ellenjegyeztetni kell, és egy javításnak minden tervezetre hatnia
kell. Minden modul mellé tartozik egy `miert` mondat, mert a bérbeadó nem
jogász, és amit nem ért, azt nem tudja eldönteni.

A szöveg abból épül, amit az alkalmazás már tud: a bérleti díj, az óvadék, a
bérlők és az ingatlan a saját adataiból jön, nem külön beírásból. Így a
szerződésben nem állhat más összeg, mint a befizetés-egyeztetésben. Ami ezen
felül kell, az modulparaméter.

Véglegesítéskor a kész szöveget elmentjük (`veglegesSzoveg`). Amit a felek
aláírtak, azt egy későbbi modulfrissítés nem írhatja át.

A személyes adatok (születési adatok, anyja neve, igazolványszám, adóazonosító)
kizárólag a dokumentumok kiállításához kellenek. A bérbeadóé külön táblában van
(`BerbeadoiAdatok`), hogy a belépési út ne is olvassa. Naplóba egyik sem kerül.

## A jegyzőkönyv és az igazolás alapelve

Az átadás-átvételi jegyzőkönyv nem különálló papír: véglegesítéskor a rögzített
óraállások bekerülnek a mérőórák történetébe, így a birtokbaadás állása lesz az
első rezsielszámolás kiindulópontja. A felelőssel és határidővel vállalt hibákból
teendő lesz, mert a birtokbaadáskor tett ígéret egyébként elvész.

Az óraállás mezője szabad szöveg, mert a helyszínen mértékegységgel együtt
írják be. A számot kiolvassuk belőle; ha nem megy, nem tippelünk, hanem szólunk.

A bérbeadói igazolás összegét és a teljesítés napját a párosított befizetésből
vesszük, nem kézi beírásból. Amelyik hónapra nincs beazonosított befizetés,
arra nem ajánlunk igazolást, és a beérkezettnél többet sem igazolunk.

A teendők többsége származtatott: a rendszer állapotából jön, és magától eltűnik,
ha az oka megszűnik. A vállalt javítás viszont tárolt teendő (`Teendo`), mert azt
valaki vállalta, és le is kell tudni zárni.

## Mit jelent, hogy kész

- `npx eslint .`, `npm run typecheck`, `npm test` és `npm run build` zöld.
- Pénzügyi számítás nem kerül ki teszt nélkül.
- Telefonon is használható 360 képpont széles kijelzőtől.
- Magyar formátumok: dátum, forint, ezres elválasztás.
- Személyes adat nem kerül naplóba.
- Új szerveroldali művelet után a böngészős próba is lefut. A `"use server"`
  fájl szabályait (csak async függvényt exportálhat) sem a típusellenőrzés, sem
  a fordítás nem fogja meg, csak a futtatás.
