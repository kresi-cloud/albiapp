import Link from "next/link";
import { datumNyelven, type Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { fajtaCimke, fajtankent, type Dokumentum } from "@/domain/dokumentumtar";

/**
 * A kiadott papírok egy listában, fajtánként csoportosítva. A tervezet halvány
 * jelölést kap, mert az még változhat; a bérlő listájában ilyen nem is szerepel.
 */
export function Dokumentumlista({
  dokumentumok,
  uresUzenet,
  nyelv,
}: {
  dokumentumok: Dokumentum[];
  uresUzenet: string;
  nyelv: Nyelv;
}) {
  const { sz, u } = szovegekNyelvvel(nyelv);

  if (dokumentumok.length === 0) {
    return (
      <p className="rounded-kartya border border-keret bg-felulet p-4 text-sm text-halvany">
        {uresUzenet}
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      {fajtankent(dokumentumok).map((csoport) => (
        <section key={csoport.fajta}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-nagyon-halvany">
            {u(fajtaCimke(csoport.fajta))}
          </h3>
          <ul className="grid gap-2">
            {csoport.dokumentumok.map((sor) => (
              <li
                key={sor.kulcs}
                className="rounded-kartya border border-keret bg-felulet p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{u(sor.cim)}</span>
                  <span className="text-xs text-nagyon-halvany">
                    {sor.jogviszonyCimke} · {datumNyelven(sor.datum, nyelv)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-halvany">
                  {u(sor.reszlet)} {sor.kiadott ? "" : sz("dokumentum.lista.tervezet_jelzes")}
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  {sor.megnyitas ? (
                    <Link
                      href={sor.megnyitas}
                      className="text-kiemelt underline underline-offset-2"
                    >
                      {sz("dokumentum.lista.megnyitom")}
                    </Link>
                  ) : null}
                  {sor.letoltes ? (
                    <a
                      href={sor.letoltes}
                      className="text-kiemelt underline underline-offset-2"
                    >
                      {sz("dokumentum.lista.letoltom")}
                    </a>
                  ) : null}
                  <span className="text-nagyon-halvany">
                    {u(sor.allapotCimke)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
