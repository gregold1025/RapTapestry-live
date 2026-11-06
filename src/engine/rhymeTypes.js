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
  // The protocol (Greg, 2026-11-06): the identity of a match is the ROW of its final foot. The
  // names loosened / shifted are working names; the table is the one place to rename them.
  { key: 'identical', label: 'Identical', color: '#9aa3ad', on: true, example: 'crew / crew',
    desc: 'The whole query repeats, onset included: a repeated word or a homophone.', sources: ['poetics'] },
  { key: 'perfect', label: 'Perfect', color: '#ffc94d', on: true, example: 'block / glock; cooler / ruler; famous / Hey, miss',
    desc: 'Every axis the same: nucleus and coda; in a longer foot also the cluster between the vowels and a same or weak final vowel (unstressed AH / IH / EH count as one). The onset is free.',
    sources: ['pattison', 'poetics', 'design'] },
  { key: 'loosened', label: 'Loosened', color: '#ff8f4d', on: true, example: 'clock / stop; clock / blocks; hot / rocks; later / flavor; digits / frigid',
    desc: 'Same stressed vowel, the consonants loosened: within a family (plosive, fricative, nasal; voicing free), by one consonant added or dropped anywhere, both at once, or a wildcard in the cluster between the vowels. The coda is never a wildcard. The tags say which.',
    sources: ['pattison', 'hirjee', 'design'] },
  // shifted: off by default (Greg 2026-11-06)
  { key: 'shifted', label: 'Shifted vowel', color: '#ff5fa2', on: false, example: 'ever / over; Cali / Maui; later / theater',
    desc: 'The stressed vowel differs and the rest of the foot repeats: the cluster between the vowels the same or loosened (never a wildcard), the final vowel the same or weak, the coda exactly the same.',
    sources: ['design'] },
  { key: 'truncated', label: 'Truncated', color: '#7fd17f', on: false, example: 'pencil / simple; limbo / so-so',
    desc: 'Tentative (off by default). The stressed vowel and the cluster between the vowels both differ; only the final vowel (same or weak) and the coda (same, family or one consonant off) repeat. Its own last pass: it only fills places nothing else matched.',
    sources: ['design'] },
  { key: 'assonance', label: 'Assonance', color: '#4dc3ff', on: true, example: 'dizziness / silly bitch',
    desc: 'Vowels only, where no rhyme was found: a chain of three syllables or more with the same vowels (weak vowels interchangeable), at least one pair stressed on both sides; function words hold the chain but do not count toward three.',
    sources: ['pattison', 'poetics', 'malmi', 'design'] },
];

// Second axis: the FORM of the match. Not a filter: always shown, encoded as
// line style, and named together with the type ("family mosaic").
export const FORMS = [
  { key: 'word', label: 'Whole word', dash: null, example: 'midget / Bridgette; slapstick / Chapstick',
    desc: 'The rhyme sits in one word, from one of its stressed vowels to its end.', sources: ['poetics'] },
  { key: 'mosaic', label: 'Mosaic', dash: '5 3', example: 'gotta / Got a; so-so / so low',
    desc: 'The rhyming syllables are spread across two or more words, ending at the end of a word. One-syllable function words (the, a, and) count as unstressed.',
    sources: ['poetics', 'hirjee', 'design'] },
  { key: 'embedded', label: 'Embedded', dash: '1.5 3', example: 'logic / bio-logic-al',
    desc: 'The rhyming syllables sit inside a longer word and stop before its end (wage / en-gage-ments; logic / bio-logic-al): the candidate carries an unstressed tail the query lacks. Within 4 bars of the query.',
    sources: ['meter', 'design'] },
  { key: 'semirhyme', label: 'Semirhyme', dash: '0.5 2.5', example: 'logic / Spock; ending / bend',
    desc: 'The query carries an unstressed ending the candidate lacks; the stressed syllables match, the tail is left over (lo-gic / Spock). Content words within 4 bars of the query.',
    sources: ['poetics', 'design'] },
];
export const FORM_BY_KEY = Object.fromEntries(FORMS.map((f) => [f.key, f]));
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
export const RULE_OPTIONS = { compoundRimes: true, anyUnstressedReduces: false, slant: false };   // slant off 2026-11-05 (Greg: left open, default off)   // compoundRimes on since 2026-10-20 (Greg; yardstick +1 family, none worse)
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
