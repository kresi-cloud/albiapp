/**
 * A naptár racsa.
 *
 * Amit itt megfogni érdemes, az nem a szép eset, hanem a hónapforduló: a racs
 * teljes hetekből áll, tehát a szomszéd hónap napjai is látszanak benne, és az
 * azokra eső teendő nem tűnhet el. A másik a lejárt tétel: aki a következő
 * hónapot nézi, ne gondolja, hogy az elmaradás megszűnt.
 */

import { describe, expect, it } from "vitest";
import {
  honapotLep,
  idoszakElsoNapja,
  idoszakNapbol,
  kovetkezoHet,
  naptarHonap,
} from "../naptar";
import { uzenet } from "../nyelv";
import type { TeendoSurgosseggel } from "../teendok";

function teendo(
  esedekesseg: Date,
  surgosseg: TeendoSurgosseggel["surgosseg"] = "kesobbi",
  kulcs = `t:${esedekesseg.toISOString()}:${surgosseg}`,
): TeendoSurgosseggel {
  return {
    kulcs,
    cimzett: "berbeado",
    tipus: "proba",
    cim: uzenet("teendo.nincs"),
    esedekesseg,
    surgosseg,
  };
}

const MA = new Date(Date.UTC(2026, 8, 22)); // 2026. szeptember 22., kedd

describe("időszak", () => {
  it("napból kétjegyű hónapot ad", () => {
    expect(idoszakNapbol(new Date(Date.UTC(2026, 0, 5)))).toBe("2026-01");
    expect(idoszakNapbol(new Date(Date.UTC(2026, 11, 31)))).toBe("2026-12");
  });

  it("az időszak első napját UTC-ben adja", () => {
    const elso = idoszakElsoNapja("2026-09");
    expect(elso?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("az értelmetlen időszakra nem tippel", () => {
    expect(idoszakElsoNapja("2026-13")).toBeNull();
    expect(idoszakElsoNapja("szeptember")).toBeNull();
    expect(honapotLep("szeptember", 1)).toBe("szeptember");
  });

  it("a hónapléptetés átlép az éven", () => {
    expect(honapotLep("2026-12", 1)).toBe("2027-01");
    expect(honapotLep("2026-01", -1)).toBe("2025-12");
  });
});

describe("havi racs", () => {
  it("teljes hetekből áll, hétfővel kezdve", () => {
    const racs = naptarHonap([], "2026-09", MA);
    for (const het of racs.hetek) {
      expect(het).toHaveLength(7);
      expect(het[0].nap.getUTCDay()).toBe(1);
      expect(het[6].nap.getUTCDay()).toBe(0);
    }
    // 2026. szeptember 1. kedd, 30. szerda: öt hét kell hozzá.
    expect(racs.hetek).toHaveLength(5);
  });

  it("a hónap minden napja pontosan egyszer szerepel benne", () => {
    const racs = naptarHonap([], "2026-09", MA);
    const sajat = racs.hetek.flat().filter((nap) => nap.honapban);
    expect(sajat).toHaveLength(30);
    expect(new Set(sajat.map((nap) => nap.sorszam)).size).toBe(30);
  });

  it("a szomszéd hónap napjait megjelöli, de a teendőjüket kiírja", () => {
    // Augusztus 31. hétfő: a szeptemberi racs első napja.
    const racs = naptarHonap([teendo(new Date(Date.UTC(2026, 7, 31)))], "2026-09", MA);
    const elso = racs.hetek[0][0];
    expect(elso.honapban).toBe(false);
    expect(elso.teendok).toHaveLength(1);
  });

  it("a mai napot és a hétvégét megjelöli", () => {
    const racs = naptarHonap([], "2026-09", MA);
    const napok = racs.hetek.flat();
    expect(napok.filter((nap) => nap.ma)).toHaveLength(1);
    expect(napok.find((nap) => nap.ma)?.sorszam).toBe(22);
    expect(napok.filter((nap) => nap.hetvege)).toHaveLength(racs.hetek.length * 2);
  });

  it("a nap jelzése a legsürgetőbb teendőé", () => {
    const nap = new Date(Date.UTC(2026, 8, 10));
    const racs = naptarHonap(
      [teendo(nap, "kesobbi", "a"), teendo(nap, "lejart", "b")],
      "2026-09",
      MA,
    );
    const cella = racs.hetek.flat().find((sor) => sor.sorszam === 10 && sor.honapban);
    expect(cella?.jelzes).toBe("lejart");
    expect(cella?.teendok).toHaveLength(2);
  });

  it("teendő nélküli napnak nincs jelzése", () => {
    const racs = naptarHonap([], "2026-09", MA);
    expect(racs.hetek.flat().every((nap) => nap.jelzes === null)).toBe(true);
  });

  it("a racson kívül eső lejárt teendőt külön megszámolja", () => {
    const teendok = [
      teendo(new Date(Date.UTC(2026, 5, 10)), "lejart", "juniusi"),
      teendo(new Date(Date.UTC(2026, 8, 10)), "lejart", "szeptemberi"),
    ];
    const racs = naptarHonap(teendok, "2026-09", MA);
    expect(racs.lejartMashonnan).toBe(1);
  });

  it("az értelmetlen időszakra a mai hónapot rajzolja, nem üreset", () => {
    const racs = naptarHonap([], "szeptember", MA);
    expect(racs.idoszak).toBe("2026-09");
    expect(racs.hetek.length).toBeGreaterThan(0);
  });

  it("az előző és a következő hónapot is megadja", () => {
    const racs = naptarHonap([], "2026-12", MA);
    expect(racs.elozo).toBe("2026-11");
    expect(racs.kovetkezo).toBe("2027-01");
  });
});

describe("következő hét nap", () => {
  it("a mai nappal kezd, és annyi napot ad, amennyit kértek", () => {
    const het = kovetkezoHet([], MA);
    expect(het.napok).toHaveLength(7);
    expect(het.napok[0].ma).toBe(true);
    expect(het.napok[0].sorszam).toBe(22);
    expect(het.napok[6].sorszam).toBe(28);
  });

  it("a teendőt a saját napjára teszi", () => {
    const het = kovetkezoHet([teendo(new Date(Date.UTC(2026, 8, 25)), "kozeli")], MA);
    expect(het.napok.find((nap) => nap.sorszam === 25)?.teendok).toHaveLength(1);
    expect(het.napok.find((nap) => nap.sorszam === 24)?.teendok).toHaveLength(0);
  });

  it("a lejártat külön adja, nem a mai napra nyomja", () => {
    const het = kovetkezoHet(
      [teendo(new Date(Date.UTC(2026, 8, 5)), "lejart")],
      MA,
    );
    expect(het.lejart).toHaveLength(1);
    expect(het.napok.every((nap) => nap.teendok.length === 0)).toBe(true);
  });

  it("a ma esedékes lejárt teendő sem kerül a mai cellába kétszer", () => {
    // Elvileg a mai nap nem lehet lejárt, de a sürgősség és a dátum külön adat:
    // ha valaha elcsúsznak, a szám ne duplázódjon.
    const het = kovetkezoHet([teendo(MA, "lejart")], MA);
    expect(het.napok[0].teendok).toHaveLength(0);
    expect(het.lejart).toHaveLength(1);
  });

  it("átlép a hónapforduló felett", () => {
    const het = kovetkezoHet([], new Date(Date.UTC(2026, 8, 28)));
    expect(het.napok.map((nap) => nap.sorszam)).toEqual([28, 29, 30, 1, 2, 3, 4]);
  });
});
