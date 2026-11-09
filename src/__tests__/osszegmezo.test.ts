/**
 * Összegmező-kapu: egy összeget egy olvasó olvas, és nem számmezőből.
 *
 * Két szabály, és mindkettő egy valódi, élesben vagy próbakörben megtalált
 * hibából lett.
 *
 * **Egy: az űrlapról jövő összeget az `urlapForint` (vagy árnál az
 * `urlapFiller`) olvassa, nem az `osszegetForintra`.** A kettő nem ugyanaz: az
 * `urlapForint` háromfélét ad vissza (`null` az üres mező, `NaN` az
 * olvashatatlan, a szám minden másra), és van felső korlátja. Az
 * `osszegetForintra` csak `null`-t ad, korlát nélkül — és egy elgépelt,
 * irreálisan nagy összeg emiatt nem hibaüzenetet adott az adóösszesítőn,
 * hanem 500-as hibalapot.
 *
 * **Kettő: összegmező nem `type="number"`.** A böngésző a magyar „195 000"
 * alakot érvénytelennek tartja, és olyankor **üres értéket küld**: a beírt
 * összeg szótlanul eltűnik. A „195.000" alakot pedig százkilencvenötnek
 * olvassa. Ebből lett a szerződés „szünet havi díja" rovatában „50 Ft, azaz
 * ötven forint", és ebből lett korábban kilenc hónapnyi 180 forintos bérleti
 * díj is. A mező helyesen szövegmező `inputMode="decimal"`-lal: telefonon így
 * is számbillentyűzet jön fel.
 *
 * A számmezőre van egy kivétel, névvel és okkal: a párosítási időablak napjai
 * (`AblakUrlap`) nem összeg, és `min`/`max` korláttal a számmező ott a helyes
 * alak. A kivétel listája azért van kiírva, hogy egy új számmező felvétele
 * döntés legyen, ne véletlen.
 *
 * Sem a típusellenőrzés, sem a fordítás nem fogja meg egyiket sem: mindkettő
 * szerint `string` az is, amit a böngésző üresen küld, és `number | null` az
 * is, aminek nincs felső korlátja.
 */

import { describe, expect, it } from "vitest";
import { forrasok, megjegyzesNelkul } from "./forrasok";

/** Hívja-e a fájl az `osszegetForintra`-t? */
export function nyersOlvasotHiv(tartalom: string): boolean {
  return /\bosszegetForintra\s*\(/.test(megjegyzesNelkul(tartalom));
}

/** Van-e a fájlban `type="number"` beviteli mező? */
export function szammezotIr(tartalom: string): boolean {
  // A kifejezéses alakot is nézi (`type={... ? "date" : "number"}`): pont
  // abban állt a szerződés paramétermezője.
  return /type=\s*(?:"number"|\{[^}]*?"number")/.test(megjegyzesNelkul(tartalom));
}

/**
 * Ahol a számmező a helyes alak, mert nem összeg.
 *
 * A párosítási időablak napokban megy, nulla és egy felső korlát között: ott a
 * böngésző saját lépegetője és korlátja segít, és ezres tagolás nincs.
 */
const SZAMMEZO_KIVETELEK = new Set(["app/beallitasok/AblakUrlap.tsx"]);

const FORRASOK = forrasok().filter((f) => f.utvonal.startsWith("app/"));

describe("összegmező-kapu", () => {
  it("önpróba: a tiltott alakokat tényleg megfogja", () => {
    // Egy kapu, ami mindenre igent mond, rosszabb a semminél. Mindkét első
    // példa pontosan az, ami a próbakörben előjött.
    expect(nyersOlvasotHiv('const ar = osszegetForintra(String(urlap.get("ar")));')).toBe(true);
    expect(nyersOlvasotHiv('const ar = urlapForint(urlap.get("ar"));')).toBe(false);
    expect(nyersOlvasotHiv("// osszegetForintra(x)")).toBe(false);

    expect(szammezotIr('<Mezo name="dij" type="number" />')).toBe(true);
    expect(szammezotIr('<Mezo name="dij" type={tipus === "datum" ? "date" : "number"} />')).toBe(
      true,
    );
    expect(szammezotIr('<Mezo name="dij" type="text" inputMode="decimal" />')).toBe(false);
    expect(szammezotIr('{/* nem type="number", mert magyar alakban gépelnek */}')).toBe(false);
  });

  it("van mit mérni: a lapok olvasnak összeget", () => {
    // Enélkül a következő állítások üres halmazra lennének igazak.
    const olvasok = FORRASOK.filter((f) =>
      /\burlapForint\s*\(|\burlapFiller\s*\(/.test(f.tartalom),
    );
    expect(olvasok.length).toBeGreaterThan(4);
  });

  it("az űrlapról jövő összeget az urlapForint olvassa", () => {
    const vetkesek = FORRASOK.filter((f) => nyersOlvasotHiv(f.tartalom)).map((f) => f.utvonal);
    expect(vetkesek).toEqual([]);
  });

  it("összegmező nem számmező", () => {
    const vetkesek = FORRASOK.filter(
      (f) => szammezotIr(f.tartalom) && !SZAMMEZO_KIVETELEK.has(f.utvonal),
    ).map((f) => f.utvonal);
    expect(vetkesek).toEqual([]);
  });

  it("a kivétellista nem avul el: amit felsorol, az létezik és tényleg számmező", () => {
    // Egy kivétel, ami már nem is igaz, csendben kinyitná a kaput egy másik
    // fájl előtt, ha valaki ide másolja a nevét.
    for (const utvonal of SZAMMEZO_KIVETELEK) {
      const forras = FORRASOK.find((f) => f.utvonal === utvonal);
      expect(forras, utvonal).toBeDefined();
      expect(szammezotIr(forras!.tartalom), utvonal).toBe(true);
    }
  });
});
