// The protocol (Greg, 2026-11-06): one- and two-syllable tables, consonant axes.
// Spec: docs/superpowers/specs/2026-11-06-rhyme-protocol-design.md
import { describe, it, expect } from "vitest";
import { consAxis, footRow, sameNucleus } from "../protocol.js";

// "D IH1 | JH AH0 T S" -> steps [{ v, stress, on, coda, weak }]
const step = (chunk, weak = false) => {
  const t = chunk.trim().split(/\s+/);
  const vi = t.findIndex((p) => /\d/.test(p));
  return { v: t[vi].replace(/\d/, ""), stress: +t[vi].match(/\d/)[0], on: t.slice(0, vi), coda: t.slice(vi + 1), weak };
};
const steps = (s) => s.split("|").map((c) => step(c));
const row = (a, b) => footRow(steps(a), steps(b));

describe("consonant axes", () => {
  it("same cluster is 1", () => expect(consAxis(["N", "JH"], ["N", "JH"])).toBe("1"));
  it("one consonant added or dropped anywhere is A (clock / blocks, mat / mast)", () => {
    expect(consAxis(["K"], ["K", "S"])).toBe("A");
    expect(consAxis(["T"], ["S", "T"])).toBe("A");
  });
  it("same length within family is F (JH relates to K through D)", () => {
    expect(consAxis(["JH"], ["K"])).toBe("F");
    expect(consAxis(["T"], ["D"])).toBe("F");
  });
  it("one added and the rest within family is FA (hot / rocks, digits / frigid)", () => {
    expect(consAxis(["T"], ["K", "S"])).toBe("FA");
    expect(consAxis(["T", "S"], ["D"])).toBe("FA");
    expect(consAxis(["K", "S"], ["SH"])).toBe("FA");
  });
  it("anything else is W (two added; nasal against fricative)", () => {
    expect(consAxis([], ["K", "S"])).toBe("W");
    expect(consAxis(["Z"], ["M"])).toBe("W");
    expect(consAxis(["T"], ["SH"])).toBe("W");
  });
});

describe("the final vowel: weak vowels interchangeable", () => {
  it("unstressed AH ~ stressed IH (fa-mous ~ miss) and unstressed AH ~ function-word IH (-son ~ in)", () => {
    expect(sameNucleus(step("M AH0 S"), step("M IH1 S"))).toBe(true);
    expect(sameNucleus(step("Z AH0 N"), step("IH1 N", true))).toBe(true);
  });
  it("two stressed weak vowels differ (bit ~ bet); IY never reduces", () => {
    expect(sameNucleus(step("B IH1 T"), step("B EH1 T"))).toBe(false);
    expect(sameNucleus(step("T IY0"), step("T AH0"))).toBe(false);
  });
});

describe("one-syllable protocol", () => {
  it("perfect: block / glock", () => expect(row("B L AA1 K", "G L AA1 K")).toMatchObject({ row: 1, tags: [] }));
  it("additive: clock / blocks", () => expect(row("K L AA1 K", "B L AA1 K S")).toMatchObject({ row: 2, tags: ["additive"] }));
  it("family: clock / stop", () => expect(row("K L AA1 K", "S T AA1 P")).toMatchObject({ row: 2, tags: ["family"] }));
  it("family + additive coexist: hot / rocks", () => expect(row("HH AA1 T", "R AA1 K S")).toMatchObject({ row: 2, tags: ["family+additive"] }));
  it("wildcard coda is not a rhyme: cat / cash; a different nucleus never is", () => {
    expect(row("K AE1 T", "K AE1 SH")).toBeNull();
    expect(row("K AE1 T", "K IH1 T")).toBeNull();
  });
});

describe("two-syllable protocol", () => {
  it("row 1 perfect: cooler / ruler; famous / Hey miss (weak final vowel)", () => {
    expect(row("K UW1 | L ER0", "R UW1 | L ER0")).toMatchObject({ row: 1 });
    expect(footRow(steps("F EY1 | M AH0 S"), steps("HH EY1 | M IH1 S"))).toMatchObject({ row: 1, tags: [] });
  });
  it("row 2: digits / frigid (coda T S ~ D = family+additive)", () => {
    expect(row("D IH1 | JH AH0 T S", "F R IH1 | JH AH0 D")).toMatchObject({ row: 2, tags: ["family+additive"] });
  });
  it("row 2: reason / demons (internal wildcard, coda additive)", () => {
    expect(row("R IY1 | Z AH0 N", "D IY1 | M AH0 N Z")).toMatchObject({ row: 2, axes: { internal: "W", coda: "A" } });
  });
  it("row 3: Cali / Maui (stressed vowel differs, internal additive, coda same); ever / over", () => {
    expect(row("K AE1 | L IY0", "M AW1 | IY0")).toMatchObject({ row: 3, tags: ["additive"] });
    expect(row("EH1 | V ER0", "OW1 | V ER0")).toMatchObject({ row: 3, tags: [] });
  });
  it("not a rhyme: midget / gotta (row 3 needs coda 1); cooler / later (two wildcards); digits / pigeon (coda W)", () => {
    expect(row("M IH1 | JH AH0 T", "G AA1 | T AH0")).toBeNull();
    expect(row("K UW1 | L ER0", "L EY1 | T ER0")).toBeNull();
    expect(row("D IH1 | JH AH0 T S", "P IH1 | JH AH0 N")).toBeNull();
  });
  it("final vowel must match: reason / city", () => expect(row("R IY1 | Z AH0 N", "S IH1 | T IY0")).toBeNull());
});

describe("three-syllable foot", () => {
  it("cinema / minimum: row 2, additive coda", () => {
    expect(row("S IH1 | N AH0 | M AH0", "M IH1 | N AH0 | M AH0 M")).toMatchObject({ row: 2, tags: ["additive"] });
  });
  it("the middle step may not be a wildcard", () => {
    expect(row("S IH1 | N AH0 | M AH0", "S IH1 | N AH0 | L AH0")).toBeNull();
  });
});

describe("truncated (row 4, tentative; Greg 2026-11-06 evening): stressed vowel AND internal differ, the rest repeats", () => {
  it("pencil / simple: row 4 only when asked for (footRow(q, c, { truncated: true }))", () => {
    expect(row("P EH1 N | S AH0 L", "S IH1 M | P AH0 L")).toBeNull();
    expect(footRow(steps("P EH1 N | S AH0 L"), steps("S IH1 M | P AH0 L"), { truncated: true })).toMatchObject({ row: 4, axes: { v1: "W", internal: "W", coda: "1" } });
  });
  it("limbo / so- so: the final vowel repeats (OW ~ OW), no coda on either side", () => {
    expect(footRow(steps("L IH1 M | B OW0"), steps("S OW1 | S OW1"), { truncated: true })).toMatchObject({ row: 4 });
  });
  it("the coda still may not be a wildcard, and the final vowel must still match", () => {
    expect(footRow(steps("P EH1 N | S AH0 L"), steps("S IH1 M | P AH0 T"), { truncated: true })).toBeNull();
    expect(footRow(steps("P EH1 N | S AH0 L"), steps("S IH1 M | P IY0 L"), { truncated: true })).toBeNull();
  });
  it("a foot that passes rows 1-3 keeps its row", () => {
    expect(footRow(steps("K AE1 | L IY0"), steps("M AW1 | IY0"), { truncated: true })).toMatchObject({ row: 3 });
  });
});
