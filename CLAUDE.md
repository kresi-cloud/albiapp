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
  szerződés, a jegyzőkönyv, az igazolás és a rezsielszámolás szövege magyar, mert
  a fordítás nem az, amit aláírtak. A felület ezt ki is mondja. A bérleti
  szerződéshez ezen felül jár egy **tájékoztató** angol fordítás; hogy az miért
  nem mond ennek ellent, lásd „A szerződés fordításának alapelve".
- A domain nem ad vissza kész mondatot, hanem `Uzenet`-et: kulcsot és a
  behelyettesítendő adatokat (`src/domain/nyelv.ts`). A mondat a szótárban él
  (`src/domain/szotar.ts`), hogy a két nyelv ne csússzon szét. A számítás így
  nyelvfüggetlen marad, és a tesztek kulcsra állítanak, nem prózára.
- A dokumentáció és a kódon belüli magyarázat magyarul van.
- A hibaüzenetek is a szótáron mennek át.
- A kód azonosítói magyarul: `eloirtTetel`, `berbeadoiIgazolas`, `egyeztetes`.
  Az ok gyakorlati: ezeknek a szakkifejezéseknek nincs jó angol párjuk, és a
  félrefordítás a pénzügyi logikában hiba forrása.
- Kivétel a keretrendszer által előírt nevek (`page.tsx`, `layout.tsx`).

## Szerkezeti szabályok

- `src/domain` tiszta TypeScript: nem importál Next.js-t, Prismát, adatbázist.
  Minden pénzügyi számítás és egyeztetés itt él, tesztekkel.
- `src/lib` köti össze a domaint az adatbázissal.
- `src/app` csak megjelenítés és űrlapkezelés.
- Pénz mindig egész forint (`Int`), soha nem lebegőpontos.
- Dátumnál naptári napot számolunk, UTC nap elejére vágva — és **UTC-ben is
  írjuk ki**. A gép óráját követve egy UTC-től nyugatra futó kiszolgálón
  minden dátum egy nappal korábbinak látszana, az esedékességtől a szerződés
  keltéig. Ami valódi időpont (üzenet kelte), az nem naptári nap: az magyar
  idő szerint megy ki, mert a felek abban gondolkodnak, és a kiszolgáló
  régiója nem dönthet helyettük.

## Az egyeztetés alapelve

Az előírt tétel (`EloirtTetel`), a bérlő által igazolt befizetés
(`BerloiIgazolas`) és a bérbeadó által igazolt beérkezés (`BerbeadoiIgazolas`)
három külön adat, és egyik sem írja felül a másikat. Az `Egyeztetes` csak az
összevetés eredménye. Aki ezt egyetlen "befizetve" jelölésre egyszerűsítené,
azzal pont az eltéréskezelés veszne el, ami a termék lényege.

**Mindkét fél a saját oldalát adja meg, és ha a kettő egyezik, a kérdés le van
zárva: bizonylatot ilyenkor nem kérünk.** Teljes bankszámlakivonatot pedig soha:
az a bérbeadó összes pénzmozgását megmutatná, a bérlőét pedig az övét, és ahhoz
egyik félnek sincs köze. Az alkalmazás ezt ki is mondja a felületen, mert a
bérlő különben joggal gondolná, hogy előbb-utóbb mégis kérni fogjuk.

Ha a két oldal nem egyezik, onnantól van értelme a bizonylatnak — és akkor is
csak annak az egy utalásnak a bizonylatáról, a bérlőtől a küldő, a bérbeadótól a
fogadó oldaliról. Ezt a `bizonylatKell` mező mondja ki, nem a felület.

**A saját oldalát mindenki maga adja meg, tehát maga is veszi vissza.** A
bérlői nyilatkozatnak ezért van szerzője (`BerloiIgazolas.szerzoId`): nélküle a
visszavonás csak a jogviszonyra tudott szűrni, és bármelyik lakótárs
visszavonhatta a másikét — a másik pedig csak abból vette volna észre, hogy a
tétel megint a bérbeadóra vár.

A bizonylatkérés viszont a bérbeadó döntése (`Beallitasok.bizonylatKeres`, alapból
bekapcsolva): van, aki a bérlőjétől nem akar papírt kérni. Kikapcsolva a tétel
vitás marad, csak nem kérünk hozzá semmit. Amit már feltöltöttek, azt a
kikapcsolás nem rejti el, és a rendezés sem: egy kapcsoló ne tüntesse el csendben
a másik fél fájlját. Törölni mindenki a sajátját tudja.

Oldalanként egy bizonylat van, a bérlői oldal viszont a lakótársaké közösen.
Feltöltéskor ezért nem írjuk felül a másik feltöltő fájlját: aki a magáét
felviszi rá, utána a saját nevén törölhetné is, és a lakótárs bizonylata két
kattintással eltűnne. Aki cserélni akar, a feltöltőt kéri meg rá.

Melyik oldal bizonylatát ki adja fel, az a szerepből következik
(`oldalaEnnek`), nem az űrlapból: a bérlőnek küldő oldali bizonylata van, a
bérbeadónak fogadó oldali. Bizonylatot csak vitás előíráshoz fogadunk el, és ezt
a kiszolgálón ellenőrizzük — enélkül az ígéretből, hogy csak vitánál kérünk,
semmi nem maradna. A feltöltött fájlt letöltésként adjuk vissza, a feltöltött
fájlnév nélkül: nem futtatunk idegen tartalmat a saját címünkön.

Az állapotok ezért ötfélék, és a különbségük termékdöntés:

- `egyezik` — mindkét fél ugyanazt mondja, és annyit, amennyi elő volt írva,
- `elter` — mindkét fél ugyanazt mondja, de nem az előírt összeget; ez **nem
  vita**, a felek egyetértenek abban, mi történt, ezért bizonylat sem kell,
- `vitas` — a két fél adata nem fedi egymást; innen jön a bizonylatkérés,
- `varakozik` — csak az egyik fél nyilatkozott, a másikra várunk,
- `hianyzik` — egyik fél sem nyilatkozott, és az esedékesség elmúlt.

A bérbeadó kétfélét mondhat: "ennyi érkezett ekkor", vagy egy előírásra azt,
hogy "erre nem érkezett pénz". A tagadás nélkül egy elmaradt utalás örökké a
másik fél adatára várna, holott a bérbeadó már megnézte.

A párosítási időablak (hány nappal az esedékesség előtt és után kötünk egy
befizetést az előíráshoz) bérbeadónként állítható, a `Beallitasok` táblában.
Az összegtolerancia ezzel szemben szándékosan fix nulla: bármekkora eltérésnél
egyeztetés indul. A két fél dátuma közt viszont van tűrés
(`KET_OLDAL_NAP_ELTERES`), mert a bérlő az indítás napját írja, a bérbeadó azt,
amikor észrevette.

**Ez a tűrés a párosításnál is számít, nem csak az összevetésnél.** A két oldal
külön keresi meg a maga előírását, és az ablak szélén ugyanaz az utalás két
különböző hónaphoz kerülhetett: a bérlő 24-én indította, ami az októberi előírás
ablakán még kívül esik, a bérbeadó 27-én vette észre, ami már belül. Ebből két
„várakozik" sor lett és teendő mindkét félnél, holott a felek ugyanazt mondják.
Ezért a bérbeadói oldal párosítása után a vele egyező bérlői nyilatkozat
**ugyanahhoz az előíráshoz kötődik**, az ablaktól függetlenül — az ablak arra
való, hogy megtalálja a párját, nem arra, hogy szétvágja.

**Egy fogalom, egy szabály, három lap.** „Rendezetlen" az, ami az adott félre
vár (`varRank`), „elmaradás" az, ami a bérbeadó saját adata szerint még nem
érkezett meg (`nyitottFt`). Mindkettő a domainben van, mert három lapon három
szabály volt: az áttekintő 150 000 forintos előírásra, amire a bérbeadó
100 000-et rögzített, nulla forint elmaradást mutatott, a betekintő ötvenezret;
a „Rendezetlen: 5" mellett pedig a befizetések lapján négy tétel volt soron. A
betekintő szándékosan tér el egy ponton: ott a friss hónap is nyitott, mert a
kérdés nem az, ki késik, hanem hogy mennyi van hátra — és a lap ezt ki is
mondja.

**Esedékesség előtt is jár sor a tételnek.** Nem „hiányzik", hanem „várakozik":
a bérlő teendői közt ott áll, hogy közeleg a fizetési határidő, és ha nincs
kártya, nincs is hol rögzíteni, amire a teendő szólítja.

Ami ezen felül beérkezik, de nincs hozzá előírás, azt nem tippeljük meg: külön
listán megy a bérbeadóhoz. **És ugyanez áll a bérlő oldalára is.** Korábban csak
a bérbeadó párosítatlan beérkezése kapott sort: egy elgépelt dátummal rögzített
bérlői utalás sehol nem jelent meg, tehát a bérlő nem tudta visszavonni, a
bérbeadó nem tudta, hogy keresnie kell, az előírás pedig „hiányzik" maradt,
teendővel mindkét félnél. Egy adat, amit csak eltárolunk, de sehol nem mutatunk
meg, rosszabb, mint ha el sem fogadtuk volna.

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

**A lezárás egyetlen tranzakcióban fut**: a kiköltözés utáni előírások törlése,
a státusz átállítása és a záró hónap arányosítása összetartozik. Közöttük egy
másik kérés féligkész állapotot látna — lezárt jogviszonyt teljes havi bérleti
díjjal —, és abból a bérlőnek kiírt összeg lenne rossz. SQLite-on ez rejtve
maradt, mert ott az írás sorosítva van; Postgresen a lapok tényleg egyszerre
futnak, és a böngészős próba minden harmadik futáson elbukott rajta. A
visszavonásra ugyanez áll.

**A lezárás a nyitott jogviszony művelete**, és ezt a kiszolgáló tartja be, nem
a gomb elrejtése. Lezártat újra lezárni azért nem lehet, mert a második lezárás
korábbi véget is kaphatna: az már egyeztetett előírt tételeket törölne, és a
záró hónapot újraarányosítaná. Aki a dátumot javítani akarja, előbb visszavonja
a lezárást — az vissza is számolja, amit az első elvett —, és utána zár le újra.

**A kiköltözés napja nem lehet korábbi a beérkezésnél.** Ennélkül egy
elgépelt évszám minden előírást a „kiköltözés utáni" közé sorol, és a
lezárás mindet törli — a felület pedig sikert jelent.

**És amiről valamelyik fél már nyilatkozott, azt a lezárás nem viszi el.** A
bizonylat és a beérkezés-igazolás az előíráson lóg kaskáddal, tehát egy
törölt sorral a másik fél feltöltött fájlja és a „erre nem érkezett pénz"
nyilatkozata is végleg elveszne, a kiadott elszámolás pedig előírás nélkül
maradna — és a visszavonás sem hozná vissza, mert a pótlás csak új, üres
sort tud csinálni. Ezeket megtartjuk, és a felület meg is mondja, hányat és
miért.

**Az arányosítás a saját sorainkra fut**, azokra, amiket a rendszer számolt:
a teljes havi összegre és a `reszletezes`-sel jelölt töredékre egyaránt.
Amit ember írt át, ahhoz nem nyúlunk. A töredék korábban kimaradt, és pont
az esett ki vele, amikor valaki egy hónapon belül költözött be és ki.

