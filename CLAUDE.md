# Albi — fejlesztési megállapodások

Magánszemély bérbeadóknak készülő alkalmazás. Az első kiadás mércéje: minden
funkcióterületen legalább annyit tudjon, mint a legjobb hazai megoldás, és a
befizetés-egyeztetésben, a magyar rezsilogikában és az adóösszesítőben
egyértelműen jobbat.

## Nyelv

- A felület magyarul és angolul megy. A bérbeadó magyar magánszemély, a bérlő
  viszont gyakran nem: egyetemi városban külföldi hallgató, nagyvárosban
  külföldön dolgozó. A nyelvet a `Nyelvvalto` állítja, és az ezen az eszközön
  tett utolsó választás dönt (süti), süti híján a fiókban mentett nyelv.
- **A kiadott okiratok magyarul érvényesek, és magyarul is maradnak**: a
  szerződés, a jegyzőkönyv, az igazolás és a rezsielszámolás szövegét nem
  fordítjuk, mert a fordítás nem az, amit aláírtak. A felület ezt ki is mondja.
- A domain nem ad vissza kész mondatot, hanem `Uzenet`-et: kulcsot és a
  behelyettesítendő adatokat (`src/domain/nyelv.ts`). A mondat a szótárban él
  (`src/domain/szotar.ts`), hogy a két nyelv ne csússzon szét. A számítás így
  nyelvfüggetlen marad, és a tesztek kulcsra állítanak, nem prózára.
- A dokumentáció és a kódon belüli magyarázat magyarul van.
- A hibaüzenetek is a szótáron mennek át.
- A kód azonosítói magyarul: `eloirtTetel`, `kivonattetel`, `egyeztetes`.
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

## A havi előírások alapelve

Az előírt tételek nem kézzel kerülnek be: a jogviszonyból következnek
(`src/domain/eloirasok.ts`). A bérleti díj, a közös költség és a rezsiátalány
minden hónapra egy-egy előírás, a jogviszony kezdetétől a mai hónapig. Jövőbeli
hónapra nem írunk elő: amit még nem kellett fizetni, azt ne is kérjük számon.

Töredékhónap napra arányosítva jár, és mindig tartozik hozzá részletezés
(`reszletezes`): a bérlő lássa, miért nem a teljes havi összeg áll ott.

A pótlás akkor fut, amikor valaki ránéz a befizetésekre — nincs ütemező, és egy
magánbérbeadónak nem is kell. Meglévő előírást soha nem írunk át: amire egyszer
már egyeztettünk, azt egy későbbi díjemelés nem változtathatja meg.

A jogviszony lezárása ennek a határa. A kiköltözés utáni hónapok előírásait
törli, a záró hónapét arányosítja, a múlthoz nem nyúl. A lezárás visszavonása
ezt vissza is számolja, mert egy elkattintott lezárás egyébként csendben
kevesebb bérleti díjat írna elő.

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

## A hibabejelentés alapelve

A bejelentés és az elhárítás két külön esemény, és egyik sem írja felül a másikat:
a bérbeadó jelöli elhárítottnak, a bérlő erősíti meg, hogy tényleg rendben van.
Ugyanaz a kétoldali elv, mint a befizetésnél. Amíg nincs megerősítés, a hiba
nyitott, és teendő van belőle.

A sürgősségből válaszhatáridő lesz. Ez nem jogszabályi határidő — magánszemélyek
bérletére nincs ilyen —, hanem az alkalmazás alapértelmezése, és a felület ezt ki
is mondja.

A költségviselőre javaslatot teszünk a szerződés karbantartási pontja és a
lakástörvény 13. §-a alapján, de a döntés a bérbeadóé, és amíg nem mondta ki, a
`viseloFel` üres marad. Ha a bérlő nem tudja, mitől romlott el, nem tippelünk:
ugyanúgy, ahogy a be nem sorolható befizetésnél sem.

## A dokumentumtár alapelve

