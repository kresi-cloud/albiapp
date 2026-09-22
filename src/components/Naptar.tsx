import Link from "next/link";
import type { NaptarHonap, NaptarNap } from "@/domain/naptar";
import { hetNapjaiNyelven, honapNyelven, type Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import type { Surgosseg } from "@/domain/teendok";
import { IkonNyil } from "@/components/ui/ikonok";

/**
 * A havi naptárrács.
 *
 * Miért rács, és nem egy második lista: a listából az derül ki, mi van hátra,
 * a rácsból az, hogy mikor. Egy bérbeadónak a második kérdés az igazi — nem
 * az, hogy hány dolga van, hanem hogy a jövő héten hány napon kell ráérnie.
 * Ehhez az üres nap is adat, és azt egy lista nem tudja megmutatni.
 *
 * Kiszolgáló nélkül működik: a hónapváltás és a napválasztás is hivatkozás,
 * nem kattintáskezelő. Telefonon ez azért számít, mert így a vissza gomb is
 * odavisz, ahonnan jött.
 *
 * Egy cellába egy jelzés fér, a legsürgetőbb — ezt a `naptar.ts` dönti el, nem
 * a megjelenítés, hogy a lista és a rács ne mondhasson mást ugyanarról a napról.
 */

const PONT: Record<Surgosseg, string> = {
  lejart: "bg-gond",
  ma: "bg-figyelem",
  kozeli: "bg-albi-700",
  kesobbi: "bg-keret-eros",
};

export function Naptar({
  honap,
  nyelv,
  utvonal,
  valasztottNap,
}: {
  honap: NaptarHonap;
  nyelv: Nyelv;
  /** A lap saját útvonala: a hónapváltás és a napválasztás ide mutat vissza. */
  utvonal: string;
  /** "ÉÉÉÉ-HH-NN" vagy null. */
  valasztottNap: string | null;
}) {
  const { sz } = szovegekNyelvvel(nyelv);
  const napNevek = hetNapjaiNyelven(nyelv);

  return (
    <section className="rounded-kartya border border-keret bg-felulet p-3">
      <div className="flex items-center justify-between gap-2">
        <Lepes
          href={`${utvonal}?honap=${honap.elozo}`}
          cimke={sz("naptar.elozo")}
          balra
        />
        <h2 className="font-display min-w-0 text-center text-base font-bold tracking-tight">
          {honapNyelven(honap.idoszak, nyelv)}
        </h2>
        <Lepes href={`${utvonal}?honap=${honap.kovetkezo}`} cimke={sz("naptar.kovetkezo")} />
      </div>

      <div className="mt-3 grid grid-cols-7 gap-0.5">
        {napNevek.map((nev, i) => (
          <div
            key={nev}
            className={`pb-1 text-center text-[0.65rem] font-semibold tracking-wide uppercase ${
              i >= 5 ? "text-nagyon-halvany" : "text-halvany"
            }`}
          >
            {nev}
          </div>
        ))}
        {honap.hetek.flat().map((nap) => (
          <Cella
            key={nap.nap.toISOString()}
            nap={nap}
            utvonal={utvonal}
            honap={honap.idoszak}
            valasztott={valasztottNap === napKulcs(nap.nap)}
            cimke={
              nap.teendok.length > 0
                ? sz("naptar.nap_teendoi", {
                    nap: nap.sorszam,
                    darab: nap.teendok.length,
                  })
                : ""
            }
          />
        ))}
      </div>

      {honap.lejartMashonnan > 0 ? (
        <p className="mt-3 text-xs leading-snug text-gond">
          {sz("naptar.lejart_mashonnan", { darab: honap.lejartMashonnan })}
        </p>
      ) : null}
    </section>
  );
}

/** "ÉÉÉÉ-HH-NN" — a napválasztás hivatkozásában ez az azonosító. */
export function napKulcs(nap: Date): string {
  const honap = String(nap.getUTCMonth() + 1).padStart(2, "0");
  const sorszam = String(nap.getUTCDate()).padStart(2, "0");
  return `${nap.getUTCFullYear()}-${honap}-${sorszam}`;
}

function Lepes({
  href,
  cimke,
  balra = false,
}: {
  href: string;
  cimke: string;
  balra?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={cimke}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-halvany transition-colors hover:bg-felulet-halk hover:text-szoveg"
    >
      <IkonNyil meret={18} osztaly={balra ? "rotate-180" : undefined} />
    </Link>
  );
}

function Cella({
  nap,
  utvonal,
  honap,
  valasztott,
  cimke,
}: {
  nap: NaptarNap;
  utvonal: string;
  honap: string;
  valasztott: boolean;
  /** Képernyőolvasónak: mit nyit meg ez a nap. Üres, ha nincs teendő. */
  cimke: string;
}) {
  // A szám színe a napról szól, nem a teendőről: a szomszéd hónap és a
  // hétvége halványabb, a mai nap kiemelt. A teendőt a pont mondja el.
  const szamSzin = !nap.honapban
    ? "text-nagyon-halvany"
    : nap.ma
      ? "text-kiemelt font-bold"
      : nap.hetvege
        ? "text-halvany"
        : "text-szoveg";

  const keret = valasztott
    ? "border-albi-700 bg-kiemelt-lap"
    : nap.ma
      ? "border-keret-eros"
      : "border-transparent";

  const tartalom = (
    <>
      <span className={`text-sm leading-none ${szamSzin}`}>{nap.sorszam}</span>
      <span className="mt-1 flex h-1.5 items-center gap-0.5">
        {nap.jelzes ? (
          <span className={`size-1.5 rounded-full ${PONT[nap.jelzes]}`} />
        ) : null}
        {nap.teendok.length > 1 ? (
          <span className="text-[0.6rem] leading-none text-halvany">
            {nap.teendok.length}
          </span>
        ) : null}
      </span>
    </>
  );

  const osztaly = `flex min-h-11 flex-col items-center justify-center rounded-lg border ${keret}`;

  // Teendő nélküli napra nincs mit megnyitni: egy üres nap hivatkozása csak
  // azt tanítaná meg, hogy a koppintás néha nem csinál semmit.
  if (nap.teendok.length === 0) {
    return <div className={osztaly}>{tartalom}</div>;
  }

  return (
    <Link
      href={`${utvonal}?honap=${honap}&nap=${napKulcs(nap.nap)}`}
      aria-label={cimke}
      className={`${osztaly} transition-colors hover:bg-felulet-halk`}
    >
      {tartalom}
    </Link>
  );
}
