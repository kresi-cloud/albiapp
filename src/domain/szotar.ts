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
  "nav.adataim": { hu: "Adataim", en: "My details" },
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
  "egyeztetes.vitas_cimke": { hu: "vitás", en: "disputed" },
  "egyeztetes.varakozik_cimke": { hu: "várakozik", en: "waiting" },
  "egyeztetes.ket_oldal_elter": {
    hu: "A két fél mást mond: a bérlő {berlo} forintot, a bérbeadó {berbeado} forintot rögzített.",
    en: "The two sides differ: the tenant recorded HUF {berlo}, the landlord HUF {berbeado}.",
  },
  "egyeztetes.nem_erkezett_meg": {
    hu: "A bérlő szerint elutalta, a bérbeadó szerint nem érkezett meg.",
    en: "The tenant says it was transferred; the landlord says it never arrived.",
  },
  "egyeztetes.nincs_berbeadoi_igazolas": {
    hu: "A bérlő megadta az utalását, a bérbeadó visszaigazolására vár.",
    en: "The tenant recorded the transfer; waiting for the landlord to confirm it.",
  },
  "egyeztetes.nincs_berloi_igazolas": {
    hu: "A bérbeadó rögzítette a beérkezést, a bérlő visszaigazolására vár.",
    en: "The landlord recorded the arrival; waiting for the tenant to confirm it.",
  },
  "egyeztetes.hianyzik": {
    hu: "Az esedékesség letelt, és nem érkezett hozzá befizetés.",
    en: "The due date has passed and no payment has arrived.",
  },
  "egyeztetes.nincs_eloiras": {
    hu: "Beérkezett utalás, amihez nem tartozik előírt tétel.",
    en: "A transfer arrived that does not belong to any scheduled item.",
  },

  // --- Bizonylat (csak vitás befizetéshez)
  "bizonylat.cim": { hu: "Bizonylat ehhez az utaláshoz", en: "Receipt for this transfer" },
  "bizonylat.kuldo": { hu: "Küldő oldali bizonylat", en: "Sending-side receipt" },
  "bizonylat.fogado": { hu: "Fogadó oldali bizonylat", en: "Receiving-side receipt" },
  "bizonylat.feltolt": { hu: "Bizonylat feltöltése", en: "Upload a receipt" },
  "bizonylat.gomb": { hu: "Feltöltöm", en: "Upload" },
  "bizonylat.torles": { hu: "Törlöm", en: "Delete" },
  "bizonylat.letoltes": { hu: "Megnézem", en: "Open" },
  "bizonylat.nincs": { hu: "Még nincs feltöltve.", en: "Not uploaded yet." },
  "bizonylat.varunk_rad": {
    hu: "Ezt tőled várjuk.",
    en: "This one is yours to upload.",
  },
  "bizonylat.sugo": {
    hu:
      "Csak ennek az egy utalásnak a bizonylata kell, PDF-ben vagy képernyőképen, legfeljebb " +
      "{max} MB. Teljes bankszámlakivonatot nem kérünk, és nem is fogadunk el.",
    en:
      "Only the receipt of this one transfer, as a PDF or a screenshot, at most {max} MB. We do " +
      "not ask for, and do not accept, a full bank statement.",
  },
  "bizonylat.kikapcsolva": {
    hu: "A bérbeadó kikapcsolta a bizonylatkérést, ezért újat nem kérünk. Ami már fent van, megmarad.",
    en: "The landlord turned receipt requests off, so we ask for no new ones. What is already uploaded stays.",
  },
  "bizonylat.feltoltve": { hu: "Feltöltve: {nap}", en: "Uploaded: {nap}" },
  "bizonylat.kesz": { hu: "Feltöltöttem a bizonylatot.", en: "The receipt is uploaded." },
  "bizonylat.torolve": { hu: "Töröltem a bizonylatot.", en: "The receipt is deleted." },
  "bizonylat.hiba.ures": { hu: "Válassz ki egy fájlt.", en: "Choose a file." },
  "bizonylat.hiba.nagy": {
    hu: "A fájl túl nagy: legfeljebb {max} MB lehet.",
    en: "The file is too large: at most {max} MB.",
  },
  "bizonylat.hiba.tipus": {
    hu: "PDF-et vagy képet tudok fogadni (JPG, PNG, WEBP).",
    en: "I can accept a PDF or an image (JPG, PNG, WEBP).",
  },
  "bizonylat.hiba.nincs_vita": {
    hu: "Ehhez a tételhez nem kérünk bizonylatot: a két fél adata egyezik.",
    en: "No receipt is needed for this item: the two sides match.",
  },
  "bizonylat.meret.bajt": { hu: "{meret} bájt", en: "{meret} bytes" },
  "bizonylat.meret.kb": { hu: "{meret} kB", en: "{meret} kB" },
  "bizonylat.meret.mb": { hu: "{meret} MB", en: "{meret} MB" },

  // --- Személyes adatok
  // Mindkét fél a sajátját adja meg; a bérlőét eddig a bérbeadó gépelte be.
  "adatok.cim": { hu: "A saját adataim", en: "My details" },
  "adatok.berbeado_cim": { hu: "A bérbeadó adatai", en: "Landlord details" },
  "adatok.berlo_cim": { hu: "A bérlő adatai", en: "Tenant details" },
  "adatok.mezo.nev": { hu: "Teljes név", en: "Full name" },
  "adatok.mezo.szuletesiHely": { hu: "Születési hely", en: "Place of birth" },
  "adatok.mezo.szuletesiIdo": { hu: "Születési idő", en: "Date of birth" },
  "adatok.mezo.anyjaNeve": { hu: "Anyja neve", en: "Mother's name" },
  "adatok.mezo.lakcim": { hu: "Állandó lakcím", en: "Permanent address" },
  "adatok.mezo.igazolvanySzam": {
    hu: "Igazolvány száma",
    en: "ID document number",
  },
  "adatok.mezo.bankszamla": { hu: "Bankszámlaszám", en: "Bank account number" },
  "adatok.mezo.telefon": { hu: "Telefonszám", en: "Phone number" },
  "adatok.gomb": { hu: "Mentem", en: "Save" },
  "adatok.kesz": { hu: "Az adataid mentve.", en: "Your details are saved." },
  "adatok.kesobb": { hu: "Most kihagyom", en: "Skip for now" },

  "adatok.miert": {
    hu:
      "Ezek az adatok kizárólag a szerződéshez, a jegyzőkönyvhöz és az igazolásokhoz kellenek. " +
      "Máshol nem használjuk őket, és naplóba nem kerülnek.",
    en:
      "These details are used only for the contract, the handover record and the certificates. " +
      "They are used nowhere else, and never written to logs.",
  },

  "adatok.sajat_oldal": {
    hu: "A sajátodat te adod meg, a másik fél az övét. Egyik fél sem ír a másik adatába.",
    en: "You enter your own; the other party enters theirs. Neither side writes the other's details.",
  },

  "adatok.hianyzik": {
    hu: "Még {darab} adat hiányzik a szerződéshez.",
    en: "{darab} more details are needed for the contract.",
  },

  "adatok.keszultseg": {
    hu: "{megvan} / {osszesen} adat megvan.",
    en: "{megvan} of {osszesen} details filled in.",
  },

  "adatok.teljes": {
    hu: "Minden adat megvan, ami a szerződéshez kell.",
    en: "Everything needed for the contract is filled in.",
  },

  "adatok.elso_belepes": {
    hu:
      "Mielőtt belevágnál: töltsd ki a saját adataidat. A szerződéshez kellenek, " +
      "és jobb most megadni, mint aláírás előtt kapkodni. Ki is hagyhatod, később is pótolható.",
    en:
      "Before you start: fill in your own details. The contract needs them, and it is easier " +
      "now than in a rush before signing. You can skip this and come back later.",
  },

  "adatok.berlo_sugo": {
    hu:
      "A bérbeadó ezeket látja majd a szerződésen. Amit itt megadsz, az felülírja azt, " +
      "amit ő korábban beírt helyetted.",
    en:
      "Your landlord will see these on the contract. What you enter here replaces anything " +
      "they filled in on your behalf.",
  },

  "adatok.forras.berlo": { hu: "A bérlő adta meg", en: "Entered by the tenant" },
  "adatok.forras.berbeado": { hu: "Te írtad be", en: "You entered this" },
  "adatok.forras.nincs": { hu: "Még senki nem adta meg", en: "Not entered yet" },

  "adatok.hiba.igazolvany": {
    hu: "Ez nem tűnik igazolványszámnak. Nézd meg még egyszer.",
    en: "This does not look like an ID number. Please check it.",
  },
  "adatok.hiba.adoazonosito": {
    hu: "Az adóazonosító jel tíz számjegy.",
    en: "The tax identification number is ten digits.",
  },
  "adatok.hiba.nincs_jogviszony": {
    hu: "Nincs olyan jogviszonyod, amihez ez tartozna.",
    en: "You have no tenancy this would belong to.",
  },

  // --- Személyazonosság a szerződés előtt
  // Az alkalmazás nem igazol személyazonosságot, és ezt ki is mondja.
  "azonossag.cim": { hu: "Szerződés előtt: igazoljátok a személyazonosságot", en: "Before signing: verify identity" },
  "azonossag.szoveg": {
    hu:
      "Az alkalmazás nem ellenőrzi, hogy ki kicsoda: amit a felek megadtak, az a saját állításuk. " +
      "Aláírás előtt nézzétek meg egymás fényképes igazolványát személyesen, és vessétek össze " +
      "a szerződésben álló adatokkal.",
    en:
      "The app does not verify who anyone is: what each party entered is their own claim. " +
      "Before signing, check each other's photo ID in person and compare it with the details " +
      "printed on the contract.",
  },
  "azonossag.hianyos": {
    hu: "A szerződés addig nem véglegesíthető, amíg mindkét fél adatai hiányosak.",
    en: "The contract cannot be finalised while either party's details are incomplete.",
  },
  "azonossag.hianyos_berbeado": {
    hu: "A te adataid hiányosak. Töltsd ki őket a Beállítások lapon.",
    en: "Your own details are incomplete. Fill them in on the Settings page.",
  },
  "azonossag.hianyos_berlo": {
    hu: "{nev} adatai hiányosak. Kérd meg, hogy töltse ki, vagy írd be te a Bérlők lapon.",
    en: "{nev}'s details are incomplete. Ask them to fill them in, or enter them on the Tenants page.",
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
  "teendo.adathiany": {
    hu: "Hiányzó adat a szerződéshez",
    en: "Details missing for the contract",
  },
  "teendo.megnezem": { hu: "Megnézem", en: "Open" },
  "teendo.kesz": { hu: "Kész", en: "Done" },
  "teendo.lezarom": { hu: "Lezárom…", en: "Closing…" },
  "teendo.idoszak_osszeg": {
    hu: "{idoszak} · {osszeg} Ft",
    en: "{idoszak} · HUF {osszeg}",
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
  "teendo.vitas.berbeado": {
    hu: "Vitás befizetés: töltsd fel a fogadó oldali bizonylatot",
    en: "Disputed payment: upload the receiving-side receipt",
  },
  "teendo.vitas.berlo": {
    hu: "Vitás befizetés: töltsd fel az utalás bizonylatát",
    en: "Disputed payment: upload the receipt of your transfer",
  },
  "teendo.vitas.nem_erkezett_meg": {
    hu: "A bérbeadó szerint nem érkezett meg. Teljes bankszámlakivonat nem kell, csak ez az egy utalás.",
    en: "The landlord says it never arrived. No full bank statement is needed, only this one transfer.",
  },
  "teendo.varakozik.berbeado": {
    hu: "Igazold vissza, hogy megérkezett-e",
    en: "Confirm whether it arrived",
  },
  "teendo.varakozik.berlo": {
    hu: "Add meg, mikor és mennyit utaltál",
    en: "Tell us when and how much you transferred",
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
  "berlo.utalas.nyito": { hu: "Elutaltam, rögzítem", en: "I have transferred it" },
  "berlo.utalas.datum": { hu: "Mikor utaltad", en: "When you transferred it" },
  "berlo.utalas.osszeg": { hu: "Mennyit utaltál (Ft)", en: "How much you transferred (HUF)" },
  "berlo.utalas.kozlemeny": { hu: "Közlemény (ha volt)", en: "Reference (if any)" },
  "berlo.utalas.gomb": { hu: "Rögzítem", en: "Record it" },
  "berlo.utalas.sugo": {
    hu:
      "Csak ennyi kell. Bankszámlakivonatot nem kérünk, és nem is fogadunk el. Ha a bérbeadó " +
      "adata mást mond, akkor kérjük be ennek az egy utalásnak a bizonylatát.",
    en:
      "This is all we need. We do not ask for, and do not accept, a bank statement. If the " +
      "landlord's entry says something else, we then ask for the receipt of this one transfer.",
  },
  "berlo.utalas.visszavon": { hu: "Ezt elgépeltem", en: "I mistyped this" },
  "berlo.utalas.sajat": { hu: "Amit te mondtál", en: "What you said" },
  "berlo.utalas.berbeado": { hu: "Amit a bérbeadó mond", en: "What the landlord says" },
  "berlo.utalas.nem_erkezett": { hu: "nem érkezett meg", en: "did not arrive" },
  "berlo.utalas.bizonylat": {
    hu:
      "A két oldal nem egyezik. Ilyenkor van értelme az utalás bizonylatának: tőled a küldő " +
      "oldali. Teljes bankszámlakivonat nem kell.",
    en:
      "The two sides do not match. This is where the receipt of the transfer matters: from you " +
      "the sending side. No full bank statement is needed.",
  },

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
  "valasz.datum_kell": { hu: "Adj meg egy dátumot.", en: "Give a date." },
  "valasz.osszeg_kell": {
    hu: "Adj meg egy összeget egész forintban.",
    en: "Give an amount in whole forints.",
  },
  "valasz.beerkezes_rogzitve": {
    hu: "Rögzítettem a beérkezést. Ha a bérlő adata is ezt mondja, a tétel le van zárva.",
    en: "The arrival is recorded. If the tenant's entry says the same, the item is settled.",
  },
  "valasz.nem_erkezett_rogzitve": {
    hu: "Rögzítettem, hogy nem érkezett meg.",
    en: "Recorded: it has not arrived.",
  },
  "valasz.utalas_rogzitve": {
    hu: "Rögzítettem az utalásodat. Ha a bérbeadó adata is ezt mondja, a tétel le van zárva.",
    en: "Your transfer is recorded. If the landlord's entry says the same, the item is settled.",
  },
  "valasz.visszavonva": { hu: "Visszavontam.", en: "Withdrawn." },
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

  // --- Bérlemény és jogviszony felvitele
  "berlemeny.hiba.megnevezes": {
    hu: "Adj nevet a bérleménynek, hogy a listában felismerd.",
    en: "Give the property a name so you can recognise it in the list.",
  },
  "berlemeny.hiba.cim": {
    hu: "A cím kell: ez kerül a szerződésbe.",
    en: "The address is required: it goes into the contract.",
  },
  "berlemeny.hiba.alapterulet": {
    hu: "Az alapterület csak pozitív szám lehet.",
    en: "The floor area must be a positive number.",
  },
  "berlemeny.hiba.negativ": {
    hu: "Ez az összeg nem lehet negatív.",
    en: "This amount cannot be negative.",
  },
  "berlemeny.figyelem.cim_alak": {
    hu: "A cím nem a szokásos „1111 Budapest, Minta tér 2.\u201d alakban van. Elmentjük, de a bérlő megosztható betekintőjén így nem fog látszani, melyik településen van a bérlemény.",
    en: "The address is not in the usual \u201c1111 Budapest, Minta tér 2.\u201d form. We will save it, but the town will not show on the tenant\u2019s shareable view.",
  },
  "berlemeny.figyelem.helyrajzi": {
    hu: "Helyrajzi szám nélkül is mehet, de a bérleti szerződés a tulajdoni lap szerinti azonosítóval pontos. Később pótolható.",
    en: "You can go on without the land registry number, but the contract is precise with it. You can add it later.",
  },
  "berlemeny.figyelem.energetikai": {
    hu: "Az energetikai tanúsítvány azonosítója nélkül is mehet, de jogszabály szerint a bérbeadónak át kell adnia a tanúsítványt, és a szerződés erre hivatkozik.",
    en: "You can go on without the energy certificate identifier, but the law requires the landlord to hand the certificate over, and the contract refers to it.",
  },
  "berlemeny.figyelem.beszerzes": {
    hu: "Beszerzési ár és dátum nélkül a tételes adóelszámolásban nem tudunk értékcsökkenést számolni. Enélkül is működik minden más.",
    en: "Without the purchase price and date we cannot calculate depreciation in the itemised tax method. Everything else works without it.",
  },
  "berlemeny.mentve": { hu: "A bérlemény elmentve.", en: "The property has been saved." },
  "berlemeny.cim": { hu: "Bérlemények", en: "Properties" },
  "berlemeny.ures": {
    hu: "Még nincs felvett bérlemény. Kezdd ezzel: minden más ebből indul ki.",
    en: "No property yet. Start here: everything else follows from it.",
  },
  "berlemeny.uj": { hu: "Új bérlemény", en: "New property" },
  "berlemeny.mezo.megnevezes": { hu: "Név", en: "Name" },
  "berlemeny.mezo.megnevezes_sugo": {
    hu: "Neked szól, a listában ezt látod: „Ferencvárosi garzon\u201d.",
    en: "For you: this is what you see in the list, e.g. \u201cStudio in the 9th\u201d.",
  },
  "berlemeny.mezo.cim": { hu: "Cím", en: "Address" },
  "berlemeny.mezo.cim_sugo": {
    hu: "A szerződésbe ez kerül. Írd a szokásos alakban: 1094 Budapest, Minta utca 3. 2/4",
    en: "This goes into the contract. Use the usual form: 1094 Budapest, Minta utca 3. 2/4",
  },
  "berlemeny.mezo.alapterulet": { hu: "Alapterület (m²)", en: "Floor area (m²)" },
  "berlemeny.mezo.helyrajzi": { hu: "Helyrajzi szám", en: "Land registry number" },
  "berlemeny.mezo.energetikai": {
    hu: "Energetikai tanúsítvány azonosítója",
    en: "Energy certificate identifier",
  },
  "berlemeny.mezo.kozos_koltseg": { hu: "Közös költség (Ft / hó)", en: "Common charges (HUF / month)" },
  "berlemeny.mezo.beszerzesi_ar": { hu: "Beszerzési ár (Ft)", en: "Purchase price (HUF)" },
  "berlemeny.mezo.beszerzes_datuma": { hu: "Beszerzés dátuma", en: "Purchase date" },
  "berlemeny.mezo.adozas_sugo": {
    hu: "Csak az adóösszesítőhöz kell, az értékcsökkenéshez. Üresen is mehet.",
    en: "Only needed for the tax summary, for depreciation. You can leave it empty.",
  },
  "berlemeny.gomb": { hu: "Bérlemény felvétele", en: "Add property" },
  "jogviszony.uj": { hu: "Új jogviszony", en: "New tenancy" },
  "jogviszony.uj_sugo": {
    hu: "Ettől kezdve a bérleti díj, a közös költség és a rezsiátalány minden hónapra magától előírás lesz. Kézzel nem kell rögzítened.",
    en: "From here the rent, common charges and utility flat rate become scheduled items every month, on their own. You do not record them by hand.",
  },
  "jogviszony.mezo.ingatlan": { hu: "Melyik bérleményre?", en: "Which property?" },
  "jogviszony.mezo.kezdete": { hu: "A bérlet kezdete", en: "Tenancy starts" },
  "jogviszony.mezo.dij": { hu: "Bérleti díj (Ft / hó)", en: "Rent (HUF / month)" },
  "jogviszony.mezo.kozos_koltseg": {
    hu: "Közös költség, amit a bérlő fizet (Ft / hó)",
    en: "Common charges paid by the tenant (HUF / month)",
  },
  "jogviszony.mezo.kaucio": { hu: "Óvadék (Ft)", en: "Deposit (HUF)" },
  "jogviszony.mezo.fizetesi_nap": {
    hu: "A hónap hányadikára esedékes",
    en: "Due on which day of the month",
  },
  "jogviszony.mezo.rezsi": { hu: "Hogyan megy a rezsi?", en: "How are utilities settled?" },
  "jogviszony.rezsi.almero": {
    hu: "Mérőóra szerint, elszámolással",
    en: "By meter, with a settlement",
  },
  "jogviszony.rezsi.atalany": { hu: "Havi átalány", en: "Monthly flat rate" },
  "jogviszony.rezsi.kozos_koltsegben": {
    hu: "A közös költség tartalmazza",
    en: "Included in the common charges",
  },
  "jogviszony.mezo.atalany": { hu: "Rezsiátalány (Ft / hó)", en: "Utility flat rate (HUF / month)" },
  "jogviszony.mezo.berlo": { hu: "Az első bérlő neve", en: "First tenant\u2019s name" },
  "jogviszony.mezo.berlo_email": {
    hu: "A bérlő e-mail-címe (a meghívóhoz)",
    en: "Tenant\u2019s email (for the invitation)",
  },
  "jogviszony.mezo.berlo_sugo": {
    hu: "Lakótársat később a Bérlők lapon adhatsz hozzá. Egy jogviszonyban több bérlő is lehet, a bérleti díj attól még egy tétel marad.",
    en: "You can add flatmates later on the Tenants page. A tenancy can have several tenants; the rent stays one item.",
  },
  "jogviszony.gomb": { hu: "Jogviszony indítása", en: "Start tenancy" },
  "urlap.figyelem": { hu: "Amit érdemes tudni:", en: "Worth knowing:" },
  "jogviszony.hiba.kezdete": {
    hu: "Add meg, mikor kezdődik a bérlet.",
    en: "Give the date the tenancy starts.",
  },
  "jogviszony.hiba.dij": {
    hu: "A bérleti díj csak pozitív összeg lehet.",
    en: "The rent must be a positive amount.",
  },
  "jogviszony.hiba.fizetesi_nap": {
    hu: "A fizetési határidő a hónap 1. és {max}. napja közé essen: a hónap végi napok februárban elcsúsznának.",
    en: "The payment due day must fall between the 1st and the {max}th: days at the end of the month would slip in February.",
  },
  "jogviszony.hiba.rezsi_mod": {
    hu: "Válaszd ki, hogyan megy a rezsi.",
    en: "Choose how utilities are settled.",
  },
  "jogviszony.hiba.atalany": {
    hu: "Átalánynál add meg a havi összeget is, különben minden hónapra nulla forintot írnánk elő.",
    en: "With a flat rate, give the monthly amount too, otherwise we would schedule zero every month.",
  },
  "jogviszony.hiba.berlo": {
    hu: "Add meg legalább az első bérlő nevét.",
    en: "Give at least the first tenant\u2019s name.",
  },
  "jogviszony.figyelem.jovobeli": {
    hu: "A bérlet a jövőben kezdődik, ezért egyelőre egyetlen fizetnivaló sem lesz. Az első az első hónap esedékességekor jelenik meg.",
    en: "The tenancy starts in the future, so there is nothing to pay yet. The first item appears when the first month falls due.",
  },
  "jogviszony.figyelem.visszamenoleg": {
    hu: "A kezdettől a mai hónapig {honapok} hónapra rögtön előírás születik. Ez nem hiba: a korábbi hónapokat is egyeztetni kell.",
    en: "Items will be created at once for {honapok} months, from the start date to this month. This is not an error: earlier months need reconciling too.",
  },
  "jogviszony.mentve": {
    hu: "A jogviszony elindult. A bérlőt a Bérlők lapon hívhatod meg.",
    en: "The tenancy has started. You can invite the tenant from the Tenants page.",
  },

  // --- Hosszú listák összecsukása
  //
  // Egy-két év alatt száz fölötti tétel gyűlik össze. Amivel már nincs dolga
  // egyik félnek sem, az nem tűnik el, csak összecsukva áll, darabszámmal.
  "lista.rendezett": { hu: "Rendezett tételek ({darab})", en: "Settled items ({darab})" },
  "lista.rendezett_bizonylattal": {
    hu: "Rendezett, de van hozzá feltöltött bizonylat ({darab})",
    en: "Settled, but a receipt was uploaded ({darab})",
  },
  "lista.nincs_teendo": {
    hu: "Ezzel a bérleménnyel most nincs dolgod.",
    en: "Nothing needs you on this tenancy right now.",
  },
  "lista.korabbiak": { hu: "Korábbi hónapok ({darab})", en: "Earlier months ({darab})" },

  // --- Betekintő nézet
  "nav.betekinto": { hu: "Betekintő", en: "Shared view" },
  "betekinto.oldal.cim": { hu: "Betekintő a bérleményembe", en: "A window into my tenancy" },
  "betekinto.oldal.bevezeto": {
    hu: "Ha más fizeti vagy segíti a lakhatásodat — jellemzően a szüleid —, ezzel a linkkel megmutathatod nekik, hogy áll a bérlemény: mi volt esedékes, mi érkezett meg, és mi van még nyitva. Nem kell belépniük, és nem a te bemondásod: az adat abból jön, amit a bérbeadó maga rögzített a beérkezésekről.",
    en: "If someone else pays for or helps with your housing — usually your parents — this link shows them where the tenancy stands: what fell due, what arrived, and what is still open. They do not need to sign in, and it is not your own word: the data comes from what the landlord recorded as received.",
  },
  "betekinto.oldal.mit_nem": {
    hu: "A link nem árulja el a bérbeadód nevét, a pontos címet, a lakótársaid nevét és semmilyen személyes adatot. Aki megkapja, annak a pontos cím úgyis megvan; a linkhez viszont bárki hozzáfér, akihez eljut, ezért nem tesszük bele. Bármikor visszavonhatod, és az azonnal hat.",
    en: "The link does not reveal your landlord's name, the exact address, your flatmates' names or any personal data. Whoever you send it to already knows the address; anyone the link reaches can open it, so we leave it out. You can revoke it at any time, and that takes effect immediately.",
  },
  "betekinto.urlap.cim": { hu: "Új betekintő", en: "New reference" },
  "betekinto.urlap.jogviszony": { hu: "Melyik bérleményről?", en: "Which tenancy?" },
  "betekinto.urlap.cel": { hu: "Kinek készül?", en: "Who is it for?" },
  "betekinto.urlap.cel_sugo": {
    hu: "Ez a mondat a megnyitott oldal tetején lesz, hogy aki megkapja, lássa, neki szól. Magadnak is jelölés: a kiadott linkjeidet erről ismered fel.",
    en: "This sentence appears at the top of the page so the reader can see it was meant for them. It is also how you tell your issued links apart.",
  },
  "betekinto.urlap.cel_pelda": { hu: "például: anyáéknak", en: "for example: for my parents" },
  "betekinto.urlap.elettartam": { hu: "Meddig éljen a link?", en: "How long should the link live?" },
  "betekinto.urlap.nap": { hu: "{napok} nap", en: "{napok} days" },
  "betekinto.urlap.osszeg": { hu: "Az összegek is látszódjanak", en: "Show the amounts too" },
  "betekinto.urlap.osszeg_sugo": {
    hu: "Alapból látszik: aki fizeti, annak összeg nélkül semmit nem ér. Kapcsold ki, ha valakinek elég annyi, hogy rendben van-e.",
    en: "On by default: without the amounts it is of no use to whoever pays. Turn it off if the reader only needs to know whether things are in order.",
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
  "betekinto.nyilvanos.cim": { hu: "Eddig így alakult", en: "How it has gone so far" },
  "betekinto.nyilvanos.berlo": { hu: "{nev} bérleménye", en: "{nev}'s tenancy" },
  "betekinto.nyilvanos.telepules": { hu: "A bérlemény települése: {telepules}", en: "The flat is in {telepules}" },
  "betekinto.nyilvanos.kezdete": { hu: "A jogviszony kezdete: {nap}", en: "Tenancy started: {nap}" },
  "betekinto.nyilvanos.el": { hu: "A jogviszony jelenleg is él.", en: "The tenancy is still running." },
  "betekinto.nyilvanos.lezart": { hu: "A jogviszony már lezárult.", en: "The tenancy has ended." },
  "betekinto.nyilvanos.dij": { hu: "Havi bérleti díj: {dij}", en: "Monthly rent: {dij}" },
  "betekinto.nyilvanos.most": { hu: "Hol tart most", en: "Where it stands now" },
  "betekinto.nyilvanos.nyitott": {
    hu: "Amire a bérbeadó még nem igazolt beérkezést: {osszeg}",
    en: "Not yet confirmed as received by the landlord: {osszeg}",
  },
  "betekinto.nyilvanos.nyitott_nincs": {
    hu: "Minden eddig esedékes összeg beérkezését igazolta a bérbeadó.",
    en: "The landlord has confirmed every amount due so far as received.",
  },
  "betekinto.nyilvanos.nyitott_sugo": {
    hu: "A friss hónap is idetartozik, amíg a bérbeadó rá nem nézett a számlájára; ez tehát nem feltétlenül tartozás.",
    en: "The current month sits here too until the landlord has checked their account, so this is not necessarily a debt.",
  },
  "betekinto.nyilvanos.havi_cim": { hu: "Hónapról hónapra", en: "Month by month" },
  "betekinto.nyilvanos.havi_sugo": {
    hu: "Az utolsó egy év. Egy hónap összege minden, ami arra a hónapra elő volt írva: a bérleti díj, a közös költség, a rezsiátalány, és ha volt, a rezsielszámolás is.",
    en: "The last twelve months. A month's amount is everything scheduled for that month: the rent, the common charges, the utility flat rate, and a utility settlement if there was one.",
  },
  "betekinto.nyilvanos.eloirt": { hu: "Előírva", en: "Scheduled" },
  "betekinto.nyilvanos.erkezett": { hu: "Beérkezett", en: "Received" },
  "betekinto.havi.rendben": { hu: "Határidőre megérkezett", en: "Arrived on time" },
  "betekinto.havi.kesve": { hu: "{napok} nap késéssel érkezett", en: "Arrived {napok} days late" },
  "betekinto.havi.elter": {
    hu: "Megérkezett, de az összeg eltért",
    en: "Arrived, but the amount differed",
  },
  "betekinto.havi.hianyzik": {
    hu: "A bérbeadó még nem igazolt beérkezést",
    en: "The landlord has not confirmed receipt yet",
  },
  "betekinto.nyilvanos.honnan": {
    hu: "Ezek a számok abból származnak, amit a bérbeadó maga rögzített a beérkezett befizetésekről, és az alkalmazás párosította az előírt tételekkel. Nem a bérlő bejelentése — ezért mutat többet, mint ha megkérdeznéd.",
    en: "These numbers come from what the landlord recorded as received, matched against the scheduled items by the app. They are not self-reported by the tenant — which is why this shows more than simply asking would.",
  },
  "betekinto.nyilvanos.nincs_pontszam": {
    hu: "Pontszámot szándékosan nem adunk. A súlyozás, amit mi találnánk ki, mérésnek látszana; ítélni az olvasó dolga.",
    en: "We deliberately give no score. A weighting we invented would look like a measurement; judging is the reader's job.",
  },
  "betekinto.nyilvanos.kiadva": { hu: "A bérlő adta ki {nap} napján, lejár {lejar} napján.", en: "Issued by the tenant on {nap}, expires on {lejar}." },
  "betekinto.nyilvanos.nincs": { hu: "Ez a link lejárt vagy visszavonták.", en: "This link has expired or was revoked." },
  "betekinto.nyilvanos.nincs_bevezeto": {
    hu: "A linket vagy visszavonták, vagy lejárt. Aki kiadta, bármikor tud újat adni.",
    en: "The link was either revoked or has expired. Whoever issued it can issue a new one at any time.",
  },
  "betekinto.mondat.nincs_adat": {
    hu: "Erre a bérleményre még nem járt le egyetlen fizetési határidő sem, tehát nincs mit mutatni.",
    en: "No payment has fallen due for this tenancy yet, so there is nothing to show.",
  },
  "betekinto.mondat.honapok": {
    hu: "Eddig {honapok} hónapra volt esedékes fizetnivaló.",
    en: "There has been something to pay for {honapok} months so far.",
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
    hu: "{hianyzo} hónapra a bérbeadó még nem igazolt beérkezést.",
    en: "For {hianyzo} months the landlord has not confirmed receipt yet.",
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

  // --- Alsó fülsáv és a „Több” lapja
  //
  // A fülcímkék szándékosan rövidebbek a lapok címénél: az alsó sávban egy
  // fülre 360 képponton nagyjából 70 képpont jut, és ami nem fér ki, azt a
  // böngésző levágja. A „Dokumentumok” így „Iratok”, a „Hibabejelentés” pedig
  // „Hibák” — a lap címe mindkettőnél a hosszú alak marad.
  "nav.tobb": { hu: "Több", en: "More" },
  "nav.bezaras": { hu: "Bezárás", en: "Close" },
  "ful.attekinto": { hu: "Áttekintő", en: "Overview" },
  "ful.befizetesek": { hu: "Befizetés", en: "Payments" },
  "ful.rezsi": { hu: "Rezsi", en: "Utilities" },
  "ful.dokumentumok": { hu: "Iratok", en: "Documents" },
  "ful.berlemenyem": { hu: "Bérlemény", en: "My home" },
  "ful.hibabejelentes": { hu: "Hibák", en: "Faults" },
  "ful.dokumentumaim": { hu: "Irataim", en: "Documents" },
  "ful.betekinto": { hu: "Betekintő", en: "Sharing" },

  // --- Áttekintő
  "attekinto.koszones": { hu: "Szia, {nev}", en: "Hi, {nev}" },
  "attekinto.alcim": {
    hu: "A következő hét nap teendői elöl.",
    en: "What the next seven days need from you, first.",
  },
  "attekinto.jogviszony": { hu: "Jogviszony", en: "Tenancies" },
  "attekinto.rendezetlen": { hu: "Rendezetlen", en: "Unsettled" },
  "attekinto.elmaradas": { hu: "Elmaradás", en: "Outstanding" },
  "attekinto.most": { hu: "A következő napokban", en: "In the coming days" },
  "attekinto.kesobb": { hu: "Később", en: "Later" },

  // --- Befizetések lapja
  "befizetesek.cim": { hu: "Befizetések", en: "Payments" },
  "befizetesek.alcim": {
    hu: "Mit kellett fizetni, mit mond a bérlő, és mit mondasz te.",
    en: "What was due, what the tenant says, and what you say.",
  },
  "befizetesek.sugo_cim": {
    hu: "Hogyan működik az egyeztetés?",
    en: "How does reconciliation work?",
  },
  "befizetesek.sugo_harom": {
    hu:
      "Három adat találkozik: mit kellett volna fizetni, mit mond a bérlő, és mit mondasz te. A " +
      "két fél a saját oldalát adja meg, és ha a kettő egyezik, a tétel le van zárva.",
    en:
      "Three pieces of data meet here: what was due, what the tenant says, and what you say. " +
      "Each side enters their own, and when the two agree the item is settled.",
  },
  "befizetesek.sugo_bizonylat": {
    hu:
      "Bizonylatot csak akkor kérünk, ha a két oldal nem egyezik, és akkor is csak arról az egy " +
      "utalásról: tőled a fogadó oldalit, a bérlőtől a küldő oldalit. Teljes bankszámlakivonatot " +
      "nem kérünk, és nem is fogadunk el.",
    en:
      "We ask for a receipt only when the two sides disagree, and then only for that one " +
      "transfer: the receiving side from you, the sending side from the tenant. We never ask " +
      "for a full bank statement, and we do not accept one.",
  },
  "befizetesek.ablak": {
    hu: "Párosítási ablak: az esedékesség előtt {elotte}, utána {utana} nap.",
    en: "Matching window: {elotte} days before the due date, {utana} days after.",
  },
  "befizetesek.ablak_allit": { hu: "Átállítom", en: "Change" },
  "befizetesek.havi_dij": { hu: "{osszeg} / hó", en: "{osszeg} / month" },
  "befizetesek.nincs_tetel": {
    hu: "Ehhez a jogviszonyhoz még nincs egyeztetendő tétel.",
    en: "This tenancy has nothing to reconcile yet.",
  },
  "befizetesek.nincs_eloiras": { hu: "Nincs előírás", en: "No charge" },
  "befizetesek.eloiras": { hu: "Előírás", en: "Charged" },
  "befizetesek.berlo_szerint": { hu: "A bérlő szerint", en: "The tenant says" },
  "befizetesek.nalad": { hu: "Nálad", en: "You say" },
  "befizetesek.nem_erkezett": { hu: "nem érkezett meg", en: "did not arrive" },
  "befizetesek.nincs_adat": { hu: "még nem mondta meg", en: "not stated yet" },
  "befizetesek.vita_bizonylat": {
    hu:
      "A két oldal nem egyezik. Ilyenkor van értelme az utalás bizonylatának: tőled a fogadó " +
      "oldali, a bérlőtől a küldő oldali. Teljes bankszámlakivonat nem kell.",
    en:
      "The two sides do not match. This is where the receipt of the transfer matters: the " +
      "receiving side from you, the sending side from the tenant. No full bank statement is needed.",
  },
  "betekinto.nyilvanos.nyitott_cimke": {
    hu: "Amire a bérbeadó még nem igazolt beérkezést",
    en: "Not yet confirmed as received by the landlord",
  },
  "befizetesek.varr_rad": { hu: "Rád vár", en: "Waiting on you" },
  "befizetesek.beerkezes_nyito": { hu: "Megérkezett? Rögzítem", en: "Arrived? Record it" },
  "befizetesek.beerkezes_datum": { hu: "Mikor érkezett", en: "When it arrived" },
  "befizetesek.beerkezes_osszeg": { hu: "Mennyi érkezett (Ft)", en: "How much arrived (HUF)" },
  "befizetesek.beerkezes_kozlemeny": { hu: "Közlemény (ha van)", en: "Reference (if any)" },
  "befizetesek.beerkezes_gomb": { hu: "Rögzítem", en: "Record it" },
  "befizetesek.nem_erkezett_gomb": {
    hu: "Megnéztem: nem érkezett meg",
    en: "I checked: it did not arrive",
  },
  "befizetesek.visszavon": {
    hu: "Ezt tévedésből rögzítettem",
    en: "I recorded this by mistake",
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
