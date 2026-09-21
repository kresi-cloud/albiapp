-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Szerzodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "fajta" TEXT NOT NULL DEFAULT 'szerzodes',
    "alapSzerzodesId" TEXT,
    "allapot" TEXT NOT NULL DEFAULT 'tervezet',
    "kelteHelye" TEXT NOT NULL DEFAULT '',
    "kelte" DATETIME,
    "veglegesSzoveg" TEXT,
    "veglegesitve" DATETIME,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frissitve" DATETIME NOT NULL,
    CONSTRAINT "Szerzodes_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Szerzodes_alapSzerzodesId_fkey" FOREIGN KEY ("alapSzerzodesId") REFERENCES "Szerzodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Szerzodes" ("allapot", "frissitve", "id", "jogviszonyId", "kelte", "kelteHelye", "letrehozva", "megnevezes", "veglegesSzoveg", "veglegesitve") SELECT "allapot", "frissitve", "id", "jogviszonyId", "kelte", "kelteHelye", "letrehozva", "megnevezes", "veglegesSzoveg", "veglegesitve" FROM "Szerzodes";
DROP TABLE "Szerzodes";
ALTER TABLE "new_Szerzodes" RENAME TO "Szerzodes";
CREATE INDEX "Szerzodes_jogviszonyId_idx" ON "Szerzodes"("jogviszonyId");
CREATE INDEX "Szerzodes_alapSzerzodesId_idx" ON "Szerzodes"("alapSzerzodesId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
