import { forintNyelven, szamNyelven, type Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";

export type MutatottTetel = {
  id: string;
  megnevezes: string;
  mennyiseg: number | null;
  mertekegyseg: string | null;
  reszletezes: string;
  osszegFt: number;
};

/** Az elszámolás tételesen. A részletezés azért van itt, hogy ellenőrizhető legyen. */
export function ElszamolasTetelek({
  tetelek,
  osszegFt,
  nyelv,
}: {
  tetelek: MutatottTetel[];
  osszegFt: number;
  nyelv: Nyelv;
}) {
  const { sz } = szovegekNyelvvel(nyelv);
  const mennyiseg = (tetel: MutatottTetel) =>
    tetel.mennyiseg === null
      ? null
      : `${szamNyelven(tetel.mennyiseg, nyelv)} ${tetel.mertekegyseg ?? ""}`;

  return (
    <div className="mt-3 grid gap-2">
      <ul className="grid gap-2">
        {tetelek.map((tetel) => (
          <li
            key={tetel.id}
            className="rounded border border-stone-200 p-3 text-sm dark:border-stone-800"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">
                {tetel.megnevezes}
                {mennyiseg(tetel) ? (
                  <span className="ml-2 font-normal text-stone-500 dark:text-stone-400">
                    {mennyiseg(tetel)}
                  </span>
                ) : null}
              </span>
              <span className="tabular-nums font-medium">
              {forintNyelven(tetel.osszegFt, nyelv)}
            </span>
            </div>
            <p className="mt-1 text-stone-600 dark:text-stone-400">{tetel.reszletezes}</p>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between border-t border-stone-200 pt-2 text-sm font-semibold dark:border-stone-800">
        <span>{sz("berlo.osszesen")}</span>
        <span className="tabular-nums">{forintNyelven(osszegFt, nyelv)}</span>
      </div>
    </div>
  );
}
