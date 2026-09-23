/**
 * A gépi értékelés megfigyelései az adatbázisból.
 *
 * Itt csak gyűjtünk: a pontozás a domainben történik
 * (`src/domain/gepi-ertekeles.ts`), hogy a tesztek ne az adatbázison
 * keresztül érjék el. Semmit nem tárolunk — minden lekérdezéskor újraszámol,
 * tehát a kép magától követi, ha a felhasználó viselkedése megváltozik.
 *
 * Minden megfigyelés abból jön, amit az alkalmazás magától rögzített: mikor
 * érkezett a pénz, mikor jött válasz egy megkeresésre, és hány kétoldali
 * kérdésre nyilatkozott egyáltalán az illető. Semmit nem tippelünk meg.
 */

import { type Megfigyeles, URES_MEGFIGYELES } from "@/domain/gepi-ertekeles";
import { prisma } from "@/lib/db";
import { berloNezetei, jogviszonyNezetek } from "@/lib/lekerdezesek";

const ORA = 60 * 60 * 1000;

/** Két időpont közti órák száma. Visszafelé mutató párost eldobunk. */
function orakban(tol: Date, ig: Date): number | null {
  const kulonbseg = (ig.getTime() - tol.getTime()) / ORA;
  return kulonbseg >= 0 ? kulonbseg : null;
}

function hozza(lista: number[], ora: number | null): void {
  if (ora !== null) lista.push(ora);
}

/**
 * Az egyeztetésből jövő pontosság.
 *
 * A két szerepnél mást mér, és ez szándékos. A bérlő pontossága az, hogy a
 * pénz a kiírt összegben és időben megérkezett-e. A bérbeadó nem fizet, tehát
 * nála az a pontosság, hogy a saját oldalát vezette-e: minden lejárt
 * előírásra vagy beérkezést rögzített, vagy kimondta, hogy nem jött pénz.
 * Egy nem fizető bérlő nem ronthatja a bérbeadó pontosságát.
 */
async function egyeztetesbol(
  felhasznaloId: string,
  szerep: "berbeado" | "berlo",
  ma: Date,
): Promise<
  Pick<
    Megfigyeles,
    "eldontott" | "rendben" | "vitas" | "hianyzo" | "kesesNapok"
  >
> {
  const nezetek =
    szerep === "berbeado"
      ? await jogviszonyNezetek(felhasznaloId, ma)
      : await berloNezetei(felhasznaloId, ma);

  let eldontott = 0;
  let rendben = 0;
  let vitas = 0;
  let hianyzo = 0;
  const kesesNapok: number[] = [];

  for (const nezet of nezetek) {
    for (const sor of nezet.egyeztetesek) {
      // Ami még nem járt le, arról nincs mit mondani: aki még fizethet, az
      // nem késett el.
      if (sor.eloirtTetelId === null || sor.esedekesseg > ma) continue;
      eldontott += 1;
      if (sor.allapot === "vitas") vitas += 1;
      if (sor.allapot === "hianyzik") hianyzo += 1;

      if (szerep === "berlo") {
        if (sor.allapot === "egyezik") rendben += 1;
        if (sor.berloiIgazolasId !== null)
          kesesNapok.push(Math.max(0, sor.keses));
      } else {
        // A bérbeadónál az számít rendben lévőnek, amire nyilatkozott, és nem
        // maradt vitás: a vita az ő oldalán is nyitott ügy.
        if (sor.berbeadoiIgazolasId !== null && sor.allapot !== "vitas")
          rendben += 1;
      }
    }
  }

  return { eldontott, rendben, vitas, hianyzo, kesesNapok };
}

/**
 * Válaszidők: mennyi idő telt el a másik fél megkeresése és az erre adott
 * válasz között. Négy helyről gyűlik, mert a bérlet ügyei is négy helyen
 * mennek: hibabejelentés, annak üzenetváltása, a beszélgetés és a
 * jóváhagyást kérő nyilatkozatok.
 */
async function valaszidok(
  felhasznaloId: string,
  szerep: "berbeado" | "berlo",
  jogviszonyIdk: string[],
): Promise<number[]> {
  const orak: number[] = [];

  const hibak = await prisma.hibabejelentes.findMany({
    where: { jogviszonyId: { in: jogviszonyIdk } },
    include: { uzenetek: { orderBy: { letrehozva: "asc" } } },
  });

  for (const hiba of hibak) {
    if (szerep === "berbeado") {
      // A bérbeadó válasza a bejelentésre: mikor vette át, vagy ha átvétel
      // nélkül intézkedett, mikor hárította el.
      hozza(orak, hiba.atvetve ? orakban(hiba.bejelentve, hiba.atvetve) : null);
      if (!hiba.atvetve && hiba.elharitva) {
        hozza(orak, orakban(hiba.bejelentve, hiba.elharitva));
      }
    } else if (
      hiba.bejelentoId === felhasznaloId &&
      hiba.elharitva &&
      hiba.lezarva
    ) {
      // A bérlő válasza az, hogy megerősíti-e az elhárítást.
      hozza(orak, orakban(hiba.elharitva, hiba.lezarva));
    }

    // Az üzenetváltásban minden olyan üzenet válasz, amit a másik fél
    // üzenete előz meg.
    for (let i = 1; i < hiba.uzenetek.length; i += 1) {
      const elozo = hiba.uzenetek[i - 1];
      const mostani = hiba.uzenetek[i];
      if (
        mostani.szerzoId === felhasznaloId &&
        elozo.szerzoId !== felhasznaloId
      ) {
        hozza(orak, orakban(elozo.letrehozva, mostani.letrehozva));
      }
    }
  }

  const beszelgetesek = await prisma.beszelgetes.findMany({
    where: {
      jogviszonyId: { in: jogviszonyIdk },
      resztvevok: { some: { felhasznaloId } },
    },
    include: { uzenetek: { orderBy: { kuldve: "asc" } } },
  });

  for (const beszelgetes of beszelgetesek) {
    for (let i = 1; i < beszelgetes.uzenetek.length; i += 1) {
      const elozo = beszelgetes.uzenetek[i - 1];
      const mostani = beszelgetes.uzenetek[i];
      if (
        mostani.szerzoId === felhasznaloId &&
        elozo.szerzoId !== felhasznaloId
      ) {
        hozza(orak, orakban(elozo.kuldve, mostani.kuldve));
      }
    }
  }

  if (szerep === "berlo") {
    const nyilatkozatok = await prisma.elofizetesJovahagyas.findMany({
      where: {
        berloId: felhasznaloId,
        elofizetes: { jogviszonyId: { in: jogviszonyIdk } },
      },
      include: { elofizetes: { select: { letrehozva: true } } },
    });
    for (const sor of nyilatkozatok) {
      hozza(orak, orakban(sor.elofizetes.letrehozva, sor.letrehozva));
    }
  }

  const kepek = await prisma.jegyzokonyvKep.findMany({
    where: {
      megerositoId: felhasznaloId,
      jegyzokonyv: { jogviszonyId: { in: jogviszonyIdk } },
    },
    select: { feltoltve: true, megerositve: true },
  });
  for (const kep of kepek) {
    if (kep.megerositve) hozza(orak, orakban(kep.feltoltve, kep.megerositve));
  }

  return orak;
}

