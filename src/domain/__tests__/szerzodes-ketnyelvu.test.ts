import { describe, expect, it } from "vitest";
import {
  allapota,
  kifogasok,
  kikreVarunk,
  nyilatkozatotEllenoriz,
  type Nyilatkozat,
} from "../szerzodes-ketnyelvu";

const tamogat = (id: string): Nyilatkozat => ({
  felhasznaloId: id,
  tamogatja: true,
  indoklas: "",
});
const kifogasol = (id: string, indoklas = "Nem beszélek angolul."): Nyilatkozat => ({
  felhasznaloId: id,
  tamogatja: false,
  indoklas,
});

describe("a kétnyelvű példány kétoldali döntése", () => {
  it("amíg valaki nem nyilatkozott, nem mondjuk, hogy eldőlt", () => {
    expect(allapota(["b", "t1", "t2"], [tamogat("b"), tamogat("t1")])).toBe("varakozik");
    expect(kikreVarunk(["b", "t1", "t2"], [tamogat("b"), tamogat("t1")])).toEqual(["t2"]);
  });

  it("csak akkor készül el, ha mindenki támogatja", () => {
    expect(allapota(["b", "t1"], [tamogat("b"), tamogat("t1")])).toBe("tamogatott");
  });

  it("egy kifogás egymagában dönt", () => {
    // A lakótárs nem szavazhatja le azt, aki nem kéri.
    expect(allapota(["b", "t1", "t2"], [tamogat("b"), tamogat("t1"), kifogasol("t2")])).toBe(
      "kifogasolt",
    );
    expect(kifogasok(["b", "t1", "t2"], [kifogasol("t2")])[0]?.felhasznaloId).toBe("t2");
  });

  it("aki nincs a megkérdezettek közt, annak a szava sem dönt", () => {
    // A jogviszonyról levett bérlő nyilatkozata ott marad, de a lakásba már nem
    // ő megy haza — ugyanaz az elv, mint a látogatásnál.
    expect(allapota(["b", "t1"], [tamogat("b"), tamogat("t1"), kifogasol("regi")])).toBe(
      "tamogatott",
    );
  });

  it("ha egyetlen bérlőnek sincs fiókja, a bérbeadó válasza dönt", () => {
    // Itt az üres kör nem baj: a következmény a bérlő javára szól, és a magyar
    // szöveg marad az irányadó. A látogatásnál ez fordítva van, mert ott az
    // üres várólistából a bérbeadó bejutása következne.
    expect(allapota(["b"], [tamogat("b")])).toBe("tamogatott");
    expect(allapota(["b"], [])).toBe("varakozik");
  });

  it("a kifogás indoklás nélkül nincs", () => {
    expect(nyilatkozatotEllenoriz(false, "   ")?.kulcs).toBe("ketnyelvu.hiba.indoklas");
    expect(nyilatkozatotEllenoriz(false, "Nem beszélek angolul.")).toBeNull();
    // Támogatáshoz viszont nem kell indoklás.
    expect(nyilatkozatotEllenoriz(true, "")).toBeNull();
  });
});
