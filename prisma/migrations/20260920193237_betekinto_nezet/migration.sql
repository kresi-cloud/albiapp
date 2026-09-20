-- CreateTable
CREATE TABLE "Betekinto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "berloId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "cel" TEXT NOT NULL,
    "osszegetMutat" BOOLEAN NOT NULL DEFAULT false,
    "lejar" DATETIME NOT NULL,
    "visszavonva" DATETIME,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Betekinto_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Betekinto_berloId_fkey" FOREIGN KEY ("berloId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BetekintoMegnyitas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "betekintoId" TEXT NOT NULL,
    "mikor" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BetekintoMegnyitas_betekintoId_fkey" FOREIGN KEY ("betekintoId") REFERENCES "Betekinto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Betekinto_token_key" ON "Betekinto"("token");

-- CreateIndex
CREATE INDEX "Betekinto_berloId_idx" ON "Betekinto"("berloId");

-- CreateIndex
CREATE INDEX "Betekinto_jogviszonyId_idx" ON "Betekinto"("jogviszonyId");

-- CreateIndex
CREATE INDEX "BetekintoMegnyitas_betekintoId_mikor_idx" ON "BetekintoMegnyitas"("betekintoId", "mikor");
