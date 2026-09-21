/**
 * Példaadat a próbakörnyezethez. Egy bérbeadó, két lakás, három bérlő.
 *
 * Minden dátum a **mostani hónaphoz** igazodik, nem beégetett évszámokhoz.
 * Ez nem kozmetika: a havi előírások a jogviszonyból, a mai naphoz képest
 * generálódnak, tehát egy beégetett példaadat hónapról hónapra jobban
 * elcsúszik tőlük. Így állt elő az, hogy a betekintő szerint a bérlő
 * tizenhárom hónapból egyszer sem fizetett — pedig csak a példaadat
 * maradt le az előírások mögött.
 *
 * A történet: a két bérlő végigfizeti a jogviszonyát, néhány hónap csúszással,
 * a futó hónapban pedig szándékosan van egy vitás és egy elmaradt tétel, hogy
 * az egyeztetés összes állapota látszódjon.
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { jelszotHashel } from "../src/lib/jelszo";
import { meghivoLejarata } from "../src/domain/belepes";
import { meghivoToken } from "../src/lib/meghivo";
import { eloirasok, type JogviszonyAdat } from "../src/domain/eloirasok";

const url = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

// Próbajelszó a példafiókokhoz. Éles adatbázisba ez a seed nem fut.
const PROBA_JELSZO = "probajelszo2026";

const MOST = new Date();
const EV = MOST.getUTCFullYear();
const HONAP = MOST.getUTCMonth();

/** A mostanihoz képest `elteres` hónappal arrébb lévő hónap adott napja. */
function nap(elteres: number, napja = 1): Date {
  return new Date(Date.UTC(EV, HONAP + elteres, napja));
}

