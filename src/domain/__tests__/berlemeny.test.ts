import { describe, expect, it } from "vitest";
import {
  FIZETESI_NAP_MAX,
  REZSI_MODOK,
  ingatlanFigyelmeztetesei,
  ingatlantEllenoriz,
  jogviszonyFigyelmeztetesei,
  jogviszonytEllenoriz,
  dijValtozastEllenoriz,
  honapKulcsa,
  visszamenolegesHonapok,
  type DijValtozasBemenet,
  type IngatlanBemenet,
  type JogviszonyBemenet,
} from "../berlemeny";

const INGATLAN: IngatlanBemenet = {
  megnevezes: "Ferencvárosi garzon",
  cim: "1094 Budapest, Minta utca 3. 2/4",
  alapteruletM2: 38,
  helyrajziSzam: "37123/0/A/12",
  energetikaiAzonosito: "HET-2024-000123",
  kozosKoltsegFt: 14000,
  beszerzesiArFt: 42000000,
  beszerzesDatuma: new Date(Date.UTC(2021, 4, 12)),
};

const JOGVISZONY: JogviszonyBemenet = {
  kezdete: new Date(Date.UTC(2026, 8, 1)),
  berletiDijFt: 180000,
  kozosKoltsegFt: 14000,
  kaucioFt: 360000,
  fizetesiNap: 5,
  rezsiElszamolas: "almero",
  rezsiAtalanyFt: 0,
  berloNeve: "Kovács Anna",
};

const mezok = (kifogasok: { mezo: string }[]) => kifogasok.map((k) => k.mezo);

describe("bérlemény ellenőrzése", () => {
  it("a teljes adatlapot elfogadja", () => {
    expect(ingatlantEllenoriz(INGATLAN)).toEqual([]);
  });

  it("név és cím nélkül nem megy", () => {
    expect(mezok(ingatlantEllenoriz({ ...INGATLAN, megnevezes: "  ", cim: "" }))).toEqual([
      "megnevezes",
      "cim",
    ]);
  });

  it("a nulla alapterület nem alapterület", () => {
    expect(mezok(ingatlantEllenoriz({ ...INGATLAN, alapteruletM2: 0 }))).toEqual([
      "alapteruletM2",
    ]);
  });

  it("a hiányzó alapterület viszont rendben van: nem minden bérbeadó tudja fejből", () => {
    expect(ingatlantEllenoriz({ ...INGATLAN, alapteruletM2: null })).toEqual([]);
  });

  it("negatív összeget nem fogadunk el", () => {
    expect(mezok(ingatlantEllenoriz({ ...INGATLAN, kozosKoltsegFt: -1 }))).toEqual([
      "kozosKoltsegFt",
    ]);
    expect(mezok(ingatlantEllenoriz({ ...INGATLAN, beszerzesiArFt: -1 }))).toEqual([
      "beszerzesiArFt",
    ]);
  });
});

describe("bérlemény figyelmeztetései", () => {
  it("a teljes adatlapra nincs mit mondani", () => {
    expect(ingatlanFigyelmeztetesei(INGATLAN)).toEqual([]);
  });

  it("a szokatlan címalakra szól, mert a betekintőn nem lesz település", () => {
    const kulcsok = ingatlanFigyelmeztetesei({
      ...INGATLAN,
      cim: "a nagy sárga ház a sarkon",
    }).map((sor) => sor.kulcs);
    expect(kulcsok).toContain("berlemeny.figyelem.cim_alak");
  });

  it("a hiányzó helyrajzi szám figyelmeztetés, nem hiba: el lehet indulni nélküle", () => {
    const bemenet = { ...INGATLAN, helyrajziSzam: null };
    expect(ingatlantEllenoriz(bemenet)).toEqual([]);
    expect(ingatlanFigyelmeztetesei(bemenet).map((sor) => sor.kulcs)).toContain(
      "berlemeny.figyelem.helyrajzi",
    );
  });

  it("a fél beszerzési adat ugyanúgy szól, mint az egyáltalán nem megadott", () => {
    // Értékcsökkenéshez mindkettő kell; egyik önmagában semmire nem jó.
    const csakAr = ingatlanFigyelmeztetesei({ ...INGATLAN, beszerzesDatuma: null });
    const csakNap = ingatlanFigyelmeztetesei({ ...INGATLAN, beszerzesiArFt: null });
    expect(csakAr.map((sor) => sor.kulcs)).toContain("berlemeny.figyelem.beszerzes");
    expect(csakNap.map((sor) => sor.kulcs)).toContain("berlemeny.figyelem.beszerzes");
  });
});

