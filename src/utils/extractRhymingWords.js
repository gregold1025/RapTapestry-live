// src/utils/extractRhymingWords.js
import { rhymeGate } from './phonemeSimilarity.js';

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
