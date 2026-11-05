// src/engine/syllableMatch.js
// The rhyme hierarchy agreed with Greg on 2026-11-05 (one matcher for word, run and line
// queries). A query is the syllables of its words. Every place in the song is tried as the
// END of a match: the query's last syllable is paired with it, then the pairing walks
// leftward, one syllable at a time, for as long as the syllables link.
//
// Linking, per pair of syllables:
//  - Both stressed (dictionary stress, one-syllable function words count as unstressed):
//    the vowel and the consonants that CLOSE the syllable are classified (perfect, family,
//    additive, assonance; slant only when RULE_OPTIONS.slant). The consonants that open the
//    next syllable are free, as the first syllable's onset is (so-so / so-lo). When the whole
//    consonant cluster between the two vowels is identical, it matches however it splits.
//  - Otherwise (an unstressed syllable on either side): the vowel must be the same (AH / IH / EH
//    count as one reduced vowel: unstressed against unstressed, or against a stressed AH / IH /
//    EH). Such a link holds the chain but does not set the label, except at the end: the
//    final pair always counts.
// The CORE of a match starts at a pair stressed on both sides; linked unstressed pairs to the
// left of it are PICKUPS (un-til / the thrill): they lengthen the match and never change it.
// The label is the weakest counted link. Assonance needs two full vowels (a schwa holds a
// chain, it does not count). A one-syllable match must be perfect, family or additive; inside
// a longer word, only perfect on a closed syllable (engage / engage-ments).
// Forms by geometry: word (inside one word, to its end), embedded (inside one word, before its
// end), mosaic (across words, ending at a word's end), semirhyme (below). One match per place.
// Semirhyme: a content word within one bar of the query whose stressed syllable matches the
// query's last word on its stressed syllable alone, one of the two words carrying an
// unstressed ending the other lacks (logic ~ Spock; Spock ~ logic); perfect, family or additive.
import { parseRime, classifyRhyme, isFunctionWord, REDUCED, RULE_OPTIONS } from './rhymeTypes.js';
import { syllabify, bare } from '../utils/syllabify.js';

const ORDER = ['identical', 'perfect', 'family', 'additive', 'slant', 'assonance'];
const rank = (t) => (t == null ? 99 : ORDER.indexOf(t));
const ONE_SYLLABLE_TYPES = new Set(['perfect', 'family', 'additive', 'slant']);
// a semirhyme compares one syllable, so like any one-syllable match it is never assonance
// (Greg 2026-11-05: vibrations ~ makes / females meant only the shared EY)
const SEMIRHYME_TYPES = ONE_SYLLABLE_TYPES;
const VOWEL = /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)\d?$/;

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
    // "-ire" / "-our" words are said with one syllable or two (admire AY1 R, desire AY1 ER0):
    // a final ER after an open AY / AW is read as R closing that syllable, so both compare
    // alike (the rule parseRime applies to rimes); the merged syllable spans both indices.
    const L = sy.length;
    if (L >= 2 && sy[L - 1].v === 0 && bare(sy[L - 1].phones[0]) === 'ER' && /^(AY|AW)$/.test(bare(sy[L - 2].phones[sy[L - 2].v])) && sy[L - 2].phones.length === sy[L - 2].v + 1) {
      sy[L - 2] = { ...sy[L - 2], phones: [...sy[L - 2].phones, 'R', ...sy[L - 1].phones.slice(1)], kEnd: L - 1 };
      sy.pop();
    }
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
// a schwa: an unstressed (or function-word) syllable that can be read with a reduced vowel
const schwa = (s) => !strong(s) && s.alts.some((a) => REDUCED.has(a.v));
// The consonants that close a syllable. Ambisyllabic consonant: an OPEN stressed syllable
// before a schwa in the same word takes the next consonant (lo-gic is heard lodge-ic,
// di-gits didge-its); a stressed short vowel does not end a syllable. Otherwise the next
// syllable's onset is free (so-lo, en-gage-ments).
function closing(alt, syl, next) {
  if (alt.coda.length || !next || next.w !== syl.w || !schwa(next) || !(syl.stress >= 1)) return alt.coda;
  return alt.follow.slice(0, 1);
}
const sameCons = (a, b) => a.join() === b.join();
function classify(v1, c1, v2, c2) {
  const t = classifyRhyme(parseRime([v1 + '1', ...c1].join(' ')), parseRime([v2 + '1', ...c2].join(' ')));
  if (t === 'identical') return 'perfect';
  if (t === 'slant' && !RULE_OPTIONS.slant) return null;
  return t;
}

