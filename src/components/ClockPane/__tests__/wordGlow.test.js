// The Rhyme Clock glows the word being sung, not the playhead's cycle (Greg 2026-11-09).
import { describe, it, expect } from "vitest";
import { makeCycles } from "../clockCycles";
import { wordAt, wordGlowSpan, wordsByTime } from "../clockGeometry";

const words = [{ start: 0.5, end: 1.0 }, { start: 1.0, end: 1.6 }, { start: 2.5, end: 3.5 }];
const c = makeCycles([0, 2, 4, 6], 1, 6); // one cycle = 2 s

describe("the word glow", () => {
  it("finds the word under the playhead, none in a gap or before the first", () => {
    expect(wordAt(words, 0.2)).toBe(-1);
    expect(wordAt(words, 0.7)).toBe(0);
    expect(wordAt(words, 1.0)).toBe(1);
    expect(wordAt(words, 2.0)).toBe(-1);
    expect(wordAt(words, 3.0)).toBe(2);
    expect(wordAt(words, 9)).toBe(-1);
    expect(wordAt([], 1)).toBe(-1);
  });
  it("spans the word's stretch of spiral, clipped to the visible turns", () => {
    expect(wordGlowSpan({ word: words[2], cycles: c, W: 0, rings: 3 })).toEqual({ u0: 1.25, u1: 1.75 });
    expect(wordGlowSpan({ word: words[2], cycles: c, W: 1.5, rings: 3 })).toEqual({ u0: 1.5, u1: 1.75 });
    expect(wordGlowSpan({ word: words[2], cycles: c, W: 2, rings: 3 })).toBeNull();
    expect(wordGlowSpan({ word: null, cycles: c, W: 0, rings: 3 })).toBeNull();
  });
  it("orders the timing model's words (a Map by id) by start time", () => {
    const m = new Map([["b", { start: 2, end: 3 }], ["a", { start: 0, end: 1 }]]);
    expect(wordsByTime(m).map((w) => w.start)).toEqual([0, 2]);
    expect(wordsByTime(undefined)).toEqual([]);
  });
  it("with query words only, glows only the query words and their matches (Greg 2026-11-10)", () => {
    const m = new Map([["a", { start: 0, end: 1 }], ["b", { start: 1, end: 2 }], ["c", { start: 2, end: 3 }]]);
    const drawn = new Map([["c", {}], ["a", {}]]);
    expect(wordsByTime(m, drawn).map((w) => w.start)).toEqual([0, 2]);
    expect(wordsByTime(m, null).map((w) => w.start)).toEqual([0, 1, 2]);
  });
});
