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
- jelszavas belépés mindkét félnek, és bérlői meghívó linkkel.

Ami még nincs kész: elfelejtett jelszó, rezsielszámolás, adóösszesítő.

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
