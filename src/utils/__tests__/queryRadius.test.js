import { describe, it, expect } from "vitest";
import { withinRadius, showsMatch } from "../queryRadius";

// a song at 2 s per bar, from t = 0: bar position = t / 2
const song = {
  barPosition: (t) => ({ bar: Math.floor(t / 2), phase: (t / 2) % 1 }),
  byId: new Map([["5-0", { start: 10 }], ["5-1", { start: 10.5 }]]),
  lines: [, , , , , { words: [{ start: 9 }, { start: 10 }] }],
};
const wq = { kind: "word", anchorIds: ["5-0", "5-1"], types: new Set(["perfect"]), radius: 2 };

describe("queryRadius", () => {
  it("whole song when the radius is null", () => {
    expect(withinRadius(song, { ...wq, radius: null }, 1000)).toBe(true);
  });
  it("a word query counts whole bars from its first word's bar, both ways (bar 5, radius 2: bars 3 to 7)", () => {
    expect(withinRadius(song, wq, 15.9)).toBe(true);  // bar 7
    expect(withinRadius(song, wq, 6)).toBe(true);     // bar 3
    expect(withinRadius(song, wq, 16)).toBe(false);   // bar 8
    expect(withinRadius(song, wq, 5.8)).toBe(false);  // bar 2
  });
  it("the next bar counts as one bar away even a little past a full bar (vibrations ~ inspiration, 1.03 bars)", () => {
    expect(withinRadius(song, { ...wq, radius: 1 }, 10 + 2 * 1.03)).toBe(true);
  });
  it("a line query counts from the line's first word (bar 4, radius 1: bars 3 to 5)", () => {
    const lq = { kind: "line", lineIdx: 5, types: new Set(["perfect"]), radius: 1 };
    expect(withinRadius(song, lq, 11.9)).toBe(true);
    expect(withinRadius(song, lq, 12)).toBe(false);
  });
  it("showsMatch = the query's types and its radius", () => {
    expect(showsMatch(song, wq, { type: "perfect", start: 12 })).toBe(true);
    expect(showsMatch(song, wq, { type: "family", start: 12 })).toBe(false);
    expect(showsMatch(song, wq, { type: "perfect", start: 30 })).toBe(false);
  });
});
