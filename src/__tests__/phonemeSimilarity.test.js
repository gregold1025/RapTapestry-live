// src/__tests__/phonemeSimilarity.test.js
import { describe, it, expect } from 'vitest';
import {
  VOWEL_SIM,
  CONSONANT_SIM,
  VOWEL_COORDS,
  VOWEL_MAX_DIST,
  decomposeSyllable,
  rhymeScore,
  assonanceScore,
  alliterationScore,
  getThreshold,
  thresholdToVowelRadius,
} from '../utils/phonemeSimilarity.js';

// ─────────────────────────────────────────────
// VOWEL_SIM
// ─────────────────────────────────────────────

describe('VOWEL_SIM', () => {
  const VOWELS = ['IY','IH','EY','EH','AE','AH','AA','AO','OW','UH','UW','ER','AY','AW','OY'];

  it('diagonal = 1.0 (every vowel is identical to itself)', () => {
    for (const v of VOWELS) {
      expect(VOWEL_SIM[v][v]).toBe(1.0);
    }
  });

  it('is symmetric', () => {
    expect(VOWEL_SIM.IY.UW).toBeCloseTo(VOWEL_SIM.UW.IY, 4);
    expect(VOWEL_SIM.AH.AO).toBeCloseTo(VOWEL_SIM.AO.AH, 4);
    expect(VOWEL_SIM.AE.EH).toBeCloseTo(VOWEL_SIM.EH.AE, 4);
  });

  it('all values in [0, 1]', () => {
    for (const v1 of VOWELS) {
      for (const v2 of VOWELS) {
        expect(VOWEL_SIM[v1][v2]).toBeGreaterThanOrEqual(0);
        expect(VOWEL_SIM[v1][v2]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('IY and IH (both front-high) are more similar than IY and AA (back-open)', () => {
    expect(VOWEL_SIM.IY.IH).toBeGreaterThan(VOWEL_SIM.IY.AA);
  });

  it('adjacent height vowels are more similar than distant ones', () => {
    // IH (front near-high) vs EY (front mid) should be closer than IH vs AA (open back)
    expect(VOWEL_SIM.IH.EY).toBeGreaterThan(VOWEL_SIM.IH.AA);
  });

  it('AO and OY share the same formants → similarity = 1.0', () => {
    // Both approximated at (570, 840) Hz in Hillenbrand data
    expect(VOWEL_SIM.AO.OY).toBe(1.0);
  });

  it('front vowels are more similar to each other than to back vowels', () => {
    // IY (front high) vs EY (front mid) vs UW (back high)
    expect(VOWEL_SIM.IY.EY).toBeGreaterThan(VOWEL_SIM.IY.UW);
  });
});

// ─────────────────────────────────────────────
// CONSONANT_SIM
// ─────────────────────────────────────────────

describe('CONSONANT_SIM', () => {
  const CONSONANTS = ['B','D','F','G','HH','K','L','M','N','NG','P','R','S','SH','T','TH','V','W','Y','Z','ZH'];

  it('diagonal = 1.0', () => {
    for (const c of CONSONANTS) {
      expect(CONSONANT_SIM[c][c]).toBe(1.0);
    }
  });

  it('is symmetric', () => {
    expect(CONSONANT_SIM.S.Z).toBeCloseTo(CONSONANT_SIM.Z.S, 4);
    expect(CONSONANT_SIM.M.N).toBeCloseTo(CONSONANT_SIM.N.M, 4);
  });

  it('S and Z differ only in voicing → similarity = 5/6 ≈ 0.8333', () => {
    expect(CONSONANT_SIM.S.Z).toBeCloseTo(5 / 6, 3);
  });

  it('P and B differ only in voicing → similarity = 5/6', () => {
    expect(CONSONANT_SIM.P.B).toBeCloseTo(5 / 6, 3);
  });

  it('T and D differ only in voicing → similarity = 5/6', () => {
    expect(CONSONANT_SIM.T.D).toBeCloseTo(5 / 6, 3);
  });

  it('M and N differ only in place → similarity = 5/6', () => {
    expect(CONSONANT_SIM.M.N).toBeCloseTo(5 / 6, 3);
  });

  it('T and S differ in manner and sibilancy → similarity = 4/6 ≈ 0.6667', () => {
    // T: stop, non-sibilant; S: fricative, sibilant — two features differ
    expect(CONSONANT_SIM.T.S).toBeCloseTo(4 / 6, 3);
  });

  it('S and SH differ only in place → similarity = 5/6', () => {
    expect(CONSONANT_SIM.S.SH).toBeCloseTo(5 / 6, 3);
  });

  it('voiced/unvoiced pairs score higher than cross-manner pairs', () => {
    // S/Z (voicing only) vs T/S (manner + sibilancy)
    expect(CONSONANT_SIM.S.Z).toBeGreaterThan(CONSONANT_SIM.T.S);
  });

  it('CH and JH differ only in voicing → similarity = 5/6', () => {
    expect(CONSONANT_SIM.CH.JH).toBeCloseTo(5 / 6, 3);
  });

  it('TH and DH differ only in voicing → similarity = 5/6', () => {
    expect(CONSONANT_SIM.TH.DH).toBeCloseTo(5 / 6, 3);
  });
});

// ─────────────────────────────────────────────
// VOWEL_COORDS
// ─────────────────────────────────────────────

describe('VOWEL_COORDS', () => {
  it('all coordinates are in [0, 1]', () => {
    for (const [, { x, y }] of Object.entries(VOWEL_COORDS)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
  });

  it('IY (front, high) has higher x than UW (back, high)', () => {
    expect(VOWEL_COORDS.IY.x).toBeGreaterThan(VOWEL_COORDS.UW.x);
  });

  it('IY (high) has higher y than AA (low/open)', () => {
    expect(VOWEL_COORDS.IY.y).toBeGreaterThan(VOWEL_COORDS.AA.y);
  });

  it('VOWEL_MAX_DIST is positive', () => {
    expect(VOWEL_MAX_DIST).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// decomposeSyllable
// ─────────────────────────────────────────────

describe('decomposeSyllable', () => {
  it('splits onset, nucleus, coda correctly for "N AY1 N D" (nine/find)', () => {
    const r = decomposeSyllable('N AY1 N D');
    expect(r.onset).toEqual(['N']);
    expect(r.nucleus).toBe('AY');
    expect(r.coda).toEqual(['N', 'D']);
  });

  it('handles vowel-only syllable "IY1"', () => {
    const r = decomposeSyllable('IY1');
    expect(r.onset).toEqual([]);
    expect(r.nucleus).toBe('IY');
    expect(r.coda).toEqual([]);
  });

  it('handles consonant cluster onset "S T R IH0 NG" (string)', () => {
    const r = decomposeSyllable('S T R IH0 NG');
    expect(r.onset).toEqual(['S', 'T', 'R']);
    expect(r.nucleus).toBe('IH');
    expect(r.coda).toEqual(['NG']);
  });

  it('returns null nucleus for consonant-only string', () => {
    const r = decomposeSyllable('S T R');
    expect(r.nucleus).toBeNull();
    expect(r.onset).toEqual(['S', 'T', 'R']);
    expect(r.coda).toEqual([]);
  });

  it('returns null nucleus for empty string', () => {
    expect(decomposeSyllable('').nucleus).toBeNull();
  });

  it('uses LAST vowel as nucleus for multi-syllable strings', () => {
    // "niner" = N AY1 N D ER0 — last vowel is ER
    const r = decomposeSyllable('N AY1 N D ER0');
    expect(r.nucleus).toBe('ER');
    expect(r.coda).toEqual([]);
  });

  it('strips stress digits from all tokens', () => {
    const r = decomposeSyllable('S AY1 D');
    expect(r.onset).toEqual(['S']);
    expect(r.nucleus).toBe('AY');
    expect(r.coda).toEqual(['D']);
  });
});

// ─────────────────────────────────────────────
// rhymeScore
// ─────────────────────────────────────────────

describe('rhymeScore', () => {
  it('identical phones score 1.0', () => {
    expect(rhymeScore('AY1 N', 'AY1 N')).toBeCloseTo(1.0, 4);
    expect(rhymeScore('IY1', 'IY1')).toBeCloseTo(1.0, 4);
  });

  it('perfect rhyme: same nucleus, same coda consonant (mine / nine)', () => {
    expect(rhymeScore('M AY1 N', 'N AY1 N')).toBeCloseTo(1.0, 4);
  });

  it('open syllables with same nucleus score 1.0 (free / see)', () => {
    expect(rhymeScore('F R IY1', 'S IY1')).toBeCloseTo(1.0, 4);
  });

  it('slant rhyme: same nucleus, similar coda (mine / time)', () => {
    // AY N vs AY M — N and M differ only in place → CONSONANT_SIM[N][M] = 5/6
    const score = rhymeScore('M AY1 N', 'T AY1 M');
    expect(score).toBeGreaterThan(0.8);
    expect(score).toBeLessThan(1.0);
  });

  it('same nucleus, similar coda consonants (lake / late)', () => {
    // EY K vs EY T — K and T differ only in place → CONSONANT_SIM[K][T] = 5/6
    const score = rhymeScore('L EY1 K', 'L EY1 T');
    expect(score).toBeGreaterThan(0.8);
  });

  it('returns 0 when phonemes have no vowel', () => {
    expect(rhymeScore('S T R', 'B L')).toBe(0);
  });

  it('very different nuclei score low', () => {
    // IY (front high) vs AA (back open) — very different formants
    const score = rhymeScore('T IY1', 'T AA1');
    expect(score).toBeLessThan(0.6);
  });

  it('open vs closed syllable gets partial coda credit (0.3)', () => {
    // "free" (IY, no coda) vs "feet" (IY, T coda) → nucleus=1.0, codaSim=0.3
    const score = rhymeScore('F R IY1', 'F IY1 T');
    expect(score).toBeCloseTo(0.75 * 1.0 + 0.25 * 0.3, 3);
  });
});

// ─────────────────────────────────────────────
// assonanceScore
// ─────────────────────────────────────────────

describe('assonanceScore', () => {
  it('same nucleus regardless of coda scores 1.0', () => {
    // "nine" (AY N) vs "time" (AY M) — coda differs but vowel is same
    expect(assonanceScore('N AY1 N', 'T AY1 M')).toBe(1.0);
  });

  it('same vowel, totally different words', () => {
    expect(assonanceScore('AY1 S', 'T AY1 M')).toBe(1.0);
  });

  it('similar adjacent-height vowels score higher than dissimilar ones', () => {
    // IH (front near-high) and IY (front high) are adjacent — closer than IH and AA (back open)
    expect(assonanceScore('S IH1 T', 'S IY1 T')).toBeGreaterThan(
      assonanceScore('S IH1 T', 'S AA1')
    );
    // IH/IY actual similarity ≈ 0.75; verify it's above 0.7
    expect(assonanceScore('S IH1 T', 'S IY1 T')).toBeGreaterThan(0.7);
  });

  it('dissimilar vowels score low', () => {
    expect(assonanceScore('S IY1', 'S AA1')).toBeLessThan(0.5);
  });

  it('returns 0 when either word has no vowel', () => {
    expect(assonanceScore('S T R', 'IY1')).toBe(0);
  });
});

// ─────────────────────────────────────────────
// alliterationScore
// ─────────────────────────────────────────────

describe('alliterationScore', () => {
  it('identical onset consonants score 1.0', () => {
    expect(alliterationScore('S AY1 D', 'S EH1 N D')).toBe(1.0);
  });

  it('S and SH are similar onsets (differ only in place)', () => {
    const score = alliterationScore('S AY1 D', 'SH AY1 N');
    expect(score).toBeCloseTo(5 / 6, 3);
  });

  it('P and B are similar onsets (differ only in voicing)', () => {
    const score = alliterationScore('P AY1 P', 'B AY1 K');
    expect(score).toBeCloseTo(5 / 6, 3);
  });

  it('vowel-initial words have no onset → score 0', () => {
    expect(alliterationScore('AY1 S', 'AE1 P AH0 L')).toBe(0);
  });

  it('uses first onset consonant for comparison', () => {
    // "street" (S T R IY T) vs "spin" (S P IH N) — both start with S
    expect(alliterationScore('S T R IY1 T', 'S P IH1 N')).toBe(1.0);
  });
});

// ─────────────────────────────────────────────
// getThreshold
// ─────────────────────────────────────────────

describe('getThreshold', () => {
  it('strictness=0 returns floor for rhyme (0.70)', () => {
    expect(getThreshold(0, 'rhyme')).toBeCloseTo(0.70, 4);
  });

  it('strictness=1 returns ceiling for rhyme (0.97)', () => {
    expect(getThreshold(1, 'rhyme')).toBeCloseTo(0.97, 4);
  });

  it('strictness=0.5 is the midpoint', () => {
    // 0.70 + 0.5*(0.97-0.70) = 0.835
    expect(getThreshold(0.5, 'rhyme')).toBeCloseTo(0.835, 3);
  });

  it('clamps values below 0 to floor', () => {
    expect(getThreshold(-1, 'rhyme')).toBeCloseTo(0.70, 4);
  });

  it('clamps values above 1 to ceiling', () => {
    expect(getThreshold(2, 'rhyme')).toBeCloseTo(0.97, 4);
  });

  it('defaults to rhyme type when no type given', () => {
    expect(getThreshold(0.5)).toBe(getThreshold(0.5, 'rhyme'));
  });

  it('assonance and rhyme share the same floor (0.70)', () => {
    expect(getThreshold(0, 'assonance')).toBeCloseTo(0.70, 4);
  });

  it('alliteration floor is 0.70', () => {
    expect(getThreshold(0, 'alliteration')).toBeCloseTo(0.70, 4);
  });

  it('syllable floor is 0.60', () => {
    expect(getThreshold(0, 'syllable')).toBeCloseTo(0.60, 4);
  });
});

// ─────────────────────────────────────────────
// thresholdToVowelRadius
// ─────────────────────────────────────────────

describe('thresholdToVowelRadius', () => {
  it('lower strictness → larger radius (looser threshold = wider circle)', () => {
    expect(thresholdToVowelRadius(0.1)).toBeGreaterThan(thresholdToVowelRadius(0.9));
  });

  it('radius is positive even at strictness=1', () => {
    expect(thresholdToVowelRadius(1)).toBeGreaterThan(0);
  });

  it('radius at strictness=0 is less than VOWEL_MAX_DIST', () => {
    expect(thresholdToVowelRadius(0)).toBeLessThan(VOWEL_MAX_DIST);
  });
});
