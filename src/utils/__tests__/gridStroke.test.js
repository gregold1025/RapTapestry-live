import { describe, it, expect } from "vitest";
import { gridStrokes, contrastRatio } from "../gridStroke";

const hex = (r, g, b) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
const SAMPLES = [];
for (let v = 0; v <= 255; v += 5) SAMPLES.push(hex(v, v, v));
SAMPLES.push("#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff", "#203040", "#f0e0d0", "#7a7a7a", "#808080", "#3a6ea5", "#c0392b");

describe("grid strokes stay visible on any background", () => {
  it("beat lines keep a contrast of at least 1.5 against every background", () => {
    for (const bg of SAMPLES) expect(contrastRatio(gridStrokes(bg).beat, bg), bg).toBeGreaterThanOrEqual(1.5);
  });
  it("bar lines are stronger than beat lines", () => {
    for (const bg of SAMPLES) {
      const s = gridStrokes(bg);
      expect(contrastRatio(s.bar, bg), bg).toBeGreaterThan(contrastRatio(s.beat, bg));
    }
  });
  it("lines darken a light background and lighten a dark one", () => {
    expect(contrastRatio(gridStrokes("#ffffff").beat, "#000000")).toBeLessThan(21);
    expect(gridStrokes("#ffffff").beat < "#ffffff").toBe(true);
    expect(parseInt(gridStrokes("#000000").beat.slice(1, 3), 16)).toBeGreaterThan(0);
  });
  it("short and missing colors fall back instead of failing", () => {
    expect(gridStrokes("#fff")).toEqual(gridStrokes("#ffffff"));
    expect(gridStrokes(undefined)).toEqual(gridStrokes("#ffffff"));
    expect(gridStrokes("nonsense")).toEqual(gridStrokes("#ffffff"));
  });
});
