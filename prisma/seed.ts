/**
 * Példaadat a próbakörnyezethez. Egy bérbeadó, két lakás, két bérlő, és egy
 * szeptemberi hónap, amiben szándékosan van egy pontos, egy hiányos és egy
 * elmaradt befizetés — hogy az egyeztetés mindhárom állapota látszódjon.
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const url = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

// A jelszavas belépés a következő körben készül el; addig a mező jelzésértékű.
const JELSZO_HELYE = "meg-nincs-jelszo";

async function main() {
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
      jelszoHash: JELSZO_HELYE,
      szerep: "berbeado",
    },
  });

  const berloAnna = await prisma.felhasznalo.create({
    data: {
      email: "anna@pelda.hu",
      nev: "Kovács Anna",
      jelszoHash: JELSZO_HELYE,
      szerep: "berlo",
    },
  });

  const berloTamas = await prisma.felhasznalo.create({
    data: {
      email: "tamas@pelda.hu",
      nev: "Szabó Tamás",
      jelszoHash: JELSZO_HELYE,
      szerep: "berlo",
    },
  });

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
      berloId: berloTamas.id,
      berloNev: berloTamas.nev,
      berloEmail: berloTamas.email,
      kezdete: new Date(Date.UTC(2026, 1, 1)),
      berletiDijFt: 240000,
      kozosKoltsegFt: 21000,
      kaucioFt: 480000,
      fizetesiNap: 10,
      rezsiElszamolas: "atalany",
    },
  });

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

  console.log("Példaadat betöltve.");
}

main()
  .catch((hiba) => {
    console.error(hiba);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
