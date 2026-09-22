# Albi

Bérbeadást segítő alkalmazás magánszemélyeknek: befizetés-egyeztetés, rezsi- és
közösköltség-elszámolás, adóösszesítő, egy helyen a bérbeadónak és a bérlőnek.

A fejlesztés rendje, a döntésnapló és a mérföldkövek külön lapon élnek, és
körönként frissülnek.

## Hol tart

**1. mérföldkő: gerinc és befizetés-egyeztetés.** Ez a változat már tudja:

- ingatlan, bérleti jogviszony és előírt tételek adatmodellje,
- bankszámlakivonat beolvasása CSV-ből, felismert fejléccel és ismétlődésszűréssel,
- a háromoldalú egyeztetés: mit írtunk elő, mit igazolt a bérlő, mit mutat a kivonat,
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
tényleg megérkezett, ezért a párosított kivonattételekből indul, nem az
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

## Adatbázis

Fejlesztéshez és a próbakörnyezethez SQLite, az éles adatbázis PostgreSQL lesz
EU-s régióban. Amíg nincs éles adat, a váltás egyetlen migráció újrafuttatása.

Pénzösszegek egész forintban (`Int`). A forintnak nincs gyakorlati váltópénze,
így nincs lebegőpontos kerekítési hiba sem.
