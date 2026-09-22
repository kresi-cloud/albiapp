"use client";

import { useActionState } from "react";
import { Mezo } from "@/components/megorzo";
import { meghivotKeszit, type MeghivoEredmeny } from "./actions";
import { GOMB, MEZO } from "@/components/urlap";

const KEZDETI: MeghivoEredmeny = { allapot: "ures", uzenet: "", link: "" };

export function MeghivoGomb({
  jogviszonyBerloId,
  email,
  cimke,
  emailCimke,
  folyamatbanCimke,
}: {
  jogviszonyBerloId: string;
  email: string;
  cimke: string;
  emailCimke: string;
  folyamatbanCimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(meghivotKeszit, KEZDETI);

  return (
    <form action={kuldes} className="mt-3 grid gap-2">
      <input type="hidden" name="jogviszonyBerloId" value={jogviszonyBerloId} />

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{emailCimke}</span>
        <Mezo
          name="email"
          type="email"
          defaultValue={email}
          className={MEZO}
          required
          allapot={allapot.allapot}
        />
      </label>

      <button
        type="submit"
        disabled={folyamatban}
        className={GOMB}
      >
        {folyamatban ? folyamatbanCimke : cimke}
      </button>

      {allapot.allapot !== "ures" ? (
        <div
          className={`rounded border p-3 text-sm ${
            allapot.allapot === "hiba"
              ? "border-gond-keret bg-gond-lap text-gond"
              : "border-rendben-keret bg-rendben-lap text-rendben"
          }`}
        >
          <p>{allapot.uzenet}</p>
          {allapot.link ? (
            <input
              readOnly
              value={allapot.link}
              onFocus={(esemeny) => esemeny.currentTarget.select()}
              className="mt-2 w-full rounded border border-keret-eros bg-felulet px-2 py-1 text-xs"
            />
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
