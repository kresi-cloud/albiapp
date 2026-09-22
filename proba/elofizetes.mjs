/**
 * Előfizetések: bérbeadói felvétel és bérlői jóváhagyás.
 *
 * Amit ez a próba megfog, és más nem: a jóváhagyás tényleg kiszolgálói
 * művelet, a bérlő a saját jogviszonyának előfizetését látja, és — a lényeg —
 * a jóváhagyás után tényleg megjelenik a havi előírás a befizetéseknél. Ezt a
 * láncot (előfizetés → jóváhagyás → előírás → egyeztetés) sem a típusellenőrzés,
 * sem a fordítás nem nézi meg.
 *
 * Minden futáskor új előfizetést vesz fel a saját jelével, tehát tetszőleges
 * sokszor futtatható.
 */

import { ALAP, all, belep, magyarra, mindetKinyit, tullogas } from "./kozos.mjs";

export const nev = "Előfizetések";

const JEL = String(Date.now()).slice(-6);
const NEV = `Próba-internet ${JEL}`;
const DIJ = 4321;

async function lista(oldal) {
  await oldal.goto(`${ALAP}/elofizetesek`);
  await oldal.waitForLoadState("networkidle");
}

/** A bérbeadó felvesz egy előfizetést. */
async function berbeadoFelvesz(oldal) {
  await lista(oldal);
  all((await tullogas(oldal)) <= 1, "az előfizetések lapja elfér 360 képponton");

  // A jóváhagyott előfizetés a „rendezett" csokorban áll összecsukva: a
  // kinyitás után is csak a szövege olvasható, láthatónak a böngésző nem
  // mondja, ezért a darabszámra állítunk.
  await mindetKinyit(oldal);
  all(
    (await oldal.locator("li").filter({ hasText: "Telekom 500/100 internet" }).count()) > 0,
    "a példaadat jóváhagyott előfizetése is ott van a lapon",
  );
  all(
    (await oldal.getByText("Kábeltévé alapcsomag").count()) > 0,
    "a jóváhagyásra váró előfizetés elöl áll",
  );
  const urlap = oldal.locator('form:has(input[name="megnevezes"])').first();
  all((await urlap.count()) > 0, "van űrlap előfizetés felvételéhez");

  // Név nélkül nem mentünk: ezt a kiszolgáló mondja ki, ezért a böngésző
  // kötelezőség-jelzőjét levesszük.
  const nevMezo = urlap.locator('input[name="megnevezes"]');
  await nevMezo.evaluate((mezo) => mezo.removeAttribute("required"));
  await urlap.locator('input[name="haviDijFt"]').fill(String(DIJ));
  await urlap.getByRole("button", { name: "Felvétel" }).click();
  await oldal.getByText("Adj nevet az előfizetésnek").first().waitFor({ timeout: 15000 });
  all(true, "név nélkül nem mentjük el az előfizetést");

  all(
    (await oldal.locator('form:has(input[name="megnevezes"]) input[name="haviDijFt"]').first().inputValue()) ===
      String(DIJ),
    "az elutasítás után a begépelt havi díj megmarad",
  );

  await oldal.locator('form:has(input[name="megnevezes"]) input[name="megnevezes"]').first().fill(NEV);
  await oldal
    .locator('form:has(input[name="megnevezes"])')
    .first()
    .getByRole("button", { name: "Felvétel" })
    .click();
  await oldal.getByText("A bérlő most kapja meg jóváhagyásra").first().waitFor({ timeout: 15000 });
  all(true, "a felvett előfizetés a bérlőhöz kerül jóváhagyásra");

  await lista(oldal);
  const kartya = oldal.locator("li").filter({ hasText: NEV }).first();
  all(await kartya.isVisible(), "az új előfizetés megjelenik a listán");
  // Az állapot nagybetűsen jelenik meg (CSS), ezért kisbetűre hozva vetjük
  // össze: a próba a szöveget nézi, nem a betűméretet.
  all(
    (await kartya.innerText()).toLowerCase().includes("jóváhagyásra vár"),
    "a friss előfizetés jóváhagyásra vár",
  );
  all(
    (await kartya.innerText()).includes("Amíg nincs jóváhagyva, nem írunk elő belőle semmit"),
    "a lap kimondja, hogy jóváhagyás előtt nincs előírás",
  );
}

/** A bérlő jóváhagyja, és ettől lesz belőle előírás. */
async function berloJovahagy(oldal) {
  await lista(oldal);
  all((await tullogas(oldal)) <= 1, "a bérlői előfizetéslap elfér 360 képponton");

  const kartya = oldal.locator("li").filter({ hasText: NEV }).first();
  all(await kartya.isVisible(), "a bérlő látja a bérbeadó új előfizetését");

  await kartya.getByRole("button", { name: "Rendben, jóváhagyom" }).click();

  // Sikerüzenetet szándékosan nem várunk: a jóváhagyott előfizetés átkerül a
  // rendezettek közé, tehát az űrlap a válasszal együtt eltűnik. Az eredményt
  // a kártya új állapota mutatja, és azt nézzük meg.
  await oldal.waitForTimeout(500);
  await lista(oldal);
  await mindetKinyit(oldal);
  const utana = oldal.locator("li").filter({ hasText: NEV }).first();
  all(
    (await utana.innerText()).includes("Jóváhagytad"),
    "a jóváhagyás után a saját nyilatkozat áll a kártyán",
  );
  all(
    (await utana.locator('button:text("Rendben, jóváhagyom")').count()) === 0,
    "ugyanarról kétszer nem nyilatkozik",
  );
  all(
    (await utana.innerText()).toLowerCase().includes("jóváhagyva"),
    "az előfizetés állapota jóváhagyott lett",
  );
}

/**
 * A jóváhagyás után a havi díj tényleg előírás lesz.
 *
 * Ez a funkció lényege: enélkül a jóváhagyás csak egy pipa lenne a lapon.
 */
async function eloirasLesz(oldal) {
  await oldal.goto(`${ALAP}/befizetesek`);
  await oldal.waitForLoadState("networkidle");
  await mindetKinyit(oldal);

  const talalat = oldal.getByText(`Előfizetés: ${NEV}`).first();
  await talalat.waitFor({ timeout: 15000 });
  all(true, "a jóváhagyott előfizetésből havi előírás lett");
}

/** A bérlő saját nevén lévő előfizetéséből nem lesz előírás. */
async function berloSajatja(oldal) {
  await lista(oldal);
  await mindetKinyit(oldal);
  const kartya = oldal.locator("li").filter({ hasText: "Vodafone otthoni net" }).first();
  all(await kartya.count() > 0, "a bérlő saját előfizetése is szerepel a bérbeadónál");
  all(
    (await kartya.innerText()).includes("A bérlő közvetlenül a szolgáltatónak fizet"),
    "a bérlő saját előfizetéséből nem lesz havi előírás, és ezt ki is írjuk",
  );
}

export async function futtat(oldal) {
  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await berbeadoFelvesz(oldal);
  await berloSajatja(oldal);

  await belep(oldal, "anna@pelda.hu");
  await magyarra(oldal);
  await berloJovahagy(oldal);

  await belep(oldal, "berbeado@pelda.hu");
  await magyarra(oldal);
  await eloirasLesz(oldal);
}
