// src/engine/syllableMatch.js
// The protocol engine (Greg, 2026-11-05 and 11-06; spec: docs/superpowers/specs/2026-11-06-rhyme-protocol-design.md).
//
// Units. A syllable has an onset, a vowel and a coda (syllabify.js, maximal onset); every
// dictionary reading of a word stays available (`alts`). A FOOT is a stressed syllable of the
// QUERY plus the unstressed syllables after it; unstressed syllables before the first stress are
// PICKUPS. One-syllable function words count as unstressed (`weak`).
//
// A match. Every candidate syllable is tried as the END of a match. The query's FINAL foot is
// compared first with as many candidate syllables (protocol.js: rows perfect / loosened /
// shifted); its row is the match's IDENTITY and it must pass the protocol. Then the feet to the left
// are compared in turn and join while they pass (any row); the chain stops at the first that fails.
// Inside the chain only, a candidate syllable that is unstressed where the query is stressed holds
// the chain on its vowel alone (soft link: we just chill ~ '93 un-til) and never sets the identity. Pickups link on the
// vowel, unstressed on both sides.
//
// Tail cases, one rule both ways. Query has a tail the candidate lacks: SEMIRHYME (lo-gic ~
// Spock; bio-lo-gi-cal ~ lo-gic): the candidate's whole foot against the start of the query's, content words only. Candidate has a tail
// (the match ends inside its word): EMBEDDED (wage ~ en-gage-ments). On the tailed side, CREDIT
// WHERE CREDIT IS DUE: its whole cluster up to the next vowel counts as the coda when that makes
// the coda axis 1 or F, else its syllabified coda. Both only within 4 bars of the query.
//
// Assonance is a second pass, where no rhyme match ends: vowels only, three syllables or more,
// at least one pair stressed on both sides, only content-word syllables count toward three.
//
// Forms by geometry: word (one word, to its end), embedded (one word, before its end), mosaic
// (several words, ending at a word end), semirhyme. Identical: the whole query repeats.
import { isFunctionWord } from './rhymeTypes.js';
import { syllabify, bare } from '../utils/syllabify.js';
import { footRow, sameNucleus } from './protocol.js';

export const ROW_TYPE = { 1: 'perfect', 2: 'loosened', 3: 'shifted', 4: 'truncated' };
// Tentative rules that run as their own pass, so switching one off leaves every other match as it was.
// truncated (Greg 2026-11-06 evening): a two- or three-step final foot whose stressed vowel AND
// internal cluster differ, the final vowel and coda repeating (pencil ~ simple, limbo ~ so- so).
export const RULES = { truncated: true };
export const TAIL_BARS = 4;
export const ASSONANCE_MIN = 3;

/** A word's syllables, one entry per syllable, each with its readings (`alts`). */
function wordSyllables(w) {
  const readings = [w.phones, ...(w.variants ?? [])].filter(Boolean);
  const seen = new Set();
  const per = [];
  let target = null;
  for (const ph of readings) {
    const toks = ph.trim().split(/\s+/).filter(Boolean);
    const key = toks.map(bare).join(' ');
    if (seen.has(key)) continue; seen.add(key);
    const sy = syllabify(toks.map((p) => ({ p }))).map((x, k) => ({ phones: x.phones.map((y) => y.p), v: x.v, k, kEnd: k }));
    if (sy.length !== w.nSyllables || sy.some((x) => x.v < 0)) continue;
    if (target == null) target = sy.length; else if (sy.length !== target) continue;
    sy.forEach((x, j) => {
      const ph2 = x.phones;
      const next = sy[j + 1];
      const alt = {
        v: bare(ph2[x.v]),
        stress: +(ph2[x.v].match(/\d/)?.[0] ?? 0),
        on: ph2.slice(0, x.v).map(bare),
        coda: ph2.slice(x.v + 1).map(bare),
        // consonants after the vowel up to the next vowel in the word (coda + next onset)
        follow: [...ph2.slice(x.v + 1).map(bare), ...(next ? next.phones.slice(0, next.v).map(bare) : [])],
      };
      // stress and indices from the word's own (first) reading
      if (!per[j]) per[j] = { alts: [], stress: alt.stress, k: x.k, kEnd: x.kEnd };
      per[j].alts.push(alt);
    });
  }
  if (!per.length || per.length !== target) return [];
  const weak = w.nSyllables === 1 && isFunctionWord(w.text);
  return per.map((x, j) => ({ w, k: x.k, kEnd: x.kEnd, stress: x.stress, weak, alts: x.alts, final: j === per.length - 1 }));
}

