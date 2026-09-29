import { describe, expect, it } from "vitest";
import {
  allapota,
  alairtatEllenoriz,
  biztonsagosNev,
  modosithato,
  tipusATartalombol,
  MAX_MERET_BAJT,
} from "../alairt";

const pdf = () => new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

describe("az aláírt példány ellenőrzése", () => {
  it("a PDF-et és a fényképet elfogadja", () => {
    expect(alairtatEllenoriz({ tipus: "application/pdf", meretBajt: 1000 })).toBeNull();
    expect(alairtatEllenoriz({ tipus: "image/jpeg", meretBajt: 1000 })).toBeNull();
  });

  it("az üres fájlt nem", () => {
    expect(alairtatEllenoriz({ tipus: "application/pdf", meretBajt: 0 })?.kulcs).toBe(
      "alairt.hiba.ures",
    );
  });

  it("a korlátnál nagyobbat sem", () => {
    expect(
      alairtatEllenoriz({ tipus: "application/pdf", meretBajt: MAX_MERET_BAJT + 1 })?.kulcs,
    ).toBe("alairt.hiba.nagy");
  });

  it("és a futtatható vagy irodai formátumot sem: azt a másik fél nyitná meg", () => {
    expect(alairtatEllenoriz({ tipus: "text/html", meretBajt: 1000 })?.kulcs).toBe(
      "alairt.hiba.tipus",
    );
    expect(alairtatEllenoriz({ tipus: "image/svg+xml", meretBajt: 1000 })?.kulcs).toBe(
      "alairt.hiba.tipus",
    );
  });

  it("a típus a tartalomból jön, nem a bejelentésből", () => {
    expect(tipusATartalombol(pdf())).toBe("application/pdf");
    expect(tipusATartalombol(new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c]))).toBeNull();
  });

  it("a letöltött név nem a feltöltöttből készül, és a kiterjesztés a típusból", () => {
    expect(biztonsagosNev("application/pdf")).toBe("alairt-berleti-szerzodes.pdf");
    expect(biztonsagosNev("image/jpeg")).toBe("alairt-berleti-szerzodes.jpg");
  });
});

describe("a rögzítés", () => {
  it("amíg nincs rögzítve, cserélhető és törölhető", () => {
    expect(allapota(null)).toBe("nincs");
    expect(allapota({ rogzitve: null })).toBe("feltoltve");
    expect(modosithato({ rogzitve: null })).toBe(true);
  });

  it("rögzítés után viszont nem — ettől ér valamit", () => {
    const rogzitett = { rogzitve: new Date("2026-09-01T00:00:00.000Z") };
    expect(allapota(rogzitett)).toBe("rogzitve");
    expect(modosithato(rogzitett)).toBe(false);
  });
});
