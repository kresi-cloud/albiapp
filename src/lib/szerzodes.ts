import { prisma } from "@/lib/db";
import { allapota, elo } from "@/domain/elofizetes";
import { type Bemenet, type SajatSzoveg } from "@/domain/szerzodes-keszites";
import { elofizetesAdatta } from "@/lib/eloirasok";

/**
 * A szerződés bemenete az adatbázisból. Minden, amit a modulok használnak, innen
 * jön: a bérbeadó és a bérlők adatai, az ingatlan és a jogviszony. Így a
 * szerződésben nem lehet más bérleti díj, mint a befizetés-egyeztetésben.
 */
export async function szerzodesBemenet(
  szerzodesId: string,
  tulajdonosId: string,
): Promise<{
  bemenet: Bemenet;
  megnevezes: string;
  allapot: string;
  veglegesSzoveg: string | null;
  veglegesSzovegEn: string | null;
  fajta: string;
  alapSzerzodesId: string | null;
} | null> {
  const szerzodes = await prisma.szerzodes.findFirst({
    where: { id: szerzodesId, jogviszony: { ingatlan: { tulajdonosId } } },
    include: {
      modulok: { orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
      parameterek: true,
      sajatSzovegek: true,
      alap: { select: { megnevezes: true, kelte: true, veglegesitve: true } },
      jogviszony: {
        include: {
          ingatlan: true,
          berlok: { orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
          elofizetesek: { include: { jovahagyasok: true }, orderBy: [{ kezdete: "asc" }, { id: "asc" }] },
        },
      },
    },
  });
  if (!szerzodes) return null;

  const berbeado = await prisma.felhasznalo.findUnique({
    where: { id: tulajdonosId },
    include: { berbeadoiAdatok: true },
  });
  if (!berbeado) return null;

  const adatok = berbeado.berbeadoiAdatok;
  const jogviszony = szerzodes.jogviszony;

  const parameterek: Record<string, string> = {};
  for (const sor of szerzodes.parameterek) parameterek[sor.kulcs] = sor.ertek;

  // Amit a bérbeadó átírt. Ami itt nincs benne, az a katalógus szövegével
  // megy — és az a rendes eset.
  const sajatSzovegek: Record<string, SajatSzoveg> = {};
  for (const sor of szerzodes.sajatSzovegek) {
    sajatSzovegek[sor.kulcs] = { szoveg: sor.szoveg, szovegEn: sor.szovegEn };
  }

  // Csak a jóváhagyott és még élő előfizetés kerül a szerződésbe: amiről a
  // bérlő nem nyilatkozott, az nem szerződéses kötelezettség.
  const fiokosBerlok = jogviszony.berlok
    .map((berlo) => berlo.berloId)
    .filter((berloId): berloId is string => Boolean(berloId));
  // És csak az, ami a ma napján él: a `!sor.vege` a jövőbeli végű, még élő
  // előfizetést is kihagyta volna, pedig az a szerződés ideje alatt fut.
  const ma = new Date();
  const elofizetesek = jogviszony.elofizetesek
    .map(elofizetesAdatta)
    .filter((sor) => elo(sor, ma))
    // Csak a jóváhagyott. Korábban itt `!terhelheto(...)` állt, ami a bérlő
    // saját előfizetésére **mindig** igaz — a `terhelheto` definíció szerint
    // csak bérbeadói előfizetésre igaz —, tehát minden bérlői előfizetés
    // bement a szerződésbe, a kifogásolt is. Amiről a bérlő azt mondta, hogy
    // nem kéri, az nem szerződéses kötelezettség.
    .filter((sor) => allapota(sor, fiokosBerlok) === "jovahagyva")
    .map((sor) => ({
      megnevezes: sor.megnevezes,
      fajta: sor.fajta,
      szolgaltato: sor.szolgaltato,
      elofizeto: sor.elofizeto,
      haviDijFt: sor.haviDijFt,
    }));

  return {
    megnevezes: szerzodes.megnevezes,
    allapot: szerzodes.allapot,
    veglegesSzoveg: szerzodes.veglegesSzoveg,
    veglegesSzovegEn: szerzodes.veglegesSzovegEn,
    fajta: szerzodes.fajta,
    alapSzerzodesId: szerzodes.alapSzerzodesId,
    bemenet: {
      berbeado: {
        nev: berbeado.nev,
        email: berbeado.email,
        szuletesiHely: adatok?.szuletesiHely ?? null,
        szuletesiIdo: adatok?.szuletesiIdo ?? null,
        anyjaNeve: adatok?.anyjaNeve ?? null,
        lakcim: adatok?.lakcim ?? null,
        igazolvanySzam: adatok?.igazolvanySzam ?? null,
        adoazonosito: adatok?.adoazonosito ?? null,
        telefon: adatok?.telefon ?? null,
        bankszamla: adatok?.bankszamla ?? null,
        bank: adatok?.bank ?? null,
      },
      berlok: jogviszony.berlok.map((berlo) => ({
        nev: berlo.nev,
        email: berlo.email,
        szuletesiHely: berlo.szuletesiHely,
        szuletesiIdo: berlo.szuletesiIdo,
        anyjaNeve: berlo.anyjaNeve,
        lakcim: berlo.lakcim,
        igazolvanySzam: berlo.igazolvanySzam,
        telefon: berlo.telefon,
      })),
      ingatlan: {
        megnevezes: jogviszony.ingatlan.megnevezes,
        cim: jogviszony.ingatlan.cim,
        alapteruletM2: jogviszony.ingatlan.alapteruletM2,
        helyrajziSzam: jogviszony.ingatlan.helyrajziSzam,
        energetikaiAzonosito: jogviszony.ingatlan.energetikaiAzonosito,
        kozosKoltsegFt: jogviszony.ingatlan.kozosKoltsegFt,
      },
      jogviszony: {
        kezdete: jogviszony.kezdete,
        vege: jogviszony.vege,
        berletiDijFt: jogviszony.berletiDijFt,
        kozosKoltsegFt: jogviszony.kozosKoltsegFt,
        kaucioFt: jogviszony.kaucioFt,
        fizetesiNap: jogviszony.fizetesiNap,
        rezsiElszamolas: jogviszony.rezsiElszamolas,
        rezsiAtalanyFt: jogviszony.rezsiAtalanyFt,
      },
      valasztottModulok: szerzodes.modulok.map((modul) => modul.kulcs),
      parameterek,
      sajatSzovegek,
      kelteHelye: szerzodes.kelteHelye,
      kelte: szerzodes.kelte,
      elofizetesek,
      fajta: szerzodes.fajta === "zaradek" ? "zaradek" : "szerzodes",
      alap: szerzodes.alap,
    },
  };
}
