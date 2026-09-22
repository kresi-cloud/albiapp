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
import { deflateSync } from "node:zlib";
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

/**
 * A mai naphoz képest `napok` nappal korábbi nap.
 *
 * Ahol napokban mért ablak fut — ilyen az értékelés harminc napja —, a
 * hónaphoz igazított dátum nem elég: a hónap 20-a hol tizenkét, hol
 * harminchárom napja volt, és a példaadat állapota hónapról hónapra átbillenne.
 */
function napokkalEzelott(napok: number): Date {
  return new Date(Date.UTC(EV, HONAP, MOST.getUTCDate()) - napok * 86400000);
}

/**
 * Példakép: egyszínű PNG, a helyszínen készült fénykép helyett.
 *
 * Fényképet nem tudunk kitalálni, és bemásolt fotót sem akarunk a repóba: ami
 * a példaadatban van, annak nyilvánvalóan példaadatnak is kell látszania.
 * Ennyi viszont elég ahhoz, hogy az album, a megerősítés és a kiköltözéskori
 * párosítás végigpróbálható legyen.
 */
function crc32(adat: Buffer): number {
  let maradek = 0xffffffff;
  for (const bajt of adat) {
    maradek ^= bajt;
    for (let k = 0; k < 8; k += 1) {
      maradek = maradek & 1 ? (maradek >>> 1) ^ 0xedb88320 : maradek >>> 1;
    }
  }
  return (maradek ^ 0xffffffff) >>> 0;
}

function pngDarab(tipus: string, adat: Buffer): Buffer {
  const hossz = Buffer.alloc(4);
  hossz.writeUInt32BE(adat.length);
  const test = Buffer.concat([Buffer.from(tipus, "ascii"), adat]);
  const ellenorzo = Buffer.alloc(4);
  ellenorzo.writeUInt32BE(crc32(test));
  return Buffer.concat([hossz, test, ellenorzo]);
}

