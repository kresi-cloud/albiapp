/**
 * Példaadat a próbakörnyezethez. Egy bérbeadó, két lakás, két bérlő, és egy
 * szeptemberi hónap, amiben szándékosan van egy pontos, egy hiányos és egy
 * elmaradt befizetés — hogy az egyeztetés mindhárom állapota látszódjon.
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { jelszotHashel } from "../src/lib/jelszo";
import { meghivoLejarata } from "../src/domain/belepes";
import { meghivoToken } from "../src/lib/meghivo";

const url = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

// Próbajelszó a példafiókokhoz. Éles adatbázisba ez a seed nem fut.
const PROBA_JELSZO = "probajelszo2026";

async function main() {
  const jelszoHash = await jelszotHashel(PROBA_JELSZO);

  await prisma.elszamolasTetel.deleteMany();
  await prisma.elszamolas.deleteMany();
  await prisma.dijszabas.deleteMany();
  await prisma.meghivo.deleteMany();
  await prisma.teendo.deleteMany();
  await prisma.egyeztetes.deleteMany();
  await prisma.kivonattetel.deleteMany();
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
      kozosKoltsegFt: 14000,
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
      kozosKoltsegFt: 21000,
      meroorak: {
        create: [{ tipus: "villany", mertekegyseg: "kWh", gyariSzam: "E-552901", almero: false }],
      },
    },
  });

  const annaJogviszony = await prisma.jogviszony.create({
    data: {
      ingatlanId: ferencvaros.id,
      berloId: berloAnna.id,
      berloNev: berloAnna.nev,
      berloEmail: berloAnna.email,
      kezdete: new Date(Date.UTC(2025, 8, 1)),
      berletiDijFt: 180000,
      kozosKoltsegFt: 14000,
      kaucioFt: 360000,
      fizetesiNap: 5,
      rezsiElszamolas: "almero",
    },
  });

  const tamasJogviszony = await prisma.jogviszony.create({
    data: {
      ingatlanId: ujbuda.id,
      berloNev: "Szabó Tamás",
      berloEmail: "tamas@pelda.hu",
      kezdete: new Date(Date.UTC(2026, 1, 1)),
      berletiDijFt: 240000,
      kozosKoltsegFt: 21000,
      kaucioFt: 480000,
      fizetesiNap: 10,
      rezsiElszamolas: "atalany",
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
        ervenyesTol: new Date(Date.UTC(2026, 0, 1)),
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
        ervenyesTol: new Date(Date.UTC(2026, 0, 1)),
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
        { merooraId: ferencvarosiVillany.id, datum: new Date(Date.UTC(2026, 6, 1)), ertek: 12480, rogzitoId: berloAnna.id },
        { merooraId: ferencvarosiVillany.id, datum: new Date(Date.UTC(2026, 7, 1)), ertek: 12790, rogzitoId: berloAnna.id },
        { merooraId: ferencvarosiVillany.id, datum: new Date(Date.UTC(2026, 8, 1)), ertek: 13165, rogzitoId: berloAnna.id },
      ],
    });
  }

  if (ferencvarosiViz) {
    await prisma.oraallas.createMany({
      data: [
        { merooraId: ferencvarosiViz.id, datum: new Date(Date.UTC(2026, 6, 1)), ertek: 214.2, rogzitoId: berloAnna.id },
        { merooraId: ferencvarosiViz.id, datum: new Date(Date.UTC(2026, 7, 1)), ertek: 218.9, rogzitoId: berloAnna.id },
        { merooraId: ferencvarosiViz.id, datum: new Date(Date.UTC(2026, 8, 1)), ertek: 223.4, rogzitoId: berloAnna.id },
      ],
    });
  }

  await prisma.eloirtTetel.createMany({
    data: [
      // Anna: augusztus rendben, szeptemberben kevesebb érkezett.
      { jogviszonyId: annaJogviszony.id, tipus: "berleti_dij", idoszak: "2026-08", esedekesseg: new Date(Date.UTC(2026, 7, 5)), osszegFt: 180000 },
      { jogviszonyId: annaJogviszony.id, tipus: "berleti_dij", idoszak: "2026-09", esedekesseg: new Date(Date.UTC(2026, 8, 5)), osszegFt: 180000 },
      { jogviszonyId: annaJogviszony.id, tipus: "kozos_koltseg", idoszak: "2026-09", esedekesseg: new Date(Date.UTC(2026, 8, 5)), osszegFt: 14000 },
      // Tamás: szeptemberre nem érkezett semmi.
      { jogviszonyId: tamasJogviszony.id, tipus: "berleti_dij", idoszak: "2026-08", esedekesseg: new Date(Date.UTC(2026, 7, 10)), osszegFt: 240000 },
      { jogviszonyId: tamasJogviszony.id, tipus: "berleti_dij", idoszak: "2026-09", esedekesseg: new Date(Date.UTC(2026, 8, 10)), osszegFt: 240000 },
    ],
  });

  await prisma.berloiIgazolas.createMany({
    data: [
      { jogviszonyId: annaJogviszony.id, utalasDatuma: new Date(Date.UTC(2026, 7, 4)), osszegFt: 180000, kozlemeny: "Augusztusi bérleti díj" },
      { jogviszonyId: annaJogviszony.id, utalasDatuma: new Date(Date.UTC(2026, 8, 4)), osszegFt: 180000, kozlemeny: "Szeptemberi bérleti díj" },
      { jogviszonyId: tamasJogviszony.id, utalasDatuma: new Date(Date.UTC(2026, 7, 9)), osszegFt: 240000, kozlemeny: "Augusztus" },
    ],
  });

  await prisma.kivonattetel.createMany({
    data: [
      { tulajdonosId: berbeado.id, jogviszonyId: annaJogviszony.id, konyvelesDatuma: new Date(Date.UTC(2026, 7, 4)), osszegFt: 180000, kozlemeny: "Augusztusi bérleti díj", partnerNev: "Kovács Anna", forrasFajl: "kivonat-2026-08.csv", sorUjjlenyomat: "pelda-01" },
      { tulajdonosId: berbeado.id, jogviszonyId: annaJogviszony.id, konyvelesDatuma: new Date(Date.UTC(2026, 8, 4)), osszegFt: 175000, kozlemeny: "Szeptemberi bérleti díj", partnerNev: "Kovács Anna", forrasFajl: "kivonat-2026-09.csv", sorUjjlenyomat: "pelda-02" },
      { tulajdonosId: berbeado.id, jogviszonyId: annaJogviszony.id, konyvelesDatuma: new Date(Date.UTC(2026, 8, 6)), osszegFt: 14000, kozlemeny: "Közös költség", partnerNev: "Kovács Anna", forrasFajl: "kivonat-2026-09.csv", sorUjjlenyomat: "pelda-03" },
      { tulajdonosId: berbeado.id, jogviszonyId: tamasJogviszony.id, konyvelesDatuma: new Date(Date.UTC(2026, 7, 9)), osszegFt: 240000, kozlemeny: "Augusztus", partnerNev: "Szabó Tamás", forrasFajl: "kivonat-2026-08.csv", sorUjjlenyomat: "pelda-04" },
    ],
  });

  const meghivo = await prisma.meghivo.create({
    data: {
      jogviszonyId: tamasJogviszony.id,
      token: meghivoToken(),
      email: "tamas@pelda.hu",
      lejar: meghivoLejarata(new Date()),
    },
  });

  console.log("Példaadat betöltve.");
  console.log(`Bérbeadó: ${berbeado.email} / ${PROBA_JELSZO}`);
  console.log(`Bérlő: ${berloAnna.email} / ${PROBA_JELSZO}`);
  console.log(`Szabó Tamás meghívója: /meghivo/${meghivo.token}`);
}

main()
  .catch((hiba) => {
    console.error(hiba);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