**Akinek már állítottunk ki igazolást, azt nem lehet levenni a
jogviszonyról**: az `Igazolas` a bérlő során lóg, tehát a levétel a kiadott
okiratot is elvinné, mindkét fél tárából — holott az a bérlőé is. Aki
igazolást kapott, az ténylegesen ott lakott; az ő részvételét a jogviszony
lezárása zárja le. A levétel arra való, akit tévedésből vagy még okirat
előtt vettek fel.

A lezárás ezért eltárol egy második dátumot is (`ertekelesAblak`): a `vege` a
kiköltözés beírt napja, ez pedig az, ahonnan a lezáráshoz kötött határidők
futnak. A kettő eltér, ha a bérbeadó utólag rögzíti a lezárást — a bérlő addig
nem is látta, hogy a bérlet lezárult —, és akkor a rögzítés napja számít. Előre
rögzített lezárásnál viszont a kiköltözés napja a későbbi, és az a kezdet: a
bérlet addig még fut. **Ezt egyszer állítjuk be, és a visszavonás is csak akkor
törli, ha a jogviszonyon még egy értékelés sem született**; különben egy
visszavonás-újralezárás tetszőleges sokszor újraindítaná a határidőt.

## Belépés és jogosultság

Minden oldal és minden szerveroldali művelet a belépett felhasználóból indul ki
(`kotelezoSzerep`), soha nem abból, amit az űrlap küld. A bérbeadói adatokhoz a
lekérdezés mindig szűr a tulajdonosra, a bérlői oldal a saját jogviszonyaira.

A bérlő fiókja meghívóval készül. **Bérlői helyre csak bérlői, nem
letiltott fiók ülhet**: a szerep azt dönti el, melyik alkalmazást látja a
felhasználó, tehát egy bérbeadói fiók a bérlői helyen egyetlen bérlői lapot
sem nyit meg — nem tud nyilatkozni se látogatásról, se előfizetésről, se
értékelésről, azok örökké „várakozik" állapotban maradnának, és a meghívó
közben elhasználódna. A meghívó egyszer használható és lejár, és
meglévő fiók jelszavát soha nem írja felül: a link a bérbeadónál is megvan.

**Meghívót csak olyan helyre készítünk, ahol még nem ül fiók.** Az elfogadás
átírja a hely `berloId`-ját: ha a helyen már ott van a valódi bérlő, ez csendes
csere lenne — a bérlő lekerülne a jogviszonyról, a helyére pedig egy olyan fiók
ülne, aminek a bérbeadó ismeri a jelszavát, és onnantól az erősítene meg
fényképet, fogadna el elszámolást és írna értékelést a nevében. Ha tényleg
kicserélődik a bérlő, a régit le kell venni és az újat hozzáadni: az látszik is.

Ugyanebből következik, hogy **meglévő fiókot a meghívó csak annak a fióknak a
saját jelszavával köt a jogviszonyhoz**. A link a bérbeadó kezében van, tehát
az elfogadás önmagában nem a fiók gazdájától jön: enélkül a bérbeadó bárkinek a
meglévő fiókját hozzáköthetné a saját bérleményéhez, és az illető csak akkor
venné észre, amikor a bérlemény megjelenik nála. A jelszó ezen az úton sem
íródik felül, és újat sem állítunk be. Ami így is megmarad: aki a linket
megnyitja, a hibaüzenetből kikövetkeztetheti, hogy a címhez tartozik-e fiók.
Ezt e-mailes megerősítés zárná le, az pedig a küldőszolgáltatáson múlik.

## A rezsielszámolás alapelve

**Az elszámolás csak mért fogyasztást tartalmaz.** A rezsiátalány és a közös
költség havi előírás (`domain/eloirasok.ts`), és amíg az elszámolás is sort
csinált belőlük, a bérlő ugyanazt kétszer fizette — a példaadatban két hónapra
56 537 Ft közös költség 28 000 helyett —, az adóösszesítő pedig kétszer
számolta bevételnek. Egy tételnek egy helye van, és az a havi előírás: azon megy
végig a befizetés-egyeztetés is. Ebből következik, hogy **átalányos és „közös
költségben" módban nincs mit elszámolni**, a szerződés is ezt mondja ki, ezért
ott tételes elszámolás nem készül. Ezt a kiszolgáló tartja be, nem az űrlap
elrejtése, és a lap meg is mondja, miért nincs — egy üres tétellistából a
bérbeadó azt hinné, elromlott valami.

**Havi díjat naptári hónappal arányosítunk**, nem 365/12 napos átlaghónappal
(`haviAranyos`). Amazzal egy teljes hónapra sem a havi díj jött ki: egy
tízezres alapdíj szeptemberre 9863 Ft lett, januárra 10 192, februárra 9205. A
havi előírások modulja a hónap tényleges napjaival számol; két helyen két
szabályból az lett volna, hogy ugyanarra a hónapra a két lap más összeget mutat.

**Az óraállás mindkét szomszédjához mérődik**, nem csak a legutolsóhoz, és
jövőbeli napra nem rögzíthető. A régi szabály mellett egy visszakeltezett,
nagyobb állást a kiszolgáló elfogadott — a rákövetkező időszak fogyasztása
nullára esett, a csatornadíjjal együtt —, egy jogos utólagos pótlás viszont
elutasításra futott. Az állásnak felső korlátja is van: egy elgépelt,
irreálisan nagy szám különben bebetonozta a mérőt (onnantól minden valódi
leolvasás kisebb, tehát elutasított), és egész számot túlcsorduló összeget
próbált elmenteni.

Az egységár fillérben, egészben számol (`Int`), és forintra csak a kész tétel
kerekít. Az elszámolás végösszege a kerekített tételek összege, nem a
kerekítetlen összeg kerekítése: a bérlő össze fogja adni a sorokat.

**Óraállást az olvas, aki ott lakik.** A lezárt jogviszony mérőórái már a
bérbeadóé és a következő bérlőé: a volt bérlő rögzítése onnantól idegen
fogyasztást vinne az elszámolásba, és a saját záró óraállását is felülírhatná.
A felület sem kínálja fel neki, de a szabályt a kiszolgáló tartja be — a bérlő
lapja nyitva maradhat akkor is, amikor a bérbeadó épp lezárja a jogviszonyt.

Az éves kedvezményes keret az elszámolt napokra arányosítva jár. Minden tételhez
tartozik emberi nyelvű részletezés; számot magyarázat nélkül nem küldünk ki.

A vízóra mért köbmétere után két díj jár: az ivóvízé és a szennyvízelvezetésé.
A csatornadíj ezért a vízóra díjszabásának része (`csatornaArFiller`), nem külön
mérőóra: külön óraállás nincs hozzá, és nem is lenne mit leolvasni rajta. Sávja
nincs, mert a víz- és csatornadíj nem a rezsicsökkentés kétsávos rendszerében
megy. A nulla ár nem hiányzó adat, hanem érvényes eset: a locsolási mellékmérőn
átfolyt víz nem megy csatornába, és emésztőgödrös ingatlanon sincs mit elvezetni.

Az elszámolásban külön sor, nem a vízdíjba olvasztva, mert a vízszámla is így
írja, és a bérlő a kettőt össze fogja vetni. A fajtája ettől ugyanúgy mért
fogyasztás, tehát az adóösszesítő továbbhárítva nem számolja bevételnek.

## Az adóösszesítő alapelve

Összesítő, nem bevallás; a felület is ezt mondja. A bevétel pénzforgalmi: a
párosított, bérbeadó által igazolt beérkezésekből számol, nem az előírásokból.

A fogyasztás szerint mért, továbbhárított közüzemi díj nem bevétel; az átalány
igen. Vegyes elszámolásnál a befizetés a tételek arányában oszlik meg, és a
kerekítés maradéka a nem mért részre kerül, hogy a két rész összege pontosan a
befizetés legyen. Minden bevételi sor mellé indoklás kerül.

**Minden előírástípusnak saját indoklása van.** A rezsiátalány és az
előfizetés-térítés korábban „egyéb"-ként ment át, és a besoroló a bérleti díj
indoklását adta hozzá: a könyvelői CSV-ben egy 25 000 forintos átalány
mellett az állt, hogy „Bérleti díjként befolyt összeg". Az összeg
bevételként jó volt, az indoklás hamis — és az ígéretünk az, hogy minden
bevételi sor mellé indoklás kerül.

A CSV-ben a besorolatlan beérkezésnek **saját oszlopa** van. Korábban a
„Bevétel" oszlopban állt, az összesítő sor viszont nem számolta bele: a
könyvelő az oszlopot összeadva más számot kapott, mint ami az összesítésben
állt, és nem látszott, melyik a jó.

Amit nem tudunk besorolni (előírás nélkül beérkezett pénz), azt nem tippeljük
meg: külön listán megy a bérbeadóhoz.

## Az előfizetések alapelve

A vezetékes tévé, telefon és internet opcionális: sok albérlethez nincs, és
amelyikhez van, ott sem egyforma. A lényegi adat nem a szolgáltató, hanem hogy
**ki az előfizető** (`Elofizetes.elofizeto`), mert a kettő pénzügyileg nem
ugyanaz. Ha a bérbeadó az előfizető, a számla az ő nevére jön, és a bérlő neki
téríti meg: ebből havi előírás lesz. Ha a bérlő az előfizető, ő szerződik és ő
fizet a szolgáltatónak — pénz nem megy át az alkalmazáson, de a szerződésbe
attól még bekerül, mert a létesítés és a megszüntetés a bérleményt érinti.

A jóváhagyás nem formaság. A bérlőnek olyan havi kiadása keletkezik, amiről a
szerződéskötéskor nem volt szó, ezért ugyanaz a kétoldali elv áll rá, mint a
befizetésre és a fényképre: a bérbeadó beállítja, a bérlő a saját adatával mond
rá igent vagy nemet, és **amíg nem mondta, nem írunk elő belőle semmit**.
Jóváhagyni mindenkinek kell, akinek van fiókja; egy kifogás viszont egymagában
is dönt, mert a lakótárs nem szavazhatja le azt, aki nem kéri a szolgáltatást.
Fiók nélküli bérlőt nem lehet megkérdezni, és a felület ezt ki is mondja.
Kifogás indoklás nélkül nincs, és a kifogás nem törli az előfizetést.

Az előírás előfizetésenként külön sor, nem összevonva: két előfizetés más napon
indulhat és más napon szűnhet meg, tehát az arányosításuk sem ugyanaz. Ezért kapott
az `EloirtTetel` `forrasId` mezőt, és ezért lett az egyediségi kulcs
`jogviszonyId + tipus + idoszak + forrasId`. A mező üres szöveg, nem null: a
null az egyediségi kulcsban külön értéknek számítana, és ugyanarra a hónapra
kétszer is beengedné a bérleti díjat.

Az előfizetést törölni nem lehet, csak megszüntetni egy nappal, ugyanúgy, ahogy
a jogviszonyt: a lefutott hónapok előírásai mögött ez az előfizetés áll, és a
bérlő már ki is fizette őket.

Az előfizetés a szerződésbe is bekerül (`elofizetesek` modul), abból, amit az
alkalmazás már tud: így nem állhat más a szerződésben, mint az előfizetések
lapján. Csak a jóváhagyott és még élő előfizetés kerül bele — amiről a bérlő
nem nyilatkozott, az nem szerződéses kötelezettség.

## A záradék alapelve

Amit a felek aláírtak, azt nem írjuk át: a `veglegesSzoveg` be is fagyasztja.
Ha a hatályos szerződés utóbb kiegészül — jellemzően előfizetéssel —, a
kiegészítés **külön okirat**, záradék.

