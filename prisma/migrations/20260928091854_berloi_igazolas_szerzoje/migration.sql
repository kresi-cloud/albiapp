-- AlterTable
ALTER TABLE "BerloiIgazolas" ADD COLUMN     "szerzoId" TEXT;

-- AddForeignKey
ALTER TABLE "BerloiIgazolas" ADD CONSTRAINT "BerloiIgazolas_szerzoId_fkey" FOREIGN KEY ("szerzoId") REFERENCES "Felhasznalo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