async function main() {
  const jelszoHash = await jelszotHashel(PROBA_JELSZO);

  await prisma.koltseg.deleteMany();
  await prisma.elszamolasTetel.deleteMany();
  await prisma.elszamolas.deleteMany();
  await prisma.dijszabas.deleteMany();
  await prisma.meghivo.deleteMany();
  await prisma.teendo.deleteMany();
  await prisma.berbeadoiIgazolas.deleteMany();
  await prisma.berloiIgazolas.deleteMany();
  await prisma.eloirtTetel.deleteMany();
  await prisma.jogviszony.deleteMany();
  await prisma.oraallas.deleteMany();
  await prisma.meroora.deleteMany();
  await prisma.ingatlan.deleteMany();
  await prisma.felhasznalo.deleteMany();

  const berbeado = await prisma.felhasznalo.create({
    data: {
      email: "berbeado@pelda.hu",
      nev: "Nagy Péter",
      jelszoHash,
      szerep: "berbeado",
    },
  });

  const berloAnna = await prisma.felhasznalo.create({
    data: {
      email: "anna@pelda.hu",
      nev: "Kovács Anna",
      jelszoHash,
      szerep: "berlo",
    },
  });

  // Tamásnak szándékosan nincs még fiókja: rajta próbálható ki a meghívó.

  const ferencvaros = await prisma.ingatlan.create({
    data: {
      tulajdonosId: berbeado.id,
      megnevezes: "Ferencvárosi garzon",
      cim: "1092 Budapest, Ráday utca 12. 2/3.",
      alapteruletM2: 38,
      helyrajziSzam: "38215/0/A/7",
      energetikaiAzonosito: "HET-00992417",
      kozosKoltsegFt: 14000,
      beszerzesiArFt: 58_000_000,
      beszerzesDatuma: new Date(Date.UTC(2021, 4, 12)),
      meroorak: {
        create: [
          { tipus: "villany", mertekegyseg: "kWh", gyariSzam: "E-884213", almero: false },
          { tipus: "viz", mertekegyseg: "m3", gyariSzam: "V-119043", almero: true },
        ],
      },
    },
  });

  const ujbuda = await prisma.ingatlan.create({
    data: {
      tulajdonosId: berbeado.id,
      megnevezes: "Újbudai kétszobás",
      cim: "1117 Budapest, Bogdánfy utca 4. 5/2.",
      alapteruletM2: 54,
      helyrajziSzam: "4188/2/A/12",
      energetikaiAzonosito: "HET-01044893",
      kozosKoltsegFt: 21000,
      meroorak: {
        create: [{ tipus: "villany", mertekegyseg: "kWh", gyariSzam: "E-552901", almero: false }],
      },
    },
  });

  // A szerződéshez és az igazolásokhoz kellő adatok. Mind kitalált.
  await prisma.berbeadoiAdatok.create({
    data: {
      berbeadoId: berbeado.id,
      szuletesiHely: "Szeged",
      szuletesiIdo: new Date(Date.UTC(1979, 2, 4)),
      anyjaNeve: "Példa Erzsébet",
      lakcim: "1085 Budapest, Minta utca 3.",
      igazolvanySzam: "000000AA",
      adoazonosito: "0000000000",
      telefon: "+36 1 000 0000",
      bankszamla: "00000000-00000000-00000000",
      bank: "Példa Bank",
    },
  });

  const annaJogviszony = await prisma.jogviszony.create({
    data: {
      ingatlanId: ferencvaros.id,
      berlok: {
        create: [
          {
            berloId: berloAnna.id,
            nev: berloAnna.nev,
            email: berloAnna.email,
            szuletesiHely: "Debrecen",
            szuletesiIdo: new Date(Date.UTC(1998, 5, 14)),
            anyjaNeve: "Példa Katalin",
            lakcim: "4026 Debrecen, Minta tér 8.",
            igazolvanySzam: "111111BB",
            telefon: "+36 30 000 0001",
            sorrend: 0,
          },
        ],
      },
      // Tizenkét hónapja fut: van mit mutatnia a betekintőnek.
      kezdete: nap(-12),
      berletiDijFt: 180000,
      kozosKoltsegFt: 14000,
      kaucioFt: 360000,
      fizetesiNap: 5,
      rezsiElszamolas: "almero",
    },
  });

  // Két bérlő egy jogviszonyon: ezen látszik az egyetemleges felelősség és az,
  // hogy a 240 000 Ft továbbra is egyetlen előírás, akárhányan utalják.
  const tamasJogviszony = await prisma.jogviszony.create({
    data: {
      ingatlanId: ujbuda.id,
      berlok: {
        create: [
          {
            nev: "Szabó Tamás",
            email: "tamas@pelda.hu",
            szuletesiHely: "Győr",
            szuletesiIdo: new Date(Date.UTC(2005, 9, 25)),
            anyjaNeve: "Példa Judit",
            lakcim: "9024 Győr, Minta köz 2.",
            igazolvanySzam: "222222CC",
            sorrend: 0,
          },
          {
            nev: "Varga Dóra",
            email: "dora@pelda.hu",
            szuletesiHely: "Kaposvár",
            szuletesiIdo: new Date(Date.UTC(2005, 3, 5)),
            anyjaNeve: "Példa Zsuzsanna",
            lakcim: "7400 Kaposvár, Minta sor 11.",
            igazolvanySzam: "333333DD",
            sorrend: 1,
          },
        ],
      },
      kezdete: nap(-7),
      berletiDijFt: 240000,
      kozosKoltsegFt: 21000,
      kaucioFt: 480000,
      fizetesiNap: 10,
      rezsiElszamolas: "atalany",
      // Átalány mellé kell összeg is, különben az "átalány" elszámolás nem ír
      // elő semmit — és az adóösszesítőn pont ez a bevételnek számító rész.
      rezsiAtalanyFt: 25000,
    },
  });

  // Nagyjából a magyar lakossági árak: a kedvezményes sáv és fölötte a piaci ár.
  // Egységár fillérben, hogy ne kelljen lebegőponttal szorozni.
  const villanyorak = await prisma.meroora.findMany({ where: { tipus: "villany" } });
  const vizorak = await prisma.meroora.findMany({ where: { tipus: "viz" } });

  for (const meroora of villanyorak) {
    await prisma.dijszabas.create({
      data: {
        merooraId: meroora.id,
        ervenyesTol: nap(-8),
        kedvezmenyesArFiller: 3690, // 36,90 Ft/kWh
        piaciArFiller: 7010, // 70,10 Ft/kWh a keret fölött
        evesKeret: 2523, // kWh/év, az átlagfogyasztásig
        alapdijFt: 900,
      },
    });
  }

  for (const meroora of vizorak) {
    await prisma.dijszabas.create({
      data: {
        merooraId: meroora.id,
        ervenyesTol: nap(-8),
        kedvezmenyesArFiller: 79900, // 799 Ft/m3, víz és csatorna együtt
        piaciArFiller: 79900,
        evesKeret: null, // a víznél nincs sáv
        alapdijFt: 0,
      },
    });
  }

  // Óraállások: a nyáron sok a villany, hogy a keret fölötti sáv is látszódjon.
  const ferencvarosiVillany = villanyorak.find((meroora) => meroora.ingatlanId === ferencvaros.id);
  const ferencvarosiViz = vizorak.find((meroora) => meroora.ingatlanId === ferencvaros.id);

  if (ferencvarosiVillany) {
    await prisma.oraallas.createMany({
      data: [
        { merooraId: ferencvarosiVillany.id, datum: nap(-2), ertek: 12480, rogzitoId: berloAnna.id },
        { merooraId: ferencvarosiVillany.id, datum: nap(-1), ertek: 12790, rogzitoId: berloAnna.id },
        { merooraId: ferencvarosiVillany.id, datum: nap(0), ertek: 13165, rogzitoId: berloAnna.id },
      ],
    });
  }

  if (ferencvarosiViz) {
    await prisma.oraallas.createMany({
      data: [
        { merooraId: ferencvarosiViz.id, datum: nap(-2), ertek: 214.2, rogzitoId: berloAnna.id },
        { merooraId: ferencvarosiViz.id, datum: nap(-1), ertek: 218.9, rogzitoId: berloAnna.id },
        { merooraId: ferencvarosiViz.id, datum: nap(0), ertek: 223.4, rogzitoId: berloAnna.id },
      ],
    });
  }

  // Az előírásokat ugyanaz a függvény állítja elő, mint éles használatban.
  // Ha kézzel írnánk be őket, a példaadat megint el tudna csúszni attól, amit
  // az alkalmazás magától generál — és pont ez volt a baj.
  async function eloirasokatKiir(jogviszonyId: string, adat: JogviszonyAdat) {
    const sorok = eloirasok(adat, MOST);
    const kesz: { id: string; tipus: string; idoszak: string; esedekesseg: Date; osszegFt: number }[] = [];

    for (const eloiras of sorok) {
      const tetel = await prisma.eloirtTetel.create({
        data: {
          jogviszonyId,
          tipus: eloiras.tipus,
          idoszak: eloiras.idoszak,
          esedekesseg: eloiras.esedekesseg,
          osszegFt: eloiras.osszegFt,
          reszletezes: eloiras.reszletezes ? JSON.stringify(eloiras.reszletezes) : null,
        },
      });
      kesz.push(tetel);
    }

    return kesz;
  }

  /**
   * A befizetés sorsa egy adott hónapban. A futó hónap a kivétel: ott van a
   * vitás és az elmaradt tétel, hogy az egyeztetés minden állapota látszódjon.
   */
  type Sors =
    | { fajta: "pontos" }
    | { fajta: "keses"; nap: number }
    | { fajta: "vitas"; berbeadoOsszeg: number }
    | { fajta: "elmaradt" };

  function annaSorsa(honapokVissza: number, tipus: string): Sors {
    if (honapokVissza === 0 && tipus === "berleti_dij") {
      // A klasszikus eset: a bérlő szerint teljes összeg ment, a bérbeadó
      // szerint kevesebb érkezett. Innen jön a bizonylatkérés.
      return { fajta: "vitas", berbeadoOsszeg: 175000 };
    }
    // Két csúszás a múltban, hogy a betekintő ne csak makulátlan sort mutasson.
    if (honapokVissza === 4 || honapokVissza === 9) return { fajta: "keses", nap: 6 };
    return { fajta: "pontos" };
  }

  function tamasSorsa(honapokVissza: number): Sors {
    // A futó hónapra még nem érkezett semmi: a tétel a bérbeadóra vár.
    if (honapokVissza === 0) return { fajta: "elmaradt" };
    if (honapokVissza === 3) return { fajta: "keses", nap: 4 };
    return { fajta: "pontos" };
  }

  /** Hány hónappal a mostani hónap előtt van ez az időszak. */
  function honapokVissza(idoszak: string): number {
    const [ev, ho] = idoszak.split("-").map(Number);
    return (EV - ev) * 12 + (HONAP - (ho - 1));
  }

  async function befizeteseketKiir(
    jogviszonyId: string,
    tetelek: { id: string; tipus: string; idoszak: string; esedekesseg: Date; osszegFt: number }[],
    sorsa: (honapokVissza: number, tipus: string) => Sors,
    kozlemenyek: Record<string, string>,
  ) {
    for (const tetel of tetelek) {
      const sors = sorsa(honapokVissza(tetel.idoszak), tetel.tipus);
      if (sors.fajta === "elmaradt") continue;

      const csuszas = sors.fajta === "keses" ? sors.nap : -1;
      const utalas = new Date(tetel.esedekesseg.getTime() + csuszas * 86400000);
      const kozlemeny = `${kozlemenyek[tetel.tipus] ?? "Befizetés"} — ${tetel.idoszak}`;

      await prisma.berloiIgazolas.create({
        data: { jogviszonyId, utalasDatuma: utalas, osszegFt: tetel.osszegFt, kozlemeny },
      });

      await prisma.berbeadoiIgazolas.create({
        data: {
          tulajdonosId: berbeado.id,
          jogviszonyId,
          // A bérbeadó egy nappal később veszi észre: ennyi tűrés van a két
          // oldal dátuma közt, és így életszerűbb is.
          erkezesDatuma: new Date(utalas.getTime() + 86400000),
          osszegFt: sors.fajta === "vitas" ? sors.berbeadoOsszeg : tetel.osszegFt,
          kozlemeny,
        },
      });
    }
  }

  const KOZLEMENYEK = {
    berleti_dij: "Bérleti díj",
    kozos_koltseg: "Közös költség",
    rezsi_atalany: "Rezsiátalány",
  };

  const annaTetelek = await eloirasokatKiir(annaJogviszony.id, {
    kezdete: annaJogviszony.kezdete,
    vege: annaJogviszony.vege,
    berletiDijFt: annaJogviszony.berletiDijFt,
    kozosKoltsegFt: annaJogviszony.kozosKoltsegFt,
    rezsiElszamolas: annaJogviszony.rezsiElszamolas,
    rezsiAtalanyFt: annaJogviszony.rezsiAtalanyFt,
    fizetesiNap: annaJogviszony.fizetesiNap,
  });

  const tamasTetelek = await eloirasokatKiir(tamasJogviszony.id, {
    kezdete: tamasJogviszony.kezdete,
    vege: tamasJogviszony.vege,
    berletiDijFt: tamasJogviszony.berletiDijFt,
    kozosKoltsegFt: tamasJogviszony.kozosKoltsegFt,
    rezsiElszamolas: tamasJogviszony.rezsiElszamolas,
    rezsiAtalanyFt: tamasJogviszony.rezsiAtalanyFt,
    fizetesiNap: tamasJogviszony.fizetesiNap,
  });

  await befizeteseketKiir(annaJogviszony.id, annaTetelek, annaSorsa, KOZLEMENYEK);
  await befizeteseketKiir(
    tamasJogviszony.id,
    tamasTetelek,
    (vissza) => tamasSorsa(vissza),
    KOZLEMENYEK,
  );

  // Egy kiadott és befizetett rezsielszámolás, hogy az adóösszesítőn látszódjon
  // a lényeg: a mért fogyasztás nem bevétel, a közös költség viszont igen.
  const rezsiEloiras = await prisma.eloirtTetel.create({
    data: {
      jogviszonyId: annaJogviszony.id,
      tipus: "rezsi",
      idoszak: "2026-09",
      esedekesseg: nap(0, 15),
      osszegFt: 71513,
    },
  });

  const rezsiElszamolas = await prisma.elszamolas.create({
    data: {
      jogviszonyId: annaJogviszony.id,
      idoszakKezdete: nap(-2),
      idoszakVege: nap(0),
      allapot: "elfogadva",
      osszegFt: 71513,
      eloirtTetelId: rezsiEloiras.id,
      kiadva: nap(0, 5),
      lezarva: nap(0, 6),
      tetelek: {
        create: [
          { fajta: "meroora", megnevezes: "Villany", mennyiseg: 685, mertekegyseg: "kWh", reszletezes: "12 480 → 13 165 kWh, 62 nap. Ebből 428,56 kWh kedvezményes áron (36,9 Ft/kWh), a keret fölötti 256,44 kWh piaci áron (70,1 Ft/kWh). Alapdíj 62 napra: 1835 Ft.", osszegFt: 35625, sorrend: 0 },
          { fajta: "meroora", megnevezes: "Víz (almérő)", mennyiseg: 9.2, mertekegyseg: "m3", reszletezes: "214,2 → 223,4 m3, 62 nap. Mind a kedvezményes sávban (799 Ft/m3).", osszegFt: 7351, sorrend: 1 },
          { fajta: "kozos_koltseg", megnevezes: "Közös költség", reszletezes: "14 000 Ft / hó, 62 napra arányosítva.", osszegFt: 28537, sorrend: 2 },
        ],
      },
    },
  });

  await prisma.berbeadoiIgazolas.create({
    data: {
      tulajdonosId: berbeado.id,
      jogviszonyId: annaJogviszony.id,
      erkezesDatuma: nap(0, 14),
      osszegFt: 71513,
      kozlemeny: "Rezsielszámolás 2026 nyár",
    },
  });

  void rezsiElszamolas;

  await prisma.koltseg.createMany({
    data: [
      { ingatlanId: ferencvaros.id, datum: nap(-6, 18), fajta: "felujitas", megnevezes: "Kazán karbantartás, számla 2026/114", osszegFt: 48000 },
      { ingatlanId: ferencvaros.id, datum: nap(-8, 9), fajta: "biztositas", megnevezes: "Lakásbiztosítás éves díja", osszegFt: 62000 },
      { ingatlanId: ujbuda.id, datum: nap(-3, 2), fajta: "felujitas", megnevezes: "Fürdőszoba csaptelep csere", osszegFt: 85000 },
    ],
  });

  const tamas = await prisma.jogviszonyBerlo.findFirstOrThrow({
    where: { jogviszonyId: tamasJogviszony.id, nev: "Szabó Tamás" },
  });

  const meghivo = await prisma.meghivo.create({
    data: {
      jogviszonyBerloId: tamas.id,
      token: meghivoToken(),
      email: "tamas@pelda.hu",
      lejar: meghivoLejarata(new Date()),
    },
  });

  // Szerződéstervezet a kétbérlős jogviszonyra, a jellemző modulkészlettel.
  await prisma.szerzodes.create({
    data: {
      jogviszonyId: tamasJogviszony.id,
      megnevezes: "Bérleti szerződés – Újbudai kétszobás",
      kelteHelye: "Budapest",
      kelte: nap(-8, 28),
      modulok: {
        create: [
          "ovadek",
          "egyetemleges_felelosseg",
          "allattartas_dohanyzas",
          "uzleti_hasznalat",
          "indexalas",
        ].map((kulcs, sorrend) => ({ kulcs, sorrend })),
      },
      parameterek: {
        create: [
          { kulcs: "dij_kozlemeny", ertek: "Bogdánfy 5/2 - tárgyév/tárgyhónap" },
          { kulcs: "kulcs_garnitura", ertek: "2" },
          { kulcs: "berlemeny_butorozott", ertek: "igen" },
        ],
      },
    },
  });

  // Hibabejelentések: egy nyitott, sürgős, és egy lezárt, hogy mindkét állapot
  // látszódjon a felületen. Mind kitalált eset.
  const csaptelep = await prisma.hibabejelentes.create({
    data: {
      jogviszonyId: annaJogviszony.id,
      bejelentoId: berloAnna.id,
      targy: "Nem melegszik a fürdőszobai radiátor",
      leiras:
        "Két napja hideg marad, a többi szobában rendben van a fűtés. Légtelenítettem, nem segített.",
      terulet: "kozponti_berendezes",
      ok: "elhasznalodas",
      surgosseg: "surgos",
      allapot: "atvette",
      atvetve: nap(0, 17),
      bejelentve: nap(0, 16),
      viseloFel: "berbeado",
    },
  });

  await prisma.hibaUzenet.createMany({
    data: [
      {
        hibabejelentesId: csaptelep.id,
        szerzoId: berbeado.id,
        szoveg: "Szerdán 16 órakor tud jönni a szerelő, megfelel?",
        letrehozva: nap(0, 17),
      },
      {
        hibabejelentesId: csaptelep.id,
        szerzoId: berloAnna.id,
        szoveg: "Igen, itthon leszek.",
        letrehozva: nap(0, 17),
      },
    ],
  });

  await prisma.hibabejelentes.create({
    data: {
      jogviszonyId: annaJogviszony.id,
      bejelentoId: berloAnna.id,
      targy: "Beragadt a hálószobai redőny",
      leiras: "A szalag elszakadt, a redőny félig leengedve maradt.",
      terulet: "nyilaszaro",
      ok: "elhasznalodas",
      surgosseg: "normal",
      allapot: "lezarva",
      bejelentve: nap(-1, 3),
      atvetve: nap(-1, 3),
      elharitva: nap(-1, 6),
      lezarva: nap(-1, 7),
      viseloFel: "megosztott",
    },
  });

  // Betekintő: Anna kiadott egy linket egy új lakás megpályázásához.
  const betekinto = await prisma.betekinto.create({
    data: {
      jogviszonyId: annaJogviszony.id,
      berloId: berloAnna.id,
      token: "probabetekinto2026",
      cel: "Lakásbérléshez, egy meghirdetett albérlet megpályázásához",
      osszegetMutat: false,
      lejar: nap(3, 28),
    },
  });

  console.log("Példaadat betöltve.");
  console.log(`Bérbeadó: ${berbeado.email} / ${PROBA_JELSZO}`);
  console.log(`Bérlő: ${berloAnna.email} / ${PROBA_JELSZO}`);
  console.log(`Szabó Tamás meghívója: /meghivo/${meghivo.token}`);
  console.log(`Anna betekintője: /betekinto/${betekinto.token}`);
}

main()
  .catch((hiba) => {
    console.error(hiba);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
