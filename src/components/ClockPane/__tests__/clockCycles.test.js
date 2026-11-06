import { describe, it, expect } from "vitest";
import { makeCycles } from "../clockCycles";

const db = [1, 3, 5, 7, 9]; // 2 s bars

describe("makeCycles", () => {
  it("counts one-bar cycles, extrapolating bars past the last downbeat to the song's end", () => {
    expect(makeCycles(db, 1, 12).count).toBe(6);
  });

  it("places a time in its one-bar cycle", () => {
    const c = makeCycles(db, 1, 12);
    expect(c.cycleOf(4)).toBe(1);
    expect(c.fracOf(4)).toBeCloseTo(0.5);
  });

  it("places a time in a two-bar cycle", () => {
    const c = makeCycles(db, 2, 12);
    expect(c.cycleOf(4)).toBe(0);
    expect(c.fracOf(4)).toBeCloseTo(0.75);
    expect(c.count).toBe(3);
  });

  it("places a time in a four-bar cycle, including the extrapolated tail", () => {
    const c = makeCycles(db, 4, 12);
    expect(c.fracOf(5)).toBeCloseTo(0.5);
    expect(c.cycleOf(11.5)).toBe(1);
  });

  it("puts the intro (before the first downbeat) in cycle -1", () => {
    expect(makeCycles(db, 1, 12).cycleOf(0.5)).toBe(-1);
  });

  it("spaces time linearly inside each bar, so uneven bars keep their beats", () => {
    expect(makeCycles([0, 2, 5], 2, 5).fracOf(3.5)).toBeCloseTo(0.75);
  });

  it("inverts cycle and frac back to time", () => {
    const c = makeCycles(db, 1, 12);
    expect(c.timeAt(1, 0.5)).toBeCloseTo(4);
    for (const t of [1.2, 6.6, 11.9]) expect(c.timeAt(c.cycleOf(t), c.fracOf(t))).toBeCloseTo(t);
    const c4 = makeCycles(db, 4, 12);
    for (const t of [1.2, 6.6, 11.9]) expect(c4.timeAt(c4.cycleOf(t), c4.fracOf(t))).toBeCloseTo(t);
  });

  it("gives the start time of a cycle", () => {
    expect(makeCycles(db, 2, 12).start(1)).toBeCloseTo(5);
  });

  it("has no cycles without a bar grid", () => {
    const none = makeCycles([], 1, 10);
    expect(none.count).toBe(0);
    expect(none.cycleOf(3)).toBe(-1);
    expect(makeCycles([2], 1, 10).count).toBe(0);
  });
});
