// The clock's drum rim glows the current hit like the word glow (Greg 2026-11-09): a hit is
// current from its onset until the next onset, at most DRUM_GLOW_HOLD; hits within
// DRUM_TOGETHER of it (a kick with a hi-hat) glow with it.
import { describe, it, expect } from "vitest";
import { drumGlowRange, DRUM_GLOW_HOLD, DRUM_TOGETHER } from "../clockGeometry";

const times = [1.0, 1.01, 1.5, 2.0];

describe("the drum glow", () => {
  it("holds 0.2 s at most, grouping hits 30 ms apart", () => {
    expect([DRUM_GLOW_HOLD, DRUM_TOGETHER]).toEqual([0.2, 0.03]);
  });
  it("is nothing before the first hit or after the hold", () => {
    expect(drumGlowRange(times, 0.9)).toBeNull();
    expect(drumGlowRange(times, 1.3)).toBeNull();
    expect(drumGlowRange([], 1)).toBeNull();
  });
  it("lights the latest onset and the hits just before it", () => {
    expect(drumGlowRange(times, 1.0)).toEqual({ from: 1.0 - 0.03, to: 1.0 });
    expect(drumGlowRange(times, 1.05)).toEqual({ from: 1.01 - 0.03, to: 1.01 });   // kick and hat together
    expect(drumGlowRange(times, 1.55)).toEqual({ from: 1.5 - 0.03, to: 1.5 });
  });
  it("hands over to the next hit when it starts", () => {
    expect(drumGlowRange([1.0, 1.1], 1.12)).toEqual({ from: 1.1 - 0.03, to: 1.1 });
  });
});
