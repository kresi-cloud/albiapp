import { describe, expect, it } from "vitest";
import {
  hibakbolTeendok,
  keses,
  koltsegJavaslat,
  lepesLehetseges,
  lepesek,
  nyitott,
  valaszHatarido,
  type HibaTeendohoz,
} from "../hibabejelentes";

const nap = (szoveg: string) => new Date(`${szoveg}T00:00:00.000Z`);

describe("válaszhatáridő", () => {
  it("veszélyhelyzetnél a bejelentés napja", () => {
    expect(valaszHatarido("veszhelyzet", nap("2026-09-20"))).toEqual(nap("2026-09-20"));
  });

  it("sürgősnél három nap", () => {
    expect(valaszHatarido("surgos", nap("2026-09-20"))).toEqual(nap("2026-09-23"));
  });

  it("ráérősnél nyolc nap", () => {
    expect(valaszHatarido("normal", nap("2026-09-20"))).toEqual(nap("2026-09-28"));
  });

  it("a bejelentés napközbeni időpontját a nap elejére vágja", () => {
    const delutan = new Date("2026-09-20T17:42:11.000Z");
    expect(valaszHatarido("surgos", delutan)).toEqual(nap("2026-09-23"));
  });
});

describe("költségviselő javaslata", () => {
  it("a bérlő okozta kár a bérlőé, akkor is, ha épületszerkezeti", () => {
    const javaslat = koltsegJavaslat("epulet", "karokozas");
    expect(javaslat.fel).toBe("berlo");
    expect(javaslat.indoklas).toMatch(/bérlő/);
  });

  it("a központi berendezés a bérbeadóé", () => {
    expect(koltsegJavaslat("kozponti_berendezes", "elhasznalodas").fel).toBe("berbeado");
  });

  it("a közös helyiség a bérbeadóé akkor is, ha nem tudni, mitől romlott el", () => {
    expect(koltsegJavaslat("kozos_terulet", "ismeretlen").fel).toBe("berbeado");
  });

  it("a lakáson belüli elhasználódás megosztott", () => {
    const javaslat = koltsegJavaslat("haztartasi_gep", "elhasznalodas");
    expect(javaslat.fel).toBe("megosztott");
    expect(javaslat.indoklas).toMatch(/13\. § \(1\)/);
  });

  it("ismeretlen oknál a lakáson belül nem tippel", () => {
    const javaslat = koltsegJavaslat("burkolat", "ismeretlen");
    expect(javaslat.fel).toBeNull();
    expect(javaslat.indoklas).toMatch(/nem tippelek/);
  });
});

describe("állapotlépések", () => {
  it("a bérlő nem mondhatja elhárítottnak a hibát", () => {
    expect(lepesLehetseges("folyamatban", "elharitva", "berlo")).toBe(false);
    expect(lepesLehetseges("folyamatban", "elharitva", "berbeado")).toBe(true);
  });

  it("a bérbeadó nem zárhatja le a bérlő megerősítése nélkül", () => {
    expect(lepesLehetseges("elharitva", "lezarva", "berbeado")).toBe(false);
    expect(lepesLehetseges("elharitva", "lezarva", "berlo")).toBe(true);
  });

  it("a bérlő visszanyithatja, ha mégsem lett jó", () => {
    expect(lepesLehetseges("elharitva", "folyamatban", "berlo")).toBe(true);
  });

  it("a bérlő az elutasítást is visszanyithatja, hogy legyen hova válaszolni", () => {
    expect(lepesLehetseges("elutasitva", "folyamatban", "berlo")).toBe(true);
  });

  it("lezárt hibán már egyik fél sem lép", () => {
    expect(lepesek("lezarva", "berbeado")).toEqual([]);
    expect(lepesek("lezarva", "berlo")).toEqual([]);
  });

  it("a nyitott állapotok nem tartalmazzák a lezártat és az elutasítottat", () => {
    expect(nyitott("bejelentve")).toBe(true);
    expect(nyitott("elharitva")).toBe(true);
    expect(nyitott("lezarva")).toBe(false);
    expect(nyitott("elutasitva")).toBe(false);
  });
});

describe("teendők a hibákból", () => {
  const alap: HibaTeendohoz = {
    id: "h1",
    jogviszonyId: "jv1",
    targy: "Csöpög a mosogató csaptelepe",
    surgosseg: "normal",
    allapot: "bejelentve",
    bejelentve: nap("2026-09-10"),
  };

  it("az új bejelentés a bérbeadó teendője, a válaszhatáridővel", () => {
    const teendok = hibakbolTeendok([alap]);
    expect(teendok).toHaveLength(1);
    expect(teendok[0].cimzett).toBe("berbeado");
    expect(teendok[0].cim).toMatch(/Új hibabejelentés/);
    expect(teendok[0].esedekesseg).toEqual(nap("2026-09-18"));
  });

  it("a veszélyhelyzet határideje a bejelentés napja", () => {
    const teendok = hibakbolTeendok([{ ...alap, surgosseg: "veszhelyzet" }]);
    expect(teendok[0].esedekesseg).toEqual(nap("2026-09-10"));
  });

  it("az elhárított hiba már a bérlő teendője", () => {
    const teendok = hibakbolTeendok([{ ...alap, allapot: "elharitva" }]);
    expect(teendok).toHaveLength(1);
    expect(teendok[0].cimzett).toBe("berlo");
    expect(teendok[0].cim).toMatch(/Erősítsd meg/);
  });

  it("a lezárt és az elutasított hibából nem lesz teendő", () => {
    expect(hibakbolTeendok([{ ...alap, allapot: "lezarva" }])).toEqual([]);
    expect(hibakbolTeendok([{ ...alap, allapot: "elutasitva" }])).toEqual([]);
  });

  it("minden hibának saját kulcsa van, hogy ne írják felül egymást", () => {
    const teendok = hibakbolTeendok([alap, { ...alap, id: "h2" }]);
    expect(new Set(teendok.map((teendo) => teendo.kulcs)).size).toBe(2);
  });
});

describe("késés", () => {
  it("lejártnak jelöli, ha a határidő elmúlt", () => {
    expect(keses("surgos", nap("2026-09-10"), nap("2026-09-15"))).toEqual({
      napja: 5,
      lejart: true,
    });
  });

  it("a határidő napja még nem lejárt", () => {
    expect(keses("surgos", nap("2026-09-10"), nap("2026-09-13")).lejart).toBe(false);
  });
});
