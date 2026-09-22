/**
 * A szolgáltatói látogatás.
 *
 * Amit itt megfogni érdemes: a bejutás kérdése akkor dőlt el, ha **mindenki**
 * nyilatkozott, akitől várunk, és egy kifogás egymagában is dönt. A
 * legveszélyesebb hiba az lenne, ha a rendszer azt mondaná, „rendben, bejut a
 * szerelő", holott az egyik lakótárs még nem is válaszolt.
 */

import { describe, expect, it } from "vitest";
import {
  allapot,
  allapotMondata,
  bejelentestEllenoriz,
  hianyzoValaszolok,
  idoablak,
  latogatasokatRendez,
  latogatasokbolTeendok,
  lemondhatja,
  type Latogatas,
  type Valasz,
} from "../latogatas";

const MA = new Date(Date.UTC(2026, 8, 22));
const HOLNAP = new Date(Date.UTC(2026, 8, 23));
const TEGNAP = new Date(Date.UTC(2026, 8, 21));

function latogatas(modositas: Partial<Latogatas> = {}): Latogatas {
  return {
    id: "l1",
    jogviszonyId: "j1",
    bejelentoId: "berbeado",
    fajta: "kemenysepro",
    megnevezes: "Kemenysepro",
    szolgaltato: null,
    nap: HOLNAP,
    idoablakTol: null,
    idoablakIg: null,
    lemondva: null,
    varhatoValaszolok: [{ id: "b1", nev: "Anna" }],
    valaszok: [],
    ...modositas,
  };
}

function valasz(berloId: string, ertek: Valasz, berloNeve = berloId) {
  return { berloId, berloNeve, valasz: ertek, indoklas: null };
}

describe("a látogatás állapota", () => {
  it("nyilatkozat nélkül a bérlőre vár", () => {
    expect(allapot(latogatas(), MA)).toBe("varakozik");
  });

  it("ha lesz otthon valaki, a bejutás nem kérdés", () => {
    expect(
      allapot(latogatas({ valaszok: [valasz("b1", "itthon_leszek")] }), MA),
    ).toBe("itthon_lesz");
  });

  it("ha senki nem lesz otthon, de hozzájárultak, kulccsal megy", () => {
    expect(
      allapot(
        latogatas({ valaszok: [valasz("b1", "kulccsal_beengedheto")] }),
        MA,
      ),
    ).toBe("kulccsal");
  });

  it("egy kifogás egymagában is dönt, akkor is, ha a másik rábólintott", () => {
    const kettoBerlo = latogatas({
      varhatoValaszolok: [
        { id: "b1", nev: "Anna" },
        { id: "b2", nev: "Tamas" },
      ],
      valaszok: [valasz("b1", "itthon_leszek"), valasz("b2", "nem_jo_idopont")],
    });
    expect(allapot(kettoBerlo, MA)).toBe("idopont_gond");
  });

  it("amíg a lakótárs nem nyilatkozott, nem mondjuk, hogy eldőlt", () => {
    const kettoBerlo = latogatas({
      varhatoValaszolok: [
        { id: "b1", nev: "Anna" },
        { id: "b2", nev: "Tamas" },
      ],
      valaszok: [valasz("b1", "kulccsal_beengedheto")],
    });
    expect(allapot(kettoBerlo, MA)).toBe("varakozik");
    expect(hianyzoValaszolok(kettoBerlo).map((sor) => sor.nev)).toEqual([
      "Tamas",
    ]);
  });

  it("fiók nélküli bérlőre nem várunk: őt nem lehet megkérdezni", () => {
    // A varhatoValaszolok csak azokat tartalmazza, akinek van fiókja. Ha a
    // lakótárs nincs benne, a látogatás egy nyilatkozattól eldől.
    const egyFiok = latogatas({ valaszok: [valasz("b1", "itthon_leszek")] });
    expect(allapot(egyFiok, MA)).toBe("itthon_lesz");
  });

  it("a lemondás és az elmúlt nap mindent felülír", () => {
    expect(
      allapot(
        latogatas({ lemondva: MA, valaszok: [valasz("b1", "nem_jo_idopont")] }),
        MA,
      ),
    ).toBe("lemondva");
    expect(allapot(latogatas({ nap: TEGNAP }), MA)).toBe("elmult");
  });

  it("a mai nap még nem múlt el", () => {
    expect(allapot(latogatas({ nap: MA }), MA)).toBe("varakozik");
  });
});

describe("a látogatás mondata", () => {
  it("megnevezi, kire várunk", () => {
    const uzenet = allapotMondata(latogatas(), MA);
    expect(uzenet.kulcs).toBe("latogatas.allapot.varakozik");
    expect(uzenet.adatok?.nev).toBe("Anna");
  });

  it("megnevezi, ki kifogásolta az időpontot", () => {
    const uzenet = allapotMondata(
      latogatas({ valaszok: [valasz("b1", "nem_jo_idopont", "Anna")] }),
      MA,
    );
    expect(uzenet.kulcs).toBe("latogatas.allapot.idopont_gond");
    expect(uzenet.adatok?.nev).toBe("Anna");
  });

  it("megnevezi, ki lesz otthon", () => {
    const uzenet = allapotMondata(
      latogatas({ valaszok: [valasz("b1", "itthon_leszek", "Anna")] }),
      MA,
    );
    expect(uzenet.adatok?.nev).toBe("Anna");
  });
});

describe("időablak", () => {
  it("a megadott alakot adja vissza, nem formázza át", () => {
    const uzenet = idoablak(
      latogatas({ idoablakTol: "9:00", idoablakIg: "11:00" }),
    );
    expect(uzenet?.adatok).toEqual({ tol: "9:00", ig: "11:00" });
  });

  it("időablak nélkül nem talál ki egyet", () => {
    expect(idoablak(latogatas())).toBeNull();
  });
});