/** Every syllable of the song in order (cached on the song). */
export function songSyllables(song) {
  if (song._syls) return song._syls;
  const out = [];
  for (const w of song.words) {
    if (!w.rime) continue;
    for (const s of wordSyllables(w)) { s.i = out.length; out.push(s); }
  }
  song._syls = out;
  return out;
}

const strong = (s) => s.stress >= 1 && !s.weak;
// b follows a directly in the song (same word, or the next word with phones)
const adjacent = (a, b) => a.w === b.w || b.w.flat === a.w.flat + 1;
const stepOf = (syl, alt, coda) => ({ v: alt.v, stress: alt.stress, on: alt.on, coda: coda ?? alt.coda, weak: syl.weak });
const barOf = (song, t) => (song.barPosition ? song.barPosition(t).bar : 0);
const withinBars = (song, a, b, n = TAIL_BARS) => Math.abs(barOf(song, a.start) - barOf(song, b.start)) <= n;

/** Two syllables share a nucleus in some reading (weak vowels interchangeable, protocol.js). */
function vowelLink(q, c) {
  for (const a of q.alts) for (const b of c.alts) if (sameNucleus(stepOf(q, a), stepOf(c, b))) return true;
  return false;
}

/** The codas a syllable may close with: its own, and (credit) its whole cluster to the next vowel inside its word. */
function codaOptions(S, syl, alt, credit) {
  const opts = [{ coda: alt.coda, credit: false }];
  const next = S[syl.i + 1];
  if (credit && next && next.w === syl.w && alt.follow.length > alt.coda.length) opts.push({ coda: alt.follow, credit: true });
  return opts;
}

// the stressed step (j === 0) is compared through the readings that stress its vowel, when any do
const stressedAlts = (syl, j) => { if (j !== 0) return syl.alts; const st = syl.alts.filter((a) => a.stress >= 1); return st.length ? st : syl.alts; };
const better = (a, b) => (a.row !== b.row ? a.row < b.row : a.tags.length !== b.tags.length ? a.tags.length < b.tags.length : a.credit && !b.credit);

/**
 * Compare query syllables q with candidate syllables c (same count) over every reading pair;
 * `credit`: the last step on either side may close on its whole cluster when that gives coda 1 / F.
 * -> { row, axes, tags, credit } | null
 */
function compareFoot(S, q, c, { credit = false, truncated = false } = {}) {
  const n = q.length;
  let best = null;
  const qa = [], ca = [];
  const rec = (j) => {
    if (j === n) {
      for (const qo of codaOptions(S, q[n - 1], qa[n - 1], credit)) for (const co of codaOptions(S, c[n - 1], ca[n - 1], credit)) {
        const r = footRow(qa.map((a, i) => stepOf(q[i], a, i === n - 1 ? qo.coda : undefined)), ca.map((b, i) => stepOf(c[i], b, i === n - 1 ? co.coda : undefined)), { truncated });
        if (!r) continue;
        const credited = qo.credit || co.credit;
        if (credited && r.axes.coda !== '1' && r.axes.coda !== 'F') continue;
        const cand = { ...r, credit: credited };
        if (!best || better(cand, best)) best = cand;
      }
      return;
    }
    for (const a of stressedAlts(q[j], j)) for (const b of stressedAlts(c[j], j)) { qa[j] = a; ca[j] = b; rec(j + 1); }
  };
  rec(0);
  return best;
}

/** The query's feet (left to right) and its pickups, by dictionary stress (the user chose the words: so- so, we just chill are feet). */
export function queryFeet(Q) {
  const feet = [], pickups = [];
  let cur = null;
  for (const s of Q) {
    if (s.stress >= 1) { cur = [s]; feet.push(cur); } else if (cur) cur.push(s); else pickups.push(s);
  }
  return { feet, pickups };
}
// candidate under a query foot: compared in full when dictionary-stressed; a function word or an
// unstressed syllable that fails (or has no stress) may still hold the chain on its vowel (soft)
function footLink(S, F, sp, opts) {
  let r = sp[0].stress >= 1 ? compareFoot(S, F, sp, opts) : null;
  if (!r && (sp[0].stress < 1 || sp[0].weak) && sp.every((x, j) => vowelLink(F[j], x))) r = { soft: true };
  return r;
}

/**
 * The longest match ending at candidate syllable e, or null.
 * `covered`: syllable indices already taken by an earlier (later-ending) match.
 */
