import { describe, it, expect } from "vitest";
import { queryLabel, trimBefore, trimAfter } from "../queryLabel";

const song = {
  lines: [
    { words: [{ text: "Shawty" }, { text: "a" }, { text: "big" }, { text: "ace," }, { text: "raise" }, { text: "me" }, { text: "a" }, { text: "big" }, { text: "wage" }] },
    { words: [{ text: "Tell" }, { text: "your" }, { text: "lil'" }, { text: "rapper" }, { text: "friends" }, { text: "I" }, { text: "will" }, { text: "not" }, { text: "engage" }] },
  ],
};
song.byId = new Map();
song.lines.forEach((l, li) => l.words.forEach((w, wi) => { w.id = `${li}-${wi}`; w.li = li; w.wi = wi; song.byId.set(w.id, w); }));

describe("queryLabel", () => {
  it("a word query: the anchor bold inside its line, trimmed to about 40 characters", () => {
    const l = queryLabel({ kind: "word", anchorIds: ["0-4"] }, song, 40);
    expect(l.anchor).toBe("raise");
    expect(l.before.endsWith("ace, ")).toBe(true);
    expect(l.after.startsWith(" me a big")).toBe(true);
    expect((l.before + l.anchor + l.after).length).toBeLessThanOrEqual(46); // 40 + ellipses + spaces
  });
  it("a run keeps every anchor word together", () => {
    const l = queryLabel({ kind: "word", anchorIds: ["1-6", "1-7", "1-8"] }, song, 40);
    expect(l.anchor).toBe("will not engage");
    expect(l.after).toBe("");
  });
  it("a line query: the whole line with its last word as the anchor", () => {
    const l = queryLabel({ kind: "line", lineIdx: 1, anchorIds: ["1-8"] }, song, 60);
    expect(l.anchor).toBe("engage");
    expect(l.before).toBe("Tell your lil' rapper friends I will not ");
    expect(l.after).toBe("");
  });
  it("a run across a line boundary takes before from the first line and after from the last", () => {
    const l = queryLabel({ kind: "word", anchorIds: ["0-8", "1-0"] }, song, 40);
    expect(l.anchor).toBe("wage Tell");
    expect(l.before.endsWith("big ")).toBe(true);
    expect(l.after.startsWith(" your")).toBe(true);
  });
  it("trims at word boundaries with an ellipsis", () => {
    expect(trimBefore("one two three four", 10)).toBe("…three four");
    expect(trimBefore("one two three four", 9)).toBe("…four");
    expect(trimAfter("one two three four", 9)).toBe("one two…");
    expect(trimBefore("short", 9)).toBe("short");
  });
});
