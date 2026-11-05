// src/utils/phoneMarks.js
// Which of a word's phones made a match: from the vowel of the first matched
// syllable (its onset left out) through the end of the last matched syllable.
import { syllabify } from "./syllabify";

/** The syllables a match covers inside one of its words (whole word: from the stressed one; anchors: all). */
export function sylRange(m, w) {
  const n = w.nSyllables ?? 1;
  if (m.type !== "anchor" && m.vi0 != null && m.vi1 != null && m.words?.length === 1) return { vi0: m.vi0, vi1: m.vi1 };
  if (m.form === "word" || m.type === "anchor") {
    const vi0 = m.type === "anchor" ? 0 : Math.max(0, Math.min(n - 1, m.lead ? 0 : (w.rime?.stressedSyl ?? 0)));
    return { vi0, vi1: n - 1 };
  }
  const first = m.words[0] === w, last = m.words[m.words.length - 1] === w;
  return { vi0: first ? (m.vi0 ?? 0) : 0, vi1: last ? (m.vi1 ?? n - 1) : n - 1 };
}

/** "EH0 N G EY1 JH" + syllable range -> [{ p, on, k }] in order (k = syllable index); on = the phone is part of the rime that matched. */
export function phoneMarks(phones, vi0, vi1) {
  const list = (Array.isArray(phones) ? phones : String(phones ?? "").split(/\s+/)).filter(Boolean);
  if (!list.length) return [];
  const sy = syllabify(list.map((p) => ({ p })));
  const out = [];
  sy.forEach((s, k) => {
    s.phones.forEach((x, j) => {
      const on = vi0 != null && vi1 != null && s.v >= 0 && k >= vi0 && k <= vi1 && (k > vi0 || j >= s.v);
      out.push({ p: x.p, on, k });
    });
  });
  return out;
}

/** The link (per-syllable type) of syllable k of word `wordId` inside match m, or null. */
export function linkTypeAt(m, wordId, k) {
  return (m.links ?? []).find((l) => l.wordId === wordId && k >= l.k && k <= (l.kEnd ?? l.k)) ?? null;
}
