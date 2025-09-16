// src/utils/extractAlliterations.js

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
      // skip initial vowels when consonantsOnly = true
      continue;
    }
    // allow vowels & consonants
    if (CONSONANTS.has(sym) || VOWELS.has(sym)) return sym;
  }
  return "";
}

/**
 * Given:
 *  - phonesStr: the selected word’s ARPAbet string
 *  - phonesMap: Map<id, phonesStr> for all words (e.g., from your context)
 *  - options: { consonantsOnly?: boolean }  // defaults to false (vowels allowed)
 *
 * Returns an array of ids whose first phone matches the selected one.
 */
export function extractAlliterativeWords(phonesStr, phonesMap, options = {}) {
  const key = extractFirstPhone(phonesStr, options);
  if (!key) return [];

  const results = [];
  for (let [id, otherPhones] of phonesMap.entries()) {
    if (extractFirstPhone(otherPhones, options) === key) {
      results.push(id);
    }
  }
  return results;
}
