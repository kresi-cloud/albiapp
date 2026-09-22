import { haviAllapotNeve, mondatok } from "@/domain/betekinto";
import { datumNyelven, forintNyelven, honapNyelven } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { nyilvanosNezet } from "@/lib/betekinto";
import { aktualisNyelv } from "@/lib/nyelv";
import { Jelzo, Osszeg, Szakaszcim, type Allapotszin } from "@/components/ui/alap";
import type { BetekintoTetel } from "@/domain/betekinto";

export const dynamic = "force-dynamic";

/**
 * A betekintő nyilvános oldala. Nincs belépés: a token maga a jogosultság, és
 * a link visszavonható. A megnyitást a lekérdezés jegyzi fel, hogy a bérlő
 * lássa, hányszor nézték meg — időponttal, és semmi mással.
 *
 * A sorrend a szülői olvasathoz igazodik: elöl az, hol tart most a bérlemény,
 * utána a hónapról hónapra bontás, és csak a végén az összesített előzmény.
 *
 * Ez az egyetlen lap, amit olyan ember nyit meg, akinek nincs fiókja, és aki
 * jellemzően egyetlen dologra kíváncsi: rendben van-e a fizetés. Ezért a
 * mostani állapot nem egy sor a többi közt, hanem egy szám a lap tetején,
 * akkora, hogy telefonon a megnyitás pillanatában elolvasható legyen.
 */
