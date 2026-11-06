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

describe("wordMarks margin (rings gliding in and out)", () => {
  it("adds the ring just outside the rim and just inside the innermost ring", () => {
    const m = wordMarks({ ...base, W: 1, rings: 1, margin: 1 });
    expect(m.map((x) => [x.id, x.segments[0].ring])).toEqual([["0-0", -1], ["0-1", 0]]);
  });
  it("puts the label on the first ring in view", () => {
    const m = wordMarks({ ...base, W: 1, rings: 1, margin: 1 });
    expect(m.map((x) => x.labelRing)).toEqual([-1, 0]);
  });
});
