import { describe, it, expect } from "vitest";
import { GLOBAL_SECTIONS, INITIAL_SECTIONS, toggleSection, focusSection } from "../globalSections";

describe("the Global panel's collapsible submenus", () => {
  it("are the tapestry, the Line Staff and the Rhyme Clock, all closed at first (Greg 2026-11-09)", () => {
    expect(GLOBAL_SECTIONS).toEqual(["tapestry", "staff", "clock"]);
    expect(INITIAL_SECTIONS).toEqual({ tapestry: false, staff: false, clock: false });
  });
  it("a header click folds or unfolds only its own submenu", () => {
    const s = toggleSection(INITIAL_SECTIONS, "staff");
    expect(s).toEqual({ tapestry: false, staff: true, clock: false });
    expect(toggleSection(s, "staff")).toEqual(INITIAL_SECTIONS);
  });
  it("a pane's settings button opens its submenu and folds the other two", () => {
    expect(focusSection(INITIAL_SECTIONS, "clock")).toEqual({ tapestry: false, staff: false, clock: true });
    expect(focusSection({ tapestry: false, staff: false, clock: false }, "staff")).toEqual({ tapestry: false, staff: true, clock: false });
  });
  it("ignores an unknown submenu", () => {
    expect(focusSection(INITIAL_SECTIONS, "nope")).toBe(INITIAL_SECTIONS);
  });
});
