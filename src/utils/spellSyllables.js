// Split a word's spelling into chunks that follow its phonetic syllables.
//
//   spellSyllables('cinema', ['S IH1', 'N AH0', 'M AH0'])  ->  ['ci', 'ne', 'ma']
//   spellSyllables('vibrations', ['V AY1', 'B R EY1', 'SH AH0 N Z'])  ->  ['vi', 'bra', 'tions']
//
// Method: align letters to phones by dynamic programming over a small table of which
// letter groups can spell which phones (digraphs like "th", "ph", "tion" included; silent
// letters allowed at a cost), then cut the spelling at the letter where each syllable's
// first phone begins. English spelling is irregular, so this is an approximation: it is
// right for most words and wrong for some odd spellings; the caller gets the word back in
// one chunk when the alignment cost is implausible. Punctuation and apostrophes stay
// attached to the letters they sit beside.

const VOWEL_P = new Set(['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW']);
const VOWEL_L = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

// letter group -> phone sequences it can spell (space-joined). Exact hits cost 0.
const SPELL = {
  a: ['AA', 'AE', 'AH', 'AO', 'EY', 'EH', 'ER'], e: ['EH', 'IY', 'IH', 'AH', 'ER', 'EY'], i: ['IH', 'AY', 'IY', 'AH', 'Y'], o: ['AA', 'AO', 'OW', 'AH', 'UH', 'UW', 'W'],
  u: ['AH', 'UW', 'UH', 'Y UW', 'ER', 'W', 'IH'], y: ['IY', 'IH', 'AY', 'Y'],
  ai: ['EY', 'EH', 'IH'], ay: ['EY', 'AY'], au: ['AO', 'AA', 'AH'], aw: ['AO', 'AA'], ea: ['IY', 'EH', 'EY', 'IH', 'AH'], ee: ['IY', 'IH'], ei: ['EY', 'IY', 'AY'], ey: ['EY', 'IY', 'AY'],
  eu: ['UW', 'Y UW'], ew: ['UW', 'Y UW', 'OW'], ie: ['IY', 'AY', 'IH', 'EH'], oa: ['OW', 'AO'], oe: ['OW', 'UW'], oi: ['OY'], oy: ['OY'], oo: ['UW', 'UH', 'AH', 'OW'],
  ou: ['AW', 'OW', 'UW', 'AH', 'UH', 'AO'], ow: ['AW', 'OW'], ue: ['UW', 'Y UW'], ui: ['UW', 'IH'], ye: ['AY'],
  ar: ['AA R', 'ER', 'AO R'], er: ['ER', 'EH R'], ir: ['ER', 'IH R'], ur: ['ER', 'UH R'], or: ['AO R', 'ER', 'OW R'], ear: ['IH R', 'ER', 'EH R'], our: ['AW R', 'ER', 'AO R'],
  air: ['EH R'], are: ['EH R', 'AA R'], ere: ['IH R', 'EH R'], ore: ['AO R'], ure: ['UH R', 'ER', 'Y UH R'], ire: ['AY R', 'AY ER'],
  b: ['B'], bb: ['B'], c: ['K', 'S', 'CH'], cc: ['K', 'K S'], ch: ['CH', 'K', 'SH'], ck: ['K'], d: ['D', 'T', 'JH'], dd: ['D'], dg: ['JH'], dge: ['JH'],
  f: ['F', 'V'], ff: ['F'], g: ['G', 'JH', 'ZH'], gg: ['G'], gh: ['F', 'G'], gu: ['G'], h: ['HH'], j: ['JH'], k: ['K'], kn: ['N'], l: ['L'], ll: ['L'],
  m: ['M'], mm: ['M'], mb: ['M'], n: ['N', 'NG'], nn: ['N'], ng: ['NG', 'N G', 'NG G', 'N JH'], p: ['P'], pp: ['P'], ph: ['F'], q: ['K'], qu: ['K W', 'K'],
  r: ['R', 'ER'], rr: ['R'], rh: ['R'], s: ['S', 'Z', 'SH', 'ZH'], ss: ['S', 'SH'], sc: ['S', 'S K'], sh: ['SH'], t: ['T', 'CH', 'D', 'SH'], tt: ['T'], tch: ['CH'], th: ['TH', 'DH', 'T'],
  v: ['V'], w: ['W'], wh: ['W', 'HH'], wr: ['R'], x: ['K S', 'Z', 'G Z'], z: ['Z'], zz: ['Z'],
  ti: ['SH', 'CH'], ci: ['SH'], si: ['SH', 'ZH'], tu: ['CH', 'CH UH'], du: ['JH', 'JH UH'],
  le: ['AH L', 'L'], re: ['ER'], ed: ['D', 'T', 'IH D', 'AH D'], es: ['Z', 'S', 'IH Z'], al: ['AH L'], el: ['AH L'], il: ['AH L'], ol: ['AH L'],
  ion: ['AH N'], ian: ['AH N'], ous: ['AH S'],
};
const SILENT_OK = new Set(['e', 'h', 'b', 'k', 'w', 'g', 'u', 'l', 't', 'd', 'p']);

