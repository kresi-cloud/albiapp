import { Teendolista } from "@/components/Teendolista";
import { GombHivatkozas, Jelzo, Osszeg, Szakaszcim, Lapfej } from "@/components/ui/alap";
import { IkonNyil } from "@/components/ui/ikonok";
import { jogviszonyNezetek, teendok } from "@/lib/lekerdezesek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { forintNyelven } from "@/domain/nyelv";
import { szovegek } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

export default async function Attekinto() {
  const berbeado = await kotelezoSzerep("berbeado");
  const { nyelv, sz } = await szovegek();

  const ma = new Date();
  const [sajatTeendok, nezetek] = await Promise.all([
    teendok(berbeado.id, "berbeado", ma),
    jogviszonyNezetek(berbeado.id, ma),
  ]);

  const kozeliek = sajatTeendok.filter((teendo) => teendo.surgosseg !== "kesobbi");
  const kesobbiek = sajatTeendok.filter((teendo) => teendo.surgosseg === "kesobbi");

  const osszesEgyeztetes = nezetek.flatMap((nezet) => nezet.egyeztetesek);
  const rendezetlen = osszesEgyeztetes.filter((sor) => sor.allapot !== "egyezik");
  const elmaradasFt = rendezetlen
    .filter((sor) => sor.elteresFt < 0)
    .reduce((osszeg, sor) => osszeg + Math.abs(sor.elteresFt), 0);

  return (
    <div className="grid gap-6">
      <Lapfej
        cim={sz("attekinto.koszones", { nev: berbeado.nev })}
        alcim={sz("attekinto.alcim")}
      />

      {/*
        Egy szám elöl, nem három egyforma doboz.

        Korábban három egyforma kártya állt itt egymás alatt — jogviszony,
        rendezetlen tétel, elmaradás —, és telefonon mind a három a képernyő
        felét elvitte, mielőtt bármelyik teendő látszott volna. Holott a három
        közül egy az, amire a bérbeadó kíváncsi: mennyi pénz hiányzik. A másik
        kettő azt mondja meg, mekkora halmazból jön, tehát alá való, apróbb
        betűvel — és a kártya egyben hivatkozás is oda, ahol tenni lehet vele
        valamit.
      */}
      <Osszegzo
        elmaradasFt={elmaradasFt}
        rendezetlenDarab={rendezetlen.length}
        jogviszonyDarab={nezetek.length}
        nyelv={nyelv}
        sz={sz}
      />

      <section>
        <Szakaszcim>{sz("attekinto.most")}</Szakaszcim>
        <Teendolista teendok={kozeliek} nyelv={nyelv} />
      </section>

      {kesobbiek.length > 0 ? (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-base font-bold tracking-tight">
            <span className="font-display">{sz("attekinto.kesobb")}</span>
            <span className="text-sm font-medium text-halvany">({kesobbiek.length})</span>
            <IkonNyil
              meret={16}
              osztaly="text-nagyon-halvany rotate-90 transition-transform group-open:-rotate-90"
            />
          </summary>
          <div className="mt-2">
            <Teendolista teendok={kesobbiek} nyelv={nyelv} />
          </div>
        </details>
      ) : null}
    </div>
  );
}

function Osszegzo({
  elmaradasFt,
  rendezetlenDarab,
  jogviszonyDarab,
  nyelv,
  sz,
}: {
  elmaradasFt: number;
  rendezetlenDarab: number;
  jogviszonyDarab: number;
  nyelv: Parameters<typeof forintNyelven>[1];
  sz: (kulcs: string, adatok?: Record<string, string | number>) => string;
}) {
  const van = elmaradasFt > 0;

  return (
    <section
      className={`rounded-kartya border p-4 ${
        van ? "border-gond-keret bg-gond-lap" : "border-rendben-keret bg-rendben-lap"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-wide text-halvany uppercase">
            {sz("attekinto.elmaradas")}
          </div>
          <div className="mt-1">
            <Osszeg
              ertek={forintNyelven(elmaradasFt, nyelv)}
              meret="nagy"
              szin={van ? "gond" : "rendben"}
            />
          </div>
        </div>
        <Jelzo allapot={van ? "gond" : "rendben"}>
          {sz("attekinto.rendezetlen")}: {rendezetlenDarab}
        </Jelzo>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm text-halvany">
          {sz("attekinto.jogviszony")}: {jogviszonyDarab}
        </span>
        <GombHivatkozas href="/befizetesek" suly="masodlagos" osztaly="ml-auto min-h-10">
          {sz("befizetesek.cim")}
          <IkonNyil meret={14} />
        </GombHivatkozas>
      </div>
    </section>
  );
}
