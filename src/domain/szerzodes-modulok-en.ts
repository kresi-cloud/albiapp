/**
 * A szerződésmodulok angol szövege, tájékoztató fordításként.
 *
 * Miért modulonként és nem a kész szövegből: lásd `szerzodes-angol.ts`. Miért
 * külön fájlban, és nem a magyar modul mellett: a magyar katalógus az a szöveg,
 * amit ügyvéddel ellenjegyeztetünk, az angol pedig kifejezetten nem jogi szöveg.
 * Egy fájlban a kettő azt sugallná, hogy az ellenjegyzés erre is vonatkozik.
 *
 * Hogy a kettő mégse csússzon szét, a `szerzodes-fordítás` kapu megköveteli,
 * hogy minden modulkulcshoz legyen itt bejegyzés, címmel és szöveggel, és hogy
 * a kész angol okiratban ne maradjon magyar szó.
 *
 * A kulcsok és a paraméterértékek magyarok maradnak („igen", „tilos"): azok
 * azonosítók, nem mondatok. Amit a bérbeadó maga gépelt be (közlemény,
 * hónapnevek a nyári szünetnél), az szintén úgy marad, ahogy megadta: az az ő
 * adata, nem a szerződés kerete.
 */

import type { Kontextus } from "./szerzodes";
import { MODULOK } from "./szerzodes-modulok";
import {
  felSzovegEn,
  hosszuDatumEn,
  nevsorEn,
  osszegSzovegEn,
  type ModulEn,
} from "./szerzodes-angol";

const HONAPOK_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function kozosKoltseg(k: Kontextus): number {
  return k.jogviszony.kozosKoltsegFt || k.ingatlan.kozosKoltsegFt || 0;
}

/**
 * Magyar szöveges alapértelmezés angol párja, paraméterkulcs szerint.
 *
 * Amit a bérbeadó maga gépelt be, azt nem fordítjuk: az az ő adata. Az
 * alapértelmezés viszont a mi szövegünk, és ha nem írja felül, magyarul állna a
 * fordításban. A kapu megköveteli, hogy minden ékezetes alapértelmezésnek legyen
 * itt párja — különben az első ilyen új paraméterrel visszajönne a hiba.
 */
export const ALAPERTELMEZES_EN: Record<string, string> = {
  szunet_honapok: "July and/or August",
};

/** Paraméter angolul: a saját beírás úgy marad, az alapértelmezés lefordul. */
function pEn(k: Kontextus, kulcs: string): string {
  const ertek = k.p(kulcs);
  const alap = MODULOK.find((modul) => modul.parameterek.some((sor) => sor.kulcs === kulcs))
    ?.parameterek.find((sor) => sor.kulcs === kulcs)?.alapertelmezes;
  if (alap !== undefined && ertek === alap && ALAPERTELMEZES_EN[kulcs] !== undefined) {
    return ALAPERTELMEZES_EN[kulcs];
  }
  return ertek;
}

