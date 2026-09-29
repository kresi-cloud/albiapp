/**
 * A kétnyelvű szerződéspéldány, és a kétoldali döntés mögötte.
 *
 * A tájékoztató fordítás eddig is elkészült, de az külön melléklet: két papír,
 * és a bérlő azt írja alá, amit nem olvas. A kétnyelvű példány egyetlen okirat,
 * amiben minden pont ott áll mindkét nyelven — kiadni viszont csak akkor
 * adjuk ki, ha mindenki támogatja, akinek fiókja van.
 *
 * Amit ez a próba megfog, és más nem: a kérdés tényleg **mindkét fél lapján**
 * ott van és ugyanazt mondja, a példány csak a teljes egyetértés után
 * tölthető le, egy kifogás egymagában megállítja, és a véglegesítéskor
 * befagyott példány ugyanaz marad, mint ami a tervezetből jött.
 */

import { ALAP, all, belep, magyarra, mindetKinyit, tullogas } from "./kozos.mjs";

export const nev = "Kétnyelvű példány";

async function ujSzerzodestKeszit(oldal) {
  await oldal.goto(`${ALAP}/dokumentumok`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  const doboz = oldal
    .locator("section")
    .filter({ hasText: "Ferencvárosi garzon" })
    .filter({ has: oldal.getByRole("button", { name: "Új szerződéstervezet" }) })
    .first();
  await doboz.getByRole("button", { name: "Új szerződéstervezet" }).first().click();
  await oldal.waitForURL(/\/szerzodesek\/.+/, { timeout: 20000 });
  return oldal.url().split("/").pop();
}

async function mentes(oldal, muvelet) {
  const valasz = oldal.waitForResponse((v) => v.request().method() === "POST");
  await muvelet();
  await valasz;
  await oldal.waitForLoadState("networkidle");
}

function dontes(oldal) {
  return oldal.locator('[data-szakasz="ketnyelvu"]').first();
}

/** Nyilatkozat: a gomb értéke dönt, nem a felirata. */
async function nyilatkozik(oldal, hely, tamogatja, indoklas = "") {
  const doboz = dontes(oldal);
  if (indoklas) await doboz.locator('textarea[name="indoklas"]').fill(indoklas);
  await mentes(oldal, () =>
    doboz.locator(`button[name="tamogatja"][value="${tamogatja ? "igen" : "nem"}"]`).first().click(),
  );
  await oldal.goto(hely);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
}

async function letoltes(oldal, ut) {
  const valasz = await oldal.request.get(`${ALAP}${ut}`);
  return { kod: valasz.status(), szoveg: await valasz.text() };
}

async function veglegesit(oldal, id) {
  await oldal.goto(`${ALAP}/szerzodesek/${id}`);
  await oldal.waitForLoadState("networkidle");
  for (let probalkozas = 0; probalkozas < 2; probalkozas++) {
    const jelolo = oldal.locator('input[name="azonossagEllenorizve"]');
    if ((await jelolo.count()) === 0) break;
    await jelolo.first().check();
    await oldal.getByRole("button", { name: /^Véglegesítés/ }).first().click();
    await oldal.waitForLoadState("networkidle");
    await oldal.waitForTimeout(500);
  }
  all(
    (await oldal.locator('input[name="azonossagEllenorizve"]').count()) === 0,
    "a szerződés véglegesítve lett",
  );
}

export async function futtat(oldal) {
  // --- 1. Mindenki támogatja
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  const id = await ujSzerzodestKeszit(oldal);
  const berbeadoiLap = `${ALAP}/szerzodesek/${id}`;
  await mindetKinyit(oldal);

  all((await dontes(oldal).count()) > 0, "a szerződés lapján ott a kétnyelvű kérdés");
  all(
    (await dontes(oldal).innerText()).includes("Még nem mindenki nyilatkozott"),
    "kiindulás: még senki nem nyilatkozott",
  );
  all((await tullogas(oldal)) <= 1, "a kétnyelvű szakasz elfér 360 képponton");

  // Önpróba: amíg nincs egyetértés, a kétnyelvű példány nincs meg.
  const elotte = await letoltes(oldal, `/szerzodesek/${id}/letoltes?nyelv=ket`);
  all(elotte.kod === 404, `egyetértés nélkül nincs kétnyelvű példány (${elotte.kod})`);

  await nyilatkozik(oldal, berbeadoiLap, true);
  all(
    (await dontes(oldal).innerText()).includes("A te válaszod: támogatod"),
    "a bérbeadó nyilatkozata rögzül",
  );
  all(
    (await dontes(oldal).innerText()).includes("Még nem mindenki nyilatkozott"),
    "de egymagában nem dönt: a bérlőre még várunk",
  );
  const felutan = await letoltes(oldal, `/szerzodesek/${id}/letoltes?nyelv=ket`);
  all(felutan.kod === 404, "és a példány sincs meg egy fél nyilatkozatára");

  // A kérdés a bérlő lapján is ott van, ugyanazzal a szöveggel.
  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  const berloiLap = `${ALAP}/berlo/dokumentumok`;
  await oldal.goto(berloiLap);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all((await dontes(oldal).count()) > 0, "a bérlő is megkapja a kérdést a dokumentumtárában");
  all((await tullogas(oldal)) <= 1, "és a kérdés az ő lapján is elfér 360 képponton");

  await nyilatkozik(oldal, berloiLap, true);
  all(
    (await dontes(oldal).innerText()).includes("Mindenki támogatja"),
    "mindkét fél támogatásával eldőlt",
  );

  // --- A kétnyelvű példány
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  const tervezetbol = await letoltes(oldal, `/szerzodesek/${id}/letoltes?nyelv=ket`);
  all(tervezetbol.kod === 200, "a kétnyelvű példány letölthető");
  all(
    tervezetbol.szoveg.includes("LAKÁSBÉRLETI SZERZŐDÉS / RESIDENTIAL LEASE AGREEMENT"),
    "a fejléce mindkét nyelven megszólal",
  );
  all(
    tervezetbol.szoveg.includes("a magyar szöveg az irányadó") &&
      tervezetbol.szoveg.includes("the Hungarian text prevails"),
    "és mindkét nyelven kimondja, hogy a magyar az irányadó",
  );
  all(
    tervezetbol.szoveg.includes("A Bérlemény havi bérleti díja") &&
      tervezetbol.szoveg.includes("The monthly rent"),
    "egy okiratban áll a magyar és az angol szöveg",
  );

  // A számozás a magyarból következik, tehát a két nyelv ugyanazt a pontot
  // ugyanazon a sorszámon viszi: minden sorszám kétszer szerepel.
  const sorszamok = (tervezetbol.szoveg.match(/^(\d+)\. /gm) ?? []).map((sor) => sor.trim());
  const szamlalo = new Map();
  for (const sorszam of sorszamok) szamlalo.set(sorszam, (szamlalo.get(sorszam) ?? 0) + 1);
  const egyszeresek = [...szamlalo.entries()].filter(([, darab]) => darab < 2);
  all(szamlalo.size > 10, `van elég pont a kétnyelvű példányban (${szamlalo.size})`);
  all(
    egyszeresek.length === 0,
    `minden pont mindkét nyelven megvan (${egyszeresek[0]?.[0] ?? "-"})`,
  );

  // --- Véglegesítés: a kétnyelvű példány is befagy
  await veglegesit(oldal, id);
  const veglegesbol = await letoltes(oldal, `/szerzodesek/${id}/letoltes?nyelv=ket`);
  all(veglegesbol.kod === 200, "a véglegesített szerződés kétnyelvű példánya is letölthető");
  all(
    veglegesbol.szoveg === tervezetbol.szoveg,
    "a befagyasztott példány ugyanaz, mint ami a tervezetből jött",
  );

  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  const berlonel = await letoltes(oldal, `/szerzodesek/${id}/letoltes?nyelv=ket`);
  all(berlonel.kod === 200, "a bérlő is letölti a kétnyelvű példányt");
  all(berlonel.szoveg === veglegesbol.szoveg, "és ugyanazt kapja, mint a bérbeadó");

  // --- 2. Egy kifogás egymagában dönt
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  const masik = await ujSzerzodestKeszit(oldal);
  const masikLap = `${ALAP}/szerzodesek/${masik}`;
  await mindetKinyit(oldal);
  await nyilatkozik(oldal, masikLap, true);

  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await oldal.goto(berloiLap);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  // Indoklás nélkül nincs kifogás: ezt a kiszolgáló tartja be.
  await mentes(oldal, () =>
    dontes(oldal).locator('button[name="tamogatja"][value="nem"]').first().click(),
  );
  const hibas = await dontes(oldal)
    .locator('[data-uzenet="hiba"]')
    .first()
    .waitFor({ state: "visible", timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  all(hibas, "a kifogást indoklás nélkül nem fogadjuk el");

  await nyilatkozik(oldal, berloiLap, false, "Nem beszelek angolul, magyarul akarom alairni.");
  all(
    (await dontes(oldal).innerText()).includes("kifogásolta"),
    "a kifogás után nem készül kétnyelvű példány",
  );

  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  const kifogasolt = await letoltes(oldal, `/szerzodesek/${masik}/letoltes?nyelv=ket`);
  all(kifogasolt.kod === 404, `a kifogásolt szerződéshez nincs kétnyelvű példány (${kifogasolt.kod})`);
  await oldal.goto(masikLap);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);
  all(
    (await dontes(oldal).innerText()).includes("Nem beszelek angolul"),
    "és a bérbeadó látja, ki mit kifogásolt",
  );
}
