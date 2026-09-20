-- CreateTable
CREATE TABLE "Felhasznalo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nev" TEXT NOT NULL,
    "jelszoHash" TEXT NOT NULL,
    "szerep" TEXT NOT NULL,
    "nyelv" TEXT NOT NULL DEFAULT 'hu',
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ingatlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tulajdonosId" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "cim" TEXT NOT NULL,
    "alapteruletM2" INTEGER,
    "kozosKoltsegFt" INTEGER,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ingatlan_tulajdonosId_fkey" FOREIGN KEY ("tulajdonosId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meroora" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ingatlanId" TEXT NOT NULL,
    "tipus" TEXT NOT NULL,
    "gyariSzam" TEXT,
    "mertekegyseg" TEXT NOT NULL,
    "almero" BOOLEAN NOT NULL DEFAULT false,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meroora_ingatlanId_fkey" FOREIGN KEY ("ingatlanId") REFERENCES "Ingatlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Oraallas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merooraId" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "ertek" REAL NOT NULL,
    "fotoUtvonal" TEXT,
    "rogzitoId" TEXT NOT NULL,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Oraallas_merooraId_fkey" FOREIGN KEY ("merooraId") REFERENCES "Meroora" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Oraallas_rogzitoId_fkey" FOREIGN KEY ("rogzitoId") REFERENCES "Felhasznalo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Jogviszony" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ingatlanId" TEXT NOT NULL,
    "berloId" TEXT,
    "berloNev" TEXT NOT NULL,
    "berloEmail" TEXT,
    "kezdete" DATETIME NOT NULL,
    "vege" DATETIME,
    "berletiDijFt" INTEGER NOT NULL,
    "kozosKoltsegFt" INTEGER NOT NULL DEFAULT 0,
    "kaucioFt" INTEGER NOT NULL DEFAULT 0,
    "fizetesiNap" INTEGER NOT NULL DEFAULT 5,
    "rezsiElszamolas" TEXT NOT NULL DEFAULT 'almero',
    "statusz" TEXT NOT NULL DEFAULT 'elo',
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Jogviszony_ingatlanId_fkey" FOREIGN KEY ("ingatlanId") REFERENCES "Ingatlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Jogviszony_berloId_fkey" FOREIGN KEY ("berloId") REFERENCES "Felhasznalo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EloirtTetel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "tipus" TEXT NOT NULL,
    "idoszak" TEXT NOT NULL,
    "esedekesseg" DATETIME NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EloirtTetel_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BerloiJeloles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "utalasDatuma" DATETIME NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "kozlemeny" TEXT,
    "igazolasUtvonal" TEXT,
    "rogzitve" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BerloiJeloles_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kivonattetel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tulajdonosId" TEXT NOT NULL,
    "jogviszonyId" TEXT,
    "konyvelesDatuma" DATETIME NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "kozlemeny" TEXT,
    "partnerNev" TEXT,
    "forrasFajl" TEXT NOT NULL,
    "sorUjjlenyomat" TEXT NOT NULL,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Kivonattetel_tulajdonosId_fkey" FOREIGN KEY ("tulajdonosId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Kivonattetel_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Egyeztetes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "eloirtTetelId" TEXT,
    "berloiJelolesId" TEXT,
    "kivonattetelId" TEXT,
    "allapot" TEXT NOT NULL,
    "elteresOka" TEXT,
    "elteresFt" INTEGER NOT NULL DEFAULT 0,
    "keses" INTEGER NOT NULL DEFAULT 0,
    "frissitve" DATETIME NOT NULL,
    CONSTRAINT "Egyeztetes_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Egyeztetes_eloirtTetelId_fkey" FOREIGN KEY ("eloirtTetelId") REFERENCES "EloirtTetel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Egyeztetes_berloiJelolesId_fkey" FOREIGN KEY ("berloiJelolesId") REFERENCES "BerloiJeloles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Egyeztetes_kivonattetelId_fkey" FOREIGN KEY ("kivonattetelId") REFERENCES "Kivonattetel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Teendo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cimzettId" TEXT NOT NULL,
    "jogviszonyId" TEXT,
    "tipus" TEXT NOT NULL,
    "cim" TEXT NOT NULL,
    "leiras" TEXT,
    "esedekesseg" DATETIME NOT NULL,
    "hivatkozas" TEXT,
    "statusz" TEXT NOT NULL DEFAULT 'nyitott',
    "kulcs" TEXT NOT NULL,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Teendo_cimzettId_fkey" FOREIGN KEY ("cimzettId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Teendo_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Felhasznalo_email_key" ON "Felhasznalo"("email");

-- CreateIndex
CREATE INDEX "Ingatlan_tulajdonosId_idx" ON "Ingatlan"("tulajdonosId");

-- CreateIndex
CREATE INDEX "Meroora_ingatlanId_idx" ON "Meroora"("ingatlanId");

-- CreateIndex
CREATE INDEX "Oraallas_merooraId_datum_idx" ON "Oraallas"("merooraId", "datum");

-- CreateIndex
CREATE INDEX "Jogviszony_ingatlanId_idx" ON "Jogviszony"("ingatlanId");

-- CreateIndex
CREATE INDEX "EloirtTetel_esedekesseg_idx" ON "EloirtTetel"("esedekesseg");

-- CreateIndex
CREATE UNIQUE INDEX "EloirtTetel_jogviszonyId_tipus_idoszak_key" ON "EloirtTetel"("jogviszonyId", "tipus", "idoszak");

-- CreateIndex
CREATE INDEX "BerloiJeloles_jogviszonyId_utalasDatuma_idx" ON "BerloiJeloles"("jogviszonyId", "utalasDatuma");

-- CreateIndex
CREATE UNIQUE INDEX "Kivonattetel_sorUjjlenyomat_key" ON "Kivonattetel"("sorUjjlenyomat");

-- CreateIndex
CREATE INDEX "Kivonattetel_tulajdonosId_konyvelesDatuma_idx" ON "Kivonattetel"("tulajdonosId", "konyvelesDatuma");

-- CreateIndex
CREATE UNIQUE INDEX "Egyeztetes_eloirtTetelId_key" ON "Egyeztetes"("eloirtTetelId");

-- CreateIndex
CREATE UNIQUE INDEX "Egyeztetes_berloiJelolesId_key" ON "Egyeztetes"("berloiJelolesId");

-- CreateIndex
CREATE UNIQUE INDEX "Egyeztetes_kivonattetelId_key" ON "Egyeztetes"("kivonattetelId");

-- CreateIndex
CREATE INDEX "Egyeztetes_jogviszonyId_allapot_idx" ON "Egyeztetes"("jogviszonyId", "allapot");

-- CreateIndex
CREATE UNIQUE INDEX "Teendo_kulcs_key" ON "Teendo"("kulcs");

-- CreateIndex
CREATE INDEX "Teendo_cimzettId_statusz_esedekesseg_idx" ON "Teendo"("cimzettId", "statusz", "esedekesseg");
