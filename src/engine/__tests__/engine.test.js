// Greg's regression cases for the typed rhyme rules (memory: new-prototypes, 2026-10-20),
// run against the real song data through computeMatches (what the app calls).
// wage / engagements / tree trunk are in Amen; handball / all in 93 Til.
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildSongModel } from "../songModel";
import { computeMatches } from "../index";
import { songSyllables } from "../syllableMatch";

const DATA = path.resolve(__dirname, "../../../public/data");
function load(songId) {
  const lyric = JSON.parse(fs.readFileSync(path.join(DATA, songId, "lyric-transcription.json"), "utf8"));
  const drums = JSON.parse(fs.readFileSync(path.join(DATA, songId, "drum-transcription.json"), "utf8"));
  return buildSongModel({ songId, lyricTranscription: lyric, drumTranscription: drums });
}
let amen, til;
beforeAll(() => { amen = load("Amen"); til = load("93Til"); });

const byText = (text, s) => s.words.filter((w) => w.text.toLowerCase().replace(/[^a-z']/g, "") === text);
const others = (s, ids) => computeMatches(s, ids).filter((m) => m.type !== "anchor");

describe("song model", () => {
  it("builds one entry per word with a rime for dictionary words", () => {
    expect(til.words.length).toBe(996);
    expect(til.words.filter((w) => w.rime).length).toBeGreaterThan(950);
    expect(til.numBars).toBeGreaterThan(60);
    expect(amen.words.length).toBe(547);
  });
});

describe("regression cases", () => {
  it("handball reaches 'all' (whole word) and 'man's all' (mosaic over both syllables)", () => {
    const ms = others(til, [byText("handball", til)[0].id]);
    expect(ms.some((m) => m.text.toLowerCase() === "all" && m.form === "word")).toBe(true);
    const ma = ms.find((m) => /man's all/i.test(m.text));
    expect(ma.form).toBe("mosaic");
    expect(ma.links).toHaveLength(2);
  });
  it("tree trunk finds we funk and weak luck as mosaics", () => {
    const tree = byText("tree", amen).find((w) => amen.words[w.flat + 1]?.text.toLowerCase().startsWith("trunk"));
    const ms = others(amen, [tree.id, amen.words[tree.flat + 1].id]);
    expect(ms.find((m) => /we funk/i.test(m.text)).form).toBe("mosaic");
    expect(ms.some((m) => /weak luck/i.test(m.text))).toBe(true);
  });
});

describe("computeMatches (what the app calls)", () => {
  it("returns anchors first for a multi-word query and typed matches after", () => {
    const tree = byText("tree", amen).find((w) => amen.words[w.flat + 1]?.text.toLowerCase().startsWith("trunk"));
    const out = computeMatches(amen, [tree.id, amen.words[tree.flat + 1].id]);
    expect(out.filter((m) => m.type === "anchor").length).toBe(2);
    expect(out.slice(0, 2).every((m) => m.type === "anchor")).toBe(true);
    expect(out.some((m) => m.type !== "anchor" && m.vi0 != null)).toBe(true);
  });
  it("returns an empty list for an unknown word id", () => {
    expect(computeMatches(amen, ["999-999"])).toEqual([]);
  });
});

describe("readings by hand (Greg, 2026-11-06: admire and perspire are two syllables; no -ire rule)", () => {
  it("admire reads AE0 D M AY1 ER0 (-ire as two syllables, three in all, like desire)", () => {
    const admire = til.words.find((w) => /^admire/i.test(w.text.trim()));
    expect(admire.phones).toBe("AE0 D M AY1 ER0");
    expect(admire.nSyllables).toBe(3);
    expect(admire.variants).toEqual(["AE0 D M AY1 ER0"]);
    const desire = til.words.find((w) => /^desire/i.test(w.text.trim()));
    expect(desire.nSyllables).toBe(3);
  });
  it("flyer is two syllables in the syllable stream (no merge of AY + ER)", () => {
    const flyer = til.words.find((w) => /^flyer/i.test(w.text.trim()));
    const syls = songSyllables(til).filter((s) => s.w === flyer);
    expect(syls).toHaveLength(2);
    expect(syls.map((s) => s.kEnd)).toEqual([0, 1]);
  });
});
