import { describe, it, expect } from "vitest";
import { isBackgroundTarget } from "../scrollTarget";

// Fake DOM nodes: tagName + closest(selector) answering only for the classes we use.
const node = (tagName, { toolbar = false, glyph = false } = {}) => ({
  tagName,
  closest: (sel) => (sel === ".scroll-toolbar" ? (toolbar ? {} : null) : null),
  getAttribute: (n) => (n === "pointer-events" && glyph ? "visiblePainted" : null),
});

describe("isBackgroundTarget (scroll layout click-to-play)", () => {
  it("the container, the content wrapper and a layer's svg root are background", () => {
    expect(isBackgroundTarget(node("DIV"))).toBe(true);
    expect(isBackgroundTarget(node("svg"))).toBe(true);
  });
  it("glyphs (rect / path / circle / use) are not background", () => {
    for (const t of ["rect", "path", "circle", "use"]) expect(isBackgroundTarget(node(t))).toBe(false);
  });
  it("the Freeze / Follow toolbar is not background", () => {
    expect(isBackgroundTarget(node("BUTTON", { toolbar: true }))).toBe(false);
  });
});
