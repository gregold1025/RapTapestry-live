// src/utils/extractAlliterations.js
import { alliterationScore, alliterationTierThreshold } from './phonemeSimilarity.js';

// ARPAbet consonants (letters only, no stress digits)
const CONSONANTS = new Set([
  "B",
  "CH",
  "D",
  "DH",
  "DX",
  "EL",
  "EM",
  "EN",
  "F",
  "G",
  "HH",
  "JH",
  "K",
  "L",
  "M",
  "N",
  "NG",
  "P",
  "Q",
  "R",
  "S",
  "SH",
  "T",
  "TH",
  "V",
  "W",
  "WH",
  "Y",
  "Z",
  "ZH",
]);

// ARPAbet vowels (letters only, no stress digits)
const VOWELS = new Set([
  "AA",
  "AE",
  "AH",
  "AO",
  "AW",
  "AY",
  "EH",
  "ER",
  "EY",
  "IH",
  "IY",
  "OW",
  "OY",
  "UH",
  "UW",
]);

/** Strip stress digits and return the pure ARPAbet symbol in UPPERCASE */
function stripDigits(tok = "") {
  return tok.replace(/\d/g, "").toUpperCase();
}

/**
 * Return the *first* ARPAbet symbol from a phones string (letters only, no stress digits).
 * If `consonantsOnly` is true, skip initial vowels until a consonant appears.
 * If nothing valid is found, return "".
 */
export function extractFirstPhone(
  phonesStr = "",
  { consonantsOnly = false } = {}
) {
  const tokens = String(phonesStr).trim().split(/\s+/);
  for (let t of tokens) {
    const sym = stripDigits(t);
    if (!sym) continue;

    if (consonantsOnly) {
      if (CONSONANTS.has(sym)) return sym;
      continue;
    }
    if (CONSONANTS.has(sym) || VOWELS.has(sym)) return sym;
  }
  return "";
}

/**
 * Returns ids from phonesMap whose alliteration score meets the tier threshold.
 *
 * @param {string} phonesStr  - ARPABET phones for the anchor word
 * @param {Map<string, string>} phonesMap - all word id → phones
 * @param {object} options
 * @param {'off'|'exact'|'near'} [options.tier='near'] - alliteration tier
 * @param {boolean} [options.consonantsOnly=false] - kept for API compat
 */
export function extractAlliterativeWords(phonesStr, phonesMap, options = {}) {
  const { tier = 'near' } = options;
  if (tier === 'off') return [];
  const threshold = alliterationTierThreshold(tier);
  if (threshold === null) return [];
  if (!phonesStr) return [];
  const results = [];
  for (const [id, otherPhones] of phonesMap.entries()) {
    if (alliterationScore(phonesStr, otherPhones) >= threshold) {
      results.push(id);
    }
  }
  return results;
}
