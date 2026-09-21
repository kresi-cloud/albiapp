import { describe, expect, it } from "vitest";
import { NYELVEK, szovegezo, uzenet, type Szotar } from "../nyelv";
import { SZOTAR, szovegekNyelvvel } from "../szotar";
import {
  allapotNeve as betekintoAllapotNeve,
  haviAllapotNeve,
  mondatok,
  osszesit,
  type Allapot as BetekintoAllapot,
  type BetekintoTetel,
} from "../betekinto";
import {
  allapotNeve,
  koltsegJavaslat,
  lepesCimke,
  okNeve,
  OKOK,
  surgossegLeirasa,
  surgossegNeve,
  SURGOSSEGEK,
  teruletNeve,
  TERULETEK,
  VESZELYHELYZETI_TEENDOK,
  viseloNeve,
  type HibaAllapot,
  type ViseloFel,
} from "../hibabejelentes";
import { fajtaCimke, type DokumentumFajta } from "../dokumentumtar";

const PROBA: Szotar = {
  koszones: { hu: "Szia, {nev}", en: "Hello, {nev}" },
  osszeg: { hu: "{osszeg} Ft", en: "HUF {osszeg}" },
  keret: { hu: "[{belso}]", en: "[{belso}]" },
  egyszeru: { hu: "Kész", en: "Done" },
};

describe("szövegező", () => {
  it("a beállított nyelven ad vissza", () => {
    expect(szovegezo("hu", PROBA).sz("egyszeru")).toBe("Kész");
    expect(szovegezo("en", PROBA).sz("egyszeru")).toBe("Done");
  });

  it("behelyettesíti a megadott értékeket", () => {
    expect(szovegezo("en", PROBA).sz("koszones", { nev: "Anna" })).toBe("Hello, Anna");
  });

  it("a számot a nyelv szerint tagolja", () => {
    expect(szovegezo("hu", PROBA).sz("osszeg", { osszeg: 150000 })).toBe("150 000 Ft");
    expect(szovegezo("en", PROBA).sz("osszeg", { osszeg: 150000 })).toBe("HUF 150,000");
  });

  it("nem tesz be nem törő szóközt, hogy a másolás se törjön el", () => {
    expect(szovegezo("hu", PROBA).sz("osszeg", { osszeg: 150000 })).not.toMatch(/[  ]/);
  });

  it("üzenetet is behelyettesít, így a mondat darabokból állhat össze", () => {
    const eredmeny = szovegezo("en", PROBA).sz("keret", { belso: uzenet("egyszeru") });
    expect(eredmeny).toBe("[Done]");
  });

  it("ismeretlen kulcsnál a kulcsot adja vissza, hogy látszódjon a hiány", () => {
    expect(szovegezo("hu", PROBA).sz("nincs.ilyen")).toBe("nincs.ilyen");
  });

  it("a hiányzó behelyettesítést érintetlenül hagyja", () => {
    expect(szovegezo("hu", PROBA).sz("koszones")).toBe("Szia, {nev}");
  });
});

describe("szótár", () => {
  it("minden sorban van magyar és angol szöveg", () => {
    for (const [kulcs, sor] of Object.entries(SZOTAR)) {
      for (const nyelv of NYELVEK) {
        expect(sor[nyelv], `${kulcs}/${nyelv}`).toBeTruthy();
      }
    }
  });

  it("a behelyettesítendő nevek mindkét nyelven ugyanazok", () => {
    const nevek = (minta: string) => (minta.match(/\{(\w+)\}/g) ?? []).sort();
    for (const [kulcs, sor] of Object.entries(SZOTAR)) {
      expect(nevek(sor.en), kulcs).toEqual(nevek(sor.hu));
    }
  });
});

describe("a domain kulcsai megvannak a szótárban", () => {
  const { sz, u } = szovegekNyelvvel("en");
  const megvan = (ertek: { kulcs: string }) => expect(u(ertek), ertek.kulcs).not.toBe(ertek.kulcs);

  it("hibabejelentés feliratai", () => {
    TERULETEK.forEach((terulet) => megvan(teruletNeve(terulet)));
    OKOK.forEach((ok) => megvan(okNeve(ok)));
    SURGOSSEGEK.forEach((fokozat) => {
      megvan(surgossegNeve(fokozat));
      megvan(surgossegLeirasa(fokozat));
    });
    VESZELYHELYZETI_TEENDOK.forEach(megvan);
  });

  it("hibaállapotok, lépések és költségviselők", () => {
    const allapotok: HibaAllapot[] = [
      "bejelentve",
      "atvette",
      "folyamatban",
      "elharitva",
      "lezarva",
      "elutasitva",
    ];
    allapotok.forEach((allapot) => {
      megvan(allapotNeve(allapot));
      megvan(lepesCimke(allapot));
    });

    const felek: ViseloFel[] = ["berbeado", "berlo", "megosztott"];
    felek.forEach((fel) => megvan(viseloNeve(fel)));
  });

  it("költségviselő-javaslatok minden kombinációra", () => {
    for (const terulet of TERULETEK) {
      for (const ok of OKOK) {
        megvan(koltsegJavaslat(terulet, ok).indoklas);
      }
    }
  });

  it("betekintő mondatai és állapotai", () => {
    const tetel = (idoszak: string, reszlet: Partial<BetekintoTetel> = {}): BetekintoTetel => ({
      idoszak,
      allapot: "egyezik",
      keses: 0,
      eloirtFt: 180000,
      erkezettFt: 180000,
      ...reszlet,
    });

    // Minden mondat előfordul: a hibátlan előzmény kevesebb sort ad, mint a
    // döcögős, ezért mindkettőt végigjárjuk.
    mondatok(osszesit([])).forEach(megvan);
    mondatok(osszesit([tetel("2026-08"), tetel("2026-09")])).forEach(megvan);
    mondatok(
      osszesit([
        tetel("2026-06", { keses: 11 }),
        tetel("2026-07", { allapot: "hianyzik", erkezettFt: 0 }),
        tetel("2026-08", { allapot: "elter", erkezettFt: 120000 }),
        tetel("2026-09"),
      ]),
    ).forEach(megvan);

    const allapotok: BetekintoAllapot[] = ["elo", "lejart", "visszavonva"];
    allapotok.forEach((allapot) => megvan(betekintoAllapotNeve(allapot)));

    // A havi sorok címkéi is a szótáron mennek át, mind a négy ág.
    megvan(haviAllapotNeve(tetel("2026-09")));
    megvan(haviAllapotNeve(tetel("2026-09", { keses: 3 })));
    megvan(haviAllapotNeve(tetel("2026-09", { allapot: "elter", erkezettFt: 1 })));
    megvan(haviAllapotNeve(tetel("2026-09", { allapot: "hianyzik", erkezettFt: 0 })));
  });

  it("dokumentumfajták és elszámolásállapotok", () => {
    const fajtak: DokumentumFajta[] = ["szerzodes", "jegyzokonyv", "igazolas", "elszamolas"];
    fajtak.forEach((fajta) => megvan(fajtaCimke(fajta)));

    for (const allapot of ["tervezet", "kiadva", "elfogadva", "vitatott"]) {
      expect(sz(`dokumentum.elszamolas.allapot.${allapot}`)).not.toBe(
        `dokumentum.elszamolas.allapot.${allapot}`,
      );
    }
  });
});
