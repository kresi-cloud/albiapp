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
      className={`rounded border p-3 text-sm ${
        allapot === "hiba"
          ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
          : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
      }`}
    >
      <p>{uzenet}</p>
      {hibak.length > 0 ? (
        <ul className="mt-2 list-disc pl-5">
          {hibak.map((sor) => (
            <li key={sor}>{sor}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
