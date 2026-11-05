import { describe, it, expect } from "vitest";
import { nameOnsets, DRUM_CLASSES } from "../drumClasses";

const thresholds = { kick: 0.2, snare: 0.2, hihat: 0.2 };
const onsets = [{ time: 1.0, category: "low" }, { time: 2.0, category: "high" }, { time: 3.0, category: "mid" }];
const named = [
  { time: 1.01, cls: "kick", conf: 0.9, peak: 0.5 },
  { time: 1.02, cls: "snare", conf: 0.3, peak: 0.25 },
  { time: 2.1, cls: "hihat", conf: 0.8, peak: 0.6 },   // 100 ms away: not joined
  { time: 3.0, cls: "snare", conf: 0.5, peak: 0.21 },
];

describe("nameOnsets (tandem: stem onsets named by the classifier)", () => {
  it("names each onset by the strongest class within the join window; unnamed onsets are 'other'", () => {
    const out = nameOnsets(onsets, named, thresholds, 1);
    expect(out.map((h) => h.cls)).toEqual(["kick", "other", "snare"]);
    expect(out[0].conf).toBe(0.9);
    expect(out[1].conf).toBeNull();
    expect(out[0].category).toBe("low");
  });
  it("a higher threshold multiplier drops weak names", () => {
    const out = nameOnsets(onsets, named, thresholds, 1.5);
    expect(out.map((h) => h.cls)).toEqual(["kick", "other", "other"]);
  });
  it("the class list ends with 'other'", () => {
    expect(DRUM_CLASSES[DRUM_CLASSES.length - 1]).toBe("other");
  });
});
