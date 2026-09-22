import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { nyitvatartasSzovege } from "@/domain/beszelgetes";
import { datumIdovelNyelven } from "@/domain/nyelv";
import { beszelgetes } from "@/lib/beszelgetes";
import { belepettFelhasznalo, szerepe } from "@/lib/munkamenet";
import { szovegek } from "@/lib/nyelv";
import { NYITO } from "@/components/ui/alap";
import { Valasz } from "../Urlapok";

export const dynamic = "force-dynamic";

/**
 * Hány üzenet áll nyitva a szál alján.
 *
 * Egy hosszú beszélgetés különben magától nőne ki a nyolc telefonképernyős
 * korlátból, és pont a legfrissebb üzenet kerülne a legaljára, több képernyőnyi
 * görgetés mögé. A régebbi nem tűnik el, csak összecsukva áll.
 */
const FRISS_DARAB = 15;

export default async function Beszelgetes({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const felhasznalo = await belepettFelhasznalo();
  if (!felhasznalo) redirect("/belepes");

  const { sz, u, nyelv } = await szovegek();
  const { id } = await params;
  const most = new Date();

  const betoltott = await beszelgetes(
    { id: felhasznalo.id, szerep: szerepe(felhasznalo) },
    id,
    most,
  );
  // Nem azt mondjuk meg, hogy létezik-e, csak azt, hogy nem az övé.
  if (!betoltott) notFound();

  const { fej, uzenetek } = betoltott;
  const nyitvatartas = nyitvatartasSzovege(fej.jogviszonyVege, most);

  const regiek = uzenetek.slice(0, Math.max(0, uzenetek.length - FRISS_DARAB));
  const frissek = uzenetek.slice(regiek.length);

  function Buborek({
    uzenet,
  }: {
    uzenet: (typeof uzenetek)[number];
  }) {
    const sajat = uzenet.szerzoId === felhasznalo!.id;
    return (
      <li
        className={`max-w-[85%] rounded-lg border p-3 ${
          sajat
            ? "justify-self-end border-rendben-keret bg-rendben-lap"
            : "justify-self-start border-keret bg-felulet"
        }`}
      >
        <p className="text-xs text-nagyon-halvany">
          {sajat ? sz("beszelgetes.en") : uzenet.szerzoNev} ·{" "}
          {datumIdovelNyelven(uzenet.kuldve, nyelv)}
        </p>
        {/*
          A sortörést megtartjuk, de jelölést nem értelmezünk: amit a másik fél
          írt, az szöveg, nem formázás. A böngésző így sem futtat belőle semmit.
        */}
        <p className="mt-1 whitespace-pre-wrap break-words text-sm">{uzenet.szoveg}</p>
      </li>
    );
  }

  return (
    <div className="grid gap-4">
      <Link href="/beszelgetesek" className="text-sm underline underline-offset-2">
        {sz("beszelgetes.vissza")}
      </Link>

      <section>
        <h1 className="text-xl font-semibold tracking-tight">{fej.nev}</h1>
        <p className="mt-1 text-sm text-halvany">
          {fej.ingatlanNev} · {u({ kulcs: `beszelgetes.fajta.${fej.fajta}` })} ·{" "}
          {fej.resztvevok.map((tag) => tag.nev).join(", ")}
        </p>
        {nyitvatartas ? (
          <p
            className={`mt-2 rounded border p-2 text-sm ${
              fej.archivalt
                ? "border-keret-eros bg-felulet-halk text-szoveg"
                : "border-figyelem-keret bg-figyelem-lap text-figyelem"
            }`}
          >
            {u(nyitvatartas)}
          </p>
        ) : null}
      </section>

      {regiek.length > 0 ? (
        <details>
          <summary className={NYITO}>
            {sz("beszelgetes.korabbi_uzenetek", { darab: regiek.length })}
          </summary>
          <ul className="mt-3 grid gap-2">
            {regiek.map((uzenet) => (
              <Buborek key={uzenet.id} uzenet={uzenet} />
            ))}
          </ul>
        </details>
      ) : null}

      <ul className="grid gap-2">
        {frissek.map((uzenet) => (
          <Buborek key={uzenet.id} uzenet={uzenet} />
        ))}
      </ul>

      {fej.archivalt ? (
        <p className="text-sm text-halvany">
          {sz("beszelgetes.archivalt_nem_irhato")}
        </p>
      ) : (
        <Valasz
          beszelgetesId={fej.id}
          cimkek={{
            cimke: sz("beszelgetes.valasz"),
            pelda: sz("beszelgetes.uzenet_pelda"),
            gomb: sz("beszelgetes.kuldes"),
            folyamatban: sz("beszelgetes.kuldom"),
          }}
        />
      )}
    </div>
  );
}