A záradék ugyanabban a táblában él, mint a szerződés (`Szerzodes.fajta`,
`alapSzerzodesId`), mert minden más ugyanaz: modulokból épül, ugyanúgy
véglegesül és fagy be, ugyanúgy kerül a dokumentumtárba, és a bérlő ugyanúgy
csak véglegesítés után látja. Külön táblában ugyanez a viselkedés még egyszer
meg lenne írva, és a második példány előbb-utóbb elmaradna az elsőtől.

Két dolog viszont más. A záradéknak nincs kötelező modulja: nem egy második
teljes szerződés, tehát amit a felek már aláírtak, azt nem írja le újra — két
szöveg utóbb eltérhetne egymástól. És van két elhagyhatatlan, nem modulos
része: megnevezi az alapszerződést, és kimondja, hogy annak többi rendelkezése
változatlanul hatályban marad. Enélkül vitatható lenne, mi maradt érvényben.
Ez a két rész a tervezetben is látszik, nem csak a véglegesítés után.

A kódban a `zaradekSorok` név korábban az aláírási részt jelentette (kelt,
aláírók, tanúk); az `alairasSorok` lett belőle, mert két különböző dolgot nem
hívhat ugyanaz a szó.

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

Ebbe beletartozik az is, hogy **ki viseli a közös költséget: az adat, nem
kérdés**. A jogviszonyon beállított összeg az, amit az alkalmazás havonta elő is
ír a bérlőnek; amíg ez külön paraméter volt „a bérbeadó" alapértelmezéssel, az
aláírt szerződés azt mondta, hogy a közös költség a bérbeadót terheli, miközben
az alkalmazás minden hónapban a bérlőtől kérte. A jogviszony összege az
irányadó, nem az ingatlané: az ingatlanon rögzített közös költség a bérbeadó
saját költsége, és abból olyan mondat lett, hogy a bérlő havi 30 000 forintot
visel, holott egy fillért sem írtunk elő neki.

Véglegesítéskor a kész szöveget elmentjük (`veglegesSzoveg`). Amit a felek
aláírtak, azt egy későbbi modulfrissítés nem írhatja át.

**A modulparaméter alapértelmezése annak a modulnak a szövege, amelyik hozza**,
tehát csak addig szól, amíg az a modul benne van az okiratban. A szerződésen ez
nem változtat semmit, mert ott a kötelező modulok mindig benne vannak; a
záradékon viszont igen, mert ott semmi nem kötelező. A tanúsor korábban a záró
modul bekapcsolása nélkül is ott állt a záradék alján, és a bérbeadó sehol nem
tudta kikapcsolni.

A **dátumparaméter** nem az űrlap gépi alakjában kerül a szövegbe (`pd`, nem
`p`): egy aláírandó okiratban a „2027-06-15 napjáig" idegen test, magyarul
„2027. június 15.", angolul „15 June 2027". Ugyanez az elv a tizedesjegyre: a
másfél havi óvadék magyarul „1,5 havi", nem „1.5 havi".

A személyes adatok (születési adatok, anyja neve, igazolványszám, adóazonosító)
kizárólag a dokumentumok kiállításához kellenek. A bérbeadóé külön táblában van
(`BerbeadoiAdatok`), hogy a belépési út ne is olvassa. Naplóba egyik sem kerül.

**Mindkét fél a sajátját adja meg** (`src/domain/szemelyes-adatok.ts`). Korábban a
bérlő adatait a bérbeadó gépelte be helyette: így a bérlő nem látta, mi áll róla a
szerződésben, és egy elgépelt igazolványszámot nem vett észre az, aki tudta volna,
hogy rossz. A bérbeadó továbbra is kitöltheti, mert szerződést azelőtt is kell tudni
készíteni, hogy a bérlő először belépne — de `adatokForrasa` megmondja, melyik oldal
írta, és a felület is kiírja.

Az adatkérés az első belépés után egyszer jön elő (`adatkeresLatta`), és nem tiltja
el a felhasználót semmitől: aki most kapott meghívót, ne azzal találkozzon először,
hogy az anyja nevét kell begépelnie, mielőtt megnézhetné, mit kell fizetnie. A
hiányra onnantól származtatott teendő emlékeztet.

**Személyazonosságot az alkalmazás nem igazol, és ezt ki is mondja.** Amit a felek
megadnak, az a saját állításuk. A szerződés véglegesítése ezért nyugtázáshoz kötött:
a bérbeadónak meg kell erősítenie, hogy megnézték egymás fényképes igazolványát. Ez
nem ellenőrzés, hanem annak a beismerése, hogy nem tudunk ellenőrizni — és pont ezért
nem szabad elhagyni.

## A szerződés fordításának alapelve

A bérlő gyakran nem olvas magyarul, és mégis ő az, aki a szerződésben vállal
valamit. Az okirat ettől még magyar marad: **amit aláírnak, az a magyar szöveg,
és eltérés esetén is az az irányadó.** A fordítás melléklet, nem másik verzió,
és nem is a szerződés új nyelvi változata.

Ezt nem elég a lapon kiírni. A szöveget kimásolják, elküldik, kinyomtatják, és
onnantól a lap már nincs mellette. Ezért **az angol okirat maga kezdi azzal**,
hogy tájékoztató fordítás, és hogy a magyar az irányadó (`FORDITAS_FEJLEC`).

A fordítás **modulonként készül** (`src/domain/szerzodes-modulok-en.ts`), nem a
kész magyar szövegből. Két oka van, és egyik sem kényelmi. A kész szöveg már
tartalmazza a felek személyes adatait — születési hely, anyja neve,
igazolványszám —, és azt egy külső fordítószolgáltatáshoz küldeni pont az, amit
az alkalmazás sehol máshol nem tesz. A másik, hogy a kész szövegben az összeg
betűvel is ki van írva, és egy gépi fordító ezt vagy elrontja, vagy alkalmanként
másképp rontja el; ugyanannak a szerződésnek viszont holnap is ugyanaz a
fordítása kell legyen. Így a jogi keret fordul le, az adat a helyén marad, és a
szöveg futásidőben nem függ semmitől.

Az angol katalógus **külön fájlban** él, nem a magyar modul mellett: a magyar
szöveg az, amit ügyvéddel ellenjegyeztetünk, az angol pedig kifejezetten nem
jogi szöveg. Egy fájlban a kettő azt sugallná, hogy az ellenjegyzés erre is
vonatkozik.

**A számozás mindig a magyar szövegből következik.** A felek a pont sorszámára
fognak hivatkozni egymásnak; ha egy modul angolul más számú bekezdést adna, a
két okirat elcsúszna. Ezért a szakaszok kiválasztását és sorszámozását a magyar
szöveg dönti el, és a fordítás ugyanazt a pontot ugyanazon a sorszámon viszi.

Amit a bérbeadó maga gépelt be (közlemény, dátum, saját szöveg), az a
fordításban is úgy marad: az az ő adata. A **modul alapértelmezése** viszont a mi
szövegünk, tehát annak van angol párja (`ALAPERTELMEZES_EN`) — különben az, aki
nem írja felül, magyar mondatot kapna az angol példányban.

Véglegesítéskor a fordítás is befagy (`veglegesSzovegEn`), a magyar mellé.
Amit aláírtak, annak a fordítása se változzon meg egy későbbi modulfrissítéstől.
Ami a fordítás előtt lett véglegesítve, ahhoz nincs és nem is lesz: egy most
készült fordítás már nem ahhoz a szöveghez tartozna, és a felület ezt ki is
mondja.

A kapu (`src/__tests__/szerzodes-forditas.test.ts`) a **kész angol okiratot**
olvassa, nem a forrást: azt méri, amit a bérlő a kezébe kap. Elbukik, ha egy
modulhoz nincs angol szöveg, ha egy angol mondatban magyar maradt, vagy ha a két
nyelv számozása elcsúszik. A példaadata szándékosan ékezet nélküli, mert a felek
neve és címe a fordításban is magyarul marad, és attól a mérés hamisan bukna.

## A jegyzőkönyv és az igazolás alapelve

Az átadás-átvételi jegyzőkönyv nem különálló papír: véglegesítéskor a rögzített
óraállások bekerülnek a mérőórák történetébe, így a birtokbaadás állása lesz az
első rezsielszámolás kiindulópontja. A felelőssel és határidővel vállalt hibákból
teendő lesz, mert a birtokbaadáskor tett ígéret egyébként elvész.

Az óraállás mezője szabad szöveg, mert a helyszínen mértékegységgel együtt
írják be. A számot kiolvassuk belőle; ha nem megy, nem tippelünk, hanem szólunk.

**Igazolás csak bérleti díjról szól, és mindig egy megnevezett előírásról**, nem
egy hónapról. Az okirat szövege azt mondja ki, hogy a bérletidíj-fizetés
megtörtént — ebből igényel a bérlő albérlettámogatást —, a hónapra keresve
viszont a közös költség és egy ezerforintos előfizetés befizetése is
igazolható volt, ugyanazzal a mondattal, és a „beérkezettnél nem több"
korlát is a rossz sorhoz mérődött. Egy hónapban több bérletidíj-sor is
állhat, ezért az űrlap az előírás azonosítóját küldi.

**És amire már kiadtunk papírt, azt nem olvasztjuk vissza.** A véglegesített
szerződés nem állítható vissza tervezetre, ha véglegesített záradék épül rá
— a záradék mondata a többi rendelkezés hatályban maradásáról különben
semmire nem mutatna —, vagy ha már állítottunk ki igazolást, mert az a
szerződés keltét idézi, és a kelte a visszavonás után más lehet.

A bérbeadói igazolás összegét és a teljesítés napját a párosított befizetésből
vesszük, nem kézi beírásból. Amelyik hónapra nincs beazonosított befizetés,
arra nem ajánlunk igazolást, és a beérkezettnél többet sem igazolunk.

### A fényképalbum

Az állapotot szavakkal nehéz rögzíteni, képpel nem. A kiköltözéskori vita
jellemzően nem az, hogy van-e folt a falon, hanem hogy **eddig is ott volt-e**
— ezt csak két kép dönti el egymás mellett.

A kép a jegyzőkönyvhöz tartozik, és ha valamelyik tételről készült, akkor ahhoz
a tételhez (`JegyzokonyvKep.tetelId`). Nem különálló album: a „karcos a
konyhapult" sor mellett ott legyen a kép, ne egy ötven képes mappában kelljen
keresni.

A megerősítés a másik fél külön adata, ugyanaz a kétoldali elv, mint a
befizetésnél és a hibabejelentésnél: aki feltöltötte, azt állítja, hogy ezt
látta, a másik fél pedig rábólint vagy kifogást emel. A saját képére senki nem
bólinthat rá, attól nem lenne kétoldali. **A kifogás nem törli a képet**:
mindkét állítás ott marad egymás mellett, mert egy fél által kitakarított
album pont annyit érne, mint a bemondás. Kifogás indoklás nélkül nincs, abból a
másik fél nem tud kiindulni.

Ez fordítva is igaz: **a feltöltő sem törli a képet azután, hogy a másik fél
nyilatkozott róla**, se megerősítés, se kifogás után. Különben ugyanoda
jutnánk, csak a másik oldalról. Aki cserélni akar, új képet tölt fel; a régi
mellette marad, és a két állítás különbsége pont az, ami utólag számít.

A kiköltözéskori kép a birtokbaadáskorihoz kötődik (`parjaId`), és a záró
jegyzőkönyv kiírja, melyik nyitóképnek nincs még párja: az a feladatlista.

