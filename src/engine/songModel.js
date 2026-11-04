// Song model for the typed rhyme engine. Vendored from new-prototypes/shared/songData.js
// (2026-11-04); the only edits are the import paths and that `buildSongModel` takes the
// already-fetched transcriptions instead of fetching them. Rhyme classification lives in
// rhymeTypes.js (named types, not a score). computeLayout gives the tapestry's beat grid.
import { computeLayout } from '../utils/computeLayout.js';
import { parseRime, classifyRhyme, spanAllowed, ASSONANCE_MIN_SYLLABLES, EXPECTATION_WINDOW_BARS, EXPECTATION, RULE_OPTIONS } from './rhymeTypes.js';
import { PHONE_OVERRIDES, normalizeWord } from './phoneOverrides.js';

const ARPABET = /^[A-Z]{1,2}[012]?( [A-Z]{1,2}[012]?)*$/;
const VOWEL_TOKEN = /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)[012]?$/;

export function cleanText(t = '') {
  return t.replace(/[\n]/g, '').trim();
}

// RULE_OPTIONS.compoundRimes: add, for a pronunciation whose primary stress precedes a later
// secondary stress, the rime read from the primary (the secondary demoted to unstressed).
function withCompoundRimes(rimes, variants) {
  if (!RULE_OPTIONS.compoundRimes) return rimes;
  const extra = [];
  for (const v of variants) {
    const toks = v.trim().split(/\s+/);
    const p = toks.findIndex((t) => /1$/.test(t)); const sec = toks.findIndex((t, i) => i > p && /2$/.test(t));
    if (p < 0 || sec < 0) continue;
    const r = parseRime(toks.map((t, i) => (i > p && /2$/.test(t) ? t.replace(/2$/, '0') : t)).join(' '));
    if (r && !rimes.some((x) => x.full === r.full && x.stressedSyl === r.stressedSyl)) { r.compound = true; extra.push(r); }
  }
  return [...rimes, ...extra];
}

/**
 * Build the engine's song model from the app's transcriptions. Matching uses the
 * dictionary pronunciations (lyric-transcription.json); when a word carries an
 * `mfa` block (measured dataset) and `dataset === 'measured'`, the performed
 * pronunciation leads instead (not the app's default: see memory 2026-10-20).
 */
