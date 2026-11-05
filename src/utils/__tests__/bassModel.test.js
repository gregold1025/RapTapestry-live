import { describe, it, expect } from "vitest";
import { bassRange, midiPct, noteSegments } from "../bassModel";

describe("bass v2 model", () => {
  const notes = [
    { start: 0, end: 1, midi: 36, contour: [[0, 36], [0.5, 36], [1, 36]] },
    { start: 2, end: 3, midi: 43, contour: [[2, 41], [2.5, 43], [3, 43]] },
    { start: 4, end: 5, midi: 48, contour: [[4, 48]] },
  ];
  it("bassRange spans the song's note pitches (with a little head room)", () => {
    const r = bassRange(notes);
    expect(r.lo).toBeLessThanOrEqual(36);
    expect(r.hi).toBeGreaterThanOrEqual(48);
    expect(r.hi - r.lo).toBeGreaterThan(0);
  });
  it("midiPct maps the range into the band and clamps outside it", () => {
    const band = { lo: 5, hi: 50 }, range = { lo: 36, hi: 48 };
    expect(midiPct(36, band, range)).toBeCloseTo(5);
    expect(midiPct(48, band, range)).toBeCloseTo(50);
    expect(midiPct(42, band, range)).toBeCloseTo(27.5);
    expect(midiPct(20, band, range)).toBeCloseTo(5);
    expect(midiPct(null, band, range)).toBeCloseTo(27.5);
  });
  it("noteSegments splits a note's contour at row boundaries, in content coordinates", () => {
    // rows 2 s wide, 100 px each
    const timeToPixels = (t) => ({ x: (t % 2) * 50, row: Math.floor(t / 2) });
    const note = { start: 1.5, end: 2.5, midi: 40, contour: [[1.5, 40], [1.9, 40], [2.1, 42], [2.5, 42]] };
    const segs = noteSegments(note, timeToPixels);
    expect(segs.length).toBe(2);
    expect(segs[0].row).toBe(0);
    expect(segs[0].points[0]).toEqual({ x: 75, midi: 40 });
    expect(segs[1].row).toBe(1);
    expect(segs[1].points[segs[1].points.length - 1].x).toBeCloseTo(25);
  });
  it("a note with a single contour point still gets a segment from start to end", () => {
    const timeToPixels = (t) => ({ x: t * 50, row: 0 });
    const segs = noteSegments({ start: 4, end: 5, midi: 48, contour: [[4, 48]] }, timeToPixels);
    expect(segs.length).toBe(1);
    expect(segs[0].points.length).toBe(2);
    expect(segs[0].points[1].x).toBeCloseTo(250);
  });
});
