import { describe, it, expect } from "vitest";
import { computeLanes, laneY, pitchPct, wordPitchCenter, STEM_ORDER } from "../laneLayout";

describe("computeLanes", () => {
  it("superimposed: every stem gets the whole row", () => {
    const lanes = computeLanes({ stemsLayout: "superimposed", visible: { drums: true, vocals: true, bass: true } });
    for (const s of STEM_ORDER) expect(lanes[s]).toEqual({ top: 0, height: 1 });
  });

  it("separated: visible stems stack in order with equal heights", () => {
    const lanes = computeLanes({ stemsLayout: "separated", visible: { drums: true, vocals: true, bass: true } });
    expect(lanes.drums).toEqual({ top: 0, height: 1 / 3 });
    expect(lanes.vocals.top).toBeCloseTo(1 / 3);
    expect(lanes.bass.top).toBeCloseTo(2 / 3);
  });

  it("separated: a hidden stem takes no space and the rest redistribute", () => {
    const lanes = computeLanes({ stemsLayout: "separated", visible: { drums: true, vocals: false, bass: true } });
    expect(lanes.vocals).toEqual({ top: 0, height: 0 });
    expect(lanes.drums).toEqual({ top: 0, height: 0.5 });
    expect(lanes.bass).toEqual({ top: 0.5, height: 0.5 });
  });

  it("separated with nothing visible falls back to whole-row lanes (no divide by zero)", () => {
    const lanes = computeLanes({ stemsLayout: "separated", visible: { drums: false, vocals: false, bass: false } });
    for (const s of STEM_ORDER) expect(lanes[s]).toEqual({ top: 0, height: 1 });
  });
});

describe("laneY", () => {
  const lane = { top: 0.5, height: 0.5 }; // bottom half of the row
  it("0% is the lane bottom and 100% the lane top", () => {
    expect(laneY(100, 200, lane, 0)).toBe(300);
    expect(laneY(100, 200, lane, 100)).toBe(200);
    expect(laneY(100, 200, lane, 50)).toBe(250);
  });
});

describe("pitchPct / wordPitchCenter", () => {
  it("maps a 0..1 centroid into the band", () => {
    expect(pitchPct(0, { lo: 30, hi: 85 })).toBe(30);
    expect(pitchPct(1, { lo: 30, hi: 85 })).toBe(85);
    expect(pitchPct(0.5, { lo: 30, hi: 85 })).toBeCloseTo(57.5);
  });
  it("unpitched words sit at the center", () => {
    expect(wordPitchCenter({ centroid: [0.9] }, "unpitched", { lo: 30, hi: 85 }, 50)).toBe(50);
  });
  it("pitched words use the first syllable centroid", () => {
    expect(wordPitchCenter({ centroid: [0, 1] }, "pitched", { lo: 30, hi: 85 }, 50)).toBe(30);
  });
  it("pitched words with no centroid fall back to the center", () => {
    expect(wordPitchCenter({ centroid: [] }, "pitched", { lo: 30, hi: 85 }, 50)).toBe(50);
    expect(wordPitchCenter({}, "pitched", { lo: 30, hi: 85 }, 50)).toBe(50);
  });
});
