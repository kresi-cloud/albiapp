-- CreateTable
CREATE TABLE "Meghivo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lejar" DATETIME NOT NULL,
    "felhasznalva" DATETIME,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meghivo_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Meghivo_token_key" ON "Meghivo"("token");

-- CreateIndex
CREATE INDEX "Meghivo_jogviszonyId_idx" ON "Meghivo"("jogviszonyId");
