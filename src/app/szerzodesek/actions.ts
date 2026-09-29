"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { belepettFelhasznalo, kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { szerzodesBemenet } from "@/lib/szerzodes";
import { alairtatMent, alairtatRogzit, alairtatTorol } from "@/lib/alairt";
import { alairtatEllenoriz, tipusATartalombol } from "@/domain/alairt";
import {
  ajanlottModulok,
  bekezdesekre,
  hianyzoAdatok,
  ketnyelvuSzovege,
  modultKeres,
  okiratSzovege,
} from "@/domain/szerzodes-keszites";
import {
  allapota as ketnyelvuAllapota,
  nyilatkozatotEllenoriz,
} from "@/domain/szerzodes-ketnyelvu";

export type Eredmeny = {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak: string[];
  /**
   * Melyik mezőre vonatkozik a hiba. Külön mezőben, mert a `hibak` felsorolását
   * a felhasználó olvassa: oda mezőnév nem kerülhet.
   */
  mezo?: string;
};

function hiba(uzenet: string, hibak: string[] = [], mezo?: string): Eredmeny {
  return { allapot: "hiba", uzenet, hibak, mezo };
}

function szoveg(nyers: unknown): string {
  return String(nyers ?? "").trim();
}

function napotOlvas(nyers: unknown): Date | null {
  const ertek = szoveg(nyers);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ertek)) return null;
  const nap = new Date(`${ertek}T00:00:00.000Z`);
  return Number.isNaN(nap.getTime()) ? null : nap;
}

/** Új tervezet a jogviszony adataiból, az ajánlott modulkészlettel. */
export async function szerzodestKeszit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const jogviszonyId = szoveg(urlap.get("jogviszonyId"));

  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId: berbeado.id } },
    include: {
      ingatlan: true,
      berlok: { orderBy: [{ sorrend: "asc" }, { id: "asc" }] },
      elofizetesek: { include: { jovahagyasok: true } },
    },
  });
  if (!jogviszony) return hiba(sz("szerzodes.hiba.jogviszony_nem_tied"));
  if (jogviszony.berlok.length === 0) {
    return hiba(sz("szerzodes.hiba.nincs_berlo"));
  }

  const berbeadoiAdatok = await prisma.berbeadoiAdatok.findUnique({
    where: { berbeadoId: berbeado.id },
  });

  const ajanlott = ajanlottModulok({
    berbeado: {
      nev: berbeado.nev,
      email: berbeado.email,
      lakcim: berbeadoiAdatok?.lakcim ?? null,
      bankszamla: berbeadoiAdatok?.bankszamla ?? null,
    },
    berlok: jogviszony.berlok.map((berlo) => ({ nev: berlo.nev })),
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
    // Ha van előfizetés, az előfizetési pontot is ajánljuk: enélkül a
    // bérbeadónak kellene rájönnie, hogy van ilyen modul.
    elofizetesek: jogviszony.elofizetesek.map((sor) => ({
      megnevezes: sor.megnevezes,
      fajta: sor.fajta,
      szolgaltato: sor.szolgaltato,
      elofizeto: sor.elofizeto,
      haviDijFt: sor.haviDijFt,
    })),
  });

  // A kötelező modulok mindig bekerülnek a szövegbe, ezért csak a választhatókat
  // mentjük el: a lista így azt mutatja, amit a bérbeadó valóban eldöntött.
  const valaszthatok = ajanlott.filter((kulcs) => modultKeres(kulcs)?.kotelezo === false);

  const szerzodes = await prisma.szerzodes.create({
    data: {
      jogviszonyId,
      // A tervezet neve a bérbeadó akkori nyelvén készül: elmentett szöveg, ami
      // később nem tud nyelvet váltani. A szerződés szövege ettől függetlenül magyar.
      megnevezes: sz("szerzodes.megnevezes", { ingatlan: jogviszony.ingatlan.megnevezes }),
      modulok: { create: valaszthatok.map((kulcs, sorrend) => ({ kulcs, sorrend })) },
    },
  });

  revalidatePath("/szerzodesek");
  redirect(`/szerzodesek/${szerzodes.id}`);
}

