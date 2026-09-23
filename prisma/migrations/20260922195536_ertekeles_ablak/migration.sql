-- A mező neve eddig azt mondta, mikor rögzítették a lezárást; a tartalma
-- viszont az értékelési ablak kezdete, ami előre rögzített lezárásnál a
-- kiköltözés napja, és amit egy későbbi lezárás nem számol újra. Átnevezzük,
-- hogy a név azt mondja, ami benne van. Átnevezés, nem új oszlop: a meglévő
-- lezárások kezdete nem veszhet el.
ALTER TABLE "Jogviszony" RENAME COLUMN "lezarva" TO "ertekelesAblak";
