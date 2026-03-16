// src/utils/phonemeSimilarity.js
//
// Phoneme similarity engine based on:
//   Vowels  — F1/F2 formant coordinates (Hillenbrand et al. 1995), converted to Bark scale
//   Consonants — distinctive feature vectors (place, manner, voicing, nasality, laterality, sibilancy)
//
// Exports:
//   VOWEL_SIM[v1][v2]         float [0–1] similarity for any two ARPABET vowel nuclei
//   CONSONANT_SIM[c1][c2]     float [0–1] similarity for any two ARPABET consonants
//   VOWEL_COORDS              normalized {F2_norm, F1_norm} coords per vowel (for diagrams)
//   decomposeSyllable(phones) → { onset[], nucleus, coda[] }
//   rhymeScore(pA, pB)        → float [0–1]  (nucleus 60% + coda 40%)
//   assonanceScore(pA, pB)    → float [0–1]  (nucleus only)
//   alliterationScore(pA, pB) → float [0–1]  (onset consonant only)
//   getThreshold(strictness, type) → float threshold for a given strictness [0–1]

// ─────────────────────────────────────────────────────────────────────────────
// VOWEL SIMILARITY  (F1/F2 → Bark → normalized Euclidean)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mean F1/F2 formant values in Hz for American English vowels.
 * Source: Hillenbrand et al. (1995), male speakers, vowel midpoint.
 * Diphthongs (AY, AW, OY) approximated by their nucleus (starting) position.
 */
const VOWEL_FORMANTS_HZ = {
  IY: [270,  2290],
  IH: [390,  1990],
  EY: [530,  1990],
  EH: [530,  1840],
  AE: [660,  1720],
  AH: [520,  1190],
  AA: [730,  1090],
  AO: [570,   840],
  OW: [450,  1030],
  UH: [440,  1020],
  UW: [300,   870],
  ER: [490,  1350],
  AY: [700,  1220],
  AW: [740,  1180],
  OY: [570,   840],
};

/** Zwicker & Terhardt (1980) Hz → Bark conversion */
function toBark(hz) {
  return 13 * Math.atan(0.00076 * hz) + 3.5 * Math.atan((hz / 7500) ** 2);
}

function buildVowelData() {
  const vowels = Object.keys(VOWEL_FORMANTS_HZ);

  // Convert to Bark
  const barkCoords = {};
  for (const v of vowels) {
    const [f1, f2] = VOWEL_FORMANTS_HZ[v];
    barkCoords[v] = [toBark(f1), toBark(f2)];
  }

  // Normalize each dimension to [0, 1]
  const f1vals = vowels.map((v) => barkCoords[v][0]);
  const f2vals = vowels.map((v) => barkCoords[v][1]);
  const f1min = Math.min(...f1vals), f1max = Math.max(...f1vals);
  const f2min = Math.min(...f2vals), f2max = Math.max(...f2vals);

  const norm = {};
  for (const v of vowels) {
    const [b1, b2] = barkCoords[v];
    norm[v] = [
      (b1 - f1min) / (f1max - f1min),  // F1_norm: 0=high vowel, 1=low vowel
      (b2 - f2min) / (f2max - f2min),  // F2_norm: 0=back vowel, 1=front vowel
    ];
  }

  // Pairwise Euclidean distances; track max for normalization
  const dist = {};
  let maxDist = 0;
  for (const v1 of vowels) {
    dist[v1] = {};
    for (const v2 of vowels) {
      const d = Math.sqrt(
        (norm[v1][0] - norm[v2][0]) ** 2 + (norm[v1][1] - norm[v2][1]) ** 2
      );
      dist[v1][v2] = d;
      if (d > maxDist) maxDist = d;
    }
  }

  // Build similarity matrix (symmetric, diagonal = 1)
  const sim = {};
  for (const v1 of vowels) {
    sim[v1] = {};
    for (const v2 of vowels) {
      sim[v1][v2] = parseFloat((1 - dist[v1][v2] / maxDist).toFixed(4));
    }
  }

  // Expose normalized coords for diagram rendering
  // Convention: F2 on x-axis (right = front/high F2), F1 on y-axis (up = high vowel = low F1)
  const coords = {};
  for (const v of vowels) {
    coords[v] = {
      x: norm[v][1],          // F2_norm → x (0=back, 1=front)
      y: 1 - norm[v][0],      // 1 - F1_norm → y (0=open/low, 1=close/high)  ← inverted so "high" vowels appear high
    };
  }

  return { sim, coords, maxDist };
}