/**
 * Modul be- vagy kikapcsolása. Szerződésben a kötelező modult nem lehet
 * kikapcsolni; záradékban viszont nincs kötelező modul, mert a záradék nem egy
 * második teljes szerződés — ott minden pont szabadon választható.
 */
export async function modultValt(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));
  const kulcs = szoveg(urlap.get("kulcs"));

  const modul = modultKeres(kulcs);
  if (!modul) return hiba(sz("szerzodes.hiba.nincs_modul"));

  const szerzodes = await prisma.szerzodes.findFirst({
    where: { id: szerzodesId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
    include: { modulok: true },
  });
  if (!szerzodes) return hiba(sz("szerzodes.hiba.nem_tied"));
  if (modul.kotelezo && szerzodes.fajta !== "zaradek") {
    return hiba(sz("szerzodes.hiba.kotelezo_modul"));
  }
  if (szerzodes.allapot !== "tervezet") {
    return hiba(sz("szerzodes.hiba.vegleges_nem_valtozik"));
  }

  const megvan = szerzodes.modulok.find((sor) => sor.kulcs === kulcs);
  if (megvan) {
    await prisma.szerzodesModul.delete({ where: { id: megvan.id } });
  } else {
    await prisma.szerzodesModul.create({
      data: { szerzodesId, kulcs, sorrend: szerzodes.modulok.length },
    });
  }

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  return {
    allapot: "kesz",
    uzenet: sz(megvan ? "szerzodes.kesz.modul_ki" : "szerzodes.kesz.modul_be", {
      cim: modul.cim,
    }),
    hibak: [],
  };
}

/** A paraméterek mentése. Az üresen hagyott mező visszaáll alapértelmezésre. */
export async function parametereketMenti(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  const szerzodes = await prisma.szerzodes.findFirst({
    where: { id: szerzodesId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
  });
  if (!szerzodes) return hiba(sz("szerzodes.hiba.nem_tied"));
  if (szerzodes.allapot !== "tervezet") {
    return hiba(sz("szerzodes.hiba.vegleges_nem_valtozik"));
  }

  const kelteHelye = szoveg(urlap.get("kelteHelye"));
  const kelte = napotOlvas(urlap.get("kelte"));

  const mentendok: { kulcs: string; ertek: string }[] = [];
  for (const [kulcs, nyers] of urlap.entries()) {
    if (!kulcs.startsWith("p_")) continue;
    mentendok.push({ kulcs: kulcs.slice(2), ertek: szoveg(nyers) });
  }

  await prisma.$transaction([
    prisma.szerzodes.update({
      where: { id: szerzodesId },
      data: { kelteHelye, kelte },
    }),
    ...mentendok.map((sor) =>
      sor.ertek === ""
        ? prisma.szerzodesParameter.deleteMany({ where: { szerzodesId, kulcs: sor.kulcs } })
        : prisma.szerzodesParameter.upsert({
            where: { szerzodesId_kulcs: { szerzodesId, kulcs: sor.kulcs } },
            create: { szerzodesId, kulcs: sor.kulcs, ertek: sor.ertek },
            update: { ertek: sor.ertek },
          }),
    ),
  ]);

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  return { allapot: "kesz", uzenet: sz("szerzodes.kesz.parameterek"), hibak: [] };
}

/**
 * Egy szakasz szövegének átírása, és az alapértelmezés visszaállítása.
 *
 * A katalógus szövege az alapértelmezés, nem a kizárólagos szöveg: a
 * bérbeadók helyzete különbözik, és ami minden szerződésre jó, az egyikre sem
 * a legjobb. Aki átírja, az attól még ugyanazt a szerződést készíti: a
 * szakasz sorszáma, címe és helye a katalógusé marad, hogy a két nyelv
 * példánya és a felek hivatkozásai ne csússzanak el.
 *
 * Üres mezővel az alapértelmezés jön vissza — ugyanaz a szabály, mint a
 * paramétereknél. Külön „visszaállítás" gomb nem kell hozzá, és egy külön
 * gombból előbb-utóbb két szabály lenne.
 *
 * Amit a bérbeadó átírt, az **nem** az ügyvéddel ellenjegyzett szöveg többé.
 * Ezt a lap ki is mondja: az ellenjegyzés a katalógus mondataira vonatkozik,
 * nem arra, amit fölé gépeltek.
 */
export async function szakasztMenti(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));
  const kulcs = szoveg(urlap.get("kulcs"));

  const modul = modultKeres(kulcs);
  if (!modul) return hiba(sz("szerzodes.hiba.nincs_modul"));

  const szerzodes = await prisma.szerzodes.findFirst({
    where: { id: szerzodesId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
  });
  if (!szerzodes) return hiba(sz("szerzodes.hiba.nem_tied"));
  // Amit a felek aláírtak, azt nem írjuk át. Ezt a kiszolgáló tartja be, nem a
  // mező elrejtése: a lap nyitva maradhat akkor is, amikor a véglegesítés egy
  // másik fülön megtörténik.
  if (szerzodes.allapot !== "tervezet") {
    return hiba(sz("szerzodes.hiba.vegleges_nem_valtozik"));
  }

  const sajatSzoveg = bekezdesekre(String(urlap.get("szoveg") ?? "")).join("\n");
  const sajatAngol = bekezdesekre(String(urlap.get("szovegEn") ?? "")).join("\n");

  // Angol szöveg magyar nélkül nem értelmezhető: a szerződés a magyar, az
  // angol csak annak a fordítása. Magyar átírás nélkül a fordítás mást mondana,
  // mint az okirat, amit aláírnak — pont azt, amit a fordítás elve tilt.
  if (sajatSzoveg === "" && sajatAngol !== "") {
    return hiba(sz("szerzodes.hiba.angol_magyar_nelkul"), [], "szoveg");
  }

  if (sajatSzoveg === "") {
    await prisma.szerzodesSzoveg.deleteMany({ where: { szerzodesId, kulcs } });
  } else {
    await prisma.szerzodesSzoveg.upsert({
      where: { szerzodesId_kulcs: { szerzodesId, kulcs } },
      create: { szerzodesId, kulcs, szoveg: sajatSzoveg, szovegEn: sajatAngol },
      update: { szoveg: sajatSzoveg, szovegEn: sajatAngol },
    });
  }

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  return {
    allapot: "kesz",
    uzenet: sz(sajatSzoveg === "" ? "szerzodes.kesz.szakasz_alap" : "szerzodes.kesz.szakasz", {
      cim: modul.cim,
    }),
    hibak: [],
  };
}

