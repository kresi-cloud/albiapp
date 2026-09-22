import { describe, expect, it } from "vitest";
import {
  ABLAK_NAP,
  SZEMPONTOK,
  ablakNyitva,
  allapota,
  ellenoriz,
  ertekelesTeendoi,
  felfedve,
  hatralevoNap,
  irhato,
  nezet,
  pontja,
  szempontNeve,
  allapotMondata,
  type ErtekelesAdat,
  type Paros,
} from "../ertekeles";

const VEGE = new Date(Date.UTC(2026, 5, 30));

function nappal(eltelt: number): Date {
  return new Date(VEGE.getTime() + eltelt * 86400000);
}

function ertekeles(szerzoId: string, alanyId: string): ErtekelesAdat {
  return {
    szerzoId,
    alanyId,
    irany: szerzoId === "berbeado" ? "berlorol" : "berbeadorol",
    szoveg: "Rendben ment.",
    pontok: SZEMPONTOK[szerzoId === "berbeado" ? "berlorol" : "berbeadorol"].map(
      (szempont) => ({ szempont, pont: 4 }),
    ),
    letrehozva: nappal(1),
  };
}

const URES: Paros = { sajat: null, masike: null };

describe("az értékelés ideje", () => {
  it("a futó jogviszonyra nincs értékelés", () => {
    expect(allapota(URES, null, nappal(10))).toBe("nem_ideje");
  });

  it("a lezárás napja előtt sincs", () => {
    expect(allapota(URES, VEGE, nappal(-1))).toBe("nem_ideje");
  });

  it("a lezárás napján már lehet", () => {
    expect(allapota(URES, VEGE, VEGE)).toBe("irhato");
    expect(ablakNyitva(VEGE, VEGE)).toBe(true);
  });

  it("az ablak utolsó napján még lehet, utána már nem", () => {
    expect(ablakNyitva(VEGE, nappal(ABLAK_NAP))).toBe(true);
    expect(ablakNyitva(VEGE, nappal(ABLAK_NAP + 1))).toBe(false);
  });

  it("a hátralévő napok az ablak végéig számolnak", () => {
    expect(hatralevoNap(VEGE, VEGE)).toBe(ABLAK_NAP);
    expect(hatralevoNap(VEGE, nappal(ABLAK_NAP))).toBe(0);
    expect(hatralevoNap(VEGE, nappal(ABLAK_NAP + 1))).toBeNull();
    expect(hatralevoNap(null, VEGE)).toBeNull();
  });
});

describe("a vakság", () => {
  it("egy megírt értékeléstől még nem fedjük fel a másikat", () => {
    const paros: Paros = { sajat: ertekeles("berbeado", "berlo"), masike: null };
    expect(felfedve(paros, VEGE, nappal(2))).toBe(false);
    expect(allapota(paros, VEGE, nappal(2))).toBe("varakozik");
  });

  it("a másik fél szövegét meg sem kapja, amíg nincs felfedve", () => {
    const paros: Paros = {
      sajat: ertekeles("berbeado", "berlo"),
      masike: ertekeles("berlo", "berbeado"),
    };
    // Itt már mindkettő megvan, tehát felfedjük.
    expect(nezet(paros, VEGE, nappal(2)).masike).not.toBeNull();

    // De ha csak a másiké van meg, azt nem adjuk ki.
    const csakMasike: Paros = { sajat: null, masike: ertekeles("berlo", "berbeado") };
    const lathato = nezet(csakMasike, VEGE, nappal(2));
    expect(lathato.allapot).toBe("irhato");
    expect(lathato.masike).toBeNull();
  });

  it("mindkettő megvan: felfedve", () => {
    const paros: Paros = {
      sajat: ertekeles("berbeado", "berlo"),
      masike: ertekeles("berlo", "berbeado"),
    };
    expect(allapota(paros, VEGE, nappal(3))).toBe("lathato");
  });

  it("az ablak letelte a hallgatást is felfedi", () => {
    const paros: Paros = { sajat: null, masike: ertekeles("berlo", "berbeado") };
    expect(allapota(paros, VEGE, nappal(ABLAK_NAP + 1))).toBe("lathato");
    expect(nezet(paros, VEGE, nappal(ABLAK_NAP + 1)).masike).not.toBeNull();
  });

  it("ha egyik fél sem írt, az ablak letelte után sincs mit mutatni", () => {
    expect(allapota(URES, VEGE, nappal(ABLAK_NAP + 1))).toBe("elmaradt");
  });
});

