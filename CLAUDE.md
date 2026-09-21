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
párosított, bérbeadó által igazolt beérkezésekből számol, nem az előírásokból.

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

## A beszélgetés alapelve

A bérlet hétköznapi ügye — mikor jön a kéményseprő, elviheti-e a szekrényt,
csúszik-e az utalás — eddig SMS-ben és e-mailben ment, vagyis ott, ahol később
senki nem találja meg. A hibabejelentésnek és az elszámolásnak megvan a saját
üzenetváltása; ami egyikbe sem fér bele, az ide tartozik.

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
telefonképernyőnél hosszabb lap megbukik. Ha egy lap átlépi, csoportosítani
vagy összecsukni kell, nem a korlátot emelni. A mérés önpróbával kezd, mert
ebben a projektben már két olyan próbaállítás volt, ami mindig igazat adott.

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
