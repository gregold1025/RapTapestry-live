// src/utils/extractRhymingWords.js

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
 */
export function extractRhymingKey(phonesStr = "") {
  // split into tokens, e.g. ["N","AY1","N","D","ER0"]
  const tokens = phonesStr.trim().split(/\s+/);
  let lastVowelIdx = -1;

  // find last index whose letters (sans digits) match a vowel nucleus
  for (let i = 0; i < tokens.length; i++) {
    const letters = tokens[i].replace(/\d/g, "");
    if (VOWEL_NUCLEI.has(letters)) lastVowelIdx = i;
  }

  if (lastVowelIdx < 0) {
    // no vowel found → no rhyme key
    return "";
  }

  // take from that vowel to end, strip digits, join with no spaces, lowercase
  return tokens
    .slice(lastVowelIdx)
    .map((tok) => tok.replace(/\d/g, ""))
    .join("")
    .toLowerCase();
}

/**
 * Given:
 *  - phonesStr: the selected word’s ARPABET string
 *  - phonesMap:   a Map<id,phonesStr> for *all* words (e.g. built in your context)
 *
 * Returns an array of every id whose rhyme‐key matches the selected one.
 */
export function extractRhymingWords(phonesStr, phonesMap) {
  const key = extractRhymingKey(phonesStr);
  if (!key) return [];

  const results = [];
  for (let [id, otherPhones] of phonesMap.entries()) {
    if (extractRhymingKey(otherPhones) === key) {
      results.push(id);
    }
  }
  return results;
}
