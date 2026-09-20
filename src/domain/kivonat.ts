/**
 * Bankszámlakivonat beolvasása.
 *
 * A magyar bankok CSV-je oszlopnevekben és elválasztóban is eltér, ezért a
 * fejlécet felismerjük, nem pozíció szerint olvasunk. Ami nem ismerhető fel,
 * az nem néma hiba: a beolvasás megmondja, melyik sorral mi a baj.
 */

import { osszegetForintra } from "./penz";

export type KivonatSor = {
  konyvelesDatuma: Date;
  osszegFt: number;
  kozlemeny: string | null;
  partnerNev: string | null;
  nyersSor: string;
  ujjlenyomat: string;
};

export type KivonatHiba = { sorszam: number; ok: string; nyersSor: string };

export type KivonatEredmeny = {
  sorok: KivonatSor[];
  hibak: KivonatHiba[];
};

const DATUM_FEJLECEK = [
  "könyvelés dátuma",
  "konyveles datuma",
  "tranzakció dátuma",
  "tranzakcio datuma",
  "dátum",
  "datum",
  "date",
];
const OSSZEG_FEJLECEK = ["összeg", "osszeg", "jóváírás", "jovairas", "amount"];
const KOZLEMENY_FEJLECEK = ["közlemény", "kozlemeny", "megjegyzés", "megjegyzes", "narrative"];
const PARTNER_FEJLECEK = [
  "partner neve",
  "ellenoldali név",
  "ellenoldali nev",
  "partner",
  "megbízó neve",
  "megbizo neve",
];

/** Idézőjelet és beágyazott elválasztót is kezelő CSV-sorbontás. */
export function csvSortBont(sor: string, elvalaszto: string): string[] {
  const mezok: string[] = [];
  let aktualis = "";
  let idezojelben = false;

  for (let i = 0; i < sor.length; i++) {
    const karakter = sor[i];
    if (idezojelben) {
      if (karakter === '"') {
        if (sor[i + 1] === '"') {
          aktualis += '"';
          i++;
        } else {
          idezojelben = false;
        }
      } else {
        aktualis += karakter;
      }
    } else if (karakter === '"') {
      idezojelben = true;
    } else if (karakter === elvalaszto) {
      mezok.push(aktualis.trim());
      aktualis = "";
    } else {
      aktualis += karakter;
    }
  }
  mezok.push(aktualis.trim());
  return mezok;
}

export function elvalasztotFelismer(fejlecSor: string): string {
  const jeloltek = [";", ",", "\t", "|"];
  let legjobb = ";";
  let legtobb = -1;
  for (const jelolt of jeloltek) {
    const darab = csvSortBont(fejlecSor, jelolt).length;
    if (darab > legtobb) {
      legtobb = darab;
      legjobb = jelolt;
    }
  }
  return legjobb;
}

function oszlopIndex(fejlecek: string[], nevek: string[]): number {
  return fejlecek.findIndex((fejlec) => {
    const normalizalt = fejlec.toLowerCase().trim();
    return nevek.some((nev) => normalizalt === nev || normalizalt.includes(nev));
  });
}

/** Dátum több formátumból: 2026-09-05, 2026.09.05, 05/09/2026. */
export function datumotOlvas(nyers: string): Date | null {
  const tisztitott = nyers.trim();
  if (tisztitott === "") return null;

  const izo = tisztitott.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (izo) return ujDatum(+izo[1], +izo[2], +izo[3]);

  const magyar = tisztitott.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
  if (magyar) return ujDatum(+magyar[3], +magyar[2], +magyar[1]);

  return null;
}

function ujDatum(ev: number, honap: number, nap: number): Date | null {
  if (honap < 1 || honap > 12 || nap < 1 || nap > 31) return null;
  const ertek = new Date(Date.UTC(ev, honap - 1, nap));
  return Number.isNaN(ertek.getTime()) ? null : ertek;
}

function ujjlenyomatot(sor: string): string {
  // Egyszerű, stabil ujjlenyomat: ugyanaz a kivonatsor kétszer ne kerüljön be.
  let hash = 5381;
  const normalizalt = sor.replace(/\s+/g, " ").trim();
  for (let i = 0; i < normalizalt.length; i++) {
    hash = ((hash << 5) + hash + normalizalt.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function kivonatotOlvas(tartalom: string): KivonatEredmeny {
  const sorok = tartalom
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((sor) => sor.trim() !== "");

  if (sorok.length === 0) {
    return { sorok: [], hibak: [{ sorszam: 0, ok: "A fájl üres.", nyersSor: "" }] };
  }

  const elvalaszto = elvalasztotFelismer(sorok[0]);
  const fejlecek = csvSortBont(sorok[0], elvalaszto);
  const datumIndex = oszlopIndex(fejlecek, DATUM_FEJLECEK);
  const osszegIndex = oszlopIndex(fejlecek, OSSZEG_FEJLECEK);
  const kozlemenyIndex = oszlopIndex(fejlecek, KOZLEMENY_FEJLECEK);
  const partnerIndex = oszlopIndex(fejlecek, PARTNER_FEJLECEK);

  if (datumIndex === -1 || osszegIndex === -1) {
    return {
      sorok: [],
      hibak: [
        {
          sorszam: 1,
          ok: "A fejlécben nem találtam dátum- és összegoszlopot.",
          nyersSor: sorok[0],
        },
      ],
    };
  }

  const eredmeny: KivonatSor[] = [];
  const hibak: KivonatHiba[] = [];
  const latottUjjlenyomatok = new Set<string>();

  for (let i = 1; i < sorok.length; i++) {
    const nyersSor = sorok[i];
    const mezok = csvSortBont(nyersSor, elvalaszto);
    const konyvelesDatuma = datumotOlvas(mezok[datumIndex] ?? "");
    const osszegFt = osszegetForintra(mezok[osszegIndex] ?? "");

    if (!konyvelesDatuma) {
      hibak.push({ sorszam: i + 1, ok: "Nem értelmezhető dátum.", nyersSor });
      continue;
    }
    if (osszegFt === null) {
      hibak.push({ sorszam: i + 1, ok: "Nem értelmezhető összeg.", nyersSor });
      continue;
    }

    const ujjlenyomat = ujjlenyomatot(nyersSor);
    if (latottUjjlenyomatok.has(ujjlenyomat)) {
      hibak.push({ sorszam: i + 1, ok: "Ismétlődő sor, kihagytam.", nyersSor });
      continue;
    }
    latottUjjlenyomatok.add(ujjlenyomat);

    eredmeny.push({
      konyvelesDatuma,
      osszegFt,
      kozlemeny: kozlemenyIndex === -1 ? null : mezok[kozlemenyIndex] || null,
      partnerNev: partnerIndex === -1 ? null : mezok[partnerIndex] || null,
      nyersSor,
      ujjlenyomat,
    });
  }

  return { sorok: eredmeny, hibak };
}
