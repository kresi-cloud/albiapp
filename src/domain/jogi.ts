/**
 * Jogi tájékoztatók.
 *
 * Két oldal: mit kezdünk a személyes adatokkal, és mire való ez az alkalmazás.
 * Nem a szótárban vannak, mert hosszú, szakaszokra tagolt szövegek, és nem
 * mondatonként fordulnak elő a felületen.
 *
 * Az üzemeltető adatai szögletes zárójelben állnak: ezt a bérbeadónak kell
 * kitöltenie, mielőtt élesben bárkinek kiadja a linket. Nem találjuk ki
 * helyette, mert az adatkezelő megnevezése jogi nyilatkozat.
 */

import type { Nyelv } from "./nyelv";

export type JogiSzakasz = { cim: string; bekezdesek: string[] };

export type JogiOldal = {
  cim: string;
  bevezeto: string;
  frissitve: string;
  szakaszok: JogiSzakasz[];
};

export const KITOLTENDO = "[kitöltendő]";

const ADATKEZELES: Record<Nyelv, JogiOldal> = {
  hu: {
    cim: "Adatkezelési tájékoztató",
    bevezeto:
      "Ez a tájékoztató azt mondja el, milyen személyes adatot kezel az alkalmazás, miért, " +
      "meddig, és mit tehetsz ezzel kapcsolatban. Az alapelv egyszerű: csak azt kérjük, ami a " +
      "bérbeadás dokumentumaihoz és elszámolásaihoz kell.",
    frissitve: "Hatályos: 2026. szeptember 20.",
    szakaszok: [
      {
        cim: "Ki kezeli az adatokat",
        bekezdesek: [
          `Az adatkezelő: ${KITOLTENDO} (név, cím, e-mail-cím). Az alkalmazást magánszemély ` +
            "bérbeadó üzemelteti a saját bérleményeihez; az adatkezelő megnevezését élesítés " +
            "előtt ki kell tölteni.",
          "A bérlő adatait a bérbeadó viszi be vagy a bérlő maga adja meg a saját fiókjában. A " +
            "bérbeadó az adatai vonatkozásában adatkezelő, az alkalmazás pedig az az eszköz, " +
            "amiben ezt az adatot tartja.",
        ],
      },
      {
        cim: "Milyen adatot kezelünk, és miért",
        bekezdesek: [
          "Belépéshez: név, e-mail-cím és a jelszó titkosított lenyomata. A jelszót magát nem " +
            "tároljuk, és nem is tudjuk visszafejteni.",
          "Szerződéshez és igazolásokhoz: születési hely és idő, anyja neve, lakcím, " +
            "igazolványszám, adóazonosító jel, bankszámlaszám, telefonszám. Ezek kizárólag a " +
            "kiadott okiratokba kerülnek bele.",
          "Elszámoláshoz: mérőóraállások, bankszámlakivonat sorai, előírt tételek és a bérlő " +
            "által igazolt befizetések.",
          "Hibabejelentéshez: a bejelentés szövege, a hozzá tartozó üzenetek, és hogy ki mikor " +
            "melyik állapotba lépett.",
        ],
      },
      {
        cim: "Mit nem csinálunk",
        bekezdesek: [
          "Nem adunk el és nem adunk tovább adatot harmadik félnek, és nem használjuk " +
            "hirdetésre vagy profilozásra.",
          "Személyes adat nem kerül a naplóba: a hibakeresés a működésről szól, nem arról, ki " +
            "mit írt be.",
          "A bérlő csak a saját jogviszonyához tartozó adatot látja, és a névre szóló " +
            "igazolásából is csak a sajátját.",
          "A betekintő linket a bérlő adja ki a saját fizetési előzményéről, és bármikor " +
            "visszavonhatja. A link nem tartalmazza a bérbeadó nevét, a pontos címet, a " +
            "lakótársak nevét és semmilyen személyes adatot, és magától is lejár. A " +
            "megnyitásáról csak az időpontot tároljuk.",
        ],
      },
      {
        cim: "Meddig tartjuk meg",
        bekezdesek: [
          "A kiállított okiratokat és a számviteli szempontból lényeges adatokat a jogszabályi " +
            "megőrzési idő végéig, egyébként a jogviszony megszűnését követő elszámolásig és az " +
            "esetleges igényérvényesítés elévüléséig.",
          "A fiókod törlését bármikor kérheted; a törlés nem érinti a már kiállított, " +
            "jogszabály alapján megőrzendő okiratokat.",
        ],
      },
      {
        cim: "Milyen jogaid vannak",
        bekezdesek: [
          "Kérheted a rólad kezelt adatok másolatát, a pontatlan adat helyesbítését, a törlést, " +
            "az adatkezelés korlátozását, és tiltakozhatsz az adatkezelés ellen.",
          `A kéréseidet a ${KITOLTENDO} e-mail-címre küldheted. Ha nem vagy elégedett a ` +
            "válasszal, panaszt tehetsz a Nemzeti Adatvédelmi és Információszabadság Hatóságnál " +
            "(naih.hu), és bírósághoz is fordulhatsz.",
        ],
      },
      {
        cim: "Hol tároljuk",
        bekezdesek: [
          "Az adatok európai uniós adatközpontban lévő adatbázisban vannak. Az alkalmazás " +
            "jelenleg próbaüzemben működik; a tárhely adatai szintén kitöltendők élesítés előtt.",
        ],
      },
    ],
  },
  en: {
    cim: "Privacy notice",
    bevezeto:
      "This notice explains what personal data the app handles, why, for how long, and what you " +
      "can do about it. The principle is simple: we only ask for what the tenancy documents and " +
      "the settlements need.",
    frissitve: "In force from 20 September 2026.",
    szakaszok: [
      {
        cim: "Who handles your data",
        bekezdesek: [
          `The controller: ${KITOLTENDO} (name, address, email). The app is run by a private ` +
            "landlord for their own properties; the controller's details must be filled in " +
            "before the app goes live.",
          "Tenant data is entered by the landlord, or by the tenant in their own account. The " +
            "landlord is the controller of that data; the app is the tool that holds it.",
        ],
      },
      {
        cim: "What data we handle, and why",
        bekezdesek: [
          "For signing in: name, email address and a hashed form of your password. The password " +
            "itself is never stored and cannot be recovered.",
          "For the lease and certificates: place and date of birth, mother's name, address, ID " +
            "number, tax identification number, bank account number, phone number. These only " +
            "ever appear in the issued documents.",
          "For settlements: meter readings, bank statement lines, scheduled items and the " +
            "payments confirmed by the tenant.",
          "For fault reports: the text of the report, the messages attached to it, and who moved " +
            "it to which status and when.",
        ],
      },
      {
        cim: "What we do not do",
        bekezdesek: [
          "We do not sell or pass data to third parties, and we do not use it for advertising or " +
            "profiling.",
          "Personal data is kept out of the logs: debugging is about how the app behaves, not " +
            "about what anyone typed.",
          "A tenant only sees data belonging to their own tenancy, and only their own personal " +
            "certificates.",
          "The reference link is issued by the tenant about their own payment history, and can " +
            "be revoked at any time. It contains no landlord name, no exact address, no " +
            "flatmate names and no personal data, and it expires on its own. Of an opening we " +
            "store only the time.",
        ],
      },
      {
        cim: "How long we keep it",
        bekezdesek: [
          "Issued documents and data that matters for accounting are kept for the retention " +
            "period required by law; everything else until the tenancy is settled and any claims " +
            "have lapsed.",
          "You can ask for your account to be deleted at any time; deletion does not affect " +
            "documents already issued that must be retained by law.",
        ],
      },
      {
        cim: "Your rights",
        bekezdesek: [
          "You may ask for a copy of the data held about you, for inaccurate data to be " +
            "corrected, for erasure, for processing to be restricted, and you may object to " +
            "processing.",
          `Send your requests to ${KITOLTENDO}. If you are not satisfied with the answer, you ` +
            "may complain to the Hungarian data protection authority (naih.hu) and you may also " +
            "go to court.",
        ],
      },
      {
        cim: "Where it is stored",
        bekezdesek: [
          "The data sits in a database hosted in the European Union. The app is currently in " +
            "trial use; the hosting details must also be filled in before it goes live.",
        ],
      },
    ],
  },
};

