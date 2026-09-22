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
- Dátumnál naptári napot számolunk, UTC nap elejére vágva.

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

Ami ezen felül beérkezik, de nincs hozzá előírás, azt nem tippeljük meg: külön
listán megy a bérbeadóhoz.

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

**A lezárás a nyitott jogviszony művelete**, és ezt a kiszolgáló tartja be, nem
a gomb elrejtése. Lezártat újra lezárni azért nem lehet, mert a második lezárás
korábbi véget is kaphatna: az már egyeztetett előírt tételeket törölne, és a
záró hónapot újraarányosítaná. Aki a dátumot javítani akarja, előbb visszavonja
a lezárást — az vissza is számolja, amit az első elvett —, és utána zár le újra.

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

A bérlő fiókja meghívóval készül. A meghívó egyszer használható és lejár, és
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

Véglegesítéskor a kész szöveget elmentjük (`veglegesSzoveg`). Amit a felek
aláírtak, azt egy későbbi modulfrissítés nem írhatja át.

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
elérhetővé teszi. Az üzemeltető adatai szögletes zárójellel kitöltendőként
állnak benne: az adatkezelő megnevezése jogi nyilatkozat, nem találjuk ki a
bérbeadó helyett. Élesítés előtt ezeket ki kell tölteni.

## A példaadat

A seed (`prisma/seed.ts`) minden időérzékeny dátuma a **mostani hónaphoz** igazodik,
nem beégetett évszámhoz. Az előírások a mai naphoz képest generálódnak, tehát a
beégetett példaadat hónapról hónapra jobban elcsúszik tőlük, amíg a demó azt nem
mutatja, hogy a bérlő soha nem fizetett.

Az előírásokat a seed ugyanazzal az `eloirasok` függvénnyel állítja elő, mint az
alkalmazás. Kézzel beírt előírás megint el tudna csúszni attól, amit a rendszer
magától generál.

## Az űrlapok alapelve

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
nem a termék állapotát mutatnák, hanem a próbáét. Ha egy lap átlépi, csoportosítani
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
van, a bizonylatblokkon `data-oldal`. A nyelvváltásra pedig nem a
`networkidle`-re várunk, hanem a `lang` attribútumra (`nyelvre()` a
`proba/kozos.mjs`-ben): a kiszolgálói művelet válasza később jön, mint ahogy a
hálózat elcsendesedik, és a következő `goto` elvágja.

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
