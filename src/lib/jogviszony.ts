/**
 * A jogviszony lezárása.
 *
 * Eddig a `statusz` mező ott volt a sémában, de semmi nem állította: a
 * jogviszony örökké élt, és a havi előírások örökké keletkeztek volna.
 *
 * A lezárás nem töröl semmit a múltból. Amit viszont muszáj rendbe tennie: a
 * kiköltözés utáni hónapok előírásai már nem állnak fenn, mert az az időszak
 * nincs. Ezeket törli, a záró hónapét pedig napra arányosítja — de csak akkor,
 * ha az még a generált, teljes havi összeg. Amit ember írt át, ahhoz nem nyúl.
 *
 * Ami így egyeztetés nélkül marad (befizetés, amihez már nincs előírás), nem
 * vész el: az "előírás nélkül beérkezett pénz" listáján jön elő, ahogy minden
 * más be nem sorolható utalás.
 */

import { ablakotKezd } from "@/domain/ertekeles";
import { eloirasok, idoszakHonapja } from "@/domain/eloirasok";
import { napEleje } from "@/domain/penz";
import { honapKulcsa as honapKulcs } from "@/domain/berlemeny";
import { jogviszonyAdatta as adatta } from "@/lib/eloirasok";
import { prisma } from "@/lib/db";

export type LezarasEredmeny =
  | {
      allapot: "kesz";
      toroltEloirasok: number;
      aranyositottEloirasok: number;
      /** Amit a lezárás nem törlött, mert valamelyik fél már nyilatkozott róla. */
      megtartottEloirasok: number;
    }
  | { allapot: "nincs_jogosultsag" }
  | { allapot: "mar_lezart" }
  /** A vége nem lehet korábbi a kezdetnél: abból minden előírás törlése lenne. */
  | { allapot: "vege_a_kezdet_elott"; kezdete: Date };

/**
 * A lezárás egyetlen tranzakcióban fut.
 *
 * Három írás tartozik össze: a kiköltözés utáni előírások törlése, a státusz
 * átállítása és a záró hónap arányosítása. Ezek között egy másik kérés
 * féligkész állapotot látna — lezárt jogviszonyt teljes havi bérleti díjjal,
 * vagy élőt már arányosított összeggel —, és abból a bérlőnek kiírt összeg
 * lenne rossz. SQLite-on ez rejtve maradt, mert ott az írás sorosítva van;
 * Postgresen a lapok tényleg egyszerre futnak.
 */
