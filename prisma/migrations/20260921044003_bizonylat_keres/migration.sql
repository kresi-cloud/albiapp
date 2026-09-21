-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Beallitasok" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "berbeadoId" TEXT NOT NULL,
    "korabbiAblakNap" INTEGER NOT NULL DEFAULT 10,
    "kesobbiAblakNap" INTEGER NOT NULL DEFAULT 25,
    "bizonylatKeres" BOOLEAN NOT NULL DEFAULT true,
    "frissitve" DATETIME NOT NULL,
    CONSTRAINT "Beallitasok_berbeadoId_fkey" FOREIGN KEY ("berbeadoId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Beallitasok" ("berbeadoId", "frissitve", "id", "kesobbiAblakNap", "korabbiAblakNap") SELECT "berbeadoId", "frissitve", "id", "kesobbiAblakNap", "korabbiAblakNap" FROM "Beallitasok";
DROP TABLE "Beallitasok";
ALTER TABLE "new_Beallitasok" RENAME TO "Beallitasok";
CREATE UNIQUE INDEX "Beallitasok_berbeadoId_key" ON "Beallitasok"("berbeadoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