/**
 * One pair: query syllable q against candidate syllable c. `qn`, `cn`: the syllables to their
 * right inside the stretch (null at the end). `asCore`: classify fully even if a side is weak.
 * -> { type, counted } | null
 */
function link(q, c, qn, cn, { final, asCore }) {
  const full = asCore ? q.stress >= 1 && c.stress >= 1 : strong(q) && strong(c);
  let best = null;
  // classified as stressed: only readings that stress the vowel (to as T UW1, not T IH0)
  const pick = (s) => { if (!full) return s.alts; const st = s.alts.filter((x) => x.stress >= 1); return st.length ? st : s.alts; };
  for (const a of pick(q)) for (const b of pick(c)) {
    let ca = a.coda, cb = b.coda;
    if (final) {
      // the query ends at its word's end; a candidate ending mid-word may close on its
      // whole following cluster (chill / chill-ing) or on its coda alone
      if (!c.final && sameCons(ca, b.follow)) cb = ca;
    } else if (qn && cn) {
      const qa = [...a.coda, ...(qn.alts[0]?.on ?? [])], cbb = [...b.coda, ...(cn.alts[0]?.on ?? [])];
      if (sameCons(qa, cbb)) cb = ca;
      else { ca = closing(a, q, qn); cb = closing(b, c, cn); }
    }
    let type;
    if (full) type = classify(a.v, ca, b.v, cb);
    else {
      // unstressed AH / IH / EH are one reduced vowel, also against a stressed AH / IH / EH
      // (fa-mous ~ Hey, miss: AH0 S ~ IH1 S); the reduced side still does not count as a full vowel
      const sameV = a.v === b.v || (REDUCED.has(a.v) && REDUCED.has(b.v));
      if (!sameV) continue;
      type = classify(a.v, ca, a.v, cb) ?? 'assonance';
    }
    if (type && rank(type) < rank(best?.type)) best = { type };
  }
  if (!best) return null;
  return { type: best.type, counted: full || final };
}

const fullVowel = (x) => !schwa(x.q) && !schwa(x.c);

/** The longest valid match ending at candidate syllable index e, or null. */
function matchAt(S, Q, e, qWords) {
  const pairs = [];
  for (let k = 1; k <= Q.length; k++) {
    const q = Q[Q.length - k], c = S[e - k + 1];
    if (!c || qWords.has(c.w.id)) break;
    // syllables must be contiguous in the song (no gaps from words without phones)
    if (k > 1 && (S[e - k + 2].i - c.i !== 1)) break;
    pairs.unshift({ q, c, qn: Q[Q.length - k + 1] ?? null, cn: k > 1 ? S[e - k + 2] : null, final: k === 1 });
  }
  // walk from the right: each pair must link (soft); stop at the first that does not
  const links = [];
  for (let j = pairs.length - 1; j >= 0; j--) {
    const p = pairs[j];
    const l = link(p.q, p.c, p.final ? null : p.qn, p.final ? null : p.cn, { final: p.final });
    if (!l) break;
    links.unshift({ ...p, ...l });
  }
  if (!links.length) return null;
  // core starts: pairs stressed (dictionary) on both sides; try the leftmost first
  for (let s = 0; s < links.length; s++) {
    const P = links[s];
    if (!(P.q.stress >= 1 && P.c.stress >= 1)) continue;
    const core = links.slice(s).map((x, j) => (j === 0 ? { ...x, ...(link(x.q, x.c, x.final ? null : x.qn, x.final ? null : x.cn, { final: x.final, asCore: true }) ?? { type: null }), counted: true } : x));
    if (core[0].type == null) continue;
    const counted = core.filter((x) => x.counted);
    const type = counted.reduce((w, x) => (rank(x.type) > rank(w) ? x.type : w), 'perfect');
    const fullVowels = core.filter(fullVowel).length;
    if (type === 'assonance' && fullVowels < 2) continue;
    if (core.length === 1 && !ONE_SYLLABLE_TYPES.has(type)) continue;
    // pickups: only when no pair left of the core is stressed on both sides, and only the run
    // just left of the core that is unstressed on both sides (un-til / the thrill; a-ttack is
    // not picked up by flick's at)
    let pickups = [];
    if (links.slice(0, s).every((x) => !(x.q.stress >= 1 && x.c.stress >= 1))) {
      let p0 = s;
      while (p0 > 0 && !strong(links[p0 - 1].q) && !strong(links[p0 - 1].c)) p0--;
      pickups = links.slice(p0, s);
    }
    const all = [...pickups.map((x) => ({ ...x, pickup: true, counted: false })), ...core];
    const first = all[0].c, last = all.at(-1).c;
    const words = [];
    for (const x of all) if (words.at(-1) !== x.c.w) words.push(x.c.w);
    let form;
    if (words.length > 1) { if (!last.final) continue; form = 'mosaic'; }
    else form = last.final ? 'word' : 'embedded';
    if (form === 'embedded' && core.length === 1 && !(type === 'perfect' && core[0].q.alts.some((a) => a.coda.length))) continue;
    return { all, type, form, words, first, last };
  }
  return null;
}

