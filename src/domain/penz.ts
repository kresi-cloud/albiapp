/** Pénz és dátum: az egész alkalmazás egész forintban számol. */

export function forint(osszegFt: number): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(osszegFt);
}

export function datum(ertek: Date): string {
  return new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(ertek);
}

/**
 * Magyar kivonatok összegoszlopa sokféle: "180 000", "180.000,00", "-45 000 Ft",
 * "180000.00". Mindegyikből egész forintot csinálunk.
 */
export function osszegetForintra(nyers: string): number | null {
  const tisztitott = nyers
    .replace(/ /g, " ")
    .replace(/(ft|huf)/gi, "")
    .replace(/\s/g, "")
    .trim();
  if (tisztitott === "") return null;

  const vesszoUtolso = tisztitott.lastIndexOf(",");
  const pontUtolso = tisztitott.lastIndexOf(".");
  let normalizalt = tisztitott;

  if (vesszoUtolso > pontUtolso) {
    // magyar írásmód: a vessző a tizedesjel
    normalizalt = tisztitott.replace(/\./g, "").replace(",", ".");
  } else if (pontUtolso > vesszoUtolso) {
    const tizedesResz = tisztitott.slice(pontUtolso + 1);
    // ezres elválasztó akkor, ha pontosan három számjegy áll utána
    normalizalt =
      tizedesResz.length === 3
        ? tisztitott.replace(/\./g, "")
        : tisztitott.replace(/,/g, "");
  }

  const szam = Number(normalizalt);
  if (!Number.isFinite(szam)) return null;
  return Math.round(szam);
}

/** Naptári napok különbsége, időzóna nélkül, a nap elejére vágva. */
export function napKulonbseg(tol: Date, ig: Date): number {
  const egyNap = 24 * 60 * 60 * 1000;
  return Math.round((napEleje(ig).getTime() - napEleje(tol).getTime()) / egyNap);
}

export function napEleje(ertek: Date): Date {
  return new Date(
    Date.UTC(ertek.getUTCFullYear(), ertek.getUTCMonth(), ertek.getUTCDate()),
  );
}
