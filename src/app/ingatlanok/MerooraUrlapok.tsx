"use client";

import { useActionState } from "react";
import { Mezo, Valaszto } from "@/components/megorzo";
import { Uzenetsav } from "@/components/Uzenetsav";
import { APRO_GOMB, GOMB, MEZO, VISSZAVONO_GOMB } from "@/components/urlap";
import { MERTEKEGYSEGEK, type MerooraTipus } from "@/domain/meroora";
import {
  dijszabastFelveszAction,
  dijszabastTorolAction,
  merooratFelveszAction,
  merooratModositAction,
  merooratTorolAction,
  type Eredmeny,
} from "./actions";

const KEZDETI: Eredmeny = { allapot: "ures", uzenet: "", mezok: [], figyelmeztetesek: [] };

export type MerooraCimkek = {
  tipus: string;
  tipusNevek: Record<string, string>;
  mertekegyseg: string;
  gyariSzam: string;
  almero: string;
  almeroSugo: string;
  gomb: string;
  folyamatban: string;
};

export type DijszabasCimkek = {
  ervenyesTol: string;
  kedvezmenyes: string;
  piaci: string;
  keret: string;
  alapdij: string;
  csatorna: string;
  csatornaSugo: string;
  gomb: string;
  folyamatban: string;
};

/** A visszajelzés és a figyelmeztetés egy helyen: a sáv kezeli mindkettőt. */
function Valasz({ allapot }: { allapot: Eredmeny }) {
  return (
    <Uzenetsav
      allapot={allapot.allapot}
      uzenet={allapot.uzenet}
      hibak={allapot.figyelmeztetesek}
    />
  );
}

/**
 * A mérőóra mezői. Felvitelnél és javításnál ugyanazok, csak az akció más:
 * két külön űrlapban ugyanez a hat mező előbb-utóbb elcsúszna egymástól.
 */
function MerooraMezok({
  allapot,
  cimkek,
  tipus,
  mertekegyseg,
  gyariSzam,
  almero,
}: {
  allapot: Eredmeny;
  cimkek: MerooraCimkek;
  tipus?: string;
  mertekegyseg?: string;
  gyariSzam?: string;
  almero?: boolean;
}) {
  return (
    <>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.tipus}</span>
        <Valaszto
          name="tipus"
          defaultValue={tipus ?? ""}
          allapot={allapot.allapot}
          className={MEZO}
        >
          {Object.keys(MERTEKEGYSEGEK).map((fajta) => (
            <option key={fajta} value={fajta}>
              {cimkek.tipusNevek[fajta]}
            </option>
          ))}
        </Valaszto>
      </label>

      {/* A mértékegység a fajtához tartozik, nem szabad szöveg: egy elgépelt
          „m³" és „m3" két különböző mérőórának látszana ugyanazon a lapon.
          Mind a hat lehetőség itt áll, a kiszolgáló pedig a fajtához méri. */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.mertekegyseg}</span>
        <Valaszto
          name="mertekegyseg"
          defaultValue={mertekegyseg ?? ""}
          allapot={allapot.allapot}
          className={MEZO}
        >
          {[...new Set(Object.values(MERTEKEGYSEGEK).flat())].map((egyseg) => (
            <option key={egyseg} value={egyseg}>
              {egyseg}
            </option>
          ))}
        </Valaszto>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.gyariSzam}</span>
        <Mezo
          name="gyariSzam"
          defaultValue={gyariSzam ?? ""}
          allapot={allapot.allapot}
          className={MEZO}
        />
      </label>

      <label className="flex items-start gap-2 text-sm">
        {/* Jelölőnégyzetet a megőrző mező nem kezel: a böngésző a jelölést a
            visszaállítás után is megtartja, mert az nem az `value`-ban ül. */}
        <input
          type="checkbox"
          name="almero"
          defaultChecked={almero ?? false}
          className="mt-1 size-4"
        />
        <span>
          <span className="font-medium">{cimkek.almero}</span>
          <span className="block text-xs text-halvany">{cimkek.almeroSugo}</span>
        </span>
      </label>
    </>
  );
}

