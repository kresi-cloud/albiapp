import { describe, expect, it } from "vitest";
import {
  ABLAK_NAP,
  SZEMPONTOK,
  ablakKezdete,
  ablakNyitva,
  allapota,
  ellenoriz,
  ertekelesTeendoi,
  felfedve,
  hatralevoNap,
  irhato,
  nezet,
  parosaEnnek,
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
    pontok: SZEMPONTOK[
      szerzoId === "berbeado" ? "berlorol" : "berbeadorol"
    ].map((szempont) => ({ szempont, pont: 4 })),
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
    const paros: Paros = {
      sajat: ertekeles("berbeado", "berlo"),
      masike: null,
    };
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
    const csakMasike: Paros = {
      sajat: null,
      masike: ertekeles("berlo", "berbeado"),
    };
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
    const paros: Paros = {
      sajat: null,
      masike: ertekeles("berlo", "berbeado"),
    };
    expect(allapota(paros, VEGE, nappal(ABLAK_NAP + 1))).toBe("lathato");
    expect(nezet(paros, VEGE, nappal(ABLAK_NAP + 1)).masike).not.toBeNull();
  });

  it("ha egyik fél sem írt, az ablak letelte után sincs mit mutatni", () => {
    expect(allapota(URES, VEGE, nappal(ABLAK_NAP + 1))).toBe("elmaradt");
  });
});

