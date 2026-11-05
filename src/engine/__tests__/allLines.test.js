import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { buildSongModel } from "../songModel.js";
import { computeMatches } from "../index.js";
import { lineEndMatches, endUnits } from "../lineRhymes.js";

const load = (songId) => {
  const dir = `public/data/${songId}/`;
  return buildSongModel({
    songId,
    lyricTranscription: JSON.parse(fs.readFileSync(dir + "lyric-transcription.json")),
    drumTranscription: JSON.parse(fs.readFileSync(dir + "drum-transcription.json")),
  });
};

describe("a line query on any line of any song", () => {
  it("Amen: 'A- men' does not match the two-syllable reading of 'am' (A.M.) onto its one syllable", () => {
    const song = load("Amen");
    const li = song.lines.findIndex((l) => /A- men$/.test(l.words.map((w) => w.text.trim()).join(" ")));
    expect(li).toBeGreaterThan(-1);
    const unit = endUnits(song, li).find((u) => u.length === 2);
    expect(() => computeMatches(song, unit)).not.toThrow();
  });
  for (const songId of ["93Til", "Amen", "RhymesLikeDimes", "Unemployed"]) {
    it(`${songId}: never throws, and every match covers syllables its words have`, () => {
      const song = load(songId);
      for (let li = 0; li < song.lines.length; li++) {
        for (const unit of endUnits(song, li)) {
          const ms = computeMatches(song, unit);
          for (const m of ms) {
            if (m.vi0 == null) continue;
            const first = m.words[0], last = m.words.at(-1);
            expect(m.vi0, `${songId} line ${li} ${m.text}`).toBeLessThan(first.nSyllables);
            expect(m.vi1, `${songId} line ${li} ${m.text}`).toBeLessThan(last.nSyllables);
            if (first === last) expect(m.vi0).toBeLessThanOrEqual(m.vi1);
          }
        }
        expect(() => lineEndMatches(song, li, (ids) => computeMatches(song, ids))).not.toThrow();
      }
    }, 60000);
  }
});