Négy tábla, egy lista. A bérlő csak a kiadott okiratot látja és töltheti le:
véglegesített szerződést és jegyzőkönyvet, kiadott elszámolást, neki kiállított
igazolást. Tervezetet nem, mert az még változhat. Az igazolás névre szól, ezért a
lakótárs igazolását a bérlő nem látja.

## A betekintő alapelve

A bérlőszűrés jogilag korlátos, és jó okkal. A betekintő ugyanannyit old meg a
másik irányból: nem a bérbeadó kutat a bérlő után, hanem a bérlő ad ki magáról
egy igazolható előzményt, akkor és annak, akinek akarja.

Három dolog teszi használhatóvá. Az adat nem a bérlő bemondása, hanem abból jön,
amit a mostani bérbeadó bankszámlakivonata igazol. Pontszámot nem adunk: a
súlyozás, amit mi találnánk ki, mérésnek látszana, pedig nem az. És szűk: se
bérbeadói név, se pontos cím (csak település), se személyes adat, se más bérlő —
ha egy adat nem a fizetési fegyelemről szól, nincs ott helye.

A link rövid életű, a bérlő bármikor visszavonja, és a megnyitásból csak az
időpontot tároljuk. IP-t és böngészőazonosítót nem: a bérlőnek az számít,
hányszor nézték meg.

## Jogi tájékoztatók

Az adatkezelési tájékoztató és a felhasználási feltételek szövege
`src/domain/jogi.ts`-ben van, mindkét nyelven, és a lábléc minden oldalról
elérhetővé teszi. Az üzemeltető adatai szögletes zárójellel kitöltendőként
állnak benne: az adatkezelő megnevezése jogi nyilatkozat, nem találjuk ki a
bérbeadó helyett. Élesítés előtt ezeket ki kell tölteni.

## Mit jelent, hogy kész

- `npx eslint .`, `npm run typecheck`, `npm test` és `npm run build` zöld.
- Pénzügyi számítás nem kerül ki teszt nélkül.
- Telefonon is használható 360 képpont széles kijelzőtől.
- Magyar formátumok: dátum, forint, ezres elválasztás.
- Személyes adat nem kerül naplóba.
- Új szerveroldali művelet után a böngészős próba is lefut (`npm run proba`). A
  `"use server"` fájl szabályait (csak async függvényt exportálhat) sem a
  típusellenőrzés, sem a fordítás nem fogja meg, csak a futtatás.

## A minőségi kapuk

A fenti lista nagyobb része a `src/__tests__` mappában kapuként is meg van írva,
mert a megállapodás, amit csak ember tart be, előbb-utóbb elkopik. A kapuk a
forráskódot olvassák, nem futtatják:

- `retegek`: a domain nem importál Next.js-t, Prismát, adatbázist, és a
  megjelenítés nem kerüli meg a libet.
- `kiszolgalo-muveletek`: a `"use server"` fájlok csak async függvényt
  exportálnak.
- `naplo`: a forrásban nincs konzolra írás, tehát személyes adat sem kerülhet
  oda. Ha egyszer tényleg kell naplózás, egy erre való modul szűrje a mezőket, és
  a kapu azt az egy helyet engedje át.
- `formatum`: számot és dátumot egyedül a `domain/nyelv.ts` formáz. Így nem
  csúszik el a magyar alak oldalanként, és nem marad beégetett `hu-HU` az angol
  felületen.
- `teszteltseg`: minden domain modult importál legalább egy teszt.

Mindegyik kapu első tesztje azt próbálja ki, hogy a kapu tényleg elutasítja a
tiltott alakot: egy kapu, ami mindenre igent mond, rosszabb a semminél.

A böngészős próbák a `proba` mappában vannak, és 360 képpont széles ablakban
futnak. A `proba/meret.mjs` minden oldalon azt nézi, kilóg-e valami
vízszintesen; ez a hiba nagy kijelzőn soha nem látszik.
