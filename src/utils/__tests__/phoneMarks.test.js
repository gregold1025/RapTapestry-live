import { describe, it, expect } from "vitest";
import { phoneMarks, matchMarks } from "../phoneMarks";

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

describe("assonance marks only the vowel (Greg 2026-11-05: makes lit E Y K S for an EY match)", () => {
  it("phoneMarks: syllables in vowelOnly mark just their vowel", () => {
    expect(on(phoneMarks("M EY1 K S", 0, 0, new Set([0])))).toBe("EY1");
    expect(on(phoneMarks("P OW1 AH0 T", 0, 1, new Set([0])))).toBe("OW1 AH0 T");
    expect(on(phoneMarks("P OW1 AH0 T", 0, 1, new Set([1])))).toBe("OW1 AH0");
  });
  it("after an assonance syllable, the consonants before the next vowel are unlit (chill-in': the L did not match)", () => {
    expect(on(phoneMarks("CH IH1 L IH0 NG", 0, 1, new Set([0])))).toBe("IH1 IH0 NG");
    expect(on(phoneMarks("CH IH1 L IH0 NG", 0, 1))).toBe("IH1 L IH0 NG");
  });
  it("matchMarks: a match's assonance links mark only the vowel; each marked phone carries its link", () => {
    const w = { id: "x", phones: "F IY1 M EY2 L Z", nSyllables: 2 };
    const m = { type: "assonance", form: "mosaic", words: [w, { id: "y" }], vi0: 0, vi1: 1,
      links: [{ wordId: "x", k: 0, type: "perfect", counted: true }, { wordId: "x", k: 1, type: "assonance", counted: true }] };
    const ms = matchMarks(m, w);
    expect(on(ms)).toBe("IY1 EY2");
    expect(ms.filter((x) => x.on).map((x) => x.link?.type)).toEqual(["perfect", "assonance"]);
  });
});
