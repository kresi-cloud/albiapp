-- AlterTable
ALTER TABLE "Szerzodes" ADD COLUMN     "veglegesSzovegKet" TEXT;

-- CreateTable
CREATE TABLE "SzerzodesNyelvNyilatkozat" (
    "id" TEXT NOT NULL,
    "szerzodesId" TEXT NOT NULL,
    "felhasznaloId" TEXT NOT NULL,
    "tamogatja" BOOLEAN NOT NULL,
    "indoklas" TEXT NOT NULL DEFAULT '',
    "nyilatkozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SzerzodesNyelvNyilatkozat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SzerzodesNyelvNyilatkozat_szerzodesId_idx" ON "SzerzodesNyelvNyilatkozat"("szerzodesId");

-- CreateIndex
CREATE UNIQUE INDEX "SzerzodesNyelvNyilatkozat_szerzodesId_felhasznaloId_key" ON "SzerzodesNyelvNyilatkozat"("szerzodesId", "felhasznaloId");

-- AddForeignKey
ALTER TABLE "SzerzodesNyelvNyilatkozat" ADD CONSTRAINT "SzerzodesNyelvNyilatkozat_szerzodesId_fkey" FOREIGN KEY ("szerzodesId") REFERENCES "Szerzodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SzerzodesNyelvNyilatkozat" ADD CONSTRAINT "SzerzodesNyelvNyilatkozat_felhasznaloId_fkey" FOREIGN KEY ("felhasznaloId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
