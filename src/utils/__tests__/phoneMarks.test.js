import { describe, it, expect } from "vitest";
import { phoneMarks } from "../phoneMarks";

const on = (marks) => marks.filter((m) => m.on).map((m) => m.p).join(" ");

describe("phoneMarks: which phones made the rhyme", () => {
  it("a one-syllable word: the vowel and what follows, not the onset", () => {
    expect(on(phoneMarks("W EY1 JH", 0, 0))).toBe("EY1 JH");
  });
  it("an embedded match marks only the rhyming syllable's vowel and coda", () => {
    // en-GAGE-ments: syllables EH0 N | G EY1 JH | M AH0 N T S (maximal onset)
    expect(on(phoneMarks("EH0 N G EY1 JH M AH0 N T S", 1, 1))).toBe("EY1 JH");
  });
  it("a range of syllables marks from the first rhyming vowel through the last syllable", () => {
    expect(on(phoneMarks("P OW1 AH0 T", 0, 1))).toBe("OW1 AH0 T");
    expect(on(phoneMarks("P OW1 AH0 T", 1, 1))).toBe("AH0 T");
  });
  it("keeps every phone, in order, marked or not", () => {
    const m = phoneMarks("S T EY1", 0, 0);
    expect(m.map((x) => x.p)).toEqual(["S", "T", "EY1"]);
    expect(m.map((x) => x.on)).toEqual([false, false, true]);
  });
  it("no range (or no vowels) marks nothing", () => {
    expect(on(phoneMarks("HH M", 0, 0))).toBe("");
    expect(on(phoneMarks("W EY1 JH", null, null))).toBe("");
    expect(phoneMarks("", 0, 0)).toEqual([]);
  });
});

describe("phoneMarks: the syllable each phone belongs to", () => {
  it("gives each phone its syllable index (k)", () => {
    expect(phoneMarks("P OW1 AH0 T", 0, 1).map((x) => x.k)).toEqual([0, 0, 1, 1]);
  });
});

import { sylRange, linkTypeAt } from "../phoneMarks";
describe("sylRange: the syllables a match covers in one of its words", () => {
  const w = { id: "w", nSyllables: 2, rime: { stressedSyl: 1 } };
  it("a whole-word match with its own range uses it (slap-stick: both syllables)", () => {
    expect(sylRange({ type: "perfect", form: "word", words: [w], vi0: 0, vi1: 1 }, w)).toEqual({ vi0: 0, vi1: 1 });
  });
  it("a whole-word match without a range starts at the stressed syllable", () => {
    expect(sylRange({ type: "perfect", form: "word", words: [w] }, w)).toEqual({ vi0: 1, vi1: 1 });
  });
});
describe("linkTypeAt: the link type of a word's syllable inside a match", () => {
  const m = { links: [{ wordId: "a", k: 0, kEnd: 0, type: "additive", counted: true }, { wordId: "b", k: 0, kEnd: 1, type: "perfect", counted: true }] };
  it("finds the link covering that syllable, merged syllables included", () => {
    expect(linkTypeAt(m, "a", 0).type).toBe("additive");
    expect(linkTypeAt(m, "b", 1).type).toBe("perfect");
    expect(linkTypeAt(m, "c", 0)).toBe(null);
  });
});
