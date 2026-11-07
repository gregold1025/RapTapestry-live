import { describe, it, expect } from "vitest";
import { makeCycles } from "../clockCycles";
import { gridStrokes, contrastRatio } from "../../../utils/gridStroke";
import {
  RINGS_OPTIONS, CYCLE_OPTIONS, ringCount, showText, polar, wordSegments,
  spiralShape, ringPitch, radiusAt, spiralPath, labelSpan,
  songPos, followIndex, followAt, syncWindow, clampWindow, reanchorWindow,
  pointerToSong, clickTarget, dragMode, radialPan,
  spokes, faceStrokes, revealOpacity, FAINT, endFade, fadeLen, facePieces, markOpacity,
  drumInk, clockGeo, drumRadius, DRUM_GLYPH_SCALE,
} from "../clockGeometry";

describe("options", () => {
  it("offers the two levers' values", () => {
    expect(RINGS_OPTIONS).toEqual([1, 2, 4, 8, 16, 32, "all"]);
    expect(CYCLE_OPTIONS).toEqual([1, 2, 4]);
  });
  it("counts rings, 'all' being every cycle", () => {
    expect(ringCount("all", 37)).toBe(37);
    expect(ringCount(8, 37)).toBe(8);
    expect(ringCount("all", 0)).toBe(1);
  });
  it("shows text only while the turns are at least two text heights apart", () => {
    expect(showText(30, 12)).toBe(true);
    expect(showText(14, 12)).toBe(false);
  });
});

describe("the spiral", () => {
  it("winds from the rim to the inner radius, a turn per ring", () => {
    expect(spiralShape(5, 100, 20)).toEqual({ r0: 100, pitch: 16 });
    expect(radiusAt(2.5, 5, 100, 20)).toBe(60);
    expect(radiusAt(5, 5, 100, 20)).toBe(20);
    expect(ringPitch(5, 100, 20)).toBe(16);
  });
  it("one ring: starts a little inside the rim and ends at two thirds of the radius", () => {
    expect(radiusAt(0, 1, 90, 20)).toBeCloseTo(81);
    expect(radiusAt(1, 1, 90, 20)).toBeCloseTo(60);
  });
  it("two rings: from the rim to a third of the radius", () => {
    expect(radiusAt(0, 2, 90, 20)).toBe(90);
    expect(radiusAt(2, 2, 90, 20)).toBeCloseTo(30);
  });
  it("draws a stretch clockwise at the song's angles", () => {
    const d = spiralPath(0, 0, 0, 0.25, 0, 5, 100, 20);
    expect(d.startsWith("M0.00,-100.00")).toBe(true);
    expect(d.endsWith("L96.00,0.00")).toBe(true);
  });
  it("does not turn as the window moves: a mark keeps its angle and moves outward", () => {
    expect(spiralPath(0, 0, 2, 2.1, 1, 5, 100, 20).startsWith("M0.00,-84.00")).toBe(true);
    expect(spiralPath(0, 0, 2, 2.1, 1.5, 5, 100, 20).startsWith("M0.00,-92.00")).toBe(true);
  });
  it("makes a label's stretch long enough for its text at its radius", () => {
    expect(labelSpan(0, 0.01, 0, 2 * Math.PI * 10, 5, 100, 20)).toBeCloseTo(0.1);
    expect(labelSpan(0, 0.3, 0, 1, 5, 100, 20)).toBe(0.3);
  });
});

