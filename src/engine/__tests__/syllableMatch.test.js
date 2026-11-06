// The protocol engine (Greg, 2026-11-05 and 11-06; spec docs/superpowers/specs/2026-11-06-rhyme-protocol-design.md):
// feet from the query, the final foot sets the identity, feet to the left join while they pass,
// tail cases (embedded / semirhyme) within 4 bars with credit where credit is due, assonance as
// a second pass (rule D). Every case here is one of Greg's rulings (vault: Rhyme engine - tests).
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import { buildSongModel } from "../songModel.js";
import { computeMatches } from "../index.js";
import { isFunctionWord } from "../rhymeTypes.js";

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
const types = (m) => m.links.map((l) => l.type);
// a tiny song: one line per entry, words 0.3 s apart, 120 bpm (one bar = 2 s)
function tiny(lines) {
  let t = 0;
  const lyric = { lines: lines.map((ws) => ({ words: ws.map(([text, phones]) => { const w = { text, phones: [phones], start: t, end: t + 0.25, nSyllables: (phones.match(/\d/g) || []).length }; t += 0.3; return w; }) })) };
  const beats = Array.from({ length: Math.ceil(t / 0.5) + 8 }, (_, i) => i * 0.5);
  return buildSongModel({ songId: "tiny", lyricTranscription: lyric, drumTranscription: { beats, downbeats: beats.filter((_, i) => i % 4 === 0), estimated_bpm: 120 } });
}
const firstQuery = (s, n = 1) => computeMatches(s, s.words.slice(0, n).map((w) => w.id)).filter((m) => m.type !== "anchor");

let til, amen, rld;
beforeAll(() => { til = load("93Til"); amen = load("Amen"); rld = load("RhymesLikeDimes"); });

describe("one foot, same shape", () => {
  it("famous ~ Hey, miss: perfect mosaic (the weak final vowel against a stressed IH)", () => {
    const m = find(matches(til, "famous"), "Hey miss");
    expect(m).toBeTruthy();
    expect(m.type).toBe("perfect");
    expect(m.form).toBe("mosaic");
    expect(types(m)).toEqual(["perfect", "perfect"]);
  });
  it("digits ~ frigid: loosened, the coda T S ~ D is family + additive", () => {
    const m = find(matches(til, "digits"), "frigid");
    expect(m.type).toBe("loosened");
    expect(m.form).toBe("word");
    expect(m.tags).toEqual(["family+additive"]);
  });
  it("reason ~ demons (Amen): loosened (internal wildcard, additive coda)", () => {
    const m = find(matches(amen, "reason"), "demons");
    expect(m.type).toBe("loosened");
    expect(m.tags).toContain("additive");
    expect(m.tags).toContain("wildcard");
  });
  it("hot ~ rocks: loosened, family + additive (overturns 'hot / rocks is not additive')", () => {
    const s = tiny([[["hot", "HH AA1 T"]], [["rocks", "R AA1 K S"]]]);
    expect(firstQuery(s)[0]).toMatchObject({ type: "loosened", form: "word", tags: ["family+additive"] });
  });
  it("Cali ~ Maui: shifted (the stressed vowel differs; internal L ~ nothing is additive)", () => {
    const s = tiny([[["Cali", "K AE1 L IY0"]], [["Maui", "M AW1 IY0"]]]);
    expect(firstQuery(s)[0]).toMatchObject({ type: "shifted", tags: ["additive"] });
  });
  it("not rhymes in rows 1-3: midget ~ gotta; cooler ~ later (truncated only, the tentative pass); digits ~ pigeon; cat ~ cash", () => {
    const notTrunc = (ms) => ms.filter((m) => m.type !== "truncated");
    const s = tiny([[["midget", "M IH1 JH AH0 T"]], [["gotta", "G AA1 T AH0"], ["cooler", "K UW1 L ER0"], ["later", "L EY1 T ER0"], ["pigeon", "P IH1 JH AH0 N"]]]);
    expect(notTrunc(firstQuery(s))).toEqual([]);
    const c = tiny([[["cooler", "K UW1 L ER0"]], [["later", "L EY1 T ER0"]]]);
    expect(firstQuery(c).map((m) => m.type)).toEqual(["truncated"]);
    const d = tiny([[["cat", "K AE1 T"]], [["cash", "K AE1 SH"]]]);
    expect(firstQuery(d)).toEqual([]);
  });
});

