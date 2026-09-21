import { allapotNeve } from "@/domain/betekinto";
import { datumNyelven } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { berloBetekintoi, berloJogviszonyai } from "@/lib/betekinto";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";
import { Jelzo, Kartya, Lapfej, Sugo, Szakaszcim, Ures } from "@/components/ui/alap";
import { BetekintoUrlap, VisszavonGomb } from "./Urlapok";

export const dynamic = "force-dynamic";

/**
 * A bérlő betekintő linkjei. Az ő oldala, mert az ő adatáról van szó: ő dönti
 * el, kinek adja ki, mennyi időre, és mikor vonja vissza.
 *
 * Ami kimarad a linkből, az elv, és nem tűnhet el — de nem is áll kinyitva a
 * lap tetején: a `Sugo` egy sorban tartja, és aki kíváncsi rá, kinyitja.
 */
export default async function Betekintok() {
  const berlo = await kotelezoSzerep("berlo");
  const nyelv = await aktualisNyelv();
  const { sz, u } = szovegekNyelvvel(nyelv);

  const [linkek, jogviszonyok] = await Promise.all([
    berloBetekintoi(berlo.id),
    berloJogviszonyai(berlo.id),
  ]);

  return (
    <div className="grid gap-5">
      <Lapfej cim={sz("betekinto.oldal.cim")} />

      {/* A mire jó és a mi marad ki egy súgóba tartozik: aki most találkozik
          a funkcióval, egyben olvassa el, aki nem, annak egy sor marad. */}
      <Sugo cim={sz("betekinto.oldal.sugo_cim")}>
        <p>{sz("betekinto.oldal.bevezeto")}</p>
        <p>{sz("betekinto.oldal.mit_nem")}</p>
      </Sugo>

      <section>
        <Szakaszcim>{sz("betekinto.urlap.cim")}</Szakaszcim>
        <Kartya osztaly="p-4">
          <BetekintoUrlap nyelv={nyelv} jogviszonyok={jogviszonyok} />
        </Kartya>
      </section>

      <section>
        <Szakaszcim>{sz("betekinto.lista.cim")}</Szakaszcim>
        {linkek.length === 0 ? (
          <Ures>{sz("betekinto.lista.ures")}</Ures>
        ) : (
          <ul className="grid gap-3">
            {linkek.map((link) => (
              <li key={link.id}>
                <Kartya osztaly="grid gap-2 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="min-w-0 font-semibold">{link.cel}</span>
                    <Jelzo allapot={link.allapot === "elo" ? "rendben" : "semleges"}>
                      {u(allapotNeve(link.allapot))}
                    </Jelzo>
                  </div>

                  {/* A linket ki kell tudni másolni, ezért egybefüggő, írógép
                      betűs sor: a tördelt cím közepén a szülő nem látja, hol
                      ér véget. Telefonon oldalra gördül, nem a lapot feszíti. */}
                  {link.allapot === "elo" ? (
                    <p className="overflow-x-auto rounded-lg bg-felulet-halk px-2 py-1.5 font-mono text-xs">
                      /betekinto/{link.token}
                    </p>
                  ) : null}

                  <p className="text-xs leading-relaxed text-halvany">
                    {sz("betekinto.lista.lejar", { nap: datumNyelven(link.lejar, nyelv) })}
                    {" · "}
                    {link.megnyitasok === 0
                      ? sz("betekinto.lista.megnyitas_soha")
                      : sz("betekinto.lista.megnyitas", { darab: link.megnyitasok })}
                    {link.utolsoMegnyitas
                      ? ` · ${sz("betekinto.lista.utoljara", {
                          nap: datumNyelven(link.utolsoMegnyitas, nyelv),
                        })}`
                      : ""}
                  </p>

                  {link.allapot === "elo" ? (
                    <VisszavonGomb id={link.id} cimke={sz("betekinto.lista.visszavon")} />
                  ) : null}
                </Kartya>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
