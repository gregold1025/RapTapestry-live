import { describe, it, expect } from "vitest";
import { stageLayout } from "../stageLayout";

describe("stageLayout (the Line Staff and Rhyme Clock band under the tapestry)", () => {
  it("has no band when neither pane is open", () => {
    expect(stageLayout({ width: 1200, height: 900, staffOpen: false, clockOpen: false })).toEqual({ bandH: 0, clockW: 0 });
  });
  it("keeps the Line Staff's original height, 44% of the stage", () => {
    expect(stageLayout({ width: 1200, height: 900, staffOpen: true, clockOpen: false })).toEqual({ bandH: 396, clockW: 0 });
  });
  it("gives the clock a square in the corner, with or without the Line Staff", () => {
    expect(stageLayout({ width: 1200, height: 900, staffOpen: true, clockOpen: true })).toEqual({ bandH: 396, clockW: 396 });
    expect(stageLayout({ width: 1200, height: 900, staffOpen: false, clockOpen: true })).toEqual({ bandH: 396, clockW: 396 });
  });
  it("never lets the clock take more than half the width", () => {
    expect(stageLayout({ width: 600, height: 900, staffOpen: true, clockOpen: true })).toEqual({ bandH: 396, clockW: 300 });
  });
});
