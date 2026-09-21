import type { Allapot } from "@/domain/egyeztetes";
import type { Nyelv } from "@/domain/nyelv";
import { szovegekNyelvvel } from "@/domain/szotar";
import { Jelzo, type Allapotszin } from "@/components/ui/alap";

/**
 * Az öt egyeztetési állapot három színre képződik le, és a leképezés
 * termékdöntés, nem ízlés.
 *
 * Az `elter` azért nem piros, mert ott a két fél egyetért abban, mi történt,
 * csak nem az előírt összeg jött — az nem vita, és bizonylatot sem kérünk rá.
 * A `varakozik` pedig végképp nem baj: még csak az egyik fél nyilatkozott.
 * Pirosat egyedül az kap, ahol tényleg tenni kell valamit: a két fél mást
 * mond, vagy a pénz nem jött meg.
 */
const SZIN: Record<Allapot, Allapotszin> = {
  egyezik: "rendben",
  elter: "figyelem",
  vitas: "gond",
  varakozik: "semleges",
  hianyzik: "gond",
};

const KULCS: Record<Allapot, string> = {
  egyezik: "egyeztetes.egyezik",
  elter: "egyeztetes.elter",
  vitas: "egyeztetes.vitas_cimke",
  varakozik: "egyeztetes.varakozik_cimke",
  hianyzik: "egyeztetes.hianyzik_cimke",
};

export function Allapotjelzo({ allapot, nyelv }: { allapot: Allapot; nyelv: Nyelv }) {
  const { sz } = szovegekNyelvvel(nyelv);

  return (
    <Jelzo allapot={SZIN[allapot]}>
      <span className="capitalize">{sz(KULCS[allapot])}</span>
    </Jelzo>
  );
}
