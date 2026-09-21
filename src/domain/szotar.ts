/**
 * A felület szövegei magyarul és angolul.
 *
 * Amit a domain számol, az nyelvfüggetlen: onnan csak kulcs jön. A mondat itt
 * él, egy helyen, hogy a két nyelv ne csússzon szét. A kiadott okiratok szövege
 * szándékosan nincs itt: a szerződés, a jegyzőkönyv, az igazolás és az
 * elszámolás magyarul érvényes, és fordítás helyett magyarul is marad.
 */

import { szovegezo, type Nyelv, type Szotar, type Szovegezo } from "./nyelv";

export const SZOTAR: Szotar = {
  // Nyers szöveg, amit valaki beírt: tárolt teendő címe, saját üzenet.
  nyers: { hu: "{szoveg}", en: "{szoveg}" },

  // --- Fejléc és navigáció
  "nav.attekinto": { hu: "Áttekintő", en: "Overview" },
  "nav.ingatlanok": { hu: "Ingatlanok", en: "Properties" },
  "nav.berlok": { hu: "Bérlők", en: "Tenants" },
  "nav.befizetesek": { hu: "Befizetések", en: "Payments" },
  "nav.rezsi": { hu: "Rezsi", en: "Utilities" },
  "nav.hibak": { hu: "Hibák", en: "Repairs" },
  "nav.dokumentumok": { hu: "Dokumentumok", en: "Documents" },
  "nav.ado": { hu: "Adó", en: "Tax" },
  "nav.beallitasok": { hu: "Beállítások", en: "Settings" },
  "nav.berlemenyem": { hu: "Bérleményem", en: "My home" },
  "nav.hibabejelentes": { hu: "Hibabejelentés", en: "Report a fault" },
  "nav.dokumentumaim": { hu: "Dokumentumaim", en: "My documents" },
  "nav.kilepes": { hu: "Kilépés", en: "Sign out" },
  "nav.nyelv": { hu: "Nyelv", en: "Language" },

  // --- Belépés
  "belepes.cim": { hu: "Belépés", en: "Sign in" },
  "belepes.email": { hu: "E-mail-cím", en: "Email address" },
  "belepes.jelszo": { hu: "Jelszó", en: "Password" },
  "belepes.gomb": { hu: "Belépés", en: "Sign in" },
  "belepes.folyamatban": { hu: "Belépek…", en: "Signing in…" },

  "belepes.bevezeto": {
    hu: "A bérbeadó és a bérlő ugyanitt lép be, és a szerepe szerinti oldalra érkezik.",
    en: "Landlords and tenants sign in here alike, and each lands on their own page.",
  },
  "belepes.meghivo": {
    hu:
      "Bérlőként meghívó linkkel tudsz fiókot készíteni. A linket a bérbeadód küldi el; ha nincs " +
      "meg, kérd el tőle újra.",
    en:
      "As a tenant you create an account from an invitation link. Your landlord sends it; if you " +
      "cannot find it, ask for a new one.",
  },

  // --- Meghívó
  "meghivo.nem_el": { hu: "A meghívó nem él", en: "This invitation is not valid" },
  "meghivo.felhasznalt": {
    hu: "Ezt a meghívót már felhasználták. Ha te készítetted el vele a fiókodat, lépj be.",
    en: "This invitation has already been used. If you created your account with it, sign in.",
  },
  "meghivo.lejart": {
    hu: "Ez a link lejárt vagy nem létezik. Kérj újat a bérbeadódtól.",
    en: "This link has expired or does not exist. Ask your landlord for a new one.",
  },
  "meghivo.fiok": { hu: "Fiók készítése", en: "Create your account" },
  "meghivo.bevezeto": {
    hu:
      "{berlemeny} ({cim}) bérlőjeként hívtak meg. A fiók díjmentes, és csak a saját bérleményedet " +
      "látod benne.",
    en:
      "You have been invited as a tenant of {berlemeny} ({cim}). The account is free, and you only " +
      "see your own home in it.",
  },
  "meghivo.jelszo_sugo": {
    hu:
      "A jelszó legyen legalább {hossz} karakter. Hosszabb jelszó jobban véd, mint a kevert " +
      "írásjelek.",
    en:
      "Your password should be at least {hossz} characters. A longer password protects you better " +
      "than mixed punctuation.",
  },

  // --- Egyeztetés
  "egyeztetes.egyezik": { hu: "egyezik", en: "matched" },
  "egyeztetes.elter": { hu: "eltér", en: "mismatch" },
  "egyeztetes.hianyzik_cimke": { hu: "hiányzik", en: "missing" },
  "egyeztetes.keson": {
    hu: "Megérkezett, {nap} nappal az esedékesség után.",
    en: "Received {nap} days after the due date.",
  },
  "egyeztetes.hataridore": {
    hu: "Megérkezett, határidőre.",
    en: "Received on time.",
  },
  "egyeztetes.kevesebb": {
    hu: "{osszeg} forinttal kevesebb érkezett, mint az előírás.",
    en: "HUF {osszeg} less arrived than the amount due.",
  },
  "egyeztetes.tobb": {
    hu: "{osszeg} forinttal több érkezett, mint az előírás.",
    en: "HUF {osszeg} more arrived than the amount due.",
  },
  "egyeztetes.nincs_kivonattetel": {
    hu: "A bérlő igazolta a befizetést, de a kivonaton nem találtam hozzá tételt.",
    en: "The tenant confirmed the transfer, but no matching line was found on the bank statement.",
  },
  "egyeztetes.hianyzik": {
    hu: "Az esedékesség letelt, és nem érkezett hozzá befizetés.",
    en: "The due date has passed and no payment has arrived.",
  },
  "egyeztetes.nincs_eloiras": {
    hu: "Beérkezett utalás, amihez nem tartozik előírt tétel.",
    en: "A transfer arrived that does not belong to any scheduled item.",
  },

  // --- Teendők
  "teendo.lejart": { hu: "Lejárt", en: "Overdue" },
  "teendo.ma": { hu: "Ma", en: "Today" },
  "teendo.kozeli": { hu: "Közeli", en: "Soon" },
  "teendo.kesobbi": { hu: "Később", en: "Later" },
  "teendo.nincs": {
    hu: "A következő napokra nincs teendő.",
    en: "Nothing to do in the coming days.",
  },
  "teendo.megnezem": { hu: "Megnézem", en: "Open" },
  "teendo.kesz": { hu: "Kész", en: "Done" },
  "teendo.lezarom": { hu: "Lezárom…", en: "Closing…" },
  "teendo.idoszak_osszeg": {
    hu: "{idoszak} időszak, {osszeg} Ft.",
    en: "Period {idoszak}, HUF {osszeg}.",
  },
  "teendo.elteres": { hu: "Eltérés: {osszeg} Ft.", en: "Difference: HUF {osszeg}." },
  "teendo.hianyzik.berlo": {
    hu: "Esedékes befizetés nem érkezett meg",
    en: "A payment that was due has not arrived",
  },
  "teendo.hianyzik.berbeado": {
    hu: "Elmaradt befizetés, emlékeztető küldhető",
    en: "Missed payment, you can send a reminder",
  },
  "teendo.elter.berbeado": { hu: "Eltérés a befizetésben", en: "Payment mismatch" },
  "teendo.elter.berlo": { hu: "Eltérés a befizetésedben", en: "Mismatch in your payment" },
  "teendo.elter.nincs_eloiras": {
    hu: "Beérkezett utalás, amihez nincs előírás",
    en: "A transfer arrived with no scheduled item",
  },
  "teendo.elter.nincs_kivonattetel": {
    hu: "A bérlő igazolta a befizetést, de a kivonaton nincs meg",
    en: "The tenant confirmed the transfer, but it is missing from the statement",
  },
  "teendo.kozelgo": { hu: "Közeleg a fizetési határidő", en: "Payment deadline approaching" },
  "teendo.hiba.megerosites": {
    hu: "Erősítsd meg, hogy a hiba rendben van",
    en: "Confirm that the fault has been fixed",
  },
  "teendo.hiba.elharitva": {
    hu: "{targy}. A bérbeadó elhárítottnak jelölte.",
    en: "{targy}. The landlord marked it as fixed.",
  },
  "teendo.hiba.uj": { hu: "Új hibabejelentés: {targy}", en: "New fault report: {targy}" },
  "teendo.hiba.nyitott": { hu: "Nyitott hiba: {targy}", en: "Open fault: {targy}" },
  "teendo.hiba.allapotsor": { hu: "{surgosseg} · {allapot}", en: "{surgosseg} · {allapot}" },

  // --- Hibabejelentés
  "hiba.terulet.epulet": {
    hu: "Épületszerkezet (fal, tető, csatorna, erkély)",
    en: "Building structure (wall, roof, gutter, balcony)",
  },
  "hiba.terulet.kozponti_berendezes": {
    hu: "Központi berendezés (fűtés, víz-, gáz-, villanyhálózat)",
    en: "Central systems (heating, water, gas, electricity)",
  },
  "hiba.terulet.kozos_terulet": {
    hu: "Közös helyiség (lépcsőház, kapu, felvonó)",
    en: "Common area (staircase, entrance, lift)",
  },
  "hiba.terulet.burkolat": {
    hu: "Burkolat (padló, csempe, festés)",
    en: "Surfaces (flooring, tiles, paint)",
  },
  "hiba.terulet.nyilaszaro": {
    hu: "Nyílászáró (ajtó, ablak, zár, redőny)",
    en: "Doors and windows (door, window, lock, blind)",
  },
  "hiba.terulet.berendezes": {
    hu: "Lakásberendezés (bútor, szaniter, csaptelep)",
    en: "Fixtures (furniture, sanitary ware, taps)",
  },
  "hiba.terulet.haztartasi_gep": {
    hu: "Háztartási gép (hűtő, mosógép, sütő, kazán)",
    en: "Appliance (fridge, washing machine, oven, boiler)",
  },
  "hiba.terulet.egyeb": { hu: "Egyéb", en: "Other" },

  "hiba.ok.elhasznalodas": {
    hu: "Magától romlott el, vagy elhasználódott",
    en: "It broke down or wore out on its own",
  },
  "hiba.ok.karokozas": { hu: "Mi okoztuk", en: "We caused it" },
  "hiba.ok.ismeretlen": { hu: "Nem tudom, mitől", en: "I do not know what caused it" },

  "hiba.surgosseg.veszhelyzet": { hu: "Veszélyhelyzet", en: "Emergency" },
  "hiba.surgosseg.surgos": { hu: "Sürgős", en: "Urgent" },
  "hiba.surgosseg.normal": { hu: "Ráér", en: "Can wait" },
  "hiba.surgosseg_leiras.veszhelyzet": {
    hu: "Csőtörés, gázszag, égett szag, áramütés veszélye, télen leállt fűtés: azonnal intézkedni kell.",
    en: "Burst pipe, gas smell, burning smell, risk of electric shock, heating failure in winter: act now.",
  },
  "hiba.surgosseg_leiras.surgos": {
    hu: "Használhatatlan a lakás egy része: nincs melegvíz, nem zár az ajtó, nem működik a hűtő.",
    en: "Part of the home is unusable: no hot water, the door will not lock, the fridge is dead.",
  },
  "hiba.surgosseg_leiras.normal": {
    hu: "Zavaró, de kibírja: csepegő csap, beragadt redőny, repedt csempe.",
    en: "Annoying but not pressing: a dripping tap, a stuck blind, a cracked tile.",
  },

  "hiba.allapot.bejelentve": { hu: "Bejelentve", en: "Reported" },
  "hiba.allapot.atvette": { hu: "A bérbeadó átvette", en: "The landlord has acknowledged it" },
  "hiba.allapot.folyamatban": { hu: "Javítás folyamatban", en: "Repair in progress" },
  "hiba.allapot.elharitva": {
    hu: "Elhárítva, a bérlő megerősítésére vár",
    en: "Fixed, waiting for the tenant to confirm",
  },
  "hiba.allapot.lezarva": { hu: "Lezárva", en: "Closed" },
  "hiba.allapot.elutasitva": { hu: "Elutasítva", en: "Declined" },

  "hiba.lepes.bejelentve": {
    hu: "Visszaállítom bejelentettre",
    en: "Move back to reported",
  },
  "hiba.lepes.atvette": { hu: "Átvettem", en: "Acknowledge" },
  "hiba.lepes.folyamatban": { hu: "Javítás elindult", en: "Repair started" },
  "hiba.lepes.elharitva": { hu: "Elhárítottam", en: "Mark as fixed" },
  "hiba.lepes.lezarva": { hu: "Rendben van, lezárom", en: "All good, close it" },
  "hiba.lepes.elutasitva": { hu: "Elutasítom", en: "Decline" },

  "hiba.viselo.berbeado": { hu: "A bérbeadót terheli", en: "The landlord bears the cost" },
  "hiba.viselo.berlo": { hu: "A bérlőt terheli", en: "The tenant bears the cost" },
  "hiba.viselo.megosztott": {
    hu: "Megosztva: karbantartás a bérlőé, csere a bérbeadóé",
    en: "Shared: maintenance is the tenant's, replacement is the landlord's",
  },

  "hiba.veszely.gaz": {
    hu: "Gázszag esetén ne kapcsolj villanyt, nyiss ablakot, zárd el a gázcsapot, és hívd a 112-t.",
    en: "If you smell gas, do not touch light switches, open a window, close the gas valve and call 112.",
  },
  "hiba.veszely.viz": {
    hu: "Csőtörésnél zárd el a lakás vízfőcsapját, és ha a víz villanyszerelvényhez ér, kapcsold le a kismegszakítót.",
    en: "For a burst pipe, close the main water valve, and if water reaches any electrics, switch off the breaker.",
  },
  "hiba.veszely.aram": {
    hu: "Égett szagnál vagy szikrázásnál kapcsold le a kismegszakítót, és ne használd az érintett konnektort.",
    en: "On a burning smell or sparks, switch off the breaker and stop using that socket.",
  },
  "hiba.veszely.telefon": {
    hu: "Telefonon is szólj a bérbeadónak: a bejelentés magától nem csörög.",
    en: "Call the landlord as well: a report in the app does not ring anyone's phone.",
  },

  "hiba.javaslat.karokozas": {
    hu:
      "A bérlő vagy az általa beengedett személy okozta kár helyreállítása a szerződés " +
      "karbantartási pontja szerint a bérlőt terheli.",
    en:
      "Damage caused by the tenant, or by someone the tenant let in, is repaired at the tenant's " +
      "cost under the maintenance clause of the lease.",
  },
  "hiba.javaslat.berbeadoi": {
    hu:
      "Épületszerkezeti, központi berendezési vagy közös helyiséget érintő hiba. A lakástörvény " +
      "13. § (2) bekezdése és a szerződés szerint ez a bérbeadó dolga, függetlenül attól, hogy " +
      "mitől romlott el.",
    en:
      "A fault in the building structure, the central systems or a common area. Under section 13(2) " +
      "of the Hungarian Housing Act and under the lease this is the landlord's responsibility, " +
      "whatever caused it.",
  },
  "hiba.javaslat.ismeretlen": {
    hu:
      "Amíg nem derül ki, mitől romlott el, nem tippelek. Nézzétek meg együtt, és utána mondd ki, " +
      "kit terhel a költség.",
    en:
      "Until it is clear what caused it, no guess is made. Look at it together, then decide who " +
      "bears the cost.",
  },
  "hiba.javaslat.megosztott": {
    hu:
      "Elhasználódás a lakáson belül: a rendes használattal járó kisebb karbantartás a bérlőé, a " +
      "pótlás és a csere a bérbeadóé (lakástörvény 13. § (1), és a szerződés karbantartási pontja).",
    en:
      "Wear and tear inside the home: minor maintenance from ordinary use is the tenant's, while " +
      "replacement is the landlord's (section 13(1) of the Housing Act, and the lease).",
  },

  // --- Hibakártya és űrlap
  "hiba.oldal.cim": { hu: "Hibabejelentés", en: "Report a fault" },
  "hiba.oldal.bevezeto": {
    hu:
      "Amit ide beírsz, azt a bérbeadó a teendői között látja, határidővel. Az elhárítást te " +
      "erősíted meg: amíg nem mondod, hogy rendben van, a bejelentés nyitva marad.",
    en:
      "What you write here shows up in the landlord's to-do list with a deadline. You confirm the " +
      "fix yourself: until you say it is all good, the report stays open.",
  },
  "hiba.oldal.uj": { hu: "Új bejelentés", en: "New report" },
  "hiba.oldal.elerhetoseg": { hu: "A bérbeadó elérhetősége", en: "How to reach the landlord" },
  "hiba.oldal.nincs_telefon": {
    hu:
      "Telefonszámot még nem adott meg. Veszélyhelyzetnél kérd el tőle, mert a bejelentés magától " +
      "nem csörög.",
    en:
      "No phone number given yet. Ask for one in case of an emergency: a report in the app does not " +
      "ring anyone's phone.",
  },
  "hiba.oldal.nyitottak": { hu: "Nyitott bejelentéseim", en: "My open reports" },
  "hiba.oldal.lezartak": { hu: "Lezárt bejelentéseim", en: "My closed reports" },
  "hiba.oldal.nincs_nyitott": {
    hu: "Nincs nyitott bejelentésed.",
    en: "You have no open reports.",
  },

  "hiba.urlap.berlemeny": { hu: "Melyik bérlemény", en: "Which home" },
  "hiba.urlap.targy": { hu: "Mi a baj, egy mondatban", en: "What is wrong, in one sentence" },
  "hiba.urlap.targy_pelda": {
    hu: "Csöpög a mosogató csaptelepe",
    en: "The kitchen tap is dripping",
  },
  "hiba.urlap.leiras": { hu: "Részletek", en: "Details" },
  "hiba.urlap.leiras_pelda": {
    hu: "Mióta tart, mikor jelentkezik, mit próbáltatok már.",
    en: "How long it has been going on, when it happens, what you have already tried.",
  },
  "hiba.urlap.terulet": { hu: "Mi romlott el", en: "What broke" },
  "hiba.urlap.ok": { hu: "Mitől romlott el", en: "What caused it" },
  "hiba.urlap.ok_sugo": {
    hu:
      "Ebből tudjuk megmondani, kit terhel a költség. Ha nem tudod, ne tippelj: azt is választhatod.",
    en:
      "This is what decides who bears the cost. If you do not know, do not guess: that is an option too.",
  },
  "hiba.urlap.surgosseg": { hu: "Mennyire sürgős", en: "How urgent is it" },
  "hiba.urlap.veszely_cim": { hu: "Amíg a bérbeadó ideér", en: "Until the landlord arrives" },
  "hiba.urlap.kuldes": { hu: "Bejelentem", en: "Send report" },
  "hiba.urlap.kuldom": { hu: "Küldöm…", en: "Sending…" },
  "hiba.urlap.uzenet": { hu: "Üzenet", en: "Message" },
  "hiba.urlap.uzenet_pelda": {
    hu: "Írj a másik félnek: mikor érnek rá, mit hozzon a szerelő.",
    en: "Write to the other party: when you are free, what the repairer should bring.",
  },
  "hiba.urlap.uzenet_kuldes": { hu: "Üzenet küldése", en: "Send message" },
  "hiba.urlap.viselo": { hu: "Kit terhel a költség", en: "Who bears the cost" },
  "hiba.urlap.viselo_nincs": { hu: "Még nem döntöm el", en: "Not decided yet" },
  "hiba.urlap.rogzitem": { hu: "Rögzítem", en: "Save" },
  "hiba.urlap.mentem": { hu: "Mentem…", en: "Saving…" },

  "hiba.kartya.bejelentve": { hu: "bejelentve {nap}", en: "reported {nap}" },
  "hiba.kartya.hatarido": { hu: "vállalt válasz: {nap}", en: "response promised by {nap}" },
  "hiba.kartya.lejart": { hu: " (lejárt)", en: " (overdue)" },
  "hiba.kartya.bejelento": { hu: "bejelentette: {nev}", en: "reported by {nev}" },
  "hiba.kartya.viselo": { hu: "Költségviselő: {fel}", en: "Cost borne by: {fel}" },
  "hiba.kartya.nincs_viselo": {
    hu: "A költségviselőről a bérbeadó még nem döntött. {indoklas}",
    en: "The landlord has not decided who bears the cost. {indoklas}",
  },
  "hiba.kartya.te": { hu: "Te", en: "You" },

  // --- Dokumentumtár
  "dokumentum.fajta.szerzodes": { hu: "Bérleti szerződés", en: "Lease agreement" },
  "dokumentum.fajta.jegyzokonyv": { hu: "Jegyzőkönyv", en: "Handover record" },
  "dokumentum.fajta.igazolas": { hu: "Bérbeadói igazolás", en: "Landlord's certificate" },
  "dokumentum.fajta.elszamolas": { hu: "Rezsielszámolás", en: "Utility statement" },
  "dokumentum.veglegesitve": { hu: "véglegesítve", en: "finalised" },
  "dokumentum.tervezet": { hu: "tervezet", en: "draft" },
  "dokumentum.kiallitva": { hu: "kiállítva", en: "issued" },
  "dokumentum.szerzodes.kesz": {
    hu: "Aláírásra kész szöveg, a véglegesítéskori állapotban.",
    en: "Text ready for signature, as it stood when finalised.",
  },
  "dokumentum.szerzodes.tervezet": {
    hu: "Tervezet: a modulok és a paraméterek még változtathatók.",
    en: "Draft: the modules and their values can still be changed.",
  },
  "dokumentum.jegyzokonyv.felveve": { hu: "Felvéve {nap}.", en: "Recorded on {nap}." },
  "dokumentum.igazolas.osszeg": {
    hu: "Igazolt befizetés: {osszeg} Ft.",
    en: "Confirmed payment: HUF {osszeg}.",
  },
  "dokumentum.elszamolas.vegosszeg": {
    hu: "Végösszeg: {osszeg} Ft.",
    en: "Total: HUF {osszeg}.",
  },
  "dokumentum.elszamolas.allapot.tervezet": { hu: "tervezet", en: "draft" },
  "dokumentum.elszamolas.allapot.kiadva": {
    hu: "kiadva, a bérlő elbírálására vár",
    en: "issued, waiting for the tenant",
  },
  "dokumentum.elszamolas.allapot.elfogadva": {
    hu: "a bérlő elfogadta",
    en: "accepted by the tenant",
  },
  "dokumentum.elszamolas.allapot.vitatott": {
    hu: "a bérlő vitatja",
    en: "disputed by the tenant",
  },
  "dokumentum.lista.megnyitom": { hu: "Megnyitom", en: "Open" },
  "dokumentum.lista.letoltom": { hu: "Letöltöm", en: "Download" },
  "dokumentum.lista.tervezet_jelzes": {
    hu: "Tervezet, a bérlő még nem látja.",
    en: "Draft, not visible to the tenant yet.",
  },
  "dokumentum.oldal.cim": { hu: "Dokumentumaim", en: "My documents" },
  "dokumentum.oldal.bevezeto": {
    hu:
      "Minden papír, ami a bérleményedről kiadásra került: a szerződés, az átadás-átvételi " +
      "jegyzőkönyv, a rezsielszámolások és a bérbeadói igazolások. Mindegyik letölthető, és " +
      "ugyanazt tartalmazza, amit a bérbeadó lát.",
    en:
      "Every document issued about your home: the lease, the handover record, the utility " +
      "statements and the landlord's certificates. All downloadable, and identical to what the " +
      "landlord sees.",
  },
  "dokumentum.oldal.magyarul": {
    hu:
      "A dokumentumok szövege magyar. Ez szándékos: az aláírt szerződés és a kiadott igazolás " +
      "magyarul érvényes, és a fordítás nem az, amit aláírtatok.",
    en:
      "The documents themselves are in Hungarian. That is deliberate: the signed lease and the " +
      "issued certificates are valid in Hungarian, and a translation is not what was signed.",
  },
  "dokumentum.oldal.ures": {
    hu: "Még nincs kiadott dokumentumod. Amint a bérbeadó véglegesít egyet, itt megjelenik.",
    en: "No documents yet. As soon as the landlord finalises one, it appears here.",
  },

  // --- Bérlői kezdőlap
  "berlo.udvozles": { hu: "Szia, {nev}", en: "Hello, {nev}" },
  "berlo.nincs_berlemeny": {
    hu: "Ehhez a fiókhoz még nincs bérlemény kötve. Szólj a bérbeadódnak, hogy küldjön meghívót.",
    en: "No home is linked to this account yet. Ask your landlord to send you an invitation.",
  },
  "berlo.teendok": { hu: "Mit kell tennem", en: "What I need to do" },
  "berlo.oraallas": { hu: "Óraállás beküldése", en: "Submit a meter reading" },
  "berlo.oraallas.legutobb": {
    hu: "legutóbb {ertek} {egyseg} · {nap}",
    en: "last {ertek} {egyseg} · {nap}",
  },
  "berlo.oraallas.nincs": { hu: "még nincs óraállás", en: "no reading yet" },
  "berlo.elszamolas": { hu: "Rezsielszámolás · {tol} – {ig}", en: "Utility statement · {tol} – {ig}" },
  "berlo.elszamolas.kiadva": {
    hu: "Nézd át a tételeket. Ha bármelyik nem stimmel, vitasd, és írd meg, melyik.",
    en: "Check the lines. If any of them looks wrong, dispute it and say which one.",
  },
  "berlo.elszamolas.elfogadva": {
    hu: "Ezt az elszámolást elfogadtad.",
    en: "You accepted this statement.",
  },
  "berlo.elszamolas.vitatott": {
    hu: "Ezt az elszámolást vitattad, a bérbeadó látja az üzenetedet.",
    en: "You disputed this statement; the landlord can see your message.",
  },
  "berlo.elszamolas.uzeneted": { hu: "Amit írtál: {szoveg}", en: "What you wrote: {szoveg}" },
  "berlo.befizetesek": { hu: "Befizetéseim · {berlemeny}", en: "My payments · {berlemeny}" },
  "berlo.esedekesseg": { hu: "Esedékesség: {nap}.", en: "Due: {nap}." },
  "berlo.osszesen": { hu: "Összesen", en: "Total" },

  // --- Szerveroldali visszajelzések
  "valasz.lepj_be": { hu: "Lépj be.", en: "Please sign in." },
  "valasz.nincs_hozzaferes": {
    hu: "Ehhez a bérleményhez nincs hozzáférésed.",
    en: "You do not have access to this home.",
  },
  "valasz.nem_tied": { hu: "Ez a bejelentés nem a tiéd.", en: "This report is not yours." },
  "valasz.potold": { hu: "Ezt még pótold:", en: "Please fill in:" },
  "valasz.hiany.targy": {
    hu: "Írd le egy mondatban, mi a baj.",
    en: "Describe in one sentence what is wrong.",
  },
  "valasz.hiany.leiras": {
    hu: "A részletezés nélkül nehéz eldönteni, mit kell vinni.",
    en: "Without details it is hard to tell what the repairer should bring.",
  },
  "valasz.hiany.terulet": { hu: "Válaszd ki, mi romlott el.", en: "Choose what broke." },
  "valasz.hiany.ok": { hu: "Válaszd ki, mitől romlott el.", en: "Choose what caused it." },
  "valasz.hiany.surgosseg": {
    hu: "Válaszd ki, mennyire sürgős.",
    en: "Choose how urgent it is.",
  },
  "valasz.bejelentve.veszely": {
    hu: "Bejelentve. Veszélyhelyzetnél a bejelentés mellett telefonálj is: az alkalmazás nem csörög.",
    en: "Reported. In an emergency, call as well: the app does not ring anyone's phone.",
  },
  "valasz.bejelentve": {
    hu: "Bejelentve. A bérbeadó a teendői között azonnal látja.",
    en: "Reported. It appears in the landlord's to-do list right away.",
  },
  "valasz.lepes_nem_lehet": {
    hu: "Ez a lépés innen nem lehetséges.",
    en: "That step is not possible from here.",
  },
  "valasz.uj_allapot": { hu: "Új állapot: {allapot}.", en: "New status: {allapot}." },
  "valasz.csak_berbeado": {
    hu: "Ezt csak a bérbeadó döntheti el.",
    en: "Only the landlord can decide this.",
  },
  "valasz.ismeretlen_viselo": { hu: "Ismeretlen költségviselő.", en: "Unknown cost bearer." },
  "valasz.viselo_torolve": {
    hu: "A költségviselő újra eldöntetlen.",
    en: "The cost bearer is undecided again.",
  },
  "valasz.viselo_mentve": {
    hu: "Rögzítve, a bérlő is látja.",
    en: "Saved; the tenant can see it too.",
  },
  "valasz.elkuldve": { hu: "Elküldve.", en: "Sent." },

  // --- Havi előírások
  "eloiras.toredek": {
    hu: "Töredékhónap: {elso}–{utolso}. ({napok} nap a hónap {honapNapjai} napjából). A teljes havi összeg {teljes} Ft.",
    en: "Partial month: {elso}–{utolso} ({napok} of the month's {honapNapjai} days). The full monthly amount is {teljes} HUF.",
  },
  "valasz.lezaras_datum_kell": {
    hu: "Add meg, melyik nappal zárul a jogviszony.",
    en: "Give the day the tenancy ends.",
  },
  "valasz.nincs_jogosultsag": {
    hu: "Ehhez a bérleményhez nincs jogosultságod.",
    en: "You do not have access to this tenancy.",
  },
  "valasz.lezarva": {
    hu: "Lezárva. {torolt} későbbi előírás törölve, {aranyositott} előírás arányosítva a kiköltözés napjáig.",
    en: "Closed. {torolt} later scheduled items removed, {aranyositott} pro-rated to the move-out day.",
  },
  "valasz.ujranyitva": {
    hu: "Újranyitva; a havi előírások megint keletkeznek.",
    en: "Reopened; monthly items will be created again.",
  },
  "berlok.lezaras": { hu: "Jogviszony lezárása", en: "Close the tenancy" },
  "berlok.lezaras_nap": { hu: "Melyik nappal zárul?", en: "On which day does it end?" },
  "berlok.lezaras_gomb": { hu: "Lezárom", en: "Close it" },
  "berlok.lezaras_sugo": {
    hu: "A kiköltözés utáni hónapok előírásait törlöm, a záró hónapét napra arányosítom. A múlthoz nem nyúlok.",
    en: "I remove the scheduled items for months after the move-out and pro-rate the closing month. The past is untouched.",
  },
  "berlok.lezarva": { hu: "Lezárva {nap} napjával", en: "Closed as of {nap}" },
  "berlok.ujranyit": { hu: "Mégis él", en: "Reopen" },

  // --- Betekintő nézet
  "nav.betekinto": { hu: "Betekintő", en: "Reference" },
  "betekinto.oldal.cim": { hu: "Betekintő a fizetési előzményemre", en: "A reference on my payment history" },
  "betekinto.oldal.bevezeto": {
    hu: "Ha új lakást keresel, a leendő bérbeadó rendszerint nem tud semmit rólad. Ezzel a linkkel megmutathatod neki, hogyan fizettél eddig. Az adat nem a te bemondásod: a mostani bérbeadód bankszámlakivonatából jön, amit ez az alkalmazás párosított az előírásokkal.",
    en: "When you look for a new flat, the prospective landlord knows nothing about you. This link lets you show how you have paid so far. It is not your own word: the data comes from your current landlord's bank statement, matched against the scheduled items by this app.",
  },
  "betekinto.oldal.mit_nem": {
    hu: "A link nem árulja el a bérbeadód nevét, a pontos címet, a lakótársaid nevét és semmilyen személyes adatot. Bármikor visszavonhatod, és magától is lejár.",
    en: "The link does not reveal your landlord's name, the exact address, your flatmates' names or any personal data. You can revoke it at any time, and it expires on its own.",
  },
  "betekinto.urlap.cim": { hu: "Új betekintő", en: "New reference" },
  "betekinto.urlap.jogviszony": { hu: "Melyik bérleményről?", en: "Which tenancy?" },
  "betekinto.urlap.cel": { hu: "Mire kéred?", en: "What is it for?" },
  "betekinto.urlap.cel_sugo": {
    hu: "Ez a mondat a megnyitott oldal tetején lesz, hogy a másik fél lássa, minek készült.",
    en: "This sentence appears at the top of the page so the reader can see what it was made for.",
  },
  "betekinto.urlap.cel_pelda": { hu: "például: lakásbérléshez", en: "for example: for a flat rental" },
  "betekinto.urlap.elettartam": { hu: "Meddig éljen?", en: "How long should it live?" },
  "betekinto.urlap.nap": { hu: "{napok} nap", en: "{napok} days" },
  "betekinto.urlap.osszeg": { hu: "A bérleti díj összege is látszódjon", en: "Show the rent amount as well" },
  "betekinto.urlap.osszeg_sugo": {
    hu: "Alapból nem látszik. A fizetési fegyelemhez nem kell tudni, mennyit fizetsz.",
    en: "Off by default. How much you pay is not needed to judge how you pay.",
  },
  "betekinto.urlap.gomb": { hu: "Betekintő készítése", en: "Create reference" },
  "betekinto.lista.cim": { hu: "Kiadott linkjeim", en: "Links I have issued" },
  "betekinto.lista.ures": { hu: "Még nem adtál ki betekintőt.", en: "You have not issued a reference yet." },
  "betekinto.lista.lejar": { hu: "Lejár: {nap}", en: "Expires: {nap}" },
  "betekinto.lista.megnyitas": { hu: "Megnyitva {darab} alkalommal", en: "Opened {darab} times" },
  "betekinto.lista.megnyitas_soha": { hu: "Még nem nyitották meg", en: "Not opened yet" },
  "betekinto.lista.utoljara": { hu: "Utoljára: {nap}", en: "Last time: {nap}" },
  "betekinto.lista.visszavon": { hu: "Visszavonom", en: "Revoke" },
  "betekinto.allapot.elo": { hu: "Él", en: "Live" },
  "betekinto.allapot.lejart": { hu: "Lejárt", en: "Expired" },
  "betekinto.allapot.visszavonva": { hu: "Visszavonva", en: "Revoked" },
  "betekinto.nyilvanos.cim": { hu: "Fizetési előzmény", en: "Payment history" },
  "betekinto.nyilvanos.berlo": { hu: "{nev} bérlő fizetési előzménye", en: "Payment history of {nev}" },
  "betekinto.nyilvanos.telepules": { hu: "A bérlemény települése: {telepules}", en: "The flat is in {telepules}" },
  "betekinto.nyilvanos.kezdete": { hu: "A jogviszony kezdete: {nap}", en: "Tenancy started: {nap}" },
  "betekinto.nyilvanos.el": { hu: "A jogviszony jelenleg is él.", en: "The tenancy is still running." },
  "betekinto.nyilvanos.lezart": { hu: "A jogviszony már lezárult.", en: "The tenancy has ended." },
  "betekinto.nyilvanos.dij": { hu: "Havi bérleti díj: {dij}", en: "Monthly rent: {dij}" },
  "betekinto.nyilvanos.honnan": {
    hu: "Ezek a számok a bérbeadó által feltöltött bankszámlakivonatból származnak, a kivonat sorait az alkalmazás párosította az előírt tételekkel. Nem a bérlő bejelentése.",
    en: "These numbers come from the bank statement uploaded by the landlord; the app matched its lines against the scheduled items. They are not self-reported by the tenant.",
  },
  "betekinto.nyilvanos.nincs_pontszam": {
    hu: "Pontszámot szándékosan nem adunk. A súlyozás, amit mi találnánk ki, mérésnek látszana; ítélni az olvasó dolga.",
    en: "We deliberately give no score. A weighting we invented would look like a measurement; judging is the reader's job.",
  },
  "betekinto.nyilvanos.kiadva": { hu: "A bérlő adta ki {nap} napján, lejár {lejar} napján.", en: "Issued by the tenant on {nap}, expires on {lejar}." },
  "betekinto.nyilvanos.nincs": { hu: "Ez a link lejárt vagy visszavonták.", en: "This link has expired or was revoked." },
  "betekinto.nyilvanos.nincs_bevezeto": {
    hu: "A betekintő linkek szándékosan rövid életűek. Kérd meg a bérlőt, hogy adjon ki újat.",
    en: "Reference links are deliberately short-lived. Ask the tenant to issue a new one.",
  },
  "betekinto.mondat.nincs_adat": {
    hu: "Erre a bérleményre még nem járt le egyetlen fizetési határidő sem, tehát nincs mit mutatni.",
    en: "No payment has fallen due for this tenancy yet, so there is nothing to show.",
  },
  "betekinto.mondat.honapok": {
    hu: "Eddig {honapok} hónapra volt esedékes bérleti díj.",
    en: "Rent has fallen due for {honapok} months so far.",
  },
  "betekinto.mondat.hataridore": {
    hu: "Ebből {hataridore} hónapban a határidőig megérkezett a pénz.",
    en: "Of these, the money arrived by the due date in {hataridore} months.",
  },
  "betekinto.mondat.kesve": {
    hu: "{kesve} hónapban késve érkezett, átlagosan {atlag} nappal; a leghosszabb késés {leghosszabb} nap volt.",
    en: "In {kesve} months it arrived late, by {atlag} days on average; the longest delay was {leghosszabb} days.",
  },
  "betekinto.mondat.hianyzo": {
    hu: "{hianyzo} hónapra nem érkezett beazonosítható befizetés.",
    en: "In {hianyzo} months no identifiable payment arrived.",
  },
  "betekinto.mondat.eltero": {
    hu: "{eltero} hónapban a beérkezett összeg eltért az előírttól.",
    en: "In {eltero} months the amount received differed from the scheduled one.",
  },
  "betekinto.mondat.sorozat": {
    hu: "A legutóbbi {sorozat} hónapban mindig határidőre érkezett.",
    en: "In the last {sorozat} months it always arrived on time.",
  },
  "valasz.betekinto_kesz": {
    hu: "Kész. A linket alább másolhatod ki.",
    en: "Done. You can copy the link below.",
  },
  "valasz.betekinto_visszavonva": {
    hu: "Visszavonva; a link mostantól nem nyílik meg.",
    en: "Revoked; the link will no longer open.",
  },
  "valasz.betekinto_nincs_jogviszony": {
    hu: "Ehhez a bérleményhez nem tartozol, ezért nem adhatsz ki róla betekintőt.",
    en: "You are not a tenant of this flat, so you cannot issue a reference about it.",
  },
  "valasz.betekinto_cel_kell": {
    hu: "Írd be, mire kéred; enélkül a másik fél nem tudja, mit néz.",
    en: "Say what it is for; without that the reader does not know what they are looking at.",
  },

  // --- Jogi tájékoztatók
  "jogi.adatkezeles": { hu: "Adatkezelési tájékoztató", en: "Privacy notice" },
  "jogi.feltetelek": { hu: "Felhasználási feltételek", en: "Terms of use" },
  "jogi.lablec": {
    hu: "Az alkalmazás összesítéseket készít, nem ad jogi vagy adótanácsot.",
    en: "This app produces summaries; it does not give legal or tax advice.",
  },
};

/** Szövegező a beépített szótárral. Kliensoldali komponens is ezt hívja. */
export function szovegekNyelvvel(nyelv: Nyelv): Szovegezo {
  return szovegezo(nyelv, SZOTAR);
}