export function UjMerooraUrlap({
  ingatlanId,
  cimkek,
}: {
  ingatlanId: string;
  cimkek: MerooraCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(merooratFelveszAction, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-3">
      <input type="hidden" name="ingatlanId" value={ingatlanId} />
      <MerooraMezok allapot={allapot} cimkek={cimkek} />
      <Valasz allapot={allapot} />
      <button type="submit" disabled={folyamatban} className={GOMB}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
    </form>
  );
}

export function MerooraAdatUrlap({
  merooraId,
  tipus,
  mertekegyseg,
  gyariSzam,
  almero,
  cimkek,
  mentes,
}: {
  merooraId: string;
  tipus: string;
  mertekegyseg: string;
  gyariSzam: string;
  almero: boolean;
  cimkek: MerooraCimkek;
  mentes: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(merooratModositAction, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-3">
      <input type="hidden" name="merooraId" value={merooraId} />
      <MerooraMezok
        allapot={allapot}
        cimkek={cimkek}
        tipus={tipus}
        mertekegyseg={mertekegyseg}
        gyariSzam={gyariSzam}
        almero={almero}
      />
      <Valasz allapot={allapot} />
      <button type="submit" disabled={folyamatban} className={APRO_GOMB}>
        {folyamatban ? cimkek.folyamatban : mentes}
      </button>
    </form>
  );
}

export function MerooraTorloUrlap({
  merooraId,
  cimke,
}: {
  merooraId: string;
  cimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(merooratTorolAction, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-2">
      <input type="hidden" name="merooraId" value={merooraId} />
      <Valasz allapot={allapot} />
      <button type="submit" disabled={folyamatban} className={VISSZAVONO_GOMB}>
        {cimke}
      </button>
    </form>
  );
}

export function DijszabasUrlap({
  merooraId,
  tipus,
  mai,
  cimkek,
}: {
  merooraId: string;
  tipus: MerooraTipus;
  mai: string;
  cimkek: DijszabasCimkek;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(dijszabastFelveszAction, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-3">
      <input type="hidden" name="merooraId" value={merooraId} />

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.ervenyesTol}</span>
        <Mezo
          type="date"
          name="ervenyesTol"
          defaultValue={mai}
          allapot={allapot.allapot}
          className={MEZO}
        />
      </label>

      {/* Az árak szövegmezők, nem `type="number"`: a magyar alak vesszővel
          tizedeselő „36,90" egy számmezőben érvénytelen, és a böngésző ilyenkor
          üres értéket küld — a beírt ár szótlanul eltűnne. */}
      <Ar nev="kedvezmenyesAr" cimke={cimkek.kedvezmenyes} allapot={allapot} />
      <Ar nev="piaciAr" cimke={cimkek.piaci} allapot={allapot} />

      <label className="grid gap-1 text-sm">
        <span className="font-medium">{cimkek.keret}</span>
        <Mezo
          name="evesKeret"
          inputMode="decimal"
          defaultValue=""
          allapot={allapot.allapot}
          className={MEZO}
        />
      </label>

      <Ar nev="alapdijFt" cimke={cimkek.alapdij} allapot={allapot} />

      {/* A csatornadíj csak vízórán van: a mért köbméter után az elvezetés is
          jár. Máshol a kiszolgáló el is utasítja, ezért ott elő sem hozzuk. */}
      {tipus === "viz" ? (
        <label className="grid gap-1 text-sm">
          <span className="font-medium">{cimkek.csatorna}</span>
          <Mezo
            name="csatornaAr"
            inputMode="decimal"
            defaultValue=""
            allapot={allapot.allapot}
            className={MEZO}
          />
          <span className="text-xs text-halvany">{cimkek.csatornaSugo}</span>
        </label>
      ) : null}

      <Valasz allapot={allapot} />
      <button type="submit" disabled={folyamatban} className={APRO_GOMB}>
        {folyamatban ? cimkek.folyamatban : cimkek.gomb}
      </button>
    </form>
  );
}

function Ar({
  nev,
  cimke,
  allapot,
}: {
  nev: string;
  cimke: string;
  allapot: Eredmeny;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{cimke}</span>
      <Mezo
        name={nev}
        inputMode="decimal"
        defaultValue=""
        allapot={allapot.allapot}
        className={MEZO}
      />
    </label>
  );
}

export function DijszabasTorloUrlap({
  dijszabasId,
  cimke,
}: {
  dijszabasId: string;
  cimke: string;
}) {
  const [allapot, kuldes, folyamatban] = useActionState(dijszabastTorolAction, KEZDETI);

  return (
    <form action={kuldes} className="grid gap-1">
      <input type="hidden" name="dijszabasId" value={dijszabasId} />
      <Valasz allapot={allapot} />
      <button type="submit" disabled={folyamatban} className={VISSZAVONO_GOMB}>
        {cimke}
      </button>
    </form>
  );
}
