// The rhyme hierarchy agreed with Greg on 2026-11-05 (memory: interface-redesign.md):
// syllable-by-syllable comparison, a match covers the query's last syllable and extends
// leftward while syllables link, the label comes from the stressed syllables and the final
// syllable (weakest link), forms by geometry (word / embedded / mosaic / semirhyme), one
// match per location, no expectation rule, schwa does not count toward the assonance
// minimum, slant off, the aligner settles syllable counts when dictionary readings disagree.
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import { buildSongModel } from "../songModel.js";
import { computeMatches } from "../index.js";

const load = (songId) => {
  const dir = `public/data/${songId}/`;
  return buildSongModel({
    songId,
    lyricTranscription: JSON.parse(fs.readFileSync(dir + "lyric-transcription.json")),
    drumTranscription: JSON.parse(fs.readFileSync(dir + "drum-transcription.json")),
  });
};
const clean = (t) => t.toLowerCase().replace(/[^a-z0-9']/g, "");
function idsOf(song, text, nth = 0) {
  const aw = text.split(" ").map(clean);
  const hits = [];
  for (let i = 0; i < song.words.length; i++) if (aw.every((t, k) => clean(song.words[i + k]?.text ?? "") === t)) hits.push(aw.map((_, k) => song.words[i + k].id));
  if (!hits[nth]) throw new Error(`not found: ${text}`);
  return hits[nth];
}
const matches = (song, text, nth) => computeMatches(song, idsOf(song, text, nth)).filter((m) => m.type !== "anchor");
const find = (ms, text) => ms.find((m) => clean(m.text.split(" ").join("")) === clean(text.split(" ").join("")));
// a tiny song: one line per entry, words spaced 0.3 s apart, 120 bpm (one bar = 2 s)
function tiny(lines) {
  let t = 0;
  const lyric = { lines: lines.map((ws) => ({ words: ws.map(([text, phones]) => { const w = { text, phones: [phones], start: t, end: t + 0.25, nSyllables: (phones.match(/\d/g) || []).length }; t += 0.3; return w; }) })) };
  const beats = Array.from({ length: Math.ceil(t / 0.5) + 8 }, (_, i) => i * 0.5);
  return buildSongModel({ songId: "tiny", lyricTranscription: lyric, drumTranscription: { beats, downbeats: beats.filter((_, i) => i % 4 === 0), estimated_bpm: 120 } });
}

let til, amen, rld, unemp;
beforeAll(() => { til = load("93Til"); amen = load("Amen"); rld = load("RhymesLikeDimes"); unemp = load("Unemployed"); });

describe("syllable by syllable, weakest link", () => {
  it("close range ~ most strange: two linked syllables; perfect, since 'most' has the reading M OW1 S (mos')", () => {
    const m = find(matches(rld, "close range"), "most strange");
    expect(m.form).toBe("mosaic");
    expect(m.links.map((l) => l.type)).toEqual(["perfect", "perfect"]);
    expect(m.type).toBe("perfect");
  });
  it("so- so ~ solo and ~ so low: perfect (the L opens the next syllable, it is free)", () => {
    const ms = matches(amen, "so- so");
    expect(find(ms, "solo").type).toBe("perfect");
    expect(find(ms, "solo").form).toBe("word");
    expect(find(ms, "so low").type).toBe("perfect");
    expect(find(ms, "so low").form).toBe("mosaic");
  });
  it("we just chill ~ '93 until: perfect over three syllables (the unstressed middle keeps the vowel only)", () => {
    const ms = matches(til, "we just chill");
    const m = ms.find((x) => /until/.test(x.text) && /93/.test(x.text));
    expect(m.type).toBe("perfect");
    expect(m.links).toHaveLength(3);
    expect(m.links[1].counted).toBe(false);
  });
});

describe("a match covers the query's last syllable", () => {
  it("we just chill never matches a stretch that ends off 'chill' (we chill from)", () => {
    const ms = matches(til, "we just chill");
    expect(ms.some((m) => /from$/i.test(m.text.trim()))).toBe(false);
    for (const m of ms) if (m.form !== "semirhyme") expect(m.links.at(-1).counted).toBe(true);
  });
  it("a shorter match ending on the query's end is kept (close range ~ ...ange words)", () => {
    const ms = matches(til, "close range");
    expect(ms.length).toBeGreaterThan(0);
  });
});

describe("forms by geometry, one match per location", () => {
  it("Chapstick ~ slapstick is one perfect whole-word match covering both syllables", () => {
    const ms = matches(rld, "Chapstick").filter((m) => /slapstick/i.test(m.text));
    expect(ms.length).toBeGreaterThan(0);
    for (const m of ms) { expect(m.form).toBe("word"); expect(m.type).toBe("perfect"); expect([m.vi0, m.vi1]).toEqual([0, 1]); }
    const at = new Set(ms.map((m) => m.words.map((w) => w.id).join()));
    expect(at.size).toBe(ms.length);
  });
  it("no two matches of a query share a location", () => {
    for (const q of ["logic", "Chapstick"]) {
      const ms = matches(rld, q);
      const keys = ms.map((m) => `${m.words.map((w) => w.id).join()}|${m.vi0}|${m.vi1}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
  it("wage finds engagements embedded; engagements finds stage went as an additive mosaic", () => {
    expect(matches(amen, "wage").find((m) => /engagements/i.test(m.text)).form).toBe("embedded");
    // -ments (AH0 N T S) ~ went (EH1 N T): the schwa keeps its vowel against a stressed EH
    // (Greg 2026-11-05, Hey, miss ~ famous); the extra S makes it additive
    const st = matches(amen, "engagements").find((m) => /^stage went$/i.test(m.text.replace(/[^a-z ]/gi, "").trim()));
    expect(st.form).toBe("mosaic");
    expect(st.type).toBe("additive");
  });
  it("logic finds biological as an embedded perfect rhyme", () => {
    const m = matches(rld, "logic").find((x) => /biological/i.test(x.text));
    expect(m.form).toBe("embedded");
    expect(m.type).toBe("perfect");
  });
});

describe("semirhyme", () => {
  it("logic ~ Spock, Shock's, clock, blocks: semirhymes within a bar, not 'Spock and' mosaics", () => {
    const ms = matches(rld, "logic");
    for (const t of ["Spock", "Shock's", "clock", "blocks"]) {
      const m = ms.find((x) => clean(x.text) === clean(t) && x.form === "semirhyme");
      expect(m, t).toBeTruthy();
    }
    expect(ms.some((m) => /spock and|shock's a|lot of/i.test(m.text))).toBe(false);
  });
  it("is symmetric: Spock finds logic as a semirhyme", () => {
    expect(matches(rld, "Spock").some((m) => /logic/i.test(m.text) && m.form === "semirhyme")).toBe(true);
  });
  it("only within one bar of the query, and only on content words", () => {
    const song = rld;
    const q = song.byId.get(idsOf(song, "logic")[0]);
    const bar = song.beatsPerBar * 60 / song.bpm;
    for (const m of matches(song, "logic").filter((x) => x.form === "semirhyme")) {
      expect(Math.abs(m.words[0].start - q.start)).toBeLessThanOrEqual(bar + 1e-9);
      expect(["a", "and", "the", "of"]).not.toContain(clean(m.text));
    }
  });
});

describe("removed and tightened rules", () => {
  it("no match is admitted by expectation", () => {
    for (const q of ["logic", "Chapstick"]) for (const m of matches(rld, q)) expect(m.expected).toBeFalsy();
  });
  it("no one-syllable-of-full-vowel assonance: logic has no assonance matches", () => {
    expect(matches(rld, "logic").filter((m) => m.type === "assonance" && m.form !== "semirhyme")).toEqual([]);
  });
  it("roam the strip ~ bones to pick: the schwa link holds the chain, two full vowels give the length", () => {
    const m = matches(til, "roam the strip").find((x) => /bones to pick/i.test(x.text));
    expect(m).toBeTruthy();
    expect(m.links).toHaveLength(3);
  });
  it("slant is off: no slant matches", () => {
    for (const q of ["we just chill", "close range"]) expect(matches(til, q).some((m) => m.type === "slant")).toBe(false);
  });
});

describe("-ire / -our words", () => {
  it("desire (AY1 ER0, two syllables at the end) ~ admire (AY1 R, one): perfect, lighting admire to its end", () => {
    const m = matches(til, "desire").find((x) => /admire/i.test(x.text));
    expect(m.type).toBe("perfect");
    expect(m.vi1).toBe(m.words[0].nSyllables - 1);
  });
});

describe("pickups", () => {
  it("until ~ the thrill: the unstressed pickup lengthens the match, never changes its type", () => {
    const s = tiny([[["until", "AH0 N T IH1 L"]], [["the", "DH AH0"], ["thrill", "TH R IH1 L"]], [["a", "AH0"], ["skill", "S K IH1 L"]]]);
    const ms = computeMatches(s, ["0-0"]).filter((m) => m.type !== "anchor");
    const m = ms.find((x) => /thrill/.test(x.text));
    expect(m.type).toBe("perfect");
    expect(m.text).toBe("the thrill");
    expect(m.links).toHaveLength(2);
    expect(m.links[0].pickup).toBe(true);
  });
});

describe("syllable counts settled by the aligner", () => {
  it("Dial is one syllable (the aligner's reading) and no longer leaks one-syllable assonance (right, time)", () => {
    const dial = til.words.find((w) => clean(w.text) === "dial");
    expect(dial.nSyllables).toBe(1);
    const ms = computeMatches(til, [dial.id]).filter((m) => m.type === "assonance");
    expect(ms.filter((m) => m.links.length < 2 && m.form !== "semirhyme")).toEqual([]);
  });
  it("Unemployed 'I am not': am is one syllable (Greg's ear overrides the aligner's A.M.)", () => {
    const am = unemp.words.find((w, i) => clean(w.text) === "am" && clean(unemp.words[i + 1].text) === "not");
    expect(am.nSyllables).toBe(1);
  });
});

describe("a schwa against a stressed AH / IH / EH (Greg, 2026-11-05: Hey, miss ~ famous)", () => {
  it("famous ~ Hey, miss is a perfect mosaic (mous AH0 S ~ miss IH1 S keeps the reduced vowel)", () => {
    const m = find(matches(til, "famous"), "Hey miss");
    expect(m).toBeTruthy();
    expect(m.type).toBe("perfect");
    expect(m.form).toBe("mosaic");
    expect(m.links.map((l) => l.type)).toEqual(["perfect", "perfect"]);
  });
  it("the reduced side still does not count toward the assonance minimum", () => {
    // 'go miss': miss links to -mous, but go (OW) does not link to fa- (EY): no mosaic
    const s = tiny([[["famous", "F EY1 M AH0 S"]], [["go", "G OW1"], ["miss", "M IH1 S"]]]);
    const ms = computeMatches(s, [s.words[0].id]).filter((m) => m.type !== "anchor");
    expect(ms.find((m) => m.form === "mosaic")).toBeFalsy();
  });
  it("a pickup stays unstressed on both sides: attack finds 'at', not 'flick's at'", () => {
    const s = tiny([[["attack", "AH0 T AE1 K"]], [["flick's", "F L IH1 K S"], ["at", "AE1 T"]]]);
    const ms = computeMatches(s, [s.words[0].id]).filter((m) => m.type !== "anchor");
    expect(ms.map((m) => m.text.trim())).toEqual(["at"]);
  });
});