/**
 * Nyilatkozat a kétnyelvű példányról.
 *
 * Az okirat közös, és a másik fél nyelve nem a mi döntésünk: a kétnyelvű
 * példány csak akkor készül el, ha a bérbeadói és a bérlői oldal minden
 * fiókkal rendelkező tagja támogatja. Egy kifogás egymagában dönt, és a
 * kifogás indoklás nélkül nincs — ugyanaz a kétoldali elv, mint az
 * előfizetésnél és a fényképnél.
 *
 * Mindkét szerep nyilatkozik, ezért itt nem `kotelezoSzerep` áll: a
 * jogosultság a jogviszonyból jön, nem az űrlapból.
 *
 * Csak tervezetre megy. A véglegesített szöveg be van fagyasztva, tehát egy
 * későbbi nyilatkozat már nem tudna kétnyelvű példányt csinálni belőle — és
 * a döntésnek amúgy is az aláírás előtt van értelme.
 */
export async function ketnyelvurolNyilatkozik(
  _elozo: Eredmeny,
  urlap: FormData,
): Promise<Eredmeny> {
  const felhasznalo = await belepettFelhasznalo();
  const { sz, u } = await szovegek();
  if (!felhasznalo) return hiba(sz("valasz.nincs_jogosultsag"));

  const szerzodesId = szoveg(urlap.get("szerzodesId"));
  const tamogatja = szoveg(urlap.get("tamogatja")) === "igen";
  const indoklas = szoveg(urlap.get("indoklas"));

  const baj = nyilatkozatotEllenoriz(tamogatja, indoklas);
  if (baj) return hiba(u(baj), [], "indoklas");

  const szerzodes = await prisma.szerzodes.findFirst({
    where: {
      id: szerzodesId,
      OR: [
        { jogviszony: { ingatlan: { tulajdonosId: felhasznalo.id } } },
        { jogviszony: { berlok: { some: { berloId: felhasznalo.id } } } },
      ],
    },
    select: { id: true, allapot: true },
  });
  if (!szerzodes) return hiba(sz("szerzodes.hiba.nem_tied"));
  if (szerzodes.allapot !== "tervezet") return hiba(sz("ketnyelvu.hiba.mar_vegleges"));

  const adat = { tamogatja, indoklas: tamogatja ? "" : indoklas, nyilatkozva: new Date() };
  await prisma.szerzodesNyelvNyilatkozat.upsert({
    where: {
      szerzodesId_felhasznaloId: { szerzodesId, felhasznaloId: felhasznalo.id },
    },
    create: { szerzodesId, felhasznaloId: felhasznalo.id, ...adat },
    update: adat,
  });

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  revalidatePath("/berlo/dokumentumok");
  revalidatePath("/dokumentumok");
  return {
    allapot: "kesz",
    uzenet: sz(tamogatja ? "ketnyelvu.kesz.tamogatom" : "ketnyelvu.kesz.kifogas"),
    hibak: [],
  };
}

