import { describe, it, expect } from "vitest";
import { STAFF_BARS_MENU, barsFromMenu } from "../staffBars";
import { barsLabel } from "../../../utils/scrollWindow";
import { cyclesLabel } from "../../ClockPane/clockGeometry";

describe("the Line Staff's bars drop-down", () => {
  it("offers 2, 4 and 8 bars", () => {
    expect(STAFF_BARS_MENU.map((o) => o.label)).toEqual(["2 bars", "4 bars", "8 bars"]);
  });
  it("turns the menu's string back into a number", () => {
    expect(barsFromMenu("4")).toBe(4);
  });
});

describe("the bars' place text (no 'frozen': the Follow button says it)", () => {
  it("Line Staff: bars range only, frozen or not", () => {
    expect(barsLabel(25, 29, false, false)).toBe("bars 25–29");
    expect(barsLabel(25, 29, true, false)).toBe("bars 25–29");
    expect(barsLabel(3, 3, false, true)).toBe("bars 3");
  });
  it("Line Staff: still says following while it plays and follows", () => {
    expect(barsLabel(25, 29, true, true)).toBe("bars 25–29 · following");
  });
  it("Rhyme Clock: cycles range only", () => {
    expect(cyclesLabel(40, 4, 8)).toBe("cycles 5–12");
    expect(cyclesLabel(40, -1, 2)).toBe("cycles 1–1");
    expect(cyclesLabel(0, 0, 8)).toBe("");
  });
});
