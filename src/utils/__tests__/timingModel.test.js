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

describe("buildTiming: syllable clusters and spelled chunks (Line Staff)", () => {
  it("an aligned word carries its phone clusters, vowel spans and spelling chunks", async () => {
    const fs = await import("node:fs");
    const { buildTiming } = await import("../timingModel");
    const dir = "public/data/RhymesLikeDimes/";
    const lyrics = JSON.parse(fs.readFileSync(dir + "lyric-transcription.json"));
    const measured = JSON.parse(fs.readFileSync(dir + "lyric-transcription.measured.json"));
    const t = buildTiming(lyrics, measured);
    const w = t.words.get("9-9"); // Alamo: AE1 L AH0 M OW0
    expect(w.aligned).toBe(true);
    expect(w.syls.map((s) => s.cluster.join(" "))).toEqual(["ae", "l ah", "m ow"]);
    expect(w.syls.map((s) => s.vIdx)).toEqual([0, 1, 1]);
    expect(w.syls.every((s) => s.vStart >= s.start && s.vEnd <= s.end + 1e-6)).toBe(true);
    expect(w.syls.map((s) => s.chunk).join("")).toBe("Alamo");
    expect(w.phones).toBe("AE1 L AH0 M OW0");
  });
});
