-- CreateTable
CREATE TABLE "Bizonylat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eloirtTetelId" TEXT NOT NULL,
    "oldal" TEXT NOT NULL,
    "feltoltoId" TEXT NOT NULL,
    "fajlNev" TEXT NOT NULL,
    "mimeTipus" TEXT NOT NULL,
    "meretBajt" INTEGER NOT NULL,
    "tartalom" BLOB NOT NULL,
    "feltoltve" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bizonylat_eloirtTetelId_fkey" FOREIGN KEY ("eloirtTetelId") REFERENCES "EloirtTetel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bizonylat_feltoltoId_fkey" FOREIGN KEY ("feltoltoId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Bizonylat_eloirtTetelId_idx" ON "Bizonylat"("eloirtTetelId");

-- CreateIndex
CREATE UNIQUE INDEX "Bizonylat_eloirtTetelId_oldal_key" ON "Bizonylat"("eloirtTetelId", "oldal");
