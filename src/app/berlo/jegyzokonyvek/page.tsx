import { FAJTA_NEVE } from "@/domain/jegyzokonyv";
import { datumNyelven } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { Album } from "@/app/jegyzokonyv-kepek/Album";
import { berloJegyzokonyvei } from "@/lib/jegyzokonyv-kepek";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { aktualisNyelv } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

/**
 * A bérlő oldala az átadás-átvételi képekről.
 *
 * A dokumentumtár szabálya szerint a bérlő tervezetet nem lát, mert az még
 * változhat. A kép ez alól szándékos kivétel: a megerősítés akkor ér valamit,
 * ha a véglegesítés előtt történik. A jegyzőkönyv *szövegét* itt sem mutatjuk,
 * csak a képeket — az a dokumentumtárba tartozik, a véglegesítés után.
 */
export default async function BerloiJegyzokonyvek() {
  const berlo = await kotelezoSzerep("berlo");
  const nyelv = await aktualisNyelv();
  const { sz } = szovegekNyelvvel(nyelv);
  const jegyzokonyvek = await berloJegyzokonyvei(berlo.id);

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">{sz("kep.oldal.cim")}</h1>
        <p className="mt-1 text-halvany">{sz("kep.oldal.bevezeto")}</p>
      </section>

      {jegyzokonyvek.length === 0 ? (
        <p className="text-sm text-halvany">{sz("kep.oldal.ures")}</p>
      ) : (
        jegyzokonyvek.map((jegyzokonyv) => (
          <section
            key={jegyzokonyv.id}
            className="rounded-kartya border border-keret bg-felulet p-4"
          >
            <h2 className="font-medium">
              {FAJTA_NEVE[jegyzokonyv.fajta] ?? jegyzokonyv.fajta} · {jegyzokonyv.ingatlan}
            </h2>
            <p className="mt-1 text-sm text-halvany">
              {datumNyelven(jegyzokonyv.idopont, nyelv)}
            </p>
            {jegyzokonyv.allapot === "tervezet" ? (
              <p className="mt-2 text-sm text-halvany">
                {sz("kep.oldal.tervezet")}
              </p>
            ) : null}

            <Album
              jegyzokonyvId={jegyzokonyv.id}
              fajta={jegyzokonyv.fajta}
              lezart={jegyzokonyv.allapot !== "tervezet"}
              kepek={jegyzokonyv.kepek}
              tetelek={[]}
            />
          </section>
        ))
      )}
    </div>
  );
}