A véglegesített jegyzőkönyv albuma zárt — kép nem kerülhet bele és nem tűnhet
el belőle. A megerősítés viszont utána is megy, mert az a nyilatkozó saját
adata, és az albumot nem változtatja meg. A bérlő ezért **a tervezet képeit is
látja**, szándékos kivételként a dokumentumtár szabálya alól: a megerősítés
akkor ér valamit, ha a véglegesítés előtt történik. A jegyzőkönyv *szövegét* ő
továbbra is csak véglegesítés után látja.

A fájl típusát a tartalmából állapítjuk meg (`tipusATartalombol`), nem a
böngésző bemondásából: ezt a tartalmat a másik fél böngészője fogja megnyitni a
mi címünkön. Csak JPG, PNG és WEBP megy át. Az SVG azért nem, mert az
futtatható dokumentum, nem fénykép; a HEIC pedig azért nem, mert a böngészők
nagy része nem rajzolja ki, és épp az nem látná, akinek mutatják — a felület
ezt meg is mondja, különben a bérbeadó azt hinné, elromlott.

A teendők többsége származtatott: a rendszer állapotából jön, és magától eltűnik,
ha az oka megszűnik. A vállalt javítás viszont tárolt teendő (`Teendo`), mert azt
valaki vállalta, és le is kell tudni zárni.

## A kölcsönös értékelés alapelve

A bérlőszűrés legális megfelelője. Magánszemély bérbeadóként nincs jogszerű
módja annak, hogy a leendő bérlőről előzményt kérjünk le: bérlői feketelista
nincs, és nem is lehet. Ami marad, az a két félnek az egymásról tett saját
állítása — tehát nem mérés, hanem vélemény, és a felület ezt ki is mondja.

Két dolog dönti el, hogy ér-e valamit.

**Mikor.** Csak a jogviszony lezárása után. Amíg a bérlet fut, az óvadék még a
bérbeadónál van, a következő hibabejelentés még előtte: aki függ a másiktól, az
nem a véleményét írja le.

**Vakon.** Amíg mindkét fél meg nem írta a sajátját, egyik sem látja a másikét.
Enélkül a második értékelés az elsőre adott válasz lenne, nem a bérletről
szólna. Ezt a kiszolgáló tartja be, nem a felület: a másik szövegét nem is
töltjük be, mert egy elrejtett, de betöltött szöveg ott állna a lap forrásában.
A böngészős próba ezért a lap **teljes forrásában** keres, nem a látható
szövegben.

A felfedés két úton jön: mindkettő megvan, vagy letelt az ablak
(`ABLAK_NAP`, 30 nap). Az ablak nélkül elég lenne hallgatni ahhoz, hogy a rólunk
szóló értékelés eltűnjön. Felfedés után senki nem ír és nem módosít: amit a
másik fél elolvasott, azt nem írjuk át — ugyanaz az elv, mint a `veglegesSzoveg`
befagyasztásánál.

**A harminc nap nem a beírt kiköltözési naptól számít, hanem attól, amit a
lezárás pillanatában eltároltunk** (`ablakKezdete`, a `Jogviszony.ertekelesAblak`
mezőből; a kezdetet `ablakotKezd` állítja elő). A kettő rendes esetben
egybeesik, de ha a bérbeadó utólag rögzíti a lezárást, nem: a bérlő addig nem is
látta, hogy a bérlet lezárult, tehát értékelni sem tudott. A dátum ráadásul a
bérbeadó kezében van, és a `vege`-től számolva egy visszakeltezett lezárás
azonnal felfedné a másik fél addig rejtett szövegét, és elvenné tőle a sajátja
megírását — vagyis pont az a fél keltezne vissza, akinek ez az érdeke.

**És nem is indul újra.** A lezárás visszavonható, utána újra le lehet zárni; ha
az ablak minden lezáráskor nulláról indulna, a bérbeadó egy visszavonással új
harminc napot adhatna magának — akár olyat is, amiben már elolvasta a másik fél
felfedett szövegét. Ezért a tárolt kezdet csak akkor áll be, ha még nincs, és a
visszavonás is csak akkor törli, ha ezen a jogviszonyon még egy értékelés sem
született: egy elkattintott lezárásnak ne maradjon nyoma, egy megírt
értékelésnek viszont igen.

A harminc nap oka ugyanaz, mint a beszélgetés kilencvenéé, csak rövidebb: az
óvadék elszámolása és az utolsó rezsiszámla a kiköltözés utáni hetekben derül
ki, ezek nélkül a bérlet felét nem lehetne értékelni. Fél év múlva viszont már
senki nem emlékszik rá, mikor jött a szerelő.

Az értékelés személyről szól, nem jogviszonyról: két lakótársnál a bérbeadónak
két külön értékelése van ugyanazon a jogviszonyon, és a lakótárs nem felel a
másikért. Fiók nélküli bérlőt nem lehet értékelni, és értékelni sem tud; a
felület ezt kimondja.

**Pontszámot nem vonunk össze.** Három szempont van irányonként, és az átlaguk
mérésnek látszana: aki pontosan fizetett, de a lakást tönkretette, nem
„közepes". A szempontok listája kódban él (`src/domain/ertekeles.ts`), nem az
adatbázisban, ugyanazért, amiért a szerződésmodulok katalógusa.

Amit az első kiadás **nem** csinál: az értékelést nem viszi ki a két fél közül.
Hogy egy bérlő a róla szóló értékelést megmutathatja-e egy leendő bérbeadónak,
az termékdöntés és adatvédelmi kérdés egyszerre, és a betekintő gépezete
(saját hozzájárulás, visszavonható link) készen áll rá — de ezt a bérbeadónak
kell eldöntenie, az ügyvédi átnézéssel együtt.

## A bemutatkozó oldal alapelve

Minden felhasználónak van bemutatkozó oldala: amit magáról ír, és a róla szóló
értékelések egy helyen, több jogviszonyból.

**Csak a felfedett értékelés látszik rajta, és csak az számít bele a
darabszámba is.** Ha a rejtett is beleszámítana, a puszta szám elárulná, hogy a
másik fél már írt — abból pedig a vakság maradéka is elveszne: aki látja, hogy
„1 értékelés” áll a másik oldalán, az tudja, mihez kell igazodnia.

Összevont pontszám itt sincs, ugyanazért, amiért egy értékelésen belül sincs.
Szempontonként viszont van átlag, mert ott több ember ugyanazt a dolgot mondja
— és mellé mindig odaírjuk, hány értékelésből jött, mert kettőnek az átlaga nem
ugyanaz, mint tízé.

**A lap egyelőre nem nyilvános**: csak a felhasználó maga és az üzemeltető
nyitja meg (`lathatja`), és ezt a kiszolgáló dönti el, nem a hivatkozás
elrejtése. Hogy egy bérlő megmutathatja-e a róla szóló értékelést egy leendő
bérbeadónak, termékdöntés és adatvédelmi kérdés egyszerre, és az ügyvédi
átnézéssel együtt a bérbeadóé. Amíg nincs döntés, a szűkebb kör a helyes
alapértelmezés: egy tévedésből kiadott értékelést nem lehet visszavenni.

A rendszergazda nem a `szerep` harmadik értéke, hanem külön jelölő
(`Felhasznalo.rendszergazda`): a szerep azt dönti el, melyik alkalmazást látja
a felhasználó, az üzemeltetői rálátás pedig erre jön rá. Felületről nem adható
meg, csak az adatbázisban — egy jogosultság, ami a felületről kérhető,
előbb-utóbb kikerül oda, ahol nem kellene.

### A rendszer saját értékelése

Az üzemeltető a humán értékelés mellett a rendszerét is látja
(`src/domain/gepi-ertekeles.ts`): pontosság, válaszidő és együttműködés. Ez
szándékosan más természetű, mint a kölcsönös értékelés. Az vélemény, amit nem
mérünk; ez mérés, abból, amit az alkalmazás maga rögzített — az egyeztetésből,
a hibabejelentések és az üzenetek időpontjaiból, és abból, hány kétoldali
kérdésre nyilatkozott egyáltalán az illető.

Négy dolog tartja a helyén:

- **Csak a rendszergazda látja.** A felhasználó sem magáról, sem a másik félről
  nem. Egy gépi pontszám, amit a másik fél is lát, észrevétlenül bérlőszűrő
  listává válna, és pont az lenne belőle, amit a termék kerül. Egy pontszám,
  amit a saját tulajdonosa lát, pedig arra ösztönözne, hogy a mutatóra
  játsszon.
- **Számot magyarázat nélkül nem adunk.** Minden szemponthoz ott a minta mérete
  és az egy mondatos indoklás, ugyanúgy, mint a rezsielszámolás tételeinél.
- **Amiből nincs elég adat, arra nem tippelünk.** A pont ilyenkor `null`, nem
  nulla és nem hármas, és a lap ki is írja, hogy nincs elég adat: a „nem
  tudjuk” nem rossz jegy. A határ `LEGKISEBB_MINTA`, mert háromnál kevesebből
  az arány önmagát magyarázná.
- **Nincs eltárolva.** Minden lekérdezéskor újraszámol, tehát magától követi, ha
  a viselkedés megváltozik — ugyanaz az elv, mint a származtatott teendőknél és
  az archiválásnál.

A pontosság a két szerepnél mást mér, és ez szándékos: a bérlőé az, hogy a pénz
a kiírt összegben és időben megérkezett-e, a bérbeadóé az, hogy a saját oldalát
vezette-e. A bérbeadó nem fizet, tehát egy nem fizető bérlő nem ronthatja az ő
pontosságát. A vitás tétel viszont egyik oldalon sem rontja az
együttműködést: vitatkozni szabad, és az együttműködés hiánya az, ha valaki nem
is válaszol. A válaszidő sávjai az alkalmazás alapértelmezései, nem
jogszabályi határidők, és a felület ezt ki is mondja — ugyanúgy, ahogy a
hibabejelentés válaszhatáridejénél.

A válaszidő mediánt néz, nem átlagot: egyetlen nyaralás alatt megkapott válasz
nem minősítheti a többit.

**Csak az számít nyitott kérdésnek, amit tényleg neki tettünk fel.** A lakótárs
fényképére a bérlő ugyanúgy nem bólinthat rá, mint a magáéra (a megerősítés
szerep szerint megy), tehát az nem az ő elmaradt válasza; a saját bejelentésére
pedig senki nem válaszol, tehát abból a bérbeadónak nem lesz nulla órás
válaszideje. És a válasz is névre szól: a képnél a megerősítés azonosítóját
nézzük, nem azt, hogy valaki nyilatkozott-e. A kifogásnál nem tároljuk, ki
emelte, ezért az ilyen kép inkább kimarad a mintából, mint hogy tippeljünk.

## Az üzemeltetői lap alapelve

Az üzemeltetőnek két kérdése van: **működik-e az alkalmazás, és van-e valami
elakadva.** Ehhez összesítő számok kellenek és a rendszer saját állapota, nem
mások bérleti ügyei. A lap ezért **csak darabszámot** mutat más emberekről, a
néven és a szerepen túl, amit a névsor eddig is kiírt: hány fiók, hány
bérlemény, hány élő és lezárt bérlet, hány nyitott hiba, és hány kétoldali
kérdés vár még válaszra. Bérleményt, jogviszonyt és befizetést nem.

Ez nem óvatoskodás. Egy üzemeltetői fiók, ami mindent lát, észrevétlenül
ugyanaz lesz, mint a bérlőszűrés, amit a termék kerül — és a betekintőnél is
pont ezt mondtuk ki: amit egyszer kiadtunk, azt nem lehet visszavenni. Ha a
részletekre mégis szükség lesz, azt külön kell eldönteni, nem egy bővülő
adminlap mellékhatásaként.

