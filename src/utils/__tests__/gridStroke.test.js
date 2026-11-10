import { describe, it, expect } from "vitest";
import { gridStrokes, contrastRatio } from "../gridStroke";

const hex = (r, g, b) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
const SAMPLES = [];
for (let v = 0; v <= 255; v += 5) SAMPLES.push(hex(v, v, v));
SAMPLES.push("#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff", "#203040", "#f0e0d0", "#7a7a7a", "#808080", "#3a6ea5", "#c0392b");
const lift = (s, bg) => contrastRatio(s, bg) - 1; // how far a line stands off its background

describe("grid strokes stay visible on any background", () => {
  it("on white, bar lines are the original 20% black (#cccccc) and beats keep their current gray", () => {
    const s = gridStrokes("#ffffff");
    expect(s.bar).toBe("#cccccc");
    expect(s.beat).toBe("#b3b3b3");
  });
  it("bar and beat lines keep a contrast of at least 1.5 against every background", () => {
    for (const bg of SAMPLES) {
      const s = gridStrokes(bg);
      expect(contrastRatio(s.bar, bg), bg).toBeGreaterThanOrEqual(1.5);
      expect(contrastRatio(s.beat, bg), bg).toBeGreaterThanOrEqual(1.5);
    }
  });
  it("eighth and sixteenth lines stand off the background at most half as much as beat lines, but still show", () => {
    for (const bg of SAMPLES) {
      const s = gridStrokes(bg);
      expect(lift(s.sub, bg), bg).toBeLessThanOrEqual(lift(s.beat, bg) / 2 + 0.01);
      expect(contrastRatio(s.sub, bg), bg).toBeGreaterThanOrEqual(1.15);
    }
  });
  it("lines darken a light background and lighten a dark one", () => {
    expect(gridStrokes("#ffffff").beat < "#ffffff").toBe(true);
    expect(parseInt(gridStrokes("#000000").beat.slice(1, 3), 16)).toBeGreaterThan(0);
  });
  it("short and missing colors fall back instead of failing", () => {
    expect(gridStrokes("#fff")).toEqual(gridStrokes("#ffffff"));
    expect(gridStrokes(undefined)).toEqual(gridStrokes("#ffffff"));
    expect(gridStrokes("nonsense")).toEqual(gridStrokes("#ffffff"));
  });
});

import { inkOn } from "../gridStroke";

describe("inkOn (a color that must show on a background)", () => {
  it("keeps the color when it shows", () => {
    expect(inkOn("#000000", "#ffffff", "#fff")).toBe("#000000");
  });
  it("falls back when it would vanish (contrast under 2)", () => {
    expect(inkOn("#000000", "#1c1c1c", "#ffffff")).toBe("#ffffff");
  });
});

// The Line Staff's beat lines recede so its bar lines stand out (Greg 2026-11-09).
import { staffGridStrokes } from "../gridStroke";
describe("the Line Staff grid", () => {
  for (const bg of ["#1c1c1c", "#ffffff", "#777777"]) {
    it(`keeps the bar line and fades the beat lines on ${bg}`, () => {
      const t = gridStrokes(bg), s = staffGridStrokes(bg);
      expect(s.bar).toBe(t.bar);
      expect(contrastRatio(s.beat, bg)).toBeLessThan(contrastRatio(t.beat, bg));
      expect(contrastRatio(s.beat, bg)).toBeGreaterThan(1.1);   // still visible
      expect(contrastRatio(s.sub, bg)).toBeLessThan(contrastRatio(s.beat, bg));
      expect(contrastRatio(s.bar, bg) - 1).toBeGreaterThan(2 * (contrastRatio(s.beat, bg) - 1));
    });
  }
});
