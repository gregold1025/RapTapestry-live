import { describe, it, expect } from "vitest";
import { makeCycles } from "../clockCycles";
import {
  RINGS_OPTIONS, CYCLE_OPTIONS, ringCount, clampIndex, ringPitch, spiralRadius, spiralPath, showText, polar,
  wordSegments, syncWindow, windowForIndex, pointerToClock,
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
  it("winds the rings into one spiral from the rim to the inner radius, a turn per ring", () => {
    expect(ringPitch(5, 100, 20)).toBe(16);
    expect(spiralRadius(0, 0, 5, 100, 20)).toBe(100);
    expect(spiralRadius(2, 0.5, 5, 100, 20)).toBe(60);
    expect(spiralRadius(4, 1, 5, 100, 20)).toBe(20);
  });
  it("ends each turn where the next one starts, so bar lines and words run on across 12 o'clock", () => {
    expect(spiralRadius(1, 1, 5, 100, 20)).toBe(spiralRadius(2, 0, 5, 100, 20));
  });
  it("keeps a single ring a circle on the rim", () => {
    expect(spiralRadius(0, 0.7, 1, 100, 20)).toBe(100);
    expect(ringPitch(1, 100, 20)).toBe(80);
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
  it("draws a stretch of the spiral clockwise, from one ring and frac to another", () => {
    const d = spiralPath(0, 0, 0, 0.25, 5, 100, 20);
    expect(d.startsWith("M0.00,-100.00")).toBe(true);
    expect(d.endsWith("L96.00,0.00")).toBe(true);
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
  it("finds the turn of the spiral nearest the pointer at its angle", () => {
    // at 9 o'clock (frac 0.75) ring 1 sits at 100 − 1.75 × 16 = 72; ring 2 at 56
    expect(pointerToClock(-68, 0, 0, 0, 5, 100, 20).ring).toBe(1);
  });
});

import { spokes, faceStrokes } from "../clockGeometry";
import { gridStrokes, contrastRatio } from "../../../utils/gridStroke";

describe("the face", () => {
  it("puts a spoke on every beat and marks where bars start", () => {
    const s = spokes(2, 4);
    expect(s).toHaveLength(8);
    expect(s[0].kind).toBe("bar");
    expect(s[1].kind).toBe("beat");
    expect(s[4]).toEqual({ frac: 0.5, kind: "bar" });
  });
  it("colors spokes and rings from the background, like bar and beat lines", () => {
    expect(faceStrokes("#ffffff").bar).toBe(gridStrokes("#ffffff").bar);
    expect(faceStrokes("#ffffff").current).toBe(gridStrokes("#ffffff").bar);
    expect(faceStrokes("#ffffff").ring).toBe(gridStrokes("#ffffff").beat);
    expect(faceStrokes("#111111").beat).not.toBe(faceStrokes("#ffffff").beat);
  });
  it("gives the current ring a glow that stands well off the background", () => {
    for (const bg of ["#000000", "#f7f7f9", "#777777"]) {
      expect(contrastRatio(faceStrokes(bg).glow, bg)).toBeGreaterThanOrEqual(4);
    }
  });
});

import { revealOpacity, FAINT } from "../clockGeometry";

describe("reveal while following", () => {
  const on = { follow: true, playing: true };
  it("shows later rings faintly", () => {
    expect(revealOpacity({ ...on, ring: 3, current: 2, start: 0, t: 9 })).toBe(FAINT);
    expect(FAINT).toBe(0.18);
  });
  it("shows the unplayed part of the current ring faintly and the played part in full", () => {
    expect(revealOpacity({ ...on, ring: 2, current: 2, start: 10, t: 9 })).toBe(FAINT);
    expect(revealOpacity({ ...on, ring: 2, current: 2, start: 8, t: 9 })).toBe(1);
  });
  it("shows earlier rings in full", () => {
    expect(revealOpacity({ ...on, ring: 1, current: 2, start: 20, t: 9 })).toBe(1);
  });
  it("shows everything in full when frozen or paused", () => {
    expect(revealOpacity({ follow: false, playing: true, ring: 3, current: 2, start: 10, t: 9 })).toBe(1);
    expect(revealOpacity({ follow: true, playing: false, ring: 3, current: 2, start: 10, t: 9 })).toBe(1);
  });
});

import { dragMode } from "../clockGeometry";

describe("dragMode", () => {
  it("pans anywhere on the clock", () => {
    expect(dragMode({ wholeSong: false })).toBe("pan");
  });
  it("does nothing in whole-song mode", () => {
    expect(dragMode({ wholeSong: true })).toBe(null);
  });
});

import { radialPan } from "../clockGeometry";

describe("radialPan", () => {
  const base = { cx: 0, cy: 0, x0: 100, y0: 0, spacing: 20 };
  it("an outward drag moves later in the song, a cycle per ring gap", () => {
    expect(radialPan({ ...base, x: 141, y: 0 })).toBe(2);
  });
  it("an inward drag moves earlier, and keeps going past the center", () => {
    expect(radialPan({ ...base, x: 60, y: 0 })).toBe(-2);
    expect(radialPan({ ...base, x: -100, y: 0 })).toBe(-10);
  });
  it("only the radial part of the drag counts", () => {
    expect(radialPan({ ...base, x: 100, y: 300 })).toBe(0);
  });
});

import { clampWindow, reanchorWindow, clickCycle } from "../clockGeometry";

describe("final review fixes", () => {
  it("a pan stops with every ring still on the song: the first cycle on the rim, the last on the innermost ring", () => {
    expect(clampWindow(-50, 8, 40)).toBe(0);
    expect(clampWindow(90, 8, 40)).toBe(32);
    expect(clampWindow(10, 8, 40)).toBe(10);
    expect(clampWindow(5, 8, 4)).toBe(0);
  });

  it("a frozen window keeps its place in the song when the cycle length changes", () => {
    const one = makeCycles([0, 2, 4, 6, 8, 10, 12, 14, 16], 1, 16);   // 8 one-bar cycles
    const four = makeCycles([0, 2, 4, 6, 8, 10, 12, 14, 16], 4, 16);  // 2 four-bar cycles
    // W = 5 (bar 6) in one-bar cycles -> the four-bar cycle holding bar 6 is cycle 1
    expect(reanchorWindow({ W: 5, oldCycles: one, newCycles: four, P: 0, index: 0, rings: 1, leftWholeSong: false })).toBe(1);
    // and back: cycle 1 of four bars starts at bar 4 -> one-bar cycle 4
    expect(reanchorWindow({ W: 1, oldCycles: four, newCycles: one, P: 0, index: 0, rings: 1, leftWholeSong: false })).toBe(4);
  });

  it("leaving whole song while frozen puts the playhead's ring at the chosen index", () => {
    const c = makeCycles([0, 2, 4, 6, 8, 10, 12, 14, 16], 1, 16);
    expect(reanchorWindow({ W: 0, oldCycles: c, newCycles: c, P: 6, index: 2, rings: 4, leftWholeSong: true })).toBe(4);
  });

  it("a click in the drum band seeks in the drums' cycle (the current ring's)", () => {
    const g = { rOuter: 100, drumBand: 12 };
    expect(clickCycle({ r: 105, ring: 0, W: 10, current: 3, ...g })).toBe(13);
    expect(clickCycle({ r: 105, ring: 0, W: 10, current: null, ...g })).toBe(null);
    expect(clickCycle({ r: 80, ring: 1, W: 10, current: 3, ...g })).toBe(11);
    expect(clickCycle({ r: 120, ring: 0, W: 10, current: 3, ...g })).toBe(null);
  });

});

import { drumInk } from "../clockGeometry";

describe("drumInk", () => {
  it("keeps the Drums panel color when it shows on the clock's background", () => {
    expect(drumInk("#000000", "#f7f7f9", "#9a9da5")).toBe("#000000");
  });
  it("falls back to the clock's word color when the drums would vanish", () => {
    expect(drumInk("#000000", "#000000", "#9a9da5")).toBe("#9a9da5");
    expect(drumInk("#111111", "#000000", "#9a9da5")).toBe("#9a9da5");
  });
});

import { labelPath, followIndex } from "../clockGeometry";

describe("word labels", () => {
  it("run clockwise along the spiral just outside the word, upside down on the lower half", () => {
    const d = labelPath(0, 0, 0, 0.5, 0.55, "abc", 12, 1, 100, 20);
    expect(d.startsWith("M0.00,103.00")).toBe(true);
    expect(d).toMatch(/L-[\d.]+,[\d.]+$/);
  });
});

describe("followIndex (where Follow keeps the playhead's ring)", () => {
  it("is the middle ring, or with an even count the larger of the two middle rings", () => {
    expect([1, 2, 4, 5, 8, 16, 32].map(followIndex)).toEqual([0, 0, 1, 2, 3, 7, 15]);
  });
});
