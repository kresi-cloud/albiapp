-- CreateTable
CREATE TABLE "Dijszabas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merooraId" TEXT NOT NULL,
    "ervenyesTol" DATETIME NOT NULL,
    "kedvezmenyesArFiller" INTEGER NOT NULL,
    "piaciArFiller" INTEGER NOT NULL,
    "evesKeret" REAL,
    "alapdijFt" INTEGER NOT NULL DEFAULT 0,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dijszabas_merooraId_fkey" FOREIGN KEY ("merooraId") REFERENCES "Meroora" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Elszamolas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "idoszakKezdete" DATETIME NOT NULL,
    "idoszakVege" DATETIME NOT NULL,
    "allapot" TEXT NOT NULL DEFAULT 'tervezet',
    "osszegFt" INTEGER NOT NULL,
    "eloirtTetelId" TEXT,
    "berloiUzenet" TEXT,
    "kiadva" DATETIME,
    "lezarva" DATETIME,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Elszamolas_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Elszamolas_eloirtTetelId_fkey" FOREIGN KEY ("eloirtTetelId") REFERENCES "EloirtTetel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ElszamolasTetel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elszamolasId" TEXT NOT NULL,
    "merooraId" TEXT,
    "fajta" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "mennyiseg" REAL,
    "mertekegyseg" TEXT,
    "reszletezes" TEXT NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "sorrend" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ElszamolasTetel_elszamolasId_fkey" FOREIGN KEY ("elszamolasId") REFERENCES "Elszamolas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ElszamolasTetel_merooraId_fkey" FOREIGN KEY ("merooraId") REFERENCES "Meroora" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Jogviszony" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ingatlanId" TEXT NOT NULL,
    "berloId" TEXT,
    "berloNev" TEXT NOT NULL,
    "berloEmail" TEXT,
    "kezdete" DATETIME NOT NULL,
    "vege" DATETIME,
    "berletiDijFt" INTEGER NOT NULL,
    "kozosKoltsegFt" INTEGER NOT NULL DEFAULT 0,
    "kaucioFt" INTEGER NOT NULL DEFAULT 0,
    "fizetesiNap" INTEGER NOT NULL DEFAULT 5,
    "rezsiElszamolas" TEXT NOT NULL DEFAULT 'almero',
    "rezsiAtalanyFt" INTEGER NOT NULL DEFAULT 0,
    "statusz" TEXT NOT NULL DEFAULT 'elo',
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Jogviszony_ingatlanId_fkey" FOREIGN KEY ("ingatlanId") REFERENCES "Ingatlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Jogviszony_berloId_fkey" FOREIGN KEY ("berloId") REFERENCES "Felhasznalo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Jogviszony" ("berletiDijFt", "berloEmail", "berloId", "berloNev", "fizetesiNap", "id", "ingatlanId", "kaucioFt", "kezdete", "kozosKoltsegFt", "letrehozva", "rezsiElszamolas", "statusz", "vege") SELECT "berletiDijFt", "berloEmail", "berloId", "berloNev", "fizetesiNap", "id", "ingatlanId", "kaucioFt", "kezdete", "kozosKoltsegFt", "letrehozva", "rezsiElszamolas", "statusz", "vege" FROM "Jogviszony";
DROP TABLE "Jogviszony";
ALTER TABLE "new_Jogviszony" RENAME TO "Jogviszony";
CREATE INDEX "Jogviszony_ingatlanId_idx" ON "Jogviszony"("ingatlanId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Dijszabas_merooraId_ervenyesTol_idx" ON "Dijszabas"("merooraId", "ervenyesTol");

-- CreateIndex
CREATE UNIQUE INDEX "Elszamolas_eloirtTetelId_key" ON "Elszamolas"("eloirtTetelId");

-- CreateIndex
CREATE INDEX "Elszamolas_jogviszonyId_idoszakVege_idx" ON "Elszamolas"("jogviszonyId", "idoszakVege");

-- CreateIndex
CREATE INDEX "ElszamolasTetel_elszamolasId_idx" ON "ElszamolasTetel"("elszamolasId");