function matchAt(song, S, feet, pickups, e, qWords, covered, mode = 'full') {
  const Ff = feet[feet.length - 1];
  const k = Ff.length;
  const c0 = S[e];
  if (!c0 || qWords.has(c0.w.id) || covered.has(e)) return null;
  const usable = (s) => s && !qWords.has(s.w.id) && !covered.has(s.i);
  // candidate syllables for a foot of n steps ending at index end, contiguous in the song
  const span = (end, n) => {
    const out = [];
    for (let j = 0; j < n; j++) {
      const s = S[end - j];
      if (!usable(s) || (out.length && !adjacent(s, out[0]))) return null;
      out.unshift(s);
    }
    return out;
  };
  const all = [];   // [{ c, type, counted, pickup }] right to left, reversed at the end
  const footsUsed = [];
  let form = null;
  // final foot: same shape ('full' pass), or the query's tail left over ('semi' pass: semirhyme)
  let r = null, cs = null;
  if (mode === 'full') {
    cs = span(e, k);
    if (cs) r = footLink(S, Ff, cs, { credit: true });
    // the final foot must pass the protocol: a vowel-only (soft) link never ends a match (Greg 2026-11-06;
    // soft links only hold a chain in the middle: we just chill ~ '93 un-til)
    if (r?.soft) r = null;
  } else if (mode === 'semi') {
    // the mirror of embedded: the candidate's whole foot (a stressed content-word syllable and the
    // unstressed syllables after it, to its word's end) against the START of the query's longer
    // final foot, whose tail is left over (lo-gic ~ Spock; bio-lo-gi-cal ~ lo-gic)
    if (k >= 2 && c0.final && !isFunctionWord(c0.w.text)) {
      let h = e;
      while (h > 0 && S[h].w === c0.w && S[h].stress < 1) h--;
      const m = e - h + 1;
      const sp = S[h].w === c0.w && m < k ? span(e, m) : null;
      if (sp && sp[0].stress >= 1 && !sp[0].weak) {
        r = compareFoot(S, Ff.slice(0, m), sp, { credit: true });
        if (r) { cs = sp; form = 'semirhyme'; }
      }
    }
  } else if (mode === 'trunc' && k >= 2) {
    // the last pass: only row 4, only where nothing else matched
    cs = span(e, k);
    if (cs && cs[0].stress >= 1) r = compareFoot(S, Ff, cs, { credit: true, truncated: true });
    if (r && r.row !== 4) r = null;
  }
  if (!r) return null;
  let identity = r.soft ? null : r;
  for (let j = cs.length - 1; j >= 0; j--) all.push({ c: cs[j], row: r.soft ? null : r.row, counted: !r.soft, pickup: false });
  if (!r.soft) footsUsed.push({ row: r.row, axes: r.axes, tags: r.tags, i0: cs[0].i, i1: cs[cs.length - 1].i });
  // feet to the left join while they pass; an unstressed candidate holds on the vowel
  let left = cs[0].i;
  for (let f = feet.length - 2; f >= 0; f--) {
    const F = feet[f];
    const sp = span(left - 1, F.length);
    if (!sp || !adjacent(sp[sp.length - 1], S[left])) break;
    const rr = footLink(S, F, sp);
    if (!rr) break;
    for (let j = sp.length - 1; j >= 0; j--) all.push({ c: sp[j], row: rr.soft ? null : rr.row, counted: !rr.soft, pickup: false });
    if (!rr.soft) { footsUsed.unshift({ row: rr.row, axes: rr.axes, tags: rr.tags, i0: sp[0].i, i1: sp[sp.length - 1].i }); if (!identity) identity = rr; }
    left = sp[0].i;
  }
  if (!identity) return null;   // every foot held on vowels only: no rhyme
  // pickups: unstressed on both sides, linked on the vowel
  if (all.length === Ff.length + feet.slice(0, -1).reduce((n, F) => n + F.length, 0) || form === null) {
    for (let p = pickups.length - 1; p >= 0 && footsUsed.length === feet.length; p--) {
      const s = S[left - 1];
      if (!usable(s) || !adjacent(s, S[left]) || strong(s) || !vowelLink(pickups[p], s)) break;
      all.push({ c: s, row: null, counted: false, pickup: true });
      left = s.i;
    }
  }
  all.reverse();
  const type = ROW_TYPE[identity.row];
  for (const x of all) x.type = x.row ? ROW_TYPE[x.row] : type;
  const first = all[0].c, last = all[all.length - 1].c;
  const words = [];
  for (const x of all) if (words[words.length - 1] !== x.c.w) words.push(x.c.w);
  if (!form) {
    if (words.length > 1) { if (!last.final) return null; form = 'mosaic'; }
    else form = last.final ? 'word' : 'embedded';
  }
  // tail cases within 4 bars of the query
  if ((form === 'semirhyme' || form === 'embedded') && !withinBars(song, first.w, feet[0][0].w)) return null;
  return { all, type, tags: identity.tags, feet: footsUsed, form, words, first, last };
}

