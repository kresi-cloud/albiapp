-- CreateTable
CREATE TABLE "Elofizetes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "fajta" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "szolgaltato" TEXT,
    "elofizeto" TEXT NOT NULL,
    "haviDijFt" INTEGER NOT NULL DEFAULT 0,
    "kezdete" DATETIME NOT NULL,
    "vege" DATETIME,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Elofizetes_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ElofizetesJovahagyas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elofizetesId" TEXT NOT NULL,
    "berloId" TEXT NOT NULL,
    "allapot" TEXT NOT NULL,
    "indoklas" TEXT,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ElofizetesJovahagyas_elofizetesId_fkey" FOREIGN KEY ("elofizetesId") REFERENCES "Elofizetes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ElofizetesJovahagyas_berloId_fkey" FOREIGN KEY ("berloId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EloirtTetel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "tipus" TEXT NOT NULL,
    "idoszak" TEXT NOT NULL,
    "forrasId" TEXT NOT NULL DEFAULT '',
    "esedekesseg" DATETIME NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "reszletezes" TEXT,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EloirtTetel_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EloirtTetel" ("esedekesseg", "id", "idoszak", "jogviszonyId", "letrehozva", "osszegFt", "reszletezes", "tipus") SELECT "esedekesseg", "id", "idoszak", "jogviszonyId", "letrehozva", "osszegFt", "reszletezes", "tipus" FROM "EloirtTetel";
DROP TABLE "EloirtTetel";
ALTER TABLE "new_EloirtTetel" RENAME TO "EloirtTetel";
CREATE INDEX "EloirtTetel_esedekesseg_idx" ON "EloirtTetel"("esedekesseg");
CREATE UNIQUE INDEX "EloirtTetel_jogviszonyId_tipus_idoszak_forrasId_key" ON "EloirtTetel"("jogviszonyId", "tipus", "idoszak", "forrasId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Elofizetes_jogviszonyId_idx" ON "Elofizetes"("jogviszonyId");

-- CreateIndex
CREATE INDEX "ElofizetesJovahagyas_berloId_idx" ON "ElofizetesJovahagyas"("berloId");

-- CreateIndex
CREATE UNIQUE INDEX "ElofizetesJovahagyas_elofizetesId_berloId_key" ON "ElofizetesJovahagyas"("elofizetesId", "berloId");
