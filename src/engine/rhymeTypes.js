// Named rhyme types (prototype, v0). Replaces the single strictness slider with
// discrete, literary categories the user toggles. Each pair gets the single
// highest-ranked type it qualifies for.
//
// Rhyme is measured from the LAST STRESSED vowel to the end of the word (the
// textbook definition, covering masculine and feminine rhyme), not the last
// vowel as the app's engine does. See research/design/engine-critique-log.md C2.
//
// Definitions are first-pass, from standard poetics / songwriting pedagogy
// (Pattison's ladder, ordered by stability: perfect > family > additive >
// subtractive > assonance). Sources:
// research/reference/rhyme-taxonomy-and-alignment.md.
import { VOWEL_SIM } from '../utils/phonemeSimilarity.js';

// Sources (glossary footers). Keys are cited by types/forms below.
export const SOURCES = {
  pattison: 'Pat Pattison, Writing Better Lyrics (2nd ed., 2009) and Songwriting: Essential Guide to Rhyming (2014); "Songwriter U: Surviving Rhyme; Meeting the Family," American Songwriter. Consonant-family chart as reproduced by P. Reisler (2019).',
  poetics: 'Poetics glossaries: Wikipedia "Rhyme," "Perfect and imperfect rhymes," "Light rhyme" (citing Merriam-Webster\'s Encyclopedia of Literature, 1995); Representative Poetry Online glossary (U. Toronto).',
  hirjee: 'H. Hirjee and D. Brown, "Automatic Detection of Internal and Imperfect Rhymes in Rap Lyrics," ISMIR 2009; H. Hirjee, MMath thesis, U. Waterloo, 2010.',
  rhymedesign: 'N. McCurdy, V. Srikumar, M. Meyer, "RhymeDesign: A Tool for Analyzing Sonic Devices in Poetry," NAACL Workshop on Computational Linguistics for Literature, 2015.',
  tait: 'J. Tait, M. Tabain, C. Sykes, "Stress-Meter Alignment in American Hip Hop," Proc. SST 2014.',
  meter: 'K. Adams, "On the Metrical Techniques of Flow in Rap Music," Music Theory Online 15(5), 2009; N. Condit-Schultz, "MCFlow: A Digital Corpus of Rap Transcriptions," Empirical Musicology Review 11(2), 2016.',
  malmi: 'E. Malmi, P. Takala, H. Toivonen, T. Raiko, A. Gionis, "DopeLearning: A Computational Approach to Rap Lyrics Generation," KDD 2016 (rhyme density = longest matching vowel sequence, consonants ignored); A. Bradley, Book of Rhymes: The Poetics of Hip Hop, 2009; P. Edwards, How to Rap, 2009 (multisyllabic rhyme as vowel-led).',
  huron: 'D. Huron, Sweet Anticipation: Music and the Psychology of Expectation, MIT Press 2006; Pattison on rhyme as set-up and payoff (expectation). Rhyme-detection systems (Hirjee & Brown; Reddy & Knight, "Unsupervised Discovery of Rhyme Schemes," ACL 2011) treat proximity as the candidate window, not as a similarity term. Needs checking before citation in the paper.',
  design: 'Prototype design choices (not from the literature): see research/design/engine-critique-log.md and new-prototypes/shared/rhymeTypes.js.',
};

export const RHYME_TYPES = [
  { key: 'identical', label: 'Identical', color: '#9aa3ad', on: true, example: 'crew / crew',
    desc: 'Same sounds including the onset: a repeated word or a homophone.', sources: ['poetics'] },
  { key: 'perfect', label: 'Perfect', color: '#ffc94d', on: true, example: 'clock / Spock; Bridgette / midget',
    desc: 'Identical from the last stressed vowel to the end, with a different onset. Covers masculine (stress on the final syllable) and feminine (one unstressed syllable after it) rhyme.',
    sources: ['pattison', 'poetics', 'rhymedesign'] },
  { key: 'family', label: 'Family', color: '#ff5fa2', on: true, example: 'clock / stop; Bridgette / frigid',
    desc: 'Perfect, except the consonants after the vowel differ within a phonetic family: plosives (p b t d k g), fricatives incl. affricates (f v th s z sh zh ch j), or nasals (m n ng). Voicing does not matter. L, R, W, Y belong to no family.',
    sources: ['pattison'] },
  { key: 'additive', label: 'Additive / subtractive', color: '#ff8f4d', on: true, example: 'clock / blocks; quick / think; Bridgette / digits',
    desc: 'Perfect, except one side has exactly one extra consonant, anywhere in the consonant cluster after the vowel: at the end (clock / blocks, the plural S) or inside it (quick / think, the NG before K). A one-slot wildcard; which side has the extra sound (additive vs subtractive) is not distinguished. In rap, leftovers are most common at the end (S, Z, T, D) and at the start of the cluster (R, L, S). Only one loosening at a time: hot / rocks (K for T and an extra S) is not additive.',
    sources: ['pattison', 'hirjee'] },
  { key: 'slant', label: 'Slant (near vowel)', color: '#b28dff', on: true, example: 'beat / bit',
    desc: 'A neighboring stressed vowel (formant similarity >= 0.75, both plain vowels or both glides), with consonants that would be perfect, family or additive. "Slant" is used loosely in the literature; this is our operational definition.',
    sources: ['poetics', 'design'] },
  { key: 'assonance', label: 'Assonance', color: '#4dc3ff', on: true, example: 'dizziness / silly bitch; seen / feel (same line)',
    desc: 'The same stressed vowel and the following vowels, with consonants that differ beyond family or additive: a vowel chain. Admitted on its own when the chain is two or more syllables (dizziness / silly bitch: IH IY schwa), since a one-vowel match is mostly a measure of how common the vowel is. A one-syllable assonance is admitted only by expectation: within one bar of a perfect or family match already in the family (seen / keen set up feel in one line).',
    sources: ['pattison', 'poetics', 'malmi', 'huron', 'design'] },
];

