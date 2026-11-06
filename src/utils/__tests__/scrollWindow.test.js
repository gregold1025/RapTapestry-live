import { describe, it, expect } from "vitest";
import { followScroll, clampScroll, revealInset, LEAD } from "../scrollWindow";
import { xToTime } from "../timeUtils";
import { computeLayout } from "../computeLayout";

describe("scrollWindow (ported from the Line Staff)", () => {
  it("holds the playhead two thirds across the window while following", () => {
    expect(LEAD).toBeCloseTo(2 / 3);
    // playhead at x=1000, view 600 wide -> window starts at 1000 - 400
    expect(followScroll(1000, 600, 5000)).toBeCloseTo(600);
  });
  it("never scrolls before the song start or past its end", () => {
    expect(followScroll(100, 600, 5000)).toBe(0);
    expect(followScroll(4990, 600, 5000)).toBe(4400);
    expect(clampScroll(-50, 600, 5000)).toBe(0);
    expect(clampScroll(99999, 600, 5000)).toBe(4400);
    expect(clampScroll(10, 600, 300)).toBe(0); // content narrower than the view
  });
  it("reveals only what the playhead has passed when following and playing", () => {
    expect(revealInset({ follow: true, playing: true, xPlayhead: 1200, contentWidth: 5000 })).toBe(3800);
    expect(revealInset({ follow: false, playing: true, xPlayhead: 1200, contentWidth: 5000 })).toBe(0);
    expect(revealInset({ follow: true, playing: false, xPlayhead: 1200, contentWidth: 5000 })).toBe(0);
  });
});

describe("xToTime", () => {
  it("inverts the beat grid mapping", () => {
    const grid = [0, 0.5, 1.0, 1.6]; // uneven last beat
    expect(xToTime(0, grid, 100)).toBeCloseTo(0);
    expect(xToTime(50, grid, 100)).toBeCloseTo(0.25);
    expect(xToTime(250, grid, 100)).toBeCloseTo(1.3);
    expect(xToTime(-10, grid, 100)).toBeCloseTo(0);
    expect(xToTime(10000, grid, 100)).toBeCloseTo(1.6);
  });
});

describe("computeLayout singleRow", () => {
  const beats = Array.from({ length: 32 }, (_, i) => i * 0.5); // 16 s, 8 bars of 4/4 at 120 bpm
  it("lays the whole song on one row at a fixed pixel width per bar", () => {
    const lay = computeLayout({ duration: 16, width: 800, height: 500, beats, estimated_bpm: 120, singleRow: true, pxPerBar: 200 });
    expect(lay.numberOfRows).toBe(1);
    expect(lay.rowHeight).toBe(500);
    expect(lay.beatsPerRow).toBe(lay.gridTimes.length - 1); // segments between grid points
    expect(lay.columnWidth).toBeCloseTo(50);
    expect(lay.width).toBeCloseTo(50 * (lay.gridTimes.length - 1));
    expect(lay.rowBoundaries).toEqual([lay.gridTimes[0], 16]);
  });
});

import { revealsLayer } from "../scrollWindow";

describe("revealsLayer (what appears with the playhead while following)", () => {
  it("reveals the glyph layers", () => {
    for (const name of ["bass", "staff-vocals", "drums"]) expect(revealsLayer(name)).toBe(true);
  });
  it("always shows the bar and beat grid and the loop", () => {
    expect(revealsLayer("grid")).toBe(false);
    expect(revealsLayer("loop")).toBe(false);
  });
});
