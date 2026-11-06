// Song model for the typed rhyme engine. Vendored from new-prototypes/shared/songData.js
// (2026-11-04); the only edits are the import paths and that `buildSongModel` takes the
// already-fetched transcriptions instead of fetching them. Rhyme classification lives in
// rhymeTypes.js (named types, not a score). computeLayout gives the tapestry's beat grid.
import { computeLayout } from '../utils/computeLayout.js';
import { parseRime, RULE_OPTIONS } from './rhymeTypes.js';
import { PHONE_OVERRIDES, READINGS, normalizeWord } from './phoneOverrides.js';
import { SYLLABLE_COUNTS } from './syllableCounts.js';

const vowelCount = (v) => v.trim().split(/\s+/).filter((t) => VOWEL_TOKEN.test(t)).length;

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
      // Readings that disagree on the number of syllables: the aligner's count (syllableCounts.js)
      // settles it, else the first reading's; readings with any other count are dropped, so a
      // word is never matched on a syllable it does not have (the Dial leak, 2026-11-05).
      let settled = null;
      if (variants.length > 1 && new Set(variants.map(vowelCount)).size > 1) {
        settled = SYLLABLE_COUNTS[songId]?.[`${li}-${wi}`]?.count ?? vowelCount(variants[0]);
        const keep = variants.filter((v) => vowelCount(v) === settled);
        if (keep.length) variants = keep; else settled = null;
      }
      // a reading by hand (phoneOverrides READINGS) replaces every dictionary reading
      const byHand = READINGS[normalizeWord(w.text)];
      if (byHand) { variants = [byHand]; settled = vowelCount(byHand); }
      let phones = variants[0] ?? String((Array.isArray(w.phones) ? w.phones[0] : w.phones) ?? '');
      let n = Math.max(1, settled ?? w.nSyllables ?? 1);
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
        // the readings kept (same syllable count as `phones`), with stress digits
        variants: variants.length ? variants : [phones].filter(Boolean),
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