describe("a módosíthatóság", () => {
  it("felfedésig a saját értékelés módosítható", () => {
    const paros: Paros = {
      sajat: ertekeles("berbeado", "berlo"),
      masike: null,
    };
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
    expect(ellenoriz({ ...jo, pontok: jo.pontok.slice(1) })).toContain(
      "hianyzo_szempont",
    );
  });

  it("a másik irány szempontja ide nem való", () => {
    expect(
      ellenoriz({
        ...jo,
        pontok: [...jo.pontok, { szempont: "elszamolas", pont: 3 }],
      }),
    ).toContain("ismeretlen_szempont");
  });

  it("a tartományon kívüli pont nem megy át", () => {
    expect(
      ellenoriz({
        ...jo,
        pontok: jo.pontok.map((sor) => ({ ...sor, pont: 6 })),
      }),
    ).toContain("tartomanyon_kivul");
    expect(
      ellenoriz({
        ...jo,
        pontok: jo.pontok.map((sor) => ({ ...sor, pont: 0 })),
      }),
    ).toContain("tartomanyon_kivul");
    expect(
      ellenoriz({
        ...jo,
        pontok: jo.pontok.map((sor) => ({ ...sor, pont: 4.5 })),
      }),
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
    expect(allapotMondata("varakozik").kulcs).toBe(
      "ertekeles.allapot.varakozik",
    );
  });
});

describe("az ablak kezdete", () => {
  const KESOBB = new Date(Date.UTC(2026, 7, 15));

  it("a kiköltözés napjától számít, ha a lezárás akkor került be", () => {
    expect(ablakKezdete(VEGE, VEGE)?.getTime()).toBe(VEGE.getTime());
    expect(ablakKezdete(VEGE, null)?.getTime()).toBe(VEGE.getTime());
  });

  it("utólag rögzített lezárásnál a rögzítés napjától", () => {
    // A bérlő addig nem is látta, hogy a bérlet lezárult: harminc napja
    // innentől van, nem a kiköltözéstől.
    expect(ablakKezdete(VEGE, KESOBB)?.getTime()).toBe(KESOBB.getTime());
  });

  it("előre rögzített lezárásnál marad a kiköltözés napja", () => {
    const korabban = new Date(VEGE.getTime() - 5 * 86400000);
    expect(ablakKezdete(VEGE, korabban)?.getTime()).toBe(VEGE.getTime());
  });

  it("futó jogviszonynál nincs kezdet", () => {
    expect(ablakKezdete(null, KESOBB)).toBeNull();
  });

  it("a visszakeltezett lezárás nem fedi fel a másik fél szövegét", () => {
    // Ez a támadás: a bérbeadó a véget hatvan nappal visszakelteztetné, hogy
    // az ablak lejártnak látsszon, és a bérlő addig rejtett szövegét úgy
    // olvassa el, hogy ő maga nem írt semmit.
    const paros: Paros = { sajat: null, masike: ertekeles("berlo", "berbeado") };
    const visszakeltezett = new Date(Date.UTC(2026, 3, 1));
    const rogzitve = new Date(Date.UTC(2026, 5, 30));
    const ma = new Date(Date.UTC(2026, 6, 5));

    expect(felfedve(paros, visszakeltezett, ma)).toBe(true);
    expect(felfedve(paros, ablakKezdete(visszakeltezett, rogzitve), ma)).toBe(false);
  });
});

describe("az értékelés teendője", () => {
  const alap = {
    jogviszonyId: "jv1",
    masikFelId: "berlo",
    cimke: "Ferencvárosi garzon",
  };

  it("amíg nincs megírva és nyitva az ablak, teendő van belőle", () => {
    const teendok = ertekelesTeendoi(
      [{ ...alap, kezdet: VEGE, paros: URES }],
      "berbeado",
      nappal(2),
    );
    expect(teendok).toHaveLength(1);
    expect(teendok[0].kulcs).toBe("ertekeles:jv1:berlo");
    expect(teendok[0].hivatkozas).toBe("/ertekelesek");
  });

  it("a megírt értékelés után eltűnik", () => {
    const paros: Paros = {
      sajat: ertekeles("berbeado", "berlo"),
      masike: null,
    };
    expect(
      ertekelesTeendoi([{ ...alap, kezdet: VEGE, paros }], "berbeado", nappal(2)),
    ).toEqual([]);
  });

  it("a futó jogviszonyból nincs teendő", () => {
    expect(
      ertekelesTeendoi(
        [{ ...alap, kezdet: null, paros: URES }],
        "berbeado",
        nappal(2),
      ),
    ).toEqual([]);
  });

  it("az ablak letelte után sincs", () => {
    expect(
      ertekelesTeendoi(
        [{ ...alap, kezdet: VEGE, paros: URES }],
        "berbeado",
        nappal(ABLAK_NAP + 1),
      ),
    ).toEqual([]);
  });

  it("az esedékesség az ablak utolsó napja, nem a lezárás napja", () => {
    const teendok = ertekelesTeendoi(
      [{ ...alap, kezdet: VEGE, paros: URES }],
      "berlo",
      nappal(2),
    );
    expect(teendok[0].esedekesseg.getTime()).toBe(nappal(ABLAK_NAP).getTime());
  });
});

describe("a páros összeállítása", () => {
  const ma = new Date("2026-09-22T00:00:00Z");
  const vege = new Date("2026-09-12T00:00:00Z");

  function sor(
    szerzoId: string,
    alanyId: string,
    szoveg: string,
  ): ErtekelesAdat {
    return {
      szerzoId,
      alanyId,
      irany: szerzoId === "berbeado" ? "berlorol" : "berbeadorol",
      szoveg,
      pontok: [],
      letrehozva: new Date("2026-09-15T00:00:00Z"),
    };
  }

  it("a szerző és az alany együtt azonosít, nem a szerző egymagában", () => {
    // Két fiókos lakótárs egy jogviszonyon: a bérbeadó mindkettőről írt.
    const sorok = [
      sor("berbeado", "anna", "Anna mindig időben fizetett."),
      sor("berbeado", "panna", "Pannával nehéz volt egyeztetni."),
    ];

    const annae = parosaEnnek(sorok, "anna", "berbeado");
    expect(annae.masike?.szoveg).toBe("Anna mindig időben fizetett.");

    const pannae = parosaEnnek(sorok, "panna", "berbeado");
    expect(pannae.masike?.szoveg).toBe("Pannával nehéz volt egyeztetni.");
  });

  it("a lakótársról szóló értékelés nem zárja le a másik űrlapját", () => {
    // A hiba ez volt: csak a szerzőre szűrve Anna párosa késznek látszott a
    // Pannáról szóló értékeléstől, és Anna nem tudott írni.
    const sorok = [sor("berbeado", "panna", "Pannáról szól, nem Annáról.")];
    const annae = parosaEnnek(sorok, "anna", "berbeado");

    expect(annae.sajat).toBeNull();
    expect(annae.masike).toBeNull();
    expect(irhato(annae, vege, ma)).toBe(true);
    expect(felfedve(annae, vege, ma)).toBe(false);
  });

  it("a saját értékelés is a másik félről szóló, nem akármelyik sajátom", () => {
    // A bérbeadó mindkét lakótársról írt: az „Annáról szóló" az ő párosa.
    const sorok = [
      sor("berbeado", "anna", "Annáról."),
      sor("berbeado", "panna", "Pannáról."),
    ];
    expect(parosaEnnek(sorok, "berbeado", "panna").sajat?.szoveg).toBe(
      "Pannáról.",
    );
  });

  it("fiók nélküli bérlőnél nincs páros", () => {
    const sorok = [sor("berbeado", "anna", "Annáról.")];
    expect(parosaEnnek(sorok, "berbeado", null)).toEqual({
      sajat: null,
      masike: null,
    });
  });

  it("teljes páros esetén mindkét oldal megvan", () => {
    const sorok = [
      sor("berbeado", "anna", "Annáról."),
      sor("anna", "berbeado", "A bérbeadóról."),
      sor("berbeado", "panna", "Pannáról."),
    ];
    const annae = parosaEnnek(sorok, "anna", "berbeado");
    expect(annae.sajat?.szoveg).toBe("A bérbeadóról.");
    expect(annae.masike?.szoveg).toBe("Annáról.");
    expect(felfedve(annae, vege, ma)).toBe(true);
  });
});
