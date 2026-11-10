import { describe, it, expect } from "vitest";
import { CLOCK_DEFAULTS } from "../clockDefaults";

describe("CLOCK_DEFAULTS", () => {
  it("holds the clock's starting settings", () => {
    expect(CLOCK_DEFAULTS).toEqual({
      cycleBars: 1, rings: 8, words: "all",
      backgroundColor: "#000000", wordColor: "#9a9da5", textPx: 12,
      showDrums: true, showHand: true,   // the playhead hand, on / off (Greg 2026-11-10)
    });
  });
  it("cannot be changed by accident", () => {
    expect(Object.isFrozen(CLOCK_DEFAULTS)).toBe(true);
  });
});