A válaszidő sávjai (`VALASZIDO_FIGYELEM_MS`, `VALASZIDO_GOND_MS`) az alkalmazás
alapértelmezései, nem szolgáltatói vállalások, és a lap ezt ki is mondja —
ugyanúgy, ahogy a hibabejelentés válaszhatáridejénél és a gépi értékelés
válaszidejénél.

**A fiók letiltása nem törlés.** A jogviszony, a befizetés és a kiadott okirat
a másik félé is: egy törölt fiókkal azok is eltűnnének, és a bérbeadó szerződése
a saját bérlőjéről szólna úgy, hogy a bérlő már nincs sehol. A letiltás a
belépést veszi el, és a `Felhasznalo.letiltva` dátum azért dátum, nem logikai
jelölő, mert az üzemeltetőnek az a kérdése, hogy mióta.

**A letiltás a munkamenetre is hat**, nem csak a belépőlapra. A süti harminc
napig él: ha csak a belépést tiltanánk, a már belépett fiók a letiltás után is
zavartalanul dolgozna tovább — épp az, akitől az üzemeltető elvette a
hozzáférést. A `belepettFelhasznalo` ezért a letiltottra `null`-t ad, tehát
minden lap és minden kiszolgálói művelet elutasítja. A belépőlap válasza
ugyanaz, mint a rossz jelszóé: aki a címeket végigpróbálja, abból se tudja meg,
hogy van ott fiók, csak épp letiltva.

**Magát senki nem tilthatja le.** Ha az egyetlen rendszergazda kizárja magát,
onnantól az adatbázishoz kell nyúlni ahhoz, hogy bárki üzemeltetni tudja az
alkalmazást. Ezt a domain mondja ki (`fiokmuveletetEllenoriz`), és a kiszolgáló
tartja be — a gomb elrejtése nem védelem, és a böngészős próba pont egy
hazudott űrlapmezővel próbálja ki.

**Minden üzemeltetői művelet naplóba kerül** (`AdminNaplo`), és a felületről
nem törölhető: egy napló, amit az tud kitörölni, akit naplóz, nem napló. A
tiltás és a naplósor egy tranzakcióban megy, mert egy napló, ami a műveletek
egy részéről lemarad, rosszabb a semminél — hinni lehet neki. Ez az egyetlen
naplónk: a kódban konzolra továbbra sem írunk, és személyes adat ide sem kerül,
csak az érintett sor azonosítója.

## A teendők és a naptár alapelve

A teendő nem tárolt igazság: a rendszer állapotából származik
(`src/domain/teendok.ts`), és magától eltűnik, ha az oka megszűnik. Egy nyitott
hibabejelentés, egy esedékes befizetés, egy hiányzó személyes adat mind teendőt
ad, és egyiket sem kell lezárni — ha lezárhatóak lennének, a lezárás után is
megmaradna a baj, csak már nem látszana.

Két kivétel van, és mindkettő ugyanazért: valaki vállalta. A jegyzőkönyvben
határidővel vállalt javítás és a kézzel felvett saját teendő tárolt
(`Teendo` tábla), ezért lezárható — **és a lezárás visszavonható**, mert egy
elkattintott „kész" különben csendben eltüntetné, amit valaki vállalt. Ugyanaz
az elv, mint a jogviszony lezárásánál.

**A teendő hivatkozása címzettenként más**, mert a két fél más lapon látja
ugyanazt a tételt, és a teendő egész kártyája hivatkozás. A bérlőnek adott
`/befizetesek` a `kotelezoSzerep("berbeado")`-n akadt fenn és visszadobta a
`/berlo`-ra, a `/berlo/befizetesek` pedig soha nem létezett: a bérlő minden
befizetéses teendője ugyanoda vitt, akármelyikre kattintott.

**És a vállalás teendője azé, aki vállalta.** A jegyzőkönyvi vállalás
feltétel nélkül a bérbeadóé volt, a bérlő vállalása is — a bérlő tehát nem
látta és nem is tudta lezárni azt, amit ő ígért meg a birtokbaadáskor. Pont
azért tárolt teendő ez, mert valaki vállalta.

A kézzel felvett teendő azért kell, mert a bérlet hétköznapja nem következik
abból, amit az alkalmazás tud: a kéményseprő érkezése, a biztosítás évfordulója,
a felmondási határidő előtti döntés sehonnan nem vezethető le. A kulcsa külön
előtagot kap, hogy soha ne üsse ki a származtatottat.

A naptár (`src/domain/naptar.ts`) nem a lista másik rendezése. A listából az
derül ki, **mi** van hátra, a naptárból az, hogy **mikor** — és ehhez az üres
nap is adat, amit egy lista nem tud megmutatni. Ezért van a nyitólapon a
következő hét nap sávja, és ezért van a teendők lapján havi rács.

Mindkettő ugyanabból a számításból jön, tehát nem tud elcsúszni egymástól. Egy
naptárcellába egy jelzés fér, a legsürgetőbb, és ezt is a domain dönti el, nem a
megjelenítés: két külön szabályból előbb-utóbb az lenne, hogy a lista pirosat
mutat, a naptár nem.

A hét hétfővel kezdődik mindkét nyelven, mert a magyar és a brit naptár is
hétfős. A napnevek a `nyelv.ts`-ből jönnek, nem beégetett tömbből: pont ez az a
hiba, amit a formátumkapu meg akar fogni.

A lejárt teendő nem csúszik a mai napra. A ma esedékes és a két hete lejárt nem
ugyanaz, és aki a mai cellában látná mindkettőt, azt hinné, ma keletkezett —
ezért a hétsáv külön sorban mondja meg, hány lejárt tétel van, a havi rács pedig
kiírja, ha a lejárt tétel nem ebben a hónapban van.

## A szolgáltatói látogatás alapelve

Kéményseprő, mérőóra-leolvasás, szerelő, bérleménymutatás. Eddig SMS-ben ment,
és épp az veszett el belőle, ami utólag számít: ki mit vállalt.

A megválaszolandó kérdés **nem az, hogy mikor jön a szerelő** — azt a szolgáltató
mondja meg —, hanem hogy **ki engedi be**. Ezért a látogatásnak nem „elfogadva"
és „elutasítva" állapota van, hanem az, hogy a bejutás módja tisztázott-e.

A bérbeadó nem mehet be a bérlő távollétében pusztán azért, mert övé az
ingatlan. Ha kulccsal megy be, ahhoz a bérlő kimondott hozzájárulása kell — nem
azért, hogy bizonyíték legyen, hanem mert enélkül a bérlő nem tudná, mibe
egyezett bele.

Három válasz van, mert ennyi eset van: itthon leszek; nem leszek itthon, de a
bérbeadó beengedheti a kulccsal; nem jó ez az időpont. A harmadik indoklás
nélkül nincs, mert abból a másik fél nem tud új időpontot javasolni — ugyanaz,
mint a fénykép és az előfizetés kifogásánál.

Bejelenteni mindkét fél tud: a kéményseprőt a bérbeadó hívja, a saját szerelőjét
viszont a bérlő. **Ha egyetlen bérlőnek sincs fiókja, nincs kitől hozzájárulást kérni** — és
akkor pont nem az jön ki, hogy „senki nem lesz itthon, de a bérbeadó bemehet a
kulccsal". Az üres várólista nem hozzájárulás, hanem hiányzó kérdés: saját
állapota van, és a bérbeadónak teendője lesz belőle.

**Nyilatkozni viszont mindig a bérlő nyilatkozik**, mert a
kérdés az ő lakásába való bejutásról szól, és ezt a kiszolgáló ellenőrzi, nem az
űrlap.

Több bérlőnél mindenkitől várunk választ, akinek van fiókja, és **egy kifogás
egymagában is dönt** — a lakótárs nem szavazhatja le azt, akinek nem jó. Amíg
valaki nem nyilatkozott, nem mondjuk, hogy eldőlt: a legrosszabb hiba az lenne,
ha a lap azt írná ki, „rendben, bejut a szerelő", holott a másik lakó még nem is
válaszolt. Fiók nélküli bérlőt nem lehet megkérdezni, és a felület ezt ki is
mondja.

**A nyilatkozat annyit ér, amennyit a mostani résztvevői kör.** A jogviszonyról
levett bérlő válasza ott marad a látogatáson, de a lakásba már nem ő megy haza:
a korábbi kifogása egymagában tovább döntött, és a bérbeadó hiába kérdezte meg a
mostani bérlőt. Aki nincs a várt válaszolók között, annak a szava sem dönt —
ugyanaz az elv, mint a beszélgetésnél: a résztvevői sor egymagában nem
jogosultság. Múltbeli napra pedig nem lehet látogatást bejelenteni: az rögtön
„elmúlt" állapotban születne, nyilatkozni sem lehetne rá.

Törölni nem lehet, csak lemondani, ugyanúgy, mint az előfizetést: a bérlő már
nyilatkozott rá, és egy eltűnt sor mellől az ő nyilatkozata is eltűnne. A
lemondás oka nem formaság — a bérlő ebből tudja meg, hogy nem kell otthon
maradnia.

Az időablak szabad szöveg, és nem kötelező: sok szolgáltató nem ad meg pontos
időt, és ezt jobb kiírni, mint kitalálni egyet. Amit megadtak, azt változatlanul
adjuk vissza, mert a bérlő azt fogja az SMS-sel összevetni.

A látogatásból teendő lesz mindkét félnél, amíg nyitott: a bérlőnél a saját
nyilatkozata, a bérbeadónál a sürgetés vagy az új időpont keresése. Származtatott
teendő, tehát eltűnik, amint a látogatás eldőlt vagy elmúlt.

## A beszélgetés alapelve

A bérlet hétköznapi ügye — mikor jön a kéményseprő, elviheti-e a szekrényt,
csúszik-e az utalás — eddig SMS-ben és e-mailben ment, vagyis ott, ahol később
senki nem találja meg. A hibabejelentésnek és az elszámolásnak megvan a saját
üzenetváltása; ami egyikbe sem fér bele, az ide tartozik.

**A résztvevői sor egymagában nem jogosultság.** A jogviszonyról levett bérlő
résztvevő marad, a bérlemény ügyei viszont már nem rá tartoznak, és a szál
addigi üzeneteit is tovább olvasná. Ezért minden lekérdezés a mostani
tartozást is kéri: a bérbeadónál a tulajdont, a bérlőnél a bérlősort.

**A beszélgetés az első üzenettel jön létre**, nem előbb. Üres szálat nem
nyitunk: egy lista, amiben három üres beszélgetés áll „még nincs üzenet”
felirattal, csak zajt csinál. Ezért nincs külön „indítás” gomb sem: a címzett és
az első mondat egyszerre megy el.

**A beszélgetés a jogviszonyhoz tartozik**, nem két felhasználóhoz. Ugyanannak a
két embernek lehet két bérleménye, és a két ügy nem folyhat egy szálba. A
jogosultság is innen jön: aki a jogviszonyban benne van, az írhat, és ezt a
kiszolgáló ellenőrzi, nem az űrlap. Ezért nincs bérleményválasztó sem az új
beszélgetés űrlapján, hanem bérleményenként külön űrlap: a választó és a
címzettlista el tudott csúszni egymástól, és a böngészős próba pont ezt fogta
meg.

Kétirányú és csoportos között nincs tárolt különbség: a résztvevők számából
következik. Aki még nem lépett be a saját fiókjába, nem szerepel a címzettek
közt — neki nincs hová írni —, és a felület ezt ki is mondja, különben úgy tűnne,
eltűnt a listából.

