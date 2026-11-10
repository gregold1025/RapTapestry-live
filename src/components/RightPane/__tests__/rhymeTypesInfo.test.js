// The info pop-up's chart must say what the engine does: each example pair is run through the
// engine and has to land on the row it illustrates; its phonetic columns come from the engine's
// own syllabification, and the underlined parts are the axes the row requires to agree.
import { describe, it, expect } from "vitest";
import { buildSongModel } from "../../../engine/songModel.js";
import { computeMatches, RHYME_TYPES } from "../../../engine";
import { AXES, ROWS, ONE_SYLLABLE, TERMS, axisPhones, matchedAxes } from "../rhymeTypesInfo";

function tiny(lines) {
  let t = 0;
  const lyric = { lines: lines.map((ws) => ({ words: ws.map(([text, phones]) => { const w = { text, phones: [phones], start: t, end: t + 0.25, nSyllables: (phones.match(/\d/g) || []).length }; t += 0.3; return w; }) })) };
  const beats = Array.from({ length: Math.ceil(t / 0.5) + 8 }, (_, i) => i * 0.5);
  return buildSongModel({ songId: "tiny", lyricTranscription: lyric, drumTranscription: { beats, downbeats: beats.filter((_, i) => i % 4 === 0), estimated_bpm: 120 } });
}
const typeOf = ([a, b]) => { const s = tiny([[[a.word, a.phones]], [[b.word, b.phones]]]); return computeMatches(s, [s.words[0].id]).find((m) => m.type !== "anchor")?.type; };
const ALL = [...ROWS, ...ONE_SYLLABLE.rows];
const AX = AXES.map((a) => a.key);

describe("the rhyme info chart", () => {
  it("has the four axes, the last two marked as the only ones a one-syllable word has", () => {
    expect(AX).toEqual(["stressedVowel", "internal", "finalVowel", "coda"]);
    expect(AXES.map((a) => !!a.oneSyllable)).toEqual([false, false, true, true]);
  });
  it("has a row for perfect, loosened, shifted vowel and truncated, labeled as the pills are, each with its definition", () => {
    expect(ROWS.map((r) => r.key)).toEqual(["perfect", "loosened", "shifted", "truncated"]);
    for (const r of ROWS) expect(r.label).toBe(RHYME_TYPES.find((t) => t.key === r.key).label);
    for (const r of ALL) expect(Object.keys(r.cells)).toEqual(AX);
    for (const r of ROWS) expect(r.text).toMatch(/\w/);
  });
  it("each two-syllable example lands on its row in the engine", () => {
    for (const r of ROWS) expect([r.key, typeOf(r.example)]).toEqual([r.key, r.key]);
  });
  it("one-syllable words: only perfect and loosened, each example landing there", () => {
    expect(ONE_SYLLABLE.rows.map((r) => r.key)).toEqual(["perfect", "loosened"]);
    for (const r of ONE_SYLLABLE.rows) expect([r.key, typeOf(r.example)]).toEqual([r.key, r.key]);
  });
  it("splits phones onto the four axes the way the engine syllabifies them", () => {
    expect(axisPhones("K UW1 L ER0")).toEqual({ stressedVowel: "UW", internal: "L", finalVowel: "ER", coda: "" });
    expect(axisPhones("P EH1 N S AH0 L")).toEqual({ stressedVowel: "EH", internal: "N S", finalVowel: "AH", coda: "L" });
    expect(axisPhones("B L AA1 K S")).toEqual({ stressedVowel: "", internal: "", finalVowel: "AA", coda: "K S" });
  });
  it("underlines the axes a row requires to agree, not the free ones", () => {
    const m = Object.fromEntries(ROWS.map((r) => [r.key, matchedAxes(r)]));
    expect(m.perfect).toEqual(AX);
    expect(m.loosened).toEqual(["stressedVowel", "finalVowel", "coda"]);
    expect(m.shifted).toEqual(["internal", "finalVowel", "coda"]);
    expect(m.truncated).toEqual(["finalVowel", "coda"]);
    for (const r of ONE_SYLLABLE.rows) expect(matchedAxes(r)).toEqual(["finalVowel", "coda"]);
  });
  it("each example's spelling is cut into pieces that rebuild the word and cover every axis it has, in order", () => {
    for (const r of ALL) for (const ex of r.example) {
      expect(ex.spelling.map(([t]) => t).join("")).toBe(ex.word);
      const covered = ex.spelling.flatMap(([, ...axes]) => axes);
      const present = AX.filter((k) => axisPhones(ex.phones)[k]);
      expect([ex.word, covered.filter((k) => present.includes(k))]).toEqual([ex.word, present]);
    }
  });
  it("every example ends in final consonants, so all four columns are filled (Greg 2026-11-09)", () => {
    for (const r of ROWS) for (const ex of r.example) expect([ex.word, AX.every((k) => axisPhones(ex.phones)[k])]).toEqual([ex.word, true]);
    for (const r of ONE_SYLLABLE.rows) for (const ex of r.example) expect([ex.word, !!axisPhones(ex.phones).coda]).toEqual([ex.word, true]);
  });
  it("defines family and additive", () => {
    expect(TERMS.map((t) => t.key)).toEqual(expect.arrayContaining(["family", "additive"]));
  });
});
