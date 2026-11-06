// The typed rhyme engine (vendored from new-prototypes/shared on 2026-11-04; matching
// replaced by the syllable-by-syllable hierarchy, syllableMatch.js, on 2026-11-05).
// Entry point used by the app: computeMatches(song, anchorIds).
import { matchQuery } from './syllableMatch.js';
export { buildSongModel } from './songModel.js';
export { matchQuery, songSyllables } from './syllableMatch.js';
export { RHYME_TYPES, FORMS, FORM_BY_KEY, TYPE_BY_KEY, parseRime, classifyRhyme, RULE_OPTIONS } from './rhymeTypes.js';

export const TYPE_RANK = Object.fromEntries(['anchor', 'identical', 'perfect', 'loosened', 'shifted', 'assonance', 'truncated'].map((k, i) => [k, i]));

/**
 * Every match for a query made of one word or a contiguous run of words (ids in
 * song order), by the syllable-by-syllable hierarchy (syllableMatch.js).
 * Returns [{ type, form, text, words, word, start, end, vi0, vi1, links }],
 * anchors first (type 'anchor').
 */
export function computeMatches(song, anchorIds) {
  if (!song || !anchorIds?.length) return [];
  const words = anchorIds.map((id) => song.byId.get(id)).filter(Boolean);
  if (words.length !== anchorIds.length) return [];
  const anchors = words.map((w) => ({ type: 'anchor', form: 'word', words: [w], word: w, start: w.start, end: w.end, text: w.text }));
  return [...anchors, ...matchQuery(song, anchorIds)];
}