/**
 * Véglegesítés: a szöveget befagyasztjuk. Ami hiányzik, azt itt még jelezzük,
 * de nem tiltjuk: a bérbeadó tudja, hogy papíron kitölti-e.
 */
export async function szerzodestVeglegesit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  const betoltott = await szerzodesBemenet(szerzodesId, berbeado.id);
  if (!betoltott) return hiba(sz("szerzodes.hiba.nem_tied"));
  if (betoltott.allapot !== "tervezet") return hiba(sz("szerzodes.hiba.mar_vegleges"));

  // A személyazonosság nyugtázása nélkül nem véglegesítünk. Ez nem igazolás:
  // az alkalmazás nem tudja ellenőrizni, ki kicsoda, ezért a felek nézik meg
  // egymás okmányát, és a bérbeadó ezt itt nyugtázza.
  if (szoveg(urlap.get("azonossagEllenorizve")) !== "igen") {
    return hiba(sz("szerzodes.hiba.nyugtazas"), [], "azonossagEllenorizve");
  }

  const hianyok = hianyzoAdatok(betoltott.bemenet);
  if (hianyok.length > 0 && szoveg(urlap.get("megis")) !== "igen") {
    return hiba(sz("szerzodes.hiba.hianyok"), hianyok.map(u));
  }

  await prisma.szerzodes.update({
    where: { id: szerzodesId },
    data: {
      allapot: "veglegesitve",
      veglegesSzoveg: okiratSzovege(betoltott.bemenet),
      // A fordítás ugyanitt fagy be. Ha később készülne, a modulkatalógus
      // közben változhatna, és a fordítás már nem azt mondaná, amit a mellette
      // álló magyar szöveg.
      veglegesSzovegEn: okiratSzovege(betoltott.bemenet, "en"),
      // A kétnyelvű példány csak akkor készül el, ha mindenki támogatta. A
      // fordítással együtt fagy be: ha később készülne, a modulkatalógus
      // közben változhatna, és a kétnyelvű példány már nem azt mondaná, amit
      // a mellette álló magyar szöveg.
      veglegesSzovegKet:
        ketnyelvuAllapota(
          betoltott.nyelvKerdezettek.map((fel) => fel.id),
          betoltott.nyelvNyilatkozatok,
        ) === "tamogatott"
          ? ketnyelvuSzovege(betoltott.bemenet)
          : null,
      veglegesitve: new Date(),
    },
  });

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  revalidatePath("/szerzodesek");
  return {
    allapot: "kesz",
    uzenet: sz("szerzodes.kesz.veglegesitve"),
    hibak: [],
  };
}

/**
 * Az aláírt szerződés példányának feltöltése vagy cseréje.
 *
 * Amit a felek aláírtak, az az okirat: a mi szövegünk csak addig volt az, amíg
 * nem került rá aláírás. Ezért kell tudni feltölteni, és ezért tölti le a bérlő
 * is — az okirat az övé is.
 *
 * A típust a tartalomból állapítjuk meg, nem a böngésző bemondásából: ezt a
 * fájlt a másik fél böngészője nyitja meg a mi címünkön.
 */