A kilencven nap **nem a beírt kiköltözési naptól fut, hanem attól, amit a
lezárás eltárolt** (`ertekelesAblak`) — ugyanaz a dátum, amin az értékelési
ablak is indul, és ugyanazért: ha a bérbeadó utólag rögzíti a lezárást, a
bérlő addig nem is látta, hogy a bérlet lezárult. A `vege`-től számolva egy
fél évvel később rögzített lezárás azonnal archivált szálat adna: egy nap sem
maradna az óvadékot megbeszélni, pedig pont azért van a kilencven nap.

Az archiválás sem tárolt: a jogviszony lezárásából és a mai napból jön
(`ARCHIVALAS_NAP`, 90 nap). Így egy elkattintott lezárás visszavonása magától
visszanyitja a szálat, ütemező nélkül — ugyanaz az elv, mint az előírásoknál. Az
archivált beszélgetés olvasható marad, csak írni nem lehet bele, és ezt a
kiszolgáló tiltja, nem a gomb elrejtése. A kilencven nap oka gyakorlati: az
óvadék elszámolása, az utolsó rezsiszámla és a hátrahagyott holmi mind a
kiköltözés utáni hetekben derül ki.

## A hibabejelentés alapelve

A bejelentés és az elhárítás két külön esemény, és egyik sem írja felül a másikat:
a bérbeadó jelöli elhárítottnak, a bérlő erősíti meg, hogy tényleg rendben van.
Ugyanaz a kétoldali elv, mint a befizetésnél. Amíg nincs megerősítés, a hiba
nyitott, és teendő van belőle.

A sürgősségből válaszhatáridő lesz. Ez nem jogszabályi határidő — magánszemélyek
bérletére nincs ilyen —, hanem az alkalmazás alapértelmezése, és a felület ezt ki
is mondja.

**A megerősítés a bejelentőé, nem a bérlőé.** A kétoldaliság lényege, hogy a
bejelentő és az elhárító két különböző ember. Ha a bérbeadó jelentette be a
hibát — fiók nélküli bérlőnél, vagy két bérlet között —, nincs kit
megkérdezni, és a hiba örökre „elhárítva" állapotban ragadt, teendővel együtt.
A megerősítés határideje pedig az elhárítástól fut, nem a bejelentéstől: addig
nincs mit megerősíteni, és a bejelentéstől számolva a teendő rendszerint már
lejártként született meg.

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

Egy egyetemista albérletét jellemzően a szülei fizetik vagy segítik. A szülő
távol van, nem látja a számlákat, és nincs joga belépni a bérlő fiókjába — eddig
csak annyi maradt neki, hogy megkérdezi, és elhiszi a választ. Ebből lesz otthon
a bizalmi kérdés. A betekintő ezt oldja meg: a bérlő maga oszt meg egy
ellenőrizhető képet a bérleményéről, akkor és annak, akinek akarja.

Nem bérlőszűrésre való, és nem is arra hangoljuk. A leendő bérbeadónak mutatott
„fizetési előzmény" a kezdeti olvasat volt, és rossz volt: abból következett,
hogy alapból nem látszottak az összegek, csak a bérleti díj számított bele, és a
link harminc nap múlva lejárt. Mindhárom pont azt rontotta el, amiért a funkció
van.

Amit ebből következően mutat: az **összegeket alapból**, mert aki fizeti, annak
összeg nélkül semmit nem ér; **minden előírástípust**, mert a közös költséget és
a rezsiátalányt ugyanaz a szülő fizeti; és a **mostani állapotot** is, nem csak
az összesített előzményt — a nyitott összeget és a hónapról hónapra bontást.

Az adat nem a bérlő bemondása, hanem abból jön, amit a bérbeadó a beérkezésről
maga rögzített: egy tétel akkor számít megérkezettnek, ha a **bérbeadó oldalán**
van mögötte beérkezés. A vitás tétel sem számít teljesítettnek. A nyitott összeg
ezért nem „tartozás": a friss hónap is nyitott, amíg a bérbeadó rá nem nézett a
számlájára, és az oldal ezt ki is mondja.

**A vitás hónap nem számít megérkezettnek, és az `elter` nem vitás.** A
két állapot különbsége itt is dönt: az `elter`-nél a két fél egyetért abban,
mi történt, csak nem az előírt összeg érkezett — az megérkezett. A `vitas`
viszont azt jelenti, hogy a két fél adata nem fedi egymást, és a betekintő
eddig ezt is beleszámolta a „határidőig megérkezett" hónapokba, miközben
ugyanaz a hónap mindkét fél lapján „Vitás"-ként állt.

A párosítást ugyanaz az `egyeztet` végzi, mint a befizetések lapon. A nézet nem
olvashat külön tárolt egyeztetési eredményt: egy ilyen tábla volt a sémában,
amibe soha semmi nem írt, és emiatt a betekintő minden hónapra azt mondta, hogy
nem érkezett befizetés — miközben a lap hibátlanul nézett ki. A tábla kivezetve.

Pontszámot nem adunk: a súlyozás, amit mi találnánk ki, mérésnek látszana, pedig
nem az. És szűk marad: se bérbeadói név, se pontos cím (csak település), se
személyes adat, se más bérlő. A pontos cím azért sem, mert akinek a bérlő
megmutatja, annak úgyis megvan, a linket viszont bárki megnyithatja, akihez
eljut — vagyis csak kockázat lenne, haszon nélkül. A bérbeadó neve pedig nem a
bérlő adata: arról nem az ő hozzájárulása dönt.

Az élettartam a jogviszony hosszához igazodik (alapból egy év), nem egy
pályázathoz. A valódi fék a visszavonás: azonnal hat, és a bérlő kezében van. A
megnyitásból csak az időpontot tároljuk, IP-t és böngészőazonosítót nem: a
bérlőnek az számít, hányszor nézték meg.

**A link a bérlő jogviszonyához van kötve, nem csak a tokenhez.** Ha a bérlő
lekerül a jogviszonyról, a bérlet már nem az ő adata: a korábban kiadott link
nem mutathatja tovább annak a lakásnak a befizetéseit, ahol már a következő
bérlő lakik. A visszavonás a bérlő kezében van, a levétel viszont nem az ő
kattintása volt, tehát nem is várhatjuk tőle.

## Jogi tájékoztatók

Az adatkezelési tájékoztató és a felhasználási feltételek szövege
`src/domain/jogi.ts`-ben van, mindkét nyelven, és a lábléc minden oldalról
elérhetővé teszi. **A tájékoztató akkor ér valamit, ha felsorolja, amit
tényleg kezelünk**: a bizonylatot és a fényképet, a beszélgetést, a
látogatás-választ, az előfizetési nyilatkozatot, az értékelést, a
bemutatkozást, az üzemeltetői naplót és a letiltást, a két sütit, és azt, hogy
fióktörlés helyett letiltás van — mert a jogviszony és a kiadott okirat a másik
félé is. A betekintőről sem azt mondjuk, hogy „semmilyen személyes adat": a
bérlő nevét és a fizetési adatokat épp megmutatja, a bérbeadó nevét és a pontos
címet nem. Az üzemeltető adatai szögletes zárójellel kitöltendőként
állnak benne: az adatkezelő megnevezése jogi nyilatkozat, nem találjuk ki a
bérbeadó helyett. Élesítés előtt ezeket ki kell tölteni.

## Az adatbázis alapelve

PostgreSQL, mindenhol ugyanaz: fejlesztésben, a CI-ban és élesben is. Az éles
példány Supabase, EU-s régióban.

Korábban helyben SQLite futott, és csak az éles lett volna Postgres. Ez azért
nem megy, mert a Prisma migrációi nyelvjárásfüggőek: az SQLite oszlopot úgy
módosít, hogy újraépíti a táblát, a `DATETIME` nem `TIMESTAMP`, és az egyediségi
kulcsok viselkedése is más. Két motorral tehát a helyi próba és a CI nem azt
mérte volna, ami élesben fut — és pont az a hibafajta maradt volna őrizetlen,
ami csak élesben derül ki.

A váltáskor az SQLite huszonhat migrációját nem átírtuk, hanem eldobtuk: éles
adat még sehol nem volt, tehát egyetlen alapmigráció elő tudja állítani a
mostani sémát. Ami ezután jön, az megint rendes, egymásra épülő migráció; ez az
egyszeri kivétel az utolsó pillanat volt, amikor megtehettük.

A kapcsolati cím kizárólag környezeti változóból jön (`DATABASE_URL`), és nincs
alapértelmezése. Volt: `file:./dev.db`. Az SQLite-nál ez ártalmatlan volt,
legfeljebb egy üres fájl keletkezett; Postgresnél viszont a hiányzó cím néma
kapcsolódási hiba lenne kérésenként, futásidőben. Inkább induláskor állunk meg.

A váltás egy valódi hibát hozott elő, amit SQLite soha nem mutatott volna meg.
A hiányzó előírások pótlása `upsert`-tel ment, üres `update`-tel, azzal a
megjegyzéssel, hogy ez kizárja a versenyt — de üres `update`-ből a Prisma nem
tud `ON CONFLICT` utasítást fordítani, tehát keres, majd beszúr. SQLite-on az
írás sorosítva van, így a rés soha nem nyílt ki; Postgresen a bérlő és a
bérbeadó egyidejű oldalletöltése azonnal egyediségi hibát adott, és a
befizetések lapja 500-zal szállt el. Azóta `create`, és aki az egyediségi
kulcsba ütközik, nem csinál semmit: a tétel létrejött, csak nem ő hozta létre.
**Ahol a jó viselkedés az, hogy a vesztes ág nem ír, ott az egyediségi kulcs a
fék, és a hibáját le kell kezelni** — nem az `upsert` az.

A másik valódi hiba a rendezésé. **Postgresen azonos rendezőkulcsú sorok
sorrendje nincs garantálva**: ugyanaz a lekérdezés két futásra másik sorrendet
adhat. SQLite-on a beszúrás sorrendje döntött, tehát a sorrend stabilnak
*látszott*, és a kód rá is támaszkodott. Nálunk a holtverseny nem kivétel, hanem
a rendes eset: egy hónap előírásai ugyanazon a napon esedékesek, a példaadat
jogviszonyai ugyanabban az ezredmásodpercben jönnek létre, a `take: 1`
lekérdezések pedig pont a holtversenyből választanak egyet.

Ebből két szabály lett:

- **Minden lekérdezés rendezése az `id`-vel zárul**, és az irány az elsődleges
  kulcsét követi: egy „legutóbbi" lekérdezésnél a holtversenyből is a legutóbbi
  kell. Ezt a `rendezes` kapu tartja be.
- **A párosítás nem támaszkodhat a bemenet sorrendjére.** Az `egyeztet` korábban
  előírásonként haladt, és amelyik elöl állt, az vitte el a rá nem pontosan
  illő befizetést. Most minden körben az összes szabad pár közül a legjobb
  illeszkedés köttetik meg: előbb az időbeli közelség, aztán az összegeltérés,
  végül az azonosítók. Ez nemcsak eldöntött, hanem jobb is — egy 13 500
  forintos utalás a 14 000 forintos közös költséghez kerül, nem a 180 000
  forintos bérleti díjhoz.

A hiba onnan derült ki, hogy a böngészős próba a bérbeadó oldalán vitásnak várt
egy tételt, a lap viszont várakozót mutatott: ugyanazt az utalást a lap hol a
bérleti díjhoz, hol egy ezerforintos előfizetéshez kötötte.