// suffix spellings (-ed, -le, -tion...) are real but should not beat a letter-by-letter alignment on a tie
const SUFFIX = new Set(['ed', 'es', 'le', 're', 'al', 'el', 'il', 'ol', 'ion', 'ian', 'ous']);
const strip = (p) => p.replace(/\d/g, '');

// Alignment: cost to spell phones q (array) with letters g (string).
function cost(g, q) {
  const key = q.join(' ');
  const opts = SPELL[g];
  if (opts && opts.includes(key)) return SUFFIX.has(g) ? 0.4 : 0;
  if (q.length === 0) {
    if (g === 'e') return 1.2;                       // the silent e
    if (g.length === 1 && SILENT_OK.has(g)) return 2;
    return 4;
  }
  if (g.length === 1 && q.length === 1) {
    const lv = VOWEL_L.has(g), pv = VOWEL_P.has(q[0]);
    if (lv && pv) return 1.5;
    if (!lv && !pv && q[0][0] === g.toUpperCase()) return 1;
    if (!lv && !pv) return 2.5;
    return 5;
  }
  if (g.length === 2 && g[0] === g[1] && SPELL[g[0]]?.includes(key)) return 0.3;   // doubled letter
  return 6;
}

function align(letters, phones) {
  const n = letters.length, m = phones.length;
  const INF = 1e9;
  const best = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(INF));
  const back = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(null));
  best[0][0] = 0;
  for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
    if (best[i][j] >= INF) continue;
    for (let dl = 1; dl <= 4 && i + dl <= n; dl++) for (let dp = 0; dp <= 2 && j + dp <= m; dp++) {
      if (dl > 1 && dp === 0) continue;
      const g = letters.slice(i, i + dl), q = phones.slice(j, j + dp);
      const c = best[i][j] + cost(g, q);
      if (c < best[i + dl][j + dp]) { best[i + dl][j + dp] = c; back[i + dl][j + dp] = [i, j]; }
    }
    // a phone with no letter (rare: epenthetic sounds) at a high cost
    if (j < m) { const c = best[i][j] + 5; if (c < best[i][j + 1]) { best[i][j + 1] = c; back[i][j + 1] = [i, j]; } }
  }
  if (best[n][m] >= INF) return null;
  const groups = [];   // [{ li0, li1, pj0, pj1 }]
  let i = n, j = m;
  while (i > 0 || j > 0) { const [pi, pj] = back[i][j]; groups.unshift({ li0: pi, li1: i, pj0: pj, pj1: j }); i = pi; j = pj; }
  return { cost: best[n][m], groups };
}

/**
 * @param {string} word   the spelling as written (may contain apostrophes, punctuation)
 * @param {string[]} syls each syllable's phones, space-joined, stress digits allowed
 * @returns {string[]}    one chunk per syllable, concatenating back to `word`; or [word] when it cannot be split
 */
export function spellSyllables(word, syls) {
  if (syls.length < 2) return [word];
  const lower = word.toLowerCase();
  const letterPos = []; const letters = [];
  for (let k = 0; k < lower.length; k++) if (/[a-z]/.test(lower[k])) { letterPos.push(k); letters.push(lower[k]); }
  if (letters.length < syls.length) return [word];
  const phones = syls.flatMap((s) => s.trim().split(/\s+/).map(strip));
  const sylStart = []; let acc = 0;
  for (const s of syls) { sylStart.push(acc); acc += s.trim().split(/\s+/).length; }
  const a = align(letters.join(''), phones);
  if (!a || a.cost > 2.5 * phones.length + 3) return [word];
  // the letter index where each syllable's first phone starts
  const cuts = [];
  for (let k = 1; k < syls.length; k++) {
    const pj = sylStart[k];
    const g = a.groups.find((x) => x.pj0 <= pj && pj < x.pj1) ?? a.groups.find((x) => x.pj0 >= pj);
    // a cut inside a letter group that spells several phones (ng -> N G) lands between its letters
    let li = g ? (g.pj1 - g.pj0 > 1 && pj > g.pj0 ? g.li0 + Math.round(((pj - g.pj0) * (g.li1 - g.li0)) / (g.pj1 - g.pj0)) : g.li0) : null;
    if (li == null || li <= (cuts[cuts.length - 1] ?? 0)) return [word];
    cuts.push(li);
  }
  // spelling convention: a doubled consonant splits between the two letters (get-tin', lit-tle)
  for (let k = 0; k < cuts.length; k++) {
    const li = cuts[k];
    if (li + 1 < letters.length && letters[li] === letters[li + 1] && !VOWEL_L.has(letters[li]) && li + 1 > (cuts[k - 1] ?? 0)) cuts[k] = li + 1;
  }
  // map letter cuts back onto the original string (punctuation stays with the letter before it)
  const out = []; let from = 0;
  for (const li of cuts) { const at = letterPos[li]; out.push(word.slice(from, at)); from = at; }
  out.push(word.slice(from));
  return out.every((c) => /[a-z]/i.test(c)) ? out : [word];
}
