-- CreateTable
CREATE TABLE "Jegyzokonyv" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "fajta" TEXT NOT NULL,
    "idopont" DATETIME NOT NULL,
    "allapotLeiras" TEXT NOT NULL DEFAULT '',
    "megjegyzes" TEXT,
    "allapot" TEXT NOT NULL DEFAULT 'tervezet',
    "veglegesSzoveg" TEXT,
    "veglegesitve" DATETIME,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Jegyzokonyv_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JegyzokonyvTetel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jegyzokonyvId" TEXT NOT NULL,
    "fajta" TEXT NOT NULL,
    "merooraId" TEXT,
    "megnevezes" TEXT NOT NULL,
    "ertek" TEXT,
    "megjegyzes" TEXT,
    "felelos" TEXT,
    "hatarido" DATETIME,
    "sorrend" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "JegyzokonyvTetel_jegyzokonyvId_fkey" FOREIGN KEY ("jegyzokonyvId") REFERENCES "Jegyzokonyv" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JegyzokonyvTetel_merooraId_fkey" FOREIGN KEY ("merooraId") REFERENCES "Meroora" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Igazolas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyBerloId" TEXT NOT NULL,
    "cel" TEXT NOT NULL,
    "idoszak" TEXT NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "teljesitesNapja" DATETIME NOT NULL,
    "teljesitesModja" TEXT NOT NULL,
    "szoveg" TEXT NOT NULL,
    "kiallitva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Igazolas_jogviszonyBerloId_fkey" FOREIGN KEY ("jogviszonyBerloId") REFERENCES "JogviszonyBerlo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Jegyzokonyv_jogviszonyId_idopont_idx" ON "Jegyzokonyv"("jogviszonyId", "idopont");

-- CreateIndex
CREATE INDEX "JegyzokonyvTetel_jegyzokonyvId_sorrend_idx" ON "JegyzokonyvTetel"("jegyzokonyvId", "sorrend");

-- CreateIndex
CREATE INDEX "Igazolas_jogviszonyBerloId_idoszak_idx" ON "Igazolas"("jogviszonyBerloId", "idoszak");
