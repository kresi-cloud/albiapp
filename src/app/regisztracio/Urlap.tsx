"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { regisztral, type RegisztracioEredmeny } from "./actions";
import { CIMKE, GOMB, MEZO } from "@/components/urlap";

const KEZDETI: RegisztracioEredmeny = {
  allapot: "ures",
  uzenet: "",
  hibak: [],
  nev: "",
  email: "",
};

export function RegisztracioUrlap({ nyelv = "hu" }: { nyelv?: Nyelv }) {
  const { sz } = szovegekNyelvvel(nyelv);
  const [allapot, kuldes, folyamatban] = useActionState(regisztral, KEZDETI);

  return (
    <form
      action={kuldes}
      className="grid gap-4 rounded-kartya border border-keret bg-felulet p-5"
    >
      <label className="grid gap-1.5">
        <span className={CIMKE}>{sz("regisztracio.nev")}</span>
        {/*
          A `key` az elutasításkor visszakapott értékre mutat: a React a
          művelet után visszaállítaná az űrlapot, és a begépelt név elveszne.
          Ugyanaz a megoldás, mint a belépésnél a címnél.
        */}
        <input
          name="nev"
          type="text"
          autoComplete="name"
          key={`nev-${allapot.nev}`}
          defaultValue={allapot.nev}
          className={MEZO}
          required
        />
        <span className="text-xs text-nagyon-halvany">{sz("regisztracio.nev_sugo")}</span>
      </label>

      <label className="grid gap-1.5">
        <span className={CIMKE}>{sz("belepes.email")}</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          key={`email-${allapot.email}`}
          defaultValue={allapot.email}
          className={MEZO}
          required
        />
      </label>

      <label className="grid gap-1.5">
        <span className={CIMKE}>{sz("belepes.jelszo")}</span>
        {/* Jelszót nem őrzünk meg: újragépelni két másodperc, ott hagyni viszont
            olyankor is a mezőben maradna, amikor a felhasználó már továbblépett. */}
        <input
          name="jelszo"
          type="password"
          autoComplete="new-password"
          className={MEZO}
          required
        />
      </label>

      <label className="grid gap-1.5">
        <span className={CIMKE}>{sz("regisztracio.jelszo_ujra")}</span>
        <input
          name="jelszoUjra"
          type="password"
          autoComplete="new-password"
          className={MEZO}
          required
        />
      </label>

      <button type="submit" disabled={folyamatban} className={`${GOMB} w-full`}>
        {folyamatban ? sz("regisztracio.folyamatban") : sz("regisztracio.gomb")}
      </button>

      {allapot.allapot === "hiba" ? (
        <div className="rounded-lg border border-gond-keret bg-gond-lap p-3 text-sm text-gond">
          <p className="font-medium">{allapot.uzenet}</p>
          {allapot.hibak.length > 0 ? (
            <ul className="mt-1 grid gap-0.5 ps-4 [list-style:disc]">
              {allapot.hibak.map((hiba) => (
                <li key={hiba}>{hiba}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <Link href="/belepes" className="text-center text-sm text-halvany underline underline-offset-2">
        {sz("regisztracio.belepes")}
      </Link>
    </form>
  );
}