describe("feet chain to the left; the final foot sets the identity", () => {
  it("the final foot must pass the protocol: no vowel-only final foot (Greg 2026-11-06: hit blunts !~ lit-tle, weak luck !~ Seek-in')", () => {
    expect(matches(til, "hit blunts").filter((m) => /little|gettin/i.test(m.text))).toEqual([]);
    expect(matches(amen, "weak luck").filter((m) => /seekin/i.test(m.text))).toEqual([]);
    for (const m of [...matches(til, "hit blunts"), ...matches(amen, "weak luck"), ...matches(til, "we just chill")]) {
      if (m.type === "assonance") continue;
      expect(m.links.at(-1).counted, m.text).toBe(true);
    }
  });
  it("close range ~ most strange: two one-step feet, perfect", () => {
    const m = find(matches(rld, "close range"), "most strange");
    expect(m.form).toBe("mosaic");
    expect(m.type).toBe("perfect");
    expect(types(m)).toEqual(["perfect", "perfect"]);
  });
  it("'ever, later' ~ 'over, greater': a shifted foot joins on the left, identity stays perfect", () => {
    const s = tiny([[["ever", "EH1 V ER0"], ["later", "L EY1 T ER0"]], [["over", "OW1 V ER0"], ["greater", "G R EY1 T ER0"]]]);
    const m = firstQuery(s, 2).find((x) => /over greater/.test(x.text));
    expect(m.type).toBe("perfect");
    expect(m.form).toBe("mosaic");
    expect(types(m)).toEqual(["shifted", "shifted", "perfect", "perfect"]);
  });
  it("Chapstick ~ slapstick: one perfect whole-word match over both syllables at each slapstick", () => {
    const ms = matches(rld, "Chapstick").filter((m) => /slapstick/i.test(m.text));
    expect(ms.length).toBeGreaterThan(0);
    for (const m of ms) expect(m).toMatchObject({ form: "word", type: "perfect", vi0: 0, vi1: 1 });
    expect(new Set(ms.map((m) => m.words[0].id)).size).toBe(ms.length);
  });
  it("handball ~ all: ball ~ all perfect; hand ~ man's does not join (N D ~ N Z is a wildcard coda)", () => {
    const ms = matches(til, "handball");
    expect(find(ms, "man's all")).toBeFalsy();
    const all = ms.filter((m) => clean(m.text) === "all" && m.form === "word");
    expect(all.length).toBeGreaterThan(0);
    for (const m of all) expect(m.type).toBe("perfect");
  });
  it("roam the strip ~ bones to pick: the two-step foot [roam the] joins [bones to]", () => {
    const m = find(matches(til, "roam the strip"), "bones to pick");
    expect(m).toBeTruthy();
    expect(m.links).toHaveLength(3);
  });
  it("an unstressed candidate under a stressed query step holds the chain on its vowel (we just chill ~ '93 until; so- so ~ solo)", () => {
    const m = matches(til, "we just chill").find((x) => /until/.test(x.text) && /93/.test(x.text));
    expect(m.type).toBe("perfect");
    expect(m.links).toHaveLength(3);
    expect(m.links[1].counted).toBe(false);
    const ms = matches(amen, "so- so");
    expect(find(ms, "solo").type).toBe("perfect");
    expect(find(ms, "solo").form).toBe("word");
    // over "so low, no" the later two-foot chain wins (low, no) and "so" stands alone: either alignment is perfect
    expect(["so low", "low no"].some((t) => find(ms, t)?.type === "perfect")).toBe(true);
  });
  it("pickups: until ~ the thrill lengthens; attack does not pick up flick's at", () => {
    const s = tiny([[["until", "AH0 N T IH1 L"]], [["the", "DH AH0"], ["thrill", "TH R IH1 L"]]]);
    const m = firstQuery(s)[0];
    expect(m.text.trim()).toBe("the thrill");
    expect(m.type).toBe("perfect");
    expect(m.links[0].pickup).toBe(true);
    const a = tiny([[["attack", "AH0 T AE1 K"]], [["flick's", "F L IH1 K S"], ["at", "AE1 T"]]]);
    expect(firstQuery(a).map((x) => x.text.trim())).toEqual(["at"]);
  });
  it("a query of function words only has no matches; no two matches share a location", () => {
    expect(matches(til, "the")).toEqual([]);
    for (const q of ["logic", "Chapstick"]) {
      const keys = matches(rld, q).map((m) => `${m.words.map((w) => w.id).join()}|${m.vi0}|${m.vi1}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("tail cases: embedded and semirhyme, one rule both ways, within 4 bars", () => {
  it("wage ~ engagements: embedded perfect (3 bars apart)", () => {
    const m = matches(amen, "wage").find((x) => /engagements/i.test(x.text));
    expect(m.form).toBe("embedded");
    expect(m.type).toBe("perfect");
  });
  it("logic ~ biological: embedded perfect (credit: -gic's K against the K that opens -cal)", () => {
    const m = matches(rld, "logic").find((x) => /biological/i.test(x.text));
    expect(m.form).toBe("embedded");
    expect(m.type).toBe("perfect");
  });
  it("logic ~ clock: semirhyme, loosened with the family tag (credit: JH ~ K)", () => {
    const m = matches(rld, "logic").find((x) => clean(x.text) === "clock");
    expect(m).toMatchObject({ form: "semirhyme", type: "loosened", tags: ["family"] });
  });
  it("a function word may fill the tail (Greg 2026-11-06: no exception, 'Spock and' wins): logic ~ Spock and; digits ~ dig it, Swig it", () => {
    const sa = find(matches(rld, "logic"), "Spock and");
    expect(sa).toMatchObject({ form: "mosaic", type: "loosened" });
    const ms = matches(til, "digits");
    for (const t of ["dig it", "Swig it"]) expect(find(ms, t), t).toMatchObject({ form: "mosaic", type: "loosened" });
  });
  it("symmetric in shape (Greg 2026-11-06): bio-logic-al -> logic is a semirhyme, as logic -> bio-logic-al is embedded", () => {
    const m = matches(rld, "biological").find((x) => clean(x.text) === "logic");
    expect(m).toMatchObject({ form: "semirhyme", type: "perfect" });
    expect(m.links).toHaveLength(2);
  });
  it("semirhymes land on content words within 4 bars of the query", () => {
    const q = rld.byId.get(idsOf(rld, "logic")[0]);
    const qb = rld.barPosition(q.start).bar;
    for (const m of matches(rld, "logic").filter((x) => x.form === "semirhyme")) {
      expect(Math.abs(rld.barPosition(m.words[0].start).bar - qb)).toBeLessThanOrEqual(4);
      expect(isFunctionWord(m.text)).toBe(false);
    }
  });
  it("chill ~ chillin' and fast ~ master: credit makes them perfect embedded", () => {
    const s = tiny([[["chill", "CH IH1 L"]], [["chillin'", "CH IH1 L IH0 N"]]]);
    expect(firstQuery(s)[0]).toMatchObject({ type: "perfect", form: "embedded" });
    const f = tiny([[["fast", "F AE1 S T"]], [["master", "M AE1 S T ER0"]]]);
    expect(firstQuery(f)[0]).toMatchObject({ type: "perfect", form: "embedded" });
  });
  it("vibrations finds no makes / females (credit never admits a loosened coda)", () => {
    expect(matches(til, "vibrations").filter((m) => /^(makes|females)$/i.test(clean(m.text)))).toEqual([]);
  });
  it("engagements ~ stage went is a loosened mosaic (JH M ~ JH W wildcard, N T S ~ N T additive)", () => {
    const st = matches(amen, "engagements").find((m) => /^stage went$/i.test(m.text.replace(/[^a-z ]/gi, "").trim()));
    expect(st.form).toBe("mosaic");
    expect(st.type).toBe("loosened");
  });
});

describe("assonance: a second pass (rule D)", () => {
  it("dizziness ~ silly bitch: three vowels, assonance; 'in the cut' and 'kiss me with' are not", () => {
    const s = tiny([[["dizziness", "D IH1 Z IY0 N AH0 S"]], [["silly", "S IH1 L IY0"], ["bitch", "B IH1 CH"]], [["in", "IH0 N"], ["the", "DH AH0"], ["cut", "K AH1 T"]], [["kiss", "K IH1 S"], ["me", "M IY1"], ["with", "W IH1 DH"]]]);
    const ms = firstQuery(s);
    const a = ms.find((m) => m.type === "assonance");
    expect(a.text.trim()).toBe("silly bitch");
    expect(a.form).toBe("mosaic");
    expect(types(a)).toEqual(["assonance", "assonance", "assonance"]);
    // no assonance elsewhere; "kiss" may stand as a semirhyme (an open stressed syllable against one consonant)
    expect(ms.filter((m) => m.type === "assonance")).toHaveLength(1);
    expect(ms.some((m) => /cut|me with/.test(m.text))).toBe(false);
  });
  it("never where a rhyme already ends; never under three syllables", () => {
    for (const m of matches(rld, "logic")) expect(m.type === "assonance" ? m.links.length >= 3 : true).toBe(true);
    const s = tiny([[["digits", "D IH1 JH AH0 T S"]], [["pigeon", "P IH1 JH AH0 N"]]]);
    expect(firstQuery(s)).toEqual([]);
  });
});

describe("syllable counts settled by the aligner", () => {
  it("Dial is one syllable and no longer leaks one-syllable matches on a second syllable", () => {
    const dial = til.words.find((w) => clean(w.text) === "dial");
    expect(dial.nSyllables).toBe(1);
    for (const m of computeMatches(til, [dial.id])) if (m.type !== "anchor") expect(m.links.length).toBeGreaterThan(0);
  });
});

describe("truncated (tentative, its own last pass; Greg 2026-11-06 evening)", () => {
  it("pencil ~ simple (Amen): truncated word match", () => {
    const m = find(matches(amen, "pencil"), "simple");
    expect(m).toMatchObject({ type: "truncated", form: "word" });
  });
  it("limbo ~ so- so (Amen): truncated mosaic (OW ~ OW at the end, no coda)", () => {
    const m = find(matches(amen, "limbo"), "so- so");
    expect(m).toMatchObject({ type: "truncated" });
  });
  it("runs last: with the pass off, every other match is exactly what it was", async () => {
    const { RULES } = await import("../syllableMatch.js");
    for (const [song, q] of [[til, "famous"], [rld, "logic"], [amen, "limbo"], [amen, "pencil"]]) {
      const withT = matches(song, q).filter((m) => m.type !== "truncated").map((m) => `${m.text}|${m.type}|${m.form}`);
      RULES.truncated = false;
      const without = matches(song, q).map((m) => `${m.text}|${m.type}|${m.form}`);
      RULES.truncated = true;
      expect(withT).toEqual(without);
    }
  });
});
