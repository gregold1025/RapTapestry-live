// Loading a session (Greg 2026-11-09): a file for another song switches songs first; the
// per-song state applies once that song is mounted, and only once.
import { describe, it, expect } from "vitest";
import { loadPlan, shouldApply } from "../loadPlan";

describe("loading a session", () => {
  it("switches songs only when the file is for another song", () => {
    expect(loadPlan("Amen", { song: "93Til" })).toEqual({ switchSong: true });
    expect(loadPlan("Amen", { song: "Amen" })).toEqual({ switchSong: false });
  });
  it("applies the per-song state once its song is mounted, and once", () => {
    expect(shouldApply({ song: "Amen", applied: false }, "Amen")).toBe(true);
    expect(shouldApply({ song: "Amen", applied: false }, "93Til")).toBe(false);
    expect(shouldApply({ song: "Amen", applied: true }, "Amen")).toBe(false);
    expect(shouldApply(null, "Amen")).toBe(false);
  });
});
