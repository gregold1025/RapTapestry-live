// src/engine/lineRhymes.js
// End rhyme between lines. A line's rhyming unit is not always its last word
// ("talent show" ~ "Alamo"), so a line query is run for its last one, two and
// three words; a line matches when a match from any of those runs ends on that
// line's last word. One entry per line, at its lowest-ranked type.
import { TYPE_RANK } from "./index.js";

export const END_UNIT_MAX_WORDS = 3;

/** The id runs to try for a line: [last], [last-1, last], [last-2, last-1, last]. */
export function endUnits(song, lineIdx, maxWords = END_UNIT_MAX_WORDS) {
  const words = song?.lines?.[lineIdx]?.words ?? [];
  const n = words.length;
  const units = [];
  for (let k = 1; k <= Math.min(maxWords, n); k++) units.push(words.slice(n - k).map((w, i) => `${lineIdx}-${n - k + i}`));
  return units;
}

/**
 * @param matchesFor (anchorIds) => engine matches (anchor entries included or not)
 * @returns [{ lineIdx, type, form, rank, start, text, lastWordId, expected, unit }] sorted by line
 */
export function lineEndMatches(song, lineIdx, matchesFor, maxWords = END_UNIT_MAX_WORDS) {
  const best = new Map();
  for (const unit of endUnits(song, lineIdx, maxWords)) {
    for (const m of matchesFor(unit)) {
      if (m.type === "anchor") continue;
      const w = m.words[m.words.length - 1];
      const line = song.lines[w.li];
      if (!line || w.li === lineIdx || w.wi !== line.words.length - 1) continue;
      const rank = TYPE_RANK[m.type] ?? 99;
      const prev = best.get(w.li);
      if (prev && prev.rank <= rank) continue;
      best.set(w.li, { lineIdx: w.li, type: m.type, form: m.form, rank, start: m.start, text: line.words.map((x) => x.text).join(" "), lastWordId: w.id, expected: !!m.expected, unit: unit.length });
    }
  }
  return [...best.values()].sort((a, b) => a.lineIdx - b.lineIdx);
}
