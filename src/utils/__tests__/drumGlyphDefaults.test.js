import { describe, it, expect } from "vitest";
import { defaultGlyphFor, pickUnused } from "../drumGlyphDefaults";

const names = ["circle", "shape-4-sided-square", "shape-3-sided-triangle", "line-slash-forward", "shape-5-sided-pentagon (1)", "line-squiggle-long", "star"];
const urls = names.map((n) => `data:${n}`);                 // the bundler inlines small svgs: urls carry no name
const byName = Object.fromEntries(names.map((n, i) => [n, urls[i]]));

describe("drum glyph defaults (Greg 2026-11-05)", () => {
  it("kick/low square, snare/mid triangle, hi-hat/high slash, tom pentagon, cymbal squiggle, unnamed none", () => {
    expect(defaultGlyphFor("kick", byName)).toMatch(/square/);
    expect(defaultGlyphFor("low", byName)).toMatch(/square/);
    expect(defaultGlyphFor("snare", byName)).toMatch(/triangle/);
    expect(defaultGlyphFor("mid", byName)).toMatch(/triangle/);
    expect(defaultGlyphFor("hihat", byName)).toMatch(/slash/);
    expect(defaultGlyphFor("high", byName)).toMatch(/slash/);
    expect(defaultGlyphFor("tom", byName)).toMatch(/pentagon/);
    expect(defaultGlyphFor("cymbal", byName)).toMatch(/squiggle/);
    expect(defaultGlyphFor("other", byName)).toBeNull();
  });
  it("pickUnused never returns a glyph another row holds", () => {
    const taken = new Set(urls.slice(0, 6));
    for (let i = 0; i < 20; i++) expect(pickUnused(urls, taken)).toBe("data:star");
    expect(pickUnused(urls, new Set(urls))).toBeNull();
  });
});
