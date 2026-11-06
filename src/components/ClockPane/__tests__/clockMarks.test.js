import { describe, it, expect } from "vitest";
import { makeCycles } from "../clockCycles";
import { FORM_DASH, wordMarks } from "../clockMarks";

const cycles = makeCycles([0, 2, 4, 6, 8], 1, 8);
const timingWords = new Map([
  ["0-0", { start: 0.5, end: 1.0, syls: [{ k: 0, start: 0.5, end: 1.0, vStart: 0.5, vEnd: 0.9 }] }],
  ["0-1", { start: 3.0, end: 3.5, syls: [{ k: 0, start: 3.0, end: 3.2, vStart: 3.05, vEnd: 3.15 }, { k: 1, start: 3.2, end: 3.5, vStart: 3.3, vEnd: 3.4 }] }],
]);
const base = { timingWords, visuals: new Map(), cycles, W: 0, rings: 4, words: "all", inkColor: "#666" };

describe("wordMarks", () => {
  it("draws every word in the ink color, solid, without dots, when no query touches it", () => {
    const m = wordMarks(base);
    expect(m).toHaveLength(2);
    for (const w of m) {
      expect(w.color).toBe("#666");
      expect(w.dash).toBe(null);
      expect(w.dots).toEqual([]);
    }
  });

  it("drops words outside queries when only query words are shown", () => {
    expect(wordMarks({ ...base, words: "query" })).toHaveLength(0);
  });

  it("gives a query word its color, its form's dash and a dot on each rhyme vowel", () => {
    const visuals = new Map([["0-1", { color: "#e00", form: "mosaic", vi0: 1, vi1: 1 }]]);
    const w = wordMarks({ ...base, visuals }).find((x) => x.id === "0-1");
    expect(w).toMatchObject({ color: "#e00", dash: "7 4", hit: true });
    expect(w.dots).toHaveLength(1);
    expect(w.dots[0].ring).toBe(1);
    expect(w.dots[0].frac).toBeCloseTo(cycles.fracOf(3.35));
  });

  it("keeps only the rings in the window, counted from its outermost cycle", () => {
    const m = wordMarks({ ...base, W: 1, rings: 1 });
    expect(m.map((x) => x.id)).toEqual(["0-1"]);
    expect(m[0].segments[0].ring).toBe(0);
  });

  it("maps the four forms to the Line Staff's dashes", () => {
    expect(FORM_DASH).toEqual({ word: null, mosaic: "7 4", embedded: "1.5 4", semirhyme: "0.5 3" });
  });
});

import { drumMarks } from "../clockMarks";

describe("drumMarks", () => {
  const dc = makeCycles([0, 2, 4], 1, 4);
  const hits = [{ time: 0.5, cls: "kick" }, { time: 2.5, cls: "kick" }, { time: 2.7, cls: "snare" }];
  const groups = { kick: { visible: true, height: 20 }, snare: { visible: false, height: 60 } };

  it("keeps the visible hits of one cycle, at their angle", () => {
    const m = drumMarks({ hits, cycles: dc, cycle: 1, groups, byClass: true });
    expect(m).toHaveLength(1);
    expect(m[0].rowKey).toBe("kick");
    expect(m[0].frac).toBeCloseTo(0.25);
    expect(m[0].height).toBe(20);
  });

  it("shows only the asked-for cycle", () => {
    expect(drumMarks({ hits, cycles: dc, cycle: 0, groups, byClass: true })).toHaveLength(1);
  });

  it("nudges unnamed band hits by their frequency band", () => {
    const m = drumMarks({ hits: [{ time: 0.5, category: "high" }], cycles: dc, cycle: 0, groups: { high: { visible: true, height: 50 } }, byClass: false });
    expect(m[0]).toMatchObject({ rowKey: "high", height: 50 });
  });
});


import { lineMarks, lineSpans } from "../clockMarks";

describe("line queries on the clock", () => {
  const w = (n) => Array.from({ length: n }, (_, i) => ({ text: `w${i}` }));
  const songModel = { lines: [{ words: w(5) }, { words: w(3) }] };
  const mw = { id: "1-2", li: 1, wi: 2, nSyllables: 2, rime: { stressedSyl: 1 } };
  const lm = { lineIdx: 1, type: "perfect", form: "word", words: [mw], match: { type: "perfect", form: "word", words: [mw], vi0: 1, vi1: 1 } };
  const visualByLineIdx = new Map([
    [0, { queryId: "q", color: "#e00", role: "anchor", isAnchor: true, type: "anchor" }],
    [1, { queryId: "q", color: "#e00", role: "match", isAnchor: false, type: "perfect", form: "word" }],
  ]);
  const matchesByQueryId = new Map([["q", [lm]]]);

  it("colors every queried and matched line", () => {
    expect(lineMarks({ visualByLineIdx, matchesByQueryId, songModel }).lines).toEqual([{ li: 0, color: "#e00" }, { li: 1, color: "#e00" }]);
  });
  it("brings up the query line's last three words", () => {
    const { words } = lineMarks({ visualByLineIdx, matchesByQueryId, songModel });
    expect(["0-2", "0-3", "0-4"].map((id) => words.get(id)?.color)).toEqual(["#e00", "#e00", "#e00"]);
    expect(words.has("0-1")).toBe(false);
    expect(words.get("0-4")).toMatchObject({ isAnchor: true, vi0: 0 });
  });
  it("brings up a matched line's matched words, with the match's form and rhyme vowels", () => {
    const { words } = lineMarks({ visualByLineIdx, matchesByQueryId, songModel });
    expect(words.get("1-2")).toMatchObject({ color: "#e00", form: "word", vi0: 1, vi1: 1, isAnchor: false });
    expect(words.has("1-1")).toBe(false);
  });

  it("places a line on the spiral from its first word's start to its last word's end, inside the window", () => {
    const c = makeCycles([0, 2, 4, 6, 8], 1, 8);
    const timingWords = new Map([["0-0", { start: 0.5, end: 1 }], ["0-1", { start: 2.5, end: 3 }]]);
    const sm = { lines: [{ words: w(2) }] };
    const lines = [{ li: 0, color: "#e00" }];
    expect(lineSpans({ lines, timingWords, songModel: sm, cycles: c, W: 0, rings: 4 })).toEqual([{ li: 0, color: "#e00", start: 0.5, u0: 0.25, u1: 1.5 }]);
    expect(lineSpans({ lines, timingWords, songModel: sm, cycles: c, W: 1, rings: 4 })).toEqual([{ li: 0, color: "#e00", start: 0.5, u0: 0, u1: 0.5 }]);
    expect(lineSpans({ lines, timingWords, songModel: sm, cycles: c, W: 2, rings: 2 })).toEqual([]);
  });
});
