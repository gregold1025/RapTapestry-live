// src/utils/extractRhymingWords.js
import { rhymeScore } from './phonemeSimilarity.js';

// ARPABET vowel nuclei (letters only, no stress digits)
const VOWEL_NUCLEI = new Set([
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

/**
 * Given an ARPABET phone string (e.g. "N AY1 N D ER0"),
 * find the part from the last vowel nucleus to the end,
 * strip out all stress digits & whitespace, lowercase it,
 * and return as a compact rhyme‐key.
 *
 * Kept for extractLines.js compatibility (rhymeIndex precomputation).
 */
export function extractRhymingKey(phonesStr = "") {
  const tokens = phonesStr.trim().split(/\s+/);
  let lastVowelIdx = -1;

  for (let i = 0; i < tokens.length; i++) {
    const letters = tokens[i].replace(/\d/g, "");
    if (VOWEL_NUCLEI.has(letters)) lastVowelIdx = i;
  }

  if (lastVowelIdx < 0) return "";

  return tokens
    .slice(lastVowelIdx)
    .map((tok) => tok.replace(/\d/g, ""))
    .join("")
    .toLowerCase();
}

/**
 * Returns ids from phonesMap whose rhyme score with phonesStr meets the threshold.
 *
 * @param {string} phonesStr  - ARPABET phones for the anchor word
 * @param {Map<string, string>} phonesMap - all word id → phones
 * @param {number} threshold  - minimum rhymeScore [0–1] to count as a match (default 0.8)
 * @param {number} [nucleusWeight] - nucleus/coda blend ratio passed to rhymeScore
 */
export function extractRhymingWords(phonesStr, phonesMap, threshold = 0.8, nucleusWeight) {
  if (!phonesStr) return [];
  const results = [];
  for (const [id, otherPhones] of phonesMap.entries()) {
    if (rhymeScore(phonesStr, otherPhones, nucleusWeight) >= threshold) {
      results.push(id);
    }
  }
  return results;
}
