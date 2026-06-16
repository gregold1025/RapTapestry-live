import { describe, it, expect } from "vitest";
import { findCurrentIndex } from "../findCurrentIndex";

describe("findCurrentIndex", () => {
  const starts = [0, 1, 2, 4];
  const ends   = [1, 2, 3, 5];

  it("returns -1 before the first start", () => {
    expect(findCurrentIndex(starts, ends, -0.5)).toBe(-1);
  });
  it("returns the containing interval", () => {
    expect(findCurrentIndex(starts, ends, 0.0)).toBe(0);
    expect(findCurrentIndex(starts, ends, 1.5)).toBe(1);
    expect(findCurrentIndex(starts, ends, 2.9)).toBe(2);
    expect(findCurrentIndex(starts, ends, 4.2)).toBe(3);
  });
  it("returns -1 inside a gap between intervals", () => {
    expect(findCurrentIndex(starts, ends, 3.5)).toBe(-1);
  });
  it("treats end as exclusive", () => {
    expect(findCurrentIndex(starts, ends, 1.0)).toBe(1);
  });
  it("handles empty input", () => {
    expect(findCurrentIndex([], [], 1)).toBe(-1);
  });
});