function peldaKep(
  meret: number,
  szin: [number, number, number],
): Uint8Array<ArrayBuffer> {
  const fejlec = Buffer.alloc(13);
  fejlec.writeUInt32BE(meret, 0);
  fejlec.writeUInt32BE(meret, 4);
  fejlec[8] = 8; // bitmélység
  fejlec[9] = 2; // színes, alfa nélkül

  const sorok: Buffer[] = [];
  for (let y = 0; y < meret; y += 1) {
    const sor = Buffer.alloc(1 + meret * 3);
    for (let x = 0; x < meret; x += 1) {
      // Enyhe átmenet, hogy a kép ne legyen teljesen egyhangú.
      const arnyalat = Math.round((y / meret) * 40);
      sor[1 + x * 3] = Math.min(255, szin[0] + arnyalat);
      sor[2 + x * 3] = Math.min(255, szin[1] + arnyalat);
      sor[3 + x * 3] = Math.min(255, szin[2] + arnyalat);
    }
    sorok.push(sor);
  }

  const bajtok = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngDarab("IHDR", fejlec),
    pngDarab("IDAT", deflateSync(Buffer.concat(sorok))),
    pngDarab("IEND", Buffer.alloc(0)),
  ]);

  // Saját ArrayBuffer-re másoljuk: a Buffer a Node közös pufferét osztja, és
  // abból a Prisma nem tudja, meddig tart a kép.
  const masolat = new Uint8Array(new ArrayBuffer(bajtok.byteLength));
  masolat.set(bajtok);
  return masolat;
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
  await prisma.ertekelesPont.deleteMany();
  await prisma.ertekeles.deleteMany();
  await prisma.elofizetesJovahagyas.deleteMany();
  await prisma.elofizetes.deleteMany();
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

  // Egy korábbi bérlő, aki már kiköltözött. Az ő lezárt jogviszonyán látszik a
  // kölcsönös értékelés, és rajta az is, amiért vaknak csináltuk: ő már megírta
  // a sajátját, a bérbeadó még nem, tehát a bérbeadó nem is látja az övét.
  const berloEszter = await prisma.felhasznalo.create({
    data: {
      email: "eszter@pelda.hu",
      nev: "Tóth Eszter",
      jelszoHash,
      szerep: "berlo",
    },
  });

  // Eszter lakótársa, szintén saját fiókkal. Nélküle a példaadatban soha nem
  // állt két fiókos bérlő egy jogviszonyon, és pont ez az az állapot, amiben
  // a bérbeadónak ugyanarra a bérletre két külön értékelése van. Amíg ez
  // hiányzott, a böngészős próba nem is találkozhatott vele.
  const berloMarton = await prisma.felhasznalo.create({
    data: {
      email: "marton@pelda.hu",
      nev: "Kiss Márton",
      jelszoHash,
      szerep: "berlo",
    },
  });

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
          {
            tipus: "villany",
            mertekegyseg: "kWh",
            gyariSzam: "E-884213",
            almero: false,
          },
          {
            tipus: "viz",
            mertekegyseg: "m3",
            gyariSzam: "V-119043",
            almero: true,
          },
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
        create: [
          {
            tipus: "villany",
            mertekegyseg: "kWh",
            gyariSzam: "E-552901",
            almero: false,
          },
        ],
      },
    },
  });

  // A harmadik lakás most üres: a bérlő a múlt hónapban költözött ki. Egy
  // magánbérbeadónál ez a hétköznapi eset, és két dolgot mutat meg, amit egy
  // csupa élő jogviszonyból álló példaadat nem tudna: az üres bérleményt és a
  // frissen lezárt jogviszonyt, amin a kölcsönös értékelés fut.
  const zuglo = await prisma.ingatlan.create({
    data: {
      tulajdonosId: berbeado.id,
      megnevezes: "Zuglói kislakás",
      cim: "1145 Budapest, Példa utca 7. 1/4.",
      alapteruletM2: 38,
      helyrajziSzam: "31954/6/A/4",
      kozosKoltsegFt: 12000,
      meroorak: {
        create: [
          {
            tipus: "villany",
            mertekegyseg: "kWh",
            gyariSzam: "E-770118",
            almero: false,
          },
        ],
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
  const villanyorak = await prisma.meroora.findMany({
    where: { tipus: "villany" },
  });
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
        kedvezmenyesArFiller: 37300, // 373 Ft/m3 ivóvíz
        piaciArFiller: 37300,
        evesKeret: null, // a víznél nincs sáv
        alapdijFt: 0,
        // Ugyanarra a köbméterre a szennyvízelvezetés. Külön sor lesz belőle az
        // elszámolásban, ahogy a vízszámlán is külön áll.
        csatornaArFiller: 42600, // 426 Ft/m3
      },
    });
  }

  // Óraállások: a nyáron sok a villany, hogy a keret fölötti sáv is látszódjon.
  const ferencvarosiVillany = villanyorak.find(
    (meroora) => meroora.ingatlanId === ferencvaros.id,
  );
  const ferencvarosiViz = vizorak.find(
    (meroora) => meroora.ingatlanId === ferencvaros.id,
  );

  if (ferencvarosiVillany) {
    await prisma.oraallas.createMany({
      data: [
        {
          merooraId: ferencvarosiVillany.id,
          datum: nap(-2),
          ertek: 12480,
          rogzitoId: berloAnna.id,
        },
        {
          merooraId: ferencvarosiVillany.id,
          datum: nap(-1),
          ertek: 12790,
          rogzitoId: berloAnna.id,
        },
        {
          merooraId: ferencvarosiVillany.id,
          datum: nap(0),
          ertek: 13165,
          rogzitoId: berloAnna.id,
        },
      ],
    });
  }

  if (ferencvarosiViz) {
    await prisma.oraallas.createMany({
      data: [
        {
          merooraId: ferencvarosiViz.id,
          datum: nap(-2),
          ertek: 214.2,
          rogzitoId: berloAnna.id,
        },
        {
          merooraId: ferencvarosiViz.id,
          datum: nap(-1),
          ertek: 218.9,
          rogzitoId: berloAnna.id,
        },
        {
          merooraId: ferencvarosiViz.id,
          datum: nap(0),
          ertek: 223.4,
          rogzitoId: berloAnna.id,
        },
      ],
    });
  }

  // Az előírásokat ugyanaz a függvény állítja elő, mint éles használatban.
  // Ha kézzel írnánk be őket, a példaadat megint el tudna csúszni attól, amit
  // az alkalmazás magától generál — és pont ez volt a baj.
  async function eloirasokatKiir(jogviszonyId: string, adat: JogviszonyAdat) {
    const sorok = eloirasok(adat, MOST);
    const kesz: {
      id: string;
      tipus: string;
      idoszak: string;
      esedekesseg: Date;
      osszegFt: number;
    }[] = [];

    for (const eloiras of sorok) {
      const tetel = await prisma.eloirtTetel.create({
        data: {
          jogviszonyId,
          tipus: eloiras.tipus,
          forrasId: eloiras.forrasId,
          idoszak: eloiras.idoszak,
          esedekesseg: eloiras.esedekesseg,
          osszegFt: eloiras.osszegFt,
          reszletezes: eloiras.reszletezes
            ? JSON.stringify(eloiras.reszletezes)
            : null,
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
    if (honapokVissza === 4 || honapokVissza === 9)
      return { fajta: "keses", nap: 6 };
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
    tetelek: {
      id: string;
      tipus: string;
      idoszak: string;
      esedekesseg: Date;
      osszegFt: number;
    }[],
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
        data: {
          jogviszonyId,
          utalasDatuma: utalas,
          osszegFt: tetel.osszegFt,
          kozlemeny,
        },
      });

      await prisma.berbeadoiIgazolas.create({
        data: {
          tulajdonosId: berbeado.id,
          jogviszonyId,
          // A bérbeadó egy nappal később veszi észre: ennyi tűrés van a két
          // oldal dátuma közt, és így életszerűbb is.
          erkezesDatuma: new Date(utalas.getTime() + 86400000),
          osszegFt:
            sors.fajta === "vitas" ? sors.berbeadoOsszeg : tetel.osszegFt,
          kozlemeny,
        },
      });
    }
  }

  const KOZLEMENYEK = {
    berleti_dij: "Bérleti díj",
    kozos_koltseg: "Közös költség",
    rezsi_atalany: "Rezsiátalány",
    elofizetes: "Internet-előfizetés",
  };

  // Előfizetések. Mind a három eset szerepel, mert a különbségük termékdöntés:
  // jóváhagyott bérbeadói előfizetésből havi előírás lesz, a jóváhagyásra
  // váróból még nem, a bérlő sajátjából pedig soha.
  const annaInternet = await prisma.elofizetes.create({
    data: {
      jogviszonyId: annaJogviszony.id,
      fajta: "internet",
      megnevezes: "Telekom 500/100 internet",
      szolgaltato: "Magyar Telekom",
      elofizeto: "berbeado",
      haviDijFt: 6490,
      kezdete: nap(-3),
    },
  });
  await prisma.elofizetesJovahagyas.create({
    data: {
      elofizetesId: annaInternet.id,
      berloId: berloAnna.id,
      allapot: "jovahagyva",
    },
  });

  // Ez most került fel: Anna még nem nyilatkozott róla, tehát nem írunk elő
  // belőle semmit, és a lap ezt meg is mondja mindkét oldalon.
  await prisma.elofizetes.create({
    data: {
      jogviszonyId: annaJogviszony.id,
      fajta: "tv",
      megnevezes: "Kábeltévé alapcsomag",
      szolgaltato: "Magyar Telekom",
      elofizeto: "berbeado",
      haviDijFt: 3990,
      kezdete: nap(0),
    },
  });

  // Tamás a saját nevén szerződött: a bérbeadó csak hozzájárult, pénz nem megy
  // át az alkalmazáson, a szerződésbe viszont bekerül.
  await prisma.elofizetes.create({
    data: {
      jogviszonyId: tamasJogviszony.id,
      fajta: "internet",
      megnevezes: "Vodafone otthoni net",
      szolgaltato: "Vodafone",
      elofizeto: "berlo",
      haviDijFt: 7990,
      kezdete: nap(-2),
    },
  });

  const annaTetelek = await eloirasokatKiir(annaJogviszony.id, {
    kezdete: annaJogviszony.kezdete,
    vege: annaJogviszony.vege,
    berletiDijFt: annaJogviszony.berletiDijFt,
    kozosKoltsegFt: annaJogviszony.kozosKoltsegFt,
    rezsiElszamolas: annaJogviszony.rezsiElszamolas,
    rezsiAtalanyFt: annaJogviszony.rezsiAtalanyFt,
    fizetesiNap: annaJogviszony.fizetesiNap,
    // Az előfizetések is a jogviszonyból következnek, ugyanúgy, mint a
    // bérleti díj: kézzel beírt előírás megint el tudna csúszni.
    elofizetesek: [
      {
        id: annaInternet.id,
        fajta: "internet",
        megnevezes: annaInternet.megnevezes,
        szolgaltato: annaInternet.szolgaltato,
        elofizeto: "berbeado",
        haviDijFt: annaInternet.haviDijFt,
        kezdete: annaInternet.kezdete,
        vege: annaInternet.vege,
        nyilatkozatok: [
          { berloId: berloAnna.id, allapot: "jovahagyva", indoklas: null },
        ],
      },
    ],
    fiokosBerlok: [berloAnna.id],
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

  await befizeteseketKiir(
    annaJogviszony.id,
    annaTetelek,
    annaSorsa,
    KOZLEMENYEK,
  );
  await befizeteseketKiir(
    tamasJogviszony.id,
    tamasTetelek,
    (vissza) => tamasSorsa(vissza),
    KOZLEMENYEK,
  );

  // A lezárt jogviszony: Eszter tavaly lakott a garzonban, és kiköltözött.
  // Végigfizette, tehát a befizetések lapját nem terheli semmivel — az
  // értékelés lapján viszont van mit mutatni.
  const eszterJogviszony = await prisma.jogviszony.create({
    data: {
      ingatlanId: zuglo.id,
      berlok: {
        create: [
          {
            berloId: berloEszter.id,
            nev: berloEszter.nev,
            email: berloEszter.email,
            szuletesiHely: "Pécs",
            szuletesiIdo: new Date(Date.UTC(1996, 10, 2)),
            anyjaNeve: "Példa Márta",
            lakcim: "7621 Pécs, Minta utca 14.",
            igazolvanySzam: "444444EE",
            sorrend: 0,
          },
          {
            berloId: berloMarton.id,
            nev: berloMarton.nev,
            email: berloMarton.email,
            szuletesiHely: "Szeged",
            szuletesiIdo: new Date(Date.UTC(1995, 3, 18)),
            anyjaNeve: "Példa Ilona",
            lakcim: "6722 Szeged, Minta tér 3.",
            igazolvanySzam: "555555MM",
            sorrend: 1,
          },
        ],
      },
      kezdete: nap(-13),
      // Tizenkét napja költözött ki, tehát az értékelési ablak még nyitva van.
      vege: napokkalEzelott(12),
      // A bérbeadó aznap rögzítette is: így a `vege` és a `lezarva` egybeesik,
      // ami a rendes eset. Ahol a kettő eltér, ott az ablak a rögzítéstől megy.
      lezarva: napokkalEzelott(12),
      statusz: "lezart",
      berletiDijFt: 165000,
      kozosKoltsegFt: 14000,
      kaucioFt: 330000,
      fizetesiNap: 5,
      rezsiElszamolas: "almero",
    },
  });

  const eszterTetelek = await eloirasokatKiir(eszterJogviszony.id, {
    kezdete: eszterJogviszony.kezdete,
    vege: eszterJogviszony.vege,
    berletiDijFt: eszterJogviszony.berletiDijFt,
    kozosKoltsegFt: eszterJogviszony.kozosKoltsegFt,
    rezsiElszamolas: eszterJogviszony.rezsiElszamolas,
    rezsiAtalanyFt: eszterJogviszony.rezsiAtalanyFt,
    fizetesiNap: eszterJogviszony.fizetesiNap,
  });

  await befizeteseketKiir(
    eszterJogviszony.id,
    eszterTetelek,
    () => ({ fajta: "pontos" }),
    KOZLEMENYEK,
  );

  // Eszter már értékelt, a bérbeadó még nem. Ez a vak állapot: a bérbeadó
  // lapján ott a teendő, de Eszter szövegéből egy betűt sem lát, amíg meg nem
  // írja a sajátját. Ha rögtön látná, a sajátja arra adott válasz lenne.
  const eszterErtekelese = await prisma.ertekeles.create({
    data: {
      jogviszonyId: eszterJogviszony.id,
      szerzoId: berloEszter.id,
      alanyId: berbeado.id,
      irany: "berbeadorol",
      szoveg:
        "A csöpögő csapot két napon belül megcsinálta, és a kiköltözéskor az óvadékot egy héten belül visszakaptam, tételes elszámolással. Telefonon nem mindig érte el az ember, de üzenetre mindig válaszolt.",
      pontok: {
        create: [
          { szempont: "hibakezeles", pont: 5 },
          { szempont: "elerhetoseg", pont: 3 },
          { szempont: "elszamolas", pont: 5 },
        ],
      },
    },
  });
  void eszterErtekelese;

  // A bérbeadó a **lakótársról** írt, Eszterről még nem. Ez az az állapot,
  // amiben a páros összeállítása elromolhat: csak a szerzőre szűrve ez az
  // értékelés Eszter lapjára került volna, „Amit a bérbeadó írt" címmel, és
  // Eszter saját űrlapja is lezárult volna, mert a páros késznek látszott.
  const martonErtekelese = await prisma.ertekeles.create({
    data: {
      jogviszonyId: eszterJogviszony.id,
      szerzoId: berbeado.id,
      alanyId: berloMarton.id,
      irany: "berlorol",
      szoveg:
        "Mártonnal a közös költség elszámolása körül volt némi huzavona, de a lakást rendben adta vissza, és a kiköltözés napját két héttel előre jelezte.",
      pontok: {
        create: [
          { szempont: "fizetes", pont: 3 },
          { szempont: "allapot", pont: 5 },
          { szempont: "kommunikacio", pont: 4 },
        ],
      },
    },
  });
  void martonErtekelese;

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
          {
            fajta: "meroora",
            megnevezes: "Villany",
            mennyiseg: 685,
            mertekegyseg: "kWh",
            reszletezes:
              "12 480 → 13 165 kWh, 62 nap. Ebből 428,56 kWh kedvezményes áron (36,9 Ft/kWh), a keret fölötti 256,44 kWh piaci áron (70,1 Ft/kWh). Alapdíj 62 napra: 1835 Ft.",
            osszegFt: 35625,
            sorrend: 0,
          },
          {
            fajta: "meroora",
            megnevezes: "Víz (almérő)",
            mennyiseg: 9.2,
            mertekegyseg: "m3",
            reszletezes:
              "214,2 → 223,4 m3, 62 nap. Mind a kedvezményes sávban (799 Ft/m3).",
            osszegFt: 7351,
            sorrend: 1,
          },
          {
            fajta: "kozos_koltseg",
            megnevezes: "Közös költség",
            reszletezes: "14 000 Ft / hó, 62 napra arányosítva.",
            osszegFt: 28537,
            sorrend: 2,
          },
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
      {
        ingatlanId: ferencvaros.id,
        datum: nap(-6, 18),
        fajta: "felujitas",
        megnevezes: "Kazán karbantartás, számla 2026/114",
        osszegFt: 48000,
      },
      {
        ingatlanId: ferencvaros.id,
        datum: nap(-8, 9),
        fajta: "biztositas",
        megnevezes: "Lakásbiztosítás éves díja",
        osszegFt: 62000,
      },
      {
        ingatlanId: ujbuda.id,
        datum: nap(-3, 2),
        fajta: "felujitas",
        megnevezes: "Fürdőszoba csaptelep csere",
        osszegFt: 85000,
      },
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
          {
            kulcs: "dij_kozlemeny",
            ertek: "Bogdánfy 5/2 - tárgyév/tárgyhónap",
          },
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

  // Átadás-átvételi jegyzőkönyv képekkel. A birtokbaadáskori állapot az, amihez
  // kiköltözéskor mérni fogjuk a lakást: ezért van itt mindhárom állapot —
  // megerősített kép, megerősítésre váró kép, és egy, amire kifogás érkezett.
  const jegyzokonyv = await prisma.jegyzokonyv.create({
    data: {
      jogviszonyId: annaJogviszony.id,
      fajta: "birtokbaadas",
      idopont: annaJogviszony.kezdete,
      allapotLeiras:
        "A lakás tiszta, frissen festett. A konyhapulton egy karcolás, a fürdőszobai csempén két repedt darab.",
      allapot: "tervezet",
    },
  });

  const konyhapult = await prisma.jegyzokonyvTetel.create({
    data: {
      jegyzokonyvId: jegyzokonyv.id,
      fajta: "hiba",
      megnevezes: "Karcolás a konyhapulton",
      megjegyzes: "A mosogató mellett, kb. 20 cm.",
      sorrend: 1,
    },
  });

  const kepek = [
    {
      megnevezes: "Konyhapult, a mosogató melletti karcolás",
      tetelId: konyhapult.id,
      feltoltoId: berbeado.id,
      szin: [120, 130, 140] as [number, number, number],
      // Anna megnézte és rábólintott: ez a kép kétoldali.
      megerositoId: berloAnna.id,
      megerositve: nap(-12, 3),
      kifogas: null as string | null,
    },
    {
      megnevezes: "Fürdőszoba, a kád melletti csempe",
      tetelId: null,
      feltoltoId: berbeado.id,
      szin: [140, 150, 160] as [number, number, number],
      megerositoId: null,
      megerositve: null,
      kifogas: null as string | null,
    },
    {
      megnevezes: "Nappali, a kanapé mögötti fal",
      tetelId: null,
      feltoltoId: berbeado.id,
      szin: [160, 140, 120] as [number, number, number],
      megerositoId: berloAnna.id,
      megerositve: nap(-12, 3),
      kifogas:
        "Ez a folt a beköltözéskor még nem volt itt, a képen viszont már látszik.",
    },
    {
      // A bérlő is tölthet fel: a saját állítása ugyanannyit ér.
      megnevezes: "Előszoba, a beépített szekrény ajtaja",
      tetelId: null,
      feltoltoId: berloAnna.id,
      szin: [130, 160, 140] as [number, number, number],
      megerositoId: null,
      megerositve: null,
      kifogas: null as string | null,
    },
  ];

  for (const kep of kepek) {
    const tartalom = peldaKep(320, kep.szin);
    await prisma.jegyzokonyvKep.create({
      data: {
        jegyzokonyvId: jegyzokonyv.id,
        tetelId: kep.tetelId,
        megnevezes: kep.megnevezes,
        fajlNev: "pelda.png",
        mimeTipus: "image/png",
        meretBajt: tartalom.byteLength,
        tartalom,
        feltoltoId: kep.feltoltoId,
        feltoltve: annaJogviszony.kezdete,
        megerositoId: kep.megerositoId,
        megerositve: kep.megerositve,
        kifogas: kep.kifogas,
      },
    });
  }

  // Betekintő: Anna megosztotta a bérleményét a szüleivel, akik fizetik.
  const betekinto = await prisma.betekinto.create({
    data: {
      jogviszonyId: annaJogviszony.id,
      berloId: berloAnna.id,
      token: "probabetekinto2026",
      cel: "Anyáéknak, hogy lássák, mi hogy áll",
      osszegetMutat: true,
      lejar: nap(9, 28),
    },
  });

  // Beszélgetés: a hétköznapi ügy, ami se hibabejelentés, se elszámolás.
  // Kétirányú szál a bérbeadó és Anna között, hogy a lista ne legyen üres a
  // demóban — a csoportos esethez Tamásnak még nincs fiókja, és ez pont jól
  // mutatja, miért nem szerepel a címzettek közt.
  const kemenysepro = await prisma.beszelgetes.create({
    data: {
      jogviszonyId: annaJogviszony.id,
      resztvevok: {
        create: [
          { felhasznaloId: berbeado.id },
          { felhasznaloId: berloAnna.id },
        ],
      },
      utolsoUzenet: nap(0, 11),
    },
  });

  await prisma.beszelgetesUzenet.createMany({
    data: [
      {
        beszelgetesId: kemenysepro.id,
        szerzoId: berbeado.id,
        szoveg:
          "Csütörtökön 9 és 11 között jön a kéményseprő. Itthon tudsz lenni, vagy hagyjam nálad a kulcsot?",
        kuldve: nap(-1, 9),
      },
      {
        beszelgetesId: kemenysepro.id,
        szerzoId: berloAnna.id,
        szoveg: "Itthon leszek, nem kell kulcs. Köszönöm, hogy szóltál előre.",
        kuldve: nap(-1, 10),
      },
      {
        beszelgetesId: kemenysepro.id,
        szerzoId: berbeado.id,
        szoveg: "Rendben, akkor csütörtökön. Ha csúsznak, írok.",
        kuldve: nap(0, 11),
      },
    ],
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
