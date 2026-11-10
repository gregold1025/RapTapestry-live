import { describe, it, expect } from "vitest";
import { RINGS_MENU, ringsFromMenu } from "../clockGeometry";

describe("the rings drop-down in the clock's bar", () => {
  it("lists every ring count, labeled in words", () => {
    expect(RINGS_MENU.map((o) => o.label)).toEqual(["1 ring", "2 rings", "4 rings", "8 rings", "16 rings", "32 rings", "all rings"]);
  });
  it("turns the menu's string back into the lever's value", () => {
    expect(ringsFromMenu("8")).toBe(8);
    expect(ringsFromMenu("1")).toBe(1);
    expect(ringsFromMenu("all")).toBe("all");
  });
});
