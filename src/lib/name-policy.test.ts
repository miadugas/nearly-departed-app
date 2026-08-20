import { describe, expect, it } from "vitest";

import { checkDisplayName, collapseRuns, normalizeForPolicy } from "./name-policy";

const ok = (raw: string | null) => checkDisplayName(raw).ok;

describe("normalizeForPolicy", () => {
  it("folds case, accents, padding and leetspeak onto one key", () => {
    expect(normalizeForPolicy("Mia")).toBe("mia");
    expect(normalizeForPolicy("Mía")).toBe("mia");
    expect(normalizeForPolicy("M I A")).toBe("mia");
    expect(normalizeForPolicy("f.u.c.k")).toBe("fuck");
    expect(normalizeForPolicy("5H1T")).toBe("shit");
    expect(collapseRuns(normalizeForPolicy("ffuucckk"))).toBe("fuck");
  });
});

describe("checkDisplayName", () => {
  it("lets ordinary names through unchanged", () => {
    for (const name of ["Mia", "Morticia", "Jean-Luc", "Ana María", "月子"]) {
      const verdict = checkDisplayName(name);
      expect(verdict.ok, name).toBe(true);
      if (verdict.ok) expect(verdict.name).toBe(name);
    }
  });

  it("treats empty and null as clearing the name", () => {
    expect(checkDisplayName(null)).toEqual({ ok: true, name: null });
    expect(checkDisplayName("   ")).toEqual({ ok: true, name: null });
  });

  it("trims surrounding whitespace", () => {
    expect(checkDisplayName("  Mia  ")).toEqual({ ok: true, name: "Mia" });
  });

  it("rejects one-character names", () => {
    expect(ok("M")).toBe(false);
  });

  it("rejects reserved and impersonating names", () => {
    for (const name of ["admin", "Admin", "SUPPORT", "Nearly Departed", "m0derator"]) {
      expect(ok(name), name).toBe(false);
    }
  });

  it("rejects contact details", () => {
    expect(ok("visit thing.com")).toBe(false);
    expect(ok("me@example.com")).toBe(false);
    expect(ok("call 5551234567")).toBe(false);
  });

  it("rejects slurs and vulgarity, including disguised spellings", () => {
    for (const name of ["fuck", "F U C K", "sh1t", "b@stard", "n1gger", "xXfaggotXx"]) {
      expect(ok(name), name).toBe(false);
    }
  });

  it("rejects hate movements and political sloganeering", () => {
    for (const name of [
      "Trump",
      "TRUMP",
      "MAGA",
      "maga",
      "QAnon",
      "Nazi",
      "heil hitler",
      "White Power",
      "Stop The Steal",
      "1488",
      "Proud Boys",
    ]) {
      expect(ok(name), name).toBe(false);
    }
  });

  it("does not block real names that merely contain a flagged fragment", () => {
    // The whole point of exact-vs-anywhere matching: a cemetery app must not
    // reject the people buried in it.
    for (const name of [
      "Emily Dickinson",
      "Dick Van Dyke",
      "Magali",
      "Magazine Editor",
      "Cassandra",
      "Raccoon",
      "Connie",
      "Trumpeter Swan",
      "Hancock",
      "Japan Fan",
      "Assumpta",
    ]) {
      expect(ok(name), name).toBe(true);
    }
  });

  it("requires at least some letters", () => {
    expect(ok("123456")).toBe(false);
  });
});
