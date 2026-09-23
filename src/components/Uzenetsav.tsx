/** Közös visszajelzés-doboz az űrlapokhoz: siker zölden, hiba pirosan. */
export function Uzenetsav({
  allapot,
  uzenet,
  hibak = [],
}: {
  allapot: "ures" | "kesz" | "hiba";
  uzenet: string;
  hibak?: string[];
}) {
  if (allapot === "ures") return null;

  return (
    <div
      /**
       * Állandó fogódzó a böngészős próbának: a kiszolgálói művelet akkor futott
       * le, amikor ez a sáv megjelent. A `networkidle` erre nem jó — a válasz
       * később jön, mint ahogy a hálózat elcsendesedik, és a következő `goto`
       * elvágja a függőben lévő kérést. Feliratra szűrni pedig azért nem lehet,
       * mert a felület kétnyelvű.
       */
      data-uzenet={allapot}
      className={`rounded-lg border p-3 text-sm ${
        allapot === "hiba"
          ? "border-gond-keret bg-gond-lap text-gond"
          : "border-rendben-keret bg-rendben-lap text-rendben"
      }`}
    >
      <p className="font-medium">{uzenet}</p>
      {hibak.length > 0 ? (
        <ul className="mt-2 grid gap-1 pl-4 [&>li]:list-disc">
          {hibak.map((sor) => (
            <li key={sor}>{sor}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
