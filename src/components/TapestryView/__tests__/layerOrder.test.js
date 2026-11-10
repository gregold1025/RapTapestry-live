// Bar, beat and sub-beat lines sit behind every glyph, in every view (Greg 2026-11-10): the grid
// is the bottom layer of the tapestry and of the Line Staff; the loop region stays on top.
import { describe, it, expect } from "vitest";
import { layerOrder } from "../layerOrder";

describe("the layer order", () => {
  it("puts the grid at the bottom of the tapestry", () => {
    expect(layerOrder("tapestry")).toEqual(["grid", "bass", "vocals", "drums", "loop"]);
  });
  it("puts the grid at the bottom of the Line Staff", () => {
    expect(layerOrder("staff")).toEqual(["grid", "bass", "staff-vocals", "drums", "loop"]);
  });
});
