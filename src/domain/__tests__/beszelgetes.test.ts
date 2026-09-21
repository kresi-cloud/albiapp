import { describe, expect, it } from "vitest";
import {
  ARCHIVALAS_NAP,
  MAX_HOSSZ,
  archivalasNapja,
  archivalt,
  beszelgetesNeve,
  elonezet,
  fajtaja,
  fajtaNeve,
  hatralevoNap,
  kifogasSzovege,
  megszolithatok,
  nyitvatartasSzovege,
  ugyanazATarsasag,
  uzenetetEllenoriz,
  type Resztvevo,
} from "../beszelgetes";

const BERBEADO: Resztvevo = { felhasznaloId: "b1", nev: "Kiss Éva", szerep: "berbeado" };
const ANNA: Resztvevo = { felhasznaloId: "t1", nev: "Nagy Anna", szerep: "berlo" };
const TAMAS: Resztvevo = { felhasznaloId: "t2", nev: "Szabó Tamás", szerep: "berlo" };

const nap = (ev: number, ho: number, napja: number) => new Date(Date.UTC(ev, ho - 1, napja));

describe("a beszélgetés fajtája", () => {
  it("két résztvevőnél kétirányú", () => {
    expect(fajtaja([BERBEADO, ANNA])).toBe("ketiranyu");
  });

  it("háromnál csoportos", () => {
    expect(fajtaja([BERBEADO, ANNA, TAMAS])).toBe("csoportos");
  });

  it("a nevét a szótárból kéri, nem kész mondatként adja vissza", () => {
    expect(fajtaNeve("csoportos")).toEqual({ kulcs: "beszelgetes.fajta.csoportos" });
  });
});

describe("archiválás a lezárás után", () => {
  const vege = nap(2026, 6, 30);

  it("élő jogviszonynál soha nem archivált", () => {
    expect(archivalt(null, nap(2030, 1, 1))).toBe(false);
  });

  it("a lezárás napján még nyitva van", () => {
    expect(archivalt(vege, vege)).toBe(false);
  });

  it("a kilencvenedik napon még nyitva van", () => {
    const kilencven = new Date(vege.getTime() + ARCHIVALAS_NAP * 24 * 60 * 60 * 1000);
    expect(hatralevoNap(vege, kilencven)).toBe(0);
    expect(archivalt(vege, kilencven)).toBe(false);
  });

  it("a kilencvenegyedik napon archivált", () => {
    const egyelMasnap = new Date(vege.getTime() + (ARCHIVALAS_NAP + 1) * 24 * 60 * 60 * 1000);
    expect(archivalt(vege, egyelMasnap)).toBe(true);
  });

  it("az archiválás napját ki tudjuk mondani előre", () => {
    expect(archivalasNapja(vege).toISOString().slice(0, 10)).toBe("2026-09-28");
  });

  it("élő jogviszonynál nincs mit magyarázni a nyitva tartásról", () => {
    expect(nyitvatartasSzovege(null, nap(2026, 7, 1))).toBeNull();
  });

  it("lezárás után megmondjuk, hány nap van hátra és meddig", () => {
    const szoveg = nyitvatartasSzovege(vege, nap(2026, 7, 10));
    expect(szoveg?.kulcs).toBe("beszelgetes.lezarult_sugo");
    expect(szoveg?.adatok?.nap).toBe(80);
  });

  it("archiválás után már nem határidőt mutatunk, hanem a tényt", () => {
    expect(nyitvatartasSzovege(vege, nap(2027, 1, 1))?.kulcs).toBe(
      "beszelgetes.archivalt_sugo",
    );
  });
});

describe("az üzenet ellenőrzése", () => {
  it("az üres üzenet nem megy el", () => {
    expect(uzenetetEllenoriz("   \n ")).toBe("ures");
  });

  it("a rendes üzenetre nincs kifogás", () => {
    expect(uzenetetEllenoriz("Holnap jön a kéményseprő, 9 és 11 között.")).toBeNull();
  });

  it("a nagyon hosszú üzenetet visszaadjuk, és megmondjuk a korlátot", () => {
    expect(uzenetetEllenoriz("a".repeat(MAX_HOSSZ + 1))).toBe("hosszu");
    const szoveg = kifogasSzovege("hosszu");
    expect(szoveg.kulcs).toBe("beszelgetes.hiba.hosszu");
    expect(szoveg.adatok?.max).toBe(MAX_HOSSZ);
  });

  it("a kifogás kód, a mondat a szótárban van", () => {
    expect(kifogasSzovege("ures")).toEqual({ kulcs: "beszelgetes.hiba.ures" });
  });

  it("a korláton pontosan még átmegy", () => {
    expect(uzenetetEllenoriz("a".repeat(MAX_HOSSZ))).toBeNull();
  });
});

describe("kit lehet megszólítani", () => {
  it("magunkat nem", () => {
    expect(megszolithatok([BERBEADO, ANNA, TAMAS], "t1").map((r) => r.felhasznaloId)).toEqual([
      "b1",
      "t2",
    ]);
  });

  it("a beszélgetés neve a többiek neve, a sajátunk nélkül", () => {
    expect(beszelgetesNeve([BERBEADO, ANNA, TAMAS], "b1")).toBe("Nagy Anna, Szabó Tamás");
    expect(beszelgetesNeve([BERBEADO, ANNA], "t1")).toBe("Kiss Éva");
  });
});

describe("ugyanaz a társaság", () => {
  it("a sorrend nem számít", () => {
    expect(ugyanazATarsasag(["b1", "t1"], ["t1", "b1"])).toBe(true);
  });

  it("a létszám igen", () => {
    expect(ugyanazATarsasag(["b1", "t1"], ["b1", "t1", "t2"])).toBe(false);
  });

  it("más emberekkel nem ugyanaz", () => {
    expect(ugyanazATarsasag(["b1", "t1"], ["b1", "t2"])).toBe(false);
  });
});

describe("előnézet a listában", () => {
  it("a sortörést kiveszi, hogy a lista egysoros maradjon", () => {
    expect(elonezet("Első sor\nmásodik   sor")).toBe("Első sor második sor");
  });

  it("a hosszút elvágja, és jelzi is", () => {
    const vagott = elonezet("a".repeat(200), 20);
    expect(vagott).toHaveLength(20);
    expect(vagott.endsWith("…")).toBe(true);
  });

  it("a rövidet nem bántja", () => {
    expect(elonezet("Rendben, köszönöm.")).toBe("Rendben, köszönöm.");
  });
});
