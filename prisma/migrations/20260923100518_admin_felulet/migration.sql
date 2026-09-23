-- AlterTable
ALTER TABLE "Felhasznalo" ADD COLUMN     "letiltva" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdminNaplo" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "muvelet" TEXT NOT NULL,
    "targyId" TEXT NOT NULL,
    "mikor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNaplo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminNaplo_mikor_idx" ON "AdminNaplo"("mikor");

-- CreateIndex
CREATE INDEX "AdminNaplo_adminId_idx" ON "AdminNaplo"("adminId");

-- AddForeignKey
ALTER TABLE "AdminNaplo" ADD CONSTRAINT "AdminNaplo_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
