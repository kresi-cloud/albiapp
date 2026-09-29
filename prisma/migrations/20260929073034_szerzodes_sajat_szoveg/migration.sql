-- CreateTable
CREATE TABLE "SzerzodesSzoveg" (
    "id" TEXT NOT NULL,
    "szerzodesId" TEXT NOT NULL,
    "kulcs" TEXT NOT NULL,
    "szoveg" TEXT NOT NULL,
    "szovegEn" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "SzerzodesSzoveg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SzerzodesSzoveg_szerzodesId_kulcs_key" ON "SzerzodesSzoveg"("szerzodesId", "kulcs");

-- AddForeignKey
ALTER TABLE "SzerzodesSzoveg" ADD CONSTRAINT "SzerzodesSzoveg_szerzodesId_fkey" FOREIGN KEY ("szerzodesId") REFERENCES "Szerzodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