export async function jogviszonytLezar(
  tulajdonosId: string,
  jogviszonyId: string,
  vege: Date,
): Promise<LezarasEredmeny> {
  return prisma.$transaction(async (tx) => {
    const jogviszony = await tx.jogviszony.findFirst({
      where: { id: jogviszonyId, ingatlan: { tulajdonosId } },
      include: { eloirtTetelek: true },
    });
    if (!jogviszony) return { allapot: "nincs_jogosultsag" };

    // A lezárás a nyitott jogviszony művelete. Lezártat újra lezárni azért nem
    // lehet, mert a második lezárás korábbi véget is kaphatna: az már egyeztetett
    // előírt tételeket törölne, és a záró hónapot újraarányosítaná. Aki a
    // dátumot javítani akarja, előbb visszavonja a lezárást — az vissza is
    // számolja, amit az első elvett —, és utána zár le újra.
    if (jogviszony.statusz !== "elo") return { allapot: "mar_lezart" };

    // A kiköltözés napja nem lehet korábbi a beköltözésnél.
    //
    // Ennélkül egy elgépelt évszám minden előírást a „kiköltözés utáni" közé
    // sorolt: Anna harmincegy előírása nullára ment, a kiadott
    // rezsielszámolás előírás nélkül maradt, a felület pedig sikert jelentett.
    if (napEleje(vege).getTime() < napEleje(jogviszony.kezdete).getTime()) {
      return { allapot: "vege_a_kezdet_elott", kezdete: jogviszony.kezdete };
    }

    const zaroHonap = honapKulcs(vege);

    // A kiköltözés hónapja utáni előírások: az az időszak már nincs.
    //
    // A hónapot hasonlítjuk, nem a nyers jelet: a rezsielszámolás előírása
    // kaphat sorszámot („2026-09/2"), és az szövegesen nagyobb a hónapnál —
    // szeptemberi kiköltözésnél a lezárás így egy kiadott elszámolás előírását
    // törölte, az okirat pedig előírás nélkül maradt.
    const kikoltozesUtan = jogviszony.eloirtTetelek.filter(
      (tetel) => idoszakHonapja(tetel.idoszak) > zaroHonap,
    );

    // Amiről valamelyik fél már nyilatkozott, azt a lezárás nem viszi el.
    //
    // A bizonylat és a beérkezés-igazolás `onDelete: Cascade` az előíráson,
    // tehát egy törölt sorral a másik fél feltöltött fájlja és a „erre nem
    // érkezett pénz" nyilatkozata is végleg elveszne, a kiadott elszámolás
    // pedig előírás nélkül maradna — és a visszavonás sem hozná vissza,
    // mert a pótlás csak új, üres sort tud csinálni. Ugyanaz az elv, mint a
    // bizonylatkérés kikapcsolásánál: egy művelet ne tüntesse el csendben a
    // másik fél fájlját.
    const erintett =
      kikoltozesUtan.length === 0
        ? []
        : await tx.eloirtTetel.findMany({
            where: {
              id: { in: kikoltozesUtan.map((tetel) => tetel.id) },
              OR: [
                { bizonylatok: { some: {} } },
                { berbeadoiIgazolasok: { some: {} } },
                { elszamolas: { isNot: null } },
              ],
            },
            select: { id: true },
          });
    const megtartott = new Set(erintett.map((tetel) => tetel.id));
    const torlendo = kikoltozesUtan.filter((tetel) => !megtartott.has(tetel.id));

    if (torlendo.length > 0) {
      await tx.eloirtTetel.deleteMany({
        where: { id: { in: torlendo.map((tetel) => tetel.id) } },
      });
    }

    // Az értékelési ablak kezdetét itt tároljuk el, és **csak egyszer**.
    //
    // Nem a `vege` a kezdete: az a kiköltözés beírt napja, a bérlő viszont addig
    // nem is látta, hogy a bérlet lezárult, amíg a bérbeadó nem rögzítette. Egy
    // visszakeltezett lezárás enélkül azonnal felfedné a másik fél addig rejtett
    // szövegét. Előre rögzített lezárásnál viszont a kiköltözés napja a későbbi,
    // és akkor az a kezdet: a bérlet addig még fut.
    //
    // És nem számoljuk újra: a lezárás visszavonható, utána újra le lehet zárni,
    // és ha az ablak ilyenkor újraindulna, a bérbeadó egy visszavonással új
    // harminc napot adhatna annak, aki a másik szövegét már elolvasta.
    const ablak = ablakotKezd(jogviszony.ertekelesAblak, vege, new Date());

    await tx.jogviszony.update({
      where: { id: jogviszonyId },
      data: { statusz: "lezart", vege, ertekelesAblak: ablak },
    });

    // A záró hónap arányosítása: a domain mondja meg, mennyi jár.
    const frissitett = await tx.jogviszony.findUniqueOrThrow({
      where: { id: jogviszonyId },
      include: {
        elofizetesek: { include: { jovahagyasok: true } },
        berlok: { select: { berloId: true } },
        dijValtozasok: { orderBy: [{ ervenyesTol: "asc" }, { id: "asc" }] },
      },
    });
    const kellene = eloirasok(adatta(frissitett), vege).filter(
      (eloiras) => eloiras.idoszak === zaroHonap,
    );

    let aranyositott = 0;
    for (const eloiras of kellene) {
      const meglevo = jogviszony.eloirtTetelek.find(
        (tetel) =>
          tetel.tipus === eloiras.tipus &&
          tetel.idoszak === zaroHonap &&
          tetel.forrasId === eloiras.forrasId,
      );
      if (!meglevo || meglevo.osszegFt === eloiras.osszegFt) continue;

      // Csak a saját sorunkat igazítjuk. Amit ember írt át, ahhoz nem nyúlunk:
      // az a bérbeadó döntése volt.
      //
      // Saját kétféle lehet: a teljes havi összeg, vagy egy már arányosított
      // töredék, amit a `reszletezes` jelöl. A második korábban kimaradt, és
      // pont az esett ki vele, amikor valaki egy hónapon belül költözött be
      // és ki: a beköltözés hónapja már nem a teljes havi összeg volt, tehát
      // a lezárás nem nyúlt hozzá — húrom hét helyett három hét plusz a
      // hónap végéig járó rész maradt kiírva. Ugyanezt a jelölést nézi a
      // lezárás visszavonása is.
      const teljesHavi =
        eloiras.tipus === "berleti_dij"
          ? frissitett.berletiDijFt
          : eloiras.tipus === "kozos_koltseg"
            ? frissitett.kozosKoltsegFt
            : eloiras.tipus === "elofizetes"
              ? (frissitett.elofizetesek.find((sor) => sor.id === eloiras.forrasId)?.haviDijFt ?? 0)
              : frissitett.rezsiAtalanyFt;
      const sajatSor = meglevo.reszletezes !== null || meglevo.osszegFt === teljesHavi;
      if (!sajatSor) continue;

      await tx.eloirtTetel.update({
        where: { id: meglevo.id },
        data: {
          osszegFt: eloiras.osszegFt,
          reszletezes: eloiras.reszletezes ? JSON.stringify(eloiras.reszletezes) : null,
        },
      });
      aranyositott += 1;
    }

    return {
      allapot: "kesz",
      toroltEloirasok: torlendo.length,
      aranyositottEloirasok: aranyositott,
      megtartottEloirasok: megtartott.size,
    };
  });
}

