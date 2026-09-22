import { datumNyelven, type Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import {
  allapotNeve,
  keses,
  koltsegJavaslat,
  lepesek,
  nyitott,
  okNeve,
  surgossegNeve,
  teruletNeve,
  valaszHatarido,
  viseloNeve,
} from "@/domain/hibabejelentes";
import type { HibaNezet } from "@/lib/hibabejelentes";
import { AllapotLepesek, UzenetUrlap, ViseloUrlap } from "@/app/hibak/Urlapok";

const SURGOSSEG_STILUS: Record<string, string> = {
  veszhelyzet: "bg-gond-lap text-gond",
  surgos: "bg-figyelem-lap text-figyelem",
  normal: "bg-felulet-halk text-szoveg",
};

/**
 * Egy hibabejelentés mindkét fél oldalán. Ugyanaz a kártya, csak a léptethető
 * állapotok és a költségviselő űrlapja tér el: a bérlő nem mondhatja
 * elhárítottnak a hibát, a bérbeadó pedig nem zárhatja le helyette.
 */
export function Hibakartya({
  hiba,
  szerep,
  ma,
  nyelv,
  berlemenyCimke,
}: {
  hiba: HibaNezet;
  szerep: "berbeado" | "berlo";
  ma: Date;
  nyelv: Nyelv;
  berlemenyCimke?: string;
}) {
  const { sz, u } = szovegekNyelvvel(nyelv);
  const javaslat = koltsegJavaslat(hiba.terulet, hiba.ok);
  const varakozas = keses(hiba.surgosseg, hiba.bejelentve, ma);
  const hatarido = valaszHatarido(hiba.surgosseg, hiba.bejelentve);
  const lehet = lepesek(hiba.allapot, szerep);

  return (
    <li
      id={hiba.id}
      className="rounded-kartya border border-keret bg-felulet p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium">{hiba.targy}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${SURGOSSEG_STILUS[hiba.surgosseg]}`}
        >
          {u(surgossegNeve(hiba.surgosseg))}
        </span>
      </div>

      <p className="mt-1 text-sm text-halvany">
        {berlemenyCimke ? `${berlemenyCimke} · ` : ""}
        {u(allapotNeve(hiba.allapot))} ·{" "}
        {sz("hiba.kartya.bejelentve", { nap: datumNyelven(hiba.bejelentve, nyelv) })}
        {nyitott(hiba.allapot) ? (
          <>
            {" · "}
            <span className={varakozas.lejart ? "text-gond" : ""}>
              {sz("hiba.kartya.hatarido", { nap: datumNyelven(hatarido, nyelv) })}
              {varakozas.lejart ? sz("hiba.kartya.lejart") : ""}
            </span>
          </>
        ) : null}
      </p>

      <p className="mt-2 text-sm">{hiba.leiras}</p>

      <p className="mt-2 text-sm text-halvany">
        {u(teruletNeve(hiba.terulet))} · {u(okNeve(hiba.ok))} ·{" "}
        {sz("hiba.kartya.bejelento", { nev: hiba.bejelentoNev })}
      </p>

      {hiba.viseloFel ? (
        <p className="mt-2 rounded-kartya border border-keret bg-felulet-halk p-2 text-sm">
          {sz("hiba.kartya.viselo", { fel: viseloNeve(hiba.viseloFel) })}
        </p>
      ) : szerep === "berlo" ? (
        <p className="mt-2 text-sm text-halvany">
          {sz("hiba.kartya.nincs_viselo", { indoklas: javaslat.indoklas })}
        </p>
      ) : null}

      {hiba.uzenetek.length > 0 ? (
        <ul className="mt-3 grid gap-2 border-t border-keret pt-3">
          {hiba.uzenetek.map((uzenet) => (
            <li key={uzenet.id} className="text-sm">
              <span className="font-medium">
                {uzenet.sajat ? sz("hiba.kartya.te") : uzenet.szerzoNev}
              </span>
              <span className="ml-2 text-xs text-nagyon-halvany">
                {datumNyelven(uzenet.letrehozva, nyelv)}
              </span>
              <p className="text-szoveg">{uzenet.szoveg}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <AllapotLepesek hibaId={hiba.id} lepesek={lehet} nyelv={nyelv} />

      {szerep === "berbeado" ? (
        <ViseloUrlap
          hibaId={hiba.id}
          jelenlegi={hiba.viseloFel}
          javaslat={javaslat}
          nyelv={nyelv}
        />
      ) : null}

      {nyitott(hiba.allapot) ? <UzenetUrlap hibaId={hiba.id} nyelv={nyelv} /> : null}
    </li>
  );
}