const isIdentical = (Q, m, qWordList) =>
  m.all.length === Q.length && m.first.k === 0 && m.last.final && m.words.length === qWordList.length &&
  m.words.every((w, i) => (w.phones ?? '').replace(/\d/g, '') === (qWordList[i].phones ?? '').replace(/\d/g, ''));

function toMatch(m, type) {
  const w0 = m.words[0], w1 = m.words.at(-1);
  return {
    type, form: m.form, words: m.words, word: w0, text: m.words.map((w) => w.text).join(' '),
    start: w0.start,
    end: m.form === 'embedded' ? w1.start + ((m.last.kEnd + 1) * (w1.end - w1.start)) / w1.nSyllables : w1.end,
    vi0: m.first.k, vi1: m.last.kEnd,
    // one entry per covered syllable, left to right: { wordId, k, type, counted, pickup }
    links: m.all.map((x) => ({ wordId: x.c.w.id, k: x.c.k, kEnd: x.c.kEnd, type: x.type, counted: !!x.counted, pickup: !!x.pickup })),
  };
}

/** Semirhyme candidates for the query's last word (see header). */
function semirhymes(song, S, qWordList, taken) {
  const wq = qWordList.at(-1);
  const qs = S.filter((s) => s.w === wq);
  if (!qs.length) return [];
  const bar = (song.beatsPerBar * 60) / song.bpm;
  const qWords = new Set(qWordList.map((w) => w.id));
  const lastStressed = (syls) => { for (let k = syls.length - 1; k >= 0; k--) if (syls[k].stress >= 1) return k; return -1; };
  const qt = lastStressed(qs);
  if (qt < 0) return [];
  const qTail = qt < qs.length - 1;   // the query word has an unstressed ending
  const out = [];
  const byWord = new Map();
  for (const s of S) (byWord.get(s.w) ?? byWord.set(s.w, []).get(s.w)).push(s);
  for (const [w, cs] of byWord) {
    if (qWords.has(w.id) || taken.has(w.id) || isFunctionWord(w.text)) continue;
    if (Math.abs(w.start - wq.start) > bar + 1e-9) continue;
    const ct = lastStressed(cs);
    if (ct < 0) continue;
    const cTail = ct < cs.length - 1;
    if (qTail === cTail) continue;   // exactly one side carries the extra unstressed ending
    const q = qs[qt], c = cs[ct];
    let best = null;
    for (const a of q.alts) for (const b of c.alts) {
      // the side with the unstressed ending closes as in a longer match (closing())
      const t = classify(a.v, qTail ? closing(a, q, qs[qt + 1]) : a.coda, b.v, cTail ? closing(b, c, cs[ct + 1]) : b.coda);
      if (t && SEMIRHYME_TYPES.has(t) && rank(t) < rank(best)) best = t;
    }
    if (!best) continue;
    out.push({ type: best, form: 'semirhyme', words: [w], word: w, text: w.text, start: w.start, end: w.end, vi0: c.k, vi1: c.kEnd,
      links: [{ wordId: w.id, k: c.k, kEnd: c.kEnd, type: best, counted: true, pickup: false }] });
  }
  return out;
}

/** All matches for a query of one or more consecutive words (ids in song order). */
export function matchQuery(song, anchorIds) {
  const qWordList = anchorIds.map((id) => song.byId.get(id)).filter(Boolean);
  if (!qWordList.length || qWordList.length !== anchorIds.length) return [];
  const S = songSyllables(song);
  const qWords = new Set(anchorIds);
  const Q = S.filter((s) => qWords.has(s.w.id));
  if (!Q.length) return [];
  const out = [];
  const taken = new Set();
  for (let e = 0; e < S.length; e++) {
    if (qWords.has(S[e].w.id)) continue;
    const m = matchAt(S, Q, e, qWords);
    if (!m) continue;
    out.push(toMatch(m, isIdentical(Q, m, qWordList) ? 'identical' : m.type));
    for (const w of m.words) taken.add(w.id);
  }
  out.push(...semirhymes(song, S, qWordList, taken));
  return out.sort((a, b) => a.start - b.start);
}
