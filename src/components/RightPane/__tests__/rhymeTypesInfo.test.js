// The info pop-up's chart must say what the engine does: each example pair is run through the
// engine and has to land on the row it illustrates.
import { describe, it, expect } from "vitest";
import { buildSongModel } from "../../../engine/songModel.js";
import { computeMatches, RHYME_TYPES } from "../../../engine";
import { AXES, ROWS, ONE_SYLLABLE, TERMS } from "../rhymeTypesInfo";

function tiny(lines) {
  let t = 0;
  const lyric = { lines: lines.map((ws) => ({ words: ws.map(([text, phones]) => { const w = { text, phones: [phones], start: t, end: t + 0.25, nSyllables: (phones.match(/\d/g) || []).length }; t += 0.3; return w; }) })) };
  const beats = Array.from({ length: Math.ceil(t / 0.5) + 8 }, (_, i) => i * 0.5);
  return buildSongModel({ songId: "tiny", lyricTranscription: lyric, drumTranscription: { beats, downbeats: beats.filter((_, i) => i % 4 === 0), estimated_bpm: 120 } });
}
const typeOf = ([a, b]) => { const s = tiny([[a], [b]]); return computeMatches(s, [s.words[0].id]).find((m) => m.type !== "anchor")?.type; };

describe("the rhyme info chart", () => {
  it("has the four axes, the last two marked as the only ones a one-syllable word has", () => {
    expect(AXES.map((a) => a.key)).toEqual(["stressedVowel", "internal", "finalVowel", "coda"]);
    expect(AXES.map((a) => !!a.oneSyllable)).toEqual([false, false, true, true]);
  });
  it("has a row for perfect, loosened, shifted vowel and truncated, labeled as the pills are", () => {
    expect(ROWS.map((r) => r.key)).toEqual(["perfect", "loosened", "shifted", "truncated"]);
    for (const r of ROWS) expect(r.label).toBe(RHYME_TYPES.find((t) => t.key === r.key).label);
    for (const r of ROWS) expect(Object.keys(r.cells)).toEqual(AXES.map((a) => a.key));
  });
  it("each two-syllable example lands on its row in the engine", () => {
    for (const r of ROWS) expect([r.key, typeOf(r.example)]).toEqual([r.key, r.key]);
  });
  it("one-syllable words: only perfect and loosened, each example landing there", () => {
    expect(ONE_SYLLABLE.rows.map((r) => r.key)).toEqual(["perfect", "loosened"]);
    for (const r of ONE_SYLLABLE.rows) expect([r.key, typeOf(r.example)]).toEqual([r.key, r.key]);
  });
  it("defines family and additive", () => {
    expect(TERMS.map((t) => t.key)).toEqual(expect.arrayContaining(["family", "additive"]));
  });
});
