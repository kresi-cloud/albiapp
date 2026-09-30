/**
 * Megőrzési kapu: elutasított mentés nem viheti el a begépelt adatot.
 *
 * A React a kiszolgálói művelet lefutása után visszaállítja az űrlapot. Ez a
 * „beküldöm, aztán tiszta lappal jön a következő" esetre jó, elutasításkor
 * viszont pont azt viszi el, amit meg kellene tartani. Ezért megy minden
 * űrlapmező a `components/megorzo.tsx` közös mezőin: azok maguk tartják az
 * értéküket, és csak sikeres művelet után ejtik el.
 *
 * Ez a kapu azért van, mert a szabály egy lapról lemaradt, és élesben derült
 * ki: a bérbeadói adatlap kilenc mezője nyers `<input defaultValue>` volt, így
 * egyetlen elgépelt adóazonosító miatt az anyja nevét és a bankszámlaszámot is
 * újra kellett gépelni. A kód olvasásán ez nem látszik, a típusellenőrzésen és
 * a fordításon nem akad fenn, és a böngészős próba is csak azokat a lapokat
 * nézte, amikre valaki gondolt.
 *
 * A szabály: `src/app` alatt nyers `<input>` nem hordozhat `defaultValue`-t.
 * Két kivétel van, és mindkettő szándékos:
 *
 * - aminek `key`-e is van: az a belépés, a regisztráció és a meghívó, ahol a
 *   művelet maga adja vissza a beírt értéket, és a `key` kényszeríti ki az
 *   újrarajzolást. Ott a megőrzés a művelet eredményében ül, nem a mezőben;
 * - a `defaultChecked`: a jelölő állapota nem az `value`-ban van, azt a
 *   visszaállítás nem üríti ki.
 *
 * Jelszót szándékosan nem őrzünk meg, fájlmezőt pedig nem is lehet: azok
 * `defaultValue`-t sem hordoznak, tehát ebbe a szabályba bele sem futnak.
 */

import { describe, expect, it } from "vitest";
import { forrasok } from "./forrasok";

/** Egy `<input …>` elem szövege, a nyitótól a záró jelig. */
function inputElemek(tartalom: string): string[] {
  const talalt: string[] = [];
  let hol = tartalom.indexOf("<input");
  while (hol !== -1) {
    // A JSX-attribútumok között lehet `>` (nyíl a függvényben), ezért a
    // legkorábbi `/>`-ig megyünk, és ha az nincs, a sima `>`-ig.
    const onzaro = tartalom.indexOf("/>", hol);
    const sima = tartalom.indexOf(">", hol);
    const vege = onzaro !== -1 && (sima === -1 || onzaro <= sima + 1) ? onzaro + 2 : sima + 1;
    talalt.push(tartalom.slice(hol, vege));
    hol = tartalom.indexOf("<input", vege);
  }
  return talalt;
}

/** Megőrzés nélküli, begépelt értéket hordozó nyers mező. */
function orizetlen(elem: string): boolean {
  if (!/\bdefaultValue\b/.test(elem)) return false;
  if (/\bkey=/.test(elem)) return false; // a művelet adja vissza az értéket
  return true;
}

const LAPOK = forrasok().filter((f) => f.utvonal.startsWith("app/") && f.utvonal.endsWith(".tsx"));

describe("megőrzési kapu", () => {
  it("önpróba: a tiltott alakot tényleg megfogja", () => {
    // Egy kapu, ami mindenre igent mond, rosszabb a semminél. Ez a három sor
    // pontosan az a hiba, ami élesben előjött, és a két megengedett alak.
    expect(orizetlen('<input name="adoazonosito" defaultValue={ertek} />')).toBe(true);
    expect(orizetlen('<input name="email" key={allapot.email} defaultValue={allapot.email} />')).toBe(
      false,
    );
    expect(orizetlen('<input type="checkbox" name="almero" defaultChecked={almero} />')).toBe(false);
  });

  it("önpróba: a több sorba tört mezőt is egy elemként olvassa", () => {
    const elemek = inputElemek('<input\n  name="a"\n  defaultValue={x}\n/>\n<input type="file" />');
    expect(elemek).toHaveLength(2);
    expect(orizetlen(elemek[0])).toBe(true);
    expect(orizetlen(elemek[1])).toBe(false);
  });

  it("van mit mérni: a lapok között vannak űrlapok", () => {
    // Enélkül a következő állítás üres halmazra lenne igaz.
    expect(LAPOK.filter((f) => f.tartalom.includes("<input")).length).toBeGreaterThan(0);
  });

  it("nyers mező nem hordoz begépelt értéket megőrzés nélkül", () => {
    const vetkesek: string[] = [];
    for (const lap of LAPOK) {
      for (const elem of inputElemek(lap.tartalom)) {
        if (orizetlen(elem)) vetkesek.push(`${lap.utvonal}: ${elem.replace(/\s+/g, " ").slice(0, 80)}`);
      }
    }
    expect(vetkesek).toEqual([]);
  });
});
