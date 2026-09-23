-- CreateTable
CREATE TABLE "Ertekeles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "szerzoId" TEXT NOT NULL,
    "alanyId" TEXT NOT NULL,
    "irany" TEXT NOT NULL,
    "szoveg" TEXT NOT NULL,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modositva" DATETIME NOT NULL,
    CONSTRAINT "Ertekeles_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ertekeles_szerzoId_fkey" FOREIGN KEY ("szerzoId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ertekeles_alanyId_fkey" FOREIGN KEY ("alanyId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ErtekelesPont" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ertekelesId" TEXT NOT NULL,
    "szempont" TEXT NOT NULL,
    "pont" INTEGER NOT NULL,
    CONSTRAINT "ErtekelesPont_ertekelesId_fkey" FOREIGN KEY ("ertekelesId") REFERENCES "Ertekeles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Ertekeles_alanyId_idx" ON "Ertekeles"("alanyId");

-- CreateIndex
CREATE UNIQUE INDEX "Ertekeles_jogviszonyId_szerzoId_alanyId_key" ON "Ertekeles"("jogviszonyId", "szerzoId", "alanyId");

-- CreateIndex
CREATE UNIQUE INDEX "ErtekelesPont_ertekelesId_szempont_key" ON "ErtekelesPont"("ertekelesId", "szempont");
