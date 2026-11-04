import { describe, it, expect } from "vitest";
import { buildTiming } from "../timingModel";

const lyric = {
  lines: [
    {
      words: [
        { text: "hello", start: 1.0, end: 1.6, nSyllables: 2, phones: ["HH AH0 L OW1"] },
        { text: "you", start: 1.7, end: 1.9, nSyllables: 1, phones: ["Y UW1"] },
      ],
    },
  ],
};

const measured = {
  lines: [
    {
      words: [
        {
          text: "hello",
          start: 1.0, end: 1.6,
          mfa: { status: "aligned", start: 0.95, end: 1.62, pron: "HH AH0 L OW1",
            syllables: [{ vowel: "AH0", onset: 1.0 }, { vowel: "OW1", onset: 1.3 }] },
          measured: [{ k: 0, vowel: "AH", stress: 0, f0: 150 }, { k: 1, vowel: "OW", stress: 1, f0: 210 }],
        },
        { text: "you", start: 1.7, end: 1.9, mfa: { status: "failed" }, measured: [] },
      ],
    },
  ],
};

describe("buildTiming", () => {
  it("uses MFA word times and syllable onsets for aligned words", () => {
    const t = buildTiming(lyric, measured);
    const w = t.words.get("0-0");
    expect(w.start).toBe(0.95);
    expect(w.end).toBe(1.62);
    expect(w.syls.map((s) => s.start)).toEqual([1.0, 1.3]);
    expect(w.syls[0].end).toBe(1.3);
    expect(w.syls[1].end).toBe(1.62);
    expect(w.syls.map((s) => s.f0)).toEqual([150, 210]);
    expect(w.f0).toBe(210); // median of the word's voiced vowels (upper median of two)
    expect(w.aligned).toBe(true);
  });
  it("falls back to an even split for words that are not aligned", () => {
    const t = buildTiming(lyric, measured);
    const w = t.words.get("0-1");
    expect(w.aligned).toBe(false);
    expect(w.start).toBe(1.7);
    expect(w.syls.length).toBe(1);
    expect(w.syls[0].f0).toBeNull();
  });
  it("falls back entirely when there is no measured file", () => {
    const t = buildTiming(lyric, null);
    const w = t.words.get("0-0");
    expect(w.syls.map((s) => s.start)).toEqual([1.0, 1.3]);
    expect(t.f0Mid).toBeNull();
  });
  it("f0Mid is the median of every measured syllable F0", () => {
    const t = buildTiming(lyric, measured);
    expect(t.f0Mid).toBe(210);
  });
});
