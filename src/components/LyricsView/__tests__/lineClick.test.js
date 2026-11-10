// A click on a lyrics line itself (not a word, not the jump button) makes or opens its line
// query, in place of the old square button (Greg 2026-11-10).
import { describe, it, expect } from "vitest";
import { isLineClick } from "../lineClick";

// a stand-in for a DOM element: closest(selector) finds a listed class on itself or an ancestor
const el = (...classes) => ({ closest: (sel) => (sel.split(",").some((s) => classes.includes(s.trim().replace(/^\./, ""))) ? {} : null) });

describe("a click on a lyrics line", () => {
  it("counts on the line's own space", () => {
    expect(isLineClick(el("line"))).toBe(true);
    expect(isLineClick(el("words-container"))).toBe(true);
  });
  it("leaves a word and the jump button to themselves", () => {
    expect(isLineClick(el("word-wrapper"))).toBe(false);
    expect(isLineClick(el("line-jump"))).toBe(false);
  });
});