// Second axis: the FORM of the match. Not a filter: always shown, encoded as
// line style, and named together with the type ("family mosaic").
export const FORMS = [
  { key: 'word', label: 'Whole word', dash: null, example: 'midget / Bridgette',
    desc: 'The rhyme sits in one word, from its last stressed vowel to its end.', sources: ['poetics'] },
  { key: 'mosaic', label: 'Mosaic', dash: '5 3', example: 'gotta / Got a; Electromagnetic / Check it',
    desc: 'The rhyming syllables are spread across two or more words. The span starts at a word\'s stressed vowel and ends at the end of a word; stress on later one-syllable words is ignored.',
    sources: ['poetics', 'hirjee', 'design'] },
  { key: 'embedded', label: 'Embedded', dash: '1.5 3', example: 'logic / bio-logic-al',
    desc: 'A run of two or more rhyming syllables hidden inside a longer word, not reaching its end or starting at a secondary stress. (A single stressed syllable inside a longer word, as in my / Dial, is semirhyme, a different device, and is not shown.)',
    sources: ['meter', 'design'] },
];
export const FORM_BY_KEY = Object.fromEntries(FORMS.map((f) => [f.key, f]));
// Minimum sound closeness per form. Spans multiply the number of candidates
// (every run of adjacent words), so they need tighter criteria to stay
// meaningful: consonants must be at least family-close, or the vowel chain must
// be long enough to be specific on its own (assonance, 2+ syllables).
export const SPAN_TYPES = new Set(['perfect', 'family', 'additive', 'slant']);
// Assonance: a one-vowel match is mostly a measure of how common the vowel is;
// a chain of two or more matching vowels is rare and specific (Malmi et al.'s
// rhyme density is exactly this length). Below the minimum, assonance is
// admitted only by EXPECTATION: within this many bars of a match already in the
// family, the listener's threshold has dropped (busyness, dizziness ... silly bitch).
export const ASSONANCE_MIN_SYLLABLES = 2;
export const EXPECTATION_WINDOW_BARS = 1;
// Which matches can set up an expectation: an established rhyme (perfect or
// family), not a loosening (additive, slant) and not another expected match
// (no chaining: expectation must not feed itself). Measured on 93 Til, all
// seeds + chaining admitted 35 one-syllable assonances per anchor on average;
// this setting 17, and still finds seen / keen -> feel. Mutable for measurement.
export const EXPECTATION = { seeds: new Set(['identical', 'perfect', 'family']), chain: false };
export function spanAllowed(type, nSyl) {
  return SPAN_TYPES.has(type) || (type === 'assonance' && nSyl >= ASSONANCE_MIN_SYLLABLES);
}

export const TYPE_BY_KEY = Object.fromEntries(RHYME_TYPES.map((t) => [t.key, t]));

