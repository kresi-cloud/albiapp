"use client";

import { useActionState } from "react";
import { Mezo } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import { emailtCserel, jelszotCserel, nevetMent, type Eredmeny } from "./actions";
import { GOMB, MEZO } from "@/components/urlap";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", hibak: [] };

function Kartya({ cim, sugo, children }: { cim: string; sugo: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-kartya border border-keret bg-felulet p-4">
      <div>
        <h2 className="font-semibold">{cim}</h2>
        <p className="text-sm text-halvany">{sugo}</p>
      </div>
      {children}
    </div>
  );
}

export function NevUrlap({
  nev,
  cimkek,
}: {
  nev: string;
  cimkek: { cim: string; sugo: string; mezo: string; gomb: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(nevetMent, KEZDETI);

  return (
    <Kartya cim={cimkek.cim} sugo={cimkek.sugo}>
      <form action={kuldes} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.mezo}</span>
          <Mezo
            name="nev"
            type="text"
            autoComplete="name"
            defaultValue={nev}
            className={MEZO}
            required
            allapot={allapot.allapot}
          />
        </label>
        <button type="submit" disabled={folyamatban} className={`${GOMB} justify-self-start`}>
          {folyamatban ? "…" : cimkek.gomb}
        </button>
        <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
      </form>
    </Kartya>
  );
}

/**
 * Jelszócsere. A jelszómezők szándékosan nem a megőrző mezőn mennek: az
 * újragépelésük két másodperc, a megőrzésük viszont ott hagyná az értéket
 * olyankor is, amikor a felhasználó már rég továbblépett.
 */
export function JelszoUrlap({
  cimkek,
}: {
  cimkek: { cim: string; sugo: string; mostani: string; uj: string; ujra: string; gomb: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(jelszotCserel, KEZDETI);

  return (
    <Kartya cim={cimkek.cim} sugo={cimkek.sugo}>
      <form action={kuldes} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.mostani}</span>
          <input
            name="mostani"
            type="password"
            autoComplete="current-password"
            className={MEZO}
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.uj}</span>
          <input
            name="jelszo"
            type="password"
            autoComplete="new-password"
            className={MEZO}
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.ujra}</span>
          <input
            name="jelszoUjra"
            type="password"
            autoComplete="new-password"
            className={MEZO}
            required
          />
        </label>
        <button type="submit" disabled={folyamatban} className={`${GOMB} justify-self-start`}>
          {folyamatban ? "…" : cimkek.gomb}
        </button>
        <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
      </form>
    </Kartya>
  );
}

export function EmailUrlap({
  email,
  cimkek,
}: {
  email: string;
  cimkek: { cim: string; sugo: string; mostani: string; uj: string; gomb: string };
}) {
  const [allapot, kuldes, folyamatban] = useActionState(emailtCserel, KEZDETI);

  return (
    <Kartya cim={cimkek.cim} sugo={cimkek.sugo}>
      <form action={kuldes} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.uj}</span>
          <Mezo
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={email}
            className={MEZO}
            required
            allapot={allapot.allapot}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.mostani}</span>
          <input
            name="mostani"
            type="password"
            autoComplete="current-password"
            className={MEZO}
            required
          />
        </label>
        <button type="submit" disabled={folyamatban} className={`${GOMB} justify-self-start`}>
          {folyamatban ? "…" : cimkek.gomb}
        </button>
        <Uzenetsav allapot={allapot.allapot} uzenet={allapot.uzenet} hibak={allapot.hibak} />
      </form>
    </Kartya>
  );
}
