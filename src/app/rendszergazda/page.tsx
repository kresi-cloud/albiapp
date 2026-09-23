import { notFound, redirect } from "next/navigation";
import { naploMondata, valaszidoMagyarazat, valaszidoSzine } from "@/domain/uzemeltetes";
import { bemutatkozoLista } from "@/lib/bemutatkozas";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { adminNaplo, osszesito, rendszerallapot } from "@/lib/uzemeltetes";
import { Jelzo, KartyaHivatkozas, Lapfej, Mutato, Sugo, Szakaszcim, Ures } from "@/components/ui/alap";
import { Fiokgomb } from "./Fiokgomb";

export const dynamic = "force-dynamic";

/**
 * Az üzemeltetői lap.
 *
 * Amit mutat: hogy működik-e az alkalmazás, és van-e valami elakadva. Ehhez
 * összesítő számok kellenek és a rendszer saját állapota, nem mások bérleti
 * ügyei — a bérlemény, a jogviszony és a befizetés részletei szándékosan nem
 * látszanak innen. Egy üzemeltetői fiók, ami mindent lát, észrevétlenül
 * ugyanaz lesz, mint a bérlőszűrés, amit a termék kerül.
 *
 * A rendszergazda jelölő kizárólag az adatbázisban állítható. Nincs felület,
 * amivel valaki magának adhatná meg: egy jogosultság, ami a felületről
 * kérhető, előbb-utóbb kikerül oda, ahol nem kellene.
 */
export default async function Rendszergazda() {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) redirect("/belepes");
  if (!felhasznalo.rendszergazda) notFound();

  const { sz, u } = await szovegek();
  const most = new Date();
  const [sorok, szamok, allapot, naplo] = await Promise.all([
    bemutatkozoLista(most),
    osszesito(most),
    rendszerallapot(),
    adminNaplo(),
  ]);

  return (
    <div className="grid gap-4">
      <Lapfej cim={sz("rendszergazda.cim")} alcim={sz("rendszergazda.alcim")} />

      <Sugo cim={sz("rendszergazda.sugo_cim")}>{sz("rendszergazda.sugo")}</Sugo>

      <section className="grid gap-2">
        <Szakaszcim>{sz("uzemeltetes.szamok")}</Szakaszcim>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Mutato cimke={sz("uzemeltetes.berbeadok")} ertek={String(szamok.berbeadok)} />
          <Mutato cimke={sz("uzemeltetes.berlok")} ertek={String(szamok.berlok)} />
          <Mutato cimke={sz("uzemeltetes.ingatlanok")} ertek={String(szamok.ingatlanok)} />
          <Mutato
            cimke={sz("uzemeltetes.elo_jogviszonyok")}
            ertek={String(szamok.eloJogviszonyok)}
          />
          <Mutato
            cimke={sz("uzemeltetes.lezart_jogviszonyok")}
            ertek={String(szamok.lezartJogviszonyok)}
          />
          <Mutato
            cimke={sz("uzemeltetes.nyitott_hibak")}
            ertek={String(szamok.nyitottHibak)}
            szin={szamok.nyitottHibak > 0 ? "figyelem" : "rendben"}
          />
          <Mutato cimke={sz("uzemeltetes.varo_meghivok")} ertek={String(szamok.varoMeghivok)} />
          <Mutato
            cimke={sz("uzemeltetes.varo_elofizetesek")}
            ertek={String(szamok.varoElofizetesek)}
          />
          <Mutato
            cimke={sz("uzemeltetes.varo_latogatasok")}
            ertek={String(szamok.varoLatogatasok)}
          />
        </div>
        <p className="text-sm text-halvany">{sz("uzemeltetes.szamok_miert")}</p>
      </section>

      <section className="grid gap-2" data-szakasz="rendszerallapot">
        <Szakaszcim>{sz("uzemeltetes.rendszerallapot")}</Szakaszcim>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Mutato
            cimke={sz("uzemeltetes.valaszido")}
            ertek={sz("uzemeltetes.ezredmasodperc", { szam: allapot.valaszidoMs })}
            szin={valaszidoSzine(allapot.valaszidoMs)}
          />
          <Mutato cimke={sz("uzemeltetes.migraciok")} ertek={String(allapot.migraciok)} />
          <Mutato
            cimke={sz("uzemeltetes.kornyezet")}
            ertek={sz(allapot.eles ? "uzemeltetes.eles" : "uzemeltetes.fejlesztoi")}
          />
        </div>
        <p className="text-sm text-halvany">{u(valaszidoMagyarazat(allapot.valaszidoMs))}</p>
        {allapot.utolsoMigracio ? (
          <p className="text-sm break-words text-halvany">
            {sz("uzemeltetes.utolso_migracio", { nev: allapot.utolsoMigracio })}
          </p>
        ) : null}
      </section>

      <section className="grid gap-2">
        <Szakaszcim>{sz("uzemeltetes.fiokok")}</Szakaszcim>
        {sorok.length === 0 ? <Ures>{sz("rendszergazda.nincs")}</Ures> : null}

        <ul className="grid gap-2">
          {sorok.map((sor) => (
            <li key={sor.id} className="grid gap-2" data-fiok={sor.id}>
              <KartyaHivatkozas
                href={sor.id === felhasznalo.id ? "/bemutatkozas" : `/bemutatkozas/${sor.id}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-medium">{sor.nev}</span>
                  <span className="text-sm text-halvany">
                    {sz(`bemutatkozas.szerep.${sor.szerep}`)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-halvany">
                  {sz("bemutatkozas.darab", { darab: sor.ertekelesekSzama })}
                </p>
                {sor.letiltva ? (
                  <p className="mt-2">
                    <Jelzo allapot="gond">{sz("uzemeltetes.letiltott")}</Jelzo>
                  </p>
                ) : null}
              </KartyaHivatkozas>

              {sor.id === felhasznalo.id ? (
                <p className="text-sm text-halvany">{sz("uzemeltetes.sajat_fiok")}</p>
              ) : (
                <Fiokgomb
                  felhasznaloId={sor.id}
                  letiltva={sor.letiltva}
                  cimke={sz(sor.letiltva ? "uzemeltetes.visszaenged" : "uzemeltetes.letilt")}
                  folyamatbanCimke={sz("uzemeltetes.folyamatban")}
                />
              )}
            </li>
          ))}
        </ul>
        <p className="text-sm text-halvany">{sz("uzemeltetes.letiltas_miert")}</p>
      </section>

      <section className="grid gap-2">
        <Szakaszcim>{sz("uzemeltetes.naplo_cim")}</Szakaszcim>
        {naplo.length === 0 ? (
          <Ures>{sz("uzemeltetes.naplo_ures")}</Ures>
        ) : (
          <ul className="grid gap-1" data-naplo="lista">
            {naplo.map((sor) => (
              <li key={sor.id} className="text-sm">
                {u(naploMondata(sor))}{" "}
                <span className="text-halvany">
                  {sz("uzemeltetes.naplo_mikor", { mikor: sor.mikor })}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-halvany">{sz("uzemeltetes.naplo_miert")}</p>
      </section>
    </div>
  );
}
