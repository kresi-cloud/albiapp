# Albi

Bérbeadást segítő alkalmazás magánszemélyeknek: befizetés-egyeztetés, rezsi- és
közösköltség-elszámolás, adóösszesítő, egy helyen a bérbeadónak és a bérlőnek.

A fejlesztés rendje, a döntésnapló és a mérföldkövek külön lapon élnek, és
körönként frissülnek.

## Hol tart

**1. mérföldkő: gerinc és befizetés-egyeztetés.** Ez a változat már tudja:

- ingatlan, bérleti jogviszony és előírt tételek adatmodellje,
- havi előírások a jogviszonyból, töredékhónapra arányosítva, magyarázattal,
- kétoldali befizetés-egyeztetés: mit írtunk elő, mit mond a bérlő, mit mond a
  bérbeadó; bizonylat csak akkor kell, ha a két oldal nem egyezik,
- állítható párosítási időablak bérbeadónként,
- teendők a kezdőlapon, lejárt, mai és közeli bontásban,
- jelszavas belépés mindkét félnek, és bérlői meghívó linkkel,
- óraállások mindkét oldalról, tételes rezsielszámolás a magyar sávos árazással,
- a kiadott elszámolás előírt tételként megy tovább a befizetésekhez, a bérlő
  pedig elfogadhatja vagy vitathatja,
- éves adóösszesítő: mi bevétel, mi nem, mennyi a költség, és melyik
  elszámolási móddal jársz jobban; táblázatba letölthető.

Ami még nincs kész: elfelejtett jelszó, szerződéskészítő, hibabejelentés.

## Indítás

```bash
npm install
cp .env.example .env
npx prisma migrate dev     # adatbázis létrehozása
npm run db:seed            # példaadat, hogy legyen mit nézni
npm run dev
```

Az alkalmazás a http://localhost:3000 címen fut.

A `db:seed` a végén kiírja a példafiókok belépési adatait és egy kész bérlői
meghívó linkjét, hogy mindkét oldal azonnal kipróbálható legyen.

Két környezeti változó kell: `DATABASE_URL` és `MUNKAMENET_TITOK`. Az utóbbival
írjuk alá a munkamenet sütijét; élesben kötelező, legyen legalább 16 karakter,
és minden környezetben más.

## Parancsok

| Parancs | Mit csinál |
| --- | --- |
| `npm run dev` | fejlesztői szerver |
| `npm test` | egységtesztek |
| `npm run typecheck` | típusellenőrzés |
| `npx eslint .` | formai ellenőrzés |
| `npm run build` | éles fordítás |
| `npm run db:seed` | példaadat betöltése |
| `npm run proba` | böngészős próbák 360 képpontos ablakban |

## Belépés

Jelszavas belépés, sütiben tárolt, aláírt munkamenettel. A jelszó scrypttel
tárolódik, külön sóval, a Node beépített kriptográfiájából. A bérlő nem
regisztrálhat magától: a bérbeadó küld neki meghívó linket, ami két hétig él,
egyszer használható, és új meghívó készítése azonnal érvényteleníti a régit.

Belépés nélkül minden oldal a belépésre irányít, és a bérbeadói oldalakat a
bérlő nem éri el (és fordítva).

## Rezsielszámolás

A magyar lakossági rezsi két sávban működik: egy éves mennyiségig kedvezményes
ár, fölötte piaci ár. Az elszámolás ezt követi, és az éves keretet az elszámolt
napokra arányosítja. Az egységárak fillérben, egészben vannak tárolva
(`kedvezmenyesArFiller`), mert a rezsiárak nem kerek forintok; forintra csak a
tétel végén kerekítünk. Az elszámolás összege a kerekített tételek összege, hogy
a bérlő össze tudja adni a sorokat, és ugyanazt kapja.

Minden tétel mellé emberi nyelvű részletezés készül: melyik óraállástól meddig,
hány nap, mennyi ment kedvezményes és mennyi piaci áron. Ez a különbség a
"kapsz egy számot" és az "ellenőrizni tudod" között.

