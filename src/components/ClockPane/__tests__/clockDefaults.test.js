import { describe, it, expect } from "vitest";
import { CLOCK_DEFAULTS } from "../clockDefaults";

describe("CLOCK_DEFAULTS", () => {
  it("holds the clock's starting settings", () => {
    expect(CLOCK_DEFAULTS).toEqual({
      cycleBars: 1, rings: 8, index: 0, words: "all",
      backgroundColor: "#f7f7f9", wordColor: "#6b6e76", textPx: 12,
      showDrums: true, drumScale: 1,
    });
  });
  it("cannot be changed by accident", () => {
    expect(Object.isFrozen(CLOCK_DEFAULTS)).toBe(true);
  });
});
