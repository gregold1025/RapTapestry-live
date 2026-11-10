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
const [, one, two] = html.split("<table");
const rows = (t, cls) => [...t.matchAll(new RegExp(`<tr class="${cls}[^"]*">(.*?)</tr>`, "g"))].map((m) => m[1]);
const cells = (row) => (row.match(/<t[hd][ >]/g) || []).length;
const blocks = (t) => rows(t, "ri-rule").map((r) => text(r).split(" ")[0]);

describe("the rhyme info tables", () => {
  it("two sections, one syllable first, each a title, then its sentence, then its table", () => {
    const secs = [...html.matchAll(/<section class="ri-section">(.*?)<\/section>/g)].map((m) => m[1]);
    expect(secs.length).toBe(2);
    for (const [sec, title, lead] of [[secs[0], "One syllable words", ONE_SYLLABLE.text], [secs[1], "Two syllable words", TWO_SYLLABLES.text]]) {
      expect(sec).toMatch(new RegExp(`<h4 class="ri-section-title">${title}</h4><p class="ri-lead">`));
      expect(text(sec.replace(/<aside.*<\/aside>/, "").split("<table")[0])).toBe(`${title} ${lead}`);
    }
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
  it("the two-syllable table has all four columns under a black header, its last two in the same blue", () => {
    const [head] = rows(two, "ri-colhead");
    expect(text(head)).toMatch(/^Two syllables Stressed vowel Middle consonants.*Final vowel Final consonants$/);
    expect((head.match(/is-one/g) || []).length).toBe(2);
    for (const r of [...rows(two, "ri-rule"), ...rows(two, "ri-word")]) {
      expect(cells(r)).toBe(5);
      expect(r).toMatch(/^(?:(?!is-one).)*<t[hd] class="is-one".*<t[hd] class="is-one"[^]*$/);
      expect((r.match(/is-one/g) || []).length).toBe(2);
    }
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
  it("puts the vocabulary box beside the one-syllable table, one entry per code", () => {
    const sec = html.split("<section")[1];
    const box = sec.match(/<aside class="ri-vocab"[^>]*>(.*?)<\/aside>/)[1];
    expect(box).toMatch(/^<h5[^>]*>Vocabulary<\/h5>/);
    expect([...box.matchAll(/<dt><span class="ri-code ri-code-(\w+)">/g)].map((m) => m[1])).toEqual(["S", "F", "A", "W", "X"]);
    expect(sec.indexOf("ri-vocab")).toBeLessThan(sec.indexOf("<table"));
  });
  it("writes the rule rows as colored codes, not words", () => {
    for (const r of [...rows(one, "ri-rule"), ...rows(two, "ri-rule")]) {
      const cellsHtml = r.split("</th>").slice(1).join("");
      expect(text(cellsHtml)).toMatch(/^[SFAWX ]+$/);
      expect(cellsHtml).toMatch(/class="ri-code ri-code-[SFAWX]"/);
    }
  });
  it("colors each underline by its relation, in both spellings", () => {
    const rapid = rows(two, "ri-word").find((r) => r.replace(/<[^>]+>/g, "").startsWith("rapid"));
    expect(rapid).toMatch(/class="ri-u ri-u-S">a</);    // the stressed vowel: same
    expect(rapid).toMatch(/class="ri-u ri-u-W">i</);    // the final vowel: weak
    expect(rapid).toMatch(/class="ri-u ri-u-F">d</);    // the final consonant: family
    expect(rapid).toMatch(/class="ri-u ri-u-W">IH</);
    expect(rapid).toMatch(/class="ri-u ri-u-F">D</);
    expect(html).not.toMatch(/class="ri-u"/);
  });
  it("has no FA in the vocabulary box", () => {
    expect(html).not.toMatch(/ri-fa|ri-vocab-note/);
  });
  it("the vocabulary box stands beside the whole one-syllable section, its sentence on two lines", () => {
    const sec = html.split("<section")[1];
    expect(sec).toMatch(/<div class="ri-one-row"><aside class="ri-vocab"[^]*<\/aside><div class="ri-one-main"><h4/);
    expect(sec).toMatch(/<p class="ri-lead">[^<]*<br\/>[^<]*<\/p>/);
    expect(ONE_SYLLABLE.lines.join(" ")).toBe(ONE_SYLLABLE.text);
  });
});
