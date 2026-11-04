// Greg's regression cases for the typed rhyme rules (memory: new-prototypes, 2026-10-20),
// run against the real song data so the vendored engine behaves like the prototypes.
// wage / engagements / tree trunk are in Amen; handball / all in 93 Til.
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildSongModel, findTypedRhymes } from "../songModel";
import { buildReference, findForReference } from "../querySpans";
import { computeMatches } from "../index";

const DATA = path.resolve(__dirname, "../../../public/data");
function load(songId) {
  const lyric = JSON.parse(fs.readFileSync(path.join(DATA, songId, "lyric-transcription.json"), "utf8"));
  const drums = JSON.parse(fs.readFileSync(path.join(DATA, songId, "drum-transcription.json"), "utf8"));
  return buildSongModel({ songId, lyricTranscription: lyric, drumTranscription: drums });
}
let song, amen, til;
beforeAll(() => { amen = load("Amen"); til = load("93Til"); song = amen; });

const byText = (text, s = song) => s.words.filter((w) => w.text.toLowerCase().replace(/[^a-z']/g, "") === text);

describe("song model", () => {
  it("builds one entry per word with a rime for dictionary words", () => {
    expect(til.words.length).toBe(996);
    expect(til.words.filter((w) => w.rime).length).toBeGreaterThan(950);
    expect(til.numBars).toBeGreaterThan(60);
    expect(amen.words.length).toBe(547);
  });
});

describe("typed rhymes (single word)", () => {
  it("wage finds engagements as an embedded match", () => {
    const wage = byText("wage")[0];
    const found = findTypedRhymes(song, wage.id);
    const m = found.find((x) => x.text.toLowerCase().includes("engagements"));
    expect(m).toBeTruthy();
    expect(m.form).toBe("embedded");
  });
  it("engagements finds 'stage went' as a mosaic", () => {
    const eng = byText("engagements")[0];
    const found = findTypedRhymes(song, eng.id);
    const m = found.find((x) => /stage went/i.test(x.text));
    expect(m).toBeTruthy();
    expect(m.form).toBe("mosaic");
  });
  it("handball reaches 'all' through the compound rime", () => {
    const hb = byText("handball", til)[0];
    const found = findTypedRhymes(til, hb.id);
    expect(found.some((x) => /\ball\b/i.test(x.text) && x.form !== "word" || x.text.toLowerCase() === "all")).toBe(true);
  });
});

describe("multi-word reference", () => {
  it("tree trunk finds we funk and weak luck as mosaics", () => {
    const tree = byText("tree").find((w) => song.words[w.flat + 1]?.text.toLowerCase().startsWith("trunk"));
    const trunk = song.words[tree.flat + 1];
    const ref = buildReference(song, [tree, trunk].map((w) => ({ word: w, k0: 0, k1: w.nSyllables })));
    const full = ref.runs.find((r) => r.p0 === 0 && r.p1 === ref.parts.length - 1);
    const found = findForReference(song, { ...ref, runs: [full] });
    const texts = found.map((m) => m.text.toLowerCase());
    expect(texts.some((t) => t.includes("we funk"))).toBe(true);
    expect(texts.some((t) => t.includes("weak luck"))).toBe(true);
    expect(found.find((m) => m.text.toLowerCase().includes("we funk")).form).toBe("mosaic");
  });
});

describe("computeMatches (what the app calls)", () => {
  it("returns anchors first for a multi-word query and typed matches after", () => {
    const tree = byText("tree").find((w) => song.words[w.flat + 1]?.text.toLowerCase().startsWith("trunk"));
    const out = computeMatches(song, [tree.id, song.words[tree.flat + 1].id]);
    expect(out.filter((m) => m.type === "anchor").length).toBe(2);
    expect(out.some((m) => m.type !== "anchor" && m.vi0 != null)).toBe(true);
  });
  it("returns an empty list for an unknown word id", () => {
    expect(computeMatches(song, ["999-999"])).toEqual([]);
  });
});
