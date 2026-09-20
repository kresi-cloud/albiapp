import {
  adoosszesito,
  berbeadottNapok,
  bevetelketBesorol,
  ertekcsokkenes,
  evNapjai,
  rezsitMegoszt,
  type BeerkezettTetel,
  type BevetelSor,
  type KoltsegSor,
  type Osszesito,
} from "@/domain/ado";
import { egyeztet } from "@/domain/egyeztetes";
import { prisma } from "@/lib/db";
import { egyeztetesBeallitasok } from "@/lib/lekerdezesek";

export type AdoEv = {
  ev: number;
  osszesito: Osszesito;
  bevetelSorok: BevetelSor[];
  koltsegSorok: (KoltsegSor & { datum: Date | null; fajta: string; ingatlan: string })[];
  /** Beérkezett pénz, amihez nem találtunk előírt tételt. A bérbeadónak kell eldöntenie. */
  besorolatlan: { datum: Date; osszegFt: number; megjegyzes: string }[];
};

const KOLTSEG_FAJTAK: Record<string, string> = {
  felujitas: "Felújítás, karbantartás",
  kozos_koltseg: "Közös költség",
  biztositas: "Biztosítás",
  kozuzem: "Közüzemi számla",
  egyeb: "Egyéb",
};

export function koltsegFajtaNeve(fajta: string): string {
  return KOLTSEG_FAJTAK[fajta] ?? fajta;
}

export const KOLTSEG_FAJTA_LISTA = Object.entries(KOLTSEG_FAJTAK).map(([ertek, cimke]) => ({
  ertek,
  cimke,
}));

function evbenVan(nap: Date, ev: number): boolean {
  return nap.getUTCFullYear() === ev;
}

/**
 * Az év adóösszesítője. A bevétel pénzforgalmi: az számít, ami tényleg
 * megérkezett, ezért a kivonattételekből indulunk ki, és az egyeztetés mondja
 * meg, melyik előíráshoz tartoznak.
 */
