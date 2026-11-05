import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { buildSongModel } from "../songModel.js";
import { computeMatches } from "../index.js";
import { lineEndMatches } from "../lineRhymes.js";

const dir = "public/data/RhymesLikeDimes/";
const song = buildSongModel({
  songId: "RhymesLikeDimes",
  lyricTranscription: JSON.parse(fs.readFileSync(dir + "lyric-transcription.json")),
  drumTranscription: JSON.parse(fs.readFileSync(dir + "drum-transcription.json")),
});
const matchesFor = (ids) => computeMatches(song, ids);

describe("line end rhymes", () => {
  it("'...talent show' finds '...Alamo' (the end-rhyme unit may be more than the last word)", () => {
    const li = song.lines.findIndex((l) => /talent show$/i.test(l.words.map((w) => w.text.trim()).join(" ")));
    expect(li).toBeGreaterThan(-1);
    const ms = lineEndMatches(song, li, matchesFor);
    const alamo = ms.find((m) => /alamo/i.test(m.text));
    expect(alamo).toBeTruthy();
    expect(alamo.lineIdx).not.toBe(li);
  });
  it("the longest ending wins: talent show ~ Alamo links two syllables, not just show ~ -mo", () => {
    const li = song.lines.findIndex((l) => /talent show$/i.test(l.words.map((w) => w.text.trim()).join(" ")));
    const alamo = lineEndMatches(song, li, matchesFor).find((m) => /alamo/i.test(m.text));
    expect(alamo.match.links.length).toBeGreaterThanOrEqual(2);
    expect(alamo.unit).toBe(alamo.match.links.length);
  });
  it("one entry per line, never the anchor line, sorted by line", () => {
    const ms = lineEndMatches(song, 8, matchesFor);
    const idx = ms.map((m) => m.lineIdx);
    expect(new Set(idx).size).toBe(idx.length);
    expect(idx).not.toContain(8);
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });
});
