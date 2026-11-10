// The pop-up's table: the blue one-syllable tint and its title sit only on the one-syllable
// section's last two columns, not on the two-syllable blocks (Greg 2026-11-09).
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RhymeTable } from "../RhymeInfo.jsx";

const html = renderToStaticMarkup(<RhymeTable />);
const bodies = html.split("<tbody").slice(1);
const head = html.split("<tbody")[0];

describe("the rhyme info table", () => {
  it("has no blue tint or one-syllable title in the header or the two-syllable blocks", () => {
    expect(head).not.toMatch(/is-one|one-syllable words/);
    for (const b of bodies.slice(0, 4)) expect(b).not.toMatch(/is-one/);
  });
  it("puts the title over the last two columns of the one-syllable section, tinted blue there", () => {
    const section = bodies[4];
    expect(section).toMatch(/One syllable/);
    expect(section).toMatch(/colSpan="2" class="[^"]*is-one[^"]*"[^>]*>one-syllable words: only these two/i);
    for (const b of bodies.slice(5)) expect((b.match(/is-one/g) || []).length).toBe(2 * 3); // rule row + two words, two columns each
  });
  it("spans columns only where text runs across them, so the faint column lines break only there", () => {
    const spans = [...html.matchAll(/<t[hd][^>]*colSpan="(\d+)"[^>]*>(.*?)<\/t[hd]>/g)];
    expect(spans.length).toBeGreaterThan(0);
    for (const [, , inner] of spans) expect(inner.replace(/<[^>]+>/g, "").trim()).not.toBe("");
  });
  it("marks each type's rule row and definition as the type band (shaded), apart from its examples", () => {
    for (const b of bodies.filter((x) => /ri-rule/.test(x))) {
      expect(b).toMatch(/class="ri-rule ri-band"/);
      expect(b).not.toMatch(/ri-word ri-band/);
    }
    for (const b of bodies.slice(0, 4)) expect(b).toMatch(/class="ri-def ri-band"/);
  });
});
