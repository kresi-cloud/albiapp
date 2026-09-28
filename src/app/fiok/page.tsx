import { redirect } from "next/navigation";
import { belepettFelhasznalo } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { Lapfej } from "@/components/ui/alap";
import { EmailUrlap, JelszoUrlap, NevUrlap } from "./Urlapok";

export const dynamic = "force-dynamic";

/**
 * A saját fiók: név, jelszó, e-mail-cím.
 *
 * Mindkét szerepé, mert a belépési adat mindkettőé. Eddig egyik sem volt
 * módosítható sehol: aki elgépelte a nevét, azzal a névvel kötött szerződést,
 * és aki jelszót akart cserélni, annak az adatbázishoz kellett nyúlni.
 */
export default async function Fiok() {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) redirect("/belepes");
  const { sz } = await szovegek();

  return (
    <div className="grid gap-6">
      <Lapfej cim={sz("fiok.cim")} alcim={sz("fiok.bevezeto")} />

      <NevUrlap
        nev={felhasznalo.nev}
        cimkek={{
          cim: sz("fiok.nev_cim"),
          sugo: sz("fiok.nev_sugo"),
          mezo: sz("regisztracio.nev"),
          gomb: sz("fiok.nev_gomb"),
        }}
      />

      <JelszoUrlap
        cimkek={{
          cim: sz("fiok.jelszo_cim"),
          sugo: sz("fiok.jelszo_sugo"),
          mostani: sz("fiok.jelszo_mostani"),
          uj: sz("fiok.jelszo_uj"),
          ujra: sz("fiok.jelszo_uj_ujra"),
          gomb: sz("fiok.jelszo_gomb"),
        }}
      />

      <EmailUrlap
        email={felhasznalo.email}
        cimkek={{
          cim: sz("fiok.email_cim"),
          sugo: sz("fiok.email_sugo"),
          mostani: sz("fiok.jelszo_mostani"),
          uj: sz("fiok.email_uj"),
          gomb: sz("fiok.email_gomb"),
        }}
      />
    </div>
  );
}
