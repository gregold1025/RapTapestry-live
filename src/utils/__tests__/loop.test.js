import { describe, it, expect } from "vitest";
import { normalizeLoop, defaultLoop, MIN_LOOP } from "../loop";
import { pointToTime } from "../timeUtils";

describe("loop range", () => {
  it("swaps a reversed range and keeps it inside the song", () => {
    expect(normalizeLoop({ start: 20, end: 10 }, 100)).toEqual({ start: 10, end: 20 });
    expect(normalizeLoop({ start: -5, end: 150 }, 100)).toEqual({ start: 0, end: 100 });
  });
  it("never collapses below the minimum length", () => {
    const r = normalizeLoop({ start: 10, end: 10.05 }, 100);
    expect(r.end - r.start).toBeCloseTo(MIN_LOOP);
  });
  it("defaults to the four bars from the bar under the playhead", () => {
    const song = { grid: Array.from({ length: 41 }, (_, i) => i * 0.5), beatsPerBar: 4, duration: 20, barPosition: (t) => ({ bar: Math.floor(t / 2), beat: 0, phase: 0 }) };
    expect(defaultLoop(5, song)).toEqual({ start: 4, end: 12 });
    expect(defaultLoop(19, song)).toEqual({ start: 12, end: 20 }); // clamped to the song end, still 4 bars
  });
});

describe("pointToTime (wrap rows)", () => {
  const grid = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const lay = { gridTimes: grid, rowBoundaries: [0, 4, 8], beatsPerRow: 4, columnWidth: 100, rowHeight: 50, width: 400, numberOfRows: 2 };
  it("maps a point in the second row to its time", () => {
    expect(pointToTime(150, 60, lay)).toBeCloseTo(5.5);
    expect(pointToTime(0, 0, lay)).toBeCloseTo(0);
  });
  it("clamps outside the content", () => {
    expect(pointToTime(-10, -10, lay)).toBeCloseTo(0);
    expect(pointToTime(999, 999, lay)).toBeCloseTo(8);
  });
});

describe("dragLoopEdge", () => {
  it("keeps the edge that is not held, even when the pointer crosses it", async () => {
    const { dragLoopEdge } = await import("../loop");
    // loop 10-20, holding the start edge (fixed = 20)
    expect(dragLoopEdge(20, 15, 100)).toEqual({ start: 15, end: 20 });
    expect(dragLoopEdge(20, 25, 100)).toEqual({ start: 20, end: 25 });
    expect(dragLoopEdge(20, 26, 100)).toEqual({ start: 20, end: 26 });
  });
});

describe("snapToGrid", () => {
  it("snaps a time to the nearest beat line", async () => {
    const { snapToGrid } = await import("../loop");
    const grid = [0, 0.5, 1.0, 1.5, 2.0];
    expect(snapToGrid(0.7, grid)).toBe(0.5);
    expect(snapToGrid(0.76, grid)).toBe(1.0);
    expect(snapToGrid(-1, grid)).toBe(0);
    expect(snapToGrid(9, grid)).toBe(2.0);
  });
});
