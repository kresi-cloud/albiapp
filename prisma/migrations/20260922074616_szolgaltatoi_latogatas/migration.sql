-- CreateTable
CREATE TABLE "SzolgaltatoiLatogatas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "bejelentoId" TEXT NOT NULL,
    "fajta" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "szolgaltato" TEXT,
    "nap" DATETIME NOT NULL,
    "idoablakTol" TEXT,
    "idoablakIg" TEXT,
    "megjegyzes" TEXT,
    "lemondva" DATETIME,
    "lemondasOka" TEXT,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SzolgaltatoiLatogatas_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SzolgaltatoiLatogatas_bejelentoId_fkey" FOREIGN KEY ("bejelentoId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LatogatasValasz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "latogatasId" TEXT NOT NULL,
    "berloId" TEXT NOT NULL,
    "valasz" TEXT NOT NULL,
    "indoklas" TEXT,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LatogatasValasz_latogatasId_fkey" FOREIGN KEY ("latogatasId") REFERENCES "SzolgaltatoiLatogatas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LatogatasValasz_berloId_fkey" FOREIGN KEY ("berloId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SzolgaltatoiLatogatas_jogviszonyId_nap_idx" ON "SzolgaltatoiLatogatas"("jogviszonyId", "nap");

-- CreateIndex
CREATE INDEX "LatogatasValasz_berloId_idx" ON "LatogatasValasz"("berloId");

-- CreateIndex
CREATE UNIQUE INDEX "LatogatasValasz_latogatasId_berloId_key" ON "LatogatasValasz"("latogatasId", "berloId");
