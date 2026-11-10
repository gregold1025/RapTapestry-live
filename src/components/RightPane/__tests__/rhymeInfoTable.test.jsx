// The pop-up's table (Greg 2026-11-09): the one-syllable section first, then the two-syllable one;
// each opens with a short sentence and its own black column header (one syllable: only final vowel
// and final consonants). The blue tint sits only on the one-syllable section's two columns.
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RhymeTable } from "../RhymeInfo.jsx";
import { ONE_SYLLABLE, TWO_SYLLABLES } from "../rhymeTypesInfo";

const html = renderToStaticMarkup(<RhymeTable />);
const bodies = html.split("<tbody").slice(1);
const text = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const heads = bodies.filter((b) => /ri-colhead/.test(b));
const blocks = bodies.filter((b) => /ri-rule/.test(b));

describe("the rhyme info table", () => {
  it("has two sections, one syllable first, each a sentence then a black column header", () => {
    expect(heads.length).toBe(2);
    expect(bodies.indexOf(heads[0])).toBe(0);
    for (const [h, lead] of [[heads[0], ONE_SYLLABLE.text], [heads[1], TWO_SYLLABLES.text]]) {
      expect(h).toMatch(/class="ri-lead"[\s\S]*class="ri-colhead/);
      expect(text(h)).toContain(lead);
    }
    expect(text(heads[0].split("class=\"ri-colhead")[1])).toMatch(/^.*One syllable\s+Final vowel\s+Final consonants$/);
    expect(text(heads[1].split("class=\"ri-colhead")[1])).toMatch(/Two syllables\s+Stressed vowel\s+Middle consonants.*Final vowel\s+Final consonants$/);
  });
  it("lists the one-syllable types before the two-syllable ones", () => {
    const keys = blocks.map((b) => text(b.split("ri-rule")[1].replace(/^[^>]*>/, "")).split(" ")[0]);
    expect(keys).toEqual(["Perfect", "Loosened", "Perfect", "Loosened", "Shifted", "Truncated"]);
    expect(bodies.indexOf(blocks[1])).toBeLessThan(bodies.indexOf(heads[1]));
  });
  it("tints blue only the one-syllable section's two columns", () => {
    expect((heads[0].match(/is-one/g) || []).length).toBe(2);
    expect(heads[1]).not.toMatch(/is-one/);
    for (const b of blocks.slice(0, 2)) expect((b.match(/is-one/g) || []).length).toBe(2 * 3); // rule row + two words
    for (const b of blocks.slice(2)) expect(b).not.toMatch(/is-one/);
  });
  it("spans columns only where text runs across them, so the faint column lines break only there", () => {
    const spans = [...html.matchAll(/<t[hd][^>]*colSpan="(\d+)"[^>]*>(.*?)<\/t[hd]>/g)];
    expect(spans.length).toBeGreaterThan(0);
    for (const [, , inner] of spans) expect(text(inner)).not.toBe("");
  });
  it("marks each type's rule row and definition as the type band (shaded), apart from its examples", () => {
    for (const b of blocks) {
      expect(b).toMatch(/class="ri-rule ri-band"/);
      expect(b).not.toMatch(/ri-word ri-band/);
    }
    for (const b of blocks.slice(2)) expect(b).toMatch(/class="ri-def ri-band"/);
  });
});
