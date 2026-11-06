// src/engine/protocol.js
// The protocol (Greg, 2026-11-06): how one FOOT of the query compares with the same number
// of candidate syllables. A step is a vowel plus the consonants around it; a foot is a stressed
// step plus the unstressed steps after it (one to three steps). Every consonant axis takes one
// of five values, every vowel axis passes or fails, and the row says what the foot is:
//
//   steps | row          | stressed vowel | internal        | final vowel | coda
//   1     | 1 perfect    | same           |                 |             | 1
//   1     | 2 loosened   | same           |                 |             | F, A, FA
//   2, 3  | 1 perfect    | same           | 1               | same / weak | 1
//   2, 3  | 2 loosened   | same           | 1, F, A, FA, W  | same / weak | 1, F, A, FA
//   2, 3  | 3 shifted    | W              | 1, F, A, FA     | same / weak | 1
//   2, 3  | 4 truncated  | W              | W               | same / weak | 1, F, A, FA   (only with { truncated: true })
//
// Anything else is not a rhyme. A three-step foot adds a middle step whose vowel must be the
// same or weak and whose cluster is at most FA. At most one wildcard per foot.
// Spec: docs/superpowers/specs/2026-11-06-rhyme-protocol-design.md
import { consonantRelation, REDUCED } from './rhymeTypes.js';

const sameFamily = (a, b) => a === b || consonantRelation(a, b) !== null;

/**
 * Consonant axis between two clusters.
 * '1' same; 'F' same length, each pair same or in one family; 'A' exactly one consonant added
 * or dropped anywhere, the rest identical; 'FA' one added or dropped and the rest within family;
 * 'W' anything else. An affricate (CH, JH) is one consonant.
 */
export function consAxis(a, b) {
  if (a.join() === b.join()) return '1';
  if (a.length === b.length) return a.every((c, i) => sameFamily(c, b[i])) ? 'F' : 'W';
  if (Math.abs(a.length - b.length) !== 1) return 'W';
  const [long, short] = a.length > b.length ? [a, b] : [b, a];
  let best = 'W';
  for (let i = 0; i < long.length; i++) {
    const rest = long.filter((_, j) => j !== i);
    if (rest.join() === short.join()) return 'A';
    if (rest.every((c, k) => sameFamily(c, short[k]))) best = 'FA';
  }
  return best;
}

export const TAGS_OF_AXIS = { F: 'family', A: 'additive', FA: 'family+additive', W: 'wildcard' };

const strong = (s) => s.stress >= 1 && !s.weak;

/**
 * Two steps have the same nucleus: the same vowel, or both weak vowels (AH / IH / EH) with at
 * least one side unstressed (fa-mous ~ Hey, miss; -son ~ in). A stressed vowel never changes.
 */
export function sameNucleus(a, b) {
  if (a.v === b.v) return true;
  return REDUCED.has(a.v) && REDUCED.has(b.v) && (!strong(a) || !strong(b));
}

const cluster = (s0, s1) => [...s0.coda, ...s1.on];

/**
 * Compare a query foot with the same number of candidate steps.
 * `truncated`: also accept row 4 (stressed vowel and internal both wildcards; Greg 2026-11-06, tentative).
 * -> { row: 1 | 2 | 3 | 4, axes: { v1, internal?, mid?, v2?, coda }, tags: string[] } | null
 */
export function footRow(q, c, { truncated = false } = {}) {
  const n = q.length;
  if (!n || n !== c.length || n > 3) return null;
  // the head's nucleus: the same vowel, or weak vowels (AH / IH / EH) against a truly unstressed
  // syllable (miss ~ -mous); never relaxed against a function word (Plus ~ this)
  const v1 = q[0].v === c[0].v || (REDUCED.has(q[0].v) && REDUCED.has(c[0].v) && (q[0].stress === 0 || c[0].stress === 0)) ? '1' : 'W';
  const coda = consAxis(q[n - 1].coda, c[n - 1].coda);
  if (coda === 'W') return null;
  if (n === 1) {
    if (v1 === 'W') return null;
    return { row: coda === '1' ? 1 : 2, axes: { v1, coda }, tags: coda === '1' ? [] : [TAGS_OF_AXIS[coda]] };
  }
  if (!sameNucleus(q[n - 1], c[n - 1])) return null;
  const internal = consAxis(cluster(q[0], q[1]), cluster(c[0], c[1]));
  let mid = null;
  if (n === 3) {
    if (!sameNucleus(q[1], c[1])) return null;
    mid = consAxis(cluster(q[1], q[2]), cluster(c[1], c[2]));
    if (mid === 'W') return null;
  }
  let row;
  if (v1 === 'W' && internal === 'W') {
    if (!truncated) return null;   // two wildcards: truncated, only when asked for
    row = 4;
  } else if (v1 === 'W') {
    if (coda !== '1') return null;
    row = 3;
  } else row = internal === '1' && coda === '1' && (mid == null || mid === '1') ? 1 : 2;
  const tags = [];
  for (const ax of [internal, mid, coda]) if (ax && ax !== '1' && !tags.includes(TAGS_OF_AXIS[ax])) tags.push(TAGS_OF_AXIS[ax]);
  return { row, axes: { v1, internal, mid, v2: '1', coda }, tags };
}
