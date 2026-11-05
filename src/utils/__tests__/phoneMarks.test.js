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
