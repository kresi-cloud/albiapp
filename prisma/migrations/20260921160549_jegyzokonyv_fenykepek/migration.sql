-- CreateTable
CREATE TABLE "JegyzokonyvKep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jegyzokonyvId" TEXT NOT NULL,
    "tetelId" TEXT,
    "parjaId" TEXT,
    "megnevezes" TEXT NOT NULL,
    "fajlNev" TEXT NOT NULL,
    "mimeTipus" TEXT NOT NULL,
    "meretBajt" INTEGER NOT NULL,
    "tartalom" BLOB NOT NULL,
    "feltoltoId" TEXT NOT NULL,
    "feltoltve" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "megerositoId" TEXT,
    "megerositve" DATETIME,
    "kifogas" TEXT,
    CONSTRAINT "JegyzokonyvKep_jegyzokonyvId_fkey" FOREIGN KEY ("jegyzokonyvId") REFERENCES "Jegyzokonyv" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JegyzokonyvKep_tetelId_fkey" FOREIGN KEY ("tetelId") REFERENCES "JegyzokonyvTetel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JegyzokonyvKep_parjaId_fkey" FOREIGN KEY ("parjaId") REFERENCES "JegyzokonyvKep" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "JegyzokonyvKep_feltoltoId_fkey" FOREIGN KEY ("feltoltoId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JegyzokonyvKep_megerositoId_fkey" FOREIGN KEY ("megerositoId") REFERENCES "Felhasznalo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "JegyzokonyvKep_parjaId_key" ON "JegyzokonyvKep"("parjaId");

-- CreateIndex
CREATE INDEX "JegyzokonyvKep_jegyzokonyvId_feltoltve_idx" ON "JegyzokonyvKep"("jegyzokonyvId", "feltoltve");

-- CreateIndex
CREATE INDEX "JegyzokonyvKep_tetelId_idx" ON "JegyzokonyvKep"("tetelId");
