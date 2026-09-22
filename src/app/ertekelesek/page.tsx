import { redirect } from "next/navigation";
import {
  ABLAK_NAP,
  SZEMPONTOK,
  hatralevoNap,
  pontja,
  szempontNeve,
  allapotJelzoje,
  allapotMondata,
  type ErtekelesAdat,
  type Irany,
} from "@/domain/ertekeles";
import {
  datumNyelven,
  type Adatok,
  type Nyelv,
  type Uzenet,
} from "@/domain/nyelv";
import {
  berbeadoErtekelesei,
  berloErtekelesei,
  type Nezet,
} from "@/lib/ertekeles";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import {
  Jelzo,
  Lapfej,
  Sugo,
  Ures,
  type Allapotszin,
} from "@/components/ui/alap";
import { ErtekelesUrlap } from "./Urlap";

export const dynamic = "force-dynamic";

/**
 * A kölcsönös értékelés lapja, ugyanaz a két szerepnek.
 *
 * Amit a lap nem tesz: nem mutatja a másik fél szövegét felfedés előtt. Ez nem
 * a megjelenítés dolga — a kiszolgáló nem is tölti be —, de a lapnak ki kell
 * mondania, miért nem, különben úgy tűnne, hogy elromlott valami.
 */
export default async function Ertekelesek() {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) redirect("/belepes");

  const { sz, u, nyelv } = await szovegek();
  const szerep = szerepe(felhasznalo);
  const ma = new Date();

  const sorok =
    szerep === "berbeado"
      ? await berbeadoErtekelesei(felhasznalo.id, ma)
      : await berloErtekelesei(felhasznalo.id, ma);

  return (
    <div className="grid gap-4">
      <Lapfej cim={sz("ertekeles.cim")} alcim={sz("ertekeles.alcim")} />

      <Sugo cim={sz("ertekeles.sugo_cim")}>
        {sz("ertekeles.sugo", { nap: ABLAK_NAP })}
      </Sugo>
      <Sugo cim={sz("ertekeles.nem_meres_cim")}>
        {sz("ertekeles.nem_meres")}
      </Sugo>

      {sorok.length === 0 ? <Ures>{sz("ertekeles.nincs")}</Ures> : null}

      {sorok.map((sor) => (
        <Sor
          key={`${sor.jogviszonyId}:${sor.masikFelId ?? "nincs"}`}
          sor={sor}
          nyelv={nyelv}
          ma={ma}
          sz={sz}
          u={u}
        />
      ))}
    </div>
  );
}

const SZIN: Record<Nezet["allapot"], Allapotszin> = {
  // A várakozás nem gond: a saját dolgát elvégezte, csak a másikra vár.
  nem_ideje: "semleges",
  irhato: "figyelem",
  varakozik: "semleges",
  lathato: "rendben",
  elmaradt: "semleges",
};

type Szoveg = (kulcs: string, adatok?: Adatok) => string;
type Uzenetezo = (uzenet: Uzenet) => string;

function Sor({
  sor,
  nyelv,
  ma,
  sz,
  u,
}: {
  sor: Nezet;
  nyelv: Nyelv;
  ma: Date;
  sz: Szoveg;
  u: Uzenetezo;
}) {
  const hatra = hatralevoNap(sor.vege, ma);
  const szempontok = SZEMPONTOK[sor.sajatIrany].map((kulcs) => ({
    kulcs,
    cimke: u(szempontNeve(sor.sajatIrany, kulcs)),
  }));
  const meglevoPontok = Object.fromEntries(
    (sor.sajat?.pontok ?? []).map((pont) => [pont.szempont, pont.pont]),
  );

  return (
    <section className="rounded-kartya border border-keret bg-felulet p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold tracking-tight">
            {sor.cimke}
          </h2>
          <p className="text-sm text-halvany">
            {sz("ertekeles.masik_fel", { nev: sor.masikFelNeve })}
          </p>
          {sor.vege ? (
            <p className="text-sm text-halvany">
              {sz("ertekeles.lezarva_nap", {
                nap: datumNyelven(sor.vege, nyelv),
              })}
            </p>
          ) : null}
        </div>
        <Jelzo allapot={SZIN[sor.allapot]}>
          {u(allapotJelzoje(sor.allapot))}
        </Jelzo>
      </div>

      <p className="mt-3 text-sm text-halvany">
        {u(allapotMondata(sor.allapot))}
      </p>

      {sor.masikFelId === null ? (
        <p className="mt-3 text-sm text-halvany">
          {sz("ertekeles.nincs_fiok")}
        </p>
      ) : null}

      {hatra !== null && sor.irhato ? (
        <p className="mt-3 text-sm text-halvany">
          {sz("ertekeles.hatralevo", { nap: hatra })}
        </p>
      ) : null}

      {sor.sajat ? (
        <Ertekeles
          cim={sz("ertekeles.sajat_cim")}
          ertekeles={sor.sajat}
          irany={sor.sajatIrany}
          nyelv={nyelv}
          sz={sz}
          u={u}
        />
      ) : null}

      {sor.masike ? (
        <Ertekeles
          cim={sz("ertekeles.masike_cim", { nev: sor.masikFelNeve })}
          ertekeles={sor.masike}
          irany={sor.masike.irany}
          nyelv={nyelv}
          sz={sz}
          u={u}
        />
      ) : null}

      {sor.irhato && sor.masikFelId ? (
        <ErtekelesUrlap
          jogviszonyId={sor.jogviszonyId}
          masikFelId={sor.masikFelId}
          szempontok={szempontok}
          meglevoSzoveg={sor.sajat?.szoveg ?? ""}
          meglevoPontok={meglevoPontok}
          cimkek={{
            cim: sor.sajat
              ? sz("ertekeles.urlap_modosit")
              : sz("ertekeles.urlap_cim"),
            modosithato: sz("ertekeles.modosithato"),
            szovegCimke: sz("ertekeles.szoveg_cimke"),
            szovegSugo: sz("ertekeles.szoveg_sugo"),
            gomb: sz("ertekeles.kuld"),
            folyamatban: sz("ertekeles.kuldom"),
          }}
        />
      ) : null}
    </section>
  );
}

function Ertekeles({
  cim,
  ertekeles,
  irany,
  nyelv,
  sz,
  u,
}: {
  cim: string;
  ertekeles: ErtekelesAdat;
  irany: Irany;
  nyelv: Nyelv;
  sz: Szoveg;
  u: Uzenetezo;
}) {
  return (
    <div className="mt-3 border-t border-keret pt-3">
      <h3 className="text-sm font-medium">{cim}</h3>
      <ul className="mt-2 grid gap-1 text-sm">
        {SZEMPONTOK[irany].map((szempont) => {
          const pont = pontja(ertekeles, szempont);
          if (pont === null) return null;
          return (
            <li key={szempont}>
              {sz("ertekeles.pont_cimke", {
                szempont: u(szempontNeve(irany, szempont)),
                pont,
              })}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-sm whitespace-pre-line">{ertekeles.szoveg}</p>
      <p className="mt-1 text-xs text-nagyon-halvany">
        {datumNyelven(ertekeles.letrehozva, nyelv)}
      </p>
    </div>
  );
}