export async function alairtatFeltolt(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz, u } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  const fajl = urlap.get("alairt");
  if (!(fajl instanceof File)) return hiba(sz("alairt.hiba.ures"), [], "alairt");

  const tartalom = new Uint8Array(await fajl.arrayBuffer());
  const valodiTipus = tipusATartalombol(tartalom);
  const baj = alairtatEllenoriz({ tipus: valodiTipus ?? "", meretBajt: fajl.size });
  if (baj) return hiba(u(baj), [], "alairt");

  const eredmeny = await alairtatMent(berbeado.id, szerzodesId, {
    tipus: valodiTipus ?? "",
    tartalom,
  });
  if (eredmeny === "nincs_szerzodes") return hiba(sz("szerzodes.hiba.nem_tied"));
  if (eredmeny === "nem_vegleges") return hiba(sz("alairt.hiba.nem_vegleges"));
  if (eredmeny === "rogzitve") return hiba(sz("alairt.hiba.rogzitve"));

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  revalidatePath("/dokumentumok");
  revalidatePath("/berlo/dokumentumok");
  return { allapot: "kesz", uzenet: sz("alairt.kesz.feltoltve"), hibak: [] };
}

/** A feltöltött példány törlése, amíg nincs rögzítve. */
export async function alairtatTorolAction(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  const eredmeny = await alairtatTorol(berbeado.id, szerzodesId);
  if (eredmeny === "rogzitve") return hiba(sz("alairt.hiba.rogzitve"));
  if (eredmeny === "nincs") return hiba(sz("alairt.hiba.nincs"));

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  revalidatePath("/dokumentumok");
  revalidatePath("/berlo/dokumentumok");
  return { allapot: "kesz", uzenet: sz("alairt.kesz.torolve"), hibak: [] };
}

/**
 * Rögzítés: a feltöltött példány végleges lesz.
 *
 * Ez nem visszavonható, ezért nyugtázáshoz kötjük, ugyanúgy, mint a
 * véglegesítést. Enélkül egy elkattintott gomb betonozná be a rossz fájlt — és
 * pont az a lényege, hogy utána már nem cserélhető.
 */
export async function alairtatRogziti(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  if (szoveg(urlap.get("nyugtazas")) !== "igen") {
    return hiba(sz("alairt.hiba.nyugtazas"), [], "nyugtazas");
  }

  const eredmeny = await alairtatRogzit(berbeado.id, szerzodesId);
  if (eredmeny === "nincs") return hiba(sz("alairt.hiba.nincs"));
  if (eredmeny === "mar_rogzitve") return hiba(sz("alairt.hiba.rogzitve"));

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  return { allapot: "kesz", uzenet: sz("alairt.kesz.rogzitve"), hibak: [] };
}

/**
 * Véglegesítés visszavonása, amíg nem épült rá semmi.
 *
 * A visszavonás a `veglegesSzoveg`-et is törli, tehát amit a felek
 * elolvastak, az eltűnik, és a szöveg a mostani modulokból épül újra. Amíg
 * csak a bérbeadó nézte meg, ez rendben van: azért van a gomb.
 *
 * Két dolog után viszont nincs rendben, és ezt a kiszolgáló tartja be, nem a
 * gomb elrejtése:
 *
 * - **Ha van hozzá véglegesített záradék.** A záradék megnevezi az
 *   alapszerződést, és kimondja, hogy annak többi rendelkezése változatlanul
 *   hatályban marad — egy tervezetre visszaejtett alapszerződés mellett ez a
 *   mondat semmire nem mutatna.
 * - **Ha már állítottunk ki igazolást.** Az okirat szövege a szerződés keltét
 *   idézi, és a kelte a visszavonás után más lehet: a kiadott papír és a
 *   szerződés elcsúszna egymástól. Ami befagyott, azt nem olvasztjuk vissza.
 */