## Adóösszesítő

Összesítő, nem bevallás. A bevétel pénzforgalmi: az számít, ami az adott évben
tényleg megérkezett, ezért a bérbeadó által igazolt beérkezésekből indul, nem az
előírásokból.

Két szabály adja a lényegét. A fogyasztás szerint mért, továbbhárított közüzemi
díj nem a bérbeadó bevétele; az átalányban fizetett rezsi viszont az, mert nincs
mögötte tényleges fogyasztás szerinti arányosítás. Az alkalmazás tudja, melyik
jogviszony hogyan számol el, és egy vegyes elszámolást a tételek arányában oszt
meg a két rész között. A másik: a 10%-os költséghányad és a tételes
költségelszámolás közül az összesítő kiszámolja mindkettőt, az értékcsökkenéssel
együtt, és megmondja, melyikkel jársz jobban.

## Felépítés

```
prisma/schema.prisma   adatmodell és migrációk
src/domain/            üzleti logika, keretrendszer nélkül, tesztekkel
src/lib/               adatbázis-kapcsolat, munkamenet, lekérdezések
src/app/               képernyők (Next.js App Router)
```

A `src/domain` szándékosan nem ismeri sem a Next.js-t, sem a Prismát: a
pénzügyi számítás és az egyeztetés tiszta függvényekben él, így gyorsan
tesztelhető.

## Befizetés-egyeztetés

Mindkét fél a saját oldalát adja meg. A bérlő azt, mikor mennyit utalt; a
bérbeadó azt, mikor mennyi érkezett — vagy azt, hogy megnézte, és nem érkezett
meg. Ha a két adat egyezik, a tétel le van zárva, és **bizonylatot nem kérünk**.

Teljes bankszámlakivonatot pedig soha nem kérünk, és nem is fogadunk el: az a
bérbeadó összes pénzmozgását megmutatná, a bérlőét pedig az övét, és ahhoz
egyik félnek sincs köze. Az alkalmazás ezt ki is írja mindkét oldalon.

Ha a két oldal nem egyezik, onnantól van értelme a bizonylatnak — és akkor is
csak annak az egy utalásnak: a bérlőtől a küldő, a bérbeadótól a fogadó
oldaliról.

Öt állapot van, és a különbségük szándékos:

| Állapot | Mit jelent |
| --- | --- |
| egyezik | mindkét fél ugyanazt mondja, és annyit, amennyi elő volt írva |
| eltér | mindkét fél ugyanazt mondja, de nem az előírt összeget — ez nem vita |
| vitás | a két fél adata nem fedi egymást; innen jön a bizonylatkérés |
| várakozik | csak az egyik fél nyilatkozott, a másikra várunk |
| hiányzik | egyik fél sem nyilatkozott, és az esedékesség elmúlt |

A párosítási időablak bérbeadónként állítható a `Beállítások` lapon. Az
összegtolerancia szándékosan fix nulla: bármekkora eltérésnél egyeztetés indul.

Ami beérkezett, de nincs hozzá előírás, azt nem tippeljük meg: külön listán megy
a bérbeadóhoz.

## Havi előírások

Az előírt tételeket nem kézzel kell felvinni: a jogviszonyból következnek. A
bérleti díj, a közös költség és a rezsiátalány minden hónapra egy-egy előírás, a
jogviszony kezdetétől a mai hónapig — jövőbeli hónapra nem írunk elő.

A be- és kiköltözés hónapja napra arányosítva jár, és ilyenkor a tétel mellett
ott a magyarázat is: hány napról van szó, és mennyi lenne a teljes havi összeg.

A hiányzó előírások akkor pótlódnak, amikor valaki ránéz a befizetésekre. Meglévő
előírást ez soha nem ír át: amire egyszer már egyeztettünk, azt egy későbbi
díjemelés nem változtathatja meg.

