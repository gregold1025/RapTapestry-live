import { describe, it, expect } from "vitest";
import { stageLayout } from "../stageLayout";

describe("stageLayout (the Line Staff and Rhyme Clock band under the tapestry)", () => {
  it("has no band when neither pane is open", () => {
    expect(stageLayout({ width: 1200, height: 900, staffOpen: false, clockOpen: false })).toEqual({ bandH: 0, clockW: 0 });
  });
  it("makes the band half as tall as it is wide, so the two halves are squares", () => {
    expect(stageLayout({ width: 1200, height: 900, staffOpen: true, clockOpen: true })).toEqual({ bandH: 600, clockW: 600 });
  });
  it("keeps the clock's square in the corner without the Line Staff, and the band without the clock", () => {
    expect(stageLayout({ width: 1200, height: 900, staffOpen: false, clockOpen: true })).toEqual({ bandH: 600, clockW: 600 });
    expect(stageLayout({ width: 1200, height: 900, staffOpen: true, clockOpen: false })).toEqual({ bandH: 600, clockW: 0 });
  });
  it("leaves the tapestry at least 30% of the stage", () => {
    expect(stageLayout({ width: 1600, height: 800, staffOpen: true, clockOpen: true })).toEqual({ bandH: 560, clockW: 560 });
  });
});
