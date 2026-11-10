import { describe, it, expect } from "vitest";
import { GLOBAL_SECTIONS, INITIAL_SECTIONS, toggleSection, focusSection } from "../globalSections";

describe("the Global panel's collapsible submenus", () => {
  it("are the tapestry, the Line Staff and the Rhyme Clock, all open at first", () => {
    expect(GLOBAL_SECTIONS).toEqual(["tapestry", "staff", "clock"]);
    expect(INITIAL_SECTIONS).toEqual({ tapestry: true, staff: true, clock: true });
  });
  it("a header click folds or unfolds only its own submenu", () => {
    const s = toggleSection(INITIAL_SECTIONS, "staff");
    expect(s).toEqual({ tapestry: true, staff: false, clock: true });
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
