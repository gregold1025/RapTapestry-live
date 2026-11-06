import { describe, it, expect } from "vitest";
import { matchLabel, tagsText } from "../matchLabel";

describe("matchLabel: the identity, its tags, and the form when it is not a whole word", () => {
  it("anchor -> query", () => expect(matchLabel({ isAnchor: true, type: "anchor", form: "word" })).toBe("query"));
  it("perfect whole word -> perfect", () => expect(matchLabel({ type: "perfect", tags: [], form: "word" })).toBe("perfect"));
  it("loosened with tags and a form -> loosened (family+additive) mosaic", () => {
    expect(matchLabel({ type: "loosened", tags: ["family+additive"], form: "mosaic" })).toBe("loosened (family+additive) mosaic");
  });
  it("several tags are joined with commas; no tags means no parentheses", () => {
    expect(tagsText(["wildcard", "additive"])).toBe("(wildcard, additive)");
    expect(tagsText([])).toBe("");
    expect(matchLabel({ type: "shifted", form: "semirhyme" })).toBe("shifted semirhyme");
  });
});
