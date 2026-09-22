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
