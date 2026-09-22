-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Betekinto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jogviszonyId" TEXT NOT NULL,
    "berloId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "cel" TEXT NOT NULL,
    "osszegetMutat" BOOLEAN NOT NULL DEFAULT true,
    "lejar" DATETIME NOT NULL,
    "visszavonva" DATETIME,
    "letrehozva" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Betekinto_jogviszonyId_fkey" FOREIGN KEY ("jogviszonyId") REFERENCES "Jogviszony" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Betekinto_berloId_fkey" FOREIGN KEY ("berloId") REFERENCES "Felhasznalo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Betekinto" ("berloId", "cel", "id", "jogviszonyId", "lejar", "letrehozva", "osszegetMutat", "token", "visszavonva") SELECT "berloId", "cel", "id", "jogviszonyId", "lejar", "letrehozva", "osszegetMutat", "token", "visszavonva" FROM "Betekinto";
DROP TABLE "Betekinto";
ALTER TABLE "new_Betekinto" RENAME TO "Betekinto";
CREATE UNIQUE INDEX "Betekinto_token_key" ON "Betekinto"("token");
CREATE INDEX "Betekinto_berloId_idx" ON "Betekinto"("berloId");
CREATE INDEX "Betekinto_jogviszonyId_idx" ON "Betekinto"("jogviszonyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
