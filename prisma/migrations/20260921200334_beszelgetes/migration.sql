-- CreateTable
CREATE TABLE "Beszelgetes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utolsoUzenet" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Beszelgetes_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BeszelgetesResztvevo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beszelgetesId" TEXT NOT NULL,
    "felhasznaloId" TEXT NOT NULL,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BeszelgetesResztvevo_beszelgetesId_fkey" FOREIGN KEY ("beszelgetesId") REFERENCES "Beszelgetes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BeszelgetesResztvevo_felhasznaloId_fkey" FOREIGN KEY ("felhasznaloId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BeszelgetesUzenet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beszelgetesId" TEXT NOT NULL,
    "szerzoId" TEXT NOT NULL,
    "szoveg" TEXT NOT NULL,
    "kuldve" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BeszelgetesUzenet_beszelgetesId_fkey" FOREIGN KEY ("beszelgetesId") REFERENCES "Beszelgetes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BeszelgetesUzenet_szerzoId_fkey" FOREIGN KEY ("szerzoId") REFERENCES "Felhasznalo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Beszelgetes_jogviszonyId_utolsoUzenet_idx" ON "Beszelgetes"("jogviszonyId", "utolsoUzenet");

-- CreateIndex
CREATE INDEX "BeszelgetesResztvevo_felhasznaloId_idx" ON "BeszelgetesResztvevo"("felhasznaloId");

-- CreateIndex
CREATE UNIQUE INDEX "BeszelgetesResztvevo_beszelgetesId_felhasznaloId_key" ON "BeszelgetesResztvevo"("beszelgetesId", "felhasznaloId");

-- CreateIndex
CREATE INDEX "BeszelgetesUzenet_beszelgetesId_kuldve_idx" ON "BeszelgetesUzenet"("beszelgetesId", "kuldve");
