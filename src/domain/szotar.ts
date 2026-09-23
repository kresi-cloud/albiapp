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
  "nav.jegyzokonyveim": { hu: "Átadás-átvétel", en: "Handover" },
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
  "meghivo.nem_el": {
    hu: "A meghívó nem él",
    en: "This invitation is not valid",
  },
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
  "bizonylat.cim": {
    hu: "Bizonylat ehhez az utaláshoz",
    en: "Receipt for this transfer",
  },
  "bizonylat.kuldo": {
    hu: "Küldő oldali bizonylat",
    en: "Sending-side receipt",
  },
  "bizonylat.fogado": {
    hu: "Fogadó oldali bizonylat",
    en: "Receiving-side receipt",
  },
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
  "bizonylat.kesz": {
    hu: "Feltöltöttem a bizonylatot.",
    en: "The receipt is uploaded.",
  },
  "bizonylat.torolve": {
    hu: "Töröltem a bizonylatot.",
    en: "The receipt is deleted.",
  },
  "bizonylat.hiba.ures": { hu: "Válassz ki egy fájlt.", en: "Choose a file." },
  "bizonylat.hiba.nagy": {
    hu: "A fájl túl nagy: legfeljebb {max} MB lehet.",
    en: "The file is too large: at most {max} MB.",
  },
  "bizonylat.hiba.tipus": {
    hu: "PDF-et vagy képet tudok fogadni (JPG, PNG, WEBP).",
    en: "I can accept a PDF or an image (JPG, PNG, WEBP).",
  },
  "bizonylat.hiba.lakotarse": {
    hu:
      "Ehhez a tételhez a lakótársad töltött fel bizonylatot. Oldalanként egy " +
      "bizonylat van, és a másét nem írjuk felül — kérd meg, hogy ő cserélje ki.",
    en:
      "Your flatmate uploaded the receipt for this item. There is one receipt per side, and we " +
      "never overwrite someone else's — ask them to replace it.",
  },
  "bizonylat.hiba.nincs_vita": {
    hu: "Ehhez a tételhez nem kérünk bizonylatot: a két fél adata egyezik.",
    en: "No receipt is needed for this item: the two sides match.",
  },
  "bizonylat.meret.bajt": { hu: "{meret} bájt", en: "{meret} bytes" },
  "bizonylat.meret.kb": { hu: "{meret} kB", en: "{meret} kB" },
  "bizonylat.meret.mb": { hu: "{meret} MB", en: "{meret} MB" },

  // --- Fényképek az átadás-átvételi állapotról
  // A megerősítés a másik fél külön adata; a kifogás nem törli a képet.
  "kep.cim": { hu: "Fényképek az állapotról", en: "Photos of the condition" },
  "kep.sugo": {
    hu: "A képet az tölti fel, aki készítette, a másik fél pedig megerősíti, hogy ezt látta. Amíg nincs megerősítés, a kép egy fél állítása marad.",
    en: "Whoever took the photo uploads it, and the other party confirms that this is what they saw. Until then it stays one side's claim.",
  },
  "kep.sugo.zaro": {
    hu: "Kiköltözéskor a birtokbaadáskori képek mellé kerül a mostani állapot. A kaució körüli vita rendszerint épp az, hogy egy folt eddig is ott volt-e.",
    en: "At move-out the current condition sits next to the move-in photos. The deposit dispute is usually about whether a mark was already there.",
  },
  "kep.megnevezes": { hu: "Mit mutat a kép?", en: "What does the photo show?" },
  "kep.megnevezes_pelda": {
    hu: "nappali, a kanapé mögötti fal",
    en: "living room, the wall behind the sofa",
  },
  "kep.tetel": {
    hu: "Melyik tételhez tartozik?",
    en: "Which item is it about?",
  },
  "kep.tetel_nelkul": {
    hu: "általános kép a lakásról",
    en: "general photo of the flat",
  },
  "kep.fajl": { hu: "Fénykép", en: "Photo" },
  "kep.feltoltes": { hu: "Kép hozzáadása", en: "Add photo" },
  "kep.feltoltom": { hu: "Feltöltöm…", en: "Uploading…" },
  "kep.kesz": {
    hu: "A kép bekerült az albumba.",
    en: "The photo is in the album.",
  },
  "kep.torolve": { hu: "Töröltem a képet.", en: "The photo is deleted." },
  "kep.torles": { hu: "Kép törlése", en: "Delete photo" },
  "kep.nincs": {
    hu: "Még nincs kép. Az állapotot szavakkal nehéz rögzíteni, képpel nem.",
    en: "No photos yet. Condition is hard to record in words, easy in pictures.",
  },
  "kep.keszitette.berbeado": {
    hu: "A bérbeadó töltötte fel.",
    en: "Uploaded by the landlord.",
  },
  "kep.keszitette.berlo": {
    hu: "A bérlő töltötte fel.",
    en: "Uploaded by the tenant.",
  },
  "kep.allapot.egyoldalu": {
    hu: "a másik fél megerősítésére vár",
    en: "waiting for the other party to confirm",
  },
  "kep.allapot.megerositve": {
    hu: "mindkét fél elismerte",
    en: "both parties acknowledged",
  },
  "kep.allapot.vitatott": {
    hu: "a másik fél kifogást emelt",
    en: "the other party objected",
  },
  "kep.megerosit": {
    hu: "Ezt láttam, megerősítem",
    en: "This is what I saw, I confirm",
  },
  "kep.kifogasol": {
    hu: "Kifogásom van ezzel a képpel",
    en: "I have an objection to this photo",
  },
  "kep.kifogas_szovege": {
    hu: "Mi a kifogásod?",
    en: "What is your objection?",
  },
  "kep.kifogas_pelda": {
    hu: "Ez a kép nem a mi lakásunkról készült.",
    en: "This photo is not of our flat.",
  },
  "kep.kifogas_kell": {
    hu: "Írd le, mi a kifogásod: enélkül a másik fél nem tud mit kezdeni vele.",
    en: "Describe your objection: without it the other party cannot act on it.",
  },
  "kep.megerositve_kesz": {
    hu: "Megerősítetted a képet.",
    en: "You confirmed the photo.",
  },
  "kep.kifogas_kesz": {
    hu: "Rögzítettem a kifogásodat.",
    en: "Your objection is recorded.",
  },
  "kep.par_cim": {
    hu: "Birtokbaadáskor így nézett ki",
    en: "How it looked at move-in",
  },
  "kep.par_hianyzik": {
    hu: "Ezekről készült kép a birtokbaadáskor, most viszont még nem: {darab} darab.",
    en: "These were photographed at move-in but not yet now: {darab}.",
  },
  "kep.par_keszit": { hu: "Kép erről most", en: "Photo of this now" },
  "kep.osszesites": {
    hu: "{osszes} kép, ebből {megerositve} megerősítve, {varakozik} megerősítésre vár, {vitatott} vitatott.",
    en: "{osszes} photos: {megerositve} confirmed, {varakozik} awaiting confirmation, {vitatott} disputed.",
  },
  "kep.lezart": {
    hu: "A jegyzőkönyv véglegesítve van, ezért az album lezárult: kép nem kerülhet bele és nem tűnhet el belőle. Megerősíteni viszont lehet, mert az a saját nyilatkozatod.",
    en: "The handover record is final, so the album is closed: no photo can be added or removed. Confirming is still possible, because that is your own statement.",
  },
  "kep.hiba.ures": { hu: "Válassz ki egy fényképet.", en: "Choose a photo." },
  "kep.hiba.nagy": {
    hu: "A kép túl nagy: legfeljebb {max} MB lehet.",
    en: "The photo is too large: at most {max} MB.",
  },
  "kep.hiba.tipus": {
    hu: "JPG, PNG vagy WEBP képet tudok fogadni. Az iPhone HEIC formátumát nem: azt a böngészők nagy része nem rajzolja ki, és épp az nem látná, akinek mutatod. A telefon beállításaiban átállítható „legkompatibilisebb” formátumra.",
    en: "I can accept JPG, PNG or WEBP. Not the iPhone HEIC format: most browsers cannot display it, so the very person you are showing it to would not see it. Your phone settings can switch to the “most compatible” format.",
  },
  "kep.hiba.tartalom": {
    hu: "Ez a fájl nem az, aminek mondja magát: a tartalma nem kép.",
    en: "This file is not what it claims to be: its content is not an image.",
  },
  "kep.hiba.sok": {
    hu: "Egy jegyzőkönyvhöz legfeljebb {max} kép tartozhat. Ennél többet telefonon úgysem néz végig senki.",
    en: "A handover record can hold at most {max} photos. Nobody scrolls through more than that on a phone.",
  },
  "kep.hiba.lezart": {
    hu: "A véglegesített jegyzőkönyv albuma lezárult.",
    en: "The album of a finalised handover record is closed.",
  },
  "kep.hiba.nem_tied": {
    hu: "Ehhez a képhez nincs jogosultságod.",
    en: "You have no access to this photo.",
  },
  "kep.oldal.cim": { hu: "Az átadás-átvétel képei", en: "Handover photos" },
  "kep.oldal.bevezeto": {
    hu: "Itt erősítheted meg, hogy a képeken az van, amit te is láttál. Amíg nem nyilatkozol, a kép a bérbeadó állítása marad.",
    en: "Here you can confirm that the photos show what you saw too. Until you say so, a photo stays the landlord's claim.",
  },
  "kep.oldal.ures": {
    hu: "Még nincs jegyzőkönyv a bérleményedhez. Amint a bérbeadó felvesz egyet, itt látod a képeit.",
    en: "There is no handover record for your rental yet. As soon as your landlord creates one, its photos appear here.",
  },
  "kep.oldal.tervezet": {
    hu: "A jegyzőkönyv még tervezet. A képeket szándékosan már most látod: a megerősítés akkor ér valamit, ha a véglegesítés előtt történik.",
    en: "The handover record is still a draft. You can see the photos already on purpose: confirming matters most before it is finalised.",
  },
  "kep.hiba.sajat": {
    hu: "A saját képedet nem te erősíted meg: attól nem lesz kétoldali.",
    en: "You do not confirm your own photo: that would not make it two-sided.",
  },

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

  "adatok.berlo_sugo_cim": {
    hu: "Ki látja, amit itt megadok?",
    en: "Who sees what I enter here?",
  },
  "adatok.berlo_sugo": {
    hu:
      "A bérbeadó ezeket látja majd a szerződésen. Amit itt megadsz, az felülírja azt, " +
      "amit ő korábban beírt helyetted.",
    en:
      "Your landlord will see these on the contract. What you enter here replaces anything " +
      "they filled in on your behalf.",
  },

  "adatok.forras.berlo": {
    hu: "A bérlő adta meg",
    en: "Entered by the tenant",
  },
  "adatok.forras.berbeado": { hu: "Te írtad be", en: "You entered this" },
  "adatok.forras.nincs": {
    hu: "Még senki nem adta meg",
    en: "Not entered yet",
  },

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
  "azonossag.cim": {
    hu: "Szerződés előtt: igazoljátok a személyazonosságot",
    en: "Before signing: verify identity",
  },
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
  "teendo.elteres": {
    hu: "Eltérés: {osszeg} Ft.",
    en: "Difference: HUF {osszeg}.",
  },
  "teendo.hianyzik.berlo": {
    hu: "Esedékes befizetés nem érkezett meg",
    en: "A payment that was due has not arrived",
  },
  "teendo.hianyzik.berbeado": {
    hu: "Elmaradt befizetés, emlékeztető küldhető",
    en: "Missed payment, you can send a reminder",
  },
  "teendo.elter.berbeado": {
    hu: "Eltérés a befizetésben",
    en: "Payment mismatch",
  },
  "teendo.elter.berlo": {
    hu: "Eltérés a befizetésedben",
    en: "Mismatch in your payment",
  },
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
  "teendo.kozelgo": {
    hu: "Közeleg a fizetési határidő",
    en: "Payment deadline approaching",
  },
  "teendo.hiba.megerosites": {
    hu: "Erősítsd meg, hogy a hiba rendben van",
    en: "Confirm that the fault has been fixed",
  },
  "teendo.hiba.elharitva": {
    hu: "{targy}. A bérbeadó elhárítottnak jelölte.",
    en: "{targy}. The landlord marked it as fixed.",
  },
  "teendo.hiba.uj": {
    hu: "Új hibabejelentés: {targy}",
    en: "New fault report: {targy}",
  },
  "teendo.hiba.nyitott": {
    hu: "Nyitott hiba: {targy}",
    en: "Open fault: {targy}",
  },
  "teendo.hiba.allapotsor": {
    hu: "{surgosseg} · {allapot}",
    en: "{surgosseg} · {allapot}",
  },
  "teendo.ujranyitas": { hu: "Mégis nyitott", en: "Reopen" },
  "teendo.ujranyitom": { hu: "Nyitom…", en: "Reopening…" },

  // --- Teendők lapja és naptár
  "nav.teendok": { hu: "Teendők", en: "Tasks" },
  "teendok.cim": { hu: "Teendők", en: "Tasks" },
  "teendok.alcim": {
    hu: "Ami hátravan, és hogy mikorra.",
    en: "What is outstanding, and when it is due.",
  },
  "teendok.sugo.cim": {
    hu: "Honnan jönnek a teendők?",
    en: "Where do tasks come from?",
  },
  "teendok.sugo.szarmaztatott": {
    hu: "A legtöbb teendő magától keletkezik abból, ami az alkalmazásban történik: egy nyitott hibabejelentésből, egy esedékes befizetésből, egy hiányzó adatból. Ezeket nem kell lezárni: eltűnnek, amint az okuk megszűnik.",
    en: "Most tasks appear on their own from what happens in the app: an open fault report, a payment falling due, a missing detail. There is nothing to close: they disappear as soon as the reason for them is gone.",
  },
  "teendok.sugo.sajat": {
    hu: "A saját teendő más: azt te vetted fel, ezért le is kell zárni, és a lezárás vissza is vonható. A jegyzőkönyvben vállalt javítás is ilyen.",
    en: "A task you add yourself is different: you created it, so you close it, and closing can be undone. A repair undertaken in the handover record works the same way.",
  },
  "teendok.most": { hu: "Most", en: "Now" },
  "teendok.kesobb": { hu: "Később", en: "Later" },
  "teendok.lezart": { hu: "Lezárt", en: "Closed" },
  "teendok.uj": { hu: "Új teendő", en: "New task" },
  "teendok.mind": { hu: "Mind", en: "All" },
  "teendok.nap_ures": {
    hu: "Erre a napra nincs teendő.",
    en: "Nothing to do on this day.",
  },
  "teendok.urlap.cim": { hu: "Mi a teendő?", en: "What needs doing?" },
  "teendok.urlap.cim_helyorzo": {
    hu: "Kéményseprő, biztosítás, felmondási határidő…",
    en: "Chimney sweep, insurance, notice deadline…",
  },
  "teendok.urlap.leiras": { hu: "Részletek", en: "Details" },
  "teendok.urlap.leiras_sugo": {
    hu: "Nem kötelező. Ide kerül, amit egy hónap múlva már nem fogsz fejből tudni.",
    en: "Optional. This is for what you will not remember a month from now.",
  },
  "teendok.urlap.esedekesseg": { hu: "Mikorra", en: "Due" },
  "teendok.urlap.berlemeny": { hu: "Melyik bérleményhez", en: "Which tenancy" },
  "teendok.urlap.berlemeny_nelkul": {
    hu: "Nem tartozik bérleményhez",
    en: "Not tied to a tenancy",
  },
  "teendok.urlap.mentes": { hu: "Felveszem", en: "Add task" },
  "teendok.urlap.mentes_folyamatban": { hu: "Mentem…", en: "Saving…" },
  "naptar.elozo": { hu: "Előző hónap", en: "Previous month" },
  "naptar.kovetkezo": { hu: "Következő hónap", en: "Next month" },
  "naptar.lejart_mashonnan": {
    hu: "Ezen a hónapon kívül még {darab} lejárt teendő van.",
    en: "There are {darab} more overdue tasks outside this month.",
  },
  "naptar.nap_teendoi": {
    hu: "{nap}. — {darab} teendő",
    en: "Day {nap} — {darab} tasks",
  },
  "hetsav.cim": { hu: "A következő hét nap", en: "The next seven days" },
  "hetsav.mind": { hu: "Minden teendő", en: "All tasks" },
  "hetsav.lejart": {
    hu: "{darab} lejárt teendő",
    en: "{darab} overdue tasks",
  },
  "hetsav.szabad": {
    hu: "A héten nincs határidő.",
    en: "No deadlines this week.",
  },

  // --- Szolgáltatói látogatás
  "nav.latogatasok": { hu: "Látogatások", en: "Visits" },
  "latogatas.cim": { hu: "Szolgáltatói látogatások", en: "Service visits" },
  "latogatas.alcim": {
    hu: "Kéményseprő, leolvasás, szerelő — és hogy ki engedi be.",
    en: "Chimney sweep, meter reading, contractor — and who lets them in.",
  },
  "latogatas.sugo.cim": {
    hu: "Mire jó ez a lap?",
    en: "What is this page for?",
  },
  "latogatas.sugo.mirol": {
    hu: "A kérdés nem az, hogy mikor jön a szerelő — azt a szolgáltató mondja meg —, hanem hogy ki engedi be. Eddig ez SMS-ben ment, és épp az veszett el belőle, ami utólag számít: ki mit vállalt.",
    en: "The question is not when the contractor arrives — the provider decides that — but who lets them in. This used to go by text message, and what mattered later was exactly what got lost: who agreed to what.",
  },
  "latogatas.sugo.ketoldali": {
    hu: "A bérbeadó nem mehet be a bérlő távollétében pusztán azért, mert övé az ingatlan. Ha kulccsal megy be, ahhoz a bérlő kimondott hozzájárulása kell, és amíg nem mondta, itt sem írunk semmit a helyébe.",
    en: "A landlord may not enter while the tenant is away simply because they own the property. Entering with a key needs the tenant's explicit agreement, and until they give it, nothing here is assumed on their behalf.",
  },
  "latogatas.fajta.kemenysepro": { hu: "Kéményseprő", en: "Chimney sweep" },
  "latogatas.fajta.meroora": { hu: "Mérőóra-leolvasás", en: "Meter reading" },
  "latogatas.fajta.javitas": {
    hu: "Javítás, szerelő",
    en: "Repair, contractor",
  },
  "latogatas.fajta.mutatas": { hu: "Bérleménymutatás", en: "Viewing" },
  "latogatas.fajta.egyeb": { hu: "Egyéb", en: "Other" },
  "latogatas.allapot.varakozik": {
    hu: "Még nem tudjuk, ki engedi be: {nev} nem nyilatkozott.",
    en: "We do not yet know who will let them in: {nev} has not said.",
  },
  "latogatas.allapot.idopont_gond": {
    hu: "{nev} szerint nem jó ez az időpont.",
    en: "{nev} says this time does not work.",
  },
  "latogatas.allapot.itthon_lesz": {
    hu: "{nev} itthon lesz, és beengedi.",
    en: "{nev} will be home and will let them in.",
  },
  "latogatas.allapot.kulccsal": {
    hu: "Senki nem lesz itthon, de a bérbeadó bemehet a kulccsal.",
    en: "Nobody will be home, but the landlord may enter with the key.",
  },
  "latogatas.allapot.lemondva": { hu: "Lemondva.", en: "Cancelled." },
  "latogatas.allapot.elmult": { hu: "Elmúlt.", en: "Past." },
  "latogatas.idoablak": {
    hu: "{tol} és {ig} között",
    en: "between {tol} and {ig}",
  },
  "latogatas.idoablak_tol": { hu: "{tol}-tól", en: "from {tol}" },
  "latogatas.valasz.itthon_leszek": {
    hu: "Itthon leszek",
    en: "I will be home",
  },
  "latogatas.valasz.kulccsal_beengedheto": {
    hu: "Nem leszek itthon, a bérbeadó bemehet a kulccsal",
    en: "I will not be home; the landlord may enter with the key",
  },
  "latogatas.valasz.nem_jo_idopont": {
    hu: "Nem jó ez az időpont",
    en: "This time does not work",
  },
  "latogatas.valaszolt": {
    hu: "A te válaszod: {valasz}",
    en: "Your answer: {valasz}",
  },
  "latogatas.valaszolj": {
    hu: "Mi lesz ezen a napon?",
    en: "What will happen on this day?",
  },
  "latogatas.bejelento": {
    hu: "Bejelentette: {nev}",
    en: "Announced by {nev}",
  },
  "latogatas.szolgaltato": { hu: "Szolgáltató: {nev}", en: "Provider: {nev}" },
  "latogatas.fiok_nelkul": {
    hu: "{nev} még nem lépett be a saját fiókjába, ezért tőle nem tudunk választ kérni.",
    en: "{nev} has not signed in to their own account yet, so we cannot ask them.",
  },
  "latogatas.nincs": {
    hu: "Nincs bejelentett látogatás.",
    en: "No visits announced.",
  },
  "latogatas.kesobbi": { hu: "Lemondott és elmúlt", en: "Cancelled and past" },
  "latogatas.uj": { hu: "Új látogatás", en: "New visit" },
  "latogatas.lemondas": { hu: "Lemondom", en: "Cancel it" },
  "latogatas.lemondas_folyamatban": { hu: "Lemondom…", en: "Cancelling…" },
  "latogatas.lemondas_oka": {
    hu: "Miért marad el?",
    en: "Why is it not happening?",
  },
  "latogatas.lemondva_mert": { hu: "Lemondva: {oka}", en: "Cancelled: {oka}" },
  "latogatas.urlap.fajta": {
    hu: "Mi ez a látogatás?",
    en: "What kind of visit?",
  },
  "latogatas.urlap.megnevezes": { hu: "Megnevezés", en: "Name" },
  "latogatas.urlap.megnevezes_helyorzo": {
    hu: "Éves kéményellenőrzés",
    en: "Annual chimney inspection",
  },
  "latogatas.urlap.szolgaltato": { hu: "Szolgáltató", en: "Provider" },
  "latogatas.urlap.nap": { hu: "Melyik napon", en: "On which day" },
  "latogatas.urlap.idoablak": {
    hu: "Hány órától hány óráig",
    en: "From when to when",
  },
  "latogatas.urlap.idoablak_sugo": {
    hu: "Nem kötelező. Sok szolgáltató nem is ad meg pontos időt, és ezt jobb kiírni, mint kitalálni egyet.",
    en: "Optional. Many providers give no exact time, and saying so is better than inventing one.",
  },
  "latogatas.urlap.megjegyzes": { hu: "Megjegyzés", en: "Note" },
  "latogatas.urlap.berlemeny": {
    hu: "Melyik bérleményhez",
    en: "Which tenancy",
  },
  "latogatas.urlap.mentes": { hu: "Bejelentem", en: "Announce it" },
  "latogatas.urlap.mentes_folyamatban": { hu: "Mentem…", en: "Saving…" },
  "latogatas.urlap.valasz_indoklas": {
    hu: "Miért nem jó? Enélkül a másik fél nem tud új időpontot javasolni.",
    en: "Why not? Without this the other party cannot propose a new time.",
  },
  "latogatas.urlap.valasz_mentes": {
    hu: "Ezt válaszolom",
    en: "Send my answer",
  },
  "latogatas.urlap.valasz_folyamatban": { hu: "Küldöm…", en: "Sending…" },
  "latogatas.hiba.megnevezes": {
    hu: "Írd le, mi ez a látogatás.",
    en: "Say what this visit is.",
  },
  "latogatas.hiba.nap": { hu: "Adj meg egy napot.", en: "Give a day." },
  "latogatas.hiba.ora": {
    hu: "Az időt óra:perc alakban add meg, például 9:00.",
    en: "Give the time as hour:minute, for example 9:00.",
  },
  "latogatas.hiba.sorrend": {
    hu: "Az időablak vége nem lehet a kezdete előtt.",
    en: "The end of the time window cannot be before its start.",
  },
  "latogatas.hiba.fajta": {
    hu: "Válaszd ki, mi ez a látogatás.",
    en: "Choose what kind of visit this is.",
  },
  "latogatas.hiba.hianyos": { hu: "Hiányzó adat.", en: "Missing details." },
  "latogatas.hiba.valasz": {
    hu: "Válassz egy választ.",
    en: "Choose an answer.",
  },
  "latogatas.hiba.indoklas": {
    hu: "Írd le, miért nem jó az időpont.",
    en: "Say why the time does not work.",
  },
  "latogatas.hiba.csak_berlo": {
    hu: "Erre a bérlő nyilatkozik, mert az ő lakásáról van szó.",
    en: "The tenant answers this, because it is their home.",
  },
  "latogatas.hiba.nem_te_jelentetted": {
    hu: "Ezt a látogatást nem te jelentetted be, ezért nem is te mondhatod le. Ha nem jó az időpont, válaszolj úgy, és a bejelentő egyeztet.",
    en: "You did not announce this visit, so it is not yours to cancel. If the time does not suit you, answer accordingly and whoever announced it will arrange another.",
  },
  "latogatas.hiba.lemondas_oka": {
    hu: "Írd le, miért marad el.",
    en: "Say why it is not happening.",
  },
  "latogatas.kesz.bejelentve": { hu: "Bejelentve.", en: "Announced." },
  "latogatas.kesz.valaszolva": { hu: "Elküldve.", en: "Sent." },
  "latogatas.kesz.lemondva": { hu: "Lemondva.", en: "Cancelled." },
  "teendo.latogatas.valasz": {
    hu: "Nyilatkozz: {megnevezes}",
    en: "Say what will happen: {megnevezes}",
  },
  "teendo.latogatas.varakozik": {
    hu: "A bérbeadó nem tudja, bejut-e a szolgáltató.",
    en: "The landlord does not know whether the provider can get in.",
  },
  "teendo.latogatas.surgetes": {
    hu: "Nincs még válasz: {megnevezes}",
    en: "No answer yet: {megnevezes}",
  },
  "teendo.latogatas.kire_var": {
    hu: "{nev} nem nyilatkozott.",
    en: "{nev} has not answered.",
  },
  "teendo.latogatas.uj_idopont": {
    hu: "Új időpont kell: {megnevezes}",
    en: "A new time is needed: {megnevezes}",
  },
  "teendo.latogatas.kifogas": {
    hu: "A bérlőnek nem jó a bejelentett nap.",
    en: "The announced day does not work for the tenant.",
  },

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
  "hiba.ok.ismeretlen": {
    hu: "Nem tudom, mitől",
    en: "I do not know what caused it",
  },

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
  "hiba.allapot.atvette": {
    hu: "A bérbeadó átvette",
    en: "The landlord has acknowledged it",
  },
  "hiba.allapot.folyamatban": {
    hu: "Javítás folyamatban",
    en: "Repair in progress",
  },
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
  "hiba.lepes.lezarva": {
    hu: "Rendben van, lezárom",
    en: "All good, close it",
  },
  "hiba.lepes.elutasitva": { hu: "Elutasítom", en: "Decline" },

  "hiba.viselo.berbeado": {
    hu: "A bérbeadót terheli",
    en: "The landlord bears the cost",
  },
  "hiba.viselo.berlo": {
    hu: "A bérlőt terheli",
    en: "The tenant bears the cost",
  },
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
  "hiba.oldal.elerhetoseg": {
    hu: "A bérbeadó elérhetősége",
    en: "How to reach the landlord",
  },
  "hiba.oldal.nincs_telefon": {
    hu:
      "Telefonszámot még nem adott meg. Veszélyhelyzetnél kérd el tőle, mert a bejelentés magától " +
      "nem csörög.",
    en:
      "No phone number given yet. Ask for one in case of an emergency: a report in the app does not " +
      "ring anyone's phone.",
  },
  "hiba.oldal.nyitottak": {
    hu: "Nyitott bejelentéseim",
    en: "My open reports",
  },
  "hiba.oldal.lezartak": {
    hu: "Lezárt bejelentéseim",
    en: "My closed reports",
  },
  "hiba.oldal.nincs_nyitott": {
    hu: "Nincs nyitott bejelentésed.",
    en: "You have no open reports.",
  },

  "hiba.urlap.berlemeny": { hu: "Melyik bérlemény", en: "Which home" },
  "hiba.urlap.targy": {
    hu: "Mi a baj, egy mondatban",
    en: "What is wrong, in one sentence",
  },
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
    hu: "Ebből tudjuk megmondani, kit terhel a költség. Ha nem tudod, ne tippelj: azt is választhatod.",
    en: "This is what decides who bears the cost. If you do not know, do not guess: that is an option too.",
  },
  "hiba.urlap.surgosseg": { hu: "Mennyire sürgős", en: "How urgent is it" },
  "hiba.urlap.veszely_cim": {
    hu: "Amíg a bérbeadó ideér",
    en: "Until the landlord arrives",
  },
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
  "hiba.kartya.hatarido": {
    hu: "vállalt válasz: {nap}",
    en: "response promised by {nap}",
  },
  "hiba.kartya.lejart": { hu: " (lejárt)", en: " (overdue)" },
  "hiba.kartya.bejelento": {
    hu: "bejelentette: {nev}",
    en: "reported by {nev}",
  },
  "hiba.kartya.viselo": {
    hu: "Költségviselő: {fel}",
    en: "Cost borne by: {fel}",
  },
  "hiba.kartya.nincs_viselo": {
    hu: "A költségviselőről a bérbeadó még nem döntött. {indoklas}",
    en: "The landlord has not decided who bears the cost. {indoklas}",
  },
  "hiba.kartya.te": { hu: "Te", en: "You" },

  // --- Dokumentumtár
  "dokumentum.fajta.szerzodes": {
    hu: "Bérleti szerződés",
    en: "Lease agreement",
  },
  "dokumentum.fajta.jegyzokonyv": { hu: "Jegyzőkönyv", en: "Handover record" },
  "dokumentum.fajta.igazolas": {
    hu: "Bérbeadói igazolás",
    en: "Landlord's certificate",
  },
  "dokumentum.fajta.elszamolas": {
    hu: "Rezsielszámolás",
    en: "Utility statement",
  },
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
  "dokumentum.jegyzokonyv.felveve": {
    hu: "Felvéve {nap}.",
    en: "Recorded on {nap}.",
  },
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
  "dokumentum.lista.forditas": {
    hu: "Angol fordítás",
    en: "English translation",
  },
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
  "berlo.elszamolas": {
    hu: "Rezsielszámolás · {tol} – {ig}",
    en: "Utility statement · {tol} – {ig}",
  },
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
  "berlo.elszamolas.uzeneted": {
    hu: "Amit írtál: {szoveg}",
    en: "What you wrote: {szoveg}",
  },
  "berlo.befizetesek": {
    hu: "Befizetéseim · {berlemeny}",
    en: "My payments · {berlemeny}",
  },
  "berlo.esedekesseg": { hu: "Esedékesség: {nap}.", en: "Due: {nap}." },
  "berlo.osszesen": { hu: "Összesen", en: "Total" },
  "berlo.utalas.nyito": {
    hu: "Elutaltam, rögzítem",
    en: "I have transferred it",
  },
  "berlo.utalas.datum": { hu: "Mikor utaltad", en: "When you transferred it" },
  "berlo.utalas.osszeg": {
    hu: "Mennyit utaltál (Ft)",
    en: "How much you transferred (HUF)",
  },
  "berlo.utalas.kozlemeny": {
    hu: "Közlemény (ha volt)",
    en: "Reference (if any)",
  },
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
  "berlo.utalas.berbeado": {
    hu: "Amit a bérbeadó mond",
    en: "What the landlord says",
  },
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
  "valasz.nem_tied": {
    hu: "Ez a bejelentés nem a tiéd.",
    en: "This report is not yours.",
  },
  "valasz.potold": { hu: "Ezt még pótold:", en: "Please fill in:" },
  "valasz.hiany.targy": {
    hu: "Írd le egy mondatban, mi a baj.",
    en: "Describe in one sentence what is wrong.",
  },
  "valasz.hiany.leiras": {
    hu: "A részletezés nélkül nehéz eldönteni, mit kell vinni.",
    en: "Without details it is hard to tell what the repairer should bring.",
  },
  "valasz.hiany.terulet": {
    hu: "Válaszd ki, mi romlott el.",
    en: "Choose what broke.",
  },
  "valasz.hiany.ok": {
    hu: "Válaszd ki, mitől romlott el.",
    en: "Choose what caused it.",
  },
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
  "valasz.uj_allapot": {
    hu: "Új állapot: {allapot}.",
    en: "New status: {allapot}.",
  },
  "valasz.csak_berbeado": {
    hu: "Ezt csak a bérbeadó döntheti el.",
    en: "Only the landlord can decide this.",
  },
  "valasz.ismeretlen_viselo": {
    hu: "Ismeretlen költségviselő.",
    en: "Unknown cost bearer.",
  },
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
  "eloiras.elofizetes": {
    hu: "Előfizetés: {nev}.",
    en: "Subscription: {nev}.",
  },
  "eloiras.elofizetes_toredek": {
    hu: "Előfizetés: {nev}. Nem teljes hónap: {elso}–{utolso}. ({napok} nap a hónap {honapNapjai} napjából). A teljes havi díj {teljes} Ft.",
    en: "Subscription: {nev}. Partial month: {elso}–{utolso} ({napok} of the month's {honapNapjai} days). The full monthly fee is {teljes} HUF.",
  },

  // --- Előfizetések
  "elofizetes.cim": { hu: "Előfizetések", en: "Subscriptions" },
  "elofizetes.bevezeto": {
    hu: "Vezetékes tévé, telefon és internet a bérleményhez. Nem kötelező; amit felveszel, azt a bérlő hagyja jóvá.",
    en: "Cable TV, landline and internet for the property. Optional; whatever you add, the tenant approves.",
  },
  "nav.elofizetesek": { hu: "Előfizetések", en: "Subscriptions" },
  "elofizetes.nincs": {
    hu: "Ehhez a bérleményhez nincs előfizetés felvéve.",
    en: "No subscription has been added for this property.",
  },
  "elofizetes.fajta.tv": { hu: "Tévé", en: "TV" },
  "elofizetes.fajta.telefon": { hu: "Telefon", en: "Landline" },
  "elofizetes.fajta.internet": { hu: "Internet", en: "Internet" },
  "elofizetes.fajta.egyeb": { hu: "Egyéb", en: "Other" },
  "elofizetes.elofizeto.berbeado": {
    hu: "A bérbeadó az előfizető",
    en: "The landlord is the subscriber",
  },
  "elofizetes.elofizeto.berlo": {
    hu: "A bérlő az előfizető",
    en: "The tenant is the subscriber",
  },
  "elofizetes.allapot.varakozik": {
    hu: "Jóváhagyásra vár",
    en: "Waiting for approval",
  },
  "elofizetes.allapot.jovahagyva": { hu: "Jóváhagyva", en: "Approved" },
  "elofizetes.allapot.kifogasolt": { hu: "Kifogásolt", en: "Objected to" },
  "elofizetes.varunk_rad": {
    hu: "Rád vár: {nevek}",
    en: "Waiting for: {nevek}",
  },
  "elofizetes.nincs_fiokos_berlo": {
    hu: "Egyik bérlőnek sincs még fiókja, ezért jóváhagyni sem tudják. Küldj nekik meghívót.",
    en: "No tenant has an account yet, so nobody can approve it. Send them an invitation.",
  },
  "elofizetes.havi_dij": { hu: "{osszeg} / hó", en: "{osszeg} / month" },
  "elofizetes.berlo_fizeti_kozvetlenul": {
    hu: "A bérlő közvetlenül a szolgáltatónak fizet, ezért ebből nem lesz havi előírás.",
    en: "The tenant pays the provider directly, so this creates no monthly charge.",
  },
  "elofizetes.eloiras_lesz": {
    hu: "Jóváhagyás után havi előírás lesz belőle a befizetéseknél.",
    en: "Once approved, this becomes a monthly charge on the payments page.",
  },
  "elofizetes.jovahagyas_elott": {
    hu: "Amíg nincs jóváhagyva, nem írunk elő belőle semmit.",
    en: "Until it is approved, we charge nothing for it.",
  },
  "elofizetes.idoszak": { hu: "{kezdete} óta", en: "since {kezdete}" },
  "elofizetes.idoszak_zart": {
    hu: "{kezdete} – {vege}",
    en: "{kezdete} – {vege}",
  },

  // Bérbeadói űrlap
  "elofizetes.uj": { hu: "Előfizetés felvétele", en: "Add a subscription" },
  "elofizetes.mezo.fajta": { hu: "Miféle szolgáltatás", en: "Type of service" },
  "elofizetes.mezo.megnevezes": { hu: "Megnevezés", en: "Name" },
  "elofizetes.mezo.megnevezes_sugo": {
    hu: "Ahogy a számlán áll, például „Telekom 500/100 internet”.",
    en: "As it appears on the bill, for example “Telekom 500/100 internet”.",
  },
  "elofizetes.mezo.szolgaltato": { hu: "Szolgáltató", en: "Provider" },
  "elofizetes.mezo.elofizeto": {
    hu: "Kinek a nevén van az előfizetés?",
    en: "Whose name is the subscription in?",
  },
  "elofizetes.mezo.havi_dij": { hu: "Havi díj (Ft)", en: "Monthly fee (HUF)" },
  "elofizetes.mezo.kezdete": { hu: "Mettől", en: "From" },
  "elofizetes.mezo.vege": {
    hu: "Meddig (üresen hagyható)",
    en: "Until (may be left empty)",
  },
  "elofizetes.gomb.felvesz": { hu: "Felvétel", en: "Add" },
  "elofizetes.gomb.felveszem": { hu: "Felveszem…", en: "Adding…" },
  "elofizetes.gomb.megszuntet": {
    hu: "Megszüntetés mai nappal",
    en: "End it today",
  },
  "elofizetes.gomb.megszuntetem": { hu: "Megszüntetem…", en: "Ending…" },
  "elofizetes.megszunt": { hu: "Megszűnt {vege}-n.", en: "Ended on {vege}." },

  // Bérlői nyilatkozat
  "elofizetes.berlo.cim": { hu: "Előfizetések", en: "Subscriptions" },
  "elofizetes.berlo.bevezeto": {
    hu: "Ezeket a bérbeadó vette fel a bérleményhez. Amíg nem mondasz rá igent, nem kérünk érte pénzt.",
    en: "The landlord added these to the property. Until you say yes, we charge nothing for them.",
  },
  "elofizetes.gomb.jovahagy": {
    hu: "Rendben, jóváhagyom",
    en: "Fine, I approve it",
  },
  "elofizetes.gomb.jovahagyom": { hu: "Jóváhagyom…", en: "Approving…" },
  "elofizetes.gomb.kifogas": { hu: "Kifogást emelek", en: "I object" },
  "elofizetes.gomb.kifogasolom": { hu: "Küldöm…", en: "Sending…" },
  "elofizetes.mezo.indoklas": {
    hu: "Miért nem jó így?",
    en: "What is wrong with it?",
  },
  "elofizetes.mar_nyilatkoztal": {
    hu: "Erről már nyilatkoztál.",
    en: "You have already responded to this.",
  },
  "elofizetes.sajat_nyilatkozat.jovahagyva": {
    hu: "Jóváhagytad.",
    en: "You approved it.",
  },
  "elofizetes.sajat_nyilatkozat.kifogasolt": {
    hu: "Kifogást emeltél: {indoklas}",
    en: "You objected: {indoklas}",
  },
  "elofizetes.masik_kifogasa": {
    hu: "{nev} kifogása: {indoklas}",
    en: "{nev} objected: {indoklas}",
  },

  // Kifogások és figyelmeztetések
  "elofizetes.kifogas.nincs_megnevezes": {
    hu: "Adj nevet az előfizetésnek, különben a bérlő nem tudja, miről mond igent.",
    en: "Name the subscription, otherwise the tenant cannot tell what they are approving.",
  },
  "elofizetes.kifogas.negativ_dij": {
    hu: "A havi díj nem lehet negatív.",
    en: "The monthly fee cannot be negative.",
  },
  "elofizetes.kifogas.vege_a_kezdet_elott": {
    hu: "A megszűnés napja nem lehet a kezdet előtt.",
    en: "The end date cannot precede the start date.",
  },
  "elofizetes.kifogas.nincs_indoklas": {
    hu: "Írd le, mi a kifogásod: enélkül a bérbeadó nem tud mit kezdeni vele.",
    en: "Say what your objection is: without it the landlord has nothing to act on.",
  },
  "elofizetes.figyelmeztet.nulla_dij": {
    hu: "Nulla forintos havi díjból nem lesz előírás: ezt a bérleti díjban hagyod.",
    en: "A zero monthly fee creates no charge: you are leaving it inside the rent.",
  },
  "elofizetes.figyelmeztet.berlo_fizet": {
    hu: "A bérlő a saját előfizetését a szolgáltatónak fizeti, ezért a havi díjat nem írjuk elő neki. Tájékoztatásként megmarad.",
    en: "The tenant pays their own subscription to the provider, so we do not charge the fee. It stays here for information.",
  },
  "elofizetes.hiba.nincs_jogosultsag": {
    hu: "Ez az előfizetés nem a tiéd.",
    en: "This subscription is not yours.",
  },
  "elofizetes.hiba.mar_nyilatkozott": {
    hu: "Erről már nyilatkoztál, és a nyilatkozatot nem írjuk felül.",
    en: "You have already responded to this, and we do not overwrite your response.",
  },
  "elofizetes.rendezettek": {
    hu: "Rendezett és megszűnt előfizetések ({darab})",
    en: "Settled and ended subscriptions ({darab})",
  },
  "elofizetes.felvettuk": {
    hu: "Felvettük. A bérlő most kapja meg jóváhagyásra.",
    en: "Added. The tenant now has it to approve.",
  },
  "elofizetes.megszuntettuk": {
    hu: "Megszüntettük mai nappal.",
    en: "Ended as of today.",
  },
  "elofizetes.nyilatkoztal": {
    hu: "Elmentettük, amit mondtál.",
    en: "We saved your response.",
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
  "valasz.mar_lezart": {
    hu:
      "Ez a jogviszony már le van zárva. Ha a dátumot javítanád, előbb vond vissza a lezárást, " +
      "mert az a törölt előírásokat is visszaszámolja.",
    en:
      "This tenancy is already closed. To correct the date, undo the closing first — that also " +
      "restores the charges it removed.",
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
  "berlok.lezaras_nap": {
    hu: "Melyik nappal zárul?",
    en: "On which day does it end?",
  },
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
  "berlemeny.mentve": {
    hu: "A bérlemény elmentve.",
    en: "The property has been saved.",
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
  "berlemeny.mezo.alapterulet": {
    hu: "Alapterület (m²)",
    en: "Floor area (m²)",
  },
  "berlemeny.mezo.helyrajzi": {
    hu: "Helyrajzi szám",
    en: "Land registry number",
  },
  "berlemeny.mezo.energetikai": {
    hu: "Energetikai tanúsítvány azonosítója",
    en: "Energy certificate identifier",
  },
  "berlemeny.mezo.kozos_koltseg": {
    hu: "Közös költség (Ft / hó)",
    en: "Common charges (HUF / month)",
  },
  "berlemeny.mezo.beszerzesi_ar": {
    hu: "Beszerzési ár (Ft)",
    en: "Purchase price (HUF)",
  },
  "berlemeny.mezo.beszerzes_datuma": {
    hu: "Beszerzés dátuma",
    en: "Purchase date",
  },
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
  "jogviszony.mezo.ingatlan": {
    hu: "Melyik bérleményre?",
    en: "Which property?",
  },
  "jogviszony.mezo.kezdete": { hu: "A bérlet kezdete", en: "Tenancy starts" },
  "jogviszony.mezo.dij": {
    hu: "Bérleti díj (Ft / hó)",
    en: "Rent (HUF / month)",
  },
  "jogviszony.mezo.kozos_koltseg": {
    hu: "Közös költség, amit a bérlő fizet (Ft / hó)",
    en: "Common charges paid by the tenant (HUF / month)",
  },
  "jogviszony.mezo.kaucio": { hu: "Óvadék (Ft)", en: "Deposit (HUF)" },
  "jogviszony.mezo.fizetesi_nap": {
    hu: "A hónap hányadikára esedékes",
    en: "Due on which day of the month",
  },
  "jogviszony.mezo.rezsi": {
    hu: "Hogyan megy a rezsi?",
    en: "How are utilities settled?",
  },
  "jogviszony.rezsi.almero": {
    hu: "Mérőóra szerint, elszámolással",
    en: "By meter, with a settlement",
  },
  "jogviszony.rezsi.atalany": { hu: "Havi átalány", en: "Monthly flat rate" },
  "jogviszony.rezsi.kozos_koltsegben": {
    hu: "A közös költség tartalmazza",
    en: "Included in the common charges",
  },
  "jogviszony.mezo.atalany": {
    hu: "Rezsiátalány (Ft / hó)",
    en: "Utility flat rate (HUF / month)",
  },
  "jogviszony.mezo.berlo": {
    hu: "Az első bérlő neve",
    en: "First tenant\u2019s name",
  },
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
  "lista.rendezett": {
    hu: "Rendezett tételek ({darab})",
    en: "Settled items ({darab})",
  },
  "lista.rendezett_bizonylattal": {
    hu: "Rendezett, de van hozzá feltöltött bizonylat ({darab})",
    en: "Settled, but a receipt was uploaded ({darab})",
  },
  "lista.nincs_teendo": {
    hu: "Ezzel a bérleménnyel most nincs dolgod.",
    en: "Nothing needs you on this tenancy right now.",
  },
  "lista.korabbiak": {
    hu: "Korábbi hónapok ({darab})",
    en: "Earlier months ({darab})",
  },

  // --- Betekintő nézet
  "nav.betekinto": { hu: "Betekintő", en: "Shared view" },
  "betekinto.oldal.cim": {
    hu: "Betekintő a bérleményembe",
    en: "A window into my tenancy",
  },
  "betekinto.oldal.bevezeto": {
    hu: "Ha más fizeti vagy segíti a lakhatásodat — jellemzően a szüleid —, ezzel a linkkel megmutathatod nekik, hogy áll a bérlemény: mi volt esedékes, mi érkezett meg, és mi van még nyitva. Nem kell belépniük, és nem a te bemondásod: az adat abból jön, amit a bérbeadó maga rögzített a beérkezésekről.",
    en: "If someone else pays for or helps with your housing — usually your parents — this link shows them where the tenancy stands: what fell due, what arrived, and what is still open. They do not need to sign in, and it is not your own word: the data comes from what the landlord recorded as received.",
  },
  "betekinto.oldal.mit_nem": {
    hu: "A link nem árulja el a bérbeadód nevét, a pontos címet, a lakótársaid nevét és semmilyen személyes adatot. Aki megkapja, annak a pontos cím úgyis megvan; a linkhez viszont bárki hozzáfér, akihez eljut, ezért nem tesszük bele. Bármikor visszavonhatod, és az azonnal hat.",
    en: "The link does not reveal your landlord's name, the exact address, your flatmates' names or any personal data. Whoever you send it to already knows the address; anyone the link reaches can open it, so we leave it out. You can revoke it at any time, and that takes effect immediately.",
  },
  "betekinto.urlap.cim": { hu: "Új betekintő", en: "New reference" },
  "betekinto.urlap.jogviszony": {
    hu: "Melyik bérleményről?",
    en: "Which tenancy?",
  },
  "betekinto.urlap.cel": { hu: "Kinek készül?", en: "Who is it for?" },
  "betekinto.urlap.cel_sugo": {
    hu: "Ez a mondat a megnyitott oldal tetején lesz, hogy aki megkapja, lássa, neki szól. Magadnak is jelölés: a kiadott linkjeidet erről ismered fel.",
    en: "This sentence appears at the top of the page so the reader can see it was meant for them. It is also how you tell your issued links apart.",
  },
  "betekinto.urlap.cel_pelda": {
    hu: "például: anyáéknak",
    en: "for example: for my parents",
  },
  "betekinto.urlap.elettartam": {
    hu: "Meddig éljen a link?",
    en: "How long should the link live?",
  },
  "betekinto.urlap.nap": { hu: "{napok} nap", en: "{napok} days" },
  "betekinto.urlap.osszeg": {
    hu: "Az összegek is látszódjanak",
    en: "Show the amounts too",
  },
  "betekinto.urlap.osszeg_sugo": {
    hu: "Alapból látszik: aki fizeti, annak összeg nélkül semmit nem ér. Kapcsold ki, ha valakinek elég annyi, hogy rendben van-e.",
    en: "On by default: without the amounts it is of no use to whoever pays. Turn it off if the reader only needs to know whether things are in order.",
  },
  "betekinto.urlap.gomb": { hu: "Betekintő készítése", en: "Create reference" },
  "betekinto.lista.cim": { hu: "Kiadott linkjeim", en: "Links I have issued" },
  "betekinto.lista.ures": {
    hu: "Még nem adtál ki betekintőt.",
    en: "You have not issued a reference yet.",
  },
  "betekinto.lista.lejar": { hu: "Lejár: {nap}", en: "Expires: {nap}" },
  "betekinto.lista.megnyitas": {
    hu: "Megnyitva {darab} alkalommal",
    en: "Opened {darab} times",
  },
  "betekinto.lista.megnyitas_soha": {
    hu: "Még nem nyitották meg",
    en: "Not opened yet",
  },
  "betekinto.lista.utoljara": { hu: "Utoljára: {nap}", en: "Last time: {nap}" },
  "betekinto.lista.visszavon": { hu: "Visszavonom", en: "Revoke" },
  "betekinto.allapot.elo": { hu: "Él", en: "Live" },
  "betekinto.allapot.lejart": { hu: "Lejárt", en: "Expired" },
  "betekinto.allapot.visszavonva": { hu: "Visszavonva", en: "Revoked" },
  "betekinto.nyilvanos.cim": {
    hu: "Eddig így alakult",
    en: "How it has gone so far",
  },
  "betekinto.nyilvanos.berlo": {
    hu: "{nev} bérleménye",
    en: "{nev}'s tenancy",
  },
  "betekinto.nyilvanos.telepules": {
    hu: "A bérlemény települése: {telepules}",
    en: "The flat is in {telepules}",
  },
  "betekinto.nyilvanos.kezdete": {
    hu: "A jogviszony kezdete: {nap}",
    en: "Tenancy started: {nap}",
  },
  "betekinto.nyilvanos.el": {
    hu: "A jogviszony jelenleg is él.",
    en: "The tenancy is still running.",
  },
  "betekinto.nyilvanos.lezart": {
    hu: "A jogviszony már lezárult.",
    en: "The tenancy has ended.",
  },
  "betekinto.nyilvanos.dij": {
    hu: "Havi bérleti díj: {dij}",
    en: "Monthly rent: {dij}",
  },
  "betekinto.nyilvanos.most": {
    hu: "Hol tart most",
    en: "Where it stands now",
  },
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
  "betekinto.nyilvanos.havi_cim": {
    hu: "Hónapról hónapra",
    en: "Month by month",
  },
  "betekinto.nyilvanos.havi_sugo": {
    hu: "Az utolsó egy év. Egy hónap összege minden, ami arra a hónapra elő volt írva: a bérleti díj, a közös költség, a rezsiátalány, és ha volt, a rezsielszámolás is.",
    en: "The last twelve months. A month's amount is everything scheduled for that month: the rent, the common charges, the utility flat rate, and a utility settlement if there was one.",
  },
  "betekinto.nyilvanos.eloirt": { hu: "Előírva", en: "Scheduled" },
  "betekinto.nyilvanos.erkezett": { hu: "Beérkezett", en: "Received" },
  "betekinto.havi.rendben": {
    hu: "Határidőre megérkezett",
    en: "Arrived on time",
  },
  "betekinto.havi.kesve": {
    hu: "{napok} nap késéssel érkezett",
    en: "Arrived {napok} days late",
  },
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
  "betekinto.nyilvanos.kiadva": {
    hu: "A bérlő adta ki {nap} napján, lejár {lejar} napján.",
    en: "Issued by the tenant on {nap}, expires on {lejar}.",
  },
  "betekinto.nyilvanos.nincs": {
    hu: "Ez a link lejárt vagy visszavonták.",
    en: "This link has expired or was revoked.",
  },
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
  "berlok.sugo_cim": {
    hu: "Hogyan működik a több bérlő?",
    en: "How do several tenants work?",
  },
  "rezsi.sugo_cim": {
    hu: "Hogyan készül az elszámolás?",
    en: "How is the settlement produced?",
  },
  "hibak.sugo_cim": {
    hu: "Hogyan megy a hibabejelentés?",
    en: "How does a fault report work?",
  },
  "ado.sugo_cim": {
    hu: "Mit jelent, hogy összesítő?",
    en: 'What does "summary" mean here?',
  },
  "beszelgetes.sugo_cim": {
    hu: "Mire való ez a lap?",
    en: "What is this page for?",
  },
  "elofizetes.sugo_cim": {
    hu: "Mire való ez a lap?",
    en: "What is this page for?",
  },
  "hiba.oldal.sugo_cim": {
    hu: "Mi történik a bejelentés után?",
    en: "What happens after you report it?",
  },
  "dokumentum.oldal.sugo_cim": {
    hu: "Mit látsz itt?",
    en: "What you see here",
  },
  "betekinto.oldal.sugo_cim": {
    hu: "Mire jó a betekintő, és mi nem kerül bele?",
    en: "What the shared view is for, and what it leaves out",
  },

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
  "befizetesek.beerkezes_nyito": {
    hu: "Megérkezett? Rögzítem",
    en: "Arrived? Record it",
  },
  "befizetesek.beerkezes_datum": {
    hu: "Mikor érkezett",
    en: "When it arrived",
  },
  "befizetesek.beerkezes_osszeg": {
    hu: "Mennyi érkezett (Ft)",
    en: "How much arrived (HUF)",
  },
  "befizetesek.beerkezes_kozlemeny": {
    hu: "Közlemény (ha van)",
    en: "Reference (if any)",
  },
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

  // --- Közös szövegdarabok
  "kozos.havi_dij": { hu: "{osszeg} / hó", en: "{osszeg} / month" },

  // --- Befizetések (bérbeadói oldal)
  "befizetesek.bevezeto": {
    hu:
      "Három adat találkozik: mit kellett volna fizetni, mit mond a bérlő, és mit mondasz te. A " +
      "két fél a saját oldalát adja meg, és ha a kettő egyezik, a tétel le van zárva.",
    en:
      "Three records meet here: what was due, what the tenant reports, and what you report. Each " +
      "side enters its own, and where the two agree, the item is closed.",
  },
  "befizetesek.bizonylat_szabaly": {
    hu:
      "Bizonylatot csak akkor kérünk, ha a két oldal nem egyezik, és akkor is csak arról az egy " +
      "utalásról: tőled a fogadó oldalit, a bérlőtől a küldő oldalit. Teljes bankszámlakivonatot " +
      "nem kérünk, és nem is fogadunk el.",
    en:
      "We ask for a receipt only when the two sides disagree, and even then only for that one " +
      "transfer: the receiving side from you, the sending side from the tenant. We never ask for " +
      "a full bank statement, and we do not accept one.",
  },
  "befizetesek.ablak_atallitom": { hu: "Átállítom", en: "Change it" },
  "befizetesek.oszlop.eloiras": { hu: "Előírás", en: "Charged" },
  "befizetesek.oszlop.berlo": {
    hu: "Amit a bérlő mond",
    en: "What the tenant reports",
  },
  "befizetesek.oszlop.berbeado": {
    hu: "Ami hozzád megérkezett",
    en: "What reached you",
  },
  "befizetesek.nem_erkezett_ertek": {
    hu: "nem érkezett meg",
    en: "nothing arrived",
  },
  "befizetesek.vita_magyarazat": {
    hu:
      "A két oldal nem egyezik. Ilyenkor van értelme az utalás bizonylatának: tőled a fogadó " +
      "oldali, a bérlőtől a küldő oldali. Teljes bankszámlakivonat nem kell.",
    en:
      "The two sides do not match. This is where the receipt of that one transfer helps: the " +
      "receiving side from you, the sending side from the tenant. No full bank statement is needed.",
  },

  // --- Beérkezés rögzítése (bérbeadói űrlap)
  "beerkezes.nyito": {
    hu: "Megérkezett? Rögzítem",
    en: "Did it arrive? Record it",
  },
  "beerkezes.datum": { hu: "Mikor érkezett", en: "When it arrived" },
  "beerkezes.osszeg": {
    hu: "Mennyi érkezett (Ft)",
    en: "How much arrived (HUF)",
  },
  "beerkezes.kozlemeny": { hu: "Közlemény (ha van)", en: "Reference (if any)" },
  "beerkezes.gomb": { hu: "Rögzítem", en: "Record it" },
  "beerkezes.nem": {
    hu: "Megnéztem: nem érkezett meg",
    en: "I checked: nothing arrived",
  },
  "beerkezes.visszavon": {
    hu: "Ezt tévedésből rögzítettem",
    en: "I recorded this by mistake",
  },

  // --- Adóösszesítő
  "ado.cim": { hu: "Adóösszesítő · {ev}", en: "Tax summary · {ev}" },
  "ado.bevezeto": {
    hu:
      "Ez összesítő, nem bevallás: a bevallást te adod be, ezekkel a számokkal ellenőrizve. A " +
      "bevétel pénzforgalmi, vagyis az számít, ami ebben az évben tényleg megérkezett.",
    en:
      "This is a summary, not a tax return: you file the return, checking it against these " +
      "figures. Income is counted when it is received, so only what actually arrived this year " +
      "is here.",
  },
  "ado.letoltes": {
    hu: "Letöltés táblázatba",
    en: "Download as a spreadsheet",
  },
  "ado.bevetel": { hu: "Bevétel", en: "Income" },
  "ado.nem_bevetel": { hu: "Nem bevétel", en: "Not income" },
  "ado.nem_bevetel_alcim": {
    hu: "mért, továbbhárított rezsi",
    en: "metered utilities passed on",
  },
  "ado.nem_bevetel_jelzes": { hu: "nem bevétel", en: "not income" },
  "ado.koltseg": { hu: "Költség", en: "Costs" },
  "ado.melyik_mod": {
    hu: "Melyik elszámolással jársz jobban",
    en: "Which method leaves you better off",
  },
  "ado.mod.hanyad": {
    hu: "{szazalek}%-os költséghányad",
    en: "{szazalek}% flat expense ratio",
  },
  "ado.mod.hanyad_magyarazat": {
    hu: "Nem kell számlákat gyűjteni: a bevétel {szazalek}%-a az adóalap.",
    en: "No invoices to collect: {szazalek}% of your income is the tax base.",
  },
  "ado.mod.hanyad_rag": {
    hu: "A költséghányaddal",
    en: "the flat expense ratio",
  },
  "ado.mod.teteles": {
    hu: "Tételes költségelszámolás",
    en: "Itemised expenses",
  },
  "ado.mod.teteles_magyarazat": {
    hu: "A ténylegesen felmerült költségek, számlával, az értékcsökkenéssel együtt.",
    en: "Your actual costs, with invoices, depreciation included.",
  },
  "ado.mod.teteles_rag": {
    hu: "A tételes elszámolással",
    en: "itemised expenses",
  },
  "ado.ajanlott": { hu: "ezzel jársz jobban", en: "better for you" },
  "ado.adoalap": { hu: "Adóalap", en: "Tax base" },
  "ado.szja": { hu: "Szja", en: "Income tax" },
  "ado.egyforma": {
    hu: "A két mód most ugyanannyit hoz.",
    en: "The two methods come out the same this year.",
  },
  "ado.megtakaritas": {
    hu: "{mod} {osszeg} adóval kevesebbet fizetsz. Az szja kulcsa {kulcs}%.",
    en: "You pay {osszeg} less tax with {mod}. The income tax rate is {kulcs}%.",
  },
  "ado.befolyt": { hu: "Ami befolyt", en: "What came in" },
  "ado.nincs_bevetel": {
    hu: "Ebben az évben még nem érkezett párosított befizetés.",
    en: "No matched payment has arrived this year yet.",
  },
  "ado.besorolatlan": { hu: "Besorolatlan befizetés", en: "Unmatched payment" },
  "ado.besorolatlan_magyarazat": {
    hu: "Beérkezett utalás, amihez nem tartozik előírt tétel. Döntsd el, bevétel-e.",
    en: "A transfer arrived with no charge behind it. You decide whether it is income.",
  },
  "ado.koltsegek": { hu: "Költségek", en: "Costs" },
  "ado.nincs_koltseg": {
    hu: "Ebben az évben még nincs rögzített költség.",
    en: "No cost has been recorded for this year yet.",
  },
  "ado.uj_koltseg": { hu: "Új költség", en: "New cost" },
  "ado.uj_koltseg_sugo": {
    hu:
      "Csak a tételes elszámolásnál számít, de érdemes rögzíteni: év végén derül ki, melyik " +
      "móddal jársz jobban.",
    en:
      "It only counts under itemised expenses, but record it anyway: which method wins only " +
      "becomes clear at the end of the year.",
  },
  "ado.ertekcsokkenes": {
    hu: "Értékcsökkenés alapja",
    en: "Basis for depreciation",
  },
  "ado.ertekcsokkenes_sugo": {
    hu:
      "A tételes elszámolásban az épület beszerzési árának évi 2%-a leírható, a kiadott napokra " +
      "arányosítva. Enélkül a tételes mód hiányos.",
    en:
      "Under itemised expenses you may write off 2% of the purchase price a year, pro-rated for " +
      "the days let. Without it the itemised method is incomplete.",
  },
  "ado.nincs_megadva": { hu: "nincs megadva", en: "not set" },
  "ado.lablec": {
    hu:
      "Az összesítő a rögzített adatokból számol, és nem helyettesíti a könyvelőt. A mért, " +
      "továbbhárított közüzemi díj azért nem bevétel, mert a tényleges fogyasztás szerint hárul " +
      "át; az átalányban fizetett rezsi viszont bevétel.",
    en:
      "The summary is calculated from what you recorded, and does not replace an accountant. " +
      "Metered utilities passed on are not income because they are charged on by actual " +
      "consumption; a flat-rate utility charge is income.",
  },

  // Költségfajták
  "ado.fajta.felujitas": {
    hu: "Felújítás, karbantartás",
    en: "Renovation, maintenance",
  },
  "ado.fajta.kozos_koltseg": { hu: "Közös költség", en: "Service charge" },
  "ado.fajta.biztositas": { hu: "Biztosítás", en: "Insurance" },
  "ado.fajta.kozuzem": { hu: "Közüzemi számla", en: "Utility bill" },
  "ado.fajta.egyeb": { hu: "Egyéb", en: "Other" },
  "ado.fajta.ertekcsokkenes": { hu: "Értékcsökkenés", en: "Depreciation" },

  // Miért bevétel, vagy miért nem
  "ado.indok.mert": {
    hu: "Fogyasztás szerint mért, továbbhárított közüzemi díj, ezért nem bevétel.",
    en: "A metered utility charge passed on at cost, so it is not income.",
  },
  "ado.indok.atalany": {
    hu:
      "Átalányban fizetett rezsi: nincs mögötte tényleges fogyasztás szerinti arányosítás, ezért " +
      "bevétel.",
    en:
      "A flat-rate utility charge: nothing is apportioned by actual consumption behind it, so it " +
      "is income.",
  },
  "ado.indok.kozos_koltseg": {
    hu: "A bérlőtől kapott közös költség bevétel; ha te fizeted a társasháznak, költségként leírható.",
    en:
      "A service charge received from the tenant is income; if you pay it to the building, you " +
      "can deduct it as a cost.",
  },
  "ado.indok.berleti_dij": {
    hu: "Bérleti díjként befolyt összeg.",
    en: "Received as rent.",
  },

  // A bevételi sor megnevezése
  "ado.megnevezes.mert": {
    hu: "{alap} · mért fogyasztás",
    en: "{alap} · metered use",
  },
  "ado.megnevezes.kozos_koltseg": {
    hu: "{alap} · közös költség",
    en: "{alap} · service charge",
  },
  "ado.megnevezes.atalany_es_kozos": {
    hu: "{alap} · átalány és közös költség",
    en: "{alap} · flat rate and service charge",
  },
  "ado.megnevezes.ertekcsokkenes": {
    hu: "Értékcsökkenés ({napok} kiadott nap)",
    en: "Depreciation ({napok} days let)",
  },

  // Költség űrlap
  "ado.urlap.ingatlan": { hu: "Ingatlan", en: "Property" },
  "ado.urlap.fajta": { hu: "Mi volt ez", en: "What was it" },
  "ado.urlap.datum": { hu: "Dátum", en: "Date" },
  "ado.urlap.osszeg": { hu: "Összeg", en: "Amount" },
  "ado.urlap.osszeg_pelda": { hu: "pl. 45 000", en: "e.g. 45 000" },
  "ado.urlap.megnevezes": { hu: "Megnevezés", en: "Description" },
  "ado.urlap.megnevezes_pelda": {
    hu: "pl. Kazán karbantartás, számla 2026/114",
    en: "e.g. Boiler service, invoice 2026/114",
  },
  "ado.urlap.gomb": { hu: "Költség rögzítése", en: "Record cost" },
  "ado.urlap.folyamatban": { hu: "Rögzítés…", en: "Recording…" },

  // Beszerzési ár
  "ado.beszerzes.ar": { hu: "Beszerzési ár", en: "Purchase price" },
  "ado.beszerzes.ar_pelda": { hu: "pl. 58 000 000", en: "e.g. 58 000 000" },
  "ado.beszerzes.nap": { hu: "Vásárlás napja", en: "Date of purchase" },
  "ado.beszerzes.gomb": { hu: "Mentés", en: "Save" },
  "ado.beszerzes.folyamatban": { hu: "Mentés…", en: "Saving…" },

  // --- Mérőórák
  "meroora.villany": { hu: "Villany", en: "Electricity" },
  "meroora.viz": { hu: "Víz", en: "Water" },
  "meroora.gaz": { hu: "Gáz", en: "Gas" },
  "meroora.futes": { hu: "Fűtés", en: "Heating" },
  "meroora.almero": { hu: "{nev} (almérő)", en: "{nev} (submeter)" },

  // --- Rezsi és elszámolás (bérbeadói oldal)
  "rezsi.cim": { hu: "Rezsi és elszámolás", en: "Utilities and settlement" },
  "rezsi.bevezeto": {
    hu:
      "Az óraállásokból tételes elszámolás készül, a magyar sávos árazással: a kedvezményes " +
      "keretig kedvezményes áron, fölötte piaci áron. A kiadott elszámolás előírt tételként megy " +
      "tovább a befizetésekhez.",
    en:
      "Meter readings become an itemised settlement, with the Hungarian banded pricing: at the " +
      "reduced price up to the annual allowance, at the market price above it. Once issued, the " +
      "settlement becomes a charge on the payments page.",
  },
  "rezsi.mod": { hu: "Rezsi elszámolása {mod}", en: "Utilities settled {mod}" },
  "rezsi.mod.almero": { hu: "mérőóra szerint", en: "by meter" },
  "rezsi.mod.atalany": { hu: "átalánnyal", en: "at a flat rate" },
  "rezsi.mod.kozos_koltsegben": {
    hu: "a közös költségben",
    en: "within the service charge",
  },
  "rezsi.kozos_koltseg": {
    hu: "közös költség {osszeg} / hó",
    en: "service charge {osszeg} / month",
  },
  "rezsi.meroorak": { hu: "Mérőórák", en: "Meters" },
  "rezsi.nincs_meroora": {
    hu: "Ehhez az ingatlanhoz nincs mérőóra felvéve.",
    en: "No meter has been added for this property.",
  },
  "rezsi.nincs_oraallas": { hu: "még nincs óraállás", en: "no reading yet" },
  "rezsi.dijszabas": {
    hu: "{ar} Ft/{egyseg} a kereten belül",
    en: "{ar} HUF/{egyseg} within the allowance",
  },
  "rezsi.dijszabas_keret": {
    hu: ", {keret} {egyseg}/év keret, fölötte {piaci} Ft/{egyseg}",
    en: ", allowance {keret} {egyseg}/year, above it {piaci} HUF/{egyseg}",
  },
  "rezsi.dijszabas_nincs_savhatar": {
    hu: ", nincs sávhatár",
    en: ", no band limit",
  },
  "rezsi.dijszabas_csatorna": {
    hu: ", csatornadíj {ar} Ft/{egyseg}",
    en: ", sewage {ar} HUF/{egyseg}",
  },
  "rezsi.nincs_dijszabas": {
    hu: "nincs díjszabás felvéve",
    en: "no tariff has been added",
  },
  "rezsi.uj_elszamolas": { hu: "Új elszámolás", en: "New settlement" },
  "rezsi.vitatja": {
    hu: "A bérlő vitatja: {uzenet}",
    en: "The tenant disputes it: {uzenet}",
  },

  // Óraállás űrlap
  "rezsi.oraallas.datum": { hu: "Dátum", en: "Date" },
  "rezsi.oraallas.ertek": {
    hu: "Óraállás ({egyseg})",
    en: "Reading ({egyseg})",
  },
  "rezsi.oraallas.gomb": { hu: "Óraállás rögzítése", en: "Record reading" },
  "rezsi.oraallas.folyamatban": { hu: "Rögzítés…", en: "Recording…" },

  // Elszámolás készítése és kiadása
  "rezsi.elszamolas.kezdete": { hu: "Időszak kezdete", en: "Period starts" },
  "rezsi.elszamolas.vege": { hu: "Időszak vége", en: "Period ends" },
  "rezsi.elszamolas.gomb": {
    hu: "Elszámolás készítése",
    en: "Prepare settlement",
  },
  "rezsi.elszamolas.folyamatban": { hu: "Számolás…", en: "Calculating…" },
  "rezsi.kiadas.hatarido": { hu: "Fizetési határidő", en: "Payment due" },
  "rezsi.kiadas.gomb": { hu: "Kiadom a bérlőnek", en: "Issue to the tenant" },
  "rezsi.kiadas.folyamatban": { hu: "Kiadás…", en: "Issuing…" },

  // A bérlő elbírálása
  "rezsi.elbiralas.sugo": {
    hu: "Ha vitatod, írd le, melyik tétellel van baj",
    en: "If you dispute it, say which item is wrong",
  },
  "rezsi.elbiralas.elfogad": { hu: "Elfogadom", en: "I accept it" },
  "rezsi.elbiralas.vitat": { hu: "Vitatom", en: "I dispute it" },

  // --- Bérlők lapja
  "berlok.cim": { hu: "Bérlők", en: "Tenants" },
  "berlok.bevezeto": {
    hu:
      "Egy bérleményhez több bérlő is tartozhat. A bérleti díj ilyenkor is egy előírás marad: a " +
      "bérlők egyetemlegesen felelnek érte, és bármelyikük fizetése a többit is mentesíti. A " +
      "bérlő meghívó linkkel készít magának díjmentes fiókot, amelyben csak a saját bérleményét " +
      "látja.",
    en:
      "A flat can have several tenants. The rent stays a single charge even then: the tenants are " +
      "jointly and severally liable for it, and a payment by any of them clears it for all. A " +
      "tenant creates a free account from an invitation link, and sees only their own flat in it.",
  },
  "berlok.dij_sor": {
    hu: "{osszeg} / hó · a hónap {nap}. napjára",
    en: "{osszeg} / month · due on day {nap} of the month",
  },
  "berlok.egy_berlo": { hu: "egy bérlő", en: "one tenant" },
  "berlok.tobb_berlo": {
    hu: "{darab} bérlő, egyetemleges felelősséggel",
    en: "{darab} tenants, jointly and severally liable",
  },
  "berlok.van_fiok": { hu: "Van fiókja", en: "Has an account" },
  "berlok.nincs_fiok": { hu: "Még nincs fiókja", en: "No account yet" },
  "berlok.belepett": {
    hu: "Belépett fiókkal használja az oldalt: {email}",
    en: "Uses the app with an account: {email}",
  },
  "berlok.elo_meghivo": {
    hu:
      "Él egy meghívó {email} címre, {nap}-ig. Ha újat készítesz, a régi link azonnal érvénytelen " +
      "lesz.",
    en:
      "An invitation to {email} is live until {nap}. If you create a new one, the old link stops " +
      "working immediately.",
  },
  "berlok.meghivo": { hu: "Meghívó készítése", en: "Create an invitation" },
  "berlok.uj_meghivo": {
    hu: "Új meghívó készítése",
    en: "Create a new invitation",
  },
  "berlok.meghivo_email": {
    hu: "A bérlő e-mail-címe",
    en: "The tenant's email address",
  },
  "berlok.meghivo_folyamatban": { hu: "Készítem…", en: "Creating…" },
  "berlok.adatok_cim": {
    hu: "Szerződéshez szükséges adatok",
    en: "Details needed for the contract",
  },
  "berlok.adatok_hianyzik": {
    hu: "még {darab} hiányzik",
    en: "{darab} still missing",
  },
  "berlok.adatok_megvan": { hu: "megvannak", en: "all filled in" },
  "berlok.adatok_forras_berlo": {
    hu: "Ezeket a bérlő adta meg magáról.",
    en: "The tenant entered these about themselves.",
  },
  "berlok.adatok_forras_berbeado": {
    hu: "Ezeket te írtad be. Ha a bérlő belép, felülírhatja a sajátjával.",
    en: "You entered these. Once the tenant signs in, they can replace them with their own.",
  },
  "berlok.adatok_forras_nincs": {
    hu: "Még senki nem adta meg. A bérlő belépés után maga is kitöltheti.",
    en: "Nobody has entered these yet. The tenant can fill them in after signing in.",
  },
  "berlok.adatok_gomb": { hu: "Adatok mentése", en: "Save details" },
  "berlok.adatok_folyamatban": { hu: "Mentem…", en: "Saving…" },
  "berlok.hozzaadas": {
    hu: "További bérlő hozzáadása",
    en: "Add another tenant",
  },
  "berlok.hozzaadas_gomb": { hu: "Hozzáadás", en: "Add" },
  "berlok.hozzaadas_folyamatban": { hu: "Hozzáadom…", en: "Adding…" },
  "berlok.torles": {
    hu: "{nev} levétele a jogviszonyról",
    en: "Remove {nev} from this tenancy",
  },
  "berlok.torles_folyamatban": { hu: "Leveszem…", en: "Removing…" },

  // --- Az alkalmazás maga
  "alkalmazas.leiras": {
    hu: "Bérbeadás egy helyen: befizetés, rezsi, elszámolás.",
    en: "Renting out a flat in one place: payments, utilities, settlement.",
  },

  // --- Ingatlanok
  "ingatlanok.cim": { hu: "Ingatlanok", en: "Properties" },
  "ingatlanok.nincs": {
    hu: "Még nincs felvett bérlemény. Kezdd ezzel: minden más ebből indul ki.",
    en: "No property yet. Start here: everything else follows from it.",
  },
  "ingatlanok.alapterulet": { hu: "Alapterület", en: "Floor area" },
  "ingatlanok.kozos_koltseg": { hu: "Közös költség", en: "Service charge" },
  "ingatlanok.meroora": { hu: "Mérőóra", en: "Meters" },
  "ingatlanok.jogviszony": { hu: "Jogviszony", en: "Tenancies" },

  // --- Hibák (bérbeadói oldal)
  "hibak.cim": { hu: "Hibák", en: "Repairs" },
  "hibak.bevezeto": {
    hu:
      "A bérlő bejelentése, a válaszod és az elhárítás egy helyen. A költségviselőre javaslatot " +
      "teszek a szerződés karbantartási pontja alapján, de a döntés a tiéd. A lezárást a bérlő " +
      "erősíti meg, hogy utólag ne legyen vita arról, rendben volt-e.",
    en:
      "The tenant's report, your reply and the repair in one place. I suggest who should bear the " +
      "cost, based on the maintenance clause of the contract, but the decision is yours. The " +
      "tenant confirms the fix, so there is no argument later about whether it was put right.",
  },
  "hibak.nyitottak": { hu: "Nyitott bejelentések", en: "Open reports" },
  "hibak.nyitottak_darab": {
    hu: "Nyitott bejelentések ({darab})",
    en: "Open reports ({darab})",
  },
  "hibak.nincs_nyitott": {
    hu: "Nincs nyitott hibabejelentés.",
    en: "No open fault reports.",
  },
  "hibak.lezartak": {
    hu: "Lezárt bejelentések ({darab})",
    en: "Closed reports ({darab})",
  },
  "hibak.sajat_cim": {
    hu: "Magam jelentek be egy hibát",
    en: "Report a fault myself",
  },
  "hibak.sajat_sugo": {
    hu:
      "Ha te veszed észre a hibát, ide is felveheted: így a bérlő is látja, és ugyanaz a nyoma " +
      "marad, mintha ő jelentette volna.",
    en:
      "If you spot the fault, add it here too: the tenant sees it as well, and it leaves the same " +
      "trail as if they had reported it.",
  },

  // --- Meghívó elfogadása
  "meghivo.email_sugo": {
    hu: "Erre a címre szól a meghívó, ezért nem írható át.",
    en: "The invitation is addressed here, so it cannot be changed.",
  },
  "meghivo.megleve_fiok_sugo": {
    hu:
      "Ha ezzel az e-mail-címmel már van fiókod, a meglévő jelszavadat írd be: második fiók nem " +
      "készül, és a meghívó a jelszavadat nem írja felül.",
    en:
      "If you already have an account with this email address, enter your existing password: no " +
      "second account is created, and the invitation never overwrites it.",
  },
  "meghivo.nev": { hu: "Neved", en: "Your name" },
  "meghivo.jelszo_ujra": { hu: "Jelszó még egyszer", en: "Password again" },
  "meghivo.gomb": { hu: "Fiók készítése", en: "Create account" },
  "meghivo.folyamatban": { hu: "Fiók készítése…", en: "Creating account…" },

  // --- Beállítások
  "beallitasok.cim": { hu: "Beállítások", en: "Settings" },
  "beallitasok.bevezeto": {
    hu:
      "Ami itt változik, az a befizetések párosítására hat: a rendszer azonnal újraszámolja az " +
      "állapotokat és a teendőket.",
    en:
      "What you change here affects how payments are matched: the states and the tasks are " +
      "recalculated straight away.",
  },
  "beallitasok.ablak_cim": { hu: "Párosítási időablak", en: "Matching window" },
  "beallitasok.ablak_sugo": {
    hu:
      "Ennyi napon belül kötöm ugyanahhoz a havi előíráshoz a beérkezett befizetést. Ami az " +
      "ablakon kívül érkezik, külön tételként jelenik meg.",
    en:
      "A payment that arrives within this many days is tied to the same monthly charge. Anything " +
      "outside the window shows up as a separate item.",
  },
  "beallitasok.ablak_elotte": {
    hu: "Esedékesség előtt (nap)",
    en: "Before the due date (days)",
  },
  "beallitasok.ablak_utana": {
    hu: "Esedékesség után (nap)",
    en: "After the due date (days)",
  },
  "beallitasok.bizonylat_cim": {
    hu: "Bizonylat vitás befizetésnél",
    en: "Receipt for a disputed payment",
  },
  "beallitasok.bizonylat_sugo": {
    hu:
      "Ha a te adatod és a bérlőé nem fedi egymást, kérhetjük mindkettőtöktől annak az egy " +
      "utalásnak a bizonylatát: tőled a fogadó oldalit, a bérlőtől a küldő oldalit. Teljes " +
      "bankszámlakivonatot soha nem kérünk, és nem is fogadunk el. Ha ezt nem szeretnéd, kapcsold " +
      "ki: a vita attól még látszik, csak papírt nem kérünk hozzá. A már feltöltött bizonylatok a " +
      "kikapcsolástól nem tűnnek el.",
    en:
      "When your record and the tenant's do not match, we can ask both of you for the receipt of " +
      "that one transfer: the receiving side from you, the sending side from the tenant. We never " +
      "ask for, and never accept, a full bank statement. If you would rather not ask, switch it " +
      "off: the dispute is still visible, we simply ask for no paperwork. Receipts already " +
      "uploaded do not disappear when you switch it off.",
  },
  "beallitasok.bizonylat_kapcsolo": {
    hu: "Kérjünk bizonylatot vitás tételnél",
    en: "Ask for a receipt on a disputed item",
  },
  "beallitasok.gomb": { hu: "Mentés", en: "Save" },
  "beallitasok.folyamatban": { hu: "Mentés…", en: "Saving…" },
  "beallitasok.adatok_cim": {
    hu: "A te adataid a szerződéshez",
    en: "Your details for the contract",
  },
  "beallitasok.adatok_sugo": {
    hu:
      "Ezek a szerződésbe és az igazolásokba kerülnek. A belépéshez egyik sem kell, és naplóba sem " +
      "írjuk őket. A telefonszámodat a bérlő a hibabejelentésnél látja: veszélyhelyzetben az " +
      "alkalmazás nem csörög.",
    en:
      "These go into the contract and the certificates. None of them is needed to sign in, and " +
      "none is written to a log. The tenant sees your phone number when reporting a fault: in an " +
      "emergency the app does not ring anyone.",
  },
  "beallitasok.mezo.adoazonosito": {
    hu: "Adóazonosító jel",
    en: "Tax identification number",
  },
  "beallitasok.mezo.bank": { hu: "Bank neve", en: "Name of the bank" },
  "beallitasok.adatok_gomb": { hu: "Mentés", en: "Save" },
  "beallitasok.adatok_folyamatban": { hu: "Mentem…", en: "Saving…" },
  "beallitasok.tolerancia_cim": {
    hu: "Összegeltérés",
    en: "Difference in amount",
  },
  "beallitasok.tolerancia_sugo": {
    hu:
      "Az elfogadott eltérés nulla forint, és ez nem állítható. Bármekkora különbség az előírt és " +
      "a beérkezett összeg között „eltér” állapotot kap, vagyis egyeztetés indul róla. Így " +
      "egyetlen hiányzó forint sem tűnik el csendben.",
    en:
      "The accepted difference is zero forints, and that cannot be changed. Any gap between the " +
      "amount charged and the amount received is marked as a difference, so it gets reconciled. " +
      "That way not a single missing forint disappears quietly.",
  },

  // --- Dokumentumok lap
  "dokumentum.veglegesitve_nap": {
    hu: "véglegesítve {nap}",
    en: "finalised {nap}",
  },
  "dokumentum.kiallitva_nap": { hu: "kiállítva {nap}", en: "issued {nap}" },
  "jegyzokonyv.fajta.birtokbaadas": { hu: "Birtokbaadás", en: "Handover" },
  "jegyzokonyv.fajta.visszaadas": { hu: "Visszaadás", en: "Move-out" },
  "dokumentumok.cim": { hu: "Dokumentumok", en: "Documents" },
  "dokumentumok.bevezeto": {
    hu: "Szerződés, jegyzőkönyv és igazolás egy helyen. A kiadott okiratok magyarul készülnek, mert magyarul érvényesek.",
    en: "Contracts, handover records and certificates in one place. Issued documents are drawn up in Hungarian, because that is the language in which they are valid.",
  },
  "dokumentumok.tar_cim": { hu: "Dokumentumtár", en: "Document library" },
  "dokumentumok.tar_ures": {
    hu: "Még nincs egyetlen dokumentum sem.",
    en: "There are no documents yet.",
  },
  "dokumentumok.nincs_berlo": {
    hu: "Nincs bérlő rögzítve",
    en: "No tenant recorded",
  },
  "dokumentumok.szerzodes_cim": {
    hu: "Bérleti szerződés",
    en: "Lease agreement",
  },
  "dokumentumok.nincs_szerzodes": {
    hu: "Ehhez a jogviszonyhoz még nem készült szerződés.",
    en: "No contract has been drawn up for this tenancy yet.",
  },
  "dokumentumok.uj_szerzodes": {
    hu: "Új szerződéstervezet",
    en: "New draft contract",
  },
  "dokumentumok.keszitem": { hu: "Készítem…", en: "Creating…" },
  "dokumentumok.jegyzokonyv_cim": {
    hu: "Átadás-átvételi jegyzőkönyv",
    en: "Handover record",
  },
  "dokumentumok.jegyzokonyv_sugo": {
    hu: "A véglegesített jegyzőkönyv óraállásai bekerülnek a mérőórák történetébe, és a birtokbaadás állása lesz az első rezsielszámolás kiindulópontja.",
    en: "Meter readings from a finalised record are added to the meters' history, so the handover reading becomes the starting point of the first utility statement.",
  },
  "dokumentumok.igazolas_cim": {
    hu: "Bérbeadói igazolás",
    en: "Landlord's certificate",
  },
  "dokumentumok.igazolas_sugo": {
    hu: "Az összeget és a teljesítés napját a beazonosított befizetésből vesszük. Amelyik hónapra nincs igazolt beérkezés, arra nem ajánlunk igazolást.",
    en: "The amount and the payment date come from the matched payment. We do not offer a certificate for a month with no confirmed receipt.",
  },
  "dokumentumok.igazolas_nincs": {
    hu: "{nev} részére még nincs olyan hónap, amire igazolást adhatnánk: ehhez a bérbeadónak igazolt beérkezés kell.",
    en: "There is no month yet for which a certificate could be issued to {nev}: that needs a receipt confirmed by the landlord.",
  },
  "dokumentumok.igazolas_idoszak": { hu: "Időszak", en: "Period" },
  "dokumentumok.igazolas_osszeg": {
    hu: "Igazolt összeg (Ft)",
    en: "Amount certified (HUF)",
  },
  "dokumentumok.igazolas_osszeg_pelda": {
    hu: "az időszak összege",
    en: "the period's amount",
  },
  "dokumentumok.igazolas_osszeg_sugo": {
    hu: "Üresen hagyva az időszakra beazonosított összeg kerül bele. Ennél többet nem igazolunk.",
    en: "Left empty, the amount matched for the period is used. We never certify more than that.",
  },
  "dokumentumok.igazolas_cel": { hu: "Mire kéri", en: "Purpose" },
  "dokumentumok.igazolas_mod": {
    hu: "Teljesítés módja",
    en: "Method of payment",
  },
  "dokumentumok.igazolas_mod_atutalas": { hu: "Átutalás", en: "Bank transfer" },
  "dokumentumok.igazolas_mod_keszpenz": { hu: "Készpénz", en: "Cash" },
  "dokumentumok.igazolas_mod_egyeb": { hu: "Egyéb", en: "Other" },
  "dokumentumok.igazolas_hely": { hu: "Kiállítás helye", en: "Place of issue" },
  "dokumentumok.igazolas_gomb": {
    hu: "Igazolás {nev} részére",
    en: "Certificate for {nev}",
  },
  "dokumentumok.igazolas_folyamatban": { hu: "Kiállítom…", en: "Issuing…" },

  // --- Hiányzó adatok a szerződéshez
  "hiany.berbeado.lakcim": {
    hu: "A bérbeadó lakcíme hiányzik.",
    en: "The landlord's address is missing.",
  },
  "hiany.berbeado.szuletes": {
    hu: "A bérbeadó születési helye vagy ideje hiányzik.",
    en: "The landlord's place or date of birth is missing.",
  },
  "hiany.berbeado.anyjaNeve": {
    hu: "A bérbeadó anyja neve hiányzik.",
    en: "The landlord's mother's name is missing.",
  },
  "hiany.berbeado.igazolvanySzam": {
    hu: "A bérbeadó igazolványszáma hiányzik.",
    en: "The landlord's ID number is missing.",
  },
  "hiany.berbeado.bankszamla": {
    hu: "A bérbeadó bankszámlaszáma hiányzik, enélkül nincs hová utalni.",
    en: "The landlord's bank account number is missing, so there is nowhere to transfer to.",
  },
  "hiany.berlo": {
    hu: "{nev}: {mezo} hiányzik.",
    en: "{nev}: {mezo} is missing.",
  },
  "hiany.ingatlan.helyrajziSzam": {
    hu: "Az ingatlan helyrajzi száma hiányzik, enélkül a bérlemény azonosítása hiányos.",
    en: "The property's land registry number is missing, so the property is not fully identified.",
  },
  "hiany.ingatlan.energetikai": {
    hu: "Az energetikai tanúsítvány azonosítója hiányzik; átadása jogszabályi kötelezettség.",
    en: "The energy certificate identifier is missing; handing it over is a legal obligation.",
  },
  "hiany.nincs_berlo": {
    hu: "A jogviszonyhoz nincs bérlő rögzítve.",
    en: "No tenant is recorded for this tenancy.",
  },

  // --- Szerződés szerkesztő lap
  "szerzodes.vissza": { hu: "← Dokumentumok", en: "← Documents" },
  "szerzodes.tervezet_sugo": {
    hu: "Tervezet. A szöveg minden mentés után újraépül a modulokból.",
    en: "Draft. The text is rebuilt from the modules after every save.",
  },
  "szerzodes.vegleges_sugo": {
    hu: "Véglegesítve. A szöveg be van fagyasztva, egy későbbi modulfrissítés sem írja át.",
    en: "Finalised. The text is frozen; a later module update will not rewrite it.",
  },
  "szerzodes.ellenjegyzes_figyelmeztetes": {
    hu: "A modulok ügyvédi ellenjegyzése még nincs meg, ezért ez egyelőre tervezet: használat előtt nézesd át ügyvéddel. Az ellenjegyzett modulok megjelölve fognak megjelenni.",
    en: "The modules have not yet been countersigned by a lawyer, so this is a draft for now: have a lawyer review it before use. Countersigned modules will be marked as such.",
  },
  "szerzodes.magyar_szoveg": {
    hu: "A szerződés szövege és a modulok magyarul állnak, mert a szerződés magyarul érvényes: a fordítás nem az, amit a felek aláírnak.",
    en: "The contract text and the modules stay in Hungarian, because that is the language in which the contract is valid: a translation is not what the parties sign.",
  },
  "szerzodes.azonossag_cim": {
    hu: "Szerződés előtt: igazoljátok a személyazonosságot",
    en: "Before signing: verify each other's identity",
  },
  "szerzodes.azonossag_sugo": {
    hu: "Az alkalmazás nem ellenőrzi, hogy ki kicsoda: amit a felek megadtak, az a saját állításuk. Aláírás előtt nézzétek meg egymás fényképes igazolványát személyesen, és vessétek össze a szerződésben álló adatokkal.",
    en: "The app does not check who anyone is: what the parties entered is their own statement. Before signing, look at each other's photo ID in person and compare it with the details in the contract.",
  },
  "szerzodes.hianyok_cim": { hu: "Ezek még hiányoznak", en: "Still missing" },
  "szerzodes.hianyok_hol": {
    hu: "A bérlők adatai a Bérlők lapon, a tieid a Beállítások lapon tölthetők ki:",
    en: "The tenants' details go on the Tenants page, yours on the Settings page:",
  },
  "szerzodes.dontes_cim": {
    hu: "Amiről dönteni kell",
    en: "What you need to decide",
  },
  "szerzodes.dontes_sugo": {
    hu: "Minden modul mellett ott van, miért van rá szükség: nem vagy jogász, és amit nem értesz, azt nem tudod eldönteni.",
    en: "Every module says why it is needed: you are not a lawyer, and you cannot decide about something you do not understand.",
  },
  "szerzodes.kotelezoek_nyito": {
    hu: "Minden szerződésben benne van · {db} pont",
    en: "In every contract · {db} clauses",
  },
  "szerzodes.beallitasok_cim": { hu: "Beállítások", en: "Settings" },
  "szerzodes.beallitasok_sugo": {
    hu: "Csak azt kérdezzük, ami a bekapcsolt modulokhoz kell. Ami üresen marad, az az alapértelmezéssel kerül a szövegbe.",
    en: "We only ask what the modules you switched on need. Anything left empty goes into the text with its default.",
  },
  "szerzodes.szoveg_nyito": {
    hu: "A szerződés szövege · {db} szakasz",
    en: "The contract text · {db} sections",
  },
  "szerzodes.letoltes": { hu: "Letöltés szövegként", en: "Download as text" },
  "szerzodes.letoltes_angolul": {
    hu: "Angol fordítás letöltése",
    en: "Download the English translation",
  },
  "szerzodes.forditas_cim": { hu: "Angol fordítás", en: "English translation" },
  "szerzodes.forditas_sugo": {
    hu:
      "Tájékoztató fordítás a külföldi bérlőnek. Aláírni a magyar szöveget kell, " +
      "és eltérés esetén is a magyar az irányadó — ezt a fordítás maga is kimondja, " +
      "nem csak ez a lap. Véglegesítéskor a fordítás is befagy a magyar mellé.",
    en:
      "An informative translation for a tenant who does not read Hungarian. The Hungarian " +
      "text is the one that gets signed, and it prevails in case of any difference — the " +
      "translation itself says so, not just this page. On finalisation the translation is " +
      "frozen alongside the Hungarian text.",
  },
  "szerzodes.forditas_nincs_meg": {
    hu:
      "Ez a szerződés még az angol fordítás előtt lett véglegesítve, ezért nincs hozzá " +
      "befagyasztott fordítás. Újat nem készítünk: az már nem ahhoz a szöveghez készülne.",
    en:
      "This contract was finalised before the English translation existed, so there is no " +
      "frozen translation for it. We do not generate a new one: it would no longer belong " +
      "to that text.",
  },

  // --- Szerződés űrlapok
  "szerzodes.kotelezo_jelzes": { hu: "kötelező", en: "mandatory" },
  "szerzodes.benne_van": { hu: "Benne van", en: "Included" },
  "szerzodes.nincs_benne": { hu: "Nincs benne", en: "Not included" },
  "szerzodes.benne_van_jelzes": { hu: "benne van", en: "included" },
  "szerzodes.nincs_benne_jelzes": { hu: "nincs benne", en: "not included" },
  "szerzodes.ellenjegyzes.nincs": {
    hu: "Ügyvédi ellenjegyzés még nincs",
    en: "Not yet countersigned by a lawyer",
  },
  "szerzodes.ellenjegyzes.folyamatban": {
    hu: "Ellenjegyzés folyamatban",
    en: "Countersigning in progress",
  },
  "szerzodes.ellenjegyzes.ellenjegyzett": {
    hu: "Ügyvéd által ellenjegyzett",
    en: "Countersigned by a lawyer",
  },
  "szerzodes.kelt_helye": { hu: "Kelt helye", en: "Place of signing" },
  "szerzodes.kelt_napja": { hu: "Kelt napja", en: "Date of signing" },
  "szerzodes.mentem": { hu: "Mentem…", en: "Saving…" },
  "szerzodes.mentes": {
    hu: "Mentés és szöveg frissítése",
    en: "Save and rebuild the text",
  },
  "szerzodes.nyugtazas": {
    hu: "Megnéztük egymás fényképes igazolványát, és az abban álló adatok egyeznek azzal, ami a szerződésben szerepel.",
    en: "We have looked at each other's photo ID and the details in it match what the contract says.",
  },
  "szerzodes.veglegesitem": { hu: "Véglegesítem…", en: "Finalising…" },
  "szerzodes.veglegesites_megis": {
    hu: "Véglegesítés a hiányzó adatok nélkül",
    en: "Finalise without the missing details",
  },
  "szerzodes.veglegesites": { hu: "Véglegesítés", en: "Finalise" },
  "szerzodes.visszaallitom": { hu: "Visszaállítom…", en: "Reverting…" },
  "szerzodes.zaradek_megnevezes": {
    hu: "Záradék · {ingatlan}",
    en: "Amendment · {ingatlan}",
  },
  "szerzodes.zaradek_alapja": {
    hu: "Ez a záradék a következő szerződést egészíti ki: {nev}. A szerződés többi pontja változatlanul hatályban marad.",
    en: "This amendment supplements the contract “{nev}”. The rest of the contract stays in force unchanged.",
  },
  "szerzodes.zaradek_sugo": {
    hu: "Ez egy záradék: a hatályos szerződést egészíti ki, annak többi pontja változatlanul hatályban marad.",
    en: "This is an amendment: it supplements the contract in force, whose other clauses stay unchanged.",
  },
  "szerzodes.zaradek_miert": {
    hu: "Ha a hatályos szerződés utóbb kiegészül, azt nem írjuk át: az aláírt szöveg marad, a kiegészítés pedig külön okiratba, záradékba kerül.",
    en: "If the contract in force is supplemented later, we do not rewrite it: the signed text stays, and the addition goes into a separate amendment.",
  },
  "szerzodes.zaradek_gomb": {
    hu: "Záradék készítése",
    en: "Create an amendment",
  },
  "szerzodes.zaradekot_keszitek": { hu: "Készítem…", en: "Creating…" },
  "szerzodes.hiba.zaradek_csak_veglegeshez": {
    hu: "Záradékot csak véglegesített szerződéshez lehet készíteni; a tervezet még szerkeszthető.",
    en: "An amendment can only supplement a finalised contract; a draft can still be edited.",
  },
  "szerzodes.vissza_tervezetre": {
    hu: "Vissza tervezetre",
    en: "Back to draft",
  },

  // --- Szerződés műveletek üzenetei
  "szerzodes.hiba.jogviszony_nem_tied": {
    hu: "Ez a jogviszony nem a tiéd.",
    en: "This tenancy is not yours.",
  },
  "szerzodes.hiba.nincs_berlo": {
    hu: "Előbb vedd fel a bérlőt a jogviszonyhoz, különben nincs kivel szerződni.",
    en: "Add the tenant to the tenancy first, otherwise there is nobody to contract with.",
  },
  "szerzodes.hiba.nincs_modul": {
    hu: "Nincs ilyen modul.",
    en: "No such module.",
  },
  "szerzodes.hiba.kotelezo_modul": {
    hu: "Ez a modul kötelező, nem kapcsolható ki.",
    en: "This module is mandatory and cannot be switched off.",
  },
  "szerzodes.hiba.nem_tied": {
    hu: "Ez a szerződés nem a tiéd.",
    en: "This contract is not yours.",
  },
  "szerzodes.hiba.vegleges_nem_valtozik": {
    hu: "A véglegesített szerződés szövege nem változtatható.",
    en: "The text of a finalised contract cannot be changed.",
  },
  "szerzodes.hiba.mar_vegleges": {
    hu: "Ez a szerződés már véglegesített.",
    en: "This contract has already been finalised.",
  },
  "szerzodes.hiba.nyugtazas": {
    hu: "Előbb nyugtázd, hogy megnéztétek egymás fényképes igazolványát.",
    en: "First confirm that you have looked at each other's photo ID.",
  },
  "szerzodes.hiba.hianyok": {
    hu: "Hiányzó adatok. Pótold őket, vagy véglegesítsd így.",
    en: "Details are missing. Fill them in, or finalise as is.",
  },
  "szerzodes.kesz.modul_be": {
    hu: "„{cim}” bekapcsolva.",
    en: "\u201C{cim}\u201D switched on.",
  },
  "szerzodes.kesz.modul_ki": {
    hu: "„{cim}” kikapcsolva.",
    en: "\u201C{cim}\u201D switched off.",
  },
  "szerzodes.kesz.parameterek": {
    hu: "A beállítások mentve, a szöveg frissült.",
    en: "Settings saved, the text has been rebuilt.",
  },
  "szerzodes.kesz.veglegesitve": {
    hu: "A szerződés véglegesítve. A szövege innentől nem változik.",
    en: "The contract is finalised. Its text will not change from now on.",
  },
  "szerzodes.kesz.visszaallt": {
    hu: "Visszaállt tervezetre, újra szerkeszthető.",
    en: "Back to draft, editable again.",
  },

  // --- Jegyzőkönyv lap
  "hiany.jegyzokonyv.nincs_meroora": {
    hu: "Nincs egyetlen mérőóraállás sem. Enélkül az első elszámolásnak nincs kiindulópontja.",
    en: "There is not a single meter reading. Without one the first statement has no starting point.",
  },
  "hiany.jegyzokonyv.oraallas": {
    hu: "{megnevezes}: nincs kitöltve az óraállás.",
    en: "{megnevezes}: the meter reading is empty.",
  },
  "hiany.jegyzokonyv.nincs_kulcs": {
    hu: "Nincs rögzítve, hány kulcs került át. Visszaadáskor ez lesz a hivatkozási alap.",
    en: "How many keys were handed over is not recorded. This is the reference at move-out.",
  },
  "hiany.jegyzokonyv.allapot": {
    hu: "A bérlemény állapotának leírása üres.",
    en: "The description of the property's condition is empty.",
  },
  "jegyzokonyv.tervezet_sugo": {
    hu: "Tervezet. Töltsd ki a helyszínen, aztán véglegesítsd.",
    en: "Draft. Fill it in on site, then finalise it.",
  },
  "jegyzokonyv.vegleges_sugo": {
    hu: "Véglegesítve. A szöveg be van fagyasztva.",
    en: "Finalised. The text is frozen.",
  },
  "jegyzokonyv.magyar_szoveg": {
    hu: "A jegyzőkönyv szövege magyarul készül, mert magyarul érvényes.",
    en: "The record itself is drawn up in Hungarian, because that is the language in which it is valid.",
  },
  "jegyzokonyv.oraallas_bekerult": {
    hu: "{db} óraállás bekerült a mérőórák történetébe, így az elszámolás innen indul.",
    en: "{db} meter readings were added to the meters' history, so the statement starts from here.",
  },
  "jegyzokonyv.nincs_oraallas": {
    hu: "Óraállás nem került rögzítésre.",
    en: "No meter reading was recorded.",
  },
  "jegyzokonyv.vallalasok": {
    hu: "{db} vállalásból teendő lett, az áttekintőn látod őket.",
    en: "{db} promises became tasks; you can see them on the overview.",
  },
  "jegyzokonyv.hianyok_cim": { hu: "Ezek még hiányoznak", en: "Still missing" },
  "jegyzokonyv.szoveg_cim": {
    hu: "A jegyzőkönyv szövege",
    en: "The text of the record",
  },
  "jegyzokonyv.letoltes": { hu: "Letöltés szövegként", en: "Download as text" },
  "jegyzokonyv.uj_tetel_cim": { hu: "Új tétel", en: "New item" },

  // --- Jegyzőkönyv űrlapok
  "jegyzokonyv.tetel.meroora": { hu: "Mérőórák", en: "Meters" },
  "jegyzokonyv.tetel.kulcs": {
    hu: "Kulcsok és hozzáférési eszközök",
    en: "Keys and access devices",
  },
  "jegyzokonyv.tetel.hiba": {
    hu: "Hibák és hiányosságok",
    en: "Faults and shortcomings",
  },
  "jegyzokonyv.tetel.dokumentum": {
    hu: "Átadott dokumentumok",
    en: "Documents handed over",
  },
  "jegyzokonyv.ertek_sugo.meroora": {
    hu: "óraállás, mértékegységgel",
    en: "meter reading, with its unit",
  },
  "jegyzokonyv.ertek_sugo.kulcs": { hu: "darabszám", en: "number of items" },
  "jegyzokonyv.idopont": {
    hu: "Az átadás-átvétel időpontja",
    en: "Date and time of the handover",
  },
  "jegyzokonyv.megnevezes": { hu: "Megnevezés", en: "Name" },
  "jegyzokonyv.ertek": { hu: "Érték", en: "Value" },
  "jegyzokonyv.megjegyzes": { hu: "Megjegyzés", en: "Note" },
  "jegyzokonyv.megjegyzes_sugo": { hu: "megjegyzés", en: "note" },
  "jegyzokonyv.ki_rendezi": { hu: "Ki rendezi", en: "Who will fix it" },
  "jegyzokonyv.nincs_vallalas": {
    hu: "nincs vállalás",
    en: "nobody has promised",
  },
  "jegyzokonyv.felelos_berbeado": { hu: "a bérbeadó", en: "the landlord" },
  "jegyzokonyv.felelos_berlo": { hu: "a bérlő", en: "the tenant" },
  "jegyzokonyv.mikorra": { hu: "Mikorra", en: "By when" },
  "jegyzokonyv.allapot_leiras": {
    hu: "A bérlemény állapota",
    en: "Condition of the property",
  },
  "jegyzokonyv.egyeb_megjegyzes": { hu: "Egyéb megjegyzés", en: "Other notes" },
  "jegyzokonyv.mentem": { hu: "Mentem…", en: "Saving…" },
  "jegyzokonyv.mentes": { hu: "Mentés", en: "Save" },
  "jegyzokonyv.tetel_fajtaja": { hu: "Tétel fajtája", en: "Type of item" },
  "jegyzokonyv.fajta_hiba": {
    hu: "hiba vagy hiányosság",
    en: "fault or shortcoming",
  },
  "jegyzokonyv.fajta_meroora": { hu: "mérőóra", en: "meter" },
  "jegyzokonyv.fajta_kulcs": { hu: "kulcs", en: "key" },
  "jegyzokonyv.fajta_dokumentum": {
    hu: "átadott dokumentum",
    en: "document handed over",
  },
  "jegyzokonyv.mit_rogzitesz": {
    hu: "mit rögzítesz",
    en: "what you are recording",
  },
  "jegyzokonyv.ertek_ha_van": { hu: "érték, ha van", en: "value, if any" },
  "jegyzokonyv.hozzaadom": { hu: "Hozzáadom…", en: "Adding…" },
  "jegyzokonyv.hozzaadas": { hu: "Hozzáadás", en: "Add" },
  "jegyzokonyv.veglegesitem": { hu: "Véglegesítem…", en: "Finalising…" },
  "jegyzokonyv.veglegesites_megis": {
    hu: "Véglegesítés a hiányzó adatok nélkül",
    en: "Finalise without the missing details",
  },
  "jegyzokonyv.veglegesites": { hu: "Véglegesítés", en: "Finalise" },
  "jegyzokonyv.veglegesites_sugo": {
    hu: "Véglegesítéskor a szöveg befagy, a rögzített óraállások bekerülnek a mérőórák történetébe, a vállalt javításokból pedig teendő lesz.",
    en: "On finalising, the text is frozen, the recorded meter readings are added to the meters' history, and the repairs promised become tasks.",
  },

  // --- Dokumentum műveletek üzenetei
  "dokumentumok.hiba.jogviszony_nem_tied": {
    hu: "Ez a jogviszony nem a tiéd.",
    en: "This tenancy is not yours.",
  },
  "dokumentumok.hiba.nincs_berlo": {
    hu: "Előbb vedd fel a bérlőt, különben nincs kivel jegyzőkönyvet felvenni.",
    en: "Add the tenant first, otherwise there is nobody to record the handover with.",
  },
  "jegyzokonyv.hiba.nem_tied": {
    hu: "Ez a jegyzőkönyv nem a tiéd.",
    en: "This record is not yours.",
  },
  "jegyzokonyv.hiba.vegleges": {
    hu: "A véglegesített jegyzőkönyv nem módosítható.",
    en: "A finalised record cannot be changed.",
  },
  "jegyzokonyv.hiba.mar_vegleges": {
    hu: "Ez a jegyzőkönyv már véglegesített.",
    en: "This record has already been finalised.",
  },
  "jegyzokonyv.hiba.idopont": {
    hu: "Adj meg egy érvényes időpontot.",
    en: "Enter a valid date and time.",
  },
  "jegyzokonyv.hiba.tetelfajta": {
    hu: "Ismeretlen tételfajta.",
    en: "Unknown type of item.",
  },
  "jegyzokonyv.hiba.megnevezes": {
    hu: "Add meg, mit rögzítesz.",
    en: "Say what you are recording.",
  },
  "jegyzokonyv.hiba.hianyok": {
    hu: "Hiányzó adatok. Pótold őket, vagy véglegesítsd így.",
    en: "Details are missing. Fill them in, or finalise as is.",
  },
  "jegyzokonyv.hiba.olvashatatlan": {
    hu: "{nev}: az óraállásból nem tudtam számot kiolvasni, ezért nem rögzítettem.",
    en: "{nev}: I could not read a number from the meter reading, so I did not record it.",
  },
  "jegyzokonyv.kesz.mentve": { hu: "Mentve.", en: "Saved." },
  "jegyzokonyv.kesz.tetel": {
    hu: "„{megnevezes}” hozzáadva.",
    en: "\u201C{megnevezes}\u201D added.",
  },
  "jegyzokonyv.kesz.veglegesitve": {
    hu: "A jegyzőkönyv véglegesítve.",
    en: "The record is finalised.",
  },
  "jegyzokonyv.kesz.oraallasok": {
    hu: "{db} óraállás bekerült a mérőórák történetébe.",
    en: "{db} meter readings were added to the meters' history.",
  },
  "jegyzokonyv.kesz.vallalasok": {
    hu: "{db} vállalásból teendő lett.",
    en: "{db} promises became tasks.",
  },
  "igazolas.hiba.nem_tied": {
    hu: "Ez a bérlő nem a te jogviszonyodhoz tartozik.",
    en: "This tenant does not belong to a tenancy of yours.",
  },
  "igazolas.hiba.cel": {
    hu: "Add meg, mihez kell az igazolás.",
    en: "Say what the certificate is needed for.",
  },
  "igazolas.hiba.nincs_befizetes": {
    hu: "Erre a hónapra nincs beazonosított befizetés, ezért nem állítok ki róla igazolást.",
    en: "There is no matched payment for this month, so I will not issue a certificate for it.",
  },
  "igazolas.hiba.tobb": {
    hu: "Erre a hónapra {osszeg} Ft érkezett; ennél többet nem igazolok.",
    en: "HUF {osszeg} arrived for this month; I will not certify more than that.",
  },
  "igazolas.kesz": {
    hu: "Kész az igazolás {nev} részére. Letöltheted és aláírhatod.",
    en: "The certificate for {nev} is ready. You can download and sign it.",
  },

  // --- Beállítás- és jelszó-ellenőrzés
  "beallitasok.hiba.nap_kell": {
    hu: "{mezo}: adj meg egy napszámot.",
    en: "{mezo}: enter a number of days.",
  },
  "beallitasok.hiba.egesz_nap": {
    hu: "{mezo}: csak egész napszám adható meg.",
    en: "{mezo}: only a whole number of days is allowed.",
  },
  "beallitasok.hiba.max_nap": {
    hu: "{mezo}: legfeljebb {max} nap adható meg.",
    en: "{mezo}: at most {max} days are allowed.",
  },
  "beallitasok.hiba.nem_mentve": {
    hu: "A beállítás nem mentve.",
    en: "The setting was not saved.",
  },
  "beallitasok.kesz.ablak": {
    hu: "Mentve. Mostantól az esedékesség előtt {elotte} és utána {utana} nappal érkezett befizetést kötöm ugyanahhoz az előíráshoz.",
    en: "Saved. From now on I match a payment arriving up to {elotte} days before and {utana} days after the due date to the same charge.",
  },
  "beallitasok.kesz.bizonylat_kerek": {
    hu: "Vitás tételnél bizonylatot kérek mindkét féltől.",
    en: "For a disputed item I ask both parties for a receipt.",
  },
  "beallitasok.kesz.bizonylat_nem": {
    hu: "Vitás tételnél nem kérek bizonylatot.",
    en: "For a disputed item I do not ask for a receipt.",
  },
  "beallitasok.kesz.adatok": {
    hu: "Az adataid mentve.",
    en: "Your details are saved.",
  },
  "jelszo.hiba.rovid": {
    hu: "A jelszó legyen legalább {min} karakter.",
    en: "The password must be at least {min} characters.",
  },
  "jelszo.hiba.csak_szokoz": {
    hu: "A jelszó nem állhat csak szóközökből.",
    en: "The password cannot be only spaces.",
  },
  "jelszo.hiba.nem_egyezik": {
    hu: "A két jelszó nem egyezik.",
    en: "The two passwords differ.",
  },

  // --- Belépés, meghívó, teendő
  "belepes.hiba.hianyos": {
    hu: "Add meg az e-mail-címet és a jelszót.",
    en: "Enter your email address and password.",
  },
  "belepes.hiba.rossz": {
    hu: "Nem stimmel az e-mail-cím vagy a jelszó.",
    en: "The email address or the password is wrong.",
  },
  "meghivo.hiba.ervenytelen": {
    hu: "Ez a meghívó már nem érvényes. Kérj újat a bérbeadódtól.",
    en: "This invitation is no longer valid. Ask your landlord for a new one.",
  },
  "meghivo.hiba.nev": { hu: "Add meg a neved.", en: "Enter your name." },
  "meghivo.hiba.nem_kesz": {
    hu: "A fiók nem készült el.",
    en: "The account was not created.",
  },
  "meghivo.hiba.megleve_jelszo": {
    hu:
      "A megadott jelszó nem jó. Ha ezzel az e-mail-címmel már van fiókod, a meglévő " +
      "jelszavadat írd be — a meghívó nem állít be újat.",
    en:
      "That password is not right. If you already have an account with this email address, enter " +
      "your existing password — the invitation does not set a new one.",
  },
  "teendo.hiba.lepj_be": { hu: "Lépj be.", en: "Please sign in." },
  "teendo.hiba.nem_tied": {
    hu: "Ez a teendő nem a tiéd.",
    en: "This task is not yours.",
  },
  "teendo.kesz.lezarva": { hu: "Lezárva.", en: "Closed." },
  "teendo.kesz.ujranyitva": { hu: "Újra nyitott.", en: "Reopened." },
  "teendo.kesz.felveve": { hu: "Felvéve.", en: "Task added." },
  "teendo.hiba.hianyos": { hu: "Hiányzó adat.", en: "Missing details." },
  "teendo.hiba.cim": {
    hu: "Írd le, mi a teendő.",
    en: "Say what needs doing.",
  },
  "teendo.hiba.esedekesseg": {
    hu: "Adj meg határidőt.",
    en: "Give a due date.",
  },
  "teendo.jegyzokonyvi_vallalas": {
    hu: "A jegyzőkönyvben {felelos} a rendezését.",
    en: "In the handover record, {felelos} to fix it.",
  },
  "teendo.vallalo.berbeado": { hu: "te vállaltad", en: "you undertook" },
  "teendo.vallalo.berlo": {
    hu: "a bérlő vállalta",
    en: "the tenant undertook",
  },

  // --- Bérlők műveletei
  "berlok.hiba.mar_van_fiok": {
    hu:
      "Ennek a bérlőnek már van fiókja, ezért nem készítek új meghívót. Ha " +
      "kicserélődött a bérlő, vedd le a régit a jogviszonyról, és add hozzá az újat.",
    en:
      "This tenant already has an account, so I will not create another invitation. If the " +
      "tenant has changed, remove the old one from the tenancy and add the new one.",
  },
  "berlok.hiba.nem_tied": {
    hu: "Ez a bérlő nem a te jogviszonyodhoz tartozik.",
    en: "This tenant does not belong to a tenancy of yours.",
  },
  "berlok.hiba.email": {
    hu: "Adj meg egy érvényes e-mail-címet.",
    en: "Enter a valid email address.",
  },
  "berlok.hiba.email_gyanus": {
    hu: "Az e-mail-cím nem tűnik érvényesnek.",
    en: "That email address does not look valid.",
  },
  "berlok.hiba.nev_kell": {
    hu: "Add meg a bérlő nevét.",
    en: "Enter the tenant's name.",
  },
  "berlok.hiba.nev_ures": {
    hu: "A név nem maradhat üresen.",
    en: "The name cannot be left empty.",
  },
  "berlok.hiba.jogviszony_nem_tied": {
    hu: "Ez a jogviszony nem a tiéd.",
    en: "This tenancy is not yours.",
  },
  "berlok.hiba.utolso_berlo": {
    hu: "Az utolsó bérlőt nem veszem le: jogviszony bérlő nélkül nem értelmes.",
    en: "I will not remove the last tenant: a tenancy without a tenant makes no sense.",
  },
  "berlok.kesz.meghivo": {
    hu: "Kész a meghívó {email} címre. Küldd el neki, és két hétig érvényes.",
    en: "The invitation for {email} is ready. Send it to them; it is valid for two weeks.",
  },
  "berlok.kesz.hozzaadva": {
    hu: "{nev} hozzáadva. A bérleti díj továbbra is egy előírás: a bérlők egyetemlegesen felelnek érte.",
    en: "{nev} added. The rent stays a single charge: the tenants are jointly and severally liable for it.",
  },
  "berlok.kesz.adatok": {
    hu: "Az adatok mentve.",
    en: "The details are saved.",
  },
  "berlok.kesz.torolve": {
    hu: "{nev} levéve a jogviszonyról.",
    en: "{nev} removed from the tenancy.",
  },

  // --- Adóműveletek
  "ado.hiba.datum": { hu: "Adj meg egy dátumot.", en: "Enter a date." },
  "ado.hiba.megnevezes": {
    hu: "Írd le, mi volt ez a költség.",
    en: "Describe what this cost was.",
  },
  "ado.hiba.osszeg": {
    hu: "Az összeg pozitív forint legyen.",
    en: "The amount must be a positive number of forints.",
  },
  "ado.hiba.ingatlan": {
    hu: "Ez az ingatlan nem a tiéd.",
    en: "This property is not yours.",
  },
  "ado.hiba.beszerzesi_ar": {
    hu: "A beszerzési ár pozitív forint legyen.",
    en: "The purchase price must be a positive number of forints.",
  },
  "ado.kesz.koltseg": {
    hu: "Rögzítve: {megnevezes}.",
    en: "Recorded: {megnevezes}.",
  },
  "ado.kesz.beszerzes": {
    hu: "Mentve. Az értékcsökkenés mostantól szerepel a tételes elszámolásban.",
    en: "Saved. Depreciation is now included in the itemised calculation.",
  },

  // --- Rezsi műveletei
  "rezsi.kihagyott.oraallas": {
    hu: "{nev}: az időszak elejéhez és végéhez is kell egy-egy óraállás.",
    en: "{nev}: a reading is needed both at the start and at the end of the period.",
  },
  "rezsi.kihagyott.dijszabas": {
    hu: "{nev}: nincs erre az időszakra érvényes díjszabás.",
    en: "{nev}: there is no tariff in force for this period.",
  },
  "rezsi.hiba.lepj_be": {
    hu: "Lépj be a rögzítéshez.",
    en: "Sign in to record a reading.",
  },
  "rezsi.hiba.datum": { hu: "Adj meg egy dátumot.", en: "Enter a date." },
  "rezsi.hiba.oraallas_negativ": {
    hu: "Az óraállás csak nem negatív szám lehet.",
    en: "A meter reading cannot be negative.",
  },
  "rezsi.hiba.meroora_nem_tied": {
    hu: "Ehhez a mérőórához nincs jogosultságod.",
    en: "You do not have access to this meter.",
  },
  "rezsi.hiba.kisebb_allas": {
    hu: "A legutóbbi állás {ertek} volt ({nap}). Ennél kisebb értéket nem rögzítek: nézd meg még egyszer a számokat.",
    en: "The last reading was {ertek} ({nap}). I will not record a lower value: check the figures again.",
  },
  "rezsi.hiba.idoszak": {
    hu: "Adj meg egy kezdő és egy záró napot.",
    en: "Enter a start and an end date.",
  },
  "rezsi.hiba.sorrend": {
    hu: "A záró nap legyen későbbi a kezdőnél.",
    en: "The end date must be later than the start date.",
  },
  "rezsi.hiba.jogviszony_nem_tied": {
    hu: "Ez a jogviszony nem a tiéd.",
    en: "This tenancy is not yours.",
  },
  "rezsi.hiba.nincs_tetel": {
    hu: "Ebből az időszakból nem jött ki egyetlen tétel sem.",
    en: "No item came out of this period.",
  },
  "rezsi.hiba.hatarido": {
    hu: "Adj meg egy fizetési határidőt.",
    en: "Enter a payment deadline.",
  },
  "rezsi.hiba.nem_kiadhato": {
    hu: "Ez az elszámolás nem adható ki.",
    en: "This statement cannot be issued.",
  },
  "rezsi.hiba.dontes": { hu: "Ismeretlen döntés.", en: "Unknown decision." },
  "rezsi.hiba.vita_uzenet": {
    hu: "Írd le, melyik tétellel van baj: ebből tud a bérbeadó javítani.",
    en: "Say which item is wrong: that is what lets the landlord fix it.",
  },
  "rezsi.hiba.elszamolas_nem_tied": {
    hu: "Ez az elszámolás nem a tiéd, vagy már lezárult.",
    en: "This statement is not yours, or it is already closed.",
  },
  "rezsi.kesz.oraallas": {
    hu: "Óraállás rögzítve.",
    en: "Meter reading recorded.",
  },
  "rezsi.kesz.tervezet": {
    hu: "Elkészült a tervezet. Nézd át, és ha rendben van, add ki a bérlőnek.",
    en: "The draft is ready. Look it over, and if it is right, issue it to the tenant.",
  },
  "rezsi.kesz.kiadva": {
    hu: "Kiadva. A bérlő látja a tételeket, és a befizetése a {nap}-i határidőhöz párosul.",
    en: "Issued. The tenant can see the items, and their payment will be matched to the {nap} deadline.",
  },
  "rezsi.kesz.elfogadva": {
    hu: "Elfogadtad az elszámolást.",
    en: "You have accepted the statement.",
  },
  "rezsi.kesz.vitatva": {
    hu: "Jeleztem a bérbeadónak, hogy vitatod. Az üzeneted is látja.",
    en: "I have told the landlord that you dispute it. They can see your message too.",
  },

  // --- Letöltési válaszok
  "letoltes.nincs_jogosultsag": {
    hu: "Ehhez nincs jogosultságod.",
    en: "You do not have access to this.",
  },
  "letoltes.nincs_szerzodes": {
    hu: "Nincs ilyen szerződés.",
    en: "No such contract.",
  },
  "letoltes.nincs_vegleges_szerzodes": {
    hu: "Nincs ilyen véglegesített szerződés.",
    en: "No such finalised contract.",
  },
  "letoltes.nincs_forditas": {
    hu: "Ehhez a szerződéshez nincs angol fordítás.",
    en: "There is no English translation for this contract.",
  },
  "letoltes.nincs_jegyzokonyv": {
    hu: "Nincs ilyen jegyzőkönyv.",
    en: "No such record.",
  },
  "letoltes.nincs_vegleges_jegyzokonyv": {
    hu: "Nincs ilyen véglegesített jegyzőkönyv.",
    en: "No such finalised record.",
  },
  "letoltes.nincs_igazolas": {
    hu: "Nincs ilyen igazolás.",
    en: "No such certificate.",
  },
  "letoltes.nincs_elszamolas": {
    hu: "Nincs ilyen kiadott elszámolás.",
    en: "No such issued statement.",
  },

  "letoltes.nincs_bizonylat": {
    hu: "Nincs ilyen bizonylat.",
    en: "No such receipt.",
  },
  "letoltes.nincs_kep": { hu: "Nincs ilyen kép.", en: "No such photo." },
  "dokumentumok.igazolas_cel_alap": {
    // Ez a szöveg a magyar igazolásba kerül, ezért angol felületen is magyar.
    hu: "a lakhatási támogatáshoz",
    en: "a lakhatási támogatáshoz",
  },

  "dokumentum.igazolas.cim": { hu: "{nev} · {honap}", en: "{nev} · {honap}" },
  "dokumentum.elszamolas.cim": {
    hu: "{kezdet} – {veg}",
    en: "{kezdet} – {veg}",
  },

  "szerzodes.megnevezes": {
    hu: "Bérleti szerződés – {ingatlan}",
    en: "Lease agreement – {ingatlan}",
  },

  // Beszélgetés a bérbeadó és a bérlő között.
  "nav.beszelgetesek": { hu: "Üzenetek", en: "Messages" },
  "beszelgetes.cim": { hu: "Üzenetek", en: "Messages" },
  "beszelgetes.bevezeto": {
    hu: "A bérlet hétköznapi ügyei egy helyen, ott, ahol később is megtalálod. Ami egy hibabejelentéshez tartozik, arra ott a saját üzenetváltása.",
    en: "The everyday matters of the tenancy in one place, where you can still find them later. Anything that belongs to a fault report has its own thread there.",
  },
  "beszelgetes.nincs": {
    hu: "Még nincs beszélgetésed. Az első üzenettel indul.",
    en: "You have no conversations yet. The first message starts one.",
  },
  "beszelgetes.uj": { hu: "Új beszélgetés", en: "New conversation" },
  "beszelgetes.uj_sugo": {
    hu: "A beszélgetés az első üzenettel jön létre. Jelöld be, kinek írsz: egy címzett kétirányú beszélgetés, több címzett csoportos.",
    en: "A conversation is created by its first message. Tick who you are writing to: one recipient makes it one-to-one, several make it a group.",
  },
  "beszelgetes.cimzettek": { hu: "Kinek írsz?", en: "Who are you writing to?" },
  "beszelgetes.csoport_sugo": {
    hu: "Aki még nem lépett be a saját fiókjába, nem szerepel itt: neki még nincs hová írni.",
    en: "Anyone who has not signed in to their own account yet is not listed: there is nowhere to write to them.",
  },
  "beszelgetes.nincs_tars": {
    hu: "Még nincs kivel beszélgetned. Amint a bérlő belép a meghívójával, itt megjelenik.",
    en: "There is no one to talk to yet. Once the tenant signs in with their invitation, they appear here.",
  },
  "beszelgetes.uzenet": { hu: "Az üzenet", en: "Message" },
  "beszelgetes.uzenet_pelda": {
    hu: "pl. Csütörtökön 9 és 11 között jön a kéményseprő, be tudtok engedni?",
    en: "e.g. The chimney sweep is coming Thursday between 9 and 11, can you let them in?",
  },
  "beszelgetes.valasz": { hu: "Válasz", en: "Reply" },
  "beszelgetes.kuldes": { hu: "Küldés", en: "Send" },
  "beszelgetes.kuldom": { hu: "Küldöm…", en: "Sending…" },
  "beszelgetes.vissza": { hu: "Vissza az üzenetekhez", en: "Back to messages" },
  "beszelgetes.en": { hu: "Én", en: "Me" },
  "beszelgetes.darab": { hu: "{darab} üzenet", en: "{darab} messages" },
  "beszelgetes.korabbi_uzenetek": {
    hu: "Korábbi üzenetek ({darab})",
    en: "Earlier messages ({darab})",
  },
  "beszelgetes.archivaltak": {
    hu: "Archivált beszélgetések ({darab})",
    en: "Archived conversations ({darab})",
  },
  "beszelgetes.archivalt": { hu: "Archiválva", en: "Archived" },
  "beszelgetes.fajta.ketiranyu": { hu: "Kétirányú", en: "One-to-one" },
  "beszelgetes.fajta.csoportos": { hu: "Csoportos", en: "Group" },
  "beszelgetes.lezarult_sugo": {
    hu: "A jogviszony lezárult. A beszélgetés még {nap} napig nyitva marad, {datum}-ig, hogy az óvadék, az utolsó rezsiszámla és a hátrahagyott holmi ügyét legyen hol megbeszélni.",
    en: "The tenancy has ended. This conversation stays open for another {nap} days, until {datum}, so there is somewhere to settle the deposit, the last utility bill and anything left behind.",
  },
  "beszelgetes.archivalt_sugo": {
    hu: "Archiválva: a jogviszony lezárása után {nap} nappal lezárult. Olvasható marad, de írni már nem lehet bele.",
    en: "Archived: it closed {nap} days after the tenancy ended. It stays readable, but nothing can be added.",
  },
  "beszelgetes.archivalt_nem_irhato": {
    hu: "Ez a beszélgetés archivált, ezért nem lehet hozzáírni. Ami benne van, az megmarad.",
    en: "This conversation is archived, so nothing can be added. What is in it stays.",
  },
  "beszelgetes.hiba.ures": {
    hu: "Üres üzenetet nem küldünk el.",
    en: "We do not send an empty message.",
  },
  "beszelgetes.hiba.hosszu": {
    hu: "Ez hosszabb, mint amit egy üzenet elbír ({max} karakter). Ami ennél hosszabb, az inkább dokumentum.",
    en: "This is longer than one message can carry ({max} characters). Anything longer belongs in a document.",
  },
  "beszelgetes.hiba.nincs_jogosultsag": {
    hu: "Ehhez a beszélgetéshez nincs közöd.",
    en: "This conversation is not yours.",
  },
  "beszelgetes.hiba.archivalt": {
    hu: "Ez a beszélgetés archivált, nem lehet hozzáírni.",
    en: "This conversation is archived; nothing can be added.",
  },
  "beszelgetes.hiba.nincs_cimzett": {
    hu: "Jelöld be, kinek írsz.",
    en: "Tick who you are writing to.",
  },

  // ——— Kölcsönös értékelés a jogviszony végén ———
  "nav.ertekelesek": { hu: "Értékelés", en: "Reviews" },
  "befizetesek.lezart_berletek": { hu: "Lezárt bérletek", en: "Closed tenancies" },
  "ertekeles.cim": { hu: "Értékelés", en: "Reviews" },
  "ertekeles.alcim": {
    hu: "A lezárt bérletekről, kölcsönösen.",
    en: "On closed tenancies, both ways.",
  },
  "ertekeles.sugo_cim": { hu: "Miért nem látod rögtön a másikét?", en: "Why can't you see theirs yet?" },
  "ertekeles.sugo": {
    hu: "Amíg mindkét fél meg nem írta a sajátját, egyik sem látja a másikét. Enélkül a második értékelés az elsőre adott válasz lenne, nem a bérletről szólna. Ha a másik fél nem ír semmit, {nap} nap után az is felfedődik, ami megvan — különben elég lenne hallgatni ahhoz, hogy eltűnjön a rólad szóló értékelés.",
    en: "Until both sides have written theirs, neither can see the other's. Otherwise the second review would be a reply to the first, not about the tenancy. If the other side writes nothing, whatever exists is revealed after {nap} days — otherwise staying silent would be enough to make a review of you disappear.",
  },
  "ertekeles.nem_meres_cim": { hu: "Ez vélemény, nem mérés", en: "This is an opinion, not a measurement" },
  "ertekeles.nem_meres": {
    hu: "Amit itt olvasol, a másik fél saját állítása arról, hogyan ment a bérlet. Az alkalmazás nem ellenőrzi, és nem is von össze egyetlen pontszámmá: a három szempont nem egyenértékű, és az átlaguk mérésnek látszana.",
    en: "What you read here is the other side's own account of how the tenancy went. The app does not verify it, and does not fold it into a single score: the three aspects are not equivalent, and an average would look like a measurement.",
  },
  "ertekeles.nincs": {
    hu: "Még nincs lezárt bérleted. Értékelni a kiköltözés után lehet.",
    en: "You have no closed tenancy yet. Reviews open after move-out.",
  },
  "ertekeles.nincs_fiok": {
    hu: "Ennek a bérlőnek nincs fiókja, ezért nem tud értékelni, és értékelni sem lehet: az értékelés két félé, nem egyé.",
    en: "This tenant has no account, so they cannot review and cannot be reviewed: a review belongs to two sides, not one.",
  },
  "ertekeles.masik_fel": { hu: "A másik fél: {nev}", en: "The other side: {nev}" },
  "ertekeles.lezarva_nap": { hu: "Lezárva: {nap}", en: "Closed: {nap}" },
  "ertekeles.hatralevo": { hu: "Még {nap} napig írhatsz.", en: "You can still write for {nap} days." },

  "ertekeles.allapot.nem_ideje": {
    hu: "A bérlet még fut. Értékelni a lezárás után lehet.",
    en: "The tenancy is still running. Reviews open once it closes.",
  },
  "ertekeles.allapot.irhato": {
    hu: "Rajtad a sor: még nem írtad meg a sajátodat.",
    en: "Your turn: you have not written yours yet.",
  },
  "ertekeles.allapot.varakozik": {
    hu: "Megvan a tiéd. A másik félét akkor látod, ha ő is megírta.",
    en: "Yours is in. You will see theirs once they have written it too.",
  },
  "ertekeles.allapot.lathato": {
    hu: "Felfedve: mindkettő látszik.",
    en: "Revealed: both are visible.",
  },
  "ertekeles.allapot.elmaradt": {
    hu: "Letelt az idő, és egyik fél sem írt értékelést.",
    en: "The window closed and neither side wrote a review.",
  },

  // A jelző rövid felirata. A hozzá tartozó magyarázat az `allapot.*` kulcsokon
  // van: egy mondat nem fér a pirulába, és az nem is törik.
  "ertekeles.jelzo.nem_ideje": { hu: "Még fut", en: "Still running" },
  "ertekeles.jelzo.irhato": { hu: "Rajtad a sor", en: "Your turn" },
  "ertekeles.jelzo.varakozik": { hu: "Vár a másikra", en: "Waiting on them" },
  "ertekeles.jelzo.lathato": { hu: "Felfedve", en: "Revealed" },
  "ertekeles.jelzo.elmaradt": { hu: "Elmaradt", en: "Not written" },

  "ertekeles.sajat_cim": { hu: "Amit te írtál", en: "What you wrote" },
  "ertekeles.masike_cim": { hu: "Amit {nev} írt", en: "What {nev} wrote" },
  "ertekeles.urlap_cim": { hu: "Értékelés írása", en: "Write a review" },
  "ertekeles.urlap_modosit": { hu: "Az értékelésed módosítása", en: "Change your review" },
  "ertekeles.modosithato": {
    hu: "Felfedésig módosíthatod. Utána nem: amit a másik fél elolvasott, azt nem írjuk át.",
    en: "You can change it until it is revealed. Not after: what the other side has read is not rewritten.",
  },
  "ertekeles.szoveg_cimke": { hu: "Hogyan ment a bérlet?", en: "How did the tenancy go?" },
  "ertekeles.szoveg_sugo": {
    hu: "Pontszám magyarázat nélkül nincs: abból a másik fél nem tud kiindulni.",
    en: "No score without a reason: the other side has nothing to go on otherwise.",
  },
  "ertekeles.kuld": { hu: "Értékelés mentése", en: "Save review" },
  "ertekeles.kuldom": { hu: "Mentem…", en: "Saving…" },
  "ertekeles.pont_cimke": { hu: "{szempont}: {pont} az 5-ből", en: "{szempont}: {pont} out of 5" },

  "ertekeles.szempont.berlorol.fizetes": { hu: "Fizetés", en: "Payment" },
  "ertekeles.szempont.berlorol.allapot": { hu: "A lakás állapota", en: "Condition of the flat" },
  "ertekeles.szempont.berlorol.kommunikacio": { hu: "Kommunikáció", en: "Communication" },
  "ertekeles.szempont.berbeadorol.hibakezeles": { hu: "Hibák elhárítása", en: "Handling of faults" },
  "ertekeles.szempont.berbeadorol.elerhetoseg": { hu: "Elérhetőség", en: "Reachability" },
  "ertekeles.szempont.berbeadorol.elszamolas": { hu: "Elszámolás", en: "Settling up" },

  "ertekeles.kifogas.nincs_szoveg": {
    hu: "Írd le, hogyan ment: pontszám magyarázat nélkül nincs.",
    en: "Say how it went: no score without a reason.",
  },
  "ertekeles.kifogas.hianyzo_szempont": {
    hu: "Mind a három szempontra adj pontot.",
    en: "Give a score for all three aspects.",
  },
  "ertekeles.kifogas.tartomanyon_kivul": {
    hu: "A pont 1 és 5 között lehet.",
    en: "A score must be between 1 and 5.",
  },
  "ertekeles.kifogas.ismeretlen_szempont": {
    hu: "Ismeretlen szempont került az űrlapra.",
    en: "The form carried an unknown aspect.",
  },
  "ertekeles.kifogas.nem_ideje": {
    hu: "Ezt a bérletet még nem zárták le, vagy letelt az értékelési idő.",
    en: "This tenancy is not closed yet, or the review window has passed.",
  },
  "ertekeles.kifogas.mar_felfedve": {
    hu: "Az értékelések már felfedődtek, ezen nem lehet változtatni.",
    en: "The reviews are already revealed; this can no longer be changed.",
  },
  "ertekeles.hiba.nem_tied": {
    hu: "Ehhez a bérlethez nincs hozzáférésed.",
    en: "You do not have access to this tenancy.",
  },
  "ertekeles.kesz": { hu: "Az értékelésed elmentve.", en: "Your review has been saved." },

  "teendo.ertekeles.cim": { hu: "Értékeld a lezárt bérletet: {cimke}", en: "Review the closed tenancy: {cimke}" },
  "teendo.ertekeles.leiras": {
    hu: "Még {nap} napig írhatsz. Amíg nem írsz, a rólad szólót sem látod.",
    en: "You can still write for {nap} days. Until you do, you cannot see the one about you.",
  },

  // ——— Bemutatkozó oldal ———
  "nav.bemutatkozas": { hu: "Bemutatkozás", en: "Profile" },
  "nav.rendszergazda": { hu: "Üzemeltetés", en: "Operations" },

  "bemutatkozas.cim": { hu: "Bemutatkozás", en: "Profile" },
  "bemutatkozas.alcim": {
    hu: "Amit magadról írsz, és a rólad szóló értékelések. Ez az oldal egyelőre nem nyilvános.",
    en: "What you write about yourself, and the reviews about you. This page is not public yet.",
  },
  "bemutatkozas.admin_alcim": {
    hu: "Bemutatkozó oldal, üzemeltetői nézetben.",
    en: "Profile page, operator view.",
  },
  "bemutatkozas.vissza": { hu: "Vissza a listához", en: "Back to the list" },
  "bemutatkozas.szerep.berbeado": { hu: "Bérbeadó", en: "Landlord" },
  "bemutatkozas.szerep.berlo": { hu: "Bérlő", en: "Tenant" },
  "bemutatkozas.mezo_cimke": { hu: "Amit magadról írsz", en: "About you" },
  "bemutatkozas.mezo_sugo": {
    hu: "Néhány mondat arról, ki vagy és mit vársz a bérlettől. Ezt csak te látod és az üzemeltető; a másik félhez nem jut el.",
    en: "A few sentences about who you are and what you expect from the tenancy. Only you and the operator can see it; it does not reach the other party.",
  },
  "bemutatkozas.ment": { hu: "Mentés", en: "Save" },
  "bemutatkozas.mentem": { hu: "Mentem…", en: "Saving…" },
  "bemutatkozas.kesz": {
    hu: "A bemutatkozásod elmentve.",
    en: "Your profile text has been saved.",
  },
  "bemutatkozas.hiba.nincs_belepve": {
    hu: "Ehhez be kell lépned.",
    en: "You need to be signed in for this.",
  },
  "bemutatkozas.hiba.tul_hosszu": {
    hu: "A bemutatkozás legfeljebb {jel} karakter lehet.",
    en: "The profile text can be at most {jel} characters.",
  },
  "bemutatkozas.ures_sajat": {
    hu: "Még nem írtál magadról semmit.",
    en: "You have not written anything about yourself yet.",
  },
  "bemutatkozas.ures_masike": {
    hu: "Nem írt magáról semmit.",
    en: "They have not written anything about themselves.",
  },
  "bemutatkozas.ertekelesek_cim": { hu: "Értékelések", en: "Reviews" },
  "bemutatkozas.darab": { hu: "{darab} értékelés", en: "{darab} reviews" },
  "bemutatkozas.atlag": {
    hu: "{atlag} ({darab} értékelésből)",
    en: "{atlag} (from {darab} reviews)",
  },
  "bemutatkozas.nincs_sajat": {
    hu: "Még nincs rólad felfedett értékelés. Ami rejtve van, az ide sem számít bele.",
    en: "There is no revealed review about you yet. Anything still hidden is not counted here either.",
  },
  "bemutatkozas.nincs_masike": {
    hu: "Még nincs róla felfedett értékelés.",
    en: "There is no revealed review about them yet.",
  },
  "bemutatkozas.nem_nyilvanos_cim": {
    hu: "Ki látja ezt az oldalt?",
    en: "Who can see this page?",
  },
  "bemutatkozas.nem_nyilvanos": {
    hu: "Egyelőre csak te magad és az üzemeltető. A másik fél nem látja, és nyilvános hivatkozás sincs hozzá. Hogy a rólad szóló értékelést megmutathasd-e egy leendő bérbeadónak, még nincs eldöntve.",
    en: "For now only you and the operator. The other party cannot see it, and there is no public link to it. Whether you may show a review about yourself to a prospective landlord is not decided yet.",
  },
  "bemutatkozas.rejtett_cim": {
    hu: "Miért kevesebb, mint amennyit vártál?",
    en: "Why fewer than you expected?",
  },
  "bemutatkozas.rejtett": {
    hu: "Csak a felfedett értékelés látszik itt, és csak az számít bele a darabszámba. Amíg mindkét fél meg nem írta a sajátját, a rólad szóló rejtve marad — különben a puszta darabszámból is kiderülne, hogy a másik fél már írt.",
    en: "Only revealed reviews appear here, and only those are counted. Until both parties have written their own, the one about you stays hidden — otherwise the count alone would reveal that the other party has already written.",
  },

  // ——— A rendszer saját értékelése, csak az üzemeltetőnek ———
  "gepi.cim": { hu: "A rendszer értékelése", en: "System assessment" },
  "gepi.alcim": {
    hu: "Amit az alkalmazás maga mért. Csak az üzemeltető látja, a felhasználó nem.",
    en: "What the application measured itself. Only the operator sees it, not the user.",
  },
  "gepi.szempont.pontossag": { hu: "Pontosság", en: "Accuracy" },
  "gepi.szempont.valaszido": { hu: "Válaszidő", en: "Response time" },
  "gepi.szempont.egyuttmukodes": { hu: "Együttműködés", en: "Cooperation" },
  "gepi.pont": {
    hu: "{pont} / 5 ({minta} megfigyelésből)",
    en: "{pont} / 5 (from {minta} observations)",
  },
  "gepi.nincs_pont": { hu: "nincs elég adat", en: "not enough data" },
  "gepi.nincs_eleg": {
    hu: "{minta} megfigyelés van, és legalább {kell} kellene. Kevesebből a szám magát magyarázná.",
    en: "There are {minta} observations, and at least {kell} would be needed. Fewer than that and the number would only explain itself.",
  },
  "gepi.pontossag": {
    hu: "{minta} lejárt előírásból {rendben} zárult rendben, {vitas} vitás, {hianyzo} maradt nyilatkozat nélkül. A késés középértéke {keses} nap.",
    en: "Of {minta} due charges, {rendben} closed cleanly, {vitas} are disputed and {hianyzo} were left without a statement. The median delay is {keses} days.",
  },
  "gepi.valaszido": {
    hu: "{minta} megkeresésre adott válasz középértéke {ora} óra.",
    en: "The median response to {minta} messages was {ora} hours.",
  },
  "gepi.egyuttmukodes": {
    hu: "{minta} kétoldali kérdésből {megvalaszolt} esetben nyilatkozott, igennel vagy nemmel.",
    en: "Of {minta} two-sided questions, they gave a statement in {megvalaszolt} cases, whether yes or no.",
  },
  "gepi.nincs_semmi": {
    hu: "A rendszer még semmit nem tud erről a felhasználóról. Ez nem rossz jegy, hanem hiányzó adat.",
    en: "The system knows nothing about this user yet. That is missing data, not a bad mark.",
  },
  "gepi.miert_cim": {
    hu: "Miből jönnek ezek a számok?",
    en: "Where do these numbers come from?",
  },
  "gepi.miert": {
    hu: "Abból, amit az alkalmazás magától rögzített: a befizetések egyeztetéséből, a hibabejelentések és az üzenetek időpontjaiból, és abból, hány kétoldali kérdésre nyilatkozott a felhasználó. A három szempontot nem vonjuk össze egyetlen számmá, és amire nincs elég adat, arra nem tippelünk. A válaszidő sávjai az alkalmazás alapértelmezései, nem jogszabályi határidők. A számítás nincs eltárolva: minden megnyitáskor újra fut, tehát követi, ha a viselkedés megváltozik.",
    en: "From what the application recorded on its own: the payment reconciliation, the timestamps of repair reports and messages, and how many two-sided questions the user answered. The three aspects are never merged into one number, and where there is not enough data we do not guess. The response-time bands are the application's defaults, not statutory deadlines. The calculation is not stored: it runs again on every visit, so it follows changes in behaviour.",
  },

  "rendszergazda.cim": { hu: "Üzemeltetés", en: "Operations" },
  "rendszergazda.alcim": {
    hu: "A felhasználók bemutatkozó oldalai.",
    en: "The users' profile pages.",
  },
  "rendszergazda.sugo_cim": {
    hu: "Mit látsz itt?",
    en: "What do you see here?",
  },
  "rendszergazda.sugo": {
    hu: "Minden felhasználó bemutatkozó oldalát, és rajtuk kétféle értékelést: amit a másik fél írt róla, és amit a rendszer mért. A rejtett értékelés itt sem látszik, és a darabszámba sem számít bele: a vakság ígérete a te oldaladon sem törik meg.",
    en: "Every user's profile page, with two kinds of assessment on it: what the other party wrote about them, and what the system measured. Hidden reviews do not show here either, and are not counted: the promise of blind reviewing does not break on your side either.",
  },
  "rendszergazda.nincs": {
    hu: "Nincs egyetlen felhasználó sem.",
    en: "There are no users.",
  },
};

/** Szövegező a beépített szótárral. Kliensoldali komponens is ezt hívja. */
export function szovegekNyelvvel(nyelv: Nyelv): Szovegezo {
  return szovegezo(nyelv, SZOTAR);
}
