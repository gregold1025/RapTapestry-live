import { describe, it, expect } from "vitest";
import { makeCycles } from "../clockCycles";
import {
  RINGS_OPTIONS, CYCLE_OPTIONS, ringCount, clampIndex, ringRadius, ringSpacing, showText, polar, arcPath,
  wordSegments, syncWindow, windowForIndex, pointerToClock, unwrapDelta,
} from "../clockGeometry";

describe("options", () => {
  it("offers the two levers' values", () => {
    expect(RINGS_OPTIONS).toEqual([1, 2, 4, 8, 16, 32, "all"]);
    expect(CYCLE_OPTIONS).toEqual([1, 2, 4]);
  });
});

describe("rings", () => {
  it("counts rings, 'all' being every cycle", () => {
    expect(ringCount("all", 37)).toBe(37);
    expect(ringCount(8, 37)).toBe(8);
    expect(ringCount("all", 0)).toBe(1);
  });
  it("clamps the current ring index into the rings shown", () => {
    expect(clampIndex(7, 4)).toBe(3);
    expect(clampIndex(-1, 4)).toBe(0);
  });
  it("spaces rings from the rim (index 0) to the inner radius", () => {
    expect(ringRadius(0, 5, 100, 20)).toBe(100);
    expect(ringRadius(4, 5, 100, 20)).toBe(20);
    expect(ringRadius(0, 1, 100, 20)).toBe(100);
    expect(ringSpacing(5, 100, 20)).toBe(20);
    expect(ringSpacing(1, 100, 20)).toBe(80);
  });
  it("shows text only while rings are at least two text heights apart", () => {
    expect(showText(30, 12)).toBe(true);
    expect(showText(14, 12)).toBe(false);
  });
});

describe("drawing", () => {
  it("puts frac 0 at 12 o'clock and runs clockwise", () => {
    const a = polar(0, 0, 10, 0), b = polar(0, 0, 10, 0.25);
    expect(a.x).toBeCloseTo(0); expect(a.y).toBeCloseTo(-10);
    expect(b.x).toBeCloseTo(10); expect(b.y).toBeCloseTo(0);
  });
  it("draws arcs clockwise with the large-arc flag past half a turn", () => {
    expect(arcPath(0, 0, 10, 0, 0.75)).toContain(" 1 1 ");
    expect(arcPath(0, 0, 10, 0, 0.25)).toContain(" 0 1 ");
  });
  it("splits a word that crosses a cycle boundary", () => {
    const c = makeCycles([0, 2, 4, 6], 1, 6);
    const segs = wordSegments(1.5, 2.5, c);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({ cycle: 0, f1: 1 });
    expect(segs[0].f0).toBeCloseTo(0.75);
    expect(segs[1]).toMatchObject({ cycle: 1, f0: 0 });
    expect(segs[1].f1).toBeCloseTo(0.25);
    expect(wordSegments(0.5, 1, c)).toHaveLength(1);
  });
});

describe("the window", () => {
  it("follow keeps the playhead's ring at the chosen index", () => {
    expect(syncWindow({ follow: true, W: 0, P: 10, index: 2, rings: 8 })).toEqual({ W: 8, index: 2, current: 2 });
  });
  it("freeze holds the window and lets the current ring move with the playhead", () => {
    expect(syncWindow({ follow: false, W: 8, P: 12, index: 2, rings: 8 })).toEqual({ W: 8, index: 4, current: 4 });
  });
  it("freeze with the playhead outside the window has no current ring and keeps the index", () => {
    expect(syncWindow({ follow: false, W: 8, P: 20, index: 4, rings: 8 })).toEqual({ W: 8, index: 4, current: null });
  });
  it("in the intro there is no current ring and follow anchors on cycle 0", () => {
    expect(syncWindow({ follow: true, W: 0, P: -1, index: 0, rings: 8 })).toEqual({ W: 0, index: 0, current: null });
  });
  it("whole song fixes the window at cycle 0", () => {
    expect(syncWindow({ wholeSong: true, follow: true, W: 3, P: 5, index: 0, rings: 37 })).toMatchObject({ W: 0, current: 5 });
  });
  it("moving the current ring moves the window, not the playhead", () => {
    expect(windowForIndex(12, 3)).toBe(9);
  });
});

describe("pointer", () => {
  it("maps a point to the nearest ring and its frac", () => {
    expect(pointerToClock(0, -100, 0, 0, 5, 100, 20)).toMatchObject({ ring: 0, frac: 0 });
    const p = pointerToClock(60, 0, 0, 0, 5, 100, 20);
    expect(p.ring).toBe(2);
    expect(p.frac).toBeCloseTo(0.25);
  });
  it("unwraps an angle change across 12 o'clock", () => {
    expect(unwrapDelta(0.95, 0.05)).toBeCloseTo(0.1);
    expect(unwrapDelta(0.05, 0.95)).toBeCloseTo(-0.1);
  });
});
