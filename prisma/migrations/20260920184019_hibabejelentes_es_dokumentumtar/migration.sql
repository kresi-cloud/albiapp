-- AlterTable
ALTER TABLE "BerbeadoiAdatok" ADD COLUMN "telefon" TEXT;

-- AlterTable
ALTER TABLE "JogviszonyBerlo" ADD COLUMN "telefon" TEXT;

-- CreateTable
CREATE TABLE "Hibabejelentes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "bejelentoId" TEXT NOT NULL,
    "targy" TEXT NOT NULL,
    "leiras" TEXT NOT NULL,
    "terulet" TEXT NOT NULL,
    "ok" TEXT NOT NULL DEFAULT 'ismeretlen',
    "surgosseg" TEXT NOT NULL,
    "allapot" TEXT NOT NULL DEFAULT 'bejelentve',
    "viseloFel" TEXT,
    "bejelentve" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atvetve" DATETIME,
    "elharitva" DATETIME,
    "lezarva" DATETIME,
    CONSTRAINT "Hibabejelentes_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Hibabejelentes_bejelentoId_fkey" FOREIGN KEY ("bejelentoId") REFERENCES "Felhasznalo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HibaUzenet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hibabejelentesId" TEXT NOT NULL,
    "szerzoId" TEXT NOT NULL,
    "szoveg" TEXT NOT NULL,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HibaUzenet_hibabejelentesId_fkey" FOREIGN KEY ("hibabejelentesId") REFERENCES "Hibabejelentes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HibaUzenet_szerzoId_fkey" FOREIGN KEY ("szerzoId") REFERENCES "Felhasznalo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Hibabejelentes_jogviszonyId_allapot_idx" ON "Hibabejelentes"("jogviszonyId", "allapot");

-- CreateIndex
CREATE INDEX "HibaUzenet_hibabejelentesId_letrehozva_idx" ON "HibaUzenet"("hibabejelentesId", "letrehozva");
