-- AlterTable
ALTER TABLE "Ingatlan" ADD COLUMN "beszerzesDatuma" DATETIME;
ALTER TABLE "Ingatlan" ADD COLUMN "beszerzesiArFt" INTEGER;

-- CreateTable
CREATE TABLE "Koltseg" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ingatlanId" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "fajta" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "szamlaUtvonal" TEXT,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Koltseg_ingatlanId_fkey" FOREIGN KEY ("ingatlanId") REFERENCES "Ingatlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Koltseg_ingatlanId_datum_idx" ON "Koltseg"("ingatlanId", "datum");
