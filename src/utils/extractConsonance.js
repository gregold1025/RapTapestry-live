// src/utils/extractConsonance.js
//
// Consonance: coda-consonant similarity matching (vowel nucleus ignored).
// "luck" / "lick" — coda K matches even though the vowel differs.

import { consonanceScore } from './phonemeSimilarity.js';

/**
 * Returns ids from phonesMap whose consonance score meets the threshold.
 *
 * @param {string} phonesStr  - ARPABET phones for the anchor word
 * @param {Map<string, string>} phonesMap - all word id → phones
 * @param {number} threshold  - minimum consonanceScore [0–1] (default 0.8)
 */
export function extractConsonantWords(phonesStr, phonesMap, threshold = 0.8) {
  if (!phonesStr) return [];
  const results = [];
  for (const [id, otherPhones] of phonesMap.entries()) {
    if (consonanceScore(phonesStr, otherPhones) >= threshold) {
      results.push(id);
    }
  }
  return results;
}