A `Bérlők` lapon zárható le a jogviszony. A lezárás megadott nappal történik: a
kiköltözés utáni hónapok előírásait törli, a záró hónapét arányosítja, a múlthoz
nem nyúl. Ha tévedésből zártad le, a `Mégis él` gomb a záró hónap összegét is
visszaállítja.

## Adatbázis

Fejlesztéshez és a próbakörnyezethez SQLite, az éles adatbázis PostgreSQL lesz
EU-s régióban. Amíg nincs éles adat, a váltás egyetlen migráció újrafuttatása.

Pénzösszegek egész forintban (`Int`). A forintnak nincs gyakorlati váltópénze,
így nincs lebegőpontos kerekítési hiba sem.

## Bérleti szerződés

A `Szerződések` lapon minden jogviszonyhoz készíthető szerződéstervezet. A
szerződés modulokból áll: a kötelező pontok mindig benne vannak, a többit a
bérbeadó kapcsolja be, és minden modul mellett ott az egymondatos magyarázat,
hogy miért érdemes.

A bérlemény, a bérleti díj, az óvadék, a fizetési nap és a bérlők adatai abból
jönnek, amit a bérbeadó már felvett, ezért nem kell kétszer megadni. A rezsi
elszámolásának módja is átjön: mérőórás jogviszonynál a szerződés a
továbbhárításról és a havi leolvasásról szól, átalánynál az átalány összegéről.

Egy jogviszonyhoz több bérlő is tartozhat. Ilyenkor a szöveg többes számra vált,
bekerül az egyetemleges felelősség pontja, és a felmondás közlését mindegyik
bérlővel külön-külön írja elő. A bérleti díj továbbra is egyetlen előírt tétel.

A tervezet szövege minden mentés után újraépül. Véglegesítéskor befagy: onnantól
egy későbbi modulfrissítés sem írja át. A szerződés sima szövegként letölthető.

A modulok ügyvédi ellenjegyzése még nincs meg; a felület ezt minden szerződésnél
kiírja.

## Átadás-átvételi jegyzőkönyv

A `Dokumentumok` lapon minden jogviszonyhoz felvehető birtokbaadási és
visszaadási jegyzőkönyv. A mérőórák és a szokásos kulcsfajták előre bekerülnek a
listába, hogy a helyszínen ne kelljen üres lapra írni, és ne maradjon ki a
mérőóra. Hiba mellé felelős és határidő is rögzíthető.

Véglegesítéskor három dolog történik: a szöveg befagy, a rögzített óraállások
bekerülnek a mérőórák történetébe, a vállalt javításokból pedig teendő lesz az
áttekintőn. Az óraállást így nem kell kétszer beírni, és az első rezsielszámolás
a birtokbaadás állásából indul.

## Bérbeadói igazolás

Albérlettámogatáshoz, ösztöndíjhoz és munkáltatói térítéshez a bérlő havonta kér
igazolást a befizetésről. Az alkalmazás ezt a párosított befizetésből állítja ki:
az összeget és a teljesítés napját nem kell kézzel beírni. Amelyik hónapra nincs
beazonosított befizetés, arra nem ajánl igazolást, és a beérkezettnél többet nem
igazol.

Több bérlőnél a bérbeadó megadhatja, mekkora rész igazolt az adott bérlőhöz, és
az igazolás kiírja az egyetemleges felelősséget is.

## Hibabejelentés

A bérlő a `/berlo/hibak` oldalon jelenti be, mi romlott el: mi a baj, mi romlott
el, mitől, és mennyire sürgős. A sürgősségből válaszhatáridő lesz, és a bérbeadó
teendői közé kerül. Veszélyhelyzetnél a felület kiírja az azonnali teendőket
(főcsap, kismegszakító, 112) és a bérbeadó telefonszámát, mert a bejelentés
magától nem csörög.

