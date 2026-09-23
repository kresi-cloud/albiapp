-- Postgres-alapmigráció.
--
-- Az SQLite korából huszonhat migráció állt itt, de azok nyelvjárásfüggőek
-- (DATETIME, tábla-újraépítéses oszlopmódosítás), Postgresen nem futnak le.
-- Éles adat még sehol nincs, ezért a történetet nem átírni kellett, hanem
-- eldobni: ez az egy fájl állítja elő a mostani sémát. Ami ezután jön, az
-- megint rendes, egymásra épülő migráció lesz.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Felhasznalo" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nev" TEXT NOT NULL,
    "jelszoHash" TEXT NOT NULL,
    "szerep" TEXT NOT NULL,
    "nyelv" TEXT NOT NULL DEFAULT 'hu',
    "adatkeresLatta" TIMESTAMP(3),
    "bemutatkozas" TEXT NOT NULL DEFAULT '',
    "rendszergazda" BOOLEAN NOT NULL DEFAULT false,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Felhasznalo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beallitasok" (
    "id" TEXT NOT NULL,
    "berbeadoId" TEXT NOT NULL,
    "korabbiAblakNap" INTEGER NOT NULL DEFAULT 10,
    "kesobbiAblakNap" INTEGER NOT NULL DEFAULT 25,
    "bizonylatKeres" BOOLEAN NOT NULL DEFAULT true,
    "frissitve" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beallitasok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingatlan" (
    "id" TEXT NOT NULL,
    "tulajdonosId" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "cim" TEXT NOT NULL,
    "alapteruletM2" INTEGER,
    "helyrajziSzam" TEXT,
    "energetikaiAzonosito" TEXT,
    "kozosKoltsegFt" INTEGER,
    "beszerzesiArFt" INTEGER,
    "beszerzesDatuma" TIMESTAMP(3),
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ingatlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meroora" (
    "id" TEXT NOT NULL,
    "ingatlanId" TEXT NOT NULL,
    "tipus" TEXT NOT NULL,
    "gyariSzam" TEXT,
    "mertekegyseg" TEXT NOT NULL,
    "almero" BOOLEAN NOT NULL DEFAULT false,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meroora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Oraallas" (
    "id" TEXT NOT NULL,
    "merooraId" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "ertek" DOUBLE PRECISION NOT NULL,
    "fotoUtvonal" TEXT,
    "rogzitoId" TEXT NOT NULL,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Oraallas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dijszabas" (
    "id" TEXT NOT NULL,
    "merooraId" TEXT NOT NULL,
    "ervenyesTol" TIMESTAMP(3) NOT NULL,
    "kedvezmenyesArFiller" INTEGER NOT NULL,
    "piaciArFiller" INTEGER NOT NULL,
    "evesKeret" DOUBLE PRECISION,
    "alapdijFt" INTEGER NOT NULL DEFAULT 0,
    "csatornaArFiller" INTEGER NOT NULL DEFAULT 0,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dijszabas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jogviszony" (
    "id" TEXT NOT NULL,
    "ingatlanId" TEXT NOT NULL,
    "kezdete" TIMESTAMP(3) NOT NULL,
    "vege" TIMESTAMP(3),
    "berletiDijFt" INTEGER NOT NULL,
    "kozosKoltsegFt" INTEGER NOT NULL DEFAULT 0,
    "kaucioFt" INTEGER NOT NULL DEFAULT 0,
    "fizetesiNap" INTEGER NOT NULL DEFAULT 5,
    "rezsiElszamolas" TEXT NOT NULL DEFAULT 'almero',
    "rezsiAtalanyFt" INTEGER NOT NULL DEFAULT 0,
    "statusz" TEXT NOT NULL DEFAULT 'elo',
    "ertekelesAblak" TIMESTAMP(3),
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jogviszony_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ertekeles" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "szerzoId" TEXT NOT NULL,
    "alanyId" TEXT NOT NULL,
    "irany" TEXT NOT NULL,
    "szoveg" TEXT NOT NULL,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modositva" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ertekeles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErtekelesPont" (
    "id" TEXT NOT NULL,
    "ertekelesId" TEXT NOT NULL,
    "szempont" TEXT NOT NULL,
    "pont" INTEGER NOT NULL,

    CONSTRAINT "ErtekelesPont_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Elofizetes" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "fajta" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "szolgaltato" TEXT,
    "elofizeto" TEXT NOT NULL,
    "haviDijFt" INTEGER NOT NULL DEFAULT 0,
    "kezdete" TIMESTAMP(3) NOT NULL,
    "vege" TIMESTAMP(3),
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Elofizetes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElofizetesJovahagyas" (
    "id" TEXT NOT NULL,
    "elofizetesId" TEXT NOT NULL,
    "berloId" TEXT NOT NULL,
    "allapot" TEXT NOT NULL,
    "indoklas" TEXT,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElofizetesJovahagyas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JogviszonyBerlo" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "berloId" TEXT,
    "nev" TEXT NOT NULL,
    "email" TEXT,
    "szuletesiHely" TEXT,
    "szuletesiIdo" TIMESTAMP(3),
    "anyjaNeve" TEXT,
    "lakcim" TEXT,
    "igazolvanySzam" TEXT,
    "telefon" TEXT,
    "adatokForrasa" TEXT,
    "adatokFrissitve" TIMESTAMP(3),
    "sorrend" INTEGER NOT NULL DEFAULT 0,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JogviszonyBerlo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BerbeadoiAdatok" (
    "id" TEXT NOT NULL,
    "berbeadoId" TEXT NOT NULL,
    "szuletesiHely" TEXT,
    "szuletesiIdo" TIMESTAMP(3),
    "anyjaNeve" TEXT,
    "lakcim" TEXT,
    "igazolvanySzam" TEXT,
    "adoazonosito" TEXT,
    "telefon" TEXT,
    "bankszamla" TEXT,
    "bank" TEXT,
    "frissitve" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BerbeadoiAdatok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meghivo" (
    "id" TEXT NOT NULL,
    "jogviszonyBerloId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lejar" TIMESTAMP(3) NOT NULL,
    "felhasznalva" TIMESTAMP(3),
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meghivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EloirtTetel" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "tipus" TEXT NOT NULL,
    "idoszak" TEXT NOT NULL,
    "forrasId" TEXT NOT NULL DEFAULT '',
    "esedekesseg" TIMESTAMP(3) NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "reszletezes" TEXT,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EloirtTetel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BerloiIgazolas" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "utalasDatuma" TIMESTAMP(3) NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "kozlemeny" TEXT,
    "igazolasUtvonal" TEXT,
    "rogzitve" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BerloiIgazolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BerbeadoiIgazolas" (
    "id" TEXT NOT NULL,
    "tulajdonosId" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "megerkezett" BOOLEAN NOT NULL DEFAULT true,
    "eloirtTetelId" TEXT,
    "erkezesDatuma" TIMESTAMP(3) NOT NULL,
    "osszegFt" INTEGER NOT NULL DEFAULT 0,
    "kozlemeny" TEXT,
    "rogzitve" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BerbeadoiIgazolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bizonylat" (
    "id" TEXT NOT NULL,
    "eloirtTetelId" TEXT NOT NULL,
    "oldal" TEXT NOT NULL,
    "feltoltoId" TEXT NOT NULL,
    "fajlNev" TEXT NOT NULL,
    "mimeTipus" TEXT NOT NULL,
    "meretBajt" INTEGER NOT NULL,
    "tartalom" BYTEA NOT NULL,
    "feltoltve" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bizonylat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Elszamolas" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "idoszakKezdete" TIMESTAMP(3) NOT NULL,
    "idoszakVege" TIMESTAMP(3) NOT NULL,
    "allapot" TEXT NOT NULL DEFAULT 'tervezet',
    "osszegFt" INTEGER NOT NULL,
    "eloirtTetelId" TEXT,
    "berloiUzenet" TEXT,
    "kiadva" TIMESTAMP(3),
    "lezarva" TIMESTAMP(3),
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Elszamolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElszamolasTetel" (
    "id" TEXT NOT NULL,
    "elszamolasId" TEXT NOT NULL,
    "merooraId" TEXT,
    "fajta" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "mennyiseg" DOUBLE PRECISION,
    "mertekegyseg" TEXT,
    "reszletezes" TEXT NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "sorrend" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ElszamolasTetel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Koltseg" (
    "id" TEXT NOT NULL,
    "ingatlanId" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "fajta" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "szamlaUtvonal" TEXT,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Koltseg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teendo" (
    "id" TEXT NOT NULL,
    "cimzettId" TEXT NOT NULL,
    "jogviszonyId" TEXT,
    "tipus" TEXT NOT NULL,
    "cim" TEXT NOT NULL,
    "leiras" TEXT,
    "esedekesseg" TIMESTAMP(3) NOT NULL,
    "hivatkozas" TEXT,
    "statusz" TEXT NOT NULL DEFAULT 'nyitott',
    "kulcs" TEXT NOT NULL,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Teendo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Szerzodes" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "fajta" TEXT NOT NULL DEFAULT 'szerzodes',
    "alapSzerzodesId" TEXT,
    "allapot" TEXT NOT NULL DEFAULT 'tervezet',
    "kelteHelye" TEXT NOT NULL DEFAULT '',
    "kelte" TIMESTAMP(3),
    "veglegesSzoveg" TEXT,
    "veglegesSzovegEn" TEXT,
    "veglegesitve" TIMESTAMP(3),
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frissitve" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Szerzodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SzerzodesModul" (
    "id" TEXT NOT NULL,
    "szerzodesId" TEXT NOT NULL,
    "kulcs" TEXT NOT NULL,
    "sorrend" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SzerzodesModul_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SzerzodesParameter" (
    "id" TEXT NOT NULL,
    "szerzodesId" TEXT NOT NULL,
    "kulcs" TEXT NOT NULL,
    "ertek" TEXT NOT NULL,

    CONSTRAINT "SzerzodesParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jegyzokonyv" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "fajta" TEXT NOT NULL,
    "idopont" TIMESTAMP(3) NOT NULL,
    "allapotLeiras" TEXT NOT NULL DEFAULT '',
    "megjegyzes" TEXT,
    "allapot" TEXT NOT NULL DEFAULT 'tervezet',
    "veglegesSzoveg" TEXT,
    "veglegesitve" TIMESTAMP(3),
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jegyzokonyv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JegyzokonyvTetel" (
    "id" TEXT NOT NULL,
    "jegyzokonyvId" TEXT NOT NULL,
    "fajta" TEXT NOT NULL,
    "merooraId" TEXT,
    "megnevezes" TEXT NOT NULL,
    "ertek" TEXT,
    "megjegyzes" TEXT,
    "felelos" TEXT,
    "hatarido" TIMESTAMP(3),
    "sorrend" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JegyzokonyvTetel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JegyzokonyvKep" (
    "id" TEXT NOT NULL,
    "jegyzokonyvId" TEXT NOT NULL,
    "tetelId" TEXT,
    "parjaId" TEXT,
    "megnevezes" TEXT NOT NULL,
    "fajlNev" TEXT NOT NULL,
    "mimeTipus" TEXT NOT NULL,
    "meretBajt" INTEGER NOT NULL,
    "tartalom" BYTEA NOT NULL,
    "feltoltoId" TEXT NOT NULL,
    "feltoltve" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "megerositoId" TEXT,
    "megerositve" TIMESTAMP(3),
    "kifogas" TEXT,

    CONSTRAINT "JegyzokonyvKep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Igazolas" (
    "id" TEXT NOT NULL,
    "jogviszonyBerloId" TEXT NOT NULL,
    "cel" TEXT NOT NULL,
    "idoszak" TEXT NOT NULL,
    "osszegFt" INTEGER NOT NULL,
    "teljesitesNapja" TIMESTAMP(3) NOT NULL,
    "teljesitesModja" TEXT NOT NULL,
    "szoveg" TEXT NOT NULL,
    "kiallitva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Igazolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hibabejelentes" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "bejelentoId" TEXT NOT NULL,
    "targy" TEXT NOT NULL,
    "leiras" TEXT NOT NULL,
    "terulet" TEXT NOT NULL,
    "ok" TEXT NOT NULL DEFAULT 'ismeretlen',
    "surgosseg" TEXT NOT NULL,
    "allapot" TEXT NOT NULL DEFAULT 'bejelentve',
    "viseloFel" TEXT,
    "bejelentve" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atvetve" TIMESTAMP(3),
    "elharitva" TIMESTAMP(3),
    "lezarva" TIMESTAMP(3),

    CONSTRAINT "Hibabejelentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HibaUzenet" (
    "id" TEXT NOT NULL,
    "hibabejelentesId" TEXT NOT NULL,
    "szerzoId" TEXT NOT NULL,
    "szoveg" TEXT NOT NULL,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HibaUzenet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Betekinto" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "berloId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "cel" TEXT NOT NULL,
    "osszegetMutat" BOOLEAN NOT NULL DEFAULT true,
    "lejar" TIMESTAMP(3) NOT NULL,
    "visszavonva" TIMESTAMP(3),
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Betekinto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetekintoMegnyitas" (
    "id" TEXT NOT NULL,
    "betekintoId" TEXT NOT NULL,
    "mikor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetekintoMegnyitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beszelgetes" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utolsoUzenet" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Beszelgetes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeszelgetesResztvevo" (
    "id" TEXT NOT NULL,
    "beszelgetesId" TEXT NOT NULL,
    "felhasznaloId" TEXT NOT NULL,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeszelgetesResztvevo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeszelgetesUzenet" (
    "id" TEXT NOT NULL,
    "beszelgetesId" TEXT NOT NULL,
    "szerzoId" TEXT NOT NULL,
    "szoveg" TEXT NOT NULL,
    "kuldve" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeszelgetesUzenet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SzolgaltatoiLatogatas" (
    "id" TEXT NOT NULL,
    "jogviszonyId" TEXT NOT NULL,
    "bejelentoId" TEXT NOT NULL,
    "fajta" TEXT NOT NULL,
    "megnevezes" TEXT NOT NULL,
    "szolgaltato" TEXT,
    "nap" TIMESTAMP(3) NOT NULL,
    "idoablakTol" TEXT,
    "idoablakIg" TEXT,
    "megjegyzes" TEXT,
    "lemondva" TIMESTAMP(3),
    "lemondasOka" TEXT,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SzolgaltatoiLatogatas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LatogatasValasz" (
    "id" TEXT NOT NULL,
    "latogatasId" TEXT NOT NULL,
    "berloId" TEXT NOT NULL,
    "valasz" TEXT NOT NULL,
    "indoklas" TEXT,
    "letrehozva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LatogatasValasz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Felhasznalo_email_key" ON "Felhasznalo"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Beallitasok_berbeadoId_key" ON "Beallitasok"("berbeadoId");

-- CreateIndex
CREATE INDEX "Ingatlan_tulajdonosId_idx" ON "Ingatlan"("tulajdonosId");

-- CreateIndex
CREATE INDEX "Meroora_ingatlanId_idx" ON "Meroora"("ingatlanId");

-- CreateIndex
CREATE INDEX "Oraallas_merooraId_datum_idx" ON "Oraallas"("merooraId", "datum");

-- CreateIndex
CREATE INDEX "Dijszabas_merooraId_ervenyesTol_idx" ON "Dijszabas"("merooraId", "ervenyesTol");

-- CreateIndex
CREATE INDEX "Jogviszony_ingatlanId_idx" ON "Jogviszony"("ingatlanId");

-- CreateIndex
CREATE INDEX "Ertekeles_alanyId_idx" ON "Ertekeles"("alanyId");

-- CreateIndex
CREATE UNIQUE INDEX "Ertekeles_jogviszonyId_szerzoId_alanyId_key" ON "Ertekeles"("jogviszonyId", "szerzoId", "alanyId");

-- CreateIndex
CREATE UNIQUE INDEX "ErtekelesPont_ertekelesId_szempont_key" ON "ErtekelesPont"("ertekelesId", "szempont");

-- CreateIndex
CREATE INDEX "Elofizetes_jogviszonyId_idx" ON "Elofizetes"("jogviszonyId");

-- CreateIndex
CREATE INDEX "ElofizetesJovahagyas_berloId_idx" ON "ElofizetesJovahagyas"("berloId");

-- CreateIndex
CREATE UNIQUE INDEX "ElofizetesJovahagyas_elofizetesId_berloId_key" ON "ElofizetesJovahagyas"("elofizetesId", "berloId");

-- CreateIndex
CREATE INDEX "JogviszonyBerlo_jogviszonyId_sorrend_idx" ON "JogviszonyBerlo"("jogviszonyId", "sorrend");

-- CreateIndex
CREATE INDEX "JogviszonyBerlo_berloId_idx" ON "JogviszonyBerlo"("berloId");

-- CreateIndex
CREATE UNIQUE INDEX "BerbeadoiAdatok_berbeadoId_key" ON "BerbeadoiAdatok"("berbeadoId");

-- CreateIndex
CREATE UNIQUE INDEX "Meghivo_token_key" ON "Meghivo"("token");

-- CreateIndex
CREATE INDEX "Meghivo_jogviszonyBerloId_idx" ON "Meghivo"("jogviszonyBerloId");

-- CreateIndex
CREATE INDEX "EloirtTetel_esedekesseg_idx" ON "EloirtTetel"("esedekesseg");

-- CreateIndex
CREATE UNIQUE INDEX "EloirtTetel_jogviszonyId_tipus_idoszak_forrasId_key" ON "EloirtTetel"("jogviszonyId", "tipus", "idoszak", "forrasId");

-- CreateIndex
CREATE INDEX "BerloiIgazolas_jogviszonyId_utalasDatuma_idx" ON "BerloiIgazolas"("jogviszonyId", "utalasDatuma");

-- CreateIndex
CREATE INDEX "BerbeadoiIgazolas_tulajdonosId_erkezesDatuma_idx" ON "BerbeadoiIgazolas"("tulajdonosId", "erkezesDatuma");

-- CreateIndex
CREATE INDEX "BerbeadoiIgazolas_jogviszonyId_erkezesDatuma_idx" ON "BerbeadoiIgazolas"("jogviszonyId", "erkezesDatuma");

-- CreateIndex
CREATE UNIQUE INDEX "BerbeadoiIgazolas_eloirtTetelId_key" ON "BerbeadoiIgazolas"("eloirtTetelId");

-- CreateIndex
CREATE INDEX "Bizonylat_eloirtTetelId_idx" ON "Bizonylat"("eloirtTetelId");

-- CreateIndex
CREATE UNIQUE INDEX "Bizonylat_eloirtTetelId_oldal_key" ON "Bizonylat"("eloirtTetelId", "oldal");

-- CreateIndex
CREATE UNIQUE INDEX "Elszamolas_eloirtTetelId_key" ON "Elszamolas"("eloirtTetelId");

-- CreateIndex
CREATE INDEX "Elszamolas_jogviszonyId_idoszakVege_idx" ON "Elszamolas"("jogviszonyId", "idoszakVege");

-- CreateIndex
CREATE INDEX "ElszamolasTetel_elszamolasId_idx" ON "ElszamolasTetel"("elszamolasId");

-- CreateIndex
CREATE INDEX "Koltseg_ingatlanId_datum_idx" ON "Koltseg"("ingatlanId", "datum");

-- CreateIndex
CREATE UNIQUE INDEX "Teendo_kulcs_key" ON "Teendo"("kulcs");

-- CreateIndex
CREATE INDEX "Teendo_cimzettId_statusz_esedekesseg_idx" ON "Teendo"("cimzettId", "statusz", "esedekesseg");

-- CreateIndex
CREATE INDEX "Szerzodes_jogviszonyId_idx" ON "Szerzodes"("jogviszonyId");

-- CreateIndex
CREATE INDEX "Szerzodes_alapSzerzodesId_idx" ON "Szerzodes"("alapSzerzodesId");

-- CreateIndex
CREATE UNIQUE INDEX "SzerzodesModul_szerzodesId_kulcs_key" ON "SzerzodesModul"("szerzodesId", "kulcs");

-- CreateIndex
CREATE UNIQUE INDEX "SzerzodesParameter_szerzodesId_kulcs_key" ON "SzerzodesParameter"("szerzodesId", "kulcs");

-- CreateIndex
CREATE INDEX "Jegyzokonyv_jogviszonyId_idopont_idx" ON "Jegyzokonyv"("jogviszonyId", "idopont");

-- CreateIndex
CREATE INDEX "JegyzokonyvTetel_jegyzokonyvId_sorrend_idx" ON "JegyzokonyvTetel"("jegyzokonyvId", "sorrend");

-- CreateIndex
CREATE UNIQUE INDEX "JegyzokonyvKep_parjaId_key" ON "JegyzokonyvKep"("parjaId");

-- CreateIndex
CREATE INDEX "JegyzokonyvKep_jegyzokonyvId_feltoltve_idx" ON "JegyzokonyvKep"("jegyzokonyvId", "feltoltve");

-- CreateIndex
CREATE INDEX "JegyzokonyvKep_tetelId_idx" ON "JegyzokonyvKep"("tetelId");

-- CreateIndex
CREATE INDEX "Igazolas_jogviszonyBerloId_idoszak_idx" ON "Igazolas"("jogviszonyBerloId", "idoszak");

-- CreateIndex
CREATE INDEX "Hibabejelentes_jogviszonyId_allapot_idx" ON "Hibabejelentes"("jogviszonyId", "allapot");

-- CreateIndex
CREATE INDEX "HibaUzenet_hibabejelentesId_letrehozva_idx" ON "HibaUzenet"("hibabejelentesId", "letrehozva");

-- CreateIndex
CREATE UNIQUE INDEX "Betekinto_token_key" ON "Betekinto"("token");

-- CreateIndex
CREATE INDEX "Betekinto_berloId_idx" ON "Betekinto"("berloId");

-- CreateIndex
CREATE INDEX "Betekinto_jogviszonyId_idx" ON "Betekinto"("jogviszonyId");

-- CreateIndex
CREATE INDEX "BetekintoMegnyitas_betekintoId_mikor_idx" ON "BetekintoMegnyitas"("betekintoId", "mikor");

-- CreateIndex
CREATE INDEX "Beszelgetes_jogviszonyId_utolsoUzenet_idx" ON "Beszelgetes"("jogviszonyId", "utolsoUzenet");

-- CreateIndex
CREATE INDEX "BeszelgetesResztvevo_felhasznaloId_idx" ON "BeszelgetesResztvevo"("felhasznaloId");

-- CreateIndex
CREATE UNIQUE INDEX "BeszelgetesResztvevo_beszelgetesId_felhasznaloId_key" ON "BeszelgetesResztvevo"("beszelgetesId", "felhasznaloId");

-- CreateIndex
CREATE INDEX "BeszelgetesUzenet_beszelgetesId_kuldve_idx" ON "BeszelgetesUzenet"("beszelgetesId", "kuldve");

-- CreateIndex
CREATE INDEX "SzolgaltatoiLatogatas_jogviszonyId_nap_idx" ON "SzolgaltatoiLatogatas"("jogviszonyId", "nap");

-- CreateIndex
CREATE INDEX "LatogatasValasz_berloId_idx" ON "LatogatasValasz"("berloId");

-- CreateIndex
CREATE UNIQUE INDEX "LatogatasValasz_latogatasId_berloId_key" ON "LatogatasValasz"("latogatasId", "berloId");

-- AddForeignKey
ALTER TABLE "Beallitasok" ADD CONSTRAINT "Beallitasok_berbeadoId_fkey" FOREIGN KEY ("berbeadoId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingatlan" ADD CONSTRAINT "Ingatlan_tulajdonosId_fkey" FOREIGN KEY ("tulajdonosId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meroora" ADD CONSTRAINT "Meroora_ingatlanId_fkey" FOREIGN KEY ("ingatlanId") REFERENCES "Ingatlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oraallas" ADD CONSTRAINT "Oraallas_merooraId_fkey" FOREIGN KEY ("merooraId") REFERENCES "Meroora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oraallas" ADD CONSTRAINT "Oraallas_rogzitoId_fkey" FOREIGN KEY ("rogzitoId") REFERENCES "Felhasznalo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dijszabas" ADD CONSTRAINT "Dijszabas_merooraId_fkey" FOREIGN KEY ("merooraId") REFERENCES "Meroora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogviszony" ADD CONSTRAINT "Jogviszony_ingatlanId_fkey" FOREIGN KEY ("ingatlanId") REFERENCES "Ingatlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ertekeles" ADD CONSTRAINT "Ertekeles_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ertekeles" ADD CONSTRAINT "Ertekeles_szerzoId_fkey" FOREIGN KEY ("szerzoId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ertekeles" ADD CONSTRAINT "Ertekeles_alanyId_fkey" FOREIGN KEY ("alanyId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErtekelesPont" ADD CONSTRAINT "ErtekelesPont_ertekelesId_fkey" FOREIGN KEY ("ertekelesId") REFERENCES "Ertekeles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Elofizetes" ADD CONSTRAINT "Elofizetes_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElofizetesJovahagyas" ADD CONSTRAINT "ElofizetesJovahagyas_elofizetesId_fkey" FOREIGN KEY ("elofizetesId") REFERENCES "Elofizetes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElofizetesJovahagyas" ADD CONSTRAINT "ElofizetesJovahagyas_berloId_fkey" FOREIGN KEY ("berloId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JogviszonyBerlo" ADD CONSTRAINT "JogviszonyBerlo_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JogviszonyBerlo" ADD CONSTRAINT "JogviszonyBerlo_berloId_fkey" FOREIGN KEY ("berloId") REFERENCES "Felhasznalo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BerbeadoiAdatok" ADD CONSTRAINT "BerbeadoiAdatok_berbeadoId_fkey" FOREIGN KEY ("berbeadoId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meghivo" ADD CONSTRAINT "Meghivo_jogviszonyBerloId_fkey" FOREIGN KEY ("jogviszonyBerloId") REFERENCES "JogviszonyBerlo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EloirtTetel" ADD CONSTRAINT "EloirtTetel_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BerloiIgazolas" ADD CONSTRAINT "BerloiIgazolas_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BerbeadoiIgazolas" ADD CONSTRAINT "BerbeadoiIgazolas_tulajdonosId_fkey" FOREIGN KEY ("tulajdonosId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BerbeadoiIgazolas" ADD CONSTRAINT "BerbeadoiIgazolas_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BerbeadoiIgazolas" ADD CONSTRAINT "BerbeadoiIgazolas_eloirtTetelId_fkey" FOREIGN KEY ("eloirtTetelId") REFERENCES "EloirtTetel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bizonylat" ADD CONSTRAINT "Bizonylat_eloirtTetelId_fkey" FOREIGN KEY ("eloirtTetelId") REFERENCES "EloirtTetel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bizonylat" ADD CONSTRAINT "Bizonylat_feltoltoId_fkey" FOREIGN KEY ("feltoltoId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Elszamolas" ADD CONSTRAINT "Elszamolas_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Elszamolas" ADD CONSTRAINT "Elszamolas_eloirtTetelId_fkey" FOREIGN KEY ("eloirtTetelId") REFERENCES "EloirtTetel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElszamolasTetel" ADD CONSTRAINT "ElszamolasTetel_elszamolasId_fkey" FOREIGN KEY ("elszamolasId") REFERENCES "Elszamolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElszamolasTetel" ADD CONSTRAINT "ElszamolasTetel_merooraId_fkey" FOREIGN KEY ("merooraId") REFERENCES "Meroora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Koltseg" ADD CONSTRAINT "Koltseg_ingatlanId_fkey" FOREIGN KEY ("ingatlanId") REFERENCES "Ingatlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teendo" ADD CONSTRAINT "Teendo_cimzettId_fkey" FOREIGN KEY ("cimzettId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teendo" ADD CONSTRAINT "Teendo_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Szerzodes" ADD CONSTRAINT "Szerzodes_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Szerzodes" ADD CONSTRAINT "Szerzodes_alapSzerzodesId_fkey" FOREIGN KEY ("alapSzerzodesId") REFERENCES "Szerzodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SzerzodesModul" ADD CONSTRAINT "SzerzodesModul_szerzodesId_fkey" FOREIGN KEY ("szerzodesId") REFERENCES "Szerzodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SzerzodesParameter" ADD CONSTRAINT "SzerzodesParameter_szerzodesId_fkey" FOREIGN KEY ("szerzodesId") REFERENCES "Szerzodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jegyzokonyv" ADD CONSTRAINT "Jegyzokonyv_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JegyzokonyvTetel" ADD CONSTRAINT "JegyzokonyvTetel_jegyzokonyvId_fkey" FOREIGN KEY ("jegyzokonyvId") REFERENCES "Jegyzokonyv"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JegyzokonyvTetel" ADD CONSTRAINT "JegyzokonyvTetel_merooraId_fkey" FOREIGN KEY ("merooraId") REFERENCES "Meroora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JegyzokonyvKep" ADD CONSTRAINT "JegyzokonyvKep_jegyzokonyvId_fkey" FOREIGN KEY ("jegyzokonyvId") REFERENCES "Jegyzokonyv"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JegyzokonyvKep" ADD CONSTRAINT "JegyzokonyvKep_tetelId_fkey" FOREIGN KEY ("tetelId") REFERENCES "JegyzokonyvTetel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JegyzokonyvKep" ADD CONSTRAINT "JegyzokonyvKep_parjaId_fkey" FOREIGN KEY ("parjaId") REFERENCES "JegyzokonyvKep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JegyzokonyvKep" ADD CONSTRAINT "JegyzokonyvKep_feltoltoId_fkey" FOREIGN KEY ("feltoltoId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JegyzokonyvKep" ADD CONSTRAINT "JegyzokonyvKep_megerositoId_fkey" FOREIGN KEY ("megerositoId") REFERENCES "Felhasznalo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Igazolas" ADD CONSTRAINT "Igazolas_jogviszonyBerloId_fkey" FOREIGN KEY ("jogviszonyBerloId") REFERENCES "JogviszonyBerlo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hibabejelentes" ADD CONSTRAINT "Hibabejelentes_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hibabejelentes" ADD CONSTRAINT "Hibabejelentes_bejelentoId_fkey" FOREIGN KEY ("bejelentoId") REFERENCES "Felhasznalo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HibaUzenet" ADD CONSTRAINT "HibaUzenet_hibabejelentesId_fkey" FOREIGN KEY ("hibabejelentesId") REFERENCES "Hibabejelentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HibaUzenet" ADD CONSTRAINT "HibaUzenet_szerzoId_fkey" FOREIGN KEY ("szerzoId") REFERENCES "Felhasznalo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Betekinto" ADD CONSTRAINT "Betekinto_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Betekinto" ADD CONSTRAINT "Betekinto_berloId_fkey" FOREIGN KEY ("berloId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetekintoMegnyitas" ADD CONSTRAINT "BetekintoMegnyitas_betekintoId_fkey" FOREIGN KEY ("betekintoId") REFERENCES "Betekinto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beszelgetes" ADD CONSTRAINT "Beszelgetes_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeszelgetesResztvevo" ADD CONSTRAINT "BeszelgetesResztvevo_beszelgetesId_fkey" FOREIGN KEY ("beszelgetesId") REFERENCES "Beszelgetes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeszelgetesResztvevo" ADD CONSTRAINT "BeszelgetesResztvevo_felhasznaloId_fkey" FOREIGN KEY ("felhasznaloId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeszelgetesUzenet" ADD CONSTRAINT "BeszelgetesUzenet_beszelgetesId_fkey" FOREIGN KEY ("beszelgetesId") REFERENCES "Beszelgetes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeszelgetesUzenet" ADD CONSTRAINT "BeszelgetesUzenet_szerzoId_fkey" FOREIGN KEY ("szerzoId") REFERENCES "Felhasznalo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SzolgaltatoiLatogatas" ADD CONSTRAINT "SzolgaltatoiLatogatas_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SzolgaltatoiLatogatas" ADD CONSTRAINT "SzolgaltatoiLatogatas_bejelentoId_fkey" FOREIGN KEY ("bejelentoId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LatogatasValasz" ADD CONSTRAINT "LatogatasValasz_latogatasId_fkey" FOREIGN KEY ("latogatasId") REFERENCES "SzolgaltatoiLatogatas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LatogatasValasz" ADD CONSTRAINT "LatogatasValasz_berloId_fkey" FOREIGN KEY ("berloId") REFERENCES "Felhasznalo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