describe("jogviszony ellenőrzése", () => {
  it("a szokásos jogviszonyt elfogadja", () => {
    expect(jogviszonytEllenoriz(JOGVISZONY)).toEqual([]);
  });

  it("kezdet, díj és bérlő nélkül nem megy", () => {
    const kifogasok = jogviszonytEllenoriz({
      ...JOGVISZONY,
      kezdete: null,
      berletiDijFt: null,
      berloNeve: "",
    });
    expect(mezok(kifogasok)).toEqual(["kezdete", "berletiDijFt", "berloNeve"]);
  });

  it("a nulla bérleti díj nem bérleti díj", () => {
    expect(mezok(jogviszonytEllenoriz({ ...JOGVISZONY, berletiDijFt: 0 }))).toEqual([
      "berletiDijFt",
    ]);
  });

  it("a hónap végi fizetési nap nem engedett: februárban elcsúszna", () => {
    expect(mezok(jogviszonytEllenoriz({ ...JOGVISZONY, fizetesiNap: 31 }))).toEqual([
      "fizetesiNap",
    ]);
    expect(mezok(jogviszonytEllenoriz({ ...JOGVISZONY, fizetesiNap: 0 }))).toEqual([
      "fizetesiNap",
    ]);
    expect(jogviszonytEllenoriz({ ...JOGVISZONY, fizetesiNap: FIZETESI_NAP_MAX })).toEqual([]);
  });

  it("csak a három ismert rezsimód megy", () => {
    for (const mod of REZSI_MODOK) {
      const atalany = mod === "atalany" ? 25000 : 0;
      expect(
        jogviszonytEllenoriz({ ...JOGVISZONY, rezsiElszamolas: mod, rezsiAtalanyFt: atalany }),
      ).toEqual([]);
    }
    expect(mezok(jogviszonytEllenoriz({ ...JOGVISZONY, rezsiElszamolas: "valami" }))).toEqual([
      "rezsiElszamolas",
    ]);
  });

  it("a nulla forintos átalány elutasított", () => {
    // Különben minden hónapra nulla forintot írnánk elő, és a bérlő azt hinné,
    // nincs rezsije.
    expect(
      mezok(
        jogviszonytEllenoriz({
          ...JOGVISZONY,
          rezsiElszamolas: "atalany",
          rezsiAtalanyFt: 0,
        }),
      ),
    ).toEqual(["rezsiAtalanyFt"]);
  });
});

describe("visszamenőleges hónapok", () => {
  const ma = new Date(Date.UTC(2026, 8, 21));

  it("az e havi kezdet egy hónap", () => {
    expect(visszamenolegesHonapok(new Date(Date.UTC(2026, 8, 1)), ma)).toBe(1);
  });

  it("az egy éve kezdődő jogviszony tizenhárom hónap", () => {
    expect(visszamenolegesHonapok(new Date(Date.UTC(2025, 8, 1)), ma)).toBe(13);
  });

  it("évhatáron át is jól számol", () => {
    expect(visszamenolegesHonapok(new Date(Date.UTC(2025, 11, 1)), ma)).toBe(10);
  });
});

describe("jogviszony figyelmeztetései", () => {
  const ma = new Date(Date.UTC(2026, 8, 21));

  it("az e hónapban induló jogviszonyra nincs mit mondani", () => {
    expect(jogviszonyFigyelmeztetesei(JOGVISZONY, ma)).toEqual([]);
  });

  it("a visszamenőleges kezdetnél megmondjuk, hány hónap születik", () => {
    const sorok = jogviszonyFigyelmeztetesei(
      { ...JOGVISZONY, kezdete: new Date(Date.UTC(2025, 8, 1)) },
      ma,
    );
    expect(sorok).toEqual([
      { kulcs: "jogviszony.figyelem.visszamenoleg", adatok: { honapok: 13 } },
    ]);
  });

  it("a jövőbeli kezdetnél azt mondjuk meg, hogy egyelőre nem lesz semmi", () => {
    const sorok = jogviszonyFigyelmeztetesei(
      { ...JOGVISZONY, kezdete: new Date(Date.UTC(2026, 10, 1)) },
      ma,
    );
    expect(sorok.map((sor) => sor.kulcs)).toEqual(["jogviszony.figyelem.jovobeli"]);
  });
});