/**
 * A lezárás visszavonása. Nem elég a státuszt átállítani: a záró hónap
 * arányosított összege bent maradna, és a pótlás sem javítaná ki, mert az
 * meglévő előírást soha nem ír át. Egy elkattintott lezárás így csendben
 * kevesebb bérleti díjat írna elő. Ezért itt visszaszámoljuk, amit a lezárás
 * arányosított.
 *
 * Csak azt a sort igazítjuk, amelyikhez a mi részletezésünk tartozik: az
 * jelzi, hogy az összeget a rendszer számolta. A beköltözés hónapja is ilyen,
 * de az arányosítása a nyitott jogviszonynál is ugyanannyi marad, ezért nem
 * változik.
 */
export async function jogviszonytUjranyit(
  tulajdonosId: string,
  jogviszonyId: string,
): Promise<boolean> {
  // Ugyanaz a tranzakciós szabály, mint a lezárásnál: a státusz visszaállítása
  // és a visszaszámolás együtt érvényes, vagy sehogy.
  return prisma.$transaction(async (tx) => {
    // Az értékelési ablak kezdetét csak akkor felejtjük el, ha még senki nem
    // írt ezen a jogviszonyon: egy elkattintott lezárásnak ne maradjon nyoma.
    // Ha viszont már van értékelés, a kezdet marad, mert a visszavonás
    // különben új harminc napot adna annak, aki a másikét már elolvasta.
    const irtakMar = await tx.ertekeles.count({ where: { jogviszonyId } });

    const eredmeny = await tx.jogviszony.updateMany({
      where: { id: jogviszonyId, ingatlan: { tulajdonosId }, statusz: "lezart" },
      data:
        irtakMar > 0
          ? { statusz: "elo", vege: null }
          : { statusz: "elo", vege: null, ertekelesAblak: null },
    });
    if (eredmeny.count === 0) return false;

    const jogviszony = await tx.jogviszony.findUniqueOrThrow({
      where: { id: jogviszonyId },
      include: {
        eloirtTetelek: true,
        elofizetesek: { include: { jovahagyasok: true } },
        berlok: { select: { berloId: true } },
        dijValtozasok: { orderBy: [{ ervenyesTol: "asc" }, { id: "asc" }] },
      },
    });

    const kellene = new Map(
      eloirasok(adatta(jogviszony), new Date()).map((eloiras) => [
        `${eloiras.tipus}|${eloiras.idoszak}|${eloiras.forrasId}`,
        eloiras,
      ]),
    );

    for (const tetel of jogviszony.eloirtTetelek) {
      if (tetel.reszletezes === null) continue;
      const eloiras = kellene.get(`${tetel.tipus}|${tetel.idoszak}|${tetel.forrasId}`);
      if (!eloiras || eloiras.osszegFt === tetel.osszegFt) continue;
      await tx.eloirtTetel.update({
        where: { id: tetel.id },
        data: {
          osszegFt: eloiras.osszegFt,
          reszletezes: eloiras.reszletezes ? JSON.stringify(eloiras.reszletezes) : null,
        },
      });
    }

    return true;
  });
}