describe("a módosíthatóság", () => {
  it("felfedésig a saját értékelés módosítható", () => {
    const paros: Paros = { sajat: ertekeles("berbeado", "berlo"), masike: null };
    expect(irhato(paros, VEGE, nappal(5))).toBe(true);
  });

  it("felfedés után senki nem ír át semmit", () => {
    const paros: Paros = {
      sajat: ertekeles("berbeado", "berlo"),
      masike: ertekeles("berlo", "berbeado"),
    };
    expect(irhato(paros, VEGE, nappal(5))).toBe(false);
  });

  it("az ablak letelte után sem", () => {
    expect(irhato(URES, VEGE, nappal(ABLAK_NAP + 1))).toBe(false);
  });

  it("a futó jogviszonyon nem lehet írni", () => {
    expect(irhato(URES, null, nappal(5))).toBe(false);
  });
});

describe("az ellenőrzés", () => {
  const jo = {
    irany: "berlorol" as const,
    szoveg: "Pontosan fizetett, a lakást rendben hagyta.",
    pontok: SZEMPONTOK.berlorol.map((szempont) => ({ szempont, pont: 5 })),
  };

  it("a helyes bevitelre nincs kifogás", () => {
    expect(ellenoriz(jo)).toEqual([]);
  });

  it("pontszám magyarázat nélkül nincs", () => {
    expect(ellenoriz({ ...jo, szoveg: "   " })).toContain("nincs_szoveg");
  });

  it("minden szempontot meg kell adni", () => {
    expect(ellenoriz({ ...jo, pontok: jo.pontok.slice(1) })).toContain("hianyzo_szempont");
  });

  it("a másik irány szempontja ide nem való", () => {
    expect(
      ellenoriz({ ...jo, pontok: [...jo.pontok, { szempont: "elszamolas", pont: 3 }] }),
    ).toContain("ismeretlen_szempont");
  });

  it("a tartományon kívüli pont nem megy át", () => {
    expect(
      ellenoriz({ ...jo, pontok: jo.pontok.map((sor) => ({ ...sor, pont: 6 })) }),
    ).toContain("tartomanyon_kivul");
    expect(
      ellenoriz({ ...jo, pontok: jo.pontok.map((sor) => ({ ...sor, pont: 0 })) }),
    ).toContain("tartomanyon_kivul");
    expect(
      ellenoriz({ ...jo, pontok: jo.pontok.map((sor) => ({ ...sor, pont: 4.5 })) }),
    ).toContain("tartomanyon_kivul");
  });
});

describe("a szempontok", () => {
  it("a két irány más szempontokat kap", () => {
    expect(SZEMPONTOK.berlorol).not.toEqual(SZEMPONTOK.berbeadorol);
    expect(SZEMPONTOK.berlorol.length).toBeGreaterThan(0);
    expect(SZEMPONTOK.berbeadorol.length).toBeGreaterThan(0);
  });

  it("a pont szempontonként kérdezhető le", () => {
    const sor = ertekeles("berbeado", "berlo");
    expect(pontja(sor, "fizetes")).toBe(4);
    expect(pontja(sor, "elszamolas")).toBeNull();
  });

  it("a nevek a szótáron mennek át, nem prózaként állnak a kódban", () => {
    expect(szempontNeve("berlorol", "fizetes").kulcs).toBe(
      "ertekeles.szempont.berlorol.fizetes",
    );
    expect(allapotMondata("varakozik").kulcs).toBe("ertekeles.allapot.varakozik");
  });
});

describe("az értékelés teendője", () => {
  const alap = { jogviszonyId: "jv1", masikFelId: "berlo", cimke: "Ferencvárosi garzon" };

  it("amíg nincs megírva és nyitva az ablak, teendő van belőle", () => {
    const teendok = ertekelesTeendoi(
      [{ ...alap, vege: VEGE, paros: URES }],
      "berbeado",
      nappal(2),
    );
    expect(teendok).toHaveLength(1);
    expect(teendok[0].kulcs).toBe("ertekeles:jv1:berlo");
    expect(teendok[0].hivatkozas).toBe("/ertekelesek");
  });

  it("a megírt értékelés után eltűnik", () => {
    const paros: Paros = { sajat: ertekeles("berbeado", "berlo"), masike: null };
    expect(ertekelesTeendoi([{ ...alap, vege: VEGE, paros }], "berbeado", nappal(2))).toEqual(
      [],
    );
  });

  it("a futó jogviszonyból nincs teendő", () => {
    expect(ertekelesTeendoi([{ ...alap, vege: null, paros: URES }], "berbeado", nappal(2))).toEqual(
      [],
    );
  });

  it("az ablak letelte után sincs", () => {
    expect(
      ertekelesTeendoi([{ ...alap, vege: VEGE, paros: URES }], "berbeado", nappal(ABLAK_NAP + 1)),
    ).toEqual([]);
  });

  it("az esedékesség az ablak utolsó napja, nem a lezárás napja", () => {
    const teendok = ertekelesTeendoi(
      [{ ...alap, vege: VEGE, paros: URES }],
      "berlo",
      nappal(2),
    );
    expect(teendok[0].esedekesseg.getTime()).toBe(nappal(ABLAK_NAP).getTime());
  });
});
