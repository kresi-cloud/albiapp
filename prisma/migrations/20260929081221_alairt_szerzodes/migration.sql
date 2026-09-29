-- CreateTable
CREATE TABLE "AlairtSzerzodes" (
    "id" TEXT NOT NULL,
    "szerzodesId" TEXT NOT NULL,
    "feltoltoId" TEXT NOT NULL,
    "mimeTipus" TEXT NOT NULL,
    "meretBajt" INTEGER NOT NULL,
    "tartalom" BYTEA NOT NULL,
    "feltoltve" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rogzitve" TIMESTAMP(3),

    CONSTRAINT "AlairtSzerzodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlairtSzerzodes_szerzodesId_key" ON "AlairtSzerzodes"("szerzodesId");

-- AddForeignKey
ALTER TABLE "AlairtSzerzodes" ADD CONSTRAINT "AlairtSzerzodes_szerzodesId_fkey" FOREIGN KEY ("szerzodesId") REFERENCES "Szerzodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlairtSzerzodes" ADD CONSTRAINT "AlairtSzerzodes_feltoltoId_fkey" FOREIGN KEY ("feltoltoId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