export async function veglegesitestVisszavon(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const szerzodesId = szoveg(urlap.get("szerzodesId"));

  const szerzodes = await prisma.szerzodes.findFirst({
    where: { id: szerzodesId, jogviszony: { ingatlan: { tulajdonosId: berbeado.id } } },
  });
  if (!szerzodes) return hiba(sz("szerzodes.hiba.nem_tied"));
  if (szerzodes.allapot === "tervezet") return hiba(sz("szerzodes.hiba.mar_tervezet"));

  const zaradekok = await prisma.szerzodes.count({
    where: { alapSzerzodesId: szerzodesId, allapot: { not: "tervezet" } },
  });
  if (zaradekok > 0) {
    return hiba(sz("szerzodes.hiba.van_zaradeka", { darab: zaradekok }));
  }

  const igazolasok = await prisma.igazolas.count({
    where: { jogviszonyBerlo: { jogviszonyId: szerzodes.jogviszonyId } },
  });
  if (igazolasok > 0) {
    return hiba(sz("szerzodes.hiba.van_igazolas", { darab: igazolasok }));
  }

  // És nem olvasztjuk vissza azt, amire már feltöltötték az aláírt példányt: a
  // visszavonás a szöveget a mostani modulokból építené újra, az aláírt fájl
  // pedig attól még ott maradna mellette — két különböző okirat, egymásnak
  // feszülve. Aki tévedett, előbb leveszi a feltöltött példányt.
  const alairt = await prisma.alairtSzerzodes.count({ where: { szerzodesId } });
  if (alairt > 0) {
    return hiba(sz("szerzodes.hiba.van_alairt"));
  }

  await prisma.szerzodes.update({
    where: { id: szerzodesId },
    data: {
      allapot: "tervezet",
      veglegesSzoveg: null,
      veglegesSzovegEn: null,
      veglegesSzovegKet: null,
      veglegesitve: null,
    },
  });

  revalidatePath(`/szerzodesek/${szerzodesId}`);
  revalidatePath("/szerzodesek");
  return { allapot: "kesz", uzenet: sz("szerzodes.kesz.visszaallt"), hibak: [] };
}

/**
 * Záradék egy hatályos szerződéshez.
 *
 * Amit a felek aláírtak, azt nem írjuk át: a `veglegesSzoveg` be is fagyasztja.
 * Ha a szerződés utóbb kiegészül — például előfizetéssel —, az külön okirat,
 * ami megnevezi az alapszerződést, és kimondja, hogy a többi rendelkezés
 * változatlanul hatályban marad.
 *
 * A záradék ugyanabban a táblában él, mint a szerződés, mert minden más
 * ugyanaz: modulokból épül, ugyanúgy véglegesül, ugyanúgy kerül a
 * dokumentumtárba, és a bérlő ugyanúgy csak véglegesítés után látja.
 */
export async function zaradekotKeszit(_elozo: Eredmeny, urlap: FormData): Promise<Eredmeny> {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz } = await szovegek();
  const alapId = szoveg(urlap.get("szerzodesId"));

  const alap = await prisma.szerzodes.findFirst({
    where: {
      id: alapId,
      fajta: "szerzodes",
      allapot: "veglegesitve",
      jogviszony: { ingatlan: { tulajdonosId: berbeado.id } },
    },
    include: { jogviszony: { include: { ingatlan: true } } },
  });
  // Tervezethez nem kell záradék: azt még szerkeszteni lehet.
  if (!alap) return hiba(sz("szerzodes.hiba.zaradek_csak_veglegeshez"));

  const zaradek = await prisma.szerzodes.create({
    data: {
      jogviszonyId: alap.jogviszonyId,
      fajta: "zaradek",
      alapSzerzodesId: alap.id,
      megnevezes: sz("szerzodes.zaradek_megnevezes", {
        ingatlan: alap.jogviszony.ingatlan.megnevezes,
      }),
      // Az előfizetési pont eleve be van kapcsolva: a záradék jellemzően épp
      // ezért készül, és üres záradékkal senki nem kezd semmit.
      modulok: { create: [{ kulcs: "elofizetesek", sorrend: 0 }] },
    },
  });

  revalidatePath("/szerzodesek");
  redirect(`/szerzodesek/${zaradek.id}`);
}
