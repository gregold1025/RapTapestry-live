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
  it("gives an onset one mark per class above threshold (snare + hi-hat on the backbeat are both kept); unnamed onsets are 'other'", () => {
    const out = nameOnsets(onsets, named, thresholds, 1);
    expect(out.map((h) => `${h.time}:${h.cls}`)).toEqual(["1:kick", "1:snare", "2:other", "3:snare"]);
    expect(out[0].conf).toBe(0.9);
    expect(out[2].conf).toBeNull();
    expect(out[0].category).toBe("low");
  });
  it("a class is named once per onset even if the classifier fired twice within the window", () => {
    const dup = [...named, { time: 0.99, cls: "kick", conf: 0.4, peak: 0.3 }];
    const out = nameOnsets(onsets, dup, thresholds, 1);
    expect(out.filter((h) => h.time === 1 && h.cls === "kick").length).toBe(1);
    expect(out.find((h) => h.time === 1 && h.cls === "kick").conf).toBe(0.9);
  });
  it("a higher threshold multiplier drops weak names", () => {
    const out = nameOnsets(onsets, named, thresholds, 1.5);
    expect(out.map((h) => `${h.time}:${h.cls}`)).toEqual(["1:kick", "2:other", "3:other"]);
  });
  it("the class list ends with 'other'", () => {
    expect(DRUM_CLASSES[DRUM_CLASSES.length - 1]).toBe("other");
  });
});
