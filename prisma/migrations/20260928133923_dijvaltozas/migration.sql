-- CreateTable
CREATE TABLE "DijValtozas" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "ervenyesTol" TIMESTAMP(3) NOT NULL,
    "berletiDijFt" INTEGER NOT NULL,
    "kozosKoltsegFt" INTEGER NOT NULL,
    "rezsiAtalanyFt" INTEGER NOT NULL,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DijValtozas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DijValtozas_jogviszonyId_ervenyesTol_idx" ON "DijValtozas"("jogviszonyId", "ervenyesTol");

-- CreateIndex
CREATE UNIQUE INDEX "DijValtozas_jogviszonyId_ervenyesTol_key" ON "DijValtozas"("jogviszonyId", "ervenyesTol");

-- AddForeignKey
ALTER TABLE "DijValtozas" ADD CONSTRAINT "DijValtozas_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;