const FELTETELEK: Record<Nyelv, JogiOldal> = {
  hu: {
    cim: "Felhasználási feltételek",
    bevezeto:
      "Ez az alkalmazás magánszemély bérbeadóknak és a bérlőiknek készült. Nyilvántart, számol " +
      "és dokumentumot állít elő; nem jár el helyetted, és nem dönt helyetted.",
    frissitve: "Hatályos: 2026. szeptember 20.",
    szakaszok: [
      {
        cim: "Mit csinál az alkalmazás",
        bekezdesek: [
          "Összeveti az előírt tételt, a bérlő által igazolt befizetést és a bankszámlakivonat " +
            "sorát, és megmutatja, hol tér el a három.",
          "Kiszámolja a rezsielszámolást a megadott díjszabás és mérőóraállások alapján, " +
            "tételes részletezéssel.",
          "Éves adóösszesítőt készít a beérkezett és beazonosított befizetésekből.",
          "Szerződést, átadás-átvételi jegyzőkönyvet és bérbeadói igazolást állít elő a " +
            "felvitt adatokból.",
        ],
      },
      {
        cim: "Mit nem csinál",
        bekezdesek: [
          "Az adóösszesítő összesítés, nem bevallás: nem küld be semmit a NAV-nak, és nem " +
            "helyettesíti a bevallást.",
          "Az alkalmazás nem ad jogi és nem ad adótanácsot. A szerződésmodulok szövege " +
            "sablonszöveg; ügyvédi ellenjegyzés nélkül a felület tervezetként jelöli őket.",
          "A hibabejelentésnél a költségviselőre tett javaslat tájékoztatás, nem döntés: a " +
            "felek megállapodása és a szerződés az irányadó.",
        ],
      },
      {
        cim: "Miért felelsz te",
        bekezdesek: [
          "Azért, amit beírsz: a bérleti díjért, a díjszabásért, a mérőóraállásokért és a " +
            "feltöltött kivonatért. Az alkalmazás ezekből számol, és rossz adatból rossz szám " +
            "lesz.",
          "A jelszavadért és a meghívó linkért. A meghívó egyszer használható, és aki megkapja, " +
            "fiókot tud készíteni vele.",
        ],
      },
      {
        cim: "Próbaüzem",
        bekezdesek: [
          "Az alkalmazás jelenleg fejlesztés alatt áll. Az adatokról készíts saját másolatot " +
            "arról, ami fontos, és a kiadott dokumentumokat töltsd le.",
        ],
      },
    ],
  },
  en: {
    cim: "Terms of use",
    bevezeto:
      "This app is built for private landlords and their tenants. It keeps records, calculates " +
      "and produces documents; it does not act for you, and it does not decide for you.",
    frissitve: "In force from 20 September 2026.",
    szakaszok: [
      {
        cim: "What the app does",
        bekezdesek: [
          "It compares the scheduled item, the payment confirmed by the tenant and the line on " +
            "the bank statement, and shows where the three differ.",
          "It calculates utility settlements from the tariffs and meter readings you enter, with " +
            "an itemised breakdown.",
          "It produces a yearly tax summary from payments that actually arrived and were " +
            "identified.",
          "It produces the lease, the handover record and the landlord's certificate from the " +
            "data already entered.",
        ],
      },
      {
        cim: "What it does not do",
        bekezdesek: [
          "The tax summary is a summary, not a return: it files nothing with the tax authority " +
            "and does not replace your return.",
          "The app gives neither legal nor tax advice. The lease modules are template text; " +
            "without a lawyer's countersignature the app marks them as drafts.",
          "On a fault report, the suggestion about who bears the cost is information, not a " +
            "decision: what the parties agreed and what the lease says prevail.",
        ],
      },
      {
        cim: "What you are responsible for",
        bekezdesek: [
          "What you enter: the rent, the tariffs, the meter readings and the statement you " +
            "upload. The app calculates from these, and bad data gives bad numbers.",
          "Your password and your invitation link. An invitation can be used once, and whoever " +
            "receives it can create an account with it.",
        ],
      },
      {
        cim: "Trial use",
        bekezdesek: [
          "The app is under development. Keep your own copy of anything important, and download " +
            "the documents that have been issued.",
        ],
      },
    ],
  },
};

export function jogiOldal(fajta: "adatkezeles" | "feltetelek", nyelv: Nyelv): JogiOldal {
  return fajta === "adatkezeles" ? ADATKEZELES[nyelv] : FELTETELEK[nyelv];
}
