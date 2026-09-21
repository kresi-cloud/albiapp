-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dijszabas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merooraId" TEXT NOT NULL,
    "ervenyesTol" DATETIME NOT NULL,
    "kedvezmenyesArFiller" INTEGER NOT NULL,
    "piaciArFiller" INTEGER NOT NULL,
    "evesKeret" REAL,
    "alapdijFt" INTEGER NOT NULL DEFAULT 0,
    "csatornaArFiller" INTEGER NOT NULL DEFAULT 0,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dijszabas_merooraId_fkey" FOREIGN KEY ("merooraId") REFERENCES "Meroora" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Dijszabas" ("alapdijFt", "ervenyesTol", "evesKeret", "id", "kedvezmenyesArFiller", "letrehozva", "merooraId", "piaciArFiller") SELECT "alapdijFt", "ervenyesTol", "evesKeret", "id", "kedvezmenyesArFiller", "letrehozva", "merooraId", "piaciArFiller" FROM "Dijszabas";
DROP TABLE "Dijszabas";
ALTER TABLE "new_Dijszabas" RENAME TO "Dijszabas";
CREATE INDEX "Dijszabas_merooraId_ervenyesTol_idx" ON "Dijszabas"("merooraId", "ervenyesTol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
