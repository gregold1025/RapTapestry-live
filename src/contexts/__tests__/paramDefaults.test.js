import { describe, it, expect } from "vitest";
import { DRUM_DEFAULTS, BASS_DEFAULTS } from "../paramDefaults";

describe("Greg's defaults (2026-11-06)", () => {
  it("drums: black, 40% opacity, 80% size for all glyphs", () => {
    expect(DRUM_DEFAULTS.fillColor).toBe("#000000");
    expect(DRUM_DEFAULTS.opacity).toBe(0.4);
    expect(DRUM_DEFAULTS.size).toBe(0.8);
  });
  it("bass: 20% opacity, 10 px thick, 1 px blur, rgb(64, 75, 119)", () => {
    expect(BASS_DEFAULTS.opacity).toBe(0.2);
    expect(BASS_DEFAULTS.thickness).toBe(10);
    expect(BASS_DEFAULTS.blur).toBe(1);
    expect(BASS_DEFAULTS.fillColor).toBe("#404b77");
  });
});