export function buildSongModel({ songId, lyricTranscription, drumTranscription, dataset = 'audioshake' }) {
  const lyrics = lyricTranscription;
  const drums = drumTranscription;
  const used = dataset;
  const words = [];
  let mfaAligned = 0;
  lyrics.lines.forEach((line, li) => {
    line.words.forEach((w, wi) => {
      let variants = (Array.isArray(w.phones) ? w.phones : [String(w.phones ?? '')]).filter((v) => ARPABET.test(v.trim()));
      let phones = variants[0] ?? String((Array.isArray(w.phones) ? w.phones[0] : w.phones) ?? '');
      let n = Math.max(1, w.nSyllables ?? 1);
      // The pipeline stores the word's text when its dictionary lookup fails;
      // fill those from the hand-written table (and recount syllables).
      if (!ARPABET.test(phones.trim())) {
        const o = PHONE_OVERRIDES[songId]?.[normalizeWord(w.text)];
        phones = o?.phones ?? '';
        if (o) n = Math.max(1, phones.split(' ').filter((t) => VOWEL_TOKEN.test(t)).length);
      }
      // MFA dataset: the aligned times, the ONE pronunciation the audio chose
      // (so variant matching is off: the data says what was performed), and
      // measured vowel onsets instead of the even split.
      const m = used !== 'audioshake' && w.mfa?.status === 'aligned' ? w.mfa : null;
      const start = m ? m.start : w.start;
      const end = m ? m.end : w.end;
      // The performed pronunciation leads (it is the one the spans use), and the dictionary's
      // variants stay in the list for whole-word matching: the aligner's pick among close
      // variants (all = AO L or AA L) is acoustic likelihood, not a rhyme judgement, and a
      // word can rhyme on any way it can be said (the original Rap Tapestry rule). 2026-10-19.
      if (m) { phones = m.pron; variants = [m.pron, ...variants.filter((v) => v !== m.pron)]; n = Math.max(1, m.syllables.length); mfaAligned++; }
      const syl = (end - start) / n;
      // Rhyme is measured from the last STRESSED vowel (see rhymeTypes.js), so
      // the rhyming syllable is that one. Syllable timing is the app's
      // even-split approximation (word duration / nSyllables) unless measured.
      const rime = parseRime(phones);
      const k = Math.min(n - 1, rime?.stressedSyl ?? n - 1);
      const rhymeStart = m?.syllables[k]?.onset ?? start + k * syl;
      words.push({
        id: `${li}-${wi}`,
        li,
        wi,
        flat: words.length,
        text: cleanText(w.text),
        phones,
        rime,
        // every dictionary variant (CMU alternates); whole-word matching tries all
        rimes: withCompoundRimes(variants.length > 1 ? variants.map(parseRime).filter(Boolean) : [rime].filter(Boolean), variants),
        start,
        end,
        nSyllables: n,
        rhymeStart,
        rhymeEnd: end,
        mfa: m,
        audioshake: { start: w.start, end: w.end },
      });
    });
  });

  const duration = Math.max(drums.beats.at(-1) ?? 0, words.at(-1)?.end ?? 0) + 1;
  // Same beat grid the tapestry uses (gap-bridged beats; Mode A downbeats =
  // every Nth grid beat starting at index 0), so bar numbers line up.
  const layout = computeLayout({
    duration,
    width: 1000,
    height: 1000,
    beats: drums.beats,
    downbeats: drums.downbeats,
    estimated_bpm: drums.estimated_bpm,
  });
  const grid = layout.gridTimes;
  const beatsPerBar = layout.beatsPerBar;

  // t -> { bar, beat (0-based), phase in [0,1) across the bar }
  function barPosition(t) {
    let lo = 0;
    let hi = grid.length - 1;
    if (t < grid[0]) return { bar: -1, beat: 0, phase: 0 };
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (grid[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    const j = lo;
    const next = grid[j + 1] ?? grid[j] + 60 / drums.estimated_bpm;
    const frac = Math.min(1, Math.max(0, (t - grid[j]) / (next - grid[j])));
    const beat = j % beatsPerBar;
    return { bar: Math.floor(j / beatsPerBar), beat, phase: (beat + frac) / beatsPerBar };
  }

  const numBars = Math.ceil(grid.length / beatsPerBar);

  const byId = new Map(words.map((w) => [w.id, w]));
  return { songId, dataset: used, mfaAligned, lines: lyrics.lines, words, byId, grid, beatsPerBar, numBars, duration, bpm: drums.estimated_bpm, barPosition };
}

// ---------- typed rhyme query (two axes: sound type x form) ----------

const VOWEL_RE = /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/;

// Flatten the song into one phone stream that ignores word boundaries.
export function phoneStream(song) {
  if (song._stream) return song._stream;
  const toks = [];
  for (const w of song.words) {
    const raw = w.phones.trim().split(/\s+/).filter(Boolean);
    let vi = 0;
    const nV = raw.filter((t) => VOWEL_RE.test(t.replace(/\d/g, ''))).length;
    raw.forEach((t, k) => {
      const p = t.replace(/\d/g, '').toUpperCase();
      const isV = VOWEL_RE.test(p);
      toks.push({ p, isV, stress: isV ? +(t.match(/\d/)?.[0] ?? 0) : null, w, vi: isV ? vi++ : null, nV,
        lastInWord: k === raw.length - 1 });
    });
  }
  song._stream = toks;
  return toks;
}

// Estimated onset/offset of the k-th syllable of a word (even split).
const sylStart = (w, k) => w.start + (k * (w.end - w.start)) / w.nSyllables;
const sylEnd = (w, k) => w.start + ((k + 1) * (w.end - w.start)) / w.nSyllables;

// Spans of n syllables starting at a stressed vowel, crossing word boundaries
// (mosaic) or sitting inside one word (embedded). Returns rime-like objects.
export function candidateSpans(song, n) {
  const toks = phoneStream(song);
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    const t0 = toks[i];
    if (!t0.isV || !(t0.stress >= 1)) continue;
    const segs = [];
    let j = i, lastV = null, ok = true;
    while (j < toks.length && segs.length < n) {
      const t = toks[j];
      if (t.isV) {
        // later one-syllable words (it, you, the) carry dictionary stress; ignore it
        segs.push({ v: t.p, cons: [], unstressed: segs.length > 0 && (t.stress === 0 || t.nV === 1) });
        lastV = t; j++;
        // consonants up to the next vowel; after the final vowel, stop at word end
        while (j < toks.length && !toks[j].isV) {
          if (segs.length === n && toks[j].w !== lastV.w) break;
          segs.at(-1).cons.push(toks[j].p); j++;
        }
      } else { ok = false; break; }
    }
    if (!ok || segs.length < n) continue;
    const w0 = t0.w, w1 = lastV.w;
    const endsWord = lastV.vi === lastV.nV - 1;
    // Span ending mid-word: of 2+ consonants before the next vowel, the last one
    // starts the next syllable (en-gage-Ments); a single one stays (bio-logic-al).
    if (!endsWord && segs.at(-1).cons.length >= 2) segs.at(-1).cons.pop();
    let form;
    if (w0 !== w1) {
      // mosaic: start at the first word's own rhyme vowel, end at a word end
      if (!endsWord || w0.rime?.stressedSyl !== t0.vi) continue;
      form = 'mosaic';
    } else {
      // whole-word rimes are handled separately
      if (endsWord && w0.rime?.stressedSyl === t0.vi) continue;
      form = 'embedded';
    }
    const words = song.words.slice(w0.flat, w1.flat + 1);
    out.push({
      rime: { full: '', segs, lastVowel: segs.at(-1).v, lastStressed: true, finalCoda: '' },
      form, words, word: w0, single: n === 1, vi0: t0.vi, vi1: lastV.vi,
      // dot and text both sit at the first word's start (the rhyming syllable's
      // estimated position is in the tooltip, via rime)
      start: w0.start,
      end: form === 'mosaic' ? w1.end : sylEnd(w1, lastV.vi),
    });
  }
  return out;
}

// Strongest type over all pronunciation variants of both words (the original
// Rap Tapestry design: any CMU alternate may be used for matching).
export const TYPE_ORDER = ['identical', 'perfect', 'family', 'additive', 'slant', 'assonance'];

// A word's vowel chain from its first syllable, for every pronunciation variant: the rime
// a listener hears when the whole word is set against a multi-syllable reference (e-NOUGH
// against tree TRUNK). Only words whose first syllable is unstressed need this; the others'
// rime from the last stressed vowel already starts at the first syllable. (2026-10-19)
export function leadChains(w) {
  if (!w.rimes?.length) return [];
  const out = [];
  for (const r of w.rimes) {
    if (r.stressedSyl === 0) continue;
    const toks = r.full.split(' ');
    const segs = [];
    for (const t of toks) {
      const p = t.replace(/\d/g, '');
      if (VOWEL_RE.test(p)) segs.push({ v: p, cons: [], unstressed: segs.length > 0 && /0/.test(t) });
      else if (segs.length) segs.at(-1).cons.push(p);
    }
    // the variant strings in `full` are stripped of stress digits; mark leading syllables unstressed from stressedSyl
    segs.forEach((sg, i) => { sg.unstressed = i > 0 && i < r.stressedSyl; });
    if (segs.length) out.push({ full: '', stressless: false, segs, nSyl: segs.length, stressedSyl: r.stressedSyl, lead: true });
  }
  return out;
}
export function bestType(a, b) {
  let best = null;
  for (const ra of a.rimes) for (const rb of b.rimes) {
    const t = classifyRhyme(ra, rb);
    if (t && (best === null || TYPE_ORDER.indexOf(t) < TYPE_ORDER.indexOf(best))) best = t;
  }
  return best;
}

// Every match for the anchor word: { word, words[], start, end, type, form, text,
// expected? }. `expected` marks a one-syllable assonance admitted by proximity.
export function findTypedRhymes(song, anchorId) {
  const anchor = song.words.find((w) => w.id === anchorId);
  if (!anchor?.rime) return [];
  const nSyl = anchor.rime.segs.length;
  const out = [];
  const pending = [];   // one-syllable assonance: admitted only by expectation
  const push = (m) => ((m.type === 'assonance' && nSyl < ASSONANCE_MIN_SYLLABLES) ? pending : out).push(m);
  for (const w of song.words) {
    let type = w.id === anchorId ? 'anchor' : bestType(anchor, w);
    // a word with an unstressed first syllable, heard whole against a multi-syllable anchor
    if (!type && nSyl > 1) for (const c of leadChains(w)) { if (c.segs.length !== nSyl) continue; const t = classifyRhyme(anchor.rime, c); if (t && t !== 'identical' && (!type || TYPE_ORDER.indexOf(t) < TYPE_ORDER.indexOf(type))) type = t; }
    if (type) push({ word: w, words: [w], start: w.start, end: w.end, type, form: 'word', text: w.text });
  }
  // spans are compared with the anchor's rime; with RULE_OPTIONS.compoundRimes also with its
  // compound rime (HAND-ball against man's a), each at its own syllable count
  const anchorRimes = [anchor.rime, ...(anchor.rimes ?? []).filter((r) => r.compound)];
  const seen = new Set();
  for (const ar of anchorRimes) for (const sp of candidateSpans(song, ar.segs.length)) {
    if (sp.words.includes(anchor)) continue;
    const type = classifyRhyme(ar, sp.rime);
    if (!spanAllowed(type, ar.segs.length)) continue;
    // One-syllable embedded match (engage / engage-ments): only perfect, and only
    // a closed syllable. Otherwise any stressed syllable inside a longer word
    // matches (my / Dial, man / many): semirhyme noise.
    if (sp.single && (type !== 'perfect' || !ar.segs[0].cons.length)) continue;
    const k = `${sp.form}|${sp.words.map((w) => w.id).join(',')}|${sp.vi0}|${sp.vi1}`;
    if (seen.has(k)) continue; seen.add(k);
    push({ ...sp, type, text: sp.words.map((w) => w.text).join(' ') });
  }
  // Expectation: a one-syllable assonance within one bar of a match already in
  // the family is admitted, and can itself admit the next one (a chain).
  if (pending.length) {
    const window = EXPECTATION_WINDOW_BARS * song.beatsPerBar * (60 / song.bpm);
    const admitted = out.filter((m) => m.type === 'anchor' || EXPECTATION.seeds.has(m.type)).map((m) => m.start);
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = pending.length - 1; i >= 0; i--) {
        const m = pending[i];
        if (admitted.some((t) => Math.abs(t - m.start) <= window)) {
          out.push({ ...m, expected: true }); pending.splice(i, 1); changed = true;
          if (EXPECTATION.chain) admitted.push(m.start);
        }
      }
    }
  }
  return out.sort((a, b) => a.start - b.start);
}