const isIdentical = (Q, m, qWordList) =>
  m.all.length === Q.length && m.first.k === 0 && m.last.final && m.words.length === qWordList.length &&
  m.words.every((w, i) => (w.phones ?? '').replace(/\d/g, '') === (qWordList[i].phones ?? '').replace(/\d/g, ''));

function toMatch(m, type) {
  const w0 = m.words[0], w1 = m.words[m.words.length - 1];
  return {
    type, form: m.form, tags: m.tags ?? [], feet: m.feet ?? [], words: m.words, word: w0, text: m.words.map((w) => w.text).join(' '),
    start: w0.start,
    end: m.form === 'embedded' ? w1.start + ((m.last.kEnd + 1) * (w1.end - w1.start)) / w1.nSyllables : w1.end,
    vi0: m.first.k, vi1: m.last.kEnd,
    // one entry per covered syllable, left to right: { wordId, k, type, counted, pickup }
    links: m.all.map((x) => ({ wordId: x.c.w.id, k: x.c.k, kEnd: x.c.kEnd, type: x.type, counted: !!x.counted, pickup: !!x.pickup })),
  };
}

/** Rule D: a vowel chain ending at e where no rhyme match ends. */
function assonanceAt(S, Q, e, qWords, covered) {
  const all = [];
  for (let k = 1; k <= Q.length; k++) {
    const q = Q[Q.length - k], c = S[e - k + 1];
    if (!c || qWords.has(c.w.id) || covered.has(c.i)) break;
    if (all.length && !adjacent(c, all[0].c)) break;
    if (!vowelLink(q, c)) break;
    all.unshift({ q, c, type: 'assonance', counted: true, pickup: false });
  }
  if (all.length < ASSONANCE_MIN) return null;
  if (!all.some((x) => strong(x.q) && strong(x.c))) return null;
  if (all.filter((x) => !x.q.weak && !x.c.weak).length < ASSONANCE_MIN) return null;
  const words = [];
  for (const x of all) if (words[words.length - 1] !== x.c.w) words.push(x.c.w);
  const last = all[all.length - 1].c;
  let form;
  if (words.length > 1) { if (!last.final) return null; form = 'mosaic'; } else form = last.final ? 'word' : 'embedded';
  return { all, type: 'assonance', tags: [], feet: [], form, words, first: all[0].c, last };
}

/** All matches for a query of one or more consecutive words (ids in song order). */
export function matchQuery(song, anchorIds) {
  const qWordList = anchorIds.map((id) => song.byId.get(id)).filter(Boolean);
  if (!qWordList.length || qWordList.length !== anchorIds.length) return [];
  const S = songSyllables(song);
  const qWords = new Set(anchorIds);
  const Q = S.filter((s) => qWords.has(s.w.id));
  if (!Q.length) return [];
  const { feet, pickups } = queryFeet(Q);
  const out = [];
  const covered = new Set();
  const take = (m) => { for (const x of m.all) covered.add(x.c.i); };
  // three passes, each only where the earlier ones left syllables free: full rhyme matches, then
  // assonance chains (three vowels are more evidence than one open syllable), then semirhymes.
  // Later ends first, so the longest chain at a place wins and shorter ones inside it are skipped.
  const pass = (fn) => { for (let e = S.length - 1; e >= 0; e--) { if (qWords.has(S[e].w.id) || covered.has(e)) continue; const m = fn(e); if (!m) continue; take(m); out.push(toMatch(m, m.type === 'assonance' ? 'assonance' : isIdentical(Q, m, qWordList) ? 'identical' : m.type)); } };
  if (feet.length) pass((e) => matchAt(song, S, feet, pickups, e, qWords, covered, 'full'));
  pass((e) => assonanceAt(S, Q, e, qWords, covered));
  if (feet.length) pass((e) => matchAt(song, S, feet, pickups, e, qWords, covered, 'semi'));
  if (feet.length && RULES.truncated) pass((e) => matchAt(song, S, feet, pickups, e, qWords, covered, 'trunc'));
  return out.sort((a, b) => a.start - b.start);
}