const _vowelData = buildVowelData();

/** Pairwise vowel similarity matrix [0–1]. 1 = identical, 0 = maximally distant. */
export const VOWEL_SIM = _vowelData.sim;

/**
 * Normalized {x, y} coordinates per ARPABET vowel for diagram rendering.
 * x: 0 = back vowel (UW), 1 = front vowel (IY)
 * y: 0 = open/low (AA),   1 = close/high (IY)
 */
export const VOWEL_COORDS = _vowelData.coords;

/** The maximum F1/F2 Euclidean distance (used for diagram radius scaling). */
export const VOWEL_MAX_DIST = _vowelData.maxDist;

// ─────────────────────────────────────────────────────────────────────────────
// CONSONANT SIMILARITY  (distinctive feature Hamming distance)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Place of articulation codes:
 *   0 bilabial, 1 labiodental, 2 dental, 3 alveolar,
 *   4 post-alveolar/palatal, 5 velar, 6 glottal
 *
 * Manner of articulation codes:
 *   0 stop, 1 fricative, 2 affricate, 3 nasal, 4 liquid, 5 glide
 */
const CONSONANT_FEATURES = {
  B:  { place: 0, manner: 0, voiced: 1, nasal: 0, lateral: 0, sibilant: 0 },
  CH: { place: 4, manner: 2, voiced: 0, nasal: 0, lateral: 0, sibilant: 1 },
  D:  { place: 3, manner: 0, voiced: 1, nasal: 0, lateral: 0, sibilant: 0 },
  DH: { place: 2, manner: 1, voiced: 1, nasal: 0, lateral: 0, sibilant: 0 },
  F:  { place: 1, manner: 1, voiced: 0, nasal: 0, lateral: 0, sibilant: 0 },
  G:  { place: 5, manner: 0, voiced: 1, nasal: 0, lateral: 0, sibilant: 0 },
  HH: { place: 6, manner: 1, voiced: 0, nasal: 0, lateral: 0, sibilant: 0 },
  JH: { place: 4, manner: 2, voiced: 1, nasal: 0, lateral: 0, sibilant: 1 },
  K:  { place: 5, manner: 0, voiced: 0, nasal: 0, lateral: 0, sibilant: 0 },
  L:  { place: 3, manner: 4, voiced: 1, nasal: 0, lateral: 1, sibilant: 0 },
  M:  { place: 0, manner: 3, voiced: 1, nasal: 1, lateral: 0, sibilant: 0 },
  N:  { place: 3, manner: 3, voiced: 1, nasal: 1, lateral: 0, sibilant: 0 },
  NG: { place: 5, manner: 3, voiced: 1, nasal: 1, lateral: 0, sibilant: 0 },
  P:  { place: 0, manner: 0, voiced: 0, nasal: 0, lateral: 0, sibilant: 0 },
  R:  { place: 3, manner: 4, voiced: 1, nasal: 0, lateral: 0, sibilant: 0 },
  S:  { place: 3, manner: 1, voiced: 0, nasal: 0, lateral: 0, sibilant: 1 },
  SH: { place: 4, manner: 1, voiced: 0, nasal: 0, lateral: 0, sibilant: 1 },
  T:  { place: 3, manner: 0, voiced: 0, nasal: 0, lateral: 0, sibilant: 0 },
  TH: { place: 2, manner: 1, voiced: 0, nasal: 0, lateral: 0, sibilant: 0 },
  V:  { place: 1, manner: 1, voiced: 1, nasal: 0, lateral: 0, sibilant: 0 },
  W:  { place: 0, manner: 5, voiced: 1, nasal: 0, lateral: 0, sibilant: 0 },
  Y:  { place: 4, manner: 5, voiced: 1, nasal: 0, lateral: 0, sibilant: 0 },
  Z:  { place: 3, manner: 1, voiced: 1, nasal: 0, lateral: 0, sibilant: 1 },
  ZH: { place: 4, manner: 1, voiced: 1, nasal: 0, lateral: 0, sibilant: 1 },
};

