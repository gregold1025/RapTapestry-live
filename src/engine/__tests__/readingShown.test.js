// A match shows the pronunciation it used (Greg 2026-11-10: "says" matched "busyness" through its
// second reading, S IH1 Z, but the hover showed S EH1 Z with EH1 Z bolded).
import { describe, it, expect } from "vitest";
import { buildSongModel } from "../songModel.js";
import { computeMatches } from "../index.js";
import { matchMarks } from "../../utils/phoneMarks.js";

function tiny(lines) {
  let t = 0;
  const lyric = { lines: lines.map((ws) => ({ words: ws.map(([text, phones]) => { const list = Array.isArray(phones) ? phones : [phones]; const w = { text, phones: list, start: t, end: t + 0.25, nSyllables: (list[0].match(/\d/g) || []).length }; t += 0.3; return w; }) })) };
  const beats = Array.from({ length: Math.ceil(t / 0.5) + 8 }, (_, i) => i * 0.5);
  return buildSongModel({ songId: "tiny", lyricTranscription: lyric, drumTranscription: { beats, downbeats: beats.filter((_, i) => i % 4 === 0), estimated_bpm: 120 } });
}

describe("the reading a match used", () => {
  const song = tiny([[["busyness", "B IH1 Z IY0 N AH0 S"]], [["says", ["S EH1 Z", "S IH1 Z"]]]]);
  const busyness = song.words[0], says = song.words[1];
  const m = computeMatches(song, [busyness.id]).find((x) => x.words?.includes?.(says.id) || x.links?.some((l) => l.wordId === says.id));
  it("is recorded on the match's link", () => {
    expect(m).toBeTruthy();
    expect(m.links.find((l) => l.wordId === says.id).ph).toEqual(["S", "IH1", "Z"]);
  });
  it("is what the hover shows and bolds", () => {
    const marks = matchMarks(m, says);
    expect(marks.map((x) => x.p)).toEqual(["S", "IH1", "Z"]);
    expect(marks.filter((x) => x.on).map((x) => x.p)).toEqual(["IH1", "Z"]);
  });
  it("leaves a word's own first reading alone when the match used it", () => {
    const s2 = tiny([[["fizz", "F IH1 Z"]], [["says", ["S EH1 Z", "S IH1 Z"]]], [["fez", "F EH1 Z"]]]);
    const mm = computeMatches(s2, [s2.words[2].id]).find((x) => x.links?.some((l) => l.wordId === s2.words[1].id));
    expect(matchMarks(mm, s2.words[1]).map((x) => x.p)).toEqual(["S", "EH1", "Z"]);
  });
});

import { hoverPhones } from "../../components/LyricsView/hooks/useHoverInfo.js";
describe("the lyrics footer's phones", () => {
  it("are the match's reading when the word is a match, else the word's own", () => {
    expect(hoverPhones({ vi0: 0, vi1: 0, phones: "S IH1 Z" }, "S EH1 Z")).toBe("S IH1 Z");
    expect(hoverPhones({ vi0: 0, vi1: 0 }, "S EH1 Z")).toBe("S EH1 Z");
    expect(hoverPhones(null, "S EH1 Z")).toBe("S EH1 Z");
  });
});
