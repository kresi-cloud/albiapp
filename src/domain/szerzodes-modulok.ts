/**
 * A szerződésmodulok katalógusa.
 *
 * A szöveg kódban van, nem az adatbázisban. Ennek az az oka, hogy jogi szöveg:
 * verziózni, felülvizsgáltatni és ellenjegyeztetni kell, és egy javításnak minden
 * készülő tervezetre érvényesülnie kell. Az aláírt szerződés szövegét viszont a
 * `Szerzodes.veglegesSzoveg` befagyasztja.
 *
 * Minden modulhoz tartozik egy `miert` mondat. A bérbeadó nem jogász: ha nem érti,
 * mit kapcsol be, akkor nem tud dönteni, és a modulosság értelmét veszti.
 */

import {
  type Kontextus,
  type ModulDef,
  felSzoveg,
  hosszuDatum,
  osszegSzoveg,
} from "./szerzodes";

const IGEN_NEM = [
  { ertek: "igen", cimke: "Igen" },
  { ertek: "nem", cimke: "Nem" },
];

function kozosKoltseg(k: Kontextus): number {
  return k.jogviszony.kozosKoltsegFt || k.ingatlan.kozosKoltsegFt || 0;
}

export const MODULOK: ModulDef[] = [
  {
    kulcs: "felek",
    cim: "Szerződő felek",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "Ki kivel szerződik. Hiányos azonosító adatokkal a szerződés nehezen " +
      "érvényesíthető, ezért itt a születési adatok és az igazolványszám is szerepel.",
    parameterek: [],
    szoveg: (k) => [
      `${felSzoveg(k.berbeado)}, a továbbiakban: Bérbeadó.`,
      ...k.berlok.map((berlo) => `${felSzoveg(berlo)}, a továbbiakban: Bérlő.`),
      k.berlok.length > 1
        ? `A ${k.berlok.length === 2 ? "két" : k.berlok.length} Bérlő a továbbiakban együttesen: Bérlők; a Bérbeadó és a Bérlők a továbbiakban együttesen: Felek.`
        : "A Bérbeadó és a Bérlő a továbbiakban együttesen: Felek.",
    ],
  },
  {
    kulcs: "berlemeny",
    cim: "A bérlemény",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "Mit ad bérbe, milyen állapotban és milyen célra. A helyrajzi szám azonosítja " +
      "az ingatlant akkor is, ha a cím utóbb megváltozik.",
    parameterek: [
      {
        kulcs: "berlemeny_butorozott",
        cimke: "Bútorozott állapotban adod bérbe?",
        tipus: "valaszt",
        alapertelmezes: "igen",
        valaszthatok: IGEN_NEM,
      },
      {
        kulcs: "berlemeny_tulajdoni_hanyad",
        cimke: "Közös tulajdonból hozzá tartozó tulajdoni hányad",
        tipus: "szoveg",
        alapertelmezes: "",
        sugo: "A tulajdoni lapról, például 4309/91069. Üresen hagyható.",
      },
      {
        kulcs: "berlemeny_tarolo",
        cimke: "Tároló vagy egyéb helyiség",
        tipus: "valaszt",
        alapertelmezes: "nem_resze",
        valaszthatok: [
          { ertek: "nem_resze", cimke: "Nem része a szerződésnek" },
          { ertek: "resze", cimke: "A bérlemény része" },
          { ertek: "nincs", cimke: "Nincs ilyen" },
        ],
      },
    ],
    szoveg: (k) => {
      const hanyad = k.p("berlemeny_tulajdoni_hanyad").trim();
      const azonosito = [
        k.ingatlan.helyrajziSzam ? `${k.ingatlan.helyrajziSzam} helyrajzi szám alatt nyilvántartott` : "",
        k.ingatlan.alapteruletM2 ? `${k.ingatlan.alapteruletM2} m² alapterületű` : "",
      ]
        .filter(Boolean)
        .join(", ");

      const elso =
        `A Bérbeadó kizárólagos tulajdonában áll a ${azonosito ? `${azonosito}, ` : ""}` +
        `természetben a ${k.ingatlan.cim} alatt található lakóingatlan` +
        (hanyad ? `, a közös tulajdonból hozzá tartozó ${hanyad} tulajdoni hányaddal együtt` : "") +
        " (a továbbiakban: Bérlemény).";

      const masodik =
        `A Bérbeadó a Bérleményt ${k.p("berlemeny_butorozott") === "igen" ? "bútorozott" : "bútorozatlan"} ` +
        `állapotban, kizárólag lakás céljára adja bérbe ${k.v("a Bérlőnek", "a Bérlőknek")}.`;

      const tarolo = k.p("berlemeny_tarolo");
      const harmadik =
        tarolo === "nem_resze"
          ? "A Bérleményhez tartozó tároló használata nem része jelen szerződésnek; arról a Felek kizárólag külön megállapodást köthetnek."
          : tarolo === "resze"
            ? "A Bérleményhez tartozó tároló használata a bérleti díj ellenében a Bérlőt megilleti."
            : "";

      return [elso, masodik, harmadik].filter(Boolean);
    },
  },
  {
    kulcs: "idotartam",
    cim: "A bérleti jogviszony időtartama",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "Határozott idő alatt rendes felmondásnak nincs helye, ez mindkét félnek " +
      "biztonságot ad. Határozatlan időnél viszont a törvényes felmondási idő él.",
    parameterek: [
      {
        kulcs: "idotartam_meghosszabbitas",
        cimke: "A határozott idő írásban meghosszabbítható?",
        tipus: "valaszt",
        alapertelmezes: "igen",
        valaszthatok: IGEN_NEM,
      },
    ],
    szoveg: (k) => {
      if (!k.jogviszony.vege) {
        return [
          `A bérleti jogviszony ${hosszuDatum(k.jogviszony.kezdete)} napján kezdődik, és határozatlan időre jön létre.`,
          "A szerződést bármelyik Fél felmondhatja a Polgári Törvénykönyv és a Lakástörvény szerinti felmondási idővel, a 16. pontban foglaltak szerint.",
        ];
      }
      const sorok = [
        `A bérleti jogviszony ${hosszuDatum(k.jogviszony.kezdete)} napján kezdődik, és ${hosszuDatum(k.jogviszony.vege)} napjáig tartó határozott időre jön létre.`,
        "A határozott idő alatt rendes felmondásnak nincs helye.",
      ];
      sorok.push(
        k.p("idotartam_meghosszabbitas") === "igen"
          ? "A szerződés a határozott idő utolsó napján külön nyilatkozat nélkül megszűnik, kivéve, ha a Felek annak meghosszabbításáról írásban megállapodnak, vagy a jogviszony a Polgári Törvénykönyv rendelkezései alapján határozatlan időtartamúvá alakul."
          : "A szerződés a határozott idő utolsó napján külön nyilatkozat nélkül megszűnik.",
      );
      return sorok;
    },
  },
  {
    kulcs: "berleti_dij",
    cim: "Bérleti díj és fizetés",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "Mennyi, mikorra és hová. A közlemény formátuma azért fontos, mert ebből " +
      "párosítja az alkalmazás a bankszámlakivonat sorait az előírt tételekhez.",
    parameterek: [
      {
        kulcs: "dij_kozlemeny",
        cimke: "Kötelező közlemény az utaláson",
        tipus: "szoveg",
        alapertelmezes: "",
        sugo: "Például: Anna 20. - tárgyév/tárgyhónap. Ebből ismeri fel a befizetést az alkalmazás.",
      },
      {
        kulcs: "dij_keszpenz",
        cimke: "Készpénzes fizetés is lehetséges?",
        tipus: "valaszt",
        alapertelmezes: "nem",
        valaszthatok: IGEN_NEM,
      },
    ],
    szoveg: (k) => {
      const sorok: string[] = [
        `A Bérlemény havi bérleti díja ${osszegSzoveg(k.jogviszony.berletiDijFt)}.`,
      ];

      const szamla = [k.berbeado.bank, k.berbeado.bankszamla].filter(Boolean).join(" ");
      const kozlemeny = k.p("dij_kozlemeny").trim();
      sorok.push(
        `${k.BN} a bérleti díjat havonta előre, legkésőbb a tárgyhónap ${k.jogviszony.fizetesiNap}. napjáig ` +
          `banki átutalással ${k.v("köteles", "kötelesek")} megfizetni a Bérbeadó ` +
          `${szamla || "által megadott"} számú bankszámlájára.` +
          (kozlemeny ? ` A közleményben fel kell tüntetni: „${kozlemeny}”.` : "") +
          (k.p("dij_keszpenz") === "igen"
            ? " Készpénzes teljesítés kizárólag a Bérbeadó által aláírt külön átvételi elismervény ellenében érvényes."
            : " Készpénzes teljesítésre nincs mód."),
      );

      sorok.push(
        "A fizetés akkor minősül teljesítettnek, amikor az összeg a Bérbeadó bankszámláján jóváírásra kerül" +
          (k.p("dij_keszpenz") === "igen"
            ? ", illetve készpénzfizetés esetén az átvételi elismervényt a Bérbeadó kiállítja"
            : "") +
          ". Késedelem esetén a Bérbeadót a Ptk. szerinti késedelmi kamat illeti meg.",
      );

      sorok.push(
        "A Bérbeadó a bérleti díj és a közüzemi díjak befizetéseiről elektronikus nyilvántartást vezet, " +
          `amelyet ${k.v("a Bérlő", "a Bérlők")} számára folyamatosan hozzáférhetővé tesz. ` +
          `${k.BN} a saját befizetéseit ugyanitt ${k.v("igazolhatja", "igazolhatják")}, és az eltéréseket a Felek ennek alapján rendezik.`,
      );

      return sorok;
    },
  },
  {
    kulcs: "indexalas",
    cim: "A bérleti díj módosulása",
    kotelezo: false,
    ellenjegyzes: "nincs",
    miert:
      "Infláció esetén a bérleti díj reálértéke évről évre csökken. Ez a modul a KSH " +
      "által közzétett fogyasztóiár-indexhez köti az emelést, így nem kell alkudozni.",
    parameterek: [
      {
        kulcs: "index_honap",
        cimke: "Az emelés hónapja",
        tipus: "szam",
        alapertelmezes: "9",
        sugo: "A hónap sorszáma, minden év ugyanazon hónapjának 1. napján.",
      },
      {
        kulcs: "index_bazisev",
        cimke: "Az első emelés alapjául szolgáló év",
        tipus: "szam",
        alapertelmezes: "",
        sugo: "Ennek az évnek az éves átlagos fogyasztóiár-indexe adja az első emelést.",
      },
    ],
    szoveg: (k) => {
      const honapSorszam = k.psz("index_honap") || 9;
      const honapNev = [
        "január", "február", "március", "április", "május", "június",
        "július", "augusztus", "szeptember", "október", "november", "december",
      ][honapSorszam - 1];
      const bazis = k.p("index_bazisev").trim();
      return [
        `Ha a jogviszony határozatlan időtartamúvá alakul vagy meghosszabbodik, a havi bérleti díj ` +
          `${honapNev} 1. napjától a Központi Statisztikai Hivatal által ${bazis ? `a ${bazis}. évre ` : "a megelőző naptári évre "}` +
          `közzétett éves átlagos fogyasztóiár-index 100 feletti részének megfelelő százalékkal emelkedik.`,
        `Ezt követően a módosítás minden év ${honapNev} 1-jén, a megelőző naptári év éves átlagos fogyasztóiár-indexe alapján történik. ` +
          "A 100-at meg nem haladó index a bérleti díjat nem csökkenti.",
      ];
    },
  },
  {
    kulcs: "ovadek",
    cim: "Óvadék",
    kotelezo: false,
    ellenjegyzes: "nincs",
    miert:
      "Az óvadék a bérbeadó biztosítéka. A legtöbb vita abból lesz, hogy mire " +
      "használható fel: ezért itt tételesen fel van sorolva.",
    parameterek: [
      {
        kulcs: "ovadek_kiegeszites_nap",
        cimke: "Kiegészítési határidő felhasználás után (nap)",
        tipus: "szam",
        alapertelmezes: "8",
      },
      {
        kulcs: "ovadek_birtokbaadas_feltetele",
        cimke: "Az óvadék megfizetése a birtokbaadás feltétele?",
        tipus: "valaszt",
        alapertelmezes: "igen",
        valaszthatok: IGEN_NEM,
      },
    ],
    ajanlott: (k) => k.jogviszony.kaucioFt > 0,
    szoveg: (k) => {
      if (k.jogviszony.kaucioFt <= 0) return [];
      const havi = k.jogviszony.berletiDijFt > 0
        ? Math.round((k.jogviszony.kaucioFt / k.jogviszony.berletiDijFt) * 10) / 10
        : 0;
      const sorok = [
        `${k.BN} a szerződésből eredő ${k.v("kötelezettsége", "kötelezettségeik")} biztosítékául ` +
          `${osszegSzoveg(k.jogviszony.kaucioFt)}${havi > 0 ? ` – ${havi} havi bérleti díjnak megfelelő – ` : " "}` +
          `óvadékot ${k.v("fizet", "fizetnek")} a Bérbeadónak.` +
          (k.p("ovadek_birtokbaadas_feltetele") === "igen"
            ? " Az óvadék megfizetése a birtokbaadás és a kulcsátadás feltétele."
            : ""),
        "Az óvadék a lejárt bérleti díj, a Bérlőt terhelő közüzemi és egyéb költségek, a Bérlőnek vagy az általa " +
          "a Bérleménybe beengedett személyeknek felróható károk, a rendeltetésszerű használattal járó természetes " +
          "elhasználódást meghaladó állagromlás, a hiányzó vagy sérült leltári tárgyak és kulcsok, valamint a " +
          "szükséges takarítás igazolt költségeinek fedezetére használható fel.",
        "Az óvadék kamatmentes, és a Bérbeadó előzetes írásbeli hozzájárulása nélkül nem számítható be a bérleti " +
          `díjba, így különösen az utolsó havi bérleti díjba. Ha a Bérbeadó a jogviszony fennállása alatt az ` +
          `óvadékból jogszerű követelését kielégíti, ${k.B} az erről szóló írásbeli értesítés kézhezvételétől ` +
          `számított ${k.psz("ovadek_kiegeszites_nap") || 8} napon belül ${k.v("köteles", "kötelesek")} az óvadékot az eredeti összegre kiegészíteni.`,
      ];
      return sorok;
    },
  },
  {
    kulcs: "nyari_szunet",
    cim: "Használati szünet és kedvezmény",
    kotelezo: false,
    ellenjegyzes: "nincs",
    miert:
      "Egyetemi városban a bérlő nyáron hazautazik, és vagy fizet üresen, vagy " +
      "felmond. Ez a modul bejelentett szünetre csökkentett díjat ad, cserébe a " +
      "bérlemény kiadva marad.",
    parameterek: [
      {
        kulcs: "szunet_bejelentes_hatarido",
        cimke: "Bejelentési határidő",
        tipus: "datum",
        alapertelmezes: "",
        sugo: "Eddig kell a bérlőnek írásban jeleznie, hogy él a szünettel.",
      },
      {
        kulcs: "szunet_honapok",
        cimke: "Mely hónapokra kérhető",
        tipus: "szoveg",
        alapertelmezes: "július és/vagy augusztus",
      },
      {
        kulcs: "szunet_dij",
        cimke: "A szünet havi díja",
        tipus: "penz",
        alapertelmezes: "",
      },
      {
        kulcs: "szunet_ertesites_ora",
        cimke: "Belépés előtti értesítés (óra)",
        tipus: "szam",
        alapertelmezes: "72",
      },
    ],
    szoveg: (k) => {
      const hatarido = k.p("szunet_bejelentes_hatarido").trim();
      const dij = k.psz("szunet_dij");
      const ora = k.psz("szunet_ertesites_ora") || 72;
      return [
        `${k.BN} legkésőbb ${hatarido ? `${hatarido} napjáig ` : "a szünet kezdetét megelőző hónap utolsó napjáig "}` +
          `${k.v("írásbeli nyilatkozatban", "közös írásbeli nyilatkozatban")} ${k.v("jelezheti", "jelezhetik")}, hogy ` +
          `${k.p("szunet_honapok")} teljes naptári hónapjában a Bérleményt ${k.v("sem ő", "egyikük")} és harmadik személy sem használja lakhatásra. ` +
          (dij > 0 ? `A szabályszerűen bejelentett hónap bérleti díja ${osszegSzoveg(dij)} havonta.` : ""),
        `A kedvezmény feltétele, hogy ${k.B} a használati szünet kezdetén és végén a mérőóraállások rögzítését ` +
          `lehetővé ${k.v("tegye", "tegyék")}, és a Bérleményt a bejelentett időszakban ténylegesen ne ${k.v("használja", "használják")}. ` +
          `${k.BN} a mérőórák alapján kimutatható, ${k.v("hozzá", "hozzájuk")} vagy az általuk beengedett személyhez köthető ` +
          `fogyasztást ${k.v("köteles", "kötelesek")} megtéríteni; a fogyasztástól független alapdíjakat a Bérbeadó viseli.`,
        `${k.BN} személyes tárgyait a Bérleményben ${k.v("hagyhatja", "hagyhatják")}. A Bérbeadó gondoskodik arról, hogy a ` +
          "szükséges karbantartást végző személyeken kívül más személy a Bérleménybe ne lépjen be; a Bérbeadó az általa " +
          "vagy az érdekében eljáró személy által okozott kárért az általános szabályok szerint felel, de nem vállal " +
          "felelősséget a neki fel nem róható betörésből, műszaki meghibásodásból vagy elháríthatatlan külső okból eredő károkért.",
        `A Bérbeadó a használati szünet alatt – legalább ${ora} órával korábban küldött értesítést követően – kizárólag ` +
          "ellenőrzés, karbantartás, állagmegóvás vagy szükséges javítás céljából léphet be. A Bérleményt saját lakhatására " +
          "nem használhatja, és harmadik személy használatába csak a Felek erre vonatkozó, eseti írásbeli megegyezése alapján adhatja.",
      ].filter(Boolean);
    },
  },
  {
    kulcs: "birtokbaadas",
    cim: "Birtokbaadás és dokumentáció",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "A jegyzőkönyv és a fényképek nélkül a kiköltözéskor szó áll szemben szóval. " +
      "Az átadás-átvételi jegyzőkönyvet az alkalmazás készíti, és a szerződés melléklete lesz.",
    parameterek: [
      {
        kulcs: "kulcs_garnitura",
        cimke: "Átadott kulcsgarnitúrák száma",
        tipus: "szam",
        alapertelmezes: "1",
      },
    ],
    szoveg: (k) => [
      `A Bérlemény birtokbaadása és ${k.psz("kulcs_garnitura") || 1} darab kulcsgarnitúra átadása ` +
        `${hosszuDatum(k.jogviszony.kezdete)} napján, az 1. számú melléklet szerinti átadás-átvételi jegyzőkönyv ` +
        `aláírásával történik, feltéve, hogy ${k.B} a birtokbaadást megelőzően esedékes összegeket maradéktalanul ` +
        `${k.v("megfizette", "megfizették")}.`,
      "A jegyzőkönyv tartalmazza a mérőóraállásokat, a kulcsok számát, a Bérlemény és berendezései állapotát, a " +
        "leltárt, az észlelt hibákat, valamint a Felek által készített és jóváhagyott fényképfelvételek jegyzékét. " +
        "A jegyzőkönyv és a fényképfelvételek jelen szerződés elválaszthatatlan részét képezik.",
    ],
  },
  {
    kulcs: "egyetemleges_felelosseg",
    cim: "A bérlők egyetemleges felelőssége",
    kotelezo: false,
    ellenjegyzes: "nincs",
    miert:
      "Több bérlőnél enélkül a bérbeadó fejenként külön követelhet, és egy kiköltöző " +
      "bérlő maga után hagyott tartozását nem tudja érvényesíteni a maradóval szemben.",
    ajanlott: (k) => k.berlok.length > 1,
    parameterek: [],
    szoveg: (k) => {
      if (k.berlok.length < 2) return [];
      return [
        "A Bérlők a jelen szerződésből eredő valamennyi fizetési és egyéb kötelezettség teljesítéséért a " +
          "Bérbeadóval szemben egyetemlegesen felelnek. Bármelyik Bérlő teljesítése a teljesítés mértékéig a " +
          "többi Bérlőt is mentesíti.",
        "Valamelyik Bérlő a jogviszonyból kizárólag valamennyi Fél írásbeli megállapodásával léphet ki. Az egyik " +
          "Bérlő kiköltözése vagy a Bérlemény használatának megszüntetése önmagában nem érinti egyik Bérlő " +
          "kötelezettségeit sem.",
      ];
    },
  },
  {
    kulcs: "kozuzem",
    cim: "Közüzemi díjak és közös költség",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "A rezsi elszámolásának módja itt válik szerződéses kötelezettséggé. A szöveg " +
      "abból indul, amit a jogviszonynál beállítottál, hogy a kettő ne mondjon mást.",
    parameterek: [
      {
        kulcs: "kozuzem_terites_nap",
        cimke: "Visszatérítési határidő a számla megküldésétől (munkanap)",
        tipus: "szam",
        alapertelmezes: "5",
      },
      {
        kulcs: "kozos_koltseg_kit_terhel",
        cimke: "A társasházi közös költséget ki viseli?",
        tipus: "valaszt",
        alapertelmezes: "berbeado",
        valaszthatok: [
          { ertek: "berbeado", cimke: "A bérbeadó" },
          { ertek: "berlo", cimke: "A bérlő" },
        ],
      },
      {
        kulcs: "hirkozles_hozzajarulas",
        cimke: "Internet és tévé csak előzetes hozzájárulással létesíthető?",
        tipus: "valaszt",
        alapertelmezes: "igen",
        valaszthatok: IGEN_NEM,
      },
    ],
    szoveg: (k) => {
      const sorok: string[] = [];
      const mod = k.jogviszony.rezsiElszamolas;

      if (mod === "atalany") {
        sorok.push(
          `${k.BN} a birtokbaadás napjától a Bérlemény visszaadásának napjáig a bérleti díjon felül havi ` +
            `${osszegSzoveg(k.jogviszony.rezsiAtalanyFt)} összegű rezsiátalányt ${k.v("fizet", "fizetnek")}, amely a Bérlemény ` +
            "szokásos háztartási fogyasztásának megfelelő közüzemi díjakat fedezi. Az átalány a tényleges fogyasztástól " +
            "függetlenül jár, és arról a Felek tételesen nem számolnak el.",
          "A szokásos háztartási mértéket tartósan és jelentősen meghaladó fogyasztás esetén a Felek az átalány " +
            "módosításáról írásban egyeztetnek.",
        );
      } else if (mod === "kozos_koltsegben") {
        sorok.push(
          `A Bérlemény közüzemi díjait a bérleti díj és a közös költség tartalmazza, azokat ${k.B} külön nem ${k.v("fizeti", "fizetik")} meg.`,
        );
      } else {
        sorok.push(
          `${k.BN} a birtokbaadás napjától a Bérlemény visszaadásának napjáig a bérleti díjon felül ${k.v("viseli", "viselik")} a ` +
            "Bérlemény valamennyi fogyasztáshoz kapcsolódó közüzemi díját, különösen a víz- és csatorna-, " +
            "villamosenergia- és földgázdíjat, ideértve a fogyasztáshoz kapcsolódó rendszerhasználati és egyéb " +
            "szolgáltatói tételeket is.",
          `A szolgáltatói számlákat a Bérbeadó fizeti meg. ${k.BN} a számla és a megfizetést igazoló bizonylat ` +
            `elektronikus megküldésétől számított ${k.psz("kozuzem_terites_nap") || 5} munkanapon belül ${k.v("köteles", "kötelesek")} ` +
            "az igazolt összeget a Bérbeadónak megtéríteni. A Bérbeadó az elszámolást tételesen, a mérőóraállások és " +
            "az egységárak feltüntetésével adja át.",
        );
      }

      const kk = kozosKoltseg(k);
      sorok.push(
        k.p("kozos_koltseg_kit_terhel") === "berlo"
          ? `A társasházi közös költséget ${k.B} ${k.v("viseli", "viselik")}${kk > 0 ? `, amelynek mértéke a szerződéskötéskor ${osszegSzoveg(kk)} havonta` : ""}. ` +
              "A közös költség változásáról a Bérbeadó írásban tájékoztat."
          : "A társasházi közös költség a Bérbeadót terheli.",
      );

      if (k.p("hirkozles_hozzajarulas") === "igen") {
        sorok.push(
          "Internet-, televízió- vagy más elektronikus hírközlési szolgáltatás kizárólag a Bérbeadó előzetes " +
            `írásbeli hozzájárulásával létesíthető; annak valamennyi díját és megszüntetésének költségét ${k.B} ${k.v("viseli", "viselik")}.`,
        );
      }

      return sorok;
    },
  },
  {
    kulcs: "hasznalat",
    cim: "A bérlemény használata",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "A rendeltetésszerű használat és a kárfelelősség alapszabálya. Enélkül vitatott, " +
      "hogy a bérlő felel-e a vendége okozta kárért.",
    parameterek: [],
    szoveg: (k) => [
      `${k.BN} a Bérleményt, annak tartozékait és berendezéseit rendeltetésszerűen, kizárólag saját lakhatása ` +
        `céljára, a társasházi együttélés szabályainak és a házirendnek megfelelően ${k.v("köteles", "kötelesek")} használni, ` +
        `továbbá ${k.v("köteles", "kötelesek")} azt tisztán tartani és állagát megóvni.`,
      `${k.BN} ${k.v("felel", "felelnek")} a saját, a ${k.v("vele", "velük")} együtt lakó, az általuk vendégként fogadott, illetve a ` +
        `Bérleménybe általuk beengedett személyek magatartásáért és az általuk okozott károkért. ${k.BN} ${k.v("köteles", "kötelesek")} ` +
        "haladéktalanul jelezni a Bérbeadónak minden káreseményt, meghibásodást, beázást, közműhibát, veszélyhelyzetet " +
        "vagy az állagot fenyegető körülményt.",
    ],
  },
  {
    kulcs: "albberlet_lakcim",
    cim: "Harmadik személy, albérlet és lakcím",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "Az albérletbe adás és a rövid távú kiadás tiltása nélkül a bérbeadó elveszíti a " +
      "kontrollt afölött, ki lakik a lakásában. A lakcímbejelentés kérdése külön szabályozást kíván.",
    parameterek: [
      {
        kulcs: "lakcim_bejelentes",
        cimke: "Hozzájárulsz a lakcím bejelentéséhez?",
        tipus: "valaszt",
        alapertelmezes: "tartozkodasi",
        valaszthatok: [
          { ertek: "tartozkodasi", cimke: "Igen, tartózkodási helyként" },
          { ertek: "lakohely", cimke: "Igen, lakóhelyként" },
          { ertek: "nem", cimke: "Nem" },
        ],
      },
      {
        kulcs: "lakcim_kijelentkezes_nap",
        cimke: "Kijelentkezési határidő a megszűnéstől (nap)",
        tipus: "szam",
        alapertelmezes: "8",
      },
    ],
    szoveg: (k) => {
      const sorok = [
        `${k.BN} a Bérleményt vagy annak bármely részét a Bérbeadó előzetes írásbeli hozzájárulása nélkül nem ` +
          `${k.v("adhatja", "adhatják")} albérletbe, használatba, rövid távú szálláshely céljára, és a Bérlemény használatát ` +
          `más módon sem ${k.v("engedheti", "engedhetik")} át harmadik személynek.`,
        "A szokásos vendégfogadást meghaladó, életvitelszerű vagy tartós együttlakáshoz – a személy rokoni " +
          "kapcsolatától függetlenül – a Bérbeadó előzetes hozzájárulása szükséges.",
      ];

      const mod = k.p("lakcim_bejelentes");
      if (mod === "nem") {
        sorok.push(
          "A Bérbeadó a Bérlemény lakcímként való bejelentéséhez nem járul hozzá.",
        );
      } else {
        const megnevezes = mod === "lakohely" ? "lakóhelyként" : "tartózkodási helyként";
        sorok.push(
          `A Bérbeadó hozzájárul ahhoz, hogy ${k.B} a bérleti jogviszony időtartamára a Bérleményt ${megnevezes} ` +
            `${k.v("bejelentse", "bejelentsék")}. A bejelentés semmilyen többlet lakáshasználati vagy vagyoni jogot nem keletkeztet. ` +
            `${k.BN} a jogviszony megszűnésétől számított ${k.psz("lakcim_kijelentkezes_nap") || 8} napon belül ${k.v("köteles", "kötelesek")} ` +
            "a bejelentés megszüntetését igazolni. Harmadik személy lakcímbejelentéséhez a Bérbeadó külön előzetes " +
            "írásbeli hozzájárulása szükséges.",
        );
      }
      return sorok;
    },
  },
  {
    kulcs: "allattartas_dohanyzas",
    cim: "Állattartás, dohányzás és veszélyes anyagok",
    kotelezo: false,
    ellenjegyzes: "nincs",
    miert:
      "Utólag vitatott kérdés, és a bérlőnek is jobb előre tudnia. A segítő kutya " +
      "tiltása jogszabályba ütközne, ezért az mindig kivétel marad.",
    parameterek: [
      {
        kulcs: "allattartas",
        cimke: "Állattartás",
        tipus: "valaszt",
        alapertelmezes: "tilos",
        valaszthatok: [
          { ertek: "tilos", cimke: "Nem megengedett" },
          { ertek: "hozzajarulassal", cimke: "Előzetes hozzájárulással" },
          { ertek: "szabad", cimke: "Megengedett" },
        ],
      },
      {
        kulcs: "dohanyzas",
        cimke: "Dohányzás",
        tipus: "valaszt",
        alapertelmezes: "tilos",
        valaszthatok: [
          { ertek: "tilos", cimke: "A bérlemény egész területén tilos" },
          { ertek: "erkelyen", cimke: "Csak az erkélyen megengedett" },
          { ertek: "szabad", cimke: "Megengedett" },
        ],
      },
    ],
    szoveg: (k) => {
      const allat = k.p("allattartas");
      const allatSzoveg =
        allat === "tilos"
          ? "A Bérleményben állatot tartani vagy rendszeresen elhelyezni nem lehet, kivéve a jogszabály alapján szükséges segítő kutyát."
          : allat === "hozzajarulassal"
            ? "A Bérleményben állat kizárólag a Bérbeadó előzetes írásbeli hozzájárulásával tartható; a jogszabály alapján szükséges segítő kutyához hozzájárulás nem kell."
            : "A Bérleményben a házirend keretei között állat tartható.";

      const dohany = k.p("dohanyzas");
      const dohanySzoveg =
        dohany === "tilos"
          ? "A Bérlemény teljes területén tilos a dohányzás, az elektronikus cigaretta és a hevített dohánytermék használata."
          : dohany === "erkelyen"
            ? "A Bérlemény belső tereiben tilos a dohányzás, az elektronikus cigaretta és a hevített dohánytermék használata; az erkélyen a társasházi házirend szerint megengedett."
            : "A dohányzásra a társasházi házirend szabályai irányadók.";

      return [
        `${allatSzoveg} ${dohanySzoveg}`,
        "Tilos a jogszabályba, hatósági előírásba, társasházi házirendbe vagy biztosítási feltételbe ütköző, továbbá " +
          "a szokásos háztartási mennyiséget meghaladó tűz- vagy robbanásveszélyes anyag, illetve közbiztonságra " +
          "különösen veszélyes eszköz tárolása és használata.",
      ];
    },
  },
  {
    kulcs: "karbantartas",
    cim: "Karbantartás, hibák és átalakítás",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "A kisebb és a nagyobb javítás közti határ a leggyakoribb vitatéma. Ez a modul " +
      "azt mondja ki, hogy a természetes elhasználódás és az épületszerkezeti hiba a bérbeadóé.",
    parameterek: [],
    szoveg: (k) => [
      `${k.BN} ${k.v("viseli", "viselik")} a Bérlemény rendes használatával járó kisebb fenntartási költségeket, valamint ` +
        `teljes egészében az ${k.v("általa", "általuk")} vagy az ${k.v("általa", "általuk")} beengedett személyek által okozott károk ` +
        "helyreállításának költségeit. A természetes elhasználódásból, rejtett hibából, épületszerkezeti vagy központi " +
        "berendezési hibából eredő, továbbá a pótlással vagy cserével járó nagyobb munkák költsége a Bérbeadót terheli, " +
        `amennyiben a hiba nem ${k.v("a Bérlőnek", "a Bérlőknek")} felróható okból keletkezett.`,
      `${k.BN} a Bérleményen átalakítást, felújítást, falbontást, fúrással vagy rögzítéssel járó jelentős beavatkozást, ` +
        `festést vagy egyéb értéknövelő munkát kizárólag a Bérbeadó előzetes írásbeli hozzájárulása alapján ${k.v("végezhet", "végezhetnek")}. ` +
        "A hozzájárulásnak ki kell térnie a költségek viselésére és a bérlet megszűnésekor követendő eljárásra.",
      `${k.BN} ${k.v("köteles", "kötelesek")} tűrni a Bérbeadót terhelő, szükséges állagmegóvási, karbantartási és hibaelhárítási ` +
        "munkákat, feltéve, hogy a Bérbeadó azokról – sürgős veszélyhelyzet kivételével – előzetesen tájékoztatást ad, és " +
        `a munkát ${k.v("a Bérlő", "a Bérlők")} szükségtelen háborítása nélkül szervezi meg.`,
    ],
  },
  {
    kulcs: "ellenorzes_leolvasas",
    cim: "Ellenőrzés, mérőóra-leolvasás és bejutás",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "A bérbeadó ellenőrzési joga és a bérlő nyugalma között ez a modul húzza meg a " +
      "határt. A leolvasás napjait azért rögzítjük, mert az elszámolás ezekre épül.",
    parameterek: [
      {
        kulcs: "ellenorzes_alkalom",
        cimke: "Ellenőrzések száma évente",
        tipus: "szam",
        alapertelmezes: "2",
      },
      {
        kulcs: "ellenorzes_ertesites_ora",
        cimke: "Előzetes értesítés (óra)",
        tipus: "szam",
        alapertelmezes: "72",
      },
      {
        kulcs: "leolvasas_tol",
        cimke: "Leolvasás a hónap hányadikától",
        tipus: "szam",
        alapertelmezes: "12",
      },
      {
        kulcs: "leolvasas_ig",
        cimke: "Leolvasás a hónap hányadikáig",
        tipus: "szam",
        alapertelmezes: "15",
      },
    ],
    szoveg: (k) => {
      const alkalom = k.psz("ellenorzes_alkalom") || 2;
      const ora = k.psz("ellenorzes_ertesites_ora") || 72;
      const sorok = [
        `A Bérbeadó jogosult a Bérlemény rendeltetésszerű használatát és a szerződés teljesítését évente legfeljebb ` +
          `${alkalom} alkalommal ellenőrizni. Az ellenőrzés időpontját legalább ${ora} órával korábban egyeztetni kell, és azt ` +
          `8 és 20 óra között, ${k.v("a Bérlő", "a Bérlők")} szükségtelen háborítása nélkül kell megtartani.`,
      ];

      if (k.jogviszony.rezsiElszamolas === "almero") {
        sorok.push(
          `A Bérleményben található fogyasztásmérők leolvasását a Felek havonta, a tárgyhónap ` +
            `${k.psz("leolvasas_tol") || 12}. és ${k.psz("leolvasas_ig") || 15}. napja között, előzetesen egyeztetett időpontban végzik el. ` +
            `${k.BN} ${k.v("köteles", "kötelesek")} a leolvasáshoz szükséges bejutást az egyeztetett időpontban biztosítani. ` +
            "A leolvasott állásokat a Felek a Bérbeadó által vezetett nyilvántartásban rögzítik.",
        );
      }

      sorok.push(
        `Közvetlen kárelhárítást igénylő esemény, veszélyhelyzet, csőtörés, tűz, gázszivárgás vagy más sürgős körülmény ` +
          `esetén ${k.B} ${k.v("köteles", "kötelesek")} a bejutást haladéktalanul biztosítani. Ha ez nem lehetséges, a Bérbeadó a ` +
          `veszély elhárításához szükséges mértékben jogosult a Bérleménybe belépni, és erről ${k.v("a Bérlőt", "a Bérlőket")} ` +
          "haladéktalanul tájékoztatni.",
      );

      return sorok;
    },
  },
  {
    kulcs: "uzleti_hasznalat",
    cim: "Üzleti célú használat",
    kotelezo: false,
    ellenjegyzes: "nincs",
    miert:
      "Székhelyként bejelentett lakásnál hatósági eljárás és ügyfélforgalom is járhat, " +
      "és a társasházi házirendbe is ütközhet.",
    parameterek: [],
    szoveg: () => [
      "A Bérlemény a Bérbeadó előzetes, kifejezett írásbeli hozzájárulása nélkül nem jelenthető be gazdasági " +
        "társaság, egyéni vállalkozó, civil vagy más szervezet székhelyeként, telephelyeként vagy fióktelepeként, és " +
        "ott üzletszerű, ügyfélforgalommal járó vagy szálláshely-szolgáltatási tevékenység nem végezhető.",
    ],
  },
  {
    kulcs: "megszunes_felmondas",
    cim: "A szerződés megszűnése és felmondása",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "A Lakástörvény felmondási rendje kötött: fizetési késedelemnél előbb felszólítás " +
      "kell, és csak utána jöhet a felmondás. Aki ezt kihagyja, elveszíti a pert.",
    parameterek: [
      {
        kulcs: "felszolitas_nap",
        cimke: "Fizetési felszólítás türelmi ideje (nap)",
        tipus: "szam",
        alapertelmezes: "8",
      },
      {
        kulcs: "magatartas_felmondas_nap",
        cimke: "Felmondási idő magatartási szerződésszegésnél (nap)",
        tipus: "szam",
        alapertelmezes: "15",
      },
    ],
    szoveg: (k) => {
      const felszolitas = k.psz("felszolitas_nap") || 8;
      const magatartas = k.psz("magatartas_felmondas_nap") || 15;
      const sorok = [
        "A szerződés megszűnik a határozott idő elteltével, a Felek írásbeli közös megegyezésével, a Bérlemény " +
          "megsemmisülésével, továbbá jogszabályban vagy jelen szerződésben meghatározott felmondással.",
        `Fizetési késedelem: ha ${k.B} a bérleti díjat vagy az ${k.v("őt", "őket")} terhelő költséget az esedékességkor nem ` +
          `${k.v("fizeti", "fizetik")} meg, a Bérbeadó a jogkövetkezményekre történő figyelmeztetéssel írásban felszólítja ` +
          `${k.v("a Bérlőt", "a Bérlőket")} a teljesítésre. Ha ${k.B} a felszólítás kézhezvételétől számított ${felszolitas} napon belül ` +
          `nem ${k.v("teljesít", "teljesítenek")}, a Bérbeadó a további ${felszolitas} napon belül írásban felmondhatja a szerződést, ` +
          "a vonatkozó törvényi felmondási idő és megszűnési időpont betartásával.",
        `Magatartási vagy használati szerződésszegés: ha ${k.B} vagy az ${k.v("általa", "általuk")} beengedett személy a ` +
          "szomszédokkal vagy a Bérbeadóval szemben az együttélés követelményeivel kirívóan ellentétes magatartást " +
          `tanúsít, vagy a Bérleményt, illetve a közös területet nem rendeltetésszerűen ${k.v("használja", "használják")}, a Bérbeadó ` +
          `előzetes írásbeli felszólítást követően, legalább ${magatartas} napos felmondási idővel, a felmondást követő hónap ` +
          "utolsó napjára felmondhat. Előzetes felszólítás nem szükséges, ha a magatartás olyan súlyos, hogy a szerződés " +
          `fenntartása nem várható el; ilyen esetben a felmondást a tudomásszerzéstől számított ${felszolitas} napon belül kell közölni.`,
        "Egyéb lényeges szerződésszegés: ha valamelyik Fél írásbeli, megfelelő póthatáridőt tartalmazó felszólítás " +
          "ellenére sem teljesíti lényeges kötelezettségét, a másik Fél a szerződést írásban, a szerződésszegés súlyához " +
          "igazodó hatállyal felmondhatja, a Ptk. és a Lakástörvény rendelkezéseinek megfelelően.",
        `${k.v("A Bérlő", "A Bérlők")} jogalap nélküli kiköltözése, a kulcsok egyoldalú visszaküldése vagy a Bérlemény használatának ` +
          `megszüntetése önmagában nem szünteti meg a szerződést, és nem mentesíti ${k.v("őt", "őket")} a fizetési kötelezettség alól. ` +
          `${k.v("A Bérlő", "A Bérlők")} kötelezettsége legfeljebb a határozott idő végéig, illetve a Bérbeadó által elfogadott új bérlő ` +
          "birtokba lépéséig áll fenn; ugyanazon időszakra a Bérbeadó kétszeres bérleti díjat nem érvényesíthet.",
      ];
      if (k.berlok.length > 1) {
        sorok.push(
          "A felmondást és a szerződés megszűnését eredményező más nyilatkozatot mindegyik Bérlővel külön-külön, " +
            "igazolható módon közölni kell.",
        );
      }
      return sorok;
    },
  },
  {
    kulcs: "visszaadas_elszamolas",
    cim: "A bérlemény visszaadása és az elszámolás",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "Az óvadék visszafizetésének határideje és a még ki nem számlázott rezsi " +
      "visszatartása a kiköltözés két legvitatottabb kérdése.",
    parameterek: [
      {
        kulcs: "ovadek_elszamolas_nap",
        cimke: "Óvadék-elszámolás határideje (munkanap)",
        tipus: "szam",
        alapertelmezes: "15",
      },
    ],
    szoveg: (k) => {
      const nap = k.psz("ovadek_elszamolas_nap") || 15;
      const sorok = [
        `A szerződés megszűnésekor ${k.B} ${k.v("köteles", "kötelesek")} a Bérleményt a megszűnés napján kiürítve, kitakarítva, ` +
          "valamennyi átvett kulccsal és leltári tárggyal, rendeltetésszerű használatra alkalmas állapotban visszaadni, " +
          "a rendeltetésszerű használattal járó természetes elhasználódás kivételével. A visszaadásról a Felek " +
          "mérőóraállásokat, kulcsokat, leltárt, hibákat és fényképfelvételeket tartalmazó jegyzőkönyvet vesznek fel.",
        `Ha ${k.B} a Bérleményt a megszűnés napján nem ${k.v("adja", "adják")} vissza, a jogosulatlan használat teljes időtartamára ` +
          "legalább a mindenkori havi bérleti díj időarányos részének megfelelő használati díjat, a közüzemi költségeket, " +
          `valamint az ezt meghaladó igazolt kárt ${k.v("köteles", "kötelesek")} megfizetni.`,
      ];

      if (k.jogviszony.kaucioFt > 0) {
        sorok.push(
          `A Bérbeadó a Bérlemény szabályszerű visszaadását és a rendelkezésre álló számlák szerinti elszámolást ` +
            `követő ${nap} munkanapon belül írásban elszámol az óvadékkal, és annak fel nem használt részét visszafizeti. ` +
            "A még ki nem számlázott közüzemi díjak fedezetére indokolt, tételesen megjelölt összeget visszatarthat; " +
            `ezzel a végszámla kézhezvételétől számított ${nap} munkanapon belül köteles elszámolni.`,
        );
      }

      sorok.push(
        `${k.BN} a jogviszony megszűnésével kapcsolatban a Bérbeadótól másik lakást vagy elhelyezést nem ` +
          `${k.v("követelhet", "követelhetnek")}; elhelyezéséről ${k.v("maga", "maguk")} ${k.v("köteles", "kötelesek")} gondoskodni.`,
      );

      return sorok;
    },
  },
  {
    kulcs: "kapcsolattartas",
    cim: "Kapcsolattartás és kézbesítés",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "Ha nincs rögzítve, hova lehet érvényesen kézbesíteni, a felmondás nem ér célba. " +
      "A napi ügyintézés viszont maradhat e-mailben.",
    parameterek: [
      {
        kulcs: "kapcsolat_valtozas_nap",
        cimke: "Adatváltozás bejelentése (munkanap)",
        tipus: "szam",
        alapertelmezes: "5",
      },
    ],
    szoveg: (k) => {
      const sorok: string[] = [];
      const berbeadoSor = [k.berbeado.lakcim, k.berbeado.email].filter(Boolean).join("; e-mail: ");
      if (berbeadoSor) sorok.push(`A Bérbeadó kapcsolattartási címe: ${berbeadoSor}`);
      for (const berlo of k.berlok) {
        const sor = [berlo.lakcim, berlo.email].filter(Boolean).join("; e-mail: ");
        if (sor) sorok.push(`${berlo.nev} bérlő kapcsolattartási címe: ${sor}`);
      }

      sorok.push(
        "A napi kapcsolattartás és a számlák megküldése történhet e-mailben. Felszólítást, felmondást, " +
          "szerződésmódosítást és más, a jogviszony fennállását vagy megszűnését érintő lényeges nyilatkozatot " +
          "személyesen, átvételi igazolással vagy tértivevényes postai küldeményként kell közölni; e-mailben ezek " +
          "másolata is megküldhető.",
        `A Fél köteles kapcsolattartási adatának változását ${k.psz("kapcsolat_valtozas_nap") || 5} munkanapon belül írásban ` +
          "bejelenteni. Ennek elmulasztása esetén a korábban közölt címre szabályszerűen megküldött küldemény " +
          "kézbesítésének meghiúsulásából eredő következményeket a mulasztó Fél viseli.",
      );

      return sorok;
    },
  },
  {
    kulcs: "energetikai_tanusitvany",
    cim: "Energetikai tanúsítvány",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "Jogszabály írja elő a bérbeadás előtti bemutatását és átadását. Az átvétel " +
      "elismerése azért kerül a szerződésbe, mert utóbb ezt kell tudni igazolni.",
    parameterek: [],
    szoveg: (k) => {
      const azonosito = k.ingatlan.energetikaiAzonosito?.trim();
      return [
        `A Bérbeadó a Bérlemény ${azonosito ? `${azonosito} azonosítójú ` : ""}energetikai tanúsítványát vagy annak ` +
          `másolatát a szerződés megkötése előtt ${k.v("a Bérlőnek", "a Bérlőknek")} bemutatta, a szerződés aláírásával ` +
          `egyidejűleg pedig átadta. ${k.BN} a tanúsítvány bemutatását és átvételét jelen szerződés aláírásával ` +
          `${k.v("elismeri", "elismerik")}.`,
      ];
    },
  },
  {
    kulcs: "zaro_rendelkezesek",
    cim: "Záró rendelkezések",
    kotelezo: true,
    ellenjegyzes: "nincs",
    miert:
      "A háttérjogszabályok megnevezése és a részleges érvénytelenség kezelése. " +
      "Enélkül egyetlen hibás kikötés az egész szerződést megdöntheti.",
    parameterek: [
      {
        kulcs: "peldanyszam",
        cimke: "Eredeti példányok száma",
        tipus: "szam",
        alapertelmezes: "",
        sugo: "Üresen hagyva a felek számából adódik: mindenkinek egy példány.",
      },
      {
        kulcs: "tanuk",
        cimke: "Tanúkkal íratod alá?",
        tipus: "valaszt",
        alapertelmezes: "igen",
        valaszthatok: IGEN_NEM,
      },
    ],
    szoveg: (k) => {
      const megadott = k.psz("peldanyszam");
      const peldany = megadott > 0 ? megadott : k.berlok.length + 1;
      return [
        "A jelen szerződésben nem szabályozott kérdésekben különösen a Polgári Törvénykönyvről szóló 2013. évi V. " +
          "törvény, valamint a lakások és helyiségek bérletére, továbbá elidegenítésükre vonatkozó egyes szabályokról " +
          "szóló 1993. évi LXXVIII. törvény mindenkor hatályos rendelkezései irányadók.",
        "A szerződés módosítása vagy kiegészítése kizárólag valamennyi Fél által aláírt írásbeli okiratban érvényes. " +
          "Ha a szerződés valamely rendelkezése érvénytelen vagy végrehajthatatlan, az a többi rendelkezés " +
          "érvényességét nem érinti; a Felek az érintett rendelkezést annak gazdasági és jogi céljához legközelebb " +
          "álló érvényes rendelkezéssel pótolják.",
        `A Felek kijelentik, hogy a szerződést elolvasták, tartalmát közösen értelmezték, az megfelel akaratuknak, és azt ` +
          `jóváhagyólag${k.p("tanuk") === "igen" ? ", két tanú előtt" : ""} aláírják. A szerződés ${peldany} egymással szó szerint ` +
          "megegyező eredeti példányban készült.",
      ];
    },
  },
];