export const MODULOK_EN: Record<string, ModulEn> = {
  felek: {
    cim: "Contracting parties",
    szoveg: (k) => [
      `${felSzovegEn(k.berbeado)}, hereinafter: the Landlord.`,
      ...k.berlok.map((berlo) => `${felSzovegEn(berlo)}, hereinafter: the Tenant.`),
      k.berlok.length > 1
        ? `The ${k.berlok.length} Tenants are hereinafter referred to jointly as: the Tenants; the Landlord and the Tenants jointly as: the Parties.`
        : "The Landlord and the Tenant are hereinafter referred to jointly as: the Parties.",
    ],
  },

  berlemeny: {
    cim: "The leased property",
    szoveg: (k) => {
      const hanyad = k.p("berlemeny_tulajdoni_hanyad").trim();
      const azonosito = [
        k.ingatlan.helyrajziSzam ? `registered under land registry number ${k.ingatlan.helyrajziSzam}` : "",
        k.ingatlan.alapteruletM2 ? `with a floor area of ${k.ingatlan.alapteruletM2} sqm` : "",
      ]
        .filter(Boolean)
        .join(", ");

      const elso =
        `The Landlord is the sole owner of the residential property ${azonosito ? `${azonosito}, ` : ""}` +
        `located at ${k.ingatlan.cim}` +
        (hanyad ? `, together with the ${hanyad} co-ownership share in the common property` : "") +
        " (hereinafter: the Property).";

      const masodik =
        `The Landlord lets the Property to ${k.v("the Tenant", "the Tenants")} ` +
        `${k.p("berlemeny_butorozott") === "igen" ? "furnished" : "unfurnished"}, for residential purposes only.`;

      const tarolo = k.p("berlemeny_tarolo");
      const harmadik =
        tarolo === "nem_resze"
          ? "The use of the storage unit belonging to the Property is not covered by this agreement; the Parties may agree on it only in a separate agreement."
          : tarolo === "resze"
            ? "The use of the storage unit belonging to the Property is granted to the Tenant in consideration of the rent."
            : "";

      return [elso, masodik, harmadik].filter(Boolean);
    },
  },

  idotartam: {
    cim: "Term of the lease",
    szoveg: (k) => {
      if (!k.jogviszony.vege) {
        return [
          `The lease starts on ${hosszuDatumEn(k.jogviszony.kezdete)} and is concluded for an indefinite term.`,
          "Either Party may terminate the agreement with the notice period set out in the Civil Code and the Housing Act, as provided in point 16.",
        ];
      }
      const sorok = [
        `The lease starts on ${hosszuDatumEn(k.jogviszony.kezdete)} and is concluded for a fixed term ending on ${hosszuDatumEn(k.jogviszony.vege)}.`,
        "Ordinary termination is excluded during the fixed term.",
      ];
      sorok.push(
        k.p("idotartam_meghosszabbitas") === "igen"
          ? "The agreement ends on the last day of the fixed term without any separate declaration, unless the Parties agree in writing on its extension, or the lease becomes one of indefinite term under the provisions of the Civil Code."
          : "The agreement ends on the last day of the fixed term without any separate declaration.",
      );
      return sorok;
    },
  },

  berleti_dij: {
    cim: "Rent and payment",
    szoveg: (k) => {
      const sorok: string[] = [
        `The monthly rent of the Property is ${osszegSzovegEn(k.jogviszony.berletiDijFt)}.`,
      ];

      const szamla = [k.berbeado.bank, k.berbeado.bankszamla].filter(Boolean).join(" ");
      const kozlemeny = k.p("dij_kozlemeny").trim();
      sorok.push(
        `${k.BN} shall pay the rent monthly in advance, no later than day ${k.jogviszony.fizetesiNap} of the ` +
          `current month, by bank transfer to the Landlord's bank account ` +
          `${szamla ? `number ${szamla}` : "as notified by the Landlord"}.` +
          (kozlemeny ? ` The transfer reference must read: "${kozlemeny}".` : "") +
          (k.p("dij_keszpenz") === "igen"
            ? " Payment in cash is valid only against a separate receipt signed by the Landlord."
            : " Payment in cash is not available."),
      );

      sorok.push(
        "Payment is deemed performed when the amount is credited to the Landlord's bank account" +
          (k.p("dij_keszpenz") === "igen"
            ? ", or, in the case of cash payment, when the Landlord issues the receipt"
            : "") +
          ". In the event of delay, the Landlord is entitled to default interest under the Civil Code.",
      );

      sorok.push(
        "The Landlord keeps an electronic record of the payments of rent and utility charges, and makes it " +
          `continuously available to ${k.v("the Tenant", "the Tenants")}. ` +
          `${k.BN} may record ${k.v("his or her", "their")} own payments in the same place, and the Parties settle any differences on that basis.`,
      );

      return sorok;
    },
  },

  indexalas: {
    cim: "Adjustment of the rent",
    szoveg: (k) => {
      const honapSorszam = k.psz("index_honap") || 9;
      const honapNev = HONAPOK_EN[honapSorszam - 1];
      const bazis = k.p("index_bazisev").trim();
      return [
        `If the lease becomes one of indefinite term or is extended, the monthly rent increases with effect from ` +
          `1 ${honapNev} by the percentage corresponding to the part above 100 of the annual average consumer ` +
          `price index published by the Hungarian Central Statistical Office ${bazis ? `for the year ${bazis}` : "for the preceding calendar year"}.`,
        `Thereafter the adjustment takes place on 1 ${honapNev} of each year, based on the annual average consumer ` +
          "price index of the preceding calendar year. An index not exceeding 100 does not reduce the rent.",
      ];
    },
  },

  ovadek: {
    cim: "Security deposit",
    szoveg: (k) => {
      if (k.jogviszony.kaucioFt <= 0) return [];
      const havi = k.jogviszony.berletiDijFt > 0
        ? Math.round((k.jogviszony.kaucioFt / k.jogviszony.berletiDijFt) * 10) / 10
        : 0;
      return [
        `${k.BN} shall pay the Landlord a security deposit of ` +
          `${osszegSzovegEn(k.jogviszony.kaucioFt)}${havi > 0 ? `, corresponding to ${havi} months' rent,` : ""} ` +
          `as security for ${k.v("his or her", "their")} obligations under this agreement.` +
          (k.p("ovadek_birtokbaadas_feltetele") === "igen"
            ? " Payment of the security deposit is a condition of handover and of the delivery of the keys."
            : ""),
        "The security deposit may be used to cover overdue rent, the utility and other costs borne by the Tenant, " +
          "damage attributable to the Tenant or to persons admitted to the Property by the Tenant, deterioration " +
          "beyond the natural wear and tear of proper use, missing or damaged inventory items and keys, and the " +
          "documented cost of any necessary cleaning.",
        "The security deposit bears no interest and may not be set off against the rent, in particular against the " +
          "last month's rent, without the Landlord's prior written consent. If the Landlord satisfies a lawful " +
          `claim from the security deposit during the lease, ${k.B} shall top the deposit up to its original amount ` +
          `within ${k.psz("ovadek_kiegeszites_nap") || 8} days of receiving written notice thereof.`,
      ];
    },
  },

  nyari_szunet: {
    cim: "Suspension of use and reduced rent",
    szoveg: (k) => {
      const hatarido = k.p("szunet_bejelentes_hatarido").trim();
      const dij = k.psz("szunet_dij");
      const ora = k.psz("szunet_ertesites_ora") || 72;
      return [
        [
          `${k.BN} may declare ${k.v("in a written statement", "in a joint written statement")}, no later than ` +
            `${hatarido ? `${hatarido}` : "the last day of the month preceding the suspension"}, that during the whole ` +
            `calendar month of ${pEn(k, "szunet_honapok")} neither ${k.v("he or she", "any of them")} nor any third person ` +
            "will use the Property for living purposes.",
          dij > 0 ? `The rent for a duly declared month is ${osszegSzovegEn(dij)} per month.` : "",
        ]
          .filter(Boolean)
          .join(" "),
        `The reduction is conditional on ${k.B} allowing the meter readings to be recorded at the start and at the ` +
          "end of the suspension, and on the Property in fact not being used during the declared period. " +
          `${k.BN} shall reimburse any consumption shown by the meters that is attributable to ` +
          `${k.v("him or her", "them")} or to a person admitted by ${k.v("him or her", "them")}; standing charges independent ` +
          "of consumption are borne by the Landlord.",
        `${k.BN} may leave ${k.v("his or her", "their")} personal belongings in the Property. The Landlord shall ensure ` +
          "that no person other than those carrying out necessary maintenance enters the Property; the Landlord is " +
          "liable under the general rules for damage caused by the Landlord or by persons acting in the Landlord's " +
          "interest, but assumes no liability for damage arising from burglary, technical failure or unavoidable " +
          "external cause not attributable to the Landlord.",
        `During the suspension the Landlord may enter the Property solely for the purpose of inspection, maintenance, ` +
          `preservation or necessary repair, after notice given at least ${ora} hours in advance. The Landlord may not ` +
          "use the Property for the Landlord's own housing, and may give it into the use of a third person only on the " +
          "basis of a specific written agreement of the Parties to that effect.",
      ].filter(Boolean);
    },
  },

  birtokbaadas: {
    cim: "Handover and documentation",
    szoveg: (k) => [
      `The Property and ${k.psz("kulcs_garnitura") || 1} set${(k.psz("kulcs_garnitura") || 1) === 1 ? "" : "s"} of keys are handed over on ` +
        `${hosszuDatumEn(k.jogviszony.kezdete)}, by signing the handover record attached as Annex 1, provided that ` +
        `${k.B} ${k.v("has", "have")} paid in full all amounts due before the handover.`,
      "The record contains the meter readings, the number of keys, the condition of the Property and its fittings, " +
        "the inventory, any defects observed, and the list of photographs taken and approved by the Parties. The " +
        "record and the photographs form an inseparable part of this agreement.",
    ],
  },

  egyetemleges_felelosseg: {
    cim: "Joint and several liability of the tenants",
    szoveg: (k) => {
      if (k.berlok.length < 2) return [];
      return [
        "The Tenants are jointly and severally liable towards the Landlord for the performance of all payment and " +
          "other obligations arising from this agreement. Performance by any Tenant releases the other Tenants to " +
          "the extent of that performance.",
        "A Tenant may withdraw from the lease only by written agreement of all Parties. The moving out of one Tenant, " +
          "or that Tenant ceasing to use the Property, does not in itself affect the obligations of any Tenant.",
      ];
    },
  },

  kozuzem: {
    cim: "Utility charges and common charges",
    szoveg: (k) => {
      const sorok: string[] = [];
      const mod = k.jogviszony.rezsiElszamolas;

      if (mod === "atalany") {
        sorok.push(
          `From the day of handover until the day the Property is returned, ${k.B} shall pay, in addition to the ` +
            `rent, a monthly utility flat fee of ${osszegSzovegEn(k.jogviszony.rezsiAtalanyFt)}, which covers the ` +
            "utility charges corresponding to ordinary household consumption in the Property. The flat fee is payable " +
            "irrespective of actual consumption, and the Parties do not settle it item by item.",
          "If consumption exceeds ordinary household levels persistently and significantly, the Parties shall consult " +
            "in writing on amending the flat fee.",
        );
      } else if (mod === "kozos_koltsegben") {
        sorok.push(
          `The utility charges of the Property are included in the rent and in the common charges, and ${k.B} ${k.v("does", "do")} not pay them separately.`,
        );
      } else {
        sorok.push(
          `From the day of handover until the day the Property is returned, ${k.B} shall bear, in addition to the ` +
            "rent, all consumption-related utility charges of the Property, in particular water and sewage, " +
            "electricity and natural gas charges, including consumption-related network usage and other supplier items.",
          `The supplier invoices are paid by the Landlord. ${k.BN} shall reimburse the documented amount to the ` +
            `Landlord within ${k.psz("kozuzem_terites_nap") || 5} working days of the electronic delivery of the invoice ` +
            "and of the proof of payment. The Landlord provides the settlement item by item, stating the meter " +
            "readings and the unit prices.",
        );
      }

      const kk = kozosKoltseg(k);
      sorok.push(
        k.p("kozos_koltseg_kit_terhel") === "berlo"
          ? `The condominium common charge is borne by ${k.B}${kk > 0 ? `, amounting at the time of signing to ${osszegSzovegEn(kk)} per month` : ""}. ` +
              "The Landlord shall give written notice of any change in the common charge."
          : "The condominium common charge is borne by the Landlord.",
      );

      if (k.p("hirkozles_hozzajarulas") === "igen") {
        sorok.push(
          "Internet, television or other electronic communications services may be installed only with the Landlord's " +
            `prior written consent; all charges for such services and the cost of their termination are borne by ${k.B}.`,
        );
      }

      return sorok;
    },
  },

  elofizetesek: {
    cim: "Subscriptions",
    szoveg: (k) => {
      if (k.elofizetesek.length === 0) return [];

      const sorok: string[] = [];
      const berbeadoiak = k.elofizetesek.filter((sor) => sor.elofizeto === "berbeado");
      const berloiek = k.elofizetesek.filter((sor) => sor.elofizeto === "berlo");

      const nev = (sor: (typeof k.elofizetesek)[number]) =>
        sor.szolgaltato ? `${sor.megnevezes} (${sor.szolgaltato})` : sor.megnevezes;

      if (berbeadoiak.length > 0) {
        sorok.push(
          "The following electronic communications subscription held in the Landlord's name belongs to the " +
            `Property: ${nevsorEn(berbeadoiak.map(nev))}.`,
          `${k.BN} shall reimburse the Landlord for the charges of these subscriptions, amounting at the time of ` +
            `signing to ${nevsorEn(berbeadoiak.map((sor) => `${nev(sor)}: ${osszegSzovegEn(sor.haviDijFt)} per month`))}. ` +
            "The Landlord shall give written notice of any change in the supplier's charges; the changed charge is " +
            "payable by the Tenant from the month following that notice.",
          "The subscription contract was concluded by the Landlord, only the Landlord may terminate it, and the " +
            `Landlord is liable towards the supplier. ${k.BN} may not bring a claim against the Landlord based on the ` +
            "quality of the service, but the Landlord is obliged to report such a claim to the supplier.",
        );
      }

      if (berloiek.length > 0) {
        sorok.push(
          `The Landlord consents to ${k.B} maintaining the following electronic communications subscription in ` +
            `${k.v("his or her", "their")} own name at the Property: ${nevsorEn(berloiek.map(nev))}. ` +
            `${k.BN} ${k.v("pays", "pay")} the charges of these subscriptions directly to the supplier; the Landlord has no ` +
            "payment obligation in this respect.",
          k.p("elofizetes_berlo_vegen") === "igen"
            ? `${k.BN} shall terminate or transfer to another address any subscription held in ${k.v("his or her", "their")} own ` +
                "name no later than the day the Property is returned, and shall provide proof thereof. Failing that, " +
                "the resulting charges and costs are borne by the Tenant."
            : "The Parties shall agree separately on the fate of the subscription when the Property is returned.",
        );
      }

      sorok.push(
        "The installation of a new electronic communications service, or the extension of an existing one, requires " +
          "the Landlord's prior written consent if it affects the condition of the Property or of the common property.",
      );

      return sorok;
    },
  },

  hasznalat: {
    cim: "Use of the property",
    szoveg: (k) => [
      `${k.BN} shall use the Property, its accessories and its fittings properly, solely for ${k.v("his or her", "their")} own ` +
        "housing purposes, in accordance with the rules of condominium coexistence and with the house rules, and " +
        "shall keep the Property clean and preserve its condition.",
      `${k.BN} ${k.v("is", "are")} liable for the conduct of, and for any damage caused by, ${k.v("himself or herself", "themselves")}, ` +
        `the persons living with ${k.v("him or her", "them")}, ${k.v("his or her", "their")} guests, and the persons admitted to ` +
        "the Property by them. " +
        `${k.BN} shall notify the Landlord without delay of any damage, malfunction, water leak, utility failure, ` +
        "hazard, or circumstance threatening the condition of the Property.",
    ],
  },

  albberlet_lakcim: {
    cim: "Third persons, subletting and address registration",
    szoveg: (k) => {
      const sorok = [
        `${k.BN} may not sublet the Property or any part of it, give it into use, use it as short-term accommodation, ` +
          "or otherwise transfer its use to a third person, without the Landlord's prior written consent.",
        "Cohabitation on a permanent basis or as a way of life, going beyond ordinary hosting of guests, requires the " +
          "Landlord's prior consent, irrespective of any family relationship of the person concerned.",
      ];

      const mod = k.p("lakcim_bejelentes");
      if (mod === "nem") {
        sorok.push("The Landlord does not consent to the Property being registered as an official address.");
      } else {
        const megnevezes = mod === "lakohely" ? "permanent address" : "temporary address";
        sorok.push(
          `The Landlord consents to ${k.B} registering the Property as ${k.v("his or her", "their")} ${megnevezes} for the ` +
            "term of the lease. Such registration creates no additional right of housing or property right whatsoever. " +
            `${k.BN} shall provide proof of cancelling the registration within ${k.psz("lakcim_kijelentkezes_nap") || 8} days ` +
            "of the termination of the lease. The registration of a third person's address requires the Landlord's " +
            "separate prior written consent.",
        );
      }
      return sorok;
    },
  },

  allattartas_dohanyzas: {
    cim: "Pets, smoking and hazardous substances",
    szoveg: (k) => {
      const allat = k.p("allattartas");
      const allatSzoveg =
        allat === "tilos"
          ? "Animals may not be kept or regularly housed in the Property, with the exception of an assistance dog required by law."
          : allat === "hozzajarulassal"
            ? "Animals may be kept in the Property only with the Landlord's prior written consent; no consent is required for an assistance dog required by law."
            : "Animals may be kept in the Property within the limits of the house rules.";

      const dohany = k.p("dohanyzas");
      const dohanySzoveg =
        dohany === "tilos"
          ? "Smoking and the use of electronic cigarettes and heated tobacco products are prohibited throughout the Property."
          : dohany === "erkelyen"
            ? "Smoking and the use of electronic cigarettes and heated tobacco products are prohibited inside the Property; on the balcony they are permitted in accordance with the condominium house rules."
            : "Smoking is governed by the rules of the condominium house rules.";

      return [
        `${allatSzoveg} ${dohanySzoveg}`,
        "It is prohibited to store or use any substance or device that is contrary to law, to an official regulation, " +
          "to the condominium house rules or to the insurance terms, and any flammable or explosive substance beyond " +
          "ordinary household quantities, or any device particularly dangerous to public safety.",
      ];
    },
  },

  karbantartas: {
    cim: "Maintenance, defects and alterations",
    szoveg: (k) => [
      `${k.BN} ${k.v("bears", "bear")} the minor maintenance costs arising from ordinary use of the Property, and in full ` +
        `the cost of remedying any damage caused by ${k.v("him or her", "them")} or by persons admitted by ` +
        `${k.v("him or her", "them")}. The cost of larger works ` +
        "arising from natural wear and tear, from a hidden defect, from a defect of the building structure or of a " +
        "central installation, and of works involving replacement, is borne by the Landlord, provided that the defect " +
        `did not arise for a reason attributable to ${k.v("the Tenant", "the Tenants")}.`,
      `${k.BN} may carry out alterations, renovation, demolition of walls, significant intervention involving drilling ` +
        "or fixing, painting or other value-increasing works in the Property only on the basis of the Landlord's prior " +
        "written consent. The consent must also cover who bears the costs and the procedure to be followed when the " +
        "lease terminates.",
      `${k.BN} shall tolerate the necessary works of preservation, maintenance and repair that are the Landlord's ` +
        "responsibility, provided that the Landlord gives prior notice of them, except in an urgent emergency, and " +
        `organises the work without unnecessary disturbance to ${k.v("the Tenant", "the Tenants")}.`,
    ],
  },

  ellenorzes_leolvasas: {
    cim: "Inspection, meter reading and access",
    szoveg: (k) => {
      const alkalom = k.psz("ellenorzes_alkalom") || 2;
      const ora = k.psz("ellenorzes_ertesites_ora") || 72;
      const sorok = [
        `The Landlord is entitled to inspect the proper use of the Property and the performance of this agreement at ` +
          `most ${alkalom} times a year. The time of the inspection must be agreed at least ${ora} hours in advance, and ` +
          `the inspection must take place between 8 a.m. and 8 p.m., without unnecessary disturbance to ${k.v("the Tenant", "the Tenants")}.`,
      ];

      if (k.jogviszony.rezsiElszamolas === "almero") {
        sorok.push(
          `The Parties read the consumption meters located in the Property monthly, between day ` +
            `${k.psz("leolvasas_tol") || 12} and day ${k.psz("leolvasas_ig") || 15} of the current month, at a time agreed in ` +
            `advance. ${k.BN} shall provide the access needed for the reading at the agreed time. The Parties record ` +
            "the readings in the register kept by the Landlord.",
        );
      }

      sorok.push(
        `In the event of an incident requiring immediate action, an emergency, a burst pipe, fire, gas leak or other ` +
          `urgent circumstance, ${k.B} shall provide access without delay. If this is not possible, the Landlord is ` +
          "entitled to enter the Property to the extent necessary to avert the danger, and shall inform " +
          `${k.v("the Tenant", "the Tenants")} thereof without delay.`,
      );

      return sorok;
    },
  },

  uzleti_hasznalat: {
    cim: "Business use",
    szoveg: () => [
      "Without the Landlord's prior express written consent, the Property may not be registered as the seat, site or " +
        "branch office of a company, sole trader, civil society or other organisation, and no business activity " +
        "involving customer traffic and no accommodation service may be carried out there.",
    ],
  },

  megszunes_felmondas: {
    cim: "Termination of the agreement and notice",
    szoveg: (k) => {
      const felszolitas = k.psz("felszolitas_nap") || 8;
      const magatartas = k.psz("magatartas_felmondas_nap") || 15;
      const sorok = [
        "The agreement terminates on the expiry of the fixed term, by written mutual agreement of the Parties, on the " +
          "destruction of the Property, and by notice given under the law or under this agreement.",
        `Payment default: if ${k.B} ${k.v("does", "do")} not pay the rent or a cost borne by ${k.v("him or her", "them")} when due, ` +
          `the Landlord shall call upon ${k.v("the Tenant", "the Tenants")} in writing to perform, warning of the legal ` +
          `consequences. If ${k.B} ${k.v("does", "do")} not perform within ${felszolitas} days of receiving that notice, the ` +
          `Landlord may terminate the agreement in writing within a further ${felszolitas} days, observing the ` +
          "applicable statutory notice period and termination date.",
        `Breach of conduct or of use: if ${k.B} or a person admitted by ${k.v("him or her", "them")} behaves towards the ` +
          "neighbours or the Landlord in a manner grossly contrary to the requirements of coexistence, or uses the " +
          "Property or the common areas improperly, the Landlord may, after prior written warning, terminate the " +
          `agreement with at least ${magatartas} days' notice, effective on the last day of the month following the ` +
          "notice. No prior warning is required if the conduct is so serious that maintaining the agreement cannot be " +
          `expected; in such a case the notice must be given within ${felszolitas} days of becoming aware of it.`,
        "Other material breach: if a Party fails to perform a material obligation despite a written warning setting an " +
          "appropriate additional deadline, the other Party may terminate the agreement in writing, with effect " +
          "proportionate to the gravity of the breach, in accordance with the Civil Code and the Housing Act.",
        `The Tenant moving out without legal grounds, returning the keys unilaterally or ceasing to use the Property ` +
          `does not in itself terminate the agreement and does not release ${k.v("him or her", "them")} from the payment ` +
          `obligation. The Tenant's obligation subsists at most until the end of the fixed term, or until a new tenant ` +
          "accepted by the Landlord takes possession; the Landlord may not claim double rent for the same period.",
      ];
      if (k.berlok.length > 1) {
        sorok.push(
          "Notice of termination and any other declaration resulting in the termination of the agreement must be " +
            "communicated to each Tenant separately, in a verifiable manner.",
        );
      }
      return sorok;
    },
  },

  visszaadas_elszamolas: {
    cim: "Return of the property and final settlement",
    szoveg: (k) => {
      const nap = k.psz("ovadek_elszamolas_nap") || 15;
      const sorok = [
        `On the termination of the agreement ${k.B} shall return the Property on the day of termination, emptied and ` +
          "cleaned, with all keys and inventory items received, in a condition fit for proper use, save for the natural " +
          "wear and tear of proper use. The Parties draw up a record of the return, containing the meter readings, the " +
          "keys, the inventory, any defects and photographs.",
        `If ${k.B} ${k.v("does", "do")} not return the Property on the day of termination, ${k.B} shall pay, for the whole ` +
          "period of unauthorised use, a use fee of at least the pro rata part of the current monthly rent, the utility " +
          "costs, and any documented damage exceeding those amounts.",
      ];

      if (k.jogviszony.kaucioFt > 0) {
        sorok.push(
          `The Landlord shall account in writing for the security deposit within ${nap} working days of the proper ` +
            "return of the Property and of the settlement based on the invoices available, and shall repay the unused " +
            "part of it. The Landlord may retain a justified, itemised amount to cover utility charges not yet invoiced; " +
            `the Landlord shall account for that amount within ${nap} working days of receiving the final invoice.`,
        );
      }

      sorok.push(
        `${k.BN} may not claim another dwelling or any rehousing from the Landlord in connection with the termination ` +
          `of the lease; ${k.B} shall provide for ${k.v("his or her", "their")} own housing.`,
      );

      return sorok;
    },
  },

  kapcsolattartas: {
    cim: "Contact and service of notices",
    szoveg: (k) => {
      const sorok: string[] = [];
      const elerhetoseg = (fel: { lakcim?: string | null; email?: string | null; telefon?: string | null }) =>
        [
          fel.lakcim,
          fel.email ? `e-mail: ${fel.email}` : null,
          fel.telefon ? `telephone: ${fel.telefon}` : null,
        ]
          .filter(Boolean)
          .join("; ");

      const berbeadoSor = elerhetoseg(k.berbeado);
      if (berbeadoSor) sorok.push(`Contact details of the Landlord: ${berbeadoSor}`);
      for (const berlo of k.berlok) {
        const sor = elerhetoseg(berlo);
        if (sor) sorok.push(`Contact details of tenant ${berlo.nev}: ${sor}`);
      }

      sorok.push(
        "Day-to-day contact and the sending of invoices may take place by e-mail. A payment notice, a notice of " +
          "termination, an amendment of the agreement and any other material declaration affecting the existence or " +
          "the termination of the lease must be communicated in person against a receipt, or by registered mail with " +
          "acknowledgement of receipt; a copy of these may also be sent by e-mail.",
        `Each Party shall give written notice of any change in its contact details within ` +
          `${k.psz("kapcsolat_valtozas_nap") || 5} working days. Failing that, the consequences of an unsuccessful ` +
          "delivery of an item duly sent to the address previously notified are borne by the Party in default.",
      );

      return sorok;
    },
  },

  energetikai_tanusitvany: {
    cim: "Energy performance certificate",
    szoveg: (k) => {
      const azonosito = k.ingatlan.energetikaiAzonosito?.trim();
      return [
        `The Landlord presented the energy performance certificate of the Property${azonosito ? ` (identifier ${azonosito})` : ""}, ` +
          `or a copy of it, to ${k.v("the Tenant", "the Tenants")} before the conclusion of this agreement, and handed it ` +
          `over simultaneously with the signing of this agreement. By signing this agreement ${k.B} ${k.v("acknowledges", "acknowledge")} ` +
          "the presentation and receipt of the certificate.",
      ];
    },
  },

  zaro_rendelkezesek: {
    cim: "Final provisions",
    szoveg: (k) => {
      const megadott = k.psz("peldanyszam");
      const peldany = megadott > 0 ? megadott : k.berlok.length + 1;
      return [
        "Matters not regulated in this agreement are governed in particular by the provisions in force of Act V of " +
          "2013 on the Civil Code and of Act LXXVIII of 1993 on the lease and alienation of dwellings and other premises.",
        "The agreement may be amended or supplemented only in a written document signed by all Parties. If a provision " +
          "of the agreement is invalid or unenforceable, this does not affect the validity of the remaining provisions; " +
          "the Parties shall replace the provision concerned with a valid provision closest to its economic and legal purpose.",
        "The Parties declare that they have read the agreement, have interpreted its contents together, that it " +
          "corresponds to their intention, and that they sign it in approval" +
          `${k.p("tanuk") === "igen" ? ", before two witnesses" : ""}. ` +
          `The agreement was drawn up in ${peldany} original counterparts identical in wording.`,
      ];
    },
  },
};