export default async function BetekintoOldal({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const nyelv = await aktualisNyelv();
  const { sz, u } = szovegekNyelvvel(nyelv);
  const nezet = await nyilvanosNezet(token);

  if (!nezet) {
    return (
      <div className="mx-auto grid max-w-lg gap-3 py-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {sz("betekinto.nyilvanos.nincs")}
        </h1>
        <p className="text-halvany">{sz("betekinto.nyilvanos.nincs_bevezeto")}</p>
      </div>
    );
  }

  const { osszesites } = nezet;
  const rendben = osszesites.nyitottFt === 0;

  return (
    <div className="mx-auto grid max-w-lg gap-6">
      <section>
        <p className="text-sm text-halvany">{nezet.cel}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-balance">
          {sz("betekinto.nyilvanos.berlo", { nev: nezet.berloNeve })}
        </h1>
      </section>

      {osszesites.honapok === 0 ? null : (
        <section
          className={`rounded-kartya border p-4 ${
            rendben
              ? "border-rendben-keret bg-rendben-lap"
              : "border-figyelem-keret bg-figyelem-lap"
          }`}
        >
          {/* Ez a lap szakaszcíme, csak kicsiben: alatta a szám viszi a
              hangsúlyt. Címsor marad, mert a szakaszt ez nevezi meg — a
              képernyőolvasó és a böngészős próba is ezen tájékozódik. */}
          <h2 className="text-xs font-semibold tracking-wide text-halvany">
            {sz("betekinto.nyilvanos.most")}
          </h2>
          {rendben ? (
            <p className="mt-1 font-semibold text-rendben">
              {sz("betekinto.nyilvanos.nyitott_nincs")}
            </p>
          ) : nezet.osszegetMutat ? (
            <>
              {/* A szám a lényeg, a fölötte álló sor mondja meg, minek a száma.
                  A kettő együtt ugyanazt jelenti, mint a korábbi egyetlen
                  mondat, csak innen az összeg kiolvasható anélkül, hogy
                  végig kellene olvasni. */}
              <p className="mt-1 text-sm font-medium text-figyelem">
                {sz("betekinto.nyilvanos.nyitott_cimke")}
              </p>
              <div className="mt-0.5">
                <Osszeg
                  ertek={forintNyelven(osszesites.nyitottFt, nyelv)}
                  meret="nagy"
                  szin="figyelem"
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-halvany">
                {sz("betekinto.nyilvanos.nyitott_sugo")}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 font-semibold text-figyelem">
                {u({
                  kulcs: "betekinto.mondat.hianyzo",
                  adatok: { hianyzo: osszesites.hianyzo },
                })}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-halvany">
                {sz("betekinto.nyilvanos.nyitott_sugo")}
              </p>
            </>
          )}
        </section>
      )}

      <section className="rounded-kartya border border-keret bg-felulet">
        <ul className="divide-y divide-keret">
          {nezet.telepules ? (
            <Adatsor szoveg={sz("betekinto.nyilvanos.telepules", { telepules: nezet.telepules })} />
          ) : null}
          <Adatsor
            szoveg={sz("betekinto.nyilvanos.kezdete", {
              nap: datumNyelven(nezet.jogviszonyKezdete, nyelv),
            })}
          />
          <Adatsor
            szoveg={
              nezet.jogviszonyEl
                ? sz("betekinto.nyilvanos.el")
                : sz("betekinto.nyilvanos.lezart")
            }
          />
          {nezet.berletiDijFt === null ? null : (
            <Adatsor
              szoveg={sz("betekinto.nyilvanos.dij", {
                dij: forintNyelven(nezet.berletiDijFt, nyelv),
              })}
            />
          )}
        </ul>
      </section>

      {nezet.honapok.length === 0 ? null : (
        <section>
          <Szakaszcim>{sz("betekinto.nyilvanos.havi_cim")}</Szakaszcim>
          <p className="mb-2 text-xs leading-relaxed text-halvany">
            {sz("betekinto.nyilvanos.havi_sugo")}
          </p>
          <ul className="divide-y divide-keret overflow-hidden rounded-kartya border border-keret bg-felulet">
            {nezet.honapok.map((honap) => (
              <li key={honap.idoszak} className="grid gap-1 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold">
                    {honapNyelven(honap.idoszak, nyelv)}
                  </span>
                  <Jelzo allapot={haviSzin(honap)}>
                    {u(haviAllapotNeve(honap))}
                  </Jelzo>
                </div>
                {nezet.osszegetMutat ? (
                  <p className="szam text-xs text-halvany">
                    {sz("betekinto.nyilvanos.eloirt")}: {forintNyelven(honap.eloirtFt, nyelv)}
                    {" · "}
                    {sz("betekinto.nyilvanos.erkezett")}:{" "}
                    {forintNyelven(honap.erkezettFt, nyelv)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <Szakaszcim>{sz("betekinto.nyilvanos.cim")}</Szakaszcim>
        <ul className="divide-y divide-keret overflow-hidden rounded-kartya border border-keret bg-felulet">
          {mondatok(osszesites).map((mondat) => (
            <li key={mondat.kulcs} className="px-3 py-2.5 text-sm">
              {u(mondat)}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-2 text-xs leading-relaxed text-nagyon-halvany">
        <p>{sz("betekinto.nyilvanos.honnan")}</p>
        <p>{sz("betekinto.nyilvanos.nincs_pontszam")}</p>
        <p>
          {sz("betekinto.nyilvanos.kiadva", {
            nap: datumNyelven(nezet.kiadva, nyelv),
            lejar: datumNyelven(nezet.lejar, nyelv),
          })}
        </p>
      </section>
    </div>
  );
}

/**
 * A havi sor színe. Az ágak szándékosan ugyanazok, mint a `haviAllapotNeve`
 * mondatáé (`src/domain/betekinto.ts`), mert a szín és a szöveg ugyanarról
 * szól — ha az egyik változik, a másikat is át kell írni.
 *
 * Az `elter` itt sem sárga: ott a két fél ugyanazt mondja, csak nem az előírt
 * összeget, és ez a lap nem vitát mutat. A késés viszont igen, mert a szülő
 * pont arra kíváncsi.
 */
function haviSzin(tetel: BetekintoTetel): Allapotszin {
  if (tetel.allapot === "hianyzik") return "figyelem";
  if (tetel.keses > 0) return "figyelem";
  if (tetel.allapot === "elter") return "semleges";
  return "rendben";
}

/** A jogviszony egy-egy adata. Mondat, nem címke-érték pár: a szülő olvassa. */
function Adatsor({ szoveg }: { szoveg: string }) {
  return <li className="px-3 py-2.5 text-sm">{szoveg}</li>;
}
