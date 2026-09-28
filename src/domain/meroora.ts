/**
 * Mérőóra és díjszabás.
 *
 * Eddig mérőórát és díjszabást csak a példaadat hozott létre: új bérleményen a
 * felület kiírta, hogy „nincs mérőóra felvéve", de nem volt hová felvenni —
 * vagyis a termék egyik meghirdetett előnye, a magyar rezsilogika, elérhetetlen
 * volt a bérbeadónak.
 *
 * Ez a modul azt mondja meg, mi számít érvényes mérőórának és díjszabásnak. A
 * szabályok nem formaiak: mindegyik mögött egy elszámolási hiba áll, ami
 * enélkül csak a bérlő számláján derülne ki.
 */

import { uzenet, type Uzenet } from "./nyelv";

export type MerooraTipus = "villany" | "viz" | "gaz" | "futes";

export const MEROORA_TIPUSOK: MerooraTipus[] = ["villany", "viz", "gaz", "futes"];

/**
 * Melyik mérőórához milyen mértékegység tartozhat.
 *
 * Nem szabad szöveg: a mértékegység végigmegy az elszámolás minden során és a
 * részletezésen is, tehát egy elgépelt „m³" és „m3" két különböző mérőórának
 * látszana ugyanazon a lapon. A fűtésnél kettő is szóba jön, mert a
 * távhőszolgáltató GJ-ban számláz, a hőmennyiségmérő viszont sokszor kWh-t mutat.
 */
export const MERTEKEGYSEGEK: Record<MerooraTipus, string[]> = {
  villany: ["kWh"],
  viz: ["m3"],
  gaz: ["m3", "kWh"],
  futes: ["GJ", "kWh"],
};

export function alapMertekegyseg(tipus: MerooraTipus): string {
  return MERTEKEGYSEGEK[tipus][0];
}

export function tipusE(ertek: string): ertek is MerooraTipus {
  return (MEROORA_TIPUSOK as string[]).includes(ertek);
}

export type MerooraBemenet = {
  tipus: string;
  mertekegyseg: string;
  gyariSzam: string | null;
  almero: boolean;
};

export function merooratEllenoriz(bemenet: MerooraBemenet): Uzenet[] {
  const hibak: Uzenet[] = [];

  if (!tipusE(bemenet.tipus)) {
    hibak.push(uzenet("meroora.hiba.tipus"));
    return hibak;
  }
  if (!MERTEKEGYSEGEK[bemenet.tipus].includes(bemenet.mertekegyseg)) {
    hibak.push(
      uzenet("meroora.hiba.mertekegyseg", {
        egysegek: MERTEKEGYSEGEK[bemenet.tipus].join(", "),
      }),
    );
  }
  // A gyári szám nem kötelező — sok mérőn nem is olvasható le —, de ha megadták,
  // legyen az, ami az órán áll, ne egy fél mondat.
  if (bemenet.gyariSzam !== null && bemenet.gyariSzam.length > 40) {
    hibak.push(uzenet("meroora.hiba.gyari_szam"));
  }
  return hibak;
}

/** Egy díjszabás fillérben megadott ára ennél nagyobb nem lehet. */
export const LEGNAGYOBB_AR_FILLER = 100_000_00;

/** És egy havi alapdíj ennél nagyobb nem lehet. */
export const LEGNAGYOBB_ALAPDIJ_FT = 1_000_000;

export type DijszabasBemenet = {
  /** Melyik mérőóráé: a csatornadíj csak vízórán értelmes. */
  tipus: MerooraTipus;
  ervenyesTol: Date | null;
  kedvezmenyesArFiller: number | null;
  piaciArFiller: number | null;
  evesKeret: number | null;
  alapdijFt: number | null;
  csatornaArFiller: number | null;
};

export function dijszabastEllenoriz(bemenet: DijszabasBemenet): Uzenet[] {
  const hibak: Uzenet[] = [];

  if (!bemenet.ervenyesTol) hibak.push(uzenet("dijszabas.hiba.datum"));

  const ar = (ertek: number | null, kulcs: string) => {
    if (ertek === null || !Number.isInteger(ertek) || ertek < 0) {
      hibak.push(uzenet(kulcs));
      return null;
    }
    if (ertek > LEGNAGYOBB_AR_FILLER) {
      hibak.push(uzenet("dijszabas.hiba.tul_nagy"));
      return null;
    }
    return ertek;
  };

  const kedvezmenyes = ar(bemenet.kedvezmenyesArFiller, "dijszabas.hiba.kedvezmenyes");
  const piaci = ar(bemenet.piaciArFiller, "dijszabas.hiba.piaci");

  if (
    bemenet.alapdijFt === null ||
    !Number.isInteger(bemenet.alapdijFt) ||
    bemenet.alapdijFt < 0 ||
    bemenet.alapdijFt > LEGNAGYOBB_ALAPDIJ_FT
  ) {
    hibak.push(uzenet("dijszabas.hiba.alapdij"));
  }

  // A keret elhagyható: van, ahol nincs kétsávos rendszer. Ha viszont van, a
  // piaci ár nem lehet olcsóbb a kedvezményesnél — abból a keret fölötti
  // fogyasztás lenne a jutalom, és a bérlő a saját számlájával venné észre.
  if (bemenet.evesKeret !== null) {
    if (!Number.isFinite(bemenet.evesKeret) || bemenet.evesKeret <= 0) {
      hibak.push(uzenet("dijszabas.hiba.keret"));
    } else if (kedvezmenyes !== null && piaci !== null && piaci < kedvezmenyes) {
      hibak.push(uzenet("dijszabas.hiba.piaci_kisebb"));
    }
  }

  // A csatornadíj a vízóra díjszabásának része, nem külön mérőóráé: a mért
  // köbméter után két díj jár, az ivóvízé és a szennyvízelvezetésé. Máshol nincs
  // mit elvezetni, és egy ide beírt szám csendben megduplázná a villanyszámlát.
  const csatorna = bemenet.csatornaArFiller ?? 0;
  if (csatorna !== 0 && bemenet.tipus !== "viz") {
    hibak.push(uzenet("dijszabas.hiba.csatorna_nem_viz"));
  }
  if (csatorna < 0 || !Number.isInteger(csatorna) || csatorna > LEGNAGYOBB_AR_FILLER) {
    hibak.push(uzenet("dijszabas.hiba.csatorna"));
  }

  return hibak;
}

/**
 * Figyelmeztetés, nem kifogás: elmentjük, de megmondjuk, minek mi lesz a
 * következménye. Egy magánbérbeadó nem tudja fejből a rezsicsökkentés
 * keretszámait, és ettől még el kell tudnia indulni.
 */
export function dijszabasFigyelmeztetesei(bemenet: DijszabasBemenet): Uzenet[] {
  const figyelmeztetesek: Uzenet[] = [];
  if (bemenet.evesKeret === null) {
    figyelmeztetesek.push(uzenet("dijszabas.figyelem.nincs_keret"));
  }
  if (bemenet.tipus === "viz" && (bemenet.csatornaArFiller ?? 0) === 0) {
    figyelmeztetesek.push(uzenet("dijszabas.figyelem.nincs_csatorna"));
  }
  return figyelmeztetesek;
}
