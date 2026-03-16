// src/utils/extractRhymingWords.js
import { rhymeGate } from './phonemeSimilarity.js';

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
 * and return as a compact rhyme-key.
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
 * Returns ids from phonesMap that pass the independent rhyme gates
 * (nucleus >= nucleusThreshold AND coda >= codaThreshold).
 *
 * Returns an array of { id, quality } objects. Quality [0-1] represents
 * how far above the nucleus threshold the match is, for opacity mapping.
 *
 * @param {string} phonesStr  - ARPABET phones for the anchor word
 * @param {Map<string, string>} phonesMap - all word id -> phones
 * @param {number} nucleusThreshold  - minimum nucleus similarity to pass
 * @param {number} codaThreshold     - minimum coda similarity to pass
 */
export function extractRhymingWords(phonesStr, phonesMap, nucleusThreshold, codaThreshold) {
  if (!phonesStr) return [];
  const results = [];
  for (const [id, otherPhones] of phonesMap.entries()) {
    const { match, quality } = rhymeGate(phonesStr, otherPhones, nucleusThreshold, codaThreshold);
    if (match) {
      results.push({ id, quality });
    }
  }
  return results;
}