export type DijValtozasHiba = "nem_tied" | "van_mar" | "eloirtuk";

/**
 * A legkésőbbi hónap, amire ennek a jogviszonynak már van előírása.
 *
 * A díjemelés ennél későbbi hónaptól indulhat: meglévő előírást soha nem írunk
 * át, tehát egy korábbi hónapra beírt emelés szótlanul nem csinálna semmit.
 */
export async function utolsoEloirtHonap(jogviszonyId: string): Promise<string | null> {
  const tetelek = await prisma.eloirtTetel.findMany({
    where: { jogviszonyId },
    select: { idoszak: true },
  });
  if (tetelek.length === 0) return null;
  // A hónapot a jelből vesszük, nem a teljes kulcsból: a rezsielszámolás
  // előírása kaphat sorszámot („2026-09/2"), és az szövegesen nagyobb.
  return tetelek
    .map((tetel) => tetel.idoszak.slice(0, 7))
    .reduce((legkesobbi, honap) => (honap > legkesobbi ? honap : legkesobbi));
}

export async function dijValtozastRogzit(
  tulajdonosId: string,
  jogviszonyId: string,
  adat: {
    ervenyesTol: Date;
    berletiDijFt: number;
    kozosKoltsegFt: number;
    rezsiAtalanyFt: number;
  },
): Promise<"kesz" | DijValtozasHiba> {
  const jogviszony = await prisma.jogviszony.findFirst({
    where: { id: jogviszonyId, ingatlan: { tulajdonosId } },
    select: { id: true },
  });
  if (!jogviszony) return "nem_tied";

  try {
    await prisma.dijValtozas.create({ data: { jogviszonyId, ...adat } });
  } catch {
    // Az egyediségi kulcs a fék: ugyanarra a hónapra két összeg közül a
    // sorrend döntene, Postgresen pedig az nincs garantálva.
    return "van_mar";
  }
  return "kesz";
}

/**
 * Díjemelés visszavonása.
 *
 * Csak addig, amíg nem született rá előírás: onnantól a bérlőnek kiírt összeg
 * már az új díj, és a visszavonás a régi összeget úgy hozná vissza, hogy a
 * kiadott előírás marad. Aki tévedett, későbbi hónaptól rögzít újat.
 */
export async function dijValtozastVisszavon(
  tulajdonosId: string,
  dijValtozasId: string,
): Promise<"kesz" | DijValtozasHiba> {
  const valtozas = await prisma.dijValtozas.findFirst({
    where: { id: dijValtozasId, jogviszony: { ingatlan: { tulajdonosId } } },
    select: { id: true, jogviszonyId: true, ervenyesTol: true },
  });
  if (!valtozas) return "nem_tied";

  const honap = honapKulcs(valtozas.ervenyesTol);
  const utolso = await utolsoEloirtHonap(valtozas.jogviszonyId);
  if (utolso !== null && utolso >= honap) return "eloirtuk";

  await prisma.dijValtozas.delete({ where: { id: dijValtozasId } });
  return "kesz";
}
