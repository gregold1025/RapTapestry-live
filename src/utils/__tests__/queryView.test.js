import { describe, it, expect } from "vitest";
import { visibleQueries, wordQueryInfo, isHighlit } from "../queryView";

const q = (id, extra = {}) => ({ id, kind: "word", anchorIds: [], active: true, types: new Set(["perfect", "assonance"]), radius: null, ...extra });

describe("visibleQueries (solo)", () => {
  const qs = [q("a"), q("b", { active: false }), q("c")];
  it("without solo: every shown (active) query", () => {
    expect(visibleQueries(qs, "a", false).map((x) => x.id)).toEqual(["a", "c"]);
  });
  it("with solo: only the focused query", () => {
    expect(visibleQueries(qs, "c", true).map((x) => x.id)).toEqual(["c"]);
  });
  it("solo only hides the others; a hidden focused query stays hidden", () => {
    expect(visibleQueries(qs, "b", true)).toEqual([]);
  });
  it("solo with no focused query shows every shown query", () => {
    expect(visibleQueries(qs, null, true).map((x) => x.id)).toEqual(["a", "c"]);
  });
});

describe("wordQueryInfo (tapestry and Line Staff hover)", () => {
  const song = {
    byId: new Map([
      ["0-0", { id: "0-0", text: "raise", li: 0, wi: 0 }],
      ["0-1", { id: "0-1", text: "me", li: 0, wi: 1 }],
      ["1-0", { id: "1-0", text: "blaze", li: 1, wi: 0 }],
      ["2-0", { id: "2-0", text: "days", li: 2, wi: 0 }],
    ]),
    lines: [{ words: [{ text: "raise" }, { text: "me" }] }, { words: [{ text: "blaze" }] }, { words: [{ text: "days" }] }],
  };
  const A = q("A", { anchorIds: ["0-0"] });
  const B = q("B", { anchorIds: ["2-0"] });
  const m = (type, ids, start = 1) => ({ type, words: ids.map((id) => ({ id })), start });
  const matches = new Map([
    ["A", [m("anchor", ["0-0"]), m("perfect", ["1-0"]), m("perfect", ["2-0"]), m("identical", ["0-1"])]],
    ["B", [m("anchor", ["2-0"]), m("assonance", ["1-0"])]],
  ]);

  it("a query's word: 'query' and its shown match count (types on, within the radius)", () => {
    const info = wordQueryInfo("0-0", [A, B], matches, song, null);
    expect(info.query).toEqual({ id: "A", count: 2 });
    expect(info.matchOf).toEqual([]);
  });
  it("a match: the query word it matches, every query, the one it is drawn in first", () => {
    const info = wordQueryInfo("1-0", [A, B], matches, song, "B");
    expect(info.query).toBeNull();
    expect(info.matchOf).toEqual([
      { id: "B", word: "days", type: "assonance" },
      { id: "A", word: "raise", type: "perfect" },
    ]);
  });
  it("a word both a query and a match says both", () => {
    const info = wordQueryInfo("2-0", [A, B], matches, song, "B");
    expect(info.query).toEqual({ id: "B", count: 1 });
    expect(info.matchOf).toEqual([{ id: "A", word: "raise", type: "perfect" }]);
  });
  it("a match whose type is off is not listed", () => {
    expect(wordQueryInfo("0-1", [A, B], matches, song, null)).toBeNull();
  });
  it("a free word: nothing", () => {
    expect(wordQueryInfo("9-9", [A, B], matches, song, null)).toBeNull();
  });
});

describe("isHighlit (the match a click opened the query on)", () => {
  it("a word match holds the highlighted word", () => {
    const m = { words: [{ id: "1-0" }, { id: "1-1" }] };
    expect(isHighlit(m, { wordId: "1-1" })).toBe(true);
    expect(isHighlit(m, { wordId: "2-0" })).toBe(false);
  });
  it("a line match is the highlighted line", () => {
    expect(isHighlit({ lineIdx: 3, words: [] }, { lineIdx: 3 })).toBe(true);
    expect(isHighlit({ lineIdx: 4, words: [] }, { lineIdx: 3 })).toBe(false);
  });
  it("no highlight: nothing", () => {
    expect(isHighlit({ lineIdx: 3, words: [{ id: "1-0" }] }, null)).toBe(false);
  });
});