const VOWELS = new Set(Object.keys(VOWEL_SIM));
export const DIPHTHONGS = new Set(['AY', 'AW', 'OY', 'EY', 'OW']);
export const SLANT_VOWEL_MIN = 0.75;
// Reduced (schwa-like) vowels: interchangeable after the stress when unstressed.
// CMU marks many reduced vowels as AH0 / IH0 / EH0.
export const REDUCED = new Set(['AH', 'IH', 'EH']);
// Candidate rule changes under measurement (experiments/yardstick-01). All default OFF; the
// scorer and the impact tool flip them. Nothing in the prototypes reads them except through
// these defaults.
//   compoundRimes: a word with a primary stress before a later secondary stress (HAND-ball)
//     also gets a rime from the primary (hand-ball / man's a), beside the usual rime from the
//     last stressed vowel (green-BACKS / tracks).
//   anyUnstressedReduces: after the stressed vowel, two unstressed vowels match whatever their
//     dictionary identity (roam THE strip / bones TO pick: AH against UW), not only the reduced
//     set AH / IH / EH.
export const RULE_OPTIONS = { compoundRimes: true, anyUnstressedReduces: false };   // compoundRimes on since 2026-10-20 (Greg; yardstick +1 family, none worse)
// One-syllable function words: the dictionary gives them stress, the flow does
// not. Used when partitioning a highlighted reference into parts: a content
// monosyllable (cause, bitch) starts a part, a function word does not.
export const FUNCTION_WORDS = new Set(('a an the and or but so as of to in on at for from with by up out off is am are was be do did got get it its im i me my you your we us our he him his she her they them their this that these those there here what who how when where which why not no yes if then than just like than can could would should will shall may might must have has had been being than').split(' '));
export const isFunctionWord = (text) => FUNCTION_WORDS.has(String(text).toLowerCase().replace(/[^a-z']/g, '').replace(/'/g, ''));

// Consonants (Pattison). Family = release type: plosive, fricative, nasal.
// Within a family: PARTNER = same mouth position, opposite voicing (one per
// consonant: T~D); COMPANIONS = same family, same voicing (T~P~K).
// L, R, W, Y, HH belong to no family.
// Affricates are compound sounds and count as their parts: CH = T + SH,
// JH = D + ZH. So JH relates to plosives as D and to fricatives as ZH.
export const PLACES = ['lips', 'lip-teeth', 'teeth', 'ridge', 'palate', 'soft palate', 'throat'];
export const CONSONANTS = {
  P: { fam: 'plosive', place: 0, voiced: false }, B: { fam: 'plosive', place: 0, voiced: true },
  T: { fam: 'plosive', place: 3, voiced: false }, D: { fam: 'plosive', place: 3, voiced: true },
  K: { fam: 'plosive', place: 5, voiced: false }, G: { fam: 'plosive', place: 5, voiced: true },
  F: { fam: 'fricative', place: 1, voiced: false }, V: { fam: 'fricative', place: 1, voiced: true },
  TH: { fam: 'fricative', place: 2, voiced: false }, DH: { fam: 'fricative', place: 2, voiced: true },
  S: { fam: 'fricative', place: 3, voiced: false }, Z: { fam: 'fricative', place: 3, voiced: true },
  SH: { fam: 'fricative', place: 4, voiced: false }, ZH: { fam: 'fricative', place: 4, voiced: true },
  CH: { fam: 'affricate', place: 4, voiced: false, parts: ['T', 'SH'] },
  JH: { fam: 'affricate', place: 4, voiced: true, parts: ['D', 'ZH'] },
  M: { fam: 'nasal', place: 0, voiced: true }, N: { fam: 'nasal', place: 3, voiced: true },
  NG: { fam: 'nasal', place: 5, voiced: true },
  L: { fam: null, place: 3, voiced: true }, R: { fam: null, place: 3, voiced: true },
  W: { fam: null, place: 0, voiced: true }, Y: { fam: null, place: 4, voiced: true },
  HH: { fam: null, place: 6, voiced: false },
};
const REL_RANK = { identical: 0, partner: 1, companion: 2, family: 3 };

function directRelation(a, b) {
  if (a === b) return 'identical';
  const A = CONSONANTS[a], B = CONSONANTS[b];
  if (!A || !B || !A.fam || A.fam !== B.fam) return null;
  if (A.place === B.place && A.voiced !== B.voiced) return 'partner';
  if (A.voiced === B.voiced) return 'companion';
  return 'family';
}

// Closest relation between two consonants.
// -> { rel: 'identical'|'partner'|'companion'|'family', via: null }  (direct, Pattison)
//  | { rel: 'part', via: 'JH as D', viaRel: 'companion' }  (through an affricate's part)
//  | null
export function consonantRelation(a, b) {
  const direct = directRelation(a, b);
  if (direct) return { rel: direct, via: null };
  const views = (c) => [[c, null], ...(CONSONANTS[c]?.parts ?? []).map((p) => [p, p])];
  let best = null;
  for (const [x, vx] of views(a)) for (const [y, vy] of views(b)) {
    if (!vx && !vy) continue;
    const rel = directRelation(x, y);
    if (!rel) continue;
    if (!best || REL_RANK[rel] < REL_RANK[best.viaRel]) {
      const via = [vx && `${a} as ${vx}`, vy && `${b} as ${vy}`].filter(Boolean).join(', ');
      best = { rel: 'part', via, viaRel: rel };
    }
  }
  return best;
}
const sameFamily = (a, b) => a !== b && consonantRelation(a, b) !== null;

const strip = (t) => t.replace(/\d/g, '').toUpperCase();

// Parse ARPABET into the rhyming tail from the last stressed vowel.
// Returns { full, segs: [{ v, cons[] }], stressedSyl, lastStress }.
export function parseRime(phones = '') {
  const toks = phones.trim().split(/\s+/).filter(Boolean);
  // "-ire" / "-our" words appear both as two syllables (desire: AY1 ER0) and one
  // (admire: AY1 R). Read a final glide + R as glide + ER so they compare alike.
  if (toks.length >= 2 && toks.at(-1) === 'R' && /^(AY|AW)\d$/.test(toks.at(-2))) toks[toks.length - 1] = 'ER0';
  const vIdx = toks.map((t, i) => (VOWELS.has(strip(t)) ? i : -1)).filter((i) => i >= 0);
  if (!vIdx.length) return null;
    // last stressed vowel, primary OR secondary: compounds rhyme on their final
  // element (green-BACKS / tracks), which carries secondary stress
  const s = vIdx.filter((i) => /[12]/.test(toks[i])).at(-1) ?? vIdx.at(-1);
  const segs = [];
  for (let i = s; i < toks.length; i++) {
    const p = strip(toks[i]);
    if (VOWELS.has(p)) segs.push({ v: p, cons: [], unstressed: toks[i].includes('0') });
    else segs.at(-1).cons.push(p);
  }
  const last = toks[vIdx.at(-1)];
  return {
    // no stressed vowel at all (reduced function-word variants: "the" DH IY0)
    stressless: !vIdx.some((i) => /[12]/.test(toks[i])),
    full: toks.map(strip).join(' '),
    segs,
    stressedSyl: vIdx.indexOf(s),
    nSyl: vIdx.length,
    lastVowel: strip(last),
    lastStressed: /[12]/.test(last),
    finalCoda: toks.slice(vIdx.at(-1) + 1).map(strip).join(' '),
  };
}

// a, b: consonant arrays -> 'same' | 'add' | 'family' | 'diff'
function consRelation(a, b) {
  if (a.join() === b.join()) return 'same';
  if (Math.abs(a.length - b.length) === 1) {
    const [lng, sht] = a.length > b.length ? [a, b] : [b, a];
    for (let i = 0; i < lng.length; i++) {
      if ([...lng.slice(0, i), ...lng.slice(i + 1)].join() === sht.join()) return 'add';
    }
    return 'diff';
  }
  if (a.length === b.length && a.every((c, i) => c === b[i] || sameFamily(c, b[i]))) return 'family';
  return 'diff';
}

// Combine per-segment consonant relations into one.
function combine(rels) {
  if (rels.every((r) => r === 'same')) return 'same';
  if (rels.includes('diff')) return 'diff';
  const adds = rels.filter((r) => r === 'add').length;
  if (adds === 1 && !rels.includes('family')) return 'add';
  if (adds === 0) return 'family';
  return 'diff';
}

export function classifyRhyme(A, B) {
  if (!A || !B) return null;
  if (A.full && A.full === B.full) return 'identical';   // span rimes carry no `full`; two empty strings are not an identical rhyme
  // A stressless pronunciation ("the" DH IY0) cannot make a stressed rhyme.
  if (!A.stressless && !B.stressless && A.segs.length === B.segs.length) {
    const cons = combine(A.segs.map((s, i) => consRelation(s.cons, B.segs[i].cons)));
    // post-stress vowels match if identical, or both unstressed reduced vowels (AH/IH/EH)
    const restSame = A.segs.slice(1).every((s, i) => {
      const b = B.segs[i + 1];
      return s.v === b.v || (s.unstressed && b.unstressed && (RULE_OPTIONS.anyUnstressedReduces || (REDUCED.has(s.v) && REDUCED.has(b.v))));
    });
    const va = A.segs[0].v, vb = B.segs[0].v;
    if (va === vb && restSame) {
      if (cons === 'same') return 'perfect';
      if (cons === 'add') return 'additive';
      if (cons === 'family') return 'family';
      return 'assonance';
    }
    if (restSame && cons !== 'diff' && DIPHTHONGS.has(va) === DIPHTHONGS.has(vb) &&
        (VOWEL_SIM[va]?.[vb] ?? 0) >= SLANT_VOWEL_MIN) return 'slant';
  }
  // Consonance, light/wrenched and weak rhyme were removed after the first demo
  // (2026-10-06): rarely used by the analysts. See engine-critique-log.md C9.
  return null;
}
