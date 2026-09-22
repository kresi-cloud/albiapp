"use client";

import { useActionState } from "react";
import type { Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { belep, type BelepesEredmeny } from "./actions";
import { CIMKE, GOMB, MEZO } from "@/components/urlap";

const KEZDETI: BelepesEredmeny = { allapot: "ures", uzenet: "", email: "" };

export function BelepesUrlap({ nyelv = "hu" }: { nyelv?: Nyelv }) {
  const { sz } = szovegekNyelvvel(nyelv);
  const [allapot, kuldes, folyamatban] = useActionState(belep, KEZDETI);

  return (
    <form
      action={kuldes}
      className="grid gap-4 rounded-kartya border border-keret bg-felulet p-5"
    >
      <label className="grid gap-1.5">
        <span className={CIMKE}>{sz("belepes.email")}</span>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          key={allapot.email}
          defaultValue={allapot.email}
          className={MEZO}
          required
        />
      </label>

      <label className="grid gap-1.5">
        <span className={CIMKE}>{sz("belepes.jelszo")}</span>
        <input
          id="jelszo"
          name="jelszo"
          type="password"
          autoComplete="current-password"
          className={MEZO}
          required
        />
      </label>

      {/* A lap egyetlen művelete, ezért teljes szélességben áll. */}
      <button type="submit" disabled={folyamatban} className={`${GOMB} w-full`}>
        {folyamatban ? sz("belepes.folyamatban") : sz("belepes.gomb")}
      </button>

      {allapot.allapot === "hiba" ? (
        <p className="rounded-lg border border-gond-keret bg-gond-lap p-3 text-sm font-medium text-gond">
          {allapot.uzenet}
        </p>
      ) : null}
    </form>
  );
}