A `prisma migrate dev` árnyékadatbázist hoz létre és dob el, tehát a helyi
szerepnek `CREATEDB` joga kell legyen (`ALTER ROLE albi CREATEDB;`). A CI-ban és
élesben ez nem kell: ott `prisma migrate deploy` fut, ami nem készít
árnyékadatbázist.

A Supabase két címet ad. A **session pooler** (5432) tartós kapcsolatot ad, ez
kell a migrációhoz; a **transaction pooler** (6543) rövid kapcsolatokra való, ez
kell a futó alkalmazásnak, mert a szerver nélküli környezet kérésenként nyit
újat. A kettő felcserélve elfogy a kapcsolatok száma, és az a terhelés alatt
derül ki.

## A példaadat

A seed (`prisma/seed.ts`) minden időérzékeny dátuma a **mostani hónaphoz** igazodik,
nem beégetett évszámhoz. Az előírások a mai naphoz képest generálódnak, tehát a
beégetett példaadat hónapról hónapra jobban elcsúszik tőlük, amíg a demó azt nem
mutatja, hogy a bérlő soha nem fizetett.

Az előírásokat a seed ugyanazzal az `eloirasok` függvénnyel állítja elő, mint az
alkalmazás. Kézzel beírt előírás megint el tudna csúszni attól, amit a rendszer
magától generál.

Ugyanez áll a kiadott okiratokra. A példaadatban van aláírt szerződés és
kiállított igazolás, és a szövegük ugyanazon a két függvényen megy át, mint
véglegesítéskor (`okiratSzovege`, `igazolasSzovege`) — az igazolás összege és
teljesítési napja pedig ugyanabból a párosításból jön, mint a befizetések
lapján. Ez nem a demó kedvéért van: ami a példaadatból hiányzik, azt a
méretkapu sem méri. A véglegesített szerződés lapja pont ezért tudott
tizenkilenc telefonképernyő magas lenni úgy, hogy minden ellenőrzés zöld volt.
A kapu ezért minden szerződés- és jegyzőkönyvlapot megmér, nem csak az elsőt:
egy okirat tervezetként és véglegesítve két különböző lap.

## Az űrlapok alapelve

**Az összeget egy olvasó olvassa, és az űrlapon szövegmező áll, nem
`type="number"`.** A bérbeadó magyar alakban gépel: „195.000" vagy „195 000".
A számmező az elsőt érvényesnek látja — százkilencvenöt egész —, a másodikat
érvénytelennek, és olyankor a böngésző **üres értéket küld**: a beírt bérleti
díj szótlanul eltűnik. Ezért `inputMode="decimal"` szövegmező áll ott
(telefonon így is számbillentyűzet jön), a beolvasást pedig az `urlapForint`
végzi (`src/domain/penz.ts`). Korábban öt űrlap ötféleképp olvasott, és
mindegyik másképp rontotta el; a bérleti díjnál ez kilenc hónapnyi 180
forintos előírás lett, figyelmeztetés nélkül, és utólag javíthatatlanul,
mert meglévő előírást nem írunk át. Az `urlapForint` hármat ad vissza, és
mindháromra szükség van: `null` az üres mező, `NaN` az olvashatatlan, és a
szám minden másra — ha a hibás bemenet is `null` lenne, a domain nem tudná
megkülönböztetni a hiányzótól.

**Az óraállás viszont más kérdés, és más olvasója van**
(`meroallastOlvas`). Pénznél a „180.000" mindig száznyolcvanezer;
óraállásnál a „12.345" lehet tizenkettő egész háromszáznegyvenöt is, és
ott **nem tippelünk**: az ilyen alak elutasítás, azzal az üzenettel, hogy a
tizedest vesszővel írják. Ebből lett korábban ezerszeres hiba — a
jegyzőkönyvi „12.345 kWh" 12,345-ként került a mérőóra történetébe, és az
lett az első rezsielszámolás nyitóállása. Ugyanaz az elv, mint a be nem
sorolható befizetésnél: aki nem tudja, ne találja ki.

Elutasított mentés nem viheti el a begépelt adatot. Egyetlen elgépelt
igazolványszám miatt senki ne gépeljen újra húsz mezőt.

A React a kiszolgálói művelet lefutása után visszaállítja az űrlapot. Ez a
„beküldöm, aztán tiszta lappal jön a következő" esetre jó, elutasításkor
viszont pont azt viszi el, amit meg kellene tartani. Ezért minden űrlapmező a
`src/components/megorzo.tsx` közös mezőin megy át (`Mezo`, `Valaszto`,
`Szovegdoboz`, `Valasztogomb`): ezek maguk tartják az értéküket, és csak akkor
ejtik el, ha a művelet sikerrel zárult. Ehhez elég az `allapot`, ami minden
űrlapban megvan; a kiszolgálói művelet nem ad vissza semmit az űrlapnak.

Vezérelt mező sem elég önmagában. A visszaállítás az elemben ülő értéket
írja át, a React viszont nem rajzol újra, mert az ő oldalán nem változott
semmi — és a felhasználó a visszaállított értéket látja. Leglátványosabban a
`<select>`-en és a rádiógombon. Ezért a közös mező kirajzolás után ránézik az
elemre, és visszaírja, ami elcsúszott.