A bérbeadó a `/hibak` oldalon veszi át, indítja el és jelöli elhárítottnak. A
lezárást a bérlő erősíti meg; ha mégsem jó, visszanyithatja. A költségviselőre az
alkalmazás javaslatot tesz a szerződés karbantartási pontja alapján, indoklással.

## Dokumentumtár

A `/dokumentumok` oldal tetején és a bérlő `/berlo/dokumentumok` oldalán egy
listában áll minden papír: szerződés, átadás-átvételi jegyzőkönyv, rezsielszámolás
és bérbeadói igazolás, időrendben, letöltéssel. A bérlő csak a kiadott okiratokat
látja, és csak a neki szóló igazolást.

## Kétnyelvű felület

A fejléc nyelvváltójával a felület magyarra vagy angolra állítható, belépés
előtt is. A választás ezen az eszközön megmarad, és belépve a fiókba is
beíródik, hogy a másik eszközön is azt kapd. A kiadott dokumentumok szövege
magyar marad: az aláírt szerződés és a kiállított igazolás magyarul érvényes.

## Jogi tájékoztatók

Az adatkezelési tájékoztató és a felhasználási feltételek a lábléc két
hivatkozása mögött vannak, mindkét nyelven. Az üzemeltető adatait élesítés
előtt ki kell tölteni: a szövegben `[kitöltendő]` jelöli a helyüket.

## Betekintő

A bérlő a saját fizetési előzményéről adhat ki csak olvasható linket
(`/berlo/betekinto`), például egy új albérlet megpályázásához. A nyilvános oldal
belépés nélkül nyílik, mert a token maga a jogosultság, és rövid életű: a bérlő
7, 30 vagy 90 napot választ, és bármikor visszavonhatja.

Az oldal tényeket mutat — hány hónapra volt esedékes díj, ebből mennyi érkezett
határidőre, mennyi késve és átlagosan hány nappal —, pontszámot nem. Az adat a
bérbeadó saját rögzítéséből jön arról, mi érkezett meg, tehát nem a bérlő bemondása, és az
oldal ezt ki is mondja. Amit soha nem mutat: bérbeadói nevet, pontos címet (csak
települést), lakótársat, személyes adatot. A bérleti díj összege csak akkor
látszik, ha a bérlő külön bekapcsolja.

## Minőségi kapuk

A megállapodásaink egy részét nem elég leírni, mert olyasmiről szólnak, amit sem
a típusellenőrzés, sem a fordítás nem lát. Ezek a `src/__tests__` mappában
kapuként is meg vannak írva; a kapuk a forráskódot olvassák:

| Kapu | Mit őriz |
| --- | --- |
| `retegek` | a domain nem nyúl Next.js-hez, Prismához, adatbázishoz |
| `kiszolgalo-muveletek` | a `"use server"` fájlok csak async függvényt exportálnak |
| `naplo` | nincs konzolra írás, tehát személyes adat sem kerülhet a naplóba |
| `formatum` | számot és dátumot csak a `domain/nyelv.ts` formáz |
| `teszteltseg` | minden domain modult importál legalább egy teszt |

Mindegyik kapu első tesztje azt próbálja ki, hogy a kapu tényleg elutasítja a
tiltott alakot.

A böngészős próbák a `proba` mappában vannak, és egy 360 képpont széles ablakban
futnak végig: telefonméret, hibabejelentés, kétnyelvűség, letöltési
jogosultságok, betekintő, havi előírások és a jogviszony lezárása. Futtatás: indítsd a kiszolgálót (`npm run build && npm run
start`), majd `npm run proba`. A `proba/meret.mjs` minden oldalon azt nézi,
kilóg-e valami vízszintesen — ez a hiba nagy kijelzőn soha nem látszik, telefonon
viszont azonnal.

A `Ellenőrzés` munkafolyamat mindkettőt lefuttatja minden pull requestre: egy
gyors menetet (lint, típus, teszt, fordítás, `npm audit`) és egy böngészőset.