// Number of features (place + manner treated as categorical match/mismatch + 4 binary)
const N_FEATURES = 6;

function consonantDist(c1, c2) {
  const f1 = CONSONANT_FEATURES[c1];
  const f2 = CONSONANT_FEATURES[c2];
  if (!f1 || !f2) return 1;
  let diff = 0;
  if (f1.place    !== f2.place)    diff += 1;
  if (f1.manner   !== f2.manner)   diff += 1;
  if (f1.voiced   !== f2.voiced)   diff += 1;
  if (f1.nasal    !== f2.nasal)    diff += 1;
  if (f1.lateral  !== f2.lateral)  diff += 1;
  if (f1.sibilant !== f2.sibilant) diff += 1;
  return diff / N_FEATURES;
}

function buildConsonantSim() {
  const consonants = Object.keys(CONSONANT_FEATURES);
  const sim = {};
  for (const c1 of consonants) {
    sim[c1] = {};
    for (const c2 of consonants) {
      sim[c1][c2] = parseFloat((1 - consonantDist(c1, c2)).toFixed(4));
    }
  }
  return sim;
}

/** Pairwise consonant similarity matrix [0–1]. 1 = identical, 0 = maximally dissimilar. */
export const CONSONANT_SIM = buildConsonantSim();

// ─────────────────────────────────────────────────────────────────────────────
// SYLLABLE DECOMPOSITION
// ─────────────────────────────────────────────────────────────────────────────

const VOWEL_NUCLEI = new Set(Object.keys(VOWEL_FORMANTS_HZ));

/**
 * Strip stress digits from an ARPABET token (e.g. "AY1" → "AY").
 */
function stripStress(tok) {
  return tok.replace(/\d/g, '').toUpperCase();
}

/**
 * Extract the primary (most stressed) vowel nucleus from an ARPABET phones string.
 * Reads stress digits (1=primary, 2=secondary, 0=unstressed) BEFORE stripping them,
 * so "G R IY1 S IH0 N" correctly returns "IY" rather than "IH".
 *
 * Falls back to the first vowel found when no stress markers are present.
 * Used by assonanceScore to avoid matching on unstressed reduced vowels (schwas).
 */
export function primaryVowel(phonesStr = '') {
  const tokens = phonesStr.trim().split(/\s+/).filter(Boolean);
  // Primary stress
  for (const tok of tokens) {
    if (tok.includes('1')) {
      const base = tok.replace(/\d/g, '').toUpperCase();
      if (VOWEL_NUCLEI.has(base)) return base;
    }
  }
  // Secondary stress
  for (const tok of tokens) {
    if (tok.includes('2')) {
      const base = tok.replace(/\d/g, '').toUpperCase();
      if (VOWEL_NUCLEI.has(base)) return base;
    }
  }
  // First vowel (no stress markers or all unstressed)
  for (const tok of tokens) {
    const base = tok.replace(/\d/g, '').toUpperCase();
    if (VOWEL_NUCLEI.has(base)) return base;
  }
  return null;
}

/**
 * Decompose an ARPABET phones string into onset, nucleus, and coda.
 * Uses the LAST vowel nucleus as the boundary (matching existing rhyme convention).
 *
 * decomposeSyllable("N AY1 N D") → { onset: ["N"], nucleus: "AY", coda: ["N","D"] }
 * decomposeSyllable("IY1")       → { onset: [],    nucleus: "IY", coda: [] }
 * decomposeSyllable("S T R")     → { onset: ["S","T","R"], nucleus: null, coda: [] }
 */
