import { describe, expect, it } from "vitest";
import { jelszoEgyezik, jelszotHashel } from "../jelszo";

describe("jelszó tárolása", () => {
  it("a helyes jelszót elfogadja", async () => {
    const tarolt = await jelszotHashel("hosszujelszo2026");
    expect(await jelszoEgyezik("hosszujelszo2026", tarolt)).toBe(true);
  });

  it("a rosszat elutasítja", async () => {
    const tarolt = await jelszotHashel("hosszujelszo2026");
    expect(await jelszoEgyezik("hosszujelszo2027", tarolt)).toBe(false);
  });

  it("ugyanaz a jelszó kétszer más tárolt értéket ad, mert külön sót kap", async () => {
    const elso = await jelszotHashel("hosszujelszo2026");
    const masodik = await jelszotHashel("hosszujelszo2026");
    expect(elso).not.toBe(masodik);
  });

  it("a sérült tárolt értéken nem hasal el", async () => {
    expect(await jelszoEgyezik("hosszujelszo2026", "nem-ervenyes")).toBe(false);
    expect(await jelszoEgyezik("hosszujelszo2026", "")).toBe(false);
  });
});
