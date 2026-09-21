import { datumNyelven, forintNyelven } from "@/domain/nyelv";
import { meghivoAllapota } from "@/domain/belepes";
import { prisma } from "@/lib/db";
import { kotelezoSzerep } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { MeghivoGomb } from "./MeghivoGomb";
import { BERLOHOZ_KELL, hianyzoMezok } from "@/domain/szemelyes-adatok";
import { Lapfej } from "@/components/ui/alap";
import {
  BerloAdatok,
  BerloHozzaadas,
  BerloTorles,
  JogviszonyLezaras,
  JogviszonyUjranyitas,
} from "./Urlapok";

export const dynamic = "force-dynamic";

function napSzoveg(nap: Date | null): string {
  return nap ? nap.toISOString().slice(0, 10) : "";
}

export default async function Berlok() {
  const berbeado = await kotelezoSzerep("berbeado");
  const { sz , nyelv } = await szovegek();
  const ft = (osszegFt: number) => forintNyelven(osszegFt, nyelv);
  const nap = (ertek: Date) => datumNyelven(ertek, nyelv);
  const most = new Date();
  const maiNap = napSzoveg(most);

  const jogviszonyok = await prisma.jogviszony.findMany({
    where: { ingatlan: { tulajdonosId: berbeado.id } },
    include: {
      ingatlan: true,
      berlok: {
        orderBy: { sorrend: "asc" },
        include: {
          berlo: true,
          meghivok: { orderBy: { letrehozva: "desc" } },
        },
      },
    },
    orderBy: { letrehozva: "asc" },
  });

  return (
    <div className="grid gap-6">
      <Lapfej cim={sz("berlok.cim")} alcim={sz("berlok.bevezeto")} />

      <ul className="grid gap-4">
        {jogviszonyok.map((jogviszony) => (
          <li
            key={jogviszony.id}
            className="rounded-kartya border border-keret bg-felulet p-4"
          >
            <h2 className="font-semibold">{jogviszony.ingatlan.megnevezes}</h2>
            <p className="text-sm text-halvany">
              {sz("berlok.dij_sor", {
                osszeg: ft(jogviszony.berletiDijFt),
                nap: jogviszony.fizetesiNap,
              })}{" "}
              ·{" "}
              {jogviszony.berlok.length === 1
                ? sz("berlok.egy_berlo")
                : sz("berlok.tobb_berlo", { darab: jogviszony.berlok.length })}
            </p>
            {jogviszony.statusz === "lezart" ? (
              <p className="mt-1 text-sm font-medium text-szoveg">
                {sz("berlok.lezarva", { nap: nap(jogviszony.vege ?? most) })}
              </p>
            ) : null}

            <ul className="mt-3 grid gap-4">
              {jogviszony.berlok.map((berlo) => {
                const eloMeghivo = berlo.meghivok.find(
                  (meghivo) => meghivoAllapota(meghivo, most) === "ervenyes",
                );
                const hianyzik = hianyzoMezok(
                  {
                    nev: berlo.nev,
                    szuletesiHely: berlo.szuletesiHely,
                    szuletesiIdo: berlo.szuletesiIdo,
                    anyjaNeve: berlo.anyjaNeve,
                    lakcim: berlo.lakcim,
                    igazolvanySzam: berlo.igazolvanySzam,
                  },
                  BERLOHOZ_KELL,
                ).length;

                return (
                  <li
                    key={berlo.id}
                    className="border-t border-keret pt-3 first:border-0 first:pt-0"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-medium">{berlo.nev}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          berlo.berloId
                            ? "bg-rendben-lap text-rendben"
                            : "bg-figyelem-lap text-figyelem"
                        }`}
                      >
                        {berlo.berloId ? sz("berlok.van_fiok") : sz("berlok.nincs_fiok")}
                      </span>
                    </div>

                    {berlo.berloId ? (
                      <p className="mt-1 text-sm text-halvany">
                        {sz("berlok.belepett", { email: berlo.berlo?.email ?? "" })}
                      </p>
                    ) : (
                      <>
                        {eloMeghivo ? (
                          <p className="mt-1 text-sm text-halvany">
                            {sz("berlok.elo_meghivo", {
                              email: eloMeghivo.email,
                              nap: nap(eloMeghivo.lejar),
                            })}
                          </p>
                        ) : null}
                        <MeghivoGomb
                          jogviszonyBerloId={berlo.id}
                          email={berlo.email ?? ""}
                          cimke={sz(eloMeghivo ? "berlok.uj_meghivo" : "berlok.meghivo")}
                          emailCimke={sz("berlok.meghivo_email")}
                          folyamatbanCimke={sz("berlok.meghivo_folyamatban")}
                        />
                      </>
                    )}

                    <BerloAdatok
                      berlo={{
                        id: berlo.id,
                        nev: berlo.nev,
                        email: berlo.email ?? "",
                        szuletesiHely: berlo.szuletesiHely ?? "",
                        szuletesiIdo: napSzoveg(berlo.szuletesiIdo),
                        anyjaNeve: berlo.anyjaNeve ?? "",
                        lakcim: berlo.lakcim ?? "",
                        igazolvanySzam: berlo.igazolvanySzam ?? "",
                        telefon: berlo.telefon ?? "",
                        forrasa:
                          berlo.adatokForrasa === "berlo" || berlo.adatokForrasa === "berbeado"
                            ? berlo.adatokForrasa
                            : null,
                        hianyzik,
                      }}
                      cimkek={{
                        cim: sz("berlok.adatok_cim"),
                        hianyzik: sz("berlok.adatok_hianyzik", { darab: hianyzik }),
                        megvan: sz("berlok.adatok_megvan"),
                        forras: sz(
                          berlo.adatokForrasa === "berlo"
                            ? "berlok.adatok_forras_berlo"
                            : berlo.adatokForrasa === "berbeado"
                              ? "berlok.adatok_forras_berbeado"
                              : "berlok.adatok_forras_nincs",
                        ),
                        mezo: {
                          nev: sz("adatok.mezo.nev"),
                          email: sz("belepes.email"),
                          szuletesiHely: sz("adatok.mezo.szuletesiHely"),
                          szuletesiIdo: sz("adatok.mezo.szuletesiIdo"),
                          anyjaNeve: sz("adatok.mezo.anyjaNeve"),
                          igazolvanySzam: sz("adatok.mezo.igazolvanySzam"),
                          telefon: sz("adatok.mezo.telefon"),
                          lakcim: sz("adatok.mezo.lakcim"),
                        },
                        gomb: sz("berlok.adatok_gomb"),
                        folyamatban: sz("berlok.adatok_folyamatban"),
                      }}
                    />

                    {jogviszony.berlok.length > 1 ? (
                      <BerloTorles
                        jogviszonyBerloId={berlo.id}
                        cimke={sz("berlok.torles", { nev: berlo.nev })}
                        folyamatbanCimke={sz("berlok.torles_folyamatban")}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <BerloHozzaadas
              jogviszonyId={jogviszony.id}
              cimkek={{
                nyito: sz("berlok.hozzaadas"),
                nev: sz("adatok.mezo.nev"),
                email: sz("belepes.email"),
                gomb: sz("berlok.hozzaadas_gomb"),
                folyamatban: sz("berlok.hozzaadas_folyamatban"),
              }}
            />

            {jogviszony.statusz === "lezart" ? (
              <JogviszonyUjranyitas
                jogviszonyId={jogviszony.id}
                cimke={sz("berlok.ujranyit")}
              />
            ) : (
              <JogviszonyLezaras
                jogviszonyId={jogviszony.id}
                cimke={sz("berlok.lezaras")}
                napCimke={sz("berlok.lezaras_nap")}
                gombCimke={sz("berlok.lezaras_gomb")}
                sugo={sz("berlok.lezaras_sugo")}
                maiNap={maiNap}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
