// One query, from a highlight. (Design: research/design/query-tool-design.md)
//
// A highlight snaps to syllables (per word: a syllable range), becomes a
// REFERENCE: a run of syllable segments built the same way the mosaic /
// embedded candidate spans are built, so reference and candidates compare
// alike. The reference is partitioned by STRESS into parts (a stressed vowel
// plus the unstressed syllables trailing it); runs of consecutive parts are the
// match strings. Each run is searched over the song with the rule sets; the
// longest match at a location subsumes shorter ones there.
import { phoneStream, candidateSpans, TYPE_ORDER, leadChains } from './songModel.js';
import { classifyRhyme, spanAllowed, ASSONANCE_MIN_SYLLABLES, EXPECTATION_WINDOW_BARS, isFunctionWord } from './rhymeTypes.js';

// ---------- spelling -> syllable chunks ----------
const VOWEL_LETTERS = /[aeiouy]/i;
// Split a word's spelling into nSyl character chunks. Leading / trailing
// punctuation is excluded from every chunk. Uses vowel-letter clusters when they
// agree with the syllable count (maximal onset: one consonant between clusters
// goes to the next syllable, of two or more the first stays), otherwise a
// proportional split, flagged `approx`.
export function syllableChunks(text, nSyl) {
  const m = text.match(/^[^A-Za-z0-9']*/); const lead = m ? m[0].length : 0;
  const t = text.match(/[^A-Za-z0-9']*$/); const trail = t ? t[0].length : 0;
  const a0 = lead, b0 = text.length - trail;
  if (b0 <= a0) return { chunks: [[0, text.length]], approx: true };
  if (nSyl <= 1) return { chunks: [[a0, b0]], approx: false };
  const letters = text.slice(a0, b0);
  const clusters = [];
  for (let i = 0; i < letters.length; i++) {
    const isV = VOWEL_LETTERS.test(letters[i]) && !(letters[i].toLowerCase() === 'y' && i === 0);
    if (isV) { if (clusters.length && clusters.at(-1)[1] === i) clusters.at(-1)[1] = i + 1; else clusters.push([i, i + 1]); }
  }
  if (clusters.length === nSyl) {
    const bounds = [0];
    for (let k = 0; k < nSyl - 1; k++) {
      const gap = clusters[k + 1][0] - clusters[k][1];     // consonants between clusters
      bounds.push(gap <= 1 ? clusters[k][1] : clusters[k][1] + 1);
    }
    bounds.push(letters.length);
    return { chunks: bounds.slice(0, -1).map((b, k) => [a0 + b, a0 + bounds[k + 1]]), approx: false };
  }
  const chunks = []; const L = letters.length;
  for (let k = 0; k < nSyl; k++) chunks.push([a0 + Math.round((k * L) / nSyl), a0 + Math.round(((k + 1) * L) / nSyl)]);
  return { chunks, approx: true };
}
// Character range [a, b) in a word -> syllable range [k0, k1) (chunks it touches).
export function snapToSyllables(word, a, b) {
  const { chunks } = syllableChunks(word.text, word.nSyllables);
  let k0 = -1, k1 = -1;
  chunks.forEach(([ca, cb], k) => { if (cb > a && ca < b) { if (k0 < 0) k0 = k; k1 = k + 1; } });
  if (k0 < 0) return null;
  return { k0, k1 };
}

// ---------- reference ----------
export const sylKey = (w, vi) => `${w.flat}:${vi}`;

// items: [{ word, k0, k1 }] for consecutive words (a contiguous highlight).
export function buildReference(song, items) {
  const toks = phoneStream(song);
  const first = items[0], last = items.at(-1);
  if (!first.word.phones) return null;
  const i0 = toks.findIndex((t) => t.w === first.word && t.isV && t.vi === first.k0);
  if (i0 < 0) return null;
  const endsWord = last.k1 >= last.word.nSyllables;
  const segs = [];
  for (let j = i0; j < toks.length; j++) {
    const t = toks[j];
    if (t.w === last.word && t.isV && t.vi === last.k1) {
      // span ends mid-word: of 2+ consonants before the next vowel, the last one starts it
      if (segs.length && segs.at(-1).cons.length >= 2) segs.at(-1).cons.pop();
      break;
    }
    if (t.w !== last.word && t.w.flat > last.word.flat) break;   // past the last word
    if (t.isV) segs.push({ v: t.p, cons: [], stress: t.stress, word: t.w, vi: t.vi, key: sylKey(t.w, t.vi), nV: t.nV });
    else if (segs.length) segs.at(-1).cons.push(t.p);
  }
  if (!segs.length) return null;
  // Part starts: dictionary stress, except later one-syllable FUNCTION words (it,
  // you, the), which the flow does not stress. Content monosyllables (cause,
  // bitch) start parts. For MATCHING, any later monosyllable is lenient (its
  // vowel may reduce), as in the mosaic candidate spans.
  // Lenient (vowel may reduce when matching): ANY later one-syllable word, exactly as the candidate
  // spans treat them, so that a query and its match are symmetric (haven finds "A- men", and
  // "A- men" finds haven). Tightening this to function words (tried 2026-10-19) broke that
  // symmetry; the cost is noise such as tree trunk ~ sleepin', all of it assonance. The real
  // decision belongs to measured stress (EXPERIMENT 03, step C), not to the dictionary.
  segs.forEach((s, i) => { s.stressed = s.stress >= 1 && !(i > 0 && s.nV === 1 && isFunctionWord(s.word.text)); s.lenient = i > 0 && s.nV === 1; });
  if (!segs.some((s) => s.stressed)) segs[0].stressed = true;
  const starts = segs.map((s, i) => (s.stressed ? i : -1)).filter((i) => i >= 0);
  const parts = starts.map((i0, k) => ({ i0, i1: starts[k + 1] ?? segs.length }));
  const runs = [];
  for (let p0 = 0; p0 < parts.length; p0++) for (let p1 = p0; p1 < parts.length; p1++) {
    const i0 = parts[p0].i0, i1 = parts[p1].i1;
    const rs = segs.slice(i0, i1);
    runs.push({ p0, p1, i0, i1, n: rs.length, keys: rs.map((s) => s.key),
      rime: { full: '', stressless: false, segs: rs.map((s, i) => ({ v: s.v, cons: s.cons, unstressed: i > 0 && (!s.stressed || s.lenient) })) },
      phones: rs.map((s) => [s.v + (s.stressed ? '1' : '0'), ...s.cons].join(' ')).join(' | ') });
  }
  const lead = segs.slice(0, starts[0]);   // unstressed syllables before the first stressed vowel: context only
  const keys = new Set(segs.map((s) => s.key));
  return { items, segs, parts, runs, lead, keys, endsWord,
    text: items.map((it) => chunkText(it.word, it.k0, it.k1)).join(' '),
    phones: segs.map((s) => [s.v + (s.stressed ? '1' : '0'), ...s.cons].join(' ')).join(' | ') };
}
export function chunkText(word, k0, k1) {
  const { chunks } = syllableChunks(word.text, word.nSyllables);
  const a = chunks[Math.min(k0, chunks.length - 1)][0], b = chunks[Math.min(k1, chunks.length) - 1][1];
  return word.text.slice(a, b);
}

// ---------- found ----------
function spanKeys(song, w0, vi0, w1, vi1) {
  const keys = [];
  for (let f = w0.flat; f <= w1.flat; f++) {
    const w = song.words[f]; const a = f === w0.flat ? vi0 : 0; const b = f === w1.flat ? vi1 : w.nSyllables - 1;
    for (let vi = a; vi <= b; vi++) keys.push(sylKey(w, vi));
  }
  return keys;
}
const rank = (t) => TYPE_ORDER.indexOf(t);

// All matches of every run, with longest-at-a-location subsumption.
// Returns [{ id, run: {p0,p1,n}, type, form, text, words, start, end, keys, within, expected }]
export function findForReference(song, ref) {
  const refWords = new Set(ref.items.map((it) => it.word.flat));
  const all = [];
  const window = EXPECTATION_WINDOW_BARS * song.beatsPerBar * (60 / song.bpm);
  const refStart = ref.items[0].word.start;
  for (const run of ref.runs) {
    const n = run.n; const found = []; const pending = [];
    const consider = (m) => {
      const inside = m.keys.every((k) => ref.keys.has(k));
      const touching = m.keys.some((k) => ref.keys.has(k)) || m.words.some((w) => refWords.has(w.flat));
      if (touching && !inside) return;                       // partly overlapping the reference: ignore
      if (inside && m.keys.join() === run.keys.join()) return;   // the run itself
      m.within = inside;
      if (m.type === 'assonance' && n < ASSONANCE_MIN_SYLLABLES) pending.push(m); else found.push(m);
    };
    // whole words
    for (const w of song.words) {
      if (!w.rimes?.length) continue;
      let best = null, bestR = null;
      for (const r of [...w.rimes, ...(n > 1 ? leadChains(w) : [])]) {
        if (r.segs.length !== n) continue;
        // the reading must land on syllables the word shows: "am" has a two-syllable
        // reading (A.M., EY EH M) that cannot be placed on its one syllable
        if (w.nSyllables - (r.lead ? 0 : r.stressedSyl) !== n) continue;
        const t = classifyRhyme(run.rime, r);
        if (t && t !== 'identical' && (best === null || rank(t) < rank(best))) { best = t; bestR = r; }
      }
      if (!best) continue;
      const vi0 = bestR.lead ? 0 : bestR.stressedSyl, vi1 = w.nSyllables - 1;
      consider({ run, type: best, form: 'word', text: w.text, words: [w], word: w, start: w.start, end: w.end, keys: spanKeys(song, w, vi0, w, vi1) });
    }
    // mosaic / embedded spans
    for (const sp of candidateSpans(song, n)) {
      const t = classifyRhyme(run.rime, sp.rime);
      if (!t || t === 'identical' || !spanAllowed(t, n)) continue;
      if (sp.single && (t !== 'perfect' || !run.rime.segs[0].cons.length)) continue;
      consider({ run, type: t, form: sp.form, text: sp.words.map((w) => w.text).join(' '), words: sp.words, word: sp.word, start: sp.start, end: sp.end,
        keys: spanKeys(song, sp.word, sp.vi0, sp.words.at(-1), sp.vi1) });
    }
    // expectation: one-syllable assonance within a bar of the reference or of a perfect / family match of this run
    const seeds = [refStart, ...found.filter((m) => m.type === 'perfect' || m.type === 'family').map((m) => m.start)];
    for (const m of pending) if (seeds.some((t) => Math.abs(t - m.start) <= window)) found.push({ ...m, expected: true });
    all.push(...found);
  }
  // subsumption: a longer run matching at a location hides shorter runs' matches inside it
  all.sort((a, b) => b.run.n - a.run.n || rank(a.type) - rank(b.type));
  const kept = [];
  for (const m of all) {
    const ks = new Set(m.keys);
    const covered = kept.some((K) => K.run.n > m.run.n && K.run.p0 <= m.run.p0 && K.run.p1 >= m.run.p1 && m.keys.every((k) => K.keySet.has(k)));
    if (covered) continue;
    m.keySet = ks; kept.push(m);
  }
  for (const m of kept) { m.id = `${m.run.p0}-${m.run.p1}|${m.form}|${m.keys.join(',')}`; delete m.keySet; }
  return kept.sort((a, b) => a.start - b.start);
}
