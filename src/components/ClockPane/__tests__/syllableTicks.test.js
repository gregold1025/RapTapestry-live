// Query syllables against the groove (Greg 2026-11-10): each matched syllable of a query word or a
// match, in the current cycle, is a small tick in the drum ring at its vowel's onset, in its color.
import { describe, it, expect } from "vitest";
import { makeCycles } from "../clockCycles";
import { syllableTicks, tickMode, TICK_MODES } from "../clockMarks";

const c = makeCycles([0, 2, 4, 6], 1, 6); // one cycle = 2 s
const timingWords = new Map([
  ["a", { start: 0.4, end: 1.2, syls: [{ k: 0, start: 0.4, end: 0.8, vStart: 0.5, vEnd: 0.8, vowel: "EY" }, { k: 1, start: 0.8, end: 1.2, vStart: 0.9, vEnd: 1.2, vowel: "AH" }] }],
  ["b", { start: 1.4, end: 1.8, syls: [{ k: 0, start: 1.4, end: 1.8, vStart: 1.5, vEnd: 1.8 }] }],
  ["c", { start: 2.4, end: 2.8, syls: [{ k: 0, start: 2.4, end: 2.8, vStart: 2.5, vEnd: 2.8, vowel: "IY" }] }],
]);

describe("the syllable ticks", () => {
  it("are the query syllables of the current cycle, at their vowel onset, in their query's color", () => {
    const visuals = new Map([["a", { color: "#ff0000", vi0: 1, vi1: 1 }], ["c", { color: "#00ff00", vi0: 0, vi1: 0 }]]);
    // each tick also says its word and syllable, for the hover (Greg 2026-11-10)
    expect(syllableTicks({ timingWords, visuals, cycles: c, cycle: 0 })).toEqual([{ frac: 0.45, color: "#ff0000", wordId: "a", k: 1, n: 2, vowel: "AH" }]);
    expect(syllableTicks({ timingWords, visuals, cycles: c, cycle: 1 })).toEqual([{ frac: 0.25, color: "#00ff00", wordId: "c", k: 0, n: 1, vowel: "IY" }]);
  });
  it("leave out words that are not query words or matches", () => {
    expect(syllableTicks({ timingWords, visuals: new Map(), cycles: c, cycle: 0 })).toEqual([]);
  });
  // four choices (Greg 2026-11-10): none, matching syllables, full query words, all syllables
  const visuals = new Map([["a", { color: "#ff0000", vi0: 1, vi1: 1 }]]);
  const at = (mode) => syllableTicks({ timingWords, visuals, cycles: c, cycle: 0, mode, inkColor: "#999999" }).map((t) => [t.wordId, t.k, t.color]);
  it("offers none, matching, full query words and all syllables", () => {
    expect(TICK_MODES.map((m) => m.value)).toEqual(["none", "matching", "words", "all"]);
  });
  it("none: no ticks", () => expect(at("none")).toEqual([]));
  it("matching: only the syllables the match covers", () => expect(at("matching")).toEqual([["a", 1, "#ff0000"]]));
  it("full query words: every syllable of a query word or match", () => expect(at("words")).toEqual([["a", 0, "#ff0000"], ["a", 1, "#ff0000"]]));
  it("all: every syllable, words outside the queries in the clock's word color", () => {
    expect(at("all")).toEqual([["a", 0, "#ff0000"], ["a", 1, "#ff0000"], ["b", 0, "#999999"]]);
  });
  it("reads an older on / off setting as matching / none", () => {
    expect([tickMode(true), tickMode(false), tickMode("words"), tickMode(undefined)]).toEqual(["matching", "none", "words", "matching"]);
  });
});