export function decomposeSyllable(phonesStr = '') {
  const tokens = phonesStr.trim().split(/\s+/).map(stripStress).filter(Boolean);
  let lastVowelIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (VOWEL_NUCLEI.has(tokens[i])) lastVowelIdx = i;
  }
  if (lastVowelIdx < 0) {
    return { onset: tokens, nucleus: null, coda: [] };
  }
  return {
    onset:   tokens.slice(0, lastVowelIdx),
    nucleus: tokens[lastVowelIdx],
    coda:    tokens.slice(lastVowelIdx + 1),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Similarity between two coda consonant arrays.
 *
 * Compares the full coda cluster by right-aligning (end-aligned) and averaging
 * pairwise consonant similarities. For codas of unequal length, unmatched leading
 * consonants are penalized (scored as 0). This ensures that e.g. K-T vs N-T
 * reflects both the shared T and the differing K/N, rather than collapsing to
 * just the last consonant.
 *
 * Special cases:
 *   - Both empty (open syllables like "free"/"see"): 1.0 (perfect coda match)
 *   - One empty, one closed: 0.3 (partial credit — assonance-like)
 */
function codaSim(codaA, codaB) {
  const emptyA = codaA.length === 0;
  const emptyB = codaB.length === 0;
  if (emptyA && emptyB) return 1.0;
  if (emptyA || emptyB) return 0.3;

  // Right-align: compare from the end, pad shorter side with nulls
  const maxLen = Math.max(codaA.length, codaB.length);
  let total = 0;
  for (let i = 0; i < maxLen; i++) {
    const a = codaA[codaA.length - 1 - i];  // walk backwards
    const b = codaB[codaB.length - 1 - i];
    if (a && b) {
      total += CONSONANT_SIM[a]?.[b] ?? 0;
    }
    // else: one side has no consonant at this position → 0 contribution
  }
  return total / maxLen;
}

/**
 * Default nucleus/coda weighting for end-rhyme scoring.
 *
 * The nucleus (vowel) is the perceptually dominant component of rhyme — without
 * vowel similarity there is no rhyme, only consonance. The coda contributes to
 * the "tightness" of the rhyme but is more tolerant of variation.
 *
 * This ratio is NOT prescribed by any single study. Our default of 0.75 is
 * informed by:
 *   - Hirjee & Brown (ISMIR 2009): empirical log-odds scoring from rap lyrics
 *     shows rappers tolerate much more coda variation than nucleus variation
 *   - "Rhyme, Rhythm, and Rhubarb" (UWaterloo): treats onset/nucleus/coda
 *     weights as free parameters to be tuned per corpus
 *   - Perceptual testing during development of this tool, where 60/40 allowed
 *     spurious matches (e.g. "destruct"/"most" via shared final T)
 *
 * Exposed as a user-adjustable parameter (nucleusWeight in ParamsContext) so
 * analysts can tune the blend to match their own perception or the style of
 * the artist being studied.
 */
export const DEFAULT_NUCLEUS_WEIGHT = 0.75;

/**
 * End rhyme score: weighted combination of nucleus and coda similarity.
 * Perfect rhyme = 1.0; maximally unrelated = ~0.
 *
 * @param {string} phonesA  ARPABET phones string for word A
 * @param {string} phonesB  ARPABET phones string for word B
 * @param {number} [nucleusWeight=0.75]  Proportion of score from vowel nucleus (0–1).
 *   Remainder goes to coda. Higher = vowel-dominant; lower = coda matters more.
 */
export function rhymeScore(phonesA, phonesB, nucleusWeight = DEFAULT_NUCLEUS_WEIGHT) {
  const a = decomposeSyllable(phonesA);
  const b = decomposeSyllable(phonesB);
  if (!a.nucleus || !b.nucleus) return 0;
  const nucleusSim = VOWEL_SIM[a.nucleus]?.[b.nucleus] ?? 0;
  const nw = Math.max(0, Math.min(1, nucleusWeight));
  return nw * nucleusSim + (1 - nw) * codaSim(a.coda, b.coda);
}

/**
 * Assonance score: primary stressed vowel similarity only, coda ignored.
 * Uses primaryVowel() rather than the last vowel to avoid matching on
 * unstressed reduced vowels (e.g. "heathen" [IY1] vs "enough" [AH1]
 * should not match via their shared unstressed AH0 ending).
 */
export function assonanceScore(phonesA, phonesB) {
  const vA = primaryVowel(phonesA);
  const vB = primaryVowel(phonesB);
  if (!vA || !vB) return 0;
  return VOWEL_SIM[vA]?.[vB] ?? 0;
}

/**
 * Alliteration score: leading consonant (first onset phone) similarity only.
 */
export function alliterationScore(phonesA, phonesB) {
  const a = decomposeSyllable(phonesA);
  const b = decomposeSyllable(phonesB);
  if (!a.onset.length || !b.onset.length) return 0;
  return CONSONANT_SIM[a.onset[0]]?.[b.onset[0]] ?? 0;
}

/**
 * Consonance score: coda similarity only (vowel nucleus ignored).
 * Mirrors alliteration but for the trailing edge of the syllable.
 */
export function consonanceScore(phonesA, phonesB) {
  const a = decomposeSyllable(phonesA);
  const b = decomposeSyllable(phonesB);
  return codaSim(a.coda, b.coda);
}

// ─────────────────────────────────────────────────────────────────────────────
// THRESHOLD MAPPING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Threshold configs per match type.
 * At strictness=1.0 → ceiling (near-perfect match only).
 * At strictness=0.0 → floor (loose near-match).
 */
const THRESHOLD_CONFIGS = {
  rhyme:        { floor: 0.70, ceiling: 0.97 },
  assonance:    { floor: 0.70, ceiling: 0.95 },
  alliteration: { floor: 0.70, ceiling: 0.97 }, // used only as fallback; prefer ALLITERATION_TIERS
  consonance:   { floor: 0.70, ceiling: 0.97 },
  syllable:     { floor: 0.60, ceiling: 0.95 },
};

/**
 * Map a strictness value [0–1] to a similarity threshold for a given match type.
 * Higher strictness → higher threshold → fewer matches.
 *
 * @param {number} strictness  0.0 (loose) → 1.0 (strict)
 * @param {'rhyme'|'assonance'|'alliteration'|'syllable'} type
 * @returns {number} similarity threshold [0–1]
 */
export function getThreshold(strictness, type = 'rhyme') {
  const { floor, ceiling } = THRESHOLD_CONFIGS[type] ?? THRESHOLD_CONFIGS.rhyme;
  return floor + Math.max(0, Math.min(1, strictness)) * (ceiling - floor);
}

// ─────────────────────────────────────────────────────────────────────────────
// ALLITERATION TIERS  (discrete model — replaces continuous strictness)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Discrete alliteration tiers. Each tier has a minimum alliterationScore
 * threshold, a human-readable label, a description, and example pairs.
 *
 * Design rationale: alliteration has no meaningful "very loose" gradient.
 * Consonants differing by 2+ features (e.g. T/G, K/S) are not alliterative
 * in any poetic sense. Only the following are defensible:
 *   - Exact (sim = 1.0): identical consonant
 *   - Near  (sim ≥ 5/6): one-feature difference only (voicing pairs, place pairs)
 */
export const ALLITERATION_TIERS = {
  off: {
    label: 'Off',
    description: 'No alliteration highlighting.',
    threshold: null,
    examples: [],
  },
  exact: {
    label: 'Exact',
    description:
      'Identical onset consonant. Traditional alliteration — the same sound starts each word.',
    threshold: 1.0,
    examples: ['S / S', 'P / P', 'T / T', 'K / K', 'SH / SH'],
  },
  near: {
    label: 'Near',
    description:
      'Onset consonants differing by exactly one phonological feature. ' +
      'Covers voiced/unvoiced pairs (same mouth shape, different cord vibration) ' +
      'and adjacent-place pairs (same manner, neighboring articulation point). ' +
      'Used widely in rap for sibilance chains (S/SH/Z) and labial runs (P/B/F/V).',
    // Stored as 0.8333 (4 dp) to match CONSONANT_SIM matrix precision (toFixed(4)).
    // Using 5/6 directly (≈ 0.8333333) causes floating-point mismatches at the boundary.
    threshold: 0.8333,
    examples: ['S / Z', 'P / B', 'T / D', 'K / G', 'F / V', 'S / SH', 'M / N', 'CH / JH'],
  },
};

/**
 * Return the numeric similarity threshold for a given alliteration tier,
 * or null if the tier is 'off'.
 */
export function alliterationTierThreshold(tier) {
  return ALLITERATION_TIERS[tier]?.threshold ?? null;
}

/**
 * Convenience: given a strictness value, return the distance radius
 * in normalized F1/F2 space that corresponds to the vowel match threshold.
 * Used by the diagram to draw the threshold circle.
 */
export function thresholdToVowelRadius(strictness) {
  const threshold = getThreshold(strictness, 'rhyme');
  // similarity = 1 - dist/maxDist  →  dist = (1-similarity)*maxDist
  return (1 - threshold) * VOWEL_MAX_DIST;
}
