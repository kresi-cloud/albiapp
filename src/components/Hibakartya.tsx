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
  veszhelyzet: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  surgos: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  normal: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
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
      className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium">{hiba.targy}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${SURGOSSEG_STILUS[hiba.surgosseg]}`}
        >
          {u(surgossegNeve(hiba.surgosseg))}
        </span>
      </div>

      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        {berlemenyCimke ? `${berlemenyCimke} · ` : ""}
        {u(allapotNeve(hiba.allapot))} ·{" "}
        {sz("hiba.kartya.bejelentve", { nap: datumNyelven(hiba.bejelentve, nyelv) })}
        {nyitott(hiba.allapot) ? (
          <>
            {" · "}
            <span className={varakozas.lejart ? "text-rose-700 dark:text-rose-400" : ""}>
              {sz("hiba.kartya.hatarido", { nap: datumNyelven(hatarido, nyelv) })}
              {varakozas.lejart ? sz("hiba.kartya.lejart") : ""}
            </span>
          </>
        ) : null}
      </p>

      <p className="mt-2 text-sm">{hiba.leiras}</p>

      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        {u(teruletNeve(hiba.terulet))} · {u(okNeve(hiba.ok))} ·{" "}
        {sz("hiba.kartya.bejelento", { nev: hiba.bejelentoNev })}
      </p>

      {hiba.viseloFel ? (
        <p className="mt-2 rounded border border-stone-200 bg-stone-50 p-2 text-sm dark:border-stone-800 dark:bg-stone-950">
          {sz("hiba.kartya.viselo", { fel: viseloNeve(hiba.viseloFel) })}
        </p>
      ) : szerep === "berlo" ? (
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {sz("hiba.kartya.nincs_viselo", { indoklas: javaslat.indoklas })}
        </p>
      ) : null}

      {hiba.uzenetek.length > 0 ? (
        <ul className="mt-3 grid gap-2 border-t border-stone-200 pt-3 dark:border-stone-800">
          {hiba.uzenetek.map((uzenet) => (
            <li key={uzenet.id} className="text-sm">
              <span className="font-medium">
                {uzenet.sajat ? sz("hiba.kartya.te") : uzenet.szerzoNev}
              </span>
              <span className="ml-2 text-xs text-stone-500 dark:text-stone-400">
                {datumNyelven(uzenet.letrehozva, nyelv)}
              </span>
              <p className="text-stone-700 dark:text-stone-300">{uzenet.szoveg}</p>
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