export async function adoEv(tulajdonosId: string, ev: number): Promise<AdoEv> {
  const beallitasok = await egyeztetesBeallitasok(tulajdonosId);
  const evVege = new Date(Date.UTC(ev + 1, 0, 1));

  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId } },
    include: {
      ingatlan: true,
      eloirtTetelek: { orderBy: { esedekesseg: "asc" } },
      berloiIgazolasok: { orderBy: { utalasDatuma: "asc" } },
      kivonattetelek: { orderBy: { konyvelesDatuma: "asc" } },
      elszamolasok: { include: { tetelek: true } },
    },
  });

  const beerkezett: BeerkezettTetel[] = [];
  const besorolatlan: AdoEv["besorolatlan"] = [];

  for (const jogviszony of jogviszonyok) {
    const eredmeny = egyeztet(
      jogviszony.eloirtTetelek,
      jogviszony.berloiIgazolasok,
      jogviszony.kivonattetelek,
      evVege,
      beallitasok,
    );

    const eloirasok = new Map(jogviszony.eloirtTetelek.map((tetel) => [tetel.id, tetel]));
    const kivonatok = new Map(jogviszony.kivonattetelek.map((tetel) => [tetel.id, tetel]));

    // Előírt tételenként: mennyi volt az elszámolásban a mért fogyasztás, és
    // mennyi az egész. Ebből osztjuk meg a befizetést.
    const rezsiAranyok = new Map<
      string,
      { mertFt: number; osszesFt: number; csakKozosKoltseg: boolean }
    >();
    for (const elszamolas of jogviszony.elszamolasok) {
      if (!elszamolas.eloirtTetelId) continue;
      const nemMert = elszamolas.tetelek.filter((tetel) => tetel.fajta !== "meroora");
      rezsiAranyok.set(elszamolas.eloirtTetelId, {
        mertFt: elszamolas.tetelek
          .filter((tetel) => tetel.fajta === "meroora")
          .reduce((osszeg, tetel) => osszeg + tetel.osszegFt, 0),
        osszesFt: elszamolas.tetelek.reduce((osszeg, tetel) => osszeg + tetel.osszegFt, 0),
        // Ha a nem mért rész csak közös költség, azt nevezzük a nevén.
        csakKozosKoltseg:
          nemMert.length > 0 && nemMert.every((tetel) => tetel.fajta === "kozos_koltseg"),
      });
    }

    for (const sor of eredmeny) {
      if (!sor.kivonattetelId) continue;
      const kivonat = kivonatok.get(sor.kivonattetelId);
      if (!kivonat || !evbenVan(kivonat.konyvelesDatuma, ev)) continue;

      const eloiras = sor.eloirtTetelId ? eloirasok.get(sor.eloirtTetelId) : undefined;

      if (!eloiras) {
        besorolatlan.push({
          datum: kivonat.konyvelesDatuma,
          osszegFt: kivonat.osszegFt,
          megjegyzes:
            kivonat.kozlemeny?.trim() ||
            "Beérkezett utalás, amihez nem tartozik előírt tétel. Döntsd el, bevétel-e.",
        });
        continue;
      }

      const megnevezes = `${jogviszony.ingatlan.megnevezes} · ${eloiras.idoszak}`;

      if (eloiras.tipus === "rezsi") {
        const arany = rezsiAranyok.get(eloiras.id) ?? {
          mertFt: 0,
          osszesFt: 0,
          csakKozosKoltseg: false,
        };
        const { mertReszFt, egyebReszFt } = rezsitMegoszt(
          kivonat.osszegFt,
          arany.mertFt,
          arany.osszesFt,
        );
        if (mertReszFt > 0) {
          beerkezett.push({
            datum: kivonat.konyvelesDatuma,
            osszegFt: mertReszFt,
            fajta: "rezsi",
            megnevezes: `${megnevezes} · mért fogyasztás`,
            mertKozuzem: true,
          });
        }
        if (egyebReszFt > 0) {
          beerkezett.push({
            datum: kivonat.konyvelesDatuma,
            osszegFt: egyebReszFt,
            fajta: arany.csakKozosKoltseg ? "kozos_koltseg" : "rezsi",
            megnevezes: `${megnevezes} · ${arany.csakKozosKoltseg ? "közös költség" : "átalány és közös költség"}`,
            mertKozuzem: false,
          });
        }
        continue;
      }

      const fajta =
        eloiras.tipus === "berleti_dij"
          ? "berleti_dij"
          : eloiras.tipus === "kozos_koltseg"
            ? "kozos_koltseg"
            : "egyeb";

      beerkezett.push({
        datum: kivonat.konyvelesDatuma,
        osszegFt: kivonat.osszegFt,
        fajta,
        megnevezes,
      });
    }
  }

  beerkezett.sort((a, b) => a.datum.getTime() - b.datum.getTime());
  const bevetelSorok = bevetelketBesorol(beerkezett);

  // Költségek: a rögzített számlák és az értékcsökkenés.
  const ingatlanok = await prisma.ingatlan.findMany({
    where: { tulajdonosId },
    include: {
      jogviszonyok: true,
      koltsegek: {
        where: {
          datum: { gte: new Date(Date.UTC(ev, 0, 1)), lt: evVege },
        },
        orderBy: { datum: "asc" },
      },
    },
  });

  const koltsegSorok: AdoEv["koltsegSorok"] = [];

  for (const ingatlan of ingatlanok) {
    for (const koltseg of ingatlan.koltsegek) {
      koltsegSorok.push({
        megnevezes: koltseg.megnevezes,
        osszegFt: koltseg.osszegFt,
        datum: koltseg.datum,
        fajta: koltseg.fajta,
        ingatlan: ingatlan.megnevezes,
      });
    }

    const napok = berbeadottNapok(
      ev,
      ingatlan.jogviszonyok.map((jogviszony) => ({
        kezdete: jogviszony.kezdete,
        vege: jogviszony.vege,
      })),
    );
    const leiras = ertekcsokkenes(ingatlan.beszerzesiArFt, napok, evNapjai(ev));
    if (leiras > 0) {
      koltsegSorok.push({
        megnevezes: `Értékcsökkenés (${napok} kiadott nap)`,
        osszegFt: leiras,
        datum: null,
        fajta: "ertekcsokkenes",
        ingatlan: ingatlan.megnevezes,
      });
    }
  }

  return {
    ev,
    osszesito: adoosszesito(bevetelSorok, koltsegSorok),
    bevetelSorok,
    koltsegSorok,
    besorolatlan,
  };
}

/** Mely évekre van egyáltalán adatunk. */
export async function adoEvek(tulajdonosId: string): Promise<number[]> {
  const tetelek = await prisma.kivonattetel.findMany({
    where: { tulajdonosId },
    select: { konyvelesDatuma: true },
  });
  const evek = new Set(tetelek.map((tetel) => tetel.konyvelesDatuma.getUTCFullYear()));
  evek.add(new Date().getUTCFullYear());
  return [...evek].sort((a, b) => b - a);
}
