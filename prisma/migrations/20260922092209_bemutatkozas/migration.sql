-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Felhasznalo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nev" TEXT NOT NULL,
    "jelszoHash" TEXT NOT NULL,
    "szerep" TEXT NOT NULL,
    "nyelv" TEXT NOT NULL DEFAULT 'hu',
    "adatkeresLatta" DATETIME,
    "bemutatkozas" TEXT NOT NULL DEFAULT '',
    "rendszergazda" BOOLEAN NOT NULL DEFAULT false,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Felhasznalo" ("adatkeresLatta", "email", "id", "jelszoHash", "letrehozva", "nev", "nyelv", "szerep") SELECT "adatkeresLatta", "email", "id", "jelszoHash", "letrehozva", "nev", "nyelv", "szerep" FROM "Felhasznalo";
DROP TABLE "Felhasznalo";
ALTER TABLE "new_Felhasznalo" RENAME TO "Felhasznalo";
CREATE UNIQUE INDEX "Felhasznalo_email_key" ON "Felhasznalo"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
