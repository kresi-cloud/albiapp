"use client";

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

/**
 * Űrlapmezők, amik túlélik az elutasított mentést.
 *
 * A React a kiszolgálói művelet lefutása után visszaállítja az űrlapot. A
 * „beküldöm, aztán tiszta lappal jön a következő" esetre ez pont jó,
 * elutasításkor viszont azt jelenti, hogy a bérbeadó kitölt húsz mezőt,
 * egyetlen hibát vét, és mindet újrakezdheti. Ez a hiba sem a
 * típusellenőrzésen, sem a fordításon nem akad fenn: csak akkor derül ki, ha
 * valaki tényleg elront egy mezőt egy futó böngészőben.
 *
 * Ezek a mezők maguk tartják az értéküket, ezért a React nem tudja elvenni.
 * Sikeres mentés után viszont visszaállnak a kezdőértékre, mert akkor tényleg
 * új adat következik — ehhez elég az `allapot`, ami minden űrlapban megvan.
 *
 * Jelszóhoz szándékosan nem ezt használjuk: egy elutasított belépésnél a
 * jelszó újragépelése két másodperc, a megőrzése viszont ott hagyná a mezőben
 * olyankor is, amikor a felhasználó már rég továbblépett.
 */

export type UrlapAllapot = "ures" | "kesz" | "hiba";

/**
 * A közös rész: a mező a sajátjaként tartja az értéket, és csak akkor ejti el,
 * amikor a művelet sikerrel zárult.
 *
 * A neve kivételesen angolul kezdődik: a React megköveteli, hogy a horgok neve
 * `use`-zal induljon, különben a szabályaikat sem az eszközök, sem a fordító
 * nem tudja ellenőrizni.
 */
export function useMegorzottErtek(
  allapot: UrlapAllapot,
  kezdo: string | number,
) {
  const [ertek, allit] = useState(String(kezdo));
  const [elozo, elozotAllit] = useState(allapot);

  // Állapotfrissítés kirajzolás közben: a React ezt támogatja, és így nem
  // villan fel egy pillanatra a régi érték a sikeres mentés után.
  if (allapot !== elozo) {
    elozotAllit(allapot);
    if (allapot === "kesz") allit(String(kezdo));
  }

  return [ertek, allit] as const;
}

/**
 * Az űrlap-visszaállítás nem áll meg a vezérelt mezőnél sem.
 *
 * Amikor a React a művelet után visszaállítja az űrlapot, az elemben ott a
 * `value`, a React viszont nem rajzol újra semmit, mert az ő oldalán az érték
 * nem változott. A kettő ilyenkor szétcsúszik, és a felhasználó a
 * *visszaállított* értéket látja. Legjobban a `<select>`-en látszik: a
 * választott rezsimód csendben visszaugrott az elsőre.
 *
 * Ezért a kirajzolás után ránézünk az elemre, és ha elcsúszott attól, amit a
 * React szerint mutatnia kellene, visszaírjuk. Gépelés közben ez sosem fut le
 * érdemben, mert olyankor a kettő megegyezik.
 */
function useVisszairas<E extends { value: string }>(ertek: string) {
  const elem = useRef<E>(null);

  useEffect(() => {
    if (elem.current && elem.current.value !== ertek) {
      elem.current.value = ertek;
    }
  });

  return elem;
}

/**
 * A legördülő, aminek az értéke egyetlen opcióra sem illik.
 *
 * Ez a mező vezérelt: a React a tartott értéket írja az elemre. Ha az érték
 * üres — mert a hívó nem adott `defaultValue`-t —, a böngésző **semmit nem
 * jelöl ki** (`selectedIndex` −1): a felhasználó üres legördülőt lát, a
 * beküldés pedig üres értéket visz, és a kiszolgáló jogosan utasítja el.
 * Vezérelt mező nélkül ez nem fordulna elő: a natív `<select>` magától az
 * első opciót jelöli ki.
 *
 * Ezért kirajzolás után átvesszük az első opció értékét. Ugyanaz az elv, mint
 * a visszaírásnál: ami a képernyőn látszik, és ami beküldésre kerül, nem
 * mondhat mást. A hívónak ettől még érdemes `defaultValue`-t adnia — az a
 * szándékot is kimondja —, de az elfelejtése ne csendes hiba legyen.
 *
 * Üres opcióértékre („Nem tartozik bérleményhez") ez nem fut le: ott az üres
 * érték illik egy opcióra, tehát ki is van jelölve.
 */
function useElsotJelol(
  elem: RefObject<HTMLSelectElement | null>,
  allit: (ertek: string) => void,
) {
  useEffect(() => {
    const select = elem.current;
    if (!select || select.options.length === 0) return;
    if (select.selectedIndex === -1) allit(select.options[0].value);
  });
}

/**
 * Ugyanaz a visszaírás rádiógombra. Külön kell, mert ott nem a `value`
 * csúszik el, hanem a `checked`: a visszaállított űrlapon a megjelölt
 * lehetőség jelöletlen lesz, a React szerint viszont minden rendben.
 */
function useJelolesVisszairasa(jelolt: boolean) {
  const elem = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (elem.current && elem.current.checked !== jelolt) {
      elem.current.checked = jelolt;
    }
  });

  return elem;
}

export function Mezo({
  allapot,
  defaultValue = "",
  ...tovabbi
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue"> & {
  allapot: UrlapAllapot;
  defaultValue?: string | number;
}) {
  const [ertek, allit] = useMegorzottErtek(allapot, defaultValue);
  const elem = useVisszairas<HTMLInputElement>(ertek);

  return (
    <input
      {...tovabbi}
      ref={elem}
      value={ertek}
      onChange={(esemeny) => allit(esemeny.target.value)}
    />
  );
}

export function Valaszto({
  allapot,
  defaultValue = "",
  children,
  ...tovabbi
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "defaultValue"> & {
  allapot: UrlapAllapot;
  defaultValue?: string | number;
}) {
  const [ertek, allit] = useMegorzottErtek(allapot, defaultValue);
  const elem = useVisszairas<HTMLSelectElement>(ertek);
  useElsotJelol(elem, allit);

  return (
    <select
      {...tovabbi}
      ref={elem}
      value={ertek}
      onChange={(esemeny) => allit(esemeny.target.value)}
    >
      {children}
    </select>
  );
}

/**
 * Rádiógomb, ami megjelölve marad az elutasított beküldés után is. A
 * választást a hívó tartja (`useMegorzottErtek`), mert a csoport egy adat,
 * nem mezőnként külön.
 */
export function Valasztogomb({
  jelolt,
  ...tovabbi
}: Omit<InputHTMLAttributes<HTMLInputElement>, "checked" | "type"> & {
  jelolt: boolean;
}) {
  const elem = useJelolesVisszairasa(jelolt);
  return <input {...tovabbi} type="radio" ref={elem} checked={jelolt} />;
}

export function Szovegdoboz({
  allapot,
  defaultValue = "",
  ...tovabbi
}: Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "defaultValue"
> & {
  allapot: UrlapAllapot;
  defaultValue?: string | number;
}) {
  const [ertek, allit] = useMegorzottErtek(allapot, defaultValue);
  const elem = useVisszairas<HTMLTextAreaElement>(ertek);

  return (
    <textarea
      {...tovabbi}
      ref={elem}
      value={ertek}
      onChange={(esemeny) => allit(esemeny.target.value)}
    />
  );
}
