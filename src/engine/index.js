// The typed rhyme engine (vendored from new-prototypes/shared on 2026-11-04).
// Entry point used by the app: computeMatches(song, anchorIds).
import { findTypedRhymes } from './songModel.js';
import { buildReference, findForReference } from './querySpans.js';
export { buildSongModel, findTypedRhymes, phoneStream, candidateSpans, TYPE_ORDER, bestType } from './songModel.js';
export { buildReference, findForReference, syllableChunks, chunkText } from './querySpans.js';
export { RHYME_TYPES, FORMS, FORM_BY_KEY, TYPE_BY_KEY, parseRime, classifyRhyme, RULE_OPTIONS } from './rhymeTypes.js';

export const TYPE_RANK = Object.fromEntries(['anchor', 'identical', 'perfect', 'family', 'additive', 'slant', 'assonance'].map((k, i) => [k, i]));

/**
 * Every match for a query made of one word or a contiguous run of words (ids in
 * song order). One word: findTypedRhymes. Several: the run is one rime of several
 * syllables (tree trunk = IY, AH NG K) matched whole, as in the Line Staff.
 * Returns [{ type, form, text, words, word, start, end, vi0?, vi1?, expected? }],
 * anchors first (type 'anchor').
 */
export function computeMatches(song, anchorIds) {
  if (!song || !anchorIds?.length) return [];
  const words = anchorIds.map((id) => song.byId.get(id)).filter(Boolean);
  if (words.length !== anchorIds.length) return [];
  if (words.length === 1) return findTypedRhymes(song, words[0].id);
  const items = words.map((w) => ({ word: w, k0: 0, k1: w.nSyllables }));
  const ref = buildReference(song, items);
  if (!ref) return [];
  const full = ref.runs.find((r) => r.p0 === 0 && r.p1 === ref.parts.length - 1);
  const found = findForReference(song, { ...ref, runs: full ? [full] : ref.runs });
  const anchors = items.map((it) => ({ type: 'anchor', form: 'word', words: [it.word], word: it.word, start: it.word.start, end: it.word.end, text: it.word.text }));
  return [...anchors, ...found.map((m) => ({ ...m, vi0: +m.keys[0].split(':')[1], vi1: +m.keys[m.keys.length - 1].split(':')[1] }))];
}