describe("elgépelt összeg", () => {
  // Az `urlapForint` `NaN`-t ad arra, amit nem tud számként olvasni, és `NaN`-ra
  // minden összehasonlítás hamis: enélkül a „180 e" átcsúszott az ellenőrzésen,
  // és az `Int` oszlopon 500-as lap lett belőle.
  it("a bérleti díj helyén nem megy át a szám nélküli mező", () => {
    const kifogasok = jogviszonytEllenoriz({ ...JOGVISZONY, berletiDijFt: Number.NaN });
    expect(kifogasok.map((kifogas) => kifogas.mezo)).toContain("berletiDijFt");
  });

  it("a közös költség és az óvadék helyén sem", () => {
    expect(
      jogviszonytEllenoriz({ ...JOGVISZONY, kozosKoltsegFt: Number.NaN }).map((k) => k.mezo),
    ).toContain("kozosKoltsegFt");
    expect(
      jogviszonytEllenoriz({ ...JOGVISZONY, kaucioFt: Number.NaN }).map((k) => k.mezo),
    ).toContain("kaucioFt");
  });

  it("az átalány helyén sem, átalányos elszámolásnál", () => {
    const kifogasok = jogviszonytEllenoriz({
      ...JOGVISZONY,
      rezsiElszamolas: "atalany",
      rezsiAtalanyFt: Number.NaN,
    });
    expect(kifogasok.map((kifogas) => kifogas.mezo)).toContain("rezsiAtalanyFt");
  });

  it("a bérlemény adatlapján sem", () => {
    expect(
      ingatlantEllenoriz({ ...INGATLAN, kozosKoltsegFt: Number.NaN }).map((k) => k.mezo),
    ).toContain("kozosKoltsegFt");
    expect(
      ingatlantEllenoriz({ ...INGATLAN, beszerzesiArFt: Number.NaN }).map((k) => k.mezo),
    ).toContain("beszerzesiArFt");
    expect(
      ingatlantEllenoriz({ ...INGATLAN, alapteruletM2: Number.NaN }).map((k) => k.mezo),
    ).toContain("alapteruletM2");
  });
});

describe("honapKulcsa", () => {
  it("a hónap kulcsa mindig kétjegyű", () => {
    expect(honapKulcsa(new Date(Date.UTC(2026, 8, 30)))).toBe("2026-09");
    expect(honapKulcsa(new Date(Date.UTC(2026, 11, 1)))).toBe("2026-12");
  });
});

describe("díjemelés", () => {
  const DIJ: DijValtozasBemenet = {
    ervenyesTol: new Date(Date.UTC(2026, 9, 1)),
    berletiDijFt: 195000,
    kozosKoltsegFt: 14000,
    rezsiAtalanyFt: 0,
    rezsiElszamolas: "almero",
    kezdete: new Date(Date.UTC(2026, 0, 1)),
    utolsoEloirtHonap: "2026-09",
  };

  it("a következő, még elő nem írt hónapot elfogadja", () => {
    expect(dijValtozastEllenoriz(DIJ)).toEqual([]);
  });

  it("már előírt hónapra nem enged emelni", () => {
    // Amire egyszer egyeztettek, azt nem írjuk át: a szeptemberre beírt emelés
    // szótlanul nem csinálna semmit, mert meglévő előírást nem módosítunk.
    const kifogasok = dijValtozastEllenoriz({
      ...DIJ,
      ervenyesTol: new Date(Date.UTC(2026, 8, 1)),
    });
    expect(kifogasok.map((kifogas) => kifogas.uzenet.kulcs)).toEqual([
      "dijvaltozas.hiba.mar_eloirtuk",
    ]);
  });

  it("a bérlet kezdete előtti hónapra sem", () => {
    const kifogasok = dijValtozastEllenoriz({
      ...DIJ,
      kezdete: new Date(Date.UTC(2026, 9, 1)),
      ervenyesTol: new Date(Date.UTC(2026, 8, 1)),
      utolsoEloirtHonap: null,
    });
    expect(kifogasok.map((kifogas) => kifogas.uzenet.kulcs)).toEqual([
      "dijvaltozas.hiba.kezdet_elott",
    ]);
  });

  it("előírás nélküli jogviszonynál a kezdet hónapjától lehet", () => {
    expect(
      dijValtozastEllenoriz({
        ...DIJ,
        ervenyesTol: new Date(Date.UTC(2026, 0, 1)),
        utolsoEloirtHonap: null,
      }),
    ).toEqual([]);
  });

  it("hónap nélkül, nulla díjjal és elgépelt összeggel nem megy át", () => {
    expect(
      dijValtozastEllenoriz({ ...DIJ, ervenyesTol: null }).map((k) => k.uzenet.kulcs),
    ).toContain("dijvaltozas.hiba.honap");
    expect(
      dijValtozastEllenoriz({ ...DIJ, berletiDijFt: 0 }).map((k) => k.mezo),
    ).toContain("berletiDijFt");
    expect(
      dijValtozastEllenoriz({ ...DIJ, berletiDijFt: Number.NaN }).map((k) => k.mezo),
    ).toContain("berletiDijFt");
    expect(
      dijValtozastEllenoriz({ ...DIJ, kozosKoltsegFt: Number.NaN }).map((k) => k.mezo),
    ).toContain("kozosKoltsegFt");
  });

  it("átalányos jogviszonynál az átalány sem maradhat nullán", () => {
    const kifogasok = dijValtozastEllenoriz({
      ...DIJ,
      rezsiElszamolas: "atalany",
      rezsiAtalanyFt: 0,
    });
    expect(kifogasok.map((kifogas) => kifogas.mezo)).toEqual(["rezsiAtalanyFt"]);
  });
});
