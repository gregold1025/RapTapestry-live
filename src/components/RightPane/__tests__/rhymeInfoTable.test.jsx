// The pop-up's tables (Greg 2026-11-09): the one-syllable section first, centered, with only its
// two columns (final vowel, final consonants, in blue); then the two-syllable section on all four.
// Each opens with a short sentence and its own black column header.
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RhymeTable } from "../RhymeInfo.jsx";
import { ONE_SYLLABLE, TWO_SYLLABLES } from "../rhymeTypesInfo";

const html = renderToStaticMarkup(<RhymeTable />);
const text = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const [before, one, two] = html.split("<table");
const rows = (t, cls) => [...t.matchAll(new RegExp(`<tr class="${cls}[^"]*">(.*?)</tr>`, "g"))].map((m) => m[1]);
const cells = (row) => (row.match(/<t[hd][ >]/g) || []).length;
const blocks = (t) => rows(t, "ri-rule").map((r) => text(r).split(" ")[0]);

describe("the rhyme info tables", () => {
  it("one syllable first, centered, its sentence above it; then two syllables with theirs", () => {
    expect(before).toMatch(/class="ri-one-wrap"/);
    expect(text(before)).toContain(ONE_SYLLABLE.text);
    expect(text(one.split("</table>")[1])).toContain(TWO_SYLLABLES.text);
    expect(blocks(one)).toEqual(["Perfect", "Loosened"]);
    expect(blocks(two)).toEqual(["Perfect", "Loosened", "Shifted", "Truncated"]);
  });
  it("the one-syllable table has only its two columns, no vacant ones, tinted blue", () => {
    const [head] = rows(one, "ri-colhead");
    expect(text(head)).toBe("One syllable Final vowel Final consonants");
    expect(one).not.toMatch(/ri-blank/);
    for (const r of [...rows(one, "ri-rule"), ...rows(one, "ri-word")]) {
      expect(cells(r)).toBe(3);
      expect((r.match(/is-one/g) || []).length).toBe(2);
    }
  });
  it("the two-syllable table has all four columns under a black header, and no blue", () => {
    expect(text(rows(two, "ri-colhead")[0])).toMatch(/^Two syllables Stressed vowel Middle consonants.*Final vowel Final consonants$/);
    for (const r of [...rows(two, "ri-rule"), ...rows(two, "ri-word")]) expect(cells(r)).toBe(5);
    expect(two).not.toMatch(/is-one/);
  });
  it("spans columns only where text runs across them, so the faint column lines break only there", () => {
    const spans = [...html.matchAll(/<t[hd][^>]*colSpan="(\d+)"[^>]*>(.*?)<\/t[hd]>/g)];
    for (const [, , inner] of spans) expect(text(inner)).not.toBe("");
  });
  it("marks each type's rule row and definition as the type band (shaded), apart from its examples", () => {
    expect(rows(one, "ri-rule ri-band").length).toBe(2);
    expect(rows(two, "ri-rule ri-band").length).toBe(4);
    expect(rows(two, "ri-def ri-band").length).toBe(4);
    expect(html).not.toMatch(/ri-word ri-band/);
  });
});