describe("drawing", () => {
  it("puts frac 0 at 12 o'clock and runs clockwise", () => {
    const a = polar(0, 0, 10, 0), b = polar(0, 0, 10, 0.25);
    expect(a.x).toBeCloseTo(0); expect(a.y).toBeCloseTo(-10);
    expect(b.x).toBeCloseTo(10); expect(b.y).toBeCloseTo(0);
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

describe("the window (W = the song position at the spiral's outer end, in cycles)", () => {
  const c = makeCycles([0, 2, 4, 6], 1, 6);
  it("reads the song position as cycle + frac, 0 before the first bar", () => {
    expect(songPos(c, 3)).toBeCloseTo(1.5);
    expect(songPos(c, -1)).toBe(0);
  });
  it("Follow keeps the playhead mid-turn on the middle ring (with an even count, the larger of the two)", () => {
    expect([1, 2, 4, 5, 8, 16, 32].map(followIndex)).toEqual([0, 0, 1, 2, 3, 7, 15]);
    expect(followAt(8)).toBe(3.5);
    expect(syncWindow({ follow: true, W: 0, U: 10.25, rings: 8 })).toBe(6.75);
  });
  it("Freeze holds the window; whole song fixes it at the start", () => {
    expect(syncWindow({ follow: false, W: 4.2, U: 10, rings: 8 })).toBe(4.2);
    expect(syncWindow({ wholeSong: true, follow: true, W: 3, U: 5, rings: 37 })).toBe(0);
  });
  it("a pan stops with the spiral on the song, but never jumps from where it started", () => {
    expect(clampWindow(-50, 8, 40)).toBe(0);
    expect(clampWindow(90, 8, 40)).toBe(32);
    expect(clampWindow(10.5, 8, 40)).toBe(10.5);
    expect(clampWindow(-3.5, 8, 40, -3.5)).toBe(-3.5);
    expect(clampWindow(-5, 8, 40, -3.5)).toBe(-3.5);
  });
  it("a frozen window keeps its place in the song when the cycle length changes", () => {
    const db = Array.from({ length: 17 }, (_, i) => 2 * i);
    const one = makeCycles(db, 1, 32), four = makeCycles(db, 4, 32);
    expect(reanchorWindow({ W: 5, oldCycles: one, newCycles: four, U: 0, rings: 1, leftWholeSong: false })).toBeCloseTo(1.25);
    expect(reanchorWindow({ W: 1, oldCycles: four, newCycles: one, U: 0, rings: 1, leftWholeSong: false })).toBeCloseTo(4);
  });
  it("leaving whole song while frozen puts the playhead where Follow would", () => {
    expect(reanchorWindow({ W: 0, oldCycles: c, newCycles: c, U: 6, rings: 4, leftWholeSong: true })).toBe(4.5);
  });
});

describe("pointer", () => {
  it("finds the song position on the turn nearest the pointer at its angle", () => {
    expect(pointerToSong(0, -100, 0, 0, 0, 5, 100, 20)).toMatchObject({ u: 0, frac: 0 });
    expect(pointerToSong(60, 0, 0, 0, 0, 5, 100, 20).u).toBeCloseTo(2.25);
    expect(pointerToSong(-68, 0, 0, 0, 0, 5, 100, 20).u).toBeCloseTo(1.75);
    expect(pointerToSong(0, -92, 0, 0, 0.5, 5, 100, 20).u).toBe(1);
  });
  it("seeks to the clicked place, or in the drum band within the playhead's cycle", () => {
    const g = { W: 10, rings: 8, P: 3, count: 40, rOuter: 100, drumBand: 12 };
    expect(clickTarget({ ...g, r: 80, u: 11.25, frac: 0.25 })).toEqual({ cycle: 11, frac: 0.25 });
    expect(clickTarget({ ...g, r: 105, u: 0, frac: 0.5 })).toEqual({ cycle: 3, frac: 0.5 });
    expect(clickTarget({ ...g, P: -1, r: 105, u: 0, frac: 0.5 })).toBe(null);
    expect(clickTarget({ ...g, r: 120, u: 11, frac: 0 })).toBe(null);
    expect(clickTarget({ ...g, r: 80, u: 9.25, frac: 0.25 })).toBe(null);
    expect(clickTarget({ ...g, W: 36, r: 80, u: 40.5, frac: 0.5 })).toBe(null);
  });
  it("pans by dragging anywhere, smoothly: outward later, inward earlier, a cycle per turn", () => {
    const base = { cx: 0, cy: 0, x0: 100, y0: 0, spacing: 20 };
    expect(dragMode({ wholeSong: false })).toBe("pan");
    expect(dragMode({ wholeSong: true })).toBe(null);
    expect(radialPan({ ...base, x: 141, y: 0 })).toBeCloseTo(2.05);
    expect(radialPan({ ...base, x: 60, y: 0 })).toBe(-2);
    expect(radialPan({ ...base, x: -100, y: 0 })).toBe(-10);
    expect(radialPan({ ...base, x: 100, y: 300 })).toBe(0);
  });
});

describe("the face", () => {
  it("puts a spoke on every beat and marks where bars start", () => {
    const s = spokes(2, 4);
    expect(s).toHaveLength(8);
    expect(s[0].kind).toBe("bar");
    expect(s[4]).toEqual({ frac: 0.5, kind: "bar" });
  });
  it("colors spokes and the spiral from the background, like bar and beat lines", () => {
    expect(faceStrokes("#ffffff").bar).toBe(gridStrokes("#ffffff").bar);
    expect(faceStrokes("#ffffff").ring).toBe(gridStrokes("#ffffff").beat);
    for (const bg of ["#000000", "#f7f7f9", "#777777"]) expect(contrastRatio(faceStrokes(bg).glow, bg)).toBeGreaterThanOrEqual(4);
  });
  it("fades the spiral in at its inner end and out at its outer end", () => {
    expect(endFade(0, 8, 0.35)).toBe(0);
    expect(endFade(0.175, 8, 0.35)).toBeCloseTo(0.5);
    expect(endFade(4, 8, 0.35)).toBe(1);
    expect(endFade(8, 8, 0.35)).toBe(0);
    expect(fadeLen(8)).toBe(0.35);
    expect(fadeLen(1)).toBe(0.25);
  });
  it("draws the spiral as fading pieces at the ends and one solid body", () => {
    const p = facePieces(2, 8, 0.4, 4);
    expect(p).toHaveLength(9);
    expect(p[0]).toMatchObject({ u0: 2, alpha: 0.125 });
    expect(p[4]).toEqual({ u0: 2.4, u1: 9.6, alpha: 1 });
    expect(p[8].u1).toBeCloseTo(10);
    expect(p[8].alpha).toBe(0.125);
    expect(facePieces(0, 30, 0)).toEqual([{ u0: 0, u1: 30, alpha: 1 }]);
  });
});

describe("mark opacity", () => {
  it("while following and playing, shows what is not yet played faintly", () => {
    expect(revealOpacity({ follow: true, playing: true, start: 10, t: 9 })).toBe(FAINT);
    expect(revealOpacity({ follow: true, playing: true, start: 8, t: 9 })).toBe(1);
    expect(revealOpacity({ follow: false, playing: true, start: 10, t: 9 })).toBe(1);
    expect(FAINT).toBe(0.18);
  });
  it("fades marks at the spiral's ends, times the reveal", () => {
    const o = { follow: true, playing: true, t: 9, W: 2, rings: 8, wholeSong: false };
    expect(markOpacity({ ...o, start: 5, umid: 6 })).toBe(1);
    expect(markOpacity({ ...o, start: 5, umid: 2 })).toBe(0);
    expect(markOpacity({ ...o, start: 10, umid: 6 })).toBe(FAINT);
    expect(markOpacity({ ...o, wholeSong: true, start: 5, umid: 0 })).toBe(1);
  });
});

describe("drums", () => {
  it("keeps the Drums panel color unless it would vanish on the clock's background", () => {
    expect(drumInk("#000000", "#f7f7f9", "#9a9da5")).toBe("#000000");
    expect(drumInk("#000000", "#000000", "#9a9da5")).toBe("#9a9da5");
  });
  it("is a fixed band just outside the rim; the clock shrinks to fit it in the window", () => {
    expect(clockGeo(400, 8)).toMatchObject({ cx: 200, cy: 200, rOuter: 158, drumBand: 36 });
  });
  it("paints each glyph just outside the rim, higher classes a little further out", () => {
    expect(drumRadius({ rOuter: 100, size: 10, height: 0 })).toBe(109);
    expect(drumRadius({ rOuter: 100, size: 10, height: 30 })).toBe(118);
  });
  it("draws glyphs at a fixed scale: 150% of the Drums panel's sizes at 80%", () => {
    expect(DRUM_GLYPH_SCALE).toBeCloseTo(1.2);
  });
});