/**
 * Együttműködés: hány kétoldali kérdés várt a nyilatkozatára, és ebből
 * hányra nyilatkozott — akár igennel, akár nemmel.
 *
 * A nemleges válasz is válasz. Aki kifogásol egy fényképet vagy nemet mond egy
 * előfizetésre, az együttműködik; aki nem válaszol, az nem.
 */
async function egyuttmukodes(
  felhasznaloId: string,
  szerep: "berbeado" | "berlo",
  jogviszonyIdk: string[],
): Promise<{ ranyitott: number; megvalaszolt: number }> {
  let ranyitott = 0;
  let megvalaszolt = 0;

  // A másik fél feltöltött fényképei: a sajátjára senki nem bólinthat rá.
  const kepek = await prisma.jegyzokonyvKep.findMany({
    where: {
      jegyzokonyv: { jogviszonyId: { in: jogviszonyIdk } },
      feltoltoId: { not: felhasznaloId },
    },
    select: { megerositoId: true, kifogas: true },
  });
  for (const kep of kepek) {
    ranyitott += 1;
    if (kep.megerositoId !== null || kep.kifogas !== null) megvalaszolt += 1;
  }

  if (szerep === "berlo") {
    const elofizetesek = await prisma.elofizetes.findMany({
      where: { jogviszonyId: { in: jogviszonyIdk } },
      include: { jovahagyasok: { where: { berloId: felhasznaloId } } },
    });
    for (const elofizetes of elofizetesek) {
      ranyitott += 1;
      if (elofizetes.jovahagyasok.length > 0) megvalaszolt += 1;
    }

    // Az elhárított hiba megerősítése: amíg nincs, a hiba nyitott marad.
    const hibak = await prisma.hibabejelentes.findMany({
      where: {
        jogviszonyId: { in: jogviszonyIdk },
        bejelentoId: felhasznaloId,
      },
      select: { elharitva: true, lezarva: true },
    });
    for (const hiba of hibak) {
      if (hiba.elharitva === null) continue;
      ranyitott += 1;
      if (hiba.lezarva !== null) megvalaszolt += 1;
    }
  } else {
    // A bérbeadó oldalán az a kétoldali kérdés, hogy a bejelentett hibára
    // reagált-e egyáltalán.
    const hibak = await prisma.hibabejelentes.findMany({
      where: {
        jogviszonyId: { in: jogviszonyIdk },
        bejelentoId: { not: felhasznaloId },
      },
      select: { atvetve: true, elharitva: true, allapot: true },
    });
    for (const hiba of hibak) {
      ranyitott += 1;
      if (
        hiba.atvetve !== null ||
        hiba.elharitva !== null ||
        hiba.allapot === "elutasitva"
      ) {
        megvalaszolt += 1;
      }
    }
  }

  return { ranyitott, megvalaszolt };
}

/** A felhasználó jogviszonyai, szerep szerint. */
async function jogviszonyai(
  felhasznaloId: string,
  szerep: "berbeado" | "berlo",
): Promise<string[]> {
  const sorok = await prisma.jogviszony.findMany({
    where:
      szerep === "berbeado"
        ? { ingatlan: { tulajdonosId: felhasznaloId } }
        : { berlok: { some: { berloId: felhasznaloId } } },
    select: { id: true },
  });
  return sorok.map((sor) => sor.id);
}

/** Minden megfigyelés egy felhasználóról. Innen már a domain pontoz. */
export async function megfigyelesek(
  felhasznaloId: string,
  szerep: "berbeado" | "berlo",
  ma: Date,
): Promise<Megfigyeles> {
  const jogviszonyIdk = await jogviszonyai(felhasznaloId, szerep);
  if (jogviszonyIdk.length === 0) return URES_MEGFIGYELES;

  const egyeztetes = await egyeztetesbol(felhasznaloId, szerep, ma);
  const valaszOrak = await valaszidok(felhasznaloId, szerep, jogviszonyIdk);
  const egyuttes = await egyuttmukodes(felhasznaloId, szerep, jogviszonyIdk);

  return { ...egyeztetes, valaszOrak, ...egyuttes };
}
