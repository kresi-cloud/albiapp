/*
  Warnings:

  - You are about to drop the column `berloEmail` on the `Jogviszony` table. All the data in the column will be lost.
  - You are about to drop the column `berloId` on the `Jogviszony` table. All the data in the column will be lost.
  - You are about to drop the column `berloNev` on the `Jogviszony` table. All the data in the column will be lost.
  - You are about to drop the column `jogviszonyId` on the `Meghivo` table. All the data in the column will be lost.
  - Added the required column `jogviszonyBerloId` to the `Meghivo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ingatlan" ADD COLUMN "energetikaiAzonosito" TEXT;
ALTER TABLE "Ingatlan" ADD COLUMN "helyrajziSzam" TEXT;

-- CreateTable
CREATE TABLE "JogviszonyBerlo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "berloId" TEXT,
    "nev" TEXT NOT NULL,
    "email" TEXT,
    "szuletesiHely" TEXT,
    "szuletesiIdo" DATETIME,
    "anyjaNeve" TEXT,
    "lakcim" TEXT,
    "igazolvanySzam" TEXT,
    "sorrend" INTEGER NOT NULL DEFAULT 0,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JogviszonyBerlo_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JogviszonyBerlo_berloId_fkey" FOREIGN KEY ("berloId") REFERENCES "Felhasznalo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BerbeadoiAdatok" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "berbeadoId" TEXT NOT NULL,
    "szuletesiHely" TEXT,
    "szuletesiIdo" DATETIME,
    "anyjaNeve" TEXT,
    "lakcim" TEXT,
    "igazolvanySzam" TEXT,
    "adoazonosito" TEXT,
    "bankszamla" TEXT,
    "bank" TEXT,
    "frissitve" DATETIME NOT NULL,
    CONSTRAINT "BerbeadoiAdatok_berbeadoId_fkey" FOREIGN KEY ("berbeadoId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Szerzodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "allapot" TEXT NOT NULL DEFAULT 'tervezet',
    "kelteHelye" TEXT NOT NULL DEFAULT '',
    "kelte" DATETIME,
    "veglegesSzoveg" TEXT,
    "veglegesitve" DATETIME,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frissitve" DATETIME NOT NULL,
    CONSTRAINT "Szerzodes_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SzerzodesModul" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "szerzodesId" TEXT NOT NULL,
    "kulcs" TEXT NOT NULL,
    "sorrend" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SzerzodesModul_szerzodesId_fkey" FOREIGN KEY ("szerzodesId") REFERENCES "Szerzodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SzerzodesParameter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "szerzodesId" TEXT NOT NULL,
    "kulcs" TEXT NOT NULL,
    "ertek" TEXT NOT NULL,
    CONSTRAINT "SzerzodesParameter_szerzodesId_fkey" FOREIGN KEY ("szerzodesId") REFERENCES "Szerzodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Jogviszony" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ingatlanId" TEXT NOT NULL,
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
    CONSTRAINT "Jogviszony_ingatlanId_fkey" FOREIGN KEY ("ingatlanId") REFERENCES "Ingatlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Jogviszony" ("berletiDijFt", "fizetesiNap", "id", "ingatlanId", "kaucioFt", "kezdete", "kozosKoltsegFt", "letrehozva", "rezsiAtalanyFt", "rezsiElszamolas", "statusz", "vege") SELECT "berletiDijFt", "fizetesiNap", "id", "ingatlanId", "kaucioFt", "kezdete", "kozosKoltsegFt", "letrehozva", "rezsiAtalanyFt", "rezsiElszamolas", "statusz", "vege" FROM "Jogviszony";
DROP TABLE "Jogviszony";
ALTER TABLE "new_Jogviszony" RENAME TO "Jogviszony";
CREATE INDEX "Jogviszony_ingatlanId_idx" ON "Jogviszony"("ingatlanId");
CREATE TABLE "new_Meghivo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyBerloId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lejar" DATETIME NOT NULL,
    "felhasznalva" DATETIME,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meghivo_jogviszonyBerloId_fkey" FOREIGN KEY ("jogviszonyBerloId") REFERENCES "JogviszonyBerlo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Meghivo" ("email", "felhasznalva", "id", "lejar", "letrehozva", "token") SELECT "email", "felhasznalva", "id", "lejar", "letrehozva", "token" FROM "Meghivo";
DROP TABLE "Meghivo";
ALTER TABLE "new_Meghivo" RENAME TO "Meghivo";
CREATE UNIQUE INDEX "Meghivo_token_key" ON "Meghivo"("token");
CREATE INDEX "Meghivo_jogviszonyBerloId_idx" ON "Meghivo"("jogviszonyBerloId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "JogviszonyBerlo_jogviszonyId_sorrend_idx" ON "JogviszonyBerlo"("jogviszonyId", "sorrend");

-- CreateIndex
CREATE INDEX "JogviszonyBerlo_berloId_idx" ON "JogviszonyBerlo"("berloId");

-- CreateIndex
CREATE UNIQUE INDEX "BerbeadoiAdatok_berbeadoId_key" ON "BerbeadoiAdatok"("berbeadoId");

-- CreateIndex
CREATE INDEX "Szerzodes_jogviszonyId_idx" ON "Szerzodes"("jogviszonyId");

-- CreateIndex
CREATE UNIQUE INDEX "SzerzodesModul_szerzodesId_kulcs_key" ON "SzerzodesModul"("szerzodesId", "kulcs");

-- CreateIndex
CREATE UNIQUE INDEX "SzerzodesParameter_szerzodesId_kulcs_key" ON "SzerzodesParameter"("szerzodesId", "kulcs");