describe("teendők a látogatásból", () => {
  it("a bérlő a saját nyilatkozatáról kap teendőt", () => {
    const teendok = latogatasokbolTeendok([latogatas()], MA, "b1");
    const berloi = teendok.filter((sor) => sor.cimzett === "berlo");
    expect(berloi).toHaveLength(1);
    expect(berloi[0].kulcs).toContain("b1");
  });

  it("a lakótárs elmaradt nyilatkozatáról a bérlő nem kap teendőt", () => {
    const kettoBerlo = latogatas({
      varhatoValaszolok: [
        { id: "b1", nev: "Anna" },
        { id: "b2", nev: "Tamas" },
      ],
      valaszok: [valasz("b1", "itthon_leszek")],
    });
    const teendok = latogatasokbolTeendok([kettoBerlo], MA, "b1");
    expect(teendok.filter((sor) => sor.cimzett === "berlo")).toEqual([]);
    expect(teendok.filter((sor) => sor.cimzett === "berbeado")).toHaveLength(1);
  });

  it("kifogásnál a bérbeadónak új időpontot kell keresnie", () => {
    const teendok = latogatasokbolTeendok(
      [latogatas({ valaszok: [valasz("b1", "nem_jo_idopont")] })],
      MA,
      "b1",
    );
    expect(teendok).toHaveLength(1);
    expect(teendok[0].tipus).toBe("latogatas_idopont");
  });

  it("az eldőlt látogatásból nincs teendő", () => {
    expect(
      latogatasokbolTeendok(
        [latogatas({ valaszok: [valasz("b1", "itthon_leszek")] })],
        MA,
        "b1",
      ),
    ).toEqual([]);
  });

  it("a lemondott és az elmúlt látogatásból sincs", () => {
    expect(
      latogatasokbolTeendok([latogatas({ lemondva: MA })], MA, "b1"),
    ).toEqual([]);
    expect(
      latogatasokbolTeendok([latogatas({ nap: TEGNAP })], MA, "b1"),
    ).toEqual([]);
  });

  it("a teendő a látogatás napjára esedékes", () => {
    const teendok = latogatasokbolTeendok([latogatas()], MA, "b1");
    expect(teendok[0].esedekesseg.getTime()).toBe(HOLNAP.getTime());
  });
});

describe("a bejelentés ellenőrzése", () => {
  it("megnevezés és nap nélkül nem menthető", () => {
    const kifogasok = bejelentestEllenoriz({
      megnevezes: "  ",
      nap: null,
      idoablakTol: "",
      idoablakIg: "",
    });
    expect(kifogasok.map((sor) => sor.mezo)).toEqual(["megnevezes", "nap"]);
  });

  it("időablak nélkül is elmenthető: sok szolgáltató nem ad meg egyet", () => {
    expect(
      bejelentestEllenoriz({
        megnevezes: "Kemenysepro",
        nap: HOLNAP,
        idoablakTol: "",
        idoablakIg: "",
      }),
    ).toEqual([]);
  });

  it("az értelmetlen órát elutasítja", () => {
    const kifogasok = bejelentestEllenoriz({
      megnevezes: "Kemenysepro",
      nap: HOLNAP,
      idoablakTol: "reggel",
      idoablakIg: "",
    });
    expect(kifogasok.map((sor) => sor.mezo)).toEqual(["idoablakTol"]);
  });

  it("a visszafelé menő időablakot elutasítja", () => {
    const kifogasok = bejelentestEllenoriz({
      megnevezes: "Kemenysepro",
      nap: HOLNAP,
      idoablakTol: "11:00",
      idoablakIg: "9:00",
    });
    expect(kifogasok.map((sor) => sor.mezo)).toEqual(["idoablakIg"]);
  });
});

describe("rendezés", () => {
  it("ami előbb jön, elöl van; a lemondott és az elmúlt hátul", () => {
    const sorok = latogatasokatRendez(
      [
        latogatas({ id: "elmult", nap: TEGNAP }),
        latogatas({ id: "kesobbi", nap: new Date(Date.UTC(2026, 8, 30)) }),
        latogatas({ id: "holnap", nap: HOLNAP }),
        latogatas({ id: "lemondott", nap: HOLNAP, lemondva: MA }),
      ],
      MA,
    );
    expect(sorok.map((sor) => sor.id)).toEqual([
      "holnap",
      "kesobbi",
      "elmult",
      "lemondott",
    ]);
  });
});

describe("a lemondás joga", () => {
  it("a bejelentő lemondhatja", () => {
    expect(
      lemondhatja(latogatas({ bejelentoId: "berbeado" }), "berbeado"),
    ).toBe(true);
  });

  it("a bérlő nem mondhatja le, amit a bérbeadó jelentett be", () => {
    // A szerelő attól még jön: a bérlőnek a „nem jó időpont" válasz való, és
    // abból a bérbeadó tudja, hogy egyeztetni kell.
    expect(lemondhatja(latogatas({ bejelentoId: "berbeado" }), "berlo")).toBe(
      false,
    );
  });

  it("a bérbeadó sem mondhatja le, amit a bérlő jelentett be", () => {
    expect(lemondhatja(latogatas({ bejelentoId: "berlo" }), "berbeado")).toBe(
      false,
    );
  });

  it("a már lemondottat nem lehet másodszor is lemondani", () => {
    expect(
      lemondhatja(
        latogatas({ bejelentoId: "berbeado", lemondva: TEGNAP }),
        "berbeado",
      ),
    ).toBe(false);
  });
});
