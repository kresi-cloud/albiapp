/*
  Warnings:

  - You are about to drop the `Kivonattetel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `kivonattetelId` on the `Egyeztetes` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Kivonattetel_tulajdonosId_konyvelesDatuma_idx";

-- DropIndex
DROP INDEX "Kivonattetel_sorUjjlenyomat_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Kivonattetel";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "BerbeadoiIgazolas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tulajdonosId" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "megerkezett" BOOLEAN NOT NULL DEFAULT true,
    "eloirtTetelId" TEXT,
    "erkezesDatuma" DATETIME NOT NULL,
    "osszegFt" INTEGER NOT NULL DEFAULT 0,
    "kozlemeny" TEXT,
    "rogzitve" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BerbeadoiIgazolas_tulajdonosId_fkey" FOREIGN KEY ("tulajdonosId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BerbeadoiIgazolas_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BerbeadoiIgazolas_eloirtTetelId_fkey" FOREIGN KEY ("eloirtTetelId") REFERENCES "EloirtTetel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Egyeztetes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "eloirtTetelId" TEXT,
    "berloiIgazolasId" TEXT,
    "berbeadoiIgazolasId" TEXT,
    "allapot" TEXT NOT NULL,
    "elteresOka" TEXT,
    "elteresFt" INTEGER NOT NULL DEFAULT 0,
    "keses" INTEGER NOT NULL DEFAULT 0,
    "frissitve" DATETIME NOT NULL,
    CONSTRAINT "Egyeztetes_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Egyeztetes_eloirtTetelId_fkey" FOREIGN KEY ("eloirtTetelId") REFERENCES "EloirtTetel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Egyeztetes_berloiIgazolasId_fkey" FOREIGN KEY ("berloiIgazolasId") REFERENCES "BerloiIgazolas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Egyeztetes_berbeadoiIgazolasId_fkey" FOREIGN KEY ("berbeadoiIgazolasId") REFERENCES "BerbeadoiIgazolas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Egyeztetes" ("allapot", "berloiIgazolasId", "eloirtTetelId", "elteresFt", "elteresOka", "frissitve", "id", "jogviszonyId", "keses") SELECT "allapot", "berloiIgazolasId", "eloirtTetelId", "elteresFt", "elteresOka", "frissitve", "id", "jogviszonyId", "keses" FROM "Egyeztetes";
DROP TABLE "Egyeztetes";
ALTER TABLE "new_Egyeztetes" RENAME TO "Egyeztetes";
CREATE UNIQUE INDEX "Egyeztetes_eloirtTetelId_key" ON "Egyeztetes"("eloirtTetelId");
CREATE UNIQUE INDEX "Egyeztetes_berloiIgazolasId_key" ON "Egyeztetes"("berloiIgazolasId");
CREATE UNIQUE INDEX "Egyeztetes_berbeadoiIgazolasId_key" ON "Egyeztetes"("berbeadoiIgazolasId");
CREATE INDEX "Egyeztetes_jogviszonyId_allapot_idx" ON "Egyeztetes"("jogviszonyId", "allapot");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BerbeadoiIgazolas_tulajdonosId_erkezesDatuma_idx" ON "BerbeadoiIgazolas"("tulajdonosId", "erkezesDatuma");

-- CreateIndex
CREATE INDEX "BerbeadoiIgazolas_jogviszonyId_erkezesDatuma_idx" ON "BerbeadoiIgazolas"("jogviszonyId", "erkezesDatuma");

-- CreateIndex
CREATE UNIQUE INDEX "BerbeadoiIgazolas_eloirtTetelId_key" ON "BerbeadoiIgazolas"("eloirtTetelId");