A vezérlésnek ára is van, és ezt a legördülőn fizettük meg. A megőrző mező a
tartott értéket írja az elemre; ha a hívó nem adott alapértéket, ez üres, és a
böngésző **semmit nem jelöl ki** (`selectedIndex` −1). A felhasználó üres
legördülőt lát, a beküldés üres értéket visz, a kiszolgáló pedig jogosan
utasítja el — vezérlés nélkül ez nem fordulna elő, mert a natív `<select>`
magától az első opciót jelöli ki. Ezért a `Valaszto` kirajzolás után átveszi az
első opció értékét, ha a tartott érték egyetlen opcióra sem illik: ami a
képernyőn látszik, és ami beküldésre kerül, nem mondhat mást. Az üres
opcióérték („Nem tartozik bérleményhez") ettől érintetlen marad, mert az illik
egy opcióra.

Jelszó nem megy át ezen: az újragépelése két másodperc, a megőrzése viszont
ott hagyná a mezőben olyankor is, amikor a felhasználó már rég továbblépett.
Fájlmező sem, mert azt a böngésző nem engedi programból kitölteni.

Ez a hiba sem a típusellenőrzésen, sem a fordításon nem akad fenn, és a
kódot olvasva sem látszik: csak a böngészős próbán (`proba/urlap.mjs`), ami
végigjátssza, hogy a kiszolgáló elutasít, és utána megnézi, megvan-e még
minden mező — a szöveg, a dátum, a választó és a rádiógomb is.

Kifogás és figyelmeztetés nem ugyanaz. Kifogás az, ami nélkül az adat
értelmetlen vagy később hibát okoz: azt nem mentjük el. Figyelmeztetés az, ami
hiányos, de a bérbeadó tudhatja jobban: azt elmentjük, és megmondjuk, minek mi
lesz a következménye — nem „hiányos az adatlap", hanem hogy pontosan mi nem
fog működni nélküle. Egy magánbérbeadó nem fogja kitölteni a helyrajzi számot
az első percben, és ettől még el kell tudnia indulni.

## A hosszú listák alapelve

Egy magánbérbeadónak egy-két év alatt száz fölötti befizetési tétele gyűlik
össze. Ha mind egyforma súllyal áll a lapon, telefonon percekig kell görgetni
ahhoz az egyhez, amivel tényleg dolga van: a befizetések lapja egy év
példaadattól tizenhat telefonképernyő magas lett, a szerződéstervezet
huszonegy. Ez lassan romlik el, és nem egy hibás sortól, hanem attól, hogy
gyűlik az adat — semmi nem szól, mert minden tétel szépen jelenik meg.

Ezért a lap azt mutatja elöl, amivel az olvasónak dolga van, a többi
összecsukva áll. Hogy kire vár egy tétel, azt a `varRank` mondja ki
(`src/domain/egyeztetes.ts`), nem a felület: a vitás tétel mindkét félre vár,
egyébként az, aki még nem nyilatkozott — az „erre nem érkezett pénz" is
nyilatkozat. Ugyanez a bontás a hibabejelentéseknél (nyitott/lezárt) és a
szerződés moduljainál (amiről dönteni kell / minden szerződésben benne van).

Az összecsukás megjelenítés, nem elrejtés, és három dolgot kiköt:

- a nyitósor kiírja, hány tétel van mögötte, tehát nem tűnik el semmi;
- amihez bizonylatot töltöttek fel, az akkor is teljes kártyát kap, ha a vita
  közben rendeződött — egy másik fél fájlját nem tüntetjük el csendben;
- a javítás útja megmarad: a rendezett tétel rövid sora is visszavonható.

Rövid listát nem csukunk össze: három sor mögé kattintani rosszabb, mint
elolvasni őket.

A laphossz ezért kapu: a `proba/meret.mjs` minden lapon megméri, és nyolc
telefonképernyőnél hosszabb lap megbukik. A mérés friss példaadaton fut
(`npm run proba` maga tölti be), mert a próbasor menet közben maga is termel
adatot: az előfizetéspróba minden futáskor új előfizetést vesz fel, és abból
havi előírás lesz. Kétszer egymás után, újratöltés nélkül futtatva a lapok
nem a termék állapotát mutatnák, hanem a próbáét.

Egy lapot viszont sokáig nem tudott mérni: a véglegesített szerződését, mert a
példaadatban nincs véglegesített szerződés, a méretpróba pedig a sor elején fut,
friss adatbázison. A vakfolt mögött a lap tizenkilenc képernyő lett (a kész
szöveg alapból nyitva állt), és semmi nem szólt. Azóta a `proba/forditas.mjs`
méri meg, ott, ahol épp véglegesített egy szerződést — a tanulság pedig
általános: ha egy állapotot a példaadat nem tartalmaz, azt az az oldal mérje
meg, amelyik előállítja. Ha egy lap átlépi, csoportosítani
vagy összecsukni kell, nem a korlátot emelni. A mérés önpróbával kezd —
magassággal és szélességgel egyaránt —, mert ebben a projektben már két
olyan próbaállítás volt, ami mindig igazat adott.

## Az arculat alapelve

A színeket jelentés szerint nevezzük el, nem árnyalat szerint, és a nevek a
`src/app/globals.css`-ben élnek: `lap`, `felulet`, `felulet-halk`, `keret`,
`keret-eros`, `szoveg`, `halvany`, `nagyon-halvany`, valamint `rendben`,
`figyelem`, `gond` a három állapotszín és az `albi-*` márkaskála. A lapok
`bg-felulet`-et és `border-keret`-et írnak, **`dark:` páros nélkül**: a sötét
mód értéke ugyanott, a világos mellett áll, és magától követi. A korábbi
`border-stone-200 dark:border-stone-800` alak két bajt okozott — a két mód
külön csúszott el, és egy színcsere húsz fájl átírása lett volna, vagyis soha
nem történt meg.

Az öt egyeztetési állapot három színre képződik le, és a leképezés
termékdöntés (`src/components/Allapotjelzo.tsx`): az `elter` nem piros, mert
ott a két fél egyetért; a `varakozik` semleges, mert még csak az egyik fél
nyilatkozott. Pirosat az kap, ahol tenni kell valamit.

A közös elemek a `src/components/ui/alap.tsx`-ben és a
`src/components/urlap.ts`-ben vannak (kártya, gomb, jelző, összeg, lapfej,
súgó, mezőosztályok). Új lap ne tervezzen saját kártya- és gombstílust. A gomb
súlya döntés: egy lapon egy elsődleges gomb van, az a művelet, amiért a lap
létezik, minden más másodlagos vagy halk. Kattintható elem legalább 44 képpont
magas, a mező betűmérete telefonon legalább 16 képpont — kisebbnél az iPhone
Safari ráközelít a lapra.

Telefonon a navigáció alul van (`src/components/ui/Fulsav.tsx`): négy gyakran
használt hely, plusz egy „Több”. A fejlécben álló kilenc szöveglink 360
képponton öt sorba tört, és a képernyő felső negyedét elvette minden lapon. A
kilépés is a „Több” alá került, ezért a böngészős próba `kilep()` függvénye
előbb kinyitja azt.

A négy hely: áttekintő, befizetés, rezsi, üzenetek. A dokumentumtár a „Több”
alatt van, mert azt akkor nyitja meg valaki, amikor éppen kell egy papír — az
üzenetekbe viszont a másik fél ír, és az elmaradt válasz drágább, mint egy
kattintással messzebb került szerződés. Ez a felosztás dönti el, mi fér az
alsó sávba; nagyobb kijelzőn úgyis mind kifér a fejlécbe.

A hosszú magyarázat nem áll kinyitva a lap tetején: `Sugo` elemben, egy sorban
áll, és aki kíváncsi rá, kinyitja. Az elv, amit kimond, nem tűnhet el — a
bérlő különben joggal hinné, hogy előbb-utóbb mégis kérünk bankszámlakivonatot.

A böngészős próbák ne a képernyőn látható szövegre szűrjenek ott, ahol a
megjelenés változhat: a befizetési kártyán `data-idoszak` és `data-osszeg`
van, a bizonylatblokkon `data-oldal`, az összecsukható szakaszokon
`data-szakasz`, a visszajelző sávon `data-uzenet`. A szakasznál ez nem
stíluskérdés: a Playwright `hasText`
szűrése kis-nagybetűre érzéketlen részszó-keresés a **teljes** részfán, tehát a
szakaszban álló tételek szövegébe is belefut. A „Lezárt" szakaszra szűrő
teendőpróba így az értékelős teendőt („Értékeld a lezárt bérletet") találta meg
a „Később" szakaszban, és egy olyan ágon bukott el, amihez semmi köze nem volt.
Egy szakasz feliratára szűrni ezért csak addig működik, amíg senki nem ír a lap
másik felére hasonló mondatot. A nyelvváltásra pedig nem a
`networkidle`-re várunk, hanem a `lang` attribútumra (`nyelvre()` a
`proba/kozos.mjs`-ben): a kiszolgálói művelet válasza később jön, mint ahogy a
hálózat elcsendesedik, és a következő `goto` elvágja.

**Ez minden mentésre igaz, nem csak a nyelvváltásra**, és a Postgresre váltás
meg is mutatta: SQLite-on a mentés beleért abba a résbe, Postgresen nem, és a
bemutatkozás próbája úgy bukott el, hogy a mentés maga hibátlan volt.

Amire ilyenkor várni kell, az a **művelet válasza** (`waitForResponse` a lap
POST-jára), nem a hálózat csendje. A visszajelző sáv erre csak ott jó, ahol a
`revalidatePath` nem cseréli ki az űrlapot — ahol kicseréli, ott az `Uzenetsav`
az űrlappal együtt tűnik el, és a próba olyasmire vár, ami már nincs ott. Ezért
a sávon van ugyan `data-uzenet` (`ures` / `kesz` / `hiba`), de a mentés
megtörténtét a **hatásán** kell mérni: a lap újratöltve mutatja-e az új adatot.

A kilépés ugyanígy megnézi a saját eredményét — a `kilep()` addig próbálkozik,
amíg a belépőlap tényleg elő nem jön, és ha nem jön, kimondja; korábban
csendben belépve ment tovább, és a bukás harminc másodperces mezőkeresés lett
valahol messze onnan, ahol a baj volt.

## A telepíthetőség alapelve

Az Albi weblap marad. Nincs alkalmazásbolt, nincs külön Android- és
iOS-változat: a böngészők fel tudják tenni a kezdőképernyőre és a Start menübe,
saját ikonnal és saját ablakkal. Egy magánbérbeadónak szánt terméknél ez nem
kompromisszum, hanem a helyes döntés — egy boltba beadott alkalmazás
átvizsgálásra vár, verziózni kell, és a bérlő nem fog telepíteni semmit azért,
hogy megnézze, mit kell fizetnie.

**Az alkalmazásleíró kérésenként készül, a nyelvi süti szerint**
(`src/app/manifest.json/route.ts`). A leíró egynyelvű — a telepítő ablakban
egyetlen név és egyetlen leírás állhat —, a bérlő viszont gyakran nem olvas
magyarul, és a telepítés az első, amit lát. Ezért van a hivatkozáson
`crossOrigin="use-credentials"`: a böngésző a leírót alapból süti nélkül kéri
le, enélkül mindenki a magyar alapértelmezést kapná. Ugyanezért nem a Next.js
beépített `app/manifest.ts` alakját használjuk: az maga tenné be a
hivatkozást, épp e nélkül.

**A telepítés elmaradása néma.** Ha egy ikonméret hiányzik, vagy az ikonfájl
nincs ott, ahová a leíró mutat, minden lap hibátlanul jelenik meg, a
típusellenőrzés és a fordítás is zöld — csak a böngésző nem ajánlja fel a
telepítést. Ezért él a leíró a domainben (`src/domain/telepites.ts`), és ezért
méri a teszt a lemezen álló PNG-k tényleges méretét is, nem csak azt, amit a
leíró ígér.

A vágható (`maskable`) ikon azért külön kép, mert az Android a saját alakjára
vágja az ikont, és abból a rajz széle kimaradna: azon a változaton a jel
kisebb, a háttér a szélekig ér. Gyorsindító (`shortcuts`) szándékosan nincs: a
lista a telepítés pillanatában fagy be, a menüpontok viszont szerepenként
mások — a bérlőnek nincs befizetés-egyeztetés lapja.

**A szervizmunkás kiszolgálói választ nem tárol el** (`public/sw.js`).
Egyetlen lapot, bizonylatot, fényképet vagy okiratot sem: azok mind a belépett
felhasználó adatai, és a készüléken hagyott másolatot a kilépés nem viszi el, a
fiók letiltása nem éri el, a következő felhasználó ugyanazon a gépen pedig
megnyitná. Ugyanaz az elv, mint a betekintőnél: amit egyszer kiadtunk, azt nem
lehet visszavenni. Amit eltesz, az a fordítás állandó része
(`/_next/static/…`) és az ikonok — tartalomfüggő néven érkeznek, tehát soha nem
avulnak, és senkié. A POST-hoz hozzá sem nyúl: minden kiszolgálói művelet
érintetlenül megy tovább.

Az ismeretlen vagy elavult címre a **saját hibalapunk** jön
(`src/app/not-found.tsx`), a választott nyelven, és van róla hová továbbmenni: a
kezdőlapra és a belépésre is. A keretrendszer alapértelmezett lapja angol volt,
és navigáció nélküli — egy zsákutca, amiből csak a böngésző vissza gombja
vezetett ki. A méretkapu listájába nem fér bele, mert ott minden laptól 200-as
választ várunk; a létezésellenőrzés önpróbája méri meg, ott, ahol amúgy is egy
nem létező címre lép.

A kapcsolat nélküli lap (`/offline`) **mindkét nyelven megszólal**. A lap a
készüléken áll el, nem a kérés pillanatában készül: nem tudjuk, ki nézi majd. A
szervizmunkás süti nélkül kéri le és teszi el, hogy a tárolt példányban semmi
ne legyen, ami a belépett felhasználóé.

**iOS-en a böngésző soha nem ajánlja fel a telepítést**, ott a megosztás
menüjében van — aki nem tudja, nem találja meg. Épp a bérlő az, aki iPhone-t
használ és nem olvas magyarul. Ezért van `/telepites` lap három rövid
leírással, és ezért érhető el a láblécből, belépés nélkül is: a meghívóból
érkező bérlő így még a saját fiókja előtt felteheti.

Az offline mérés (`proba/telepites.mjs`) önpróbával kezd: a hálózat
kikapcsolása után egy szándékosan nem tárolt címet kér le, és elvárja, hogy
elbukjon. Enélkül a „kapcsolat nélkül is jön a saját lapunk" állítás akkor is
igaz lenne, ha a hálózat végig élne.

### Az üzemeltetői lap gépen

Az üzemeltetői lap az egyetlen, amit jellemzően nem telefonról nyitnak meg. A
lap mérete ettől nem lesz más: az alkalmazásnak egy szövegszélessége van
(`max-w-5xl`), és a fejléc is abban áll — egyetlen szélesebb lap kilógna
mellőle. Ami változik, az a lapon belüli elrendezés: gépen a kilenc szám öt
oszlopban áll, tehát az első sor az állomány, a második az, ami válaszra vár; a
fiók és a letiltó gombja pedig egy sorban, nem egymás alatt.

A böngészős próba **mindkét irányban mér**: gépen egy sorban, telefonon egymás
alatt. Csak az egyiket nézve az elrendezés bármelyik irányban elromolhatna
anélkül, hogy bármi szólna — és a mérés akkor is zöld maradna, ha a két méret
ugyanazt adná.

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
- `rendezes`: minden `orderBy` utolsó kulcsa az `id`. Postgresen az azonos
  kulcsú sorok sorrendje nincs garantálva, és nálunk a holtverseny a rendes eset.
- `teszteltseg`: minden domain modult importál legalább egy teszt.

Mindegyik kapu első tesztje azt próbálja ki, hogy a kapu tényleg elutasítja a
tiltott alakot: egy kapu, ami mindenre igent mond, rosszabb a semminél.

A böngészős próbák a `proba` mappában vannak, és 360 képpont széles ablakban
futnak. A `proba/meret.mjs` minden oldalon azt nézi, kilóg-e valami
vízszintesen; ez a hiba nagy kijelzőn soha nem látszik.

**Mindkét nyelven mér, és a kinyitott szakaszokat is megnézi.** Csak magyarul
mérve a felület fele őrizetlen marad: az angol felirat hosszabb, tehát előbb
lóg ki és előbb tör sorba. A csukott szakaszban ülő széles elem — egy
legördülő, egy hosszú gombfelirat — pedig csukva nem is látszik, a felhasználó
viszont ki fogja nyitni. A hosszt ezzel szemben csukva mérjük: az összecsukás
a lap része, nem a próba kényelme.

**És minden lapot a leghosszabb összeggel is megmér.** Enélkül a kapu azon
múlik, mekkora szám áll épp a példaadatban, és ezen át is csúszott egy valódi
hiba: az áttekintő elmaradás-kártyája angolul, hétjegyű összegnél kilógott.
Hatjegyűnél nem, és a seedben épp hatjegyű állt. Magyarul soha nem látszott,
mert a magyar alak szóközökkel tagol, tehát sorba tud törni — az angol nem: a
pénznevet nem törhető szóköz köti a számhoz, a számot az ezrestagoló vessző.
Ezért egy összeg mellett álló elem nem lehet `shrink-0` egy nem törhető soron:
a sor törjön (`flex-wrap`), és a címke menjen a következő sorba. A mérés nem az
`Osszeg` elemre szűr, hanem a szövegre, mert az összegek fele nem azon megy —
a rezsi és az adóösszesítő sima szövegként írja ki őket.
