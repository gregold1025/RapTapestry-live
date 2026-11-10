// Query syllables against the groove (Greg 2026-11-10): each matched syllable of a query word or a
// match, in the current cycle, is a small tick in the drum ring at its vowel's onset, in its color.
import { describe, it, expect } from "vitest";
import { makeCycles } from "../clockCycles";
import { syllableTicks } from "../clockMarks";

const c = makeCycles([0, 2, 4, 6], 1, 6); // one cycle = 2 s
const timingWords = new Map([
  ["a", { start: 0.4, end: 1.2, syls: [{ k: 0, start: 0.4, end: 0.8, vStart: 0.5, vEnd: 0.8 }, { k: 1, start: 0.8, end: 1.2, vStart: 0.9, vEnd: 1.2 }] }],
  ["b", { start: 1.4, end: 1.8, syls: [{ k: 0, start: 1.4, end: 1.8, vStart: 1.5, vEnd: 1.8 }] }],
  ["c", { start: 2.4, end: 2.8, syls: [{ k: 0, start: 2.4, end: 2.8, vStart: 2.5, vEnd: 2.8 }] }],
]);

describe("the syllable ticks", () => {
  it("are the query syllables of the current cycle, at their vowel onset, in their query's color", () => {
    const visuals = new Map([["a", { color: "#ff0000", vi0: 1, vi1: 1 }], ["c", { color: "#00ff00", vi0: 0, vi1: 0 }]]);
    expect(syllableTicks({ timingWords, visuals, cycles: c, cycle: 0 })).toEqual([{ frac: 0.45, color: "#ff0000" }]);
    expect(syllableTicks({ timingWords, visuals, cycles: c, cycle: 1 })).toEqual([{ frac: 0.25, color: "#00ff00" }]);
  });
  it("leave out words that are not query words or matches", () => {
    expect(syllableTicks({ timingWords, visuals: new Map(), cycles: c, cycle: 0 })).toEqual([]);
  });
});
